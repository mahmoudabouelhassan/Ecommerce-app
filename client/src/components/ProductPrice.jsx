import { hasProductDiscount } from "../utils/productPricing";

const sizes = { sm: "text-sm", md: "text-2xl", lg: "text-4xl" };

export default function ProductPrice({ product, quantity = 1, size = "md", onDark = false, showPercent = true, className = "" }) {
  const discounted = hasProductDiscount(product);
  const current = Number(product?.price || 0) * quantity;
  const original = Number(product?.originalPrice || 0) * quantity;
  return <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
    <span className={`${sizes[size] || sizes.md} font-bold ${onDark ? "text-white" : "text-blue-600"}`}>${current.toFixed(2)}</span>
    {discounted && <span className={`text-sm line-through ${onDark ? "text-white/75" : ""}`} style={onDark ? undefined : { color: "var(--text-secondary)" }}>${original.toFixed(2)}</span>}
    {discounted && showPercent && quantity === 1 && product.discountPercent > 0 && <span className={`text-xs font-semibold ${onDark ? "text-white" : "text-red-600"}`}>{Number(product.discountPercent).toFixed(product.discountPercent % 1 ? 2 : 0)}% off</span>}
  </div>;
}
