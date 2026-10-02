import mongoose from "mongoose";

const stockAdjustmentSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  change: { type: Number, required: true },
  before: { type: Number, required: true },
  after: { type: Number, required: true },
  reason: { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.model("StockAdjustment", stockAdjustmentSchema);
