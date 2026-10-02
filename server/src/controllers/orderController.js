import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);
const orderError = (status, message) => Object.assign(new Error(message), { status });

const prepareOrder = async ({ items, shippingInfo } = {}) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw orderError(400, "Add products to your cart before checkout");
  }

  const fields = ["name", "phone", "email", "address", "city"];
  if (!shippingInfo || fields.some((key) => typeof shippingInfo[key] !== "string" || !shippingInfo[key].trim() || shippingInfo[key].length > 200)) {
    throw orderError(400, "Complete your shipping information");
  }
  const shipping = Object.fromEntries(fields.map((key) => [key, shippingInfo[key].trim()]));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
    throw orderError(400, "Enter a valid email address");
  }

  const quantities = new Map();
  const quotedPrices = new Map();
  for (const item of items) {
    if (!mongoose.isValidObjectId(item?.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0) {
      throw orderError(400, "Your cart contains an invalid item");
    }
    const id = item.id.toString();
    const quotedCents = Math.round(item.price * 100);
    if (quotedPrices.has(id) && quotedPrices.get(id) !== quotedCents) {
      throw orderError(400, "Your cart contains inconsistent prices");
    }
    quotedPrices.set(id, quotedCents);
    const totalQuantity = (quantities.get(id) || 0) + item.quantity;
    if (!Number.isSafeInteger(totalQuantity)) throw orderError(400, "Your cart contains an invalid quantity");
    quantities.set(id, totalQuantity);
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] }, archivedAt: null }).lean();
  if (products.length !== quantities.size) {
    throw orderError(404, "A product in your cart is no longer available");
  }

  const orderItems = products.map((product) => {
    const quantity = quantities.get(product._id.toString());
    if (product.stock < quantity) {
      throw orderError(409, `Only ${product.stock} left for ${product.title}`);
    }
    if (!Number.isFinite(product.price) || product.price < 0) {
      throw orderError(400, `Invalid price for ${product.title}`);
    }
    if (!Number.isSafeInteger(Math.round(product.price * 100))) {
      throw orderError(400, `Invalid checkout price for ${product.title}`);
    }
    if (Math.round(product.price * 100) !== quotedPrices.get(product._id.toString())) {
      throw orderError(409, `The price of ${product.title} changed. Remove and re-add it to your cart before checkout.`);
    }
    return {
      productId: product._id,
      title: product.title,
      price: product.price,
      quantity,
      image: product.image,
    };
  });

  const totalPrice = Number(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  if (!Number.isFinite(totalPrice)) throw orderError(400, "Invalid order total");

  return {
    items: orderItems,
    shippingInfo: shipping,
    totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice,
  };
};

const sendOrderError = (res, error, operation) => {
  if (!error.status) console.error(operation, error);
  return res.status(error.status || 500).json({
    message: error.status ? error.message : "Server error",
  });
};

