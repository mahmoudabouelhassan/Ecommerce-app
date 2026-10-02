import { Heart, Star } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../../features/cart/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../features/wishlist/wishlistSlice";
import { showLoginRequiredAlert } from "../../utils/authAlert";
import { getProductImage, useProductImageFallback } from "../../utils/productImage";
import { badgeClassName, badgeStyle } from "../../utils/productBadge";
import ProductPrice from "../ProductPrice";

function ProductCard({ product }) {
  const roundedRating = Math.round(product.rating ?? 0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isWishlisted = useSelector((state) =>
    state.wishlist.wishlistItems.some((item) => item.id === product.id),
  );
  const cartItems = useSelector((state) => state.cart.items);
  const itemInCart = cartItems.find((item) => item.id === product.id);
  const cartQty = itemInCart?.quantity || 0;
  const availableStock = Math.max((product.stock || 0) - cartQty, 0);
  const isOutOfStock = availableStock === 0;
  const handleAddToCard = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showLoginRequiredAlert(navigate);
      return;
    }
    if (isOutOfStock) return;
    dispatch(addToCart(product));
  };
  const handleToggleWishlist = (e) => {
    e.stopPropagation(); // منع الانتقال لصفحة التفاصيل عند الضغط على زر المفضلة
    if (!isAuthenticated) {
      showLoginRequiredAlert(navigate);
      return;
    }
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist(product));
    }
  };
  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      style={{ background: "var(--bg-card)" }}
      className="group flex flex-col  w-full max-w-[320px] mx-auto  cursor-pointer  transition-all duration-700 rounded-3xl"
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-secondary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--bg-card)")
      }
    >
      <div className="relative aspect-4/5 w-full rounded-3xl overflow-hidden bg-[#F3F4F6] transition-all duration-300">
        <img
          src={getProductImage(product)}
          onError={useProductImageFallback}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        {(product.badge || isOutOfStock) && <div className="absolute top-4 right-4 left-4 flex flex-col items-start gap-2">
          {product.badge && <span className={badgeClassName(product.badgeColor)} style={badgeStyle(product.badgeColor)}>{product.badge}</span>}
          {isOutOfStock && <span className="rounded-full bg-gray-900/80 px-3 py-1.5 text-xs font-bold text-white">Out of Stock</span>}
        </div>}
        {/* fav icon */}
        <button
          onClick={handleToggleWishlist}
          style={{ background: "var(--bg-card)" }}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center  rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 group/btn"
          aria-label="Add to wishlist"
        >
          {/* <Heart className="w-5 h-5 text-slate-400 group-hover/btn:text-red-500 group-hover/btn:fill-red-500 transition-colors duration-300" /> */}
          <Heart
            className={`w-5 h-5 transition-colors duration-300 ${
              isWishlisted
                ? "text-red-500 fill-red-500"
                : "text-slate-400 group-hover/btn:text-red-500 group-hover/btn:fill-red-500"
            }`}
          />
        </button>
        {/* Add to Cart */}
        <button
          onClick={handleAddToCard}
          disabled={isOutOfStock}
          className="absolute bottom-4 left-1/2 cursor-pointer -translate-x-1/2 w-[90%] py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-center"
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
      {/*product details*/}
      <div className="mt-4 px-2">
        {/* rate by star */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`w-4 h-4 ${
                  index < roundedRating
                    ? "text-[#2563EB] fill-[#2563EB]"
                    : "text-gray-200 fill-transparent"
                }`}
              />
            ))}
          </div>
          <span
            className=" text-sm font-semibold font-sans"
            style={{ color: "var(--text-primary)" }}
          >
            {product.rating > 0 ? Number(product.rating).toFixed(1) : "Unrated"}
          </span>
        </div>

        <h3
          className="text-xl font-semibold  leading-snug line-clamp-1 font-sans"
          style={{ color: "var(--text-primary)" }}
        >
          {product.title}
        </h3>

        <p
          className="text-xs font-bold  tracking-wider uppercase mt-1.5 font-sans"
          style={{ color: "var(--text-primary)" }}
        >
          {product.category} Edition
        </p>
        <div className="flex items-center justify-between mt-2">
          <ProductPrice product={product} className="mt-2 font-sans" />
          {!isOutOfStock && ( // ✅ جديد: عدد الـ stock المتاح
            <span
              style={{ color: "var(--text-secondary)" }}
              className="text-xs font-medium"
            >
              {availableStock} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
