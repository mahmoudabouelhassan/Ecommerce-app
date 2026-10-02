import mongoose from "mongoose";
import Badge from "../models/Badge.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { categoryFilter, canonicalCategories } from "../utils/categories.js";
import { allCategoryNames, ensureDefaultBadges, taxonomyKey, validBadgeColor, validName } from "../utils/catalogTaxonomy.js";
import { makeCatalogKey } from "./adminController.js";

const conflict = (message) => Object.assign(new Error(message), { status: 409 });
const respondError = (res, error, fallback) => res.status(error.status || (error.code === 11000 ? 409 : 500)).json({ message: error.status ? error.message : error.code === 11000 ? "This name is already in use" : fallback });

export const getAdminCategories = async (req, res) => {
  try {
    const [registered, counts] = await Promise.all([
      Category.find().lean(),
      Product.aggregate([{ $group: { _id: "$category", total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ["$archivedAt", null] }, 1, 0] } } } }]),
    ]);
    const namedCounts = counts.filter((item) => typeof item._id === "string" && item._id.trim());
    const names = canonicalCategories([...registered.map((item) => item.name), ...namedCounts.map((item) => item._id)]);
    const byKey = new Map(names.map((name) => [taxonomyKey(name), { key: taxonomyKey(name), name, totalProducts: 0, activeProducts: 0 }]));
    for (const item of namedCounts) {
      const entry = byKey.get(taxonomyKey(item._id));
      entry.totalProducts += item.total;
      entry.activeProducts += item.active;
    }
    res.json([...byKey.values()]);
  } catch (error) { res.status(500).json({ message: "Could not load categories" }); }
};

export const createCategory = async (req, res) => {
  const name = req.body?.name;
  if (!validName(name, 60)) return res.status(400).json({ message: "Category name must be 2–60 characters" });
  const trimmed = name.trim();
  try {
    if ((await allCategoryNames()).some((item) => taxonomyKey(item) === taxonomyKey(trimmed))) return res.status(409).json({ message: "Category already exists" });
    const category = await Category.create({ name: trimmed, key: taxonomyKey(trimmed) });
    res.status(201).json(category);
  } catch (error) { respondError(res, error, "Could not add category"); }
};

const moveProducts = async (sourceKey, targetName, session) => {
  const products = await Product.find({ category: categoryFilter(sourceKey) }).select("_id title").session(session).lean();
  const existingTargets = await Product.find({ category: categoryFilter(targetName), _id: { $nin: products.map((product) => product._id) } }).select("title").session(session).lean();
  const keys = new Set(existingTargets.map((product) => makeCatalogKey(product.title, targetName)));
  for (const product of products) {
    const key = makeCatalogKey(product.title, targetName);
    if (keys.has(key)) throw conflict("The destination category would contain products with the same name. Resolve duplicates before continuing.");
    keys.add(key);
  }
  if (products.length) await Product.bulkWrite(products.map((product) => ({
    updateOne: { filter: { _id: product._id }, update: { $set: { category: targetName, catalogKey: makeCatalogKey(product.title, targetName) } } },
  })), { session });
  return products.length;
};

export const updateCategory = async (req, res) => {
  const oldKey = taxonomyKey(req.params.key);
  const name = req.body?.name;
  if (oldKey.length < 2 || oldKey.length > 60) return res.status(400).json({ message: "Invalid category" });
  if (!validName(name, 60)) return res.status(400).json({ message: "Category name must be 2–60 characters" });
  const trimmed = name.trim();
  try {
    let updated;
    await mongoose.connection.transaction(async (session) => {
      const known = await allCategoryNames();
      if (!known.some((item) => taxonomyKey(item) === oldKey)) throw Object.assign(new Error("Category not found"), { status: 404 });
      if (taxonomyKey(trimmed) !== oldKey && known.some((item) => taxonomyKey(item) === taxonomyKey(trimmed))) throw conflict("Category already exists");
      const changedProducts = await moveProducts(oldKey, trimmed, session);
      await Category.updateOne({ key: oldKey }, { $set: { key: taxonomyKey(trimmed), name: trimmed } }, { session });
      if (!(await Category.exists({ key: taxonomyKey(trimmed) }).session(session))) {
        await Category.create([{ key: taxonomyKey(trimmed), name: trimmed }], { session });
      }
      updated = { key: taxonomyKey(trimmed), name: trimmed, changedProducts };
    });
    res.json(updated);
  } catch (error) { respondError(res, error, "Could not update category"); }
};

