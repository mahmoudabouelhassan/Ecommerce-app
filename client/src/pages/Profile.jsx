import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Banknote, Heart, LoaderCircle, Package, Search, ShoppingCart, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { getSwalThemeOptions } from "../utils/swalTheme";
import { useCancelCashOnDeliveryOrderMutation, useGetMyOrdersQuery } from "../features/products/productsApiSlice";

const money = (amount) => `$${Number(amount).toFixed(2)}`;

function orderCategory(order) {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "stock_issue") return "review";
  if (order.paymentStatus === "failed") return "failed";
  if (order.paymentStatus === "paid") return "paid";
  return order.paymentMethod === "cash_on_delivery" ? "due" : "awaiting_card";
}

const categoryLabels = {
  cancelled: "Cancelled",
  review: "Needs stock review",
  failed: "Payment failed",
  paid: "Paid",
  due: "Due on delivery",
  awaiting_card: "Awaiting card payment",
};

function Profile() {
  const { user } = useSelector((state) => state.auth);
  const { data: orders = [], isLoading, isError, refetch } = useGetMyOrdersQuery();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelCashOnDeliveryOrderMutation();
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const query = search.trim().toLowerCase();
  const visibleOrders = orders
    .filter((order) => {
      const matchesStatus = statusFilter === "all" || orderCategory(order) === statusFilter;
      const matchesPayment = paymentFilter === "all" ||
        (paymentFilter === "cash" && order.paymentMethod === "cash_on_delivery") ||
        (paymentFilter === "card" && order.paymentMethod !== "cash_on_delivery");
      const matchesSearch = !query || [order._id, ...order.items.map((item) => item.title)]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesStatus && matchesPayment && matchesSearch;
    })
    .sort((a, b) => sortBy === "newest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setSortBy("newest");
  };

  const handleCancel = async (order) => {
    const result = await Swal.fire({
      ...getSwalThemeOptions(),
      title: "Cancel this order?",
      text: `Order #${order._id} will be cancelled and its reserved stock released.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel order",
      cancelButtonText: "Keep my order",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setActiveId(order._id);
    try {
      await cancelOrder(order._id).unwrap();
      await Swal.fire({
        ...getSwalThemeOptions(),
        title: "Order cancelled",
        text: `Order #${order._id} has been cancelled.`,
        icon: "success",
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      await Swal.fire({
        ...getSwalThemeOptions(),
        title: "Could not cancel order",
        text: error.data?.message || "Refresh your orders and try again.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setActiveId(null);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12" style={{ background: "var(--bg-primary)" }}>
      <div className="mb-8 rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{user?.name}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{user?.email}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { to: "/cart", label: "My Cart", icon: ShoppingCart },
          { to: "/wishlist", label: "My Wishlist", icon: Heart },
            ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin Dashboard", icon: Banknote }] : []),
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-md" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
            <Icon className="text-blue-600" size={22} aria-hidden="true" /><span className="font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}><Package size={22} /> My Orders</h2>
        {!isLoading && !isError && <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{orders.length} total</span>}
      </div>

      {!isLoading && !isError && orders.length > 0 && (
        <section className="mb-5 rounded-2xl border p-4" aria-label="Filter my orders" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_150px_140px]">
            <div>
              <label htmlFor="my-order-search" className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Search orders</label>
              <div className="flex items-center gap-2 rounded-xl border px-3" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
                <Search size={18} className="shrink-0 text-blue-600" aria-hidden="true" />
                <input id="my-order-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order ID or product" className="w-full bg-transparent py-2.5 text-sm outline-none" style={{ color: "var(--text-primary)" }} />
              </div>
            </div>
            <div>
              <label htmlFor="my-order-status" className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Status</label>
              <select id="my-order-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                <option value="all">All statuses</option>
                <option value="due">Due on delivery</option>
                <option value="awaiting_card">Awaiting card payment</option>
                <option value="paid">Paid</option>
                <option value="review">Needs stock review</option>
                <option value="failed">Payment failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="my-order-method" className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Payment method</label>
              <select id="my-order-method" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                <option value="all">All methods</option>
                <option value="card">Card</option>
                <option value="cash">Cash on delivery</option>
              </select>
            </div>
            <div>
              <label htmlFor="my-order-sort" className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Sort by</label>
              <select id="my-order-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span>Showing {visibleOrders.length} of {orders.length} orders</span>
            <button type="button" onClick={clearFilters} className="font-semibold text-blue-600 hover:underline">Clear filters</button>
          </div>
        </section>
      )}

      {isLoading ? <div role="status" aria-label="Loading orders" className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /> :
        isError ? <p role="alert" style={{ color: "var(--text-primary)" }}>Could not load orders. <button type="button" onClick={refetch} className="font-semibold text-blue-600 underline">Retry</button></p> :
          orders.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>You haven't placed any orders yet.</p> :
            visibleOrders.length === 0 ? <div className="rounded-2xl border p-8 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>No orders match these filters. <button type="button" onClick={clearFilters} className="font-semibold text-blue-600 underline">Clear filters</button></div> : (
              <div className="space-y-4">
                {visibleOrders.map((order) => {
                  const category = orderCategory(order);
                  const isCash = order.paymentMethod === "cash_on_delivery";
                  const canCancel = isCash && order.paymentStatus === "unpaid" && order.status === "pending";
                  const badgeStyle = category === "paid" ? "bg-green-100 text-green-700" : category === "review" || category === "failed" ? "bg-red-100 text-red-700" : category === "cancelled" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800";
                  return (
                    <article key={order._id} className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span><span className="break-all">#{order._id}</span>
                      </div>
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{isCash ? "Cash on delivery" : "Card"}</span>
                        <span className={`rounded-full px-3 py-1 ${badgeStyle}`}>{categoryLabels[category]}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 capitalize text-slate-700">{String(order.status || "pending").replaceAll("_", " ")}</span>
                      </div>
                      {category === "review" && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Your card payment was received, but this order needs a stock review. Please contact the store.</p>}
                      <div className="mb-3 space-y-2">
                        {order.items.map((item, index) => (
                          <div key={`${item.productId}-${index}`} className="flex justify-between gap-3 text-sm" style={{ color: "var(--text-primary)" }}>
                            <span>{item.title} × {item.quantity}</span><span className="font-semibold text-blue-600">{money(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between border-t pt-3 font-bold" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                        <span>{category === "due" ? "Amount due on delivery" : "Total"}</span>
                        <span className="text-blue-600">{money(order.totalPrice)}</span>
                      </div>
                      {canCancel && (
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => handleCancel(order)}
                          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-500/60 bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:border-red-600 enabled:hover:bg-red-600 enabled:hover:text-white enabled:hover:shadow-md enabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-50"
                        >
                          {activeId === order._id ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <XCircle size={17} aria-hidden="true" />}
                          {activeId === order._id ? "Cancelling..." : "Cancel order"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
    </main>
  );
}

export default Profile;
