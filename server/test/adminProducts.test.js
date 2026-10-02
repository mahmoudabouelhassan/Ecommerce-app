import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";
import Badge from "../src/models/Badge.js";
import StoreSettings from "../src/models/StoreSettings.js";
import StockAdjustment from "../src/models/StockAdjustment.js";
import { adjustAdminStock, archiveAdminProduct, createAdminProduct, parseProductInput, restoreAdminProduct, updateAdminProduct } from "../src/controllers/adminController.js";
import { inspectImport, importProducts, previewProductImport } from "../src/controllers/adminImportController.js";
import { getCategories, getProductById, getProducts } from "../src/controllers/productController.js";
import { canonicalCategories, resolveCategory } from "../src/utils/categories.js";

const productId = new mongoose.Types.ObjectId().toString();
const adminId = new mongoose.Types.ObjectId().toString();
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const mockCategoryCatalog = (t) => {
  t.mock.method(Category, "find", () => ({ select: () => ({ lean: async () => [] }) }));
  t.mock.method(Category, "updateOne", async () => ({}));
};

test("product validation rejects invalid price, unsafe image and missing required fields", () => {
  const { errors } = parseProductInput({ title: "A", price: 0.001, category: "x", image: "javascript:alert(1)" }, true);
  assert.equal(errors.length, 4);
  assert.deepEqual(parseProductInput({ title: "Camera", price: 24.99, category: "electronics", image: "https://example.com/image.jpg" }, true).errors, []);
  assert.deepEqual(parseProductInput({ title: "Camera", price: 24.99, category: "electronics", image: "https://example.com/image.jpg", images: [] }, true).fields.images, ["https://example.com/image.jpg"]);
});

