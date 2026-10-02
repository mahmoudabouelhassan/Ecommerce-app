import { Router } from "express";
import {
  createCheckoutSession,
  createCashOnDeliveryOrder,
  getOrders,
  cancelCashOnDeliveryOrder,
  getCashOnDeliveryOrders,
  getStockIssues,
  confirmCashCollection,
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
const router = Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/cash-on-delivery", protect, createCashOnDeliveryOrder);
router.get("/admin/cash-on-delivery", protect, requireAdmin, getCashOnDeliveryOrders);
router.get("/admin/stock-issues", protect, requireAdmin, getStockIssues);
router.patch("/admin/cash-on-delivery/:id/collect", protect, requireAdmin, confirmCashCollection);
router.patch("/:id/cancel", protect, cancelCashOnDeliveryOrder);

router.get("/", protect, getOrders);

export default router;
