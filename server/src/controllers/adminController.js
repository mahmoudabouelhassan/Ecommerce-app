import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import StoreSettings from "../models/StoreSettings.js";
import StockAdjustment from "../models/StockAdjustment.js";
import { escapeRegex } from "../utils/categories.js";
import { ensureCategory, resolveBadge } from "../utils/catalogTaxonomy.js";
import { calculateProductPricing } from "../utils/productPricing.js";

export const makeCatalogKey = (title, category) => JSON.stringify([category.trim().toLowerCase(), title.trim().toLowerCase()]);
export const duplicateFilter = (title, category) => ({
  title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
  category: { $regex: `^${escapeRegex(category)}$`, $options: "i" },
});
const findDuplicateProduct = (title, category, exceptId) => Product.findOne({
  ...duplicateFilter(title, category),
  ...(exceptId ? { _id: { $ne: exceptId } } : {}),
}).select("_id archivedAt").lean();
const validUrl = (value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
};

export const parseProductInput = (body, creating = false) => {
  body = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const fields = {};
  const errors = [];
  const allowed = ["title", "price", "category", "image", "images", "description", "rating", "badge"];
  for (const key of allowed) {
    if (body[key] !== undefined) fields[key] = body[key];
    else if (creating && ["title", "price", "category"].includes(key)) errors.push(`${key} is required`);
  }
  for (const key of ["title", "category", "image", "description", "badge"]) {
    if (fields[key] !== undefined) {
      if (typeof fields[key] !== "string") errors.push(`${key} must be text`);
      else fields[key] = fields[key].trim();
    }
  }
  if (fields.title !== undefined && (fields.title.length < 2 || fields.title.length > 120)) errors.push("Title must be 2–120 characters");
  if (fields.category !== undefined && (fields.category.length < 2 || fields.category.length > 60)) errors.push("Category must be 2–60 characters");
  if (fields.image !== undefined && fields.image !== "" && !validUrl(fields.image)) errors.push("Image must be an HTTP(S) URL");
  if (fields.description !== undefined && fields.description.length > 3000) errors.push("Description is too long");
  if (fields.badge !== undefined && fields.badge.length > 40) errors.push("Badge name is too long");
  if (fields.price !== undefined) {
    const pricing = calculateProductPricing(fields.price, body.discount);
    if (pricing.error) errors.push(pricing.error);
    else Object.assign(fields, pricing);
  }
  if (fields.rating !== undefined && (typeof fields.rating !== "number" || !Number.isFinite(fields.rating) || fields.rating < 0 || fields.rating > 5)) errors.push("Rating must be between 0 and 5");
  if (fields.images !== undefined && (!Array.isArray(fields.images) || fields.images.length > 8 || !fields.images.every((url) => typeof url === "string" && validUrl(url)))) errors.push("Use up to 8 HTTP(S) image URLs");
  if (fields.image && Array.isArray(fields.images)) {
    fields.images = [...new Set([fields.image, ...fields.images])];
    if (fields.images.length > 8) errors.push("Use up to 8 image URLs including the main image");
  } else if (fields.image) fields.images = [fields.image];
  else if (Array.isArray(fields.images) && fields.images.length) fields.image = fields.images[0];
  if (!creating && Object.keys(fields).length === 0 && body.discount === undefined) errors.push("No product fields provided");
  return { fields, errors };
};

export const getPublicSettings = async (req, res) => {
  try {
    const settings = await StoreSettings.findById("store").lean();
    res.json({ storeName: settings?.storeName || "MyStore", supportEmail: settings?.supportEmail || "support@mystore.com" });
  } catch (error) { res.status(500).json({ message: "Could not load store settings" }); }
};

export const getAdminSettings = async (req, res) => {
  try {
    const settings = await StoreSettings.findById("store").lean();
    res.json({ storeName: settings?.storeName || "MyStore", supportEmail: settings?.supportEmail || "support@mystore.com", lowStockThreshold: settings?.lowStockThreshold ?? 5 });
  } catch (error) { res.status(500).json({ message: "Could not load settings" }); }
};

