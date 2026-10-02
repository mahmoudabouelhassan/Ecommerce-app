import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
  key: { type: String, required: true, unique: true },
  color: {
    type: String,
    required: true,
    validate: (value) => ["blue", "red", "amber", "green", "purple", "slate"].includes(value) || /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value),
  },
}, { timestamps: true });

export default mongoose.model("Badge", badgeSchema);
