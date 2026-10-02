import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Star, Trash2, ShoppingCart } from "lucide-react";
import { removeFromWishlist } from "../features/wishlist/wishlistSlice";
import { addToCart } from "../features/cart/cartSlice";
import { getProductImage, useProductImageFallback } from "../utils/productImage";
import { badgeClassName, badgeStyle } from "../utils/productBadge";
import ProductPrice from "../components/ProductPrice";

function Wishlist() {
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    dispatch(addToCart(product));
  };

  const handleRemoveFromWishlist = (e, id) => {
    e.stopPropagation();
    dispatch(removeFromWishlist(id));
  };

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div
        style={{ background: "var(--bg-primary)" }}
        className="flex justify-center items-center h-screen w-full"
      >
        <div className="flex flex-col items-center gap-6">
          <h1
            style={{ color: "var(--text-primary)" }}
            className="text-4xl md:text-5xl font-extrabold text-center"
          >
            Your wishlist is <span className="text-blue-600">empty</span>
          </h1>
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-lg text-center max-w-md"
          >
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/"
            // className="px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-105 active:scale-95 transition-all duration-300"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl transition-all active:scale-95"
          >
            Go To Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--bg-primary)" }}
      className="max-w-7xl mx-auto px-4 py-12 min-h-screen"
    >
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"> */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold "
          style={{ color: "var(--text-primary)" }}
        >
          My Wishlist
        </h1>
        <p
          className=" text-sm mt-1 "
          style={{ color: "var(--text-secondary)" }}
        >
          You have{" "}
          <span className="text-blue-600 font-bold">
            {wishlistItems.length}
          </span>{" "}
          items in your wishlist
        </p>
      </div>

      {/* Grid Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlistItems.map((product) => {
          const roundedRating = Math.round(product.rating || 4);

          return (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              style={{ background: "var(--bg-card)" }}
              className="group flex flex-col w-full mx-auto cursor-pointer transition-all duration-300 rounded-3xl p-2"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-secondary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--bg-card)")
              }
            >
              {/* Image Container */}
              <div
                className="relative aspect-4/5 w-full rounded-3xl overflow-hidden  bg-[#F3F4F6]"
                style={{ background: "var(--bg-card)" }}
              >
                <img
                  src={getProductImage(product)}
                  onError={useProductImageFallback}
                  alt={product.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {product.badge && <span className={`absolute top-4 left-4 ${badgeClassName(product.badgeColor)}`} style={badgeStyle(product.badgeColor)}>{product.badge}</span>}

                {/* Remove from Wishlist Button */}
                <button
                  onClick={(e) => handleRemoveFromWishlist(e, product.id)}
                  className="absolute top-4 right-4 cursor-pointer w-10 h-10 flex items-center justify-center bg-white hover:bg-red-500 text-gray-500 hover:text-white rounded-full shadow-sm transition-all active:scale-95"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-5 h-5 " />
                </button>

                {/* Quick Add to Cart */}
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  style={{
                    color: "var(--text-primary)",
                  }}
                  className="absolute bottom-4 left-1/2 cursor-pointer -translate-x-1/2 w-[90%] py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>

              {/* Product Details */}
              {/* <div className="mt-4 px-2 flex-1 flex flex-col justify-between"> */}
              <div className="mt-4 px-2">
                {/* Rating */}
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
                    className=" text-sm font-semibold"
                    style={{
                      color: "var(--text-secondary)",
                    }}
                  >
                    ({product.stock * 2 - 8 || 42})
                  </span>
                </div>

                <h3
                  className="text-lg font-semibold line-clamp-1 "
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  {product.title}
                </h3>

                <p
                  className="text-xs font-bold   uppercase mt-1"
                  style={{
                    color: "var(--text-secondary)",
                  }}
                >
                  {product.category} Edition
                </p>
              </div>

              <ProductPrice product={product} className="mt-3" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Wishlist;