export const deleteCategory = async (req, res) => {
  const key = taxonomyKey(req.params.key);
  if (key.length < 2 || key.length > 60) return res.status(400).json({ message: "Invalid category" });
  const replacement = typeof req.body?.replacement === "string" ? req.body.replacement.trim() : "";
  try {
    let movedProducts = 0;
    await mongoose.connection.transaction(async (session) => {
      const known = await allCategoryNames();
      if (!known.some((item) => taxonomyKey(item) === key)) throw Object.assign(new Error("Category not found"), { status: 404 });
      const assigned = await Product.countDocuments({ category: categoryFilter(key) }).session(session);
      if (assigned && !replacement) throw conflict("Choose another category for its products before deleting it");
      if (replacement) {
        const target = known.find((item) => taxonomyKey(item) === taxonomyKey(replacement) && taxonomyKey(item) !== key);
        if (!target) throw Object.assign(new Error("Choose an existing replacement category"), { status: 400 });
        movedProducts = await moveProducts(key, target, session);
      }
      await Category.deleteOne({ key }, { session });
    });
    res.json({ deleted: true, movedProducts });
  } catch (error) { respondError(res, error, "Could not delete category"); }
};

export const getAdminBadges = async (req, res) => {
  try {
    await ensureDefaultBadges();
    const [badges, counts] = await Promise.all([
      Badge.find().sort({ name: 1 }).lean(),
      Product.aggregate([{ $match: { badge: { $type: "string", $ne: "" } } }, { $group: { _id: "$badge", total: { $sum: 1 } } }]),
    ]);
    const byKey = new Map(counts.map((item) => [taxonomyKey(item._id), item.total]));
    res.json(badges.map((badge) => ({ ...badge, productCount: byKey.get(badge.key) || 0 })));
  } catch (error) { res.status(500).json({ message: "Could not load badges" }); }
};

const parseBadge = (body) => {
  if (!validName(body?.name, 40) || !validBadgeColor(body?.color)) return null;
  const name = body.name.trim();
  return { name, key: taxonomyKey(name), color: body.color.toLowerCase() };
};

export const createBadge = async (req, res) => {
  const data = parseBadge(req.body);
  if (!data) return res.status(400).json({ message: "Use a badge name (2–40 characters) and a preset or Hex color" });
  try {
    await ensureDefaultBadges();
    const badge = await Badge.create(data);
    res.status(201).json(badge);
  } catch (error) { respondError(res, error, "Could not add badge"); }
};

export const updateBadge = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid badge" });
  const data = parseBadge(req.body);
  if (!data) return res.status(400).json({ message: "Use a badge name (2–40 characters) and a preset or Hex color" });
  try {
    let updated;
    await mongoose.connection.transaction(async (session) => {
      const original = await Badge.findById(req.params.id).session(session).lean();
      if (!original) throw Object.assign(new Error("Badge not found"), { status: 404 });
      if (data.key !== original.key && await Badge.exists({ key: data.key }).session(session)) throw conflict("Badge already exists");
      updated = await Badge.findByIdAndUpdate(original._id, { $set: data }, { new: true, runValidators: true, session });
      await Product.updateMany({ badge: categoryFilter(original.name) }, { $set: { badge: data.name, badgeColor: data.color } }, { session });
    });
    res.json(updated);
  } catch (error) { respondError(res, error, "Could not update badge"); }
};

export const deleteBadge = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid badge" });
  try {
    await mongoose.connection.transaction(async (session) => {
      const original = await Badge.findById(req.params.id).session(session).lean();
      if (!original) throw Object.assign(new Error("Badge not found"), { status: 404 });
      await Product.updateMany({ badge: categoryFilter(original.name) }, { $set: { badge: "", badgeColor: "" } }, { session });
      await Badge.deleteOne({ _id: original._id }, { session });
    });
    res.json({ deleted: true });
  } catch (error) { respondError(res, error, "Could not delete badge"); }
};