export const updateAdminSettings = async (req, res) => {
  const { storeName, supportEmail, lowStockThreshold } = req.body || {};
  if (typeof storeName !== "string" || storeName.trim().length < 2 || storeName.trim().length > 60 ||
    typeof supportEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim()) ||
    !Number.isInteger(lowStockThreshold) || lowStockThreshold < 1 || lowStockThreshold > 100) {
    return res.status(400).json({ message: "Check store name, support email and low stock threshold (1–100)" });
  }
  try {
    const settings = await StoreSettings.findByIdAndUpdate("store", { $set: { storeName: storeName.trim(), supportEmail: supportEmail.trim(), lowStockThreshold } }, { upsert: true, new: true, runValidators: true });
    res.json(settings);
  } catch (error) { res.status(500).json({ message: "Could not save settings" }); }
};

export const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
    const threshold = (await StoreSettings.findById("store").lean())?.lowStockThreshold ?? 5;
    const filter = req.query.stock === "archived" ? { archivedAt: { $ne: null } } : { archivedAt: null };
    const search = String(req.query.search || "").trim().slice(0, 100);
    if (search) filter.$or = [{ title: { $regex: escapeRegex(search), $options: "i" } }, { category: { $regex: escapeRegex(search), $options: "i" } }];
    if (req.query.stock === "out") filter.stock = 0;
    if (req.query.stock === "low") filter.stock = { $gt: 0, $lte: threshold };
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page, totalPages: Math.ceil(total / limit), lowStockThreshold: threshold });
  } catch (error) { res.status(500).json({ message: "Could not load products" }); }
};

export const createAdminProduct = async (req, res) => {
  const { fields, errors } = parseProductInput(req.body, true);
  const stock = req.body?.stock;
  if (!Number.isSafeInteger(stock) || stock < 0) errors.push("Stock must be a non-negative whole number");
  if (errors.length) return res.status(400).json({ message: errors.join("; ") });
  try {
    fields.category = await ensureCategory(fields.category);
    if (fields.badge !== undefined) {
      const badge = await resolveBadge(fields.badge);
      if (!badge) return res.status(400).json({ message: "Choose an existing badge" });
      Object.assign(fields, badge);
    }
    if (await findDuplicateProduct(fields.title, fields.category)) return res.status(409).json({ message: "A product with this name and category already exists" });
    const product = await Product.create({ ...fields, stock, catalogKey: makeCatalogKey(fields.title, fields.category) });
    res.status(201).json(product);
  } catch (error) { res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? "A product with this name and category already exists" : "Could not create product" }); }
};

export const updateAdminProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  const { fields, errors } = parseProductInput(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join("; ") });
  try {
    if (req.body?.discount !== undefined && fields.price === undefined) {
      const current = await Product.findById(req.params.id).select("price originalPrice").lean();
      if (!current) return res.status(404).json({ message: "Product not found" });
      const pricing = calculateProductPricing(current.originalPrice ?? current.price, req.body.discount);
      if (pricing.error) return res.status(400).json({ message: pricing.error });
      Object.assign(fields, pricing);
    }
    if (fields.category !== undefined) fields.category = await ensureCategory(fields.category);
    if (fields.badge !== undefined) {
      const badge = await resolveBadge(fields.badge);
      if (!badge) return res.status(400).json({ message: "Choose an existing badge" });
      Object.assign(fields, badge);
    }
    if (fields.title !== undefined || fields.category !== undefined) {
      const current = await Product.findById(req.params.id).select("title category").lean();
      if (!current) return res.status(404).json({ message: "Product not found" });
      const title = fields.title ?? current.title;
      const category = fields.category ?? current.category;
      if (makeCatalogKey(title, category) !== makeCatalogKey(current.title, current.category)) {
        if (await findDuplicateProduct(title, category, req.params.id)) return res.status(409).json({ message: "A product with this name and category already exists" });
        fields.catalogKey = makeCatalogKey(title, category);
      }
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: fields }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) { res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? "A product with this name and category already exists" : "Could not update product" }); }
};

