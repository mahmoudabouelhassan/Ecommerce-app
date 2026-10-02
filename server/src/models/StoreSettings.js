import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: "store" },
  storeName: { type: String, default: "MyStore", trim: true },
  supportEmail: { type: String, default: "support@mystore.com", trim: true },
  lowStockThreshold: { type: Number, default: 5, min: 1, max: 100 },
  badgesInitialized: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("StoreSettings", storeSettingsSchema);
