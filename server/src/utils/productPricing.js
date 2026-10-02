const validMoney = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 &&
  Number.isSafeInteger(Math.round(value * 100)) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

export const calculateProductPricing = (basePrice, discount) => {
  if (!validMoney(basePrice)) return { error: "Price must be a positive amount with at most 2 decimals" };
  const baseCents = Math.round(basePrice * 100);
  const originalPrice = baseCents / 100;
  if (discount === undefined || discount === null || discount?.type === "none") {
    return { price: originalPrice, originalPrice, discountMode: "none", discountPercent: 0 };
  }
  if (!discount || typeof discount !== "object" || Array.isArray(discount)) {
    return { error: "Choose a valid discount type" };
  }
  if (discount.type === "price") {
    if (!validMoney(discount.value)) return { error: "Discounted price must be a positive amount with at most 2 decimals" };
    const saleCents = Math.round(discount.value * 100);
    if (saleCents >= baseCents) return { error: "Discounted price must be lower than the original price" };
    return {
      price: saleCents / 100,
      originalPrice,
      discountMode: "price",
      discountPercent: Math.round((1 - saleCents / baseCents) * 10000) / 100,
    };
  }
  if (discount.type === "percentage") {
    const percent = discount.value;
    if (typeof percent !== "number" || !Number.isFinite(percent) || percent <= 0 || percent >= 100 ||
      Math.abs(percent * 100 - Math.round(percent * 100)) > 1e-8) {
      return { error: "Discount percentage must be greater than 0 and less than 100, with at most 2 decimals" };
    }
    const saleCents = Math.round(baseCents * (1 - percent / 100));
    if (saleCents < 1 || saleCents >= baseCents) return { error: "Discount must lower the price by at least $0.01" };
    return { price: saleCents / 100, originalPrice, discountMode: "percentage", discountPercent: percent };
  }
  return { error: "Choose a valid discount type" };
};
