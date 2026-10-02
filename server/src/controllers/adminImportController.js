import Product from "../models/Product.js";
import { duplicateFilter, makeCatalogKey, parseProductInput } from "./adminController.js";
import { resolveCategory } from "../utils/categories.js";
import Badge from "../models/Badge.js";
import { allCategoryNames, ensureCategory, ensureDefaultBadges, taxonomyKey } from "../utils/catalogTaxonomy.js";

const MAX_PRODUCTS = 100;

const extractProducts = (body) => {
  const products = Array.isArray(body) ? body : Array.isArray(body?.products) ? body.products : body && typeof body === "object" ? [body] : null;
  if (!products || products.length === 0 || products.length > MAX_PRODUCTS) return null;
  return products;
};

const summarize = (rows) => ({
  ready: rows.filter((row) => row.status === "ready").length,
  imported: rows.filter((row) => row.status === "imported").length,
  invalid: rows.filter((row) => row.status === "invalid").length,
  duplicate: rows.filter((row) => row.status.startsWith("duplicate")).length,
  failed: rows.filter((row) => row.status === "failed").length,
});

export const inspectImport = async (body) => {
  const products = extractProducts(body);
  if (!products) return null;
  const knownCategories = await allCategoryNames();
  const badgeNames = products.filter((item) => typeof item?.badge === "string" && item.badge.trim()).map((item) => taxonomyKey(item.badge));
  if (badgeNames.length) await ensureDefaultBadges();
  const badges = badgeNames.length ? await Badge.find({ key: { $in: badgeNames } }).lean() : [];
  const badgeByKey = new Map(badges.map((badge) => [badge.key, badge]));
  const seen = new Map();
  const rows = products.map((raw, index) => {
    const { fields, errors } = parseProductInput(raw, true);
    if (typeof fields.category === "string" && fields.category.length >= 2 && fields.category.length <= 60) {
      fields.category = resolveCategory(fields.category, knownCategories);
    }
    const stock = raw?.stock;
    if (!Number.isSafeInteger(stock) || stock < 0) errors.push("Stock must be a non-negative whole number");
    if (fields.badge) {
      const badge = badgeByKey.get(taxonomyKey(fields.badge));
      if (!badge) errors.push("Choose an existing badge");
      else { fields.badge = badge.name; fields.badgeColor = badge.color; }
    }
    const row = { index: index + 1, title: fields.title || "", category: fields.category || "", status: "ready", errors, fields: { ...fields, stock } };
    if (errors.length) row.status = "invalid";
    else {
      knownCategories.push(fields.category);
      const key = makeCatalogKey(fields.title, fields.category);
      if (seen.has(key)) {
        row.status = "duplicate_file";
        row.errors.push(`Duplicate of row ${seen.get(key)} in this file`);
      } else seen.set(key, row.index);
    }
    return row;
  });

  const candidates = rows.filter((row) => row.status === "ready");
  if (candidates.length) {
    const existing = await Product.find({ $or: candidates.map((row) => duplicateFilter(row.fields.title, row.fields.category)) })
      .select("title category archivedAt").lean();
    const existingKeys = new Map(existing.map((product) => [makeCatalogKey(product.title, product.category), product]));
    for (const row of candidates) {
      const match = existingKeys.get(makeCatalogKey(row.fields.title, row.fields.category));
      if (match) {
        row.status = "duplicate_database";
        row.errors.push(match.archivedAt ? "Product already exists in removed products; restore it instead" : "Product already exists in the catalog");
      }
    }
  }
  return rows;
};

const publicRows = (rows) => rows.map(({ fields, ...row }) => ({
  ...row,
  price: typeof fields.price === "number" ? fields.price : null,
  originalPrice: typeof fields.originalPrice === "number" ? fields.originalPrice : null,
  discountMode: typeof fields.discountMode === "string" ? fields.discountMode : "none",
  discountPercent: typeof fields.discountPercent === "number" ? fields.discountPercent : 0,
  stock: Number.isSafeInteger(fields.stock) ? fields.stock : null,
  image: typeof fields.image === "string" ? fields.image : "",
  description: typeof fields.description === "string" ? fields.description : "",
  badge: typeof fields.badge === "string" ? fields.badge : "",
  badgeColor: typeof fields.badgeColor === "string" ? fields.badgeColor : "",
}));

export const previewProductImport = async (req, res) => {
  try {
    const rows = await inspectImport(req.body);
    if (!rows) return res.status(400).json({ message: `Upload a product, a products array, or {"products": [...]} with 1–${MAX_PRODUCTS} products` });
    res.json({ rows: publicRows(rows), summary: summarize(rows) });
  } catch (error) { res.status(500).json({ message: "Could not preview import" }); }
};

export const importProducts = async (req, res) => {
  try {
    // Recheck every row: the catalog may have changed since the preview.
    const rows = await inspectImport(req.body);
    if (!rows) return res.status(400).json({ message: `Upload 1–${MAX_PRODUCTS} products` });
    const savedCategories = new Map();
    for (const row of rows) {
      if (row.status !== "ready") continue;
      try {
        if (!savedCategories.has(row.fields.category)) savedCategories.set(row.fields.category, await ensureCategory(row.fields.category));
        row.fields.category = savedCategories.get(row.fields.category);
        await Product.create({ ...row.fields, catalogKey: makeCatalogKey(row.fields.title, row.fields.category) });
        row.status = "imported";
      } catch (error) {
        row.status = error.code === 11000 ? "duplicate_database" : "failed";
        row.errors.push(error.code === 11000 ? "Product was added by another request" : "Could not save this product");
      }
    }
    res.json({ rows: publicRows(rows), summary: summarize(rows) });
  } catch (error) { res.status(500).json({ message: "Could not import products" }); }
};