test("manual products can be saved without images and use a gallery image when supplied", async (t) => {
  mockCategoryCatalog(t);
  const base = { title: "Image-free camera", price: 24.99, category: "electronics", stock: 3 };
  const parsed = parseProductInput(base, true);
  assert.deepEqual(parsed.errors, []);
  await new Product({ ...parsed.fields, stock: base.stock }).validate();
  assert.deepEqual(parseProductInput({ ...base, image: "", images: [] }, true).errors, []);
  assert.equal(parseProductInput({ ...base, images: ["https://example.com/photo.jpg"] }, true).fields.image, "https://example.com/photo.jpg");

  t.mock.method(Product, "distinct", async () => []);
  t.mock.method(Product, "findOne", () => ({ select: () => ({ lean: async () => null }) }));
  const create = t.mock.method(Product, "create", async (product) => product);
  const res = response();
  await createAdminProduct({ body: base }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(create.mock.callCount(), 1);
  assert.equal(create.mock.calls[0].arguments[0].image, undefined);
});

test("creating a product requires valid initial stock", async (t) => {
  const create = t.mock.method(Product, "create", async () => ({}));
  const res = response();
  await createAdminProduct({ body: { title: "Camera", price: 24.99, category: "electronics", image: "https://example.com/image.jpg", stock: -1 } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(create.mock.callCount(), 0);
});

test("product edits cannot set stock without an audited adjustment", async (t) => {
  t.mock.method(Product, "findById", () => ({ select: () => ({ lean: async () => ({ title: "Camera", category: "electronics" }) }) }));
  t.mock.method(Product, "findOne", () => ({ select: () => ({ lean: async () => null }) }));
  const update = t.mock.method(Product, "findByIdAndUpdate", async () => ({ _id: productId }));
  const res = response();
  await updateAdminProduct({ params: { id: productId }, body: { title: "New camera", stock: 100 } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(update.mock.calls[0].arguments[1], { $set: { title: "New camera", catalogKey: '["electronics","new camera"]' } });
});

test("stock adjustment is atomic, nonnegative and records the admin and reason", async (t) => {
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({ id: "transaction" }));
  const update = t.mock.method(Product, "findOneAndUpdate", async () => ({ _id: productId, stock: 7 }));
  const audit = t.mock.method(StockAdjustment, "create", async () => []);
  const res = response();
  await adjustAdminStock({ params: { id: productId }, user: { id: adminId }, body: { change: -3, reason: "Damaged units" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(update.mock.calls[0].arguments[0].stock, { $gte: 3 });
  assert.deepEqual(update.mock.calls[0].arguments[1], { $inc: { stock: -3 } });
  assert.deepEqual(audit.mock.calls[0].arguments[0][0], { product: productId, admin: adminId, change: -3, before: 10, after: 7, reason: "Damaged units" });
});

test("insufficient stock cannot create a stock adjustment record", async (t) => {
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({ id: "transaction" }));
  t.mock.method(Product, "findOneAndUpdate", async () => null);
  const audit = t.mock.method(StockAdjustment, "create", async () => []);
  const res = response();
  await adjustAdminStock({ params: { id: productId }, user: { id: adminId }, body: { change: -10, reason: "Damaged units" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(audit.mock.callCount(), 0);
});

const validProduct = (title = "Camera", category = "electronics") => ({ title, category, price: 24.99, image: "https://example.com/image.jpg", stock: 3 });

test("JSON preview separates valid, repeated, existing and invalid rows", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => ["electronics", "home"]);
  t.mock.method(Product, "find", () => ({ select: () => ({ lean: async () => [{ title: "Lamp", category: "home", archivedAt: null }] }) }));
  const rows = await inspectImport({ products: [validProduct(), validProduct("camera"), validProduct("Lamp", "home"), { title: "Bad" }] });
  assert.deepEqual(rows.map((row) => row.status), ["ready", "duplicate_file", "duplicate_database", "invalid"]);
  assert.match(rows[1].errors[0], /row 1/);
});

test("JSON import inserts only ready products and does not overwrite existing products", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => ["electronics", "home"]);
  t.mock.method(Product, "find", () => ({ select: () => ({ lean: async () => [{ title: "Lamp", category: "home", archivedAt: null }] }) }));
  const create = t.mock.method(Product, "create", async (product) => product);
  const res = response();
  await importProducts({ body: [validProduct(), validProduct("Lamp", "home"), { title: "Bad" }] }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.summary.imported, 1);
  assert.equal(res.body.summary.duplicate, 1);
  assert.equal(res.body.summary.invalid, 1);
  assert.equal(create.mock.callCount(), 1);
  assert.equal(create.mock.calls[0].arguments[0].title, "Camera");
});

test("JSON preview returns descriptions for ready and duplicate products", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => ["electronics"]);
  t.mock.method(Product, "find", () => ({ select: () => ({ lean: async () => [{ title: "Existing camera", category: "electronics", archivedAt: null }] }) }));
  const res = response();
  await previewProductImport({ body: [
    { ...validProduct("New camera"), description: "A new description" },
    { ...validProduct("Existing camera"), description: "An existing description in the file" },
  ] }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.rows.map((row) => row.description), ["A new description", "An existing description in the file"]);
  assert.deepEqual(res.body.rows.map((row) => row.status), ["ready", "duplicate_database"]);
});

test("JSON preview and import use the discounted customer price", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => []);
  t.mock.method(Product, "find", () => ({ select: () => ({ lean: async () => [] }) }));
  const create = t.mock.method(Product, "create", async (product) => product);
  const discounted = { ...validProduct("Sale camera"), discount: { type: "percentage", value: 20 } };
  const preview = response();
  await previewProductImport({ body: [discounted] }, preview);
  assert.equal(preview.body.rows[0].status, "ready");
  assert.equal(preview.body.rows[0].price, 19.99);
  assert.equal(preview.body.rows[0].originalPrice, 24.99);
  const imported = response();
  await importProducts({ body: [discounted] }, imported);
  assert.equal(imported.body.summary.imported, 1);
  assert.equal(create.mock.calls[0].arguments[0].price, 19.99);
  assert.equal(create.mock.calls[0].arguments[0].originalPrice, 24.99);
});

test("JSON import accepts products with no image fields", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => []);
  t.mock.method(Product, "find", () => ({ select: () => ({ lean: async () => [] }) }));
  const create = t.mock.method(Product, "create", async (product) => product);
  const imageFree = { title: "Image-free lamp", price: 20, category: "home", stock: 4 };
  const preview = response();
  await previewProductImport({ body: [imageFree] }, preview);
  assert.equal(preview.body.rows[0].status, "ready");
  assert.equal(preview.body.rows[0].image, "");
  const imported = response();
  await importProducts({ body: [imageFree] }, imported);
  assert.equal(imported.body.summary.imported, 1);
  assert.equal(create.mock.calls[0].arguments[0].image, undefined);
});

test("product badges resolve by name and JSON preview rejects unknown badges", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => ["electronics"]);
  t.mock.method(StoreSettings, "findById", () => ({ lean: async () => ({ badgesInitialized: true }) }));
  t.mock.method(Badge, "findOne", () => ({ lean: async () => ({ name: "New", color: "blue" }) }));
  t.mock.method(Badge, "find", () => ({ lean: async () => [{ key: "new", name: "New", color: "blue" }] }));
  t.mock.method(Product, "findOne", () => ({ select: () => ({ lean: async () => null }) }));
  t.mock.method(Product, "find", () => ({ select: () => ({ lean: async () => [] }) }));
  const create = t.mock.method(Product, "create", async (product) => product);
  const created = response();
  await createAdminProduct({ body: { ...validProduct("Camera"), badge: "nEw" } }, created);
  assert.equal(created.statusCode, 201);
  assert.equal(create.mock.calls[0].arguments[0].badge, "New");
  assert.equal(create.mock.calls[0].arguments[0].badgeColor, "blue");
  const preview = response();
  await previewProductImport({ body: [
    { ...validProduct("Lamp"), badge: "NEW" },
    { ...validProduct("Desk"), badge: "Unknown" },
  ] }, preview);
  assert.deepEqual(preview.body.rows.map((row) => row.status), ["ready", "invalid"]);
  assert.equal(preview.body.rows[0].badgeColor, "blue");
});

