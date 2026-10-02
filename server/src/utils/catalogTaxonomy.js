import Badge from "../models/Badge.js";
import Category from "../models/Category.js";
import StoreSettings from "../models/StoreSettings.js";
import Product from "../models/Product.js";
import { canonicalCategories, resolveCategory } from "./categories.js";

export const taxonomyKey = (name) => name.trim().toLowerCase();
export const validName = (name, max) => typeof name === "string" && name.trim().length >= 2 && name.trim().length <= max;
export const badgeColors = ["blue", "red", "amber", "green", "purple", "slate"];
export const validBadgeColor = (color) => typeof color === "string" &&
  (badgeColors.includes(color) || /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));

const defaultBadges = [
  { name: "New", color: "blue" },
  { name: "Sale", color: "red" },
  { name: "Best Seller", color: "amber" },
  { name: "Limited", color: "purple" },
  { name: "Featured", color: "green" },
];

export const ensureDefaultBadges = async () => {
  const settings = await StoreSettings.findById("store").lean();
  if (settings?.badgesInitialized) return;
  for (const badge of defaultBadges) {
    try {
      await Badge.updateOne({ key: taxonomyKey(badge.name) }, { $setOnInsert: { ...badge, key: taxonomyKey(badge.name) } }, { upsert: true });
    } catch (error) { if (error.code !== 11000) throw error; }
  }
  try {
    await StoreSettings.updateOne({ _id: "store" }, { $set: { badgesInitialized: true } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    await StoreSettings.updateOne({ _id: "store" }, { $set: { badgesInitialized: true } });
  }
};

export const allCategoryNames = async () => {
  const [registered, productNames] = await Promise.all([Category.find().select("name").lean(), Product.distinct("category")]);
  return canonicalCategories([...registered.map((item) => item.name), ...productNames]);
};

export const ensureCategory = async (name, session) => {
  const known = await allCategoryNames();
  const resolved = resolveCategory(name, known);
  try {
    await Category.updateOne({ key: taxonomyKey(resolved) }, { $setOnInsert: { name: resolved, key: taxonomyKey(resolved) } }, { upsert: true, ...(session ? { session } : {}) });
    return resolved;
  } catch (error) {
    if (error.code !== 11000) throw error;
    return (await Category.findOne({ key: taxonomyKey(resolved) }).lean())?.name || resolved;
  }
};

export const resolveBadge = async (name) => {
  if (!name) return { badge: "", badgeColor: "" };
  await ensureDefaultBadges();
  const badge = await Badge.findOne({ key: taxonomyKey(name) }).lean();
  return badge ? { badge: badge.name, badgeColor: badge.color } : null;
};
