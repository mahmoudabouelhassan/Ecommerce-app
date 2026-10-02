import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../src/models/Order.js";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";
import {
  createCashOnDeliveryOrder,
  cancelCashOnDeliveryOrder,
  confirmCashCollection,
  stripeWebhookHandler,
} from "../src/controllers/orderController.js";
import { requireAdmin } from "../src/middleware/admin.js";

const productId = new mongoose.Types.ObjectId();
const orderId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

test("a discounted cash order charges its final price, reserves stock and remains unpaid", async (t) => {
  const updates = [];
  t.mock.method(Product, "find", () => ({ lean: async () => [{ _id: productId, title: "Camera", image: "https://example.com/camera.jpg", originalPrice: 29.99, price: 24.99, discountMode: "price", stock: 3 }] }));
  t.mock.method(Product, "updateOne", async (...args) => { updates.push(args); return { modifiedCount: 1 }; });
  t.mock.method(Order, "create", async (documents) => [{ _id: orderId, ...documents[0] }]);
  t.mock.method(User, "findByIdAndUpdate", async () => ({ _id: userId }));
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({ id: "transaction" }));

  const res = response();
  await createCashOnDeliveryOrder({
    user: { id: userId.toString() },
    body: {
      items: [{ id: productId.toString(), quantity: 2, price: 24.99 }],
      shippingInfo: { name: "Test User", phone: "0123456789", email: "user@example.com", address: "123 Main Street", city: "Cairo" },
    },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.data.orderId, orderId);
  assert.equal(updates.length, 1);
  assert.equal(Product.find.mock.calls[0].arguments[0].archivedAt, null);
  assert.equal(updates[0][0].archivedAt, null);
  assert.deepEqual(updates[0][1], { $inc: { stock: -2 } });
  assert.equal(Order.create.mock.calls[0].arguments[0][0].paymentStatus, "unpaid");
  assert.equal(Order.create.mock.calls[0].arguments[0][0].paymentMethod, "cash_on_delivery");
  assert.equal(Order.create.mock.calls[0].arguments[0][0].totalPrice, 49.98);
  assert.equal(Order.create.mock.calls[0].arguments[0][0].items[0].price, 24.99);
});

test("an out-of-stock cash order is rejected before it can be created", async (t) => {
  t.mock.method(Product, "find", () => ({ lean: async () => [{ _id: productId, title: "Camera", image: "https://example.com/camera.jpg", price: 24.99, stock: 2 }] }));
  t.mock.method(Product, "updateOne", async () => ({ modifiedCount: 0 }));
  const create = t.mock.method(Order, "create", async () => [{ _id: orderId }]);
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({ id: "transaction" }));
  const res = response();
  await createCashOnDeliveryOrder({
    user: { id: userId.toString() },
    body: {
      items: [{ id: productId.toString(), quantity: 2, price: 24.99 }],
      shippingInfo: { name: "Test User", phone: "0123456789", email: "user@example.com", address: "123 Main Street", city: "Cairo" },
    },
  }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(create.mock.callCount(), 0);
});

test("a changed product price cannot silently change the cash amount", async (t) => {
  t.mock.method(Product, "find", () => ({ lean: async () => [{ _id: productId, title: "Camera", image: "https://example.com/camera.jpg", price: 29.99, stock: 3 }] }));
  const create = t.mock.method(Order, "create", async () => [{ _id: orderId }]);
  const res = response();
  await createCashOnDeliveryOrder({
    user: { id: userId.toString() },
    body: {
      items: [{ id: productId.toString(), quantity: 1, price: 24.99 }],
      shippingInfo: { name: "Test User", phone: "0123456789", email: "user@example.com", address: "123 Main Street", city: "Cairo" },
    },
  }, res);
  assert.equal(res.statusCode, 409);
  assert.match(res.data.message, /price.*changed/i);
  assert.equal(create.mock.callCount(), 0);
});

test("cancelling a pending cash order returns its stock", async (t) => {
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({ id: "transaction" }));
  t.mock.method(Order, "findOneAndUpdate", async () => ({ _id: orderId, items: [{ productId, quantity: 2 }] }));
  const restock = t.mock.method(Product, "updateOne", async () => ({ modifiedCount: 1 }));
  const res = response();
  await cancelCashOnDeliveryOrder({ user: { id: userId.toString() }, params: { id: orderId.toString() } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(restock.mock.calls[0].arguments[1], { $inc: { stock: 2 } });
  assert.equal(Order.findOneAndUpdate.mock.calls[0].arguments[0].status, "pending");
});

test("collection is restricted to an existing admin", async (t) => {
  t.mock.method(User, "findById", () => ({ select: async () => ({ role: "customer" }) }));
  const denied = response();
  let passed = false;
  await requireAdmin({ user: { id: userId.toString() } }, denied, () => { passed = true; });
  assert.equal(denied.statusCode, 403);
  assert.equal(passed, false);
});

test("cash collection marks one eligible order paid and delivered", async (t) => {
  const updated = t.mock.method(Order, "findOneAndUpdate", async () => ({ _id: orderId, paymentStatus: "paid", status: "delivered" }));
  const res = response();
  await confirmCashCollection({ user: { id: userId.toString() }, params: { id: orderId.toString() } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(updated.mock.calls[0].arguments[0].paymentStatus, "unpaid");
  assert.deepEqual(updated.mock.calls[0].arguments[1].$set.paymentStatus, "paid");
  assert.deepEqual(updated.mock.calls[0].arguments[1].$set.status, "delivered");
  assert.equal(updated.mock.calls[0].arguments[1].$set.collectedBy, userId.toString());
});

test("a paid card session with no stock is flagged as paid for admin review", async (t) => {
  const previousKey = process.env.STRIPE_SECRET_KEY;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_for_controller";
  t.after(() => {
    if (previousKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousKey;
    if (previousSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
  });
  const event = {
    id: "evt_test_stock",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_stock", payment_status: "paid", metadata: { orderId: orderId.toString() } } },
  };
  const payload = JSON.stringify(event);
  const signature = new Stripe(process.env.STRIPE_SECRET_KEY).webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({ id: "transaction" }));
  t.mock.method(Order, "findById", () => ({ session: async () => ({
    _id: orderId,
    paymentMethod: "card",
    stripeSessionId: "cs_test_stock",
    paymentStatus: "unpaid",
    items: [{ productId, quantity: 1, title: "Camera" }],
  }) }));
  t.mock.method(Product, "updateOne", async () => ({ modifiedCount: 0 }));
  const flagged = t.mock.method(Order, "findOneAndUpdate", async () => ({ _id: orderId, status: "stock_issue" }));
  const res = response();
  await stripeWebhookHandler({ body: Buffer.from(payload), headers: { "stripe-signature": signature } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.data, { received: true });
  assert.equal(flagged.mock.calls[0].arguments[1].$set.paymentStatus, "paid");
  assert.equal(flagged.mock.calls[0].arguments[1].$set.status, "stock_issue");
});
