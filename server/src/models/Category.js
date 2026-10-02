import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  key: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
