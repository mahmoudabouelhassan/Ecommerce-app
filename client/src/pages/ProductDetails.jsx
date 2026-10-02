import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, Heart, ShoppingCart, Minus, Plus } from "lucide-react";
import {
  useGetProductByIdQuery,
  useGetRelatedProductsQuery,
} from "../features/products/productsApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import { toggleWishlist } from "../features/wishlist/wishlistSlice";
import { showLoginRequiredAlert } from "../utils/authAlert";
import ProductGrid from "../components/ProductGrid/ProductGrid";
import { productPlaceholder, useProductImageFallback } from "../utils/productImage";
import { badgeClassName, badgeStyle } from "../utils/productBadge";
import ProductPrice from "../components/ProductPrice";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, error, isLoading } = useGetProductByIdQuery(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const favoriteItems = useSelector(
    (state) => state.wishlist.wishlistItems || [],
  );
  const { data: relatedProducts = [] } = useGetRelatedProductsQuery(id, {
    skip: !product,
  });
  const gallery = product?.images?.length ? product.images : product?.image ? [product.image] : [productPlaceholder];

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );

  if (error)
    return (
      <h1 className="text-center mt-10 text-red-500 text-xl font-semibold font-sans">
        Something went Wrong
      </h1>
    );

  const isFavorite = favoriteItems.some((item) => item.id === product?.id);

  const roundedRating = Math.round(product.rating ?? 0);
  ///////////////////////
  const itemInCart = cartItems.find((item) => item.id === product?.id);
  const cartQty = itemInCart?.quantity || 0;

  const availableStock = Math.max((product.stock || 0) - cartQty, 0);
  const isOutOfStock = availableStock === 0;
  ////////////////////////////////////////////
  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      showLoginRequiredAlert(navigate);
      return;
    }
    dispatch(toggleWishlist(product));
  };
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      showLoginRequiredAlert(navigate);
      return;
    }
    if (isOutOfStock) return;
    dispatch(addToCart({ ...product, quantity }));
  };
  return (
    <div
      className="max-w-6xl mx-auto px-4 py-12 min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="flex flex-col md:flex-row gap-12">
        {/* Gallary */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          {/*  Main image */}
          <div className="relative aspect-4/5 w-full rounded-3xl overflow-hidden bg-[#F3F4F6]">
            <img
              src={gallery[Math.min(selectedImage, gallery.length - 1)]}
              onError={useProductImageFallback}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-all duration-500"
            />
            {(product.badge || isOutOfStock) && <div className="absolute top-4 right-16 left-4 flex flex-col items-start gap-2">
              {product.badge && <span className={badgeClassName(product.badgeColor)} style={badgeStyle(product.badgeColor)}>{product.badge}</span>}
              {isOutOfStock && <span className="rounded-full bg-gray-900/80 px-3 py-1.5 text-xs font-bold text-white">Out of Stock</span>}
            </div>}
            {/* fav btn */}
            <button
              onClick={handleToggleFavorite}
              style={{ background: "var(--bg-card)" }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center  rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 group/btn"
              aria-label="Add to wishlist"
            >
              {/* <Heart className="w-5 h-5 text-slate-400 group-hover/btn:text-red-500 group-hover/btn:fill-red-500 transition-colors duration-300" /> */}
              <Heart
                className={`w-5 h-5 transition-colors duration-300 ${
                  isFavorite
                    ? "text-red-500 fill-red-500"
                    : "text-slate-400 group-hover/btn:text-red-500 group-hover/btn:fill-red-500"
                }`}
              />
            </button>
          </div>

          {/*  Thumbnails */}
          <div className="flex gap-3">
            {gallery.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  selectedImage === index
                    ? "border-blue-600 scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  onError={useProductImageFallback}
                  alt={`thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* info*/}
        <div className="w-full md:w-1/2 flex flex-col justify-center gap-5">
          {/* category*/}
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-xs font-bold tracking-wider uppercase "
          >
            {product.category} Edition
          </p>

          <h1
            style={{ color: "var(--text-primary)" }}
            className="text-3xl font-bold leading-snug "
          >
            {product.title}
          </h1>

          {/* rate */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`w-5 h-5 ${
                    index < roundedRating
                      ? "text-[#2563EB] fill-[#2563EB]"
                      : "text-gray-200 fill-transparent"
                  }`}
                />
              ))}
            </div>
            <span
              style={{ color: "var(--text-secondary)" }}
              className="text-sm font-semibold "
            >
              {product.rating > 0 ? `${Number(product.rating).toFixed(1)} / 5` : "Not rated yet"}
            </span>
          </div>

          {/* price */}
          <ProductPrice product={product} size="lg" className="font-sans" />

          {/* discription */}
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-sm leading-relaxed "
          >
            {product.description}
          </p>

          {/* stock */}
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-sm font-medium"
          >
            Stock:{" "}
            {isOutOfStock ? (
              <span className="text-red-500 font-bold">Out of stock</span>
            ) : (
              <span className="text-green-500 font-bold">
                {availableStock} available
              </span>
            )}
          </p>

          {/* quantity */}
          <div className="flex items-center gap-4">
            <span
              style={{ color: "var(--text-primary)" }}
              className="text-sm font-semibold"
            >
              Quantity:
            </span>
            <div
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
              }}
              className="flex items-center gap-3 border rounded-2xl px-4 py-2"
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock}
                style={{ color: "var(--text-secondary)" }}
                className="hover:text-blue-600 transition-colors active:scale-95"
              >
                <Minus size={16} />
              </button>
              <span
                style={{ color: "var(--text-primary)" }}
                className="w-6 text-center font-bold"
              >
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(availableStock, q + 1))
                }
                disabled={isOutOfStock}
                style={{ color: "var(--text-secondary)" }}
                className="hover:text-blue-600 transition-colors active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center cursor-pointer gap-2 py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              <ShoppingCart size={20} />
              {isOutOfStock ? "Out Of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={handleToggleFavorite}
              style={{
                borderColor: isFavorite ? "#ef4444" : "var(--border-color)",
                background: isFavorite ? "#fef2f2" : "var(--bg-card)",
              }}
              className="w-14 h-14 flex items-center justify-center border rounded-2xl transition-all active:scale-95 group/btn"
            >
              {/* <Heart className="w-5 h-5 text-slate-400 cursor-pointer group-hover/btn:text-red-500 group-hover/btn:fill-red-500 transition-colors duration-300" /> */}
              <Heart
                className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                  isFavorite
                    ? "text-red-500 fill-red-500"
                    : "text-slate-400 group-hover/btn:text-red-500 group-hover/btn:fill-red-500"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2
            style={{ color: "var(--text-primary)" }}
            className="text-2xl font-bold mb-6"
          >
            You might also like
          </h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
