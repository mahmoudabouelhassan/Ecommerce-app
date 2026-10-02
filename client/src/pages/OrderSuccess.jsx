import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { CheckCircle, LoaderCircle } from "lucide-react";
import { clearCart } from "../features/cart/cartSlice";
import { productsApiSlice, useGetMyOrdersQuery } from "../features/products/productsApiSlice";

function OrderSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const dispatch = useDispatch();
  const { data: orders = [], isLoading, isError, refetch } = useGetMyOrdersQuery(undefined, { skip: !sessionId, pollingInterval: 3000 });
  const order = orders.find((item) => item.stripeSessionId === sessionId && item.paymentMethod === "card");
  const isPaid = order?.paymentStatus === "paid";
  const needsStockReview = order?.status === "stock_issue";

  useEffect(() => {
    if (isPaid) {
      dispatch(clearCart());
      dispatch(productsApiSlice.util.invalidateTags(["Product"]));
    }
  }, [dispatch, isPaid]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-xl rounded-3xl border p-8 text-center shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        {isPaid ? <CheckCircle className="mx-auto mb-5 text-green-500" size={64} aria-hidden="true" /> : <LoaderCircle className="mx-auto mb-5 animate-spin text-blue-600" size={56} aria-hidden="true" />}
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          {isPaid ? needsStockReview ? "Payment received — stock review needed" : "Payment confirmed" : "Checking your payment"}
        </h1>
        <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
          {isPaid ? needsStockReview ? "Your card payment was received, but the order needs a stock review. Please contact the store." : "Your card payment is confirmed and your order is being processed." :
            isError ? "We couldn't check the order right now. Your payment may still be processing." :
              !sessionId ? "The checkout session was not found. Check your order history for the latest status." :
                isLoading ? "Loading your order..." : "Stripe is finishing payment confirmation. This page checks automatically every few seconds."}
        </p>
        {order && <p className="mt-4 break-all text-sm" style={{ color: "var(--text-secondary)" }}>Order #{order._id}</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {isError && <button type="button" onClick={refetch} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Try again</button>}
          <Link to="/profile" className="rounded-xl border px-5 py-3 font-semibold" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>View my orders</Link>
          {isPaid && <Link to="/" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Continue shopping</Link>}
        </div>
      </div>
    </main>
  );
}

export default OrderSuccess;