test("removed products remain in the database and can be restored", async (t) => {
  const update = t.mock.method(Product, "findOneAndUpdate", async () => ({ _id: productId, archivedAt: new Date() }));
  const removed = response();
  await archiveAdminProduct({ params: { id: productId }, user: { id: adminId } }, removed);
  assert.equal(removed.statusCode, 200);
  assert.equal(update.mock.calls[0].arguments[0].archivedAt, null);
  assert.equal(update.mock.calls[0].arguments[1].$set.archivedBy, adminId);
  const restored = response();
  await restoreAdminProduct({ params: { id: productId } }, restored);
  assert.equal(restored.statusCode, 200);
  assert.deepEqual(update.mock.calls[1].arguments[1], { $set: { archivedAt: null, archivedBy: null } });
});

test("removed products cannot be opened through the public product endpoint", async (t) => {
  const find = t.mock.method(Product, "findOne", async () => null);
  const res = response();
  await getProductById({ params: { id: productId } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(find.mock.calls[0].arguments[0].archivedAt, null);
});

test("JSON import rejects more than 100 products", async () => {
  const res = response();
  await importProducts({ body: Array.from({ length: 101 }, () => validProduct()) }, res);
  assert.equal(res.statusCode, 400);
});

test("downloadable JSON example has a product with images and one without", async () => {
  const example = JSON.parse(await readFile(new URL("../../client/public/products-example.json", import.meta.url), "utf8"));
  assert.equal(example.length, 2);
  for (const product of example) {
    assert.deepEqual(parseProductInput(product, true).errors, []);
    assert.equal(Number.isSafeInteger(product.stock), true);
    if (product.image) {
      assert.equal(product.image.startsWith("https://"), true);
      assert.equal(product.image.includes("["), false);
    }
  }
  assert.equal(example.filter((product) => !product.image && !product.images).length, 1);
});

test("category choices collapse legacy case variants and prefer existing spelling", async (t) => {
  assert.deepEqual(canonicalCategories(["Electronics", "electronics", "FASHION"]), ["electronics", "FASHION"]);
  assert.equal(resolveCategory("ELECTRONICS", ["electronics"]), "electronics");
  const distinct = t.mock.method(Product, "distinct", async () => ["Electronics", "electronics", "FASHION"]);
  const res = response();
  await getCategories({}, res);
  assert.equal(distinct.mock.calls[0].arguments[1].archivedAt, null);
  assert.deepEqual(res.body, ["electronics", "FASHION"]);
});

test("manual product creation reuses existing category spelling", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => ["electronics"]);
  t.mock.method(Product, "findOne", () => ({ select: () => ({ lean: async () => null }) }));
  const create = t.mock.method(Product, "create", async (product) => product);
  const res = response();
  await createAdminProduct({ body: validProduct("New camera", "ElEcTrOnIcS") }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(create.mock.calls[0].arguments[0].category, "electronics");
});

test("JSON import uses existing spelling and one spelling for a new category in the same file", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => ["electronics"]);
  t.mock.method(Product, "find", () => ({ select: () => ({ lean: async () => [] }) }));
  const rows = await inspectImport([
    validProduct("Headphones", "ELECTRONICS"),
    validProduct("Drone", "Gadgets"),
    validProduct("Case", "gADgETs"),
  ]);
  assert.deepEqual(rows.map((row) => row.fields.category), ["electronics", "Gadgets", "Gadgets"]);
  assert.deepEqual(rows.map((row) => row.status), ["ready", "ready", "ready"]);
});

test("editing a product also reuses the existing category spelling", async (t) => {
  mockCategoryCatalog(t);
  t.mock.method(Product, "distinct", async () => ["electronics"]);
  t.mock.method(Product, "findById", () => ({ select: () => ({ lean: async () => ({ title: "Camera", category: "fashion" }) }) }));
  t.mock.method(Product, "findOne", () => ({ select: () => ({ lean: async () => null }) }));
  const update = t.mock.method(Product, "findByIdAndUpdate", async () => ({ _id: productId }));
  const res = response();
  await updateAdminProduct({ params: { id: productId }, body: { category: "ElEcTrOnIcS" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(update.mock.calls[0].arguments[1].$set.category, "electronics");
});

test("public product filters include legacy categories with different letter case", async (t) => {
  const find = t.mock.method(Product, "find", () => ({ sort: () => ({ skip: () => ({ limit: async () => [] }) }) }));
  t.mock.method(Product, "countDocuments", async () => 0);
  const res = response();
  await getProducts({ query: { category: "ELECTRONICS" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(find.mock.calls[0].arguments[0].category, { $regex: "^ELECTRONICS$", $options: "i" });
});
