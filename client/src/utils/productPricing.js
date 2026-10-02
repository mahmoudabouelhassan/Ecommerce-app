export const hasProductDiscount = (product) => Number.isFinite(product?.originalPrice) &&
  product.originalPrice > product.price;

export const previewDiscountedPrice = (base, mode, value) => {
  const baseCents = Math.round(Number(base) * 100);
  const discountValue = Number(value);
  if (!Number.isSafeInteger(baseCents) || baseCents < 1) return null;
  if (mode === "none") return baseCents / 100;
  if (!Number.isFinite(discountValue)) return null;
  const saleCents = mode === "percentage"
    ? Math.round(baseCents * (1 - discountValue / 100))
    : Math.round(discountValue * 100);
  if (saleCents < 1 || saleCents >= baseCents) return null;
  return saleCents / 100;
};
