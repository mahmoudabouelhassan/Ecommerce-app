import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: { type: Number, default: null, min: 0.01 },
    discountMode: { type: String, enum: ["none", "price", "percentage"], default: "none" },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    images: [{ type: String }],
    description: {
      type: String,
    },
    badge: { type: String, default: "" },
    badgeColor: { type: String, default: "" },
    rating: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    // Archiving hides a product without breaking existing orders or stock returns.
    archivedAt: { type: Date, default: null },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    catalogKey: { type: String, unique: true, sparse: true, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

export default mongoose.model("Product", productSchema);
