import test from "node:test";
import assert from "node:assert/strict";
import { calculateProductPricing } from "../src/utils/productPricing.js";
import { parseProductInput } from "../src/controllers/adminController.js";

test("a direct sale price stores the customer price and original price separately", () => {
  const product = parseProductInput({
    title: "Headphones", category: "electronics", price: 49.99,
    discount: { type: "price", value: 39.99 },
  }, true);
  assert.deepEqual(product.errors, []);
  assert.equal(product.fields.price, 39.99);
  assert.equal(product.fields.originalPrice, 49.99);
  assert.equal(product.fields.discountMode, "price");
  assert.equal(product.fields.discountPercent, 20);
});

test("percentage discounts round the customer price to cents", () => {
  assert.deepEqual(calculateProductPricing(24.99, { type: "percentage", value: 15 }), {
    price: 21.24, originalPrice: 24.99, discountMode: "percentage", discountPercent: 15,
  });
  assert.deepEqual(calculateProductPricing(24.99, { type: "none" }), {
    price: 24.99, originalPrice: 24.99, discountMode: "none", discountPercent: 0,
  });
});

test("invalid discounts cannot produce a zero or higher customer price", () => {
  for (const discount of [
    { type: "price", value: 50 }, { type: "price", value: 0 },
    { type: "percentage", value: 100 }, { type: "percentage", value: -10 },
    { type: "percentage", value: 0.001 }, { type: "unknown", value: 10 },
  ]) {
    assert.ok(calculateProductPricing(50, discount).error);
  }
  assert.ok(calculateProductPricing(0.01, { type: "percentage", value: 1 }).error);
});
