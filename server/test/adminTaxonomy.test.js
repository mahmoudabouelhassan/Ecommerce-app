import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Category from "../src/models/Category.js";
import Badge from "../src/models/Badge.js";
import Product from "../src/models/Product.js";
import StoreSettings from "../src/models/StoreSettings.js";
import { createBadge, createCategory, deleteCategory, deleteBadge, getAdminBadges, getAdminCategories, updateBadge, updateCategory } from "../src/controllers/adminTaxonomyController.js";
import { ensureDefaultBadges } from "../src/utils/catalogTaxonomy.js";

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const query = (value) => ({ select() { return this; }, session() { return this; }, sort() { return this; }, lean: async () => value, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
const mockCategories = (t, names, registered = []) => {
  t.mock.method(Category, "find", () => query(registered));
  t.mock.method(Product, "distinct", async () => names);
};

test("admin categories include saved empty categories and legacy product categories", async (t) => {
  t.mock.method(Category, "find", () => query([{ name: "Gadgets" }]));
  t.mock.method(Product, "aggregate", async () => [
    { _id: "electronics", total: 4, active: 3 },
    { _id: "Electronics", total: 2, active: 1 },
  ]);
  const res = response();
  await getAdminCategories({}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map(({ name, totalProducts, activeProducts }) => [name, totalProducts, activeProducts]), [
    ["electronics", 6, 4], ["Gadgets", 0, 0],
  ]);
});

test("creating a category rejects an existing name regardless of case", async (t) => {
  mockCategories(t, ["electronics"]);
  const create = t.mock.method(Category, "create", async () => ({}));
  const res = response();
  await createCategory({ body: { name: "ELECTRONICS" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(create.mock.callCount(), 0);
});

test("renaming a category updates product names and catalog keys together", async (t) => {
  const id = new mongoose.Types.ObjectId();
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  mockCategories(t, ["electronics"], [{ name: "electronics" }]);
  const find = t.mock.method(Product, "find", (filter) => query(filter._id ? [] : [{ _id: id, title: "Camera" }]));
  const bulk = t.mock.method(Product, "bulkWrite", async () => ({}));
  const categoryUpdate = t.mock.method(Category, "updateOne", async () => ({}));
  t.mock.method(Category, "exists", () => query({ _id: id }));
  const res = response();
  await updateCategory({ params: { key: "electronics" }, body: { name: "Tech" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.changedProducts, 1);
  assert.equal(find.mock.callCount(), 2);
  assert.equal(bulk.mock.calls[0].arguments[0][0].updateOne.update.$set.category, "Tech");
  assert.equal(bulk.mock.calls[0].arguments[0][0].updateOne.update.$set.catalogKey, '["tech","camera"]');
  assert.equal(categoryUpdate.mock.calls[0].arguments[1].$set.key, "tech");
});

test("deleting a category with products requires a replacement", async (t) => {
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  mockCategories(t, ["electronics"]);
  t.mock.method(Product, "countDocuments", () => ({ session: async () => 3 }));
  const remove = t.mock.method(Category, "deleteOne", async () => ({}));
  const res = response();
  await deleteCategory({ params: { key: "electronics" }, body: {} }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(remove.mock.callCount(), 0);
});

test("moving a category cannot create duplicate product names in the destination", async (t) => {
  const id = new mongoose.Types.ObjectId();
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  mockCategories(t, ["electronics", "fashion"]);
  t.mock.method(Product, "countDocuments", () => ({ session: async () => 1 }));
  t.mock.method(Product, "find", (filter) => query(filter._id ? [{ title: "camera" }] : [{ _id: id, title: "Camera" }]));
  const bulk = t.mock.method(Product, "bulkWrite", async () => ({}));
  const remove = t.mock.method(Category, "deleteOne", async () => ({}));
  const res = response();
  await deleteCategory({ params: { key: "electronics" }, body: { replacement: "fashion" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(bulk.mock.callCount(), 0);
  assert.equal(remove.mock.callCount(), 0);
});

test("deleting a used category moves its products before removing the category", async (t) => {
  const id = new mongoose.Types.ObjectId();
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  mockCategories(t, ["electronics", "fashion"], [{ name: "electronics" }, { name: "fashion" }]);
  t.mock.method(Product, "countDocuments", () => ({ session: async () => 1 }));
  t.mock.method(Product, "find", (filter) => query(filter._id ? [] : [{ _id: id, title: "Camera" }]));
  const bulk = t.mock.method(Product, "bulkWrite", async () => ({}));
  const remove = t.mock.method(Category, "deleteOne", async () => ({}));
  const res = response();
  await deleteCategory({ params: { key: "electronics" }, body: { replacement: "fashion" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.movedProducts, 1);
  assert.equal(bulk.mock.calls[0].arguments[0][0].updateOne.update.$set.category, "fashion");
  assert.equal(remove.mock.callCount(), 1);
});

test("default badges initialize only once", async (t) => {
  let initialized = false;
  t.mock.method(StoreSettings, "findById", () => query({ badgesInitialized: initialized }));
  const update = t.mock.method(Badge, "updateOne", async () => ({}));
  t.mock.method(StoreSettings, "updateOne", async () => { initialized = true; });
  await ensureDefaultBadges();
  await ensureDefaultBadges();
  assert.equal(update.mock.callCount(), 5);
  assert.deepEqual(update.mock.calls.map((call) => call.arguments[0].key), ["new", "sale", "best seller", "limited", "featured"]);
});

test("badge edits and deletion update products using the badge", async (t) => {
  const id = new mongoose.Types.ObjectId();
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  t.mock.method(Badge, "findById", () => query({ _id: id, name: "Sale", key: "sale", color: "red" }));
  t.mock.method(Badge, "exists", () => query(null));
  t.mock.method(Badge, "findByIdAndUpdate", async () => ({ _id: id, name: "Special", color: "purple" }));
  const updateProducts = t.mock.method(Product, "updateMany", async () => ({}));
  const remove = t.mock.method(Badge, "deleteOne", async () => ({}));
  const edited = response();
  await updateBadge({ params: { id: String(id) }, body: { name: "Special", color: "purple" } }, edited);
  assert.equal(edited.statusCode, 200);
  assert.deepEqual(updateProducts.mock.calls[0].arguments[1].$set, { badge: "Special", badgeColor: "purple" });
  const deleted = response();
  await deleteBadge({ params: { id: String(id) } }, deleted);
  assert.equal(deleted.statusCode, 200);
  assert.deepEqual(updateProducts.mock.calls[1].arguments[1].$set, { badge: "", badgeColor: "" });
  assert.equal(remove.mock.callCount(), 1);
});

test("custom Hex badge colors are normalized and applied to existing products", async (t) => {
  const id = new mongoose.Types.ObjectId();
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback({}));
  t.mock.method(Badge, "findById", () => query({ _id: id, name: "Sale", key: "sale", color: "red" }));
  t.mock.method(Badge, "findByIdAndUpdate", async (_id, update) => update.$set);
  const updateProducts = t.mock.method(Product, "updateMany", async () => ({}));
  const res = response();
  await updateBadge({ params: { id: String(id) }, body: { name: "Sale", color: "#E5E7EB" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.color, "#e5e7eb");
  assert.equal(updateProducts.mock.calls[0].arguments[1].$set.badgeColor, "#e5e7eb");
  await new Badge({ name: "Custom", key: "custom", color: "#e5e7eb" }).validate();
});

test("badge color rejects invalid Hex codes", async (t) => {
  const create = t.mock.method(Badge, "create", async () => ({}));
  const res = response();
  await createBadge({ body: { name: "Custom", color: "#12345g" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(create.mock.callCount(), 0);
});

test("badge list ignores legacy products without a badge", async (t) => {
  t.mock.method(StoreSettings, "findById", () => query({ badgesInitialized: true }));
  t.mock.method(Badge, "find", () => query([{ _id: "1", key: "new", name: "New", color: "blue" }]));
  const aggregate = t.mock.method(Product, "aggregate", async () => [{ _id: "New", total: 2 }]);
  const res = response();
  await getAdminBadges({}, res);
  assert.equal(res.body[0].productCount, 2);
  assert.deepEqual(aggregate.mock.calls[0].arguments[0][0].$match.badge, { $type: "string", $ne: "" });
});
