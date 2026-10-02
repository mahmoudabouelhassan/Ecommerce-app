import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        title: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
    },
    shippingInfo: {
      name: String,
      phone: String,
      email: String,
      address: String,
      city: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "stock_issue"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cash_on_delivery"],
      default: "card",
      required: true,
    },
    // Card payments are settled by the Stripe webhook; COD is settled by an admin.
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },
    stripeSessionId: {
      type: String,
    },
    paidAt: Date,
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Order", orderSchema);
