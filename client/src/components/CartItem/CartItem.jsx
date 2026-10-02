import { Minus, Plus, Trash2 } from "lucide-react";
import { getProductImage, useProductImageFallback } from "../../utils/productImage";
import ProductPrice from "../ProductPrice";

function CartItem({ item, onRemove, onUpdateQuantity }) {
  const isMaxStock = item.stock != null && item.quantity >= item.stock;
  return (
    <div
      className="border  rounded-2xl p-4 flex gap-4 items-center"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* img */}
      <img
        src={getProductImage(item)}
        onError={useProductImageFallback}
        alt={item.title}
        className="w-20 h-20 object-cover rounded-xl shrink-0"
      />

      {/* name , category and price*/}
      <div className="flex-1 min-w-0">
        <p
          style={{ color: "var(--text-primary)" }}
          className="font-semibold  truncate"
        >
          {item.title}
        </p>
        <p
          style={{ color: "var(--text-secondary)" }}
          className="text-xs  uppercase tracking-wider mt-0.5"
        >
          {item.category} Edition
        </p>
        <ProductPrice product={item} quantity={item.quantity} size="sm" showPercent={false} className="mt-1" />
        {isMaxStock && ( //  جديد: رسالة توضيحية لما توصل للحد الأقصى
          <p className="text-xs text-amber-500 font-medium mt-1">
            Max stock reached
          </p>
        )}
      </div>

      {/* quantity and deleting */}
      <div className="flex flex-col items-end gap-3 shrink-0">
        {/* quantity */}
        <div
          style={{ borderColor: "var(--border-color)" }}
          className="flex items-center gap-2 border  rounded-xl px-3 py-1.5"
        >
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className=" hover:text-blue-600 transition-colors active:scale-95"
            style={{ color: "var(--text-secondary)" }}
          >
            <Minus size={14} />
          </button>
          <span
            className="font-bold  w-5 text-center text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isMaxStock}
            className=" hover:text-blue-600 transition-colors active:scale-95"
            style={{ color: "var(--text-secondary)" }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* delete */}
        <button
          onClick={() => onRemove(item.id)}
          className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs transition-colors active:scale-95"
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    </div>
  );
}

export default CartItem;