const createCheckoutSession = async (req, res) => {
  try {
    const details = await prepareOrder(req.body);
    if (details.totalPrice < 0.5) throw orderError(400, "Card checkout requires a total of at least $0.50");
    const order = await Order.create({
      ...details,
      user: req.user.id,
      paymentMethod: "card",
      paymentStatus: "unpaid",
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: details.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/order-cancel`,
      customer_email: details.shippingInfo.email,
      metadata: { orderId: order._id.toString() },
    });

    order.stripeSessionId = session.id;
    await order.save();
    res.status(201).json({ url: session.url });
  } catch (error) {
    sendOrderError(res, error, "createCheckoutSession");
  }
};

const createCashOnDeliveryOrder = async (req, res) => {
  try {
    const details = await prepareOrder(req.body);
    let order;

    await mongoose.connection.transaction(async (session) => {
      for (const item of details.items) {
        const result = await Product.updateOne(
          { _id: item.productId, archivedAt: null, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        );
        if (result.modifiedCount !== 1) {
          throw orderError(409, `${item.title} is no longer in stock`);
        }
      }

      [order] = await Order.create([{
        ...details,
        user: req.user.id,
        paymentMethod: "cash_on_delivery",
        paymentStatus: "unpaid",
      }], { session });
      const user = await User.findByIdAndUpdate(req.user.id, { cartItems: [] }, { session });
      if (!user) throw orderError(401, "Please sign in again");
    });

    res.status(201).json({ orderId: order._id, message: "Order placed. Pay on delivery." });
  } catch (error) {
    sendOrderError(res, error, "createCashOnDeliveryOrder");
  }
};

const stripeWebhookHandler = async (req, res) => {
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).send("Invalid webhook signature");
  }

  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const orderId = event.data.object.metadata?.orderId;
    try {
      if (!mongoose.isValidObjectId(orderId)) throw orderError(400, "Invalid order ID in webhook");
      await mongoose.connection.transaction(async (session) => {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw orderError(404, "Webhook order not found");
        if (order.paymentMethod !== "card" || order.stripeSessionId !== event.data.object.id) {
          throw orderError(400, "Webhook session does not match order");
        }
        if (order.paymentStatus === "paid") return;

        for (const item of order.items) {
          const result = await Product.updateOne(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session },
          );
          if (result.modifiedCount !== 1) throw orderError(409, `Insufficient stock for ${item.title}`);
        }
        order.paymentStatus = "paid";
        order.paidAt = new Date();
        await order.save({ session });
        await User.findByIdAndUpdate(order.user, { cartItems: [] }, { session });
      });
    } catch (error) {
      if (error.status === 409) {
        try {
          const flagged = await Order.findOneAndUpdate(
            { _id: orderId, stripeSessionId: event.data.object.id, paymentMethod: "card", paymentStatus: "unpaid" },
            { $set: { paymentStatus: "paid", status: "stock_issue", paidAt: new Date() } },
            { new: true },
          );
          if (flagged) {
            console.error("Paid card order needs stock review:", orderId, error.message);
            return res.json({ received: true });
          }
        } catch (flagError) {
          console.error("Could not flag stock issue:", flagError);
        }
      }
      console.error("Error processing webhook order update:", error);
      return res.status(500).json({ message: "Webhook processing failed" });
    }
  }

  res.json({ received: true });
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    sendOrderError(res, error, "getOrders");
  }
};

const cancelCashOnDeliveryOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw orderError(400, "Invalid order ID");
    let order;
    await mongoose.connection.transaction(async (session) => {
      order = await Order.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id, paymentMethod: "cash_on_delivery", paymentStatus: "unpaid", status: "pending" },
        { $set: { status: "cancelled" } },
        { new: true, session },
      );
      if (!order) throw orderError(409, "This order can no longer be cancelled");
      for (const item of order.items) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session });
      }
    });
    res.json({ order });
  } catch (error) {
    sendOrderError(res, error, "cancelCashOnDeliveryOrder");
  }
};

const getCashOnDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ paymentMethod: "cash_on_delivery" })
      .sort({ createdAt: -1 })
      .populate("user", "name email");
    res.json(orders);
  } catch (error) {
    sendOrderError(res, error, "getCashOnDeliveryOrders");
  }
};

const getStockIssues = async (req, res) => {
  try {
    const orders = await Order.find({ status: "stock_issue" })
      .sort({ createdAt: -1 })
      .populate("user", "name email");
    res.json(orders);
  } catch (error) {
    sendOrderError(res, error, "getStockIssues");
  }
};

const confirmCashCollection = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw orderError(400, "Invalid order ID");
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, paymentMethod: "cash_on_delivery", paymentStatus: "unpaid", status: { $ne: "cancelled" } },
      { $set: { paymentStatus: "paid", status: "delivered", paidAt: new Date(), collectedBy: req.user.id } },
      { new: true },
    );
    if (!order) throw orderError(409, "Order already collected or unavailable");
    res.json({ order });
  } catch (error) {
    sendOrderError(res, error, "confirmCashCollection");
  }
};

export {
  createCheckoutSession,
  createCashOnDeliveryOrder,
  stripeWebhookHandler,
  getOrders,
  cancelCashOnDeliveryOrder,
  getCashOnDeliveryOrders,
  getStockIssues,
  confirmCashCollection,
};
