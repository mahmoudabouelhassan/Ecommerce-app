import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !process.env.MONGODB_URI) {
  console.error("Usage: npm run admin:promote -- user@example.com (requires MONGODB_URI)");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate({ email }, { $set: { role: "admin" } }, { new: true });
  if (!user) {
    console.error("No registered user found for this email.");
    process.exitCode = 1;
  } else {
    console.log(`Admin access granted to ${user.email}.`);
  }
} catch (error) {
  console.error("Could not grant admin access:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