export const archiveAdminProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, archivedAt: null },
      { $set: { archivedAt: new Date(), archivedBy: req.user.id } },
      { new: true },
    );
    if (!product) return res.status(404).json({ message: "Active product not found" });
    res.json(product);
  } catch (error) { res.status(500).json({ message: "Could not remove product" }); }
};

export const restoreAdminProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, archivedAt: { $ne: null } },
      { $set: { archivedAt: null, archivedBy: null } },
      { new: true },
    );
    if (!product) return res.status(404).json({ message: "Removed product not found" });
    res.json(product);
  } catch (error) { res.status(500).json({ message: "Could not restore product" }); }
};

export const adjustAdminStock = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  const { change, reason } = req.body || {};
  if (!Number.isSafeInteger(change) || change === 0 || Math.abs(change) > 100000 || typeof reason !== "string" || reason.trim().length < 3 || reason.trim().length > 200) {
    return res.status(400).json({ message: "Provide a non-zero whole-number change and a reason (3–200 characters)" });
  }
  try {
    let updated;
    await mongoose.connection.transaction(async (session) => {
      const filter = { _id: req.params.id, archivedAt: null };
      if (change < 0) filter.stock = { $gte: -change };
      updated = await Product.findOneAndUpdate(filter, { $inc: { stock: change } }, { new: true, session });
      if (!updated) return;
      await StockAdjustment.create([{ product: updated._id, admin: req.user.id, change, before: updated.stock - change, after: updated.stock, reason: reason.trim() }], { session });
    });
    if (!updated) return res.status(409).json({ message: "Product not found or insufficient stock. Refresh and try again." });
    res.json(updated);
  } catch (error) { res.status(500).json({ message: "Could not adjust stock" }); }
};

export const getStockAdjustments = async (req, res) => {
  try {
    const adjustments = await StockAdjustment.find().sort({ createdAt: -1 }).limit(15).populate("product", "title").populate("admin", "name").lean();
    res.json(adjustments);
  } catch (error) { res.status(500).json({ message: "Could not load stock history" }); }
};

export const getAdminOverview = async (req, res) => {
  try {
    const threshold = (await StoreSettings.findById("store").lean())?.lowStockThreshold ?? 5;
    const pendingCashFilter = { paymentMethod: "cash_on_delivery", paymentStatus: "unpaid", status: { $ne: "cancelled" } };
    const [totalProducts, lowStockCount, outOfStockCount, pendingCash, stockIssueCount, lowStockProducts, recentAdjustments] = await Promise.all([
      Product.countDocuments({ archivedAt: null }),
      Product.countDocuments({ archivedAt: null, stock: { $gt: 0, $lte: threshold } }),
      Product.countDocuments({ archivedAt: null, stock: 0 }),
      Order.aggregate([{ $match: pendingCashFilter }, { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$totalPrice" } } }]),
      Order.countDocuments({ status: "stock_issue" }),
      Product.find({ archivedAt: null, stock: { $lte: threshold } }).sort({ stock: 1, title: 1 }).limit(6).select("title stock image category").lean(),
      StockAdjustment.find().sort({ createdAt: -1 }).limit(5).populate("product", "title").populate("admin", "name").lean(),
    ]);
    res.json({ totalProducts, lowStockCount, outOfStockCount, pendingCashCount: pendingCash[0]?.count || 0, pendingCashAmount: pendingCash[0]?.amount || 0, stockIssueCount, lowStockProducts, recentAdjustments, lowStockThreshold: threshold });
  } catch (error) { res.status(500).json({ message: "Could not load dashboard" }); }
};
