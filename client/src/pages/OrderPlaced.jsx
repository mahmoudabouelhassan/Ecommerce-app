import { Link, useParams } from "react-router-dom";
import { Banknote, CircleCheck } from "lucide-react";
import { useGetMyOrdersQuery } from "../features/products/productsApiSlice";

function OrderPlaced() {
  const { orderId } = useParams();
  const { data: orders = [], isLoading, isError } = useGetMyOrdersQuery();
  const order = orders.find((item) => item._id === orderId && item.paymentMethod === "cash_on_delivery");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border p-8 text-center shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        {isLoading ? (
          <div role="status" className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" aria-label="Loading order" />
        ) : isError || !order ? (
          <>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Order details unavailable</h1>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>You can check your order history in your profile.</p>
          </>
        ) : (
          <>
            <CircleCheck size={64} className="mx-auto mb-5 text-green-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Order placed successfully</h1>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>Your products are reserved. Pay the amount below in cash when your order arrives.</p>
            <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-900">
              <Banknote size={24} className="mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-medium">Amount due on delivery</p>
              <p className="text-3xl font-extrabold">${order.totalPrice.toFixed(2)}</p>
            </div>
            <p className="mt-5 break-all text-sm" style={{ color: "var(--text-secondary)" }}>Order #{order._id}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Delivery to {order.shippingInfo?.name}, {order.shippingInfo?.address}, {order.shippingInfo?.city}</p>
          </>
        )}
        <Link to="/profile" className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">View my orders</Link>
      </div>
    </main>
  );
}

export default OrderPlaced;
