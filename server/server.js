import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import productsRouter from "./src/routes/products.js";
import authRouter from "./src/routes/auth.js";
import ordersRouter from "./src/routes/orders.js";
import userRouter from "./src/routes/user.js";
import cookieParser from "cookie-parser";
import { stripeWebhookHandler } from "./src/controllers/orderController.js";
dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL, //"http://localhost:5173"
    credentials: true,
  }),
);

// Reuse the connection across requests in the same serverless instance.
// Concurrent requests share the same connection attempt, and failures can be retried.
let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log("MongoDB Connected ..."))
      .finally(() => {
        connectionPromise = null;
      });
  }

  await connectionPromise;
};

// Connect before any route, including the Stripe webhook, accesses MongoDB.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

//  جديد ومهم جداً: الـ webhook route لازم يتسجل هنا، قبل app.use(express.json())
// السبب: Stripe بيتحقق من توقيع الطلب باستخدام الـ raw body (البيانات الخام
// قبل أي تحويل)، لكن express.json() بيحول أي body وارد لـ JaScript object
// تلقائياً. لو سبقنا الـ webhook بـ express.json()، هيتحول الـ body قبل ما
// يوصل للـ handler بتاعنا، وبكده التحقق من التوقيع هيفشل دايماً.
// express.raw() هنا بيقول لـ Express: "الـ route ده بس، سيب البيانات زي ما هي خام"
app.post(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.json({ message: "API is runnig" });
});

//  تعديل: app.listen بيشتغل بس وقت التطوير المحلي (مش على Vercel)
// على Vercel، الملف بيتصدّر كـ handler والمنصة هي اللي بتستدعيه مباشرة
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

//  جديد: بنصدّر الـ app عشان @vercel/node يقدر يستخدمه كـ serverless function
export default app;
