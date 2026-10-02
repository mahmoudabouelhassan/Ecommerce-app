import { useState } from "react";
import { AlertTriangle, Banknote, LoaderCircle, RotateCcw, Search } from "lucide-react";
import Swal from "sweetalert2";
import { getSwalThemeOptions } from "../utils/swalTheme";
import {
  useConfirmCashCollectionMutation,
  useGetCashOnDeliveryOrdersQuery,
  useGetStockIssuesQuery,
} from "../features/products/productsApiSlice";

const money = (amount) => `$${Number(amount).toFixed(2)}`;
const isAwaiting = (order) => order.paymentStatus === "unpaid" && order.status !== "cancelled";

function AdminCashOrders() {
  const { data: orders = [], isLoading, isFetching, isError, refetch } = useGetCashOnDeliveryOrdersQuery();
  const {
    data: stockIssues = [],
    isFetching: isFetchingStockIssues,
    isError: stockIssuesError,
    refetch: refetchStockIssues,
  } = useGetStockIssuesQuery();
  const [confirmCollection, { isLoading: isConfirming }] = useConfirmCashCollectionMutation();
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const isRefreshing = isFetching || isFetchingStockIssues;

  const awaiting = orders.filter(isAwaiting);
  const collected = orders.filter((order) => order.paymentStatus === "paid");
  const cancelled = orders.filter((order) => order.status === "cancelled");
  const outstandingAmount = awaiting.reduce((total, order) => total + order.totalPrice, 0);
  const query = search.trim().toLowerCase();
  const visibleOrders = orders
    .filter((order) => {
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "awaiting" && isAwaiting(order)) ||
        (statusFilter === "collected" && order.paymentStatus === "paid") ||
        (statusFilter === "cancelled" && order.status === "cancelled");
      const matchesSearch = !query || [
        order._id,
        order.shippingInfo?.name,
        order.shippingInfo?.email,
        order.shippingInfo?.phone,
        order.shippingInfo?.city,
        ...order.items.map((item) => item.title),
      ].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => sortBy === "newest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const handleCollection = async (order) => {
    const result = await Swal.fire({
      ...getSwalThemeOptions(),
      title: "Confirm cash collection?",
      text: `Confirm that ${money(order.totalPrice)} was received and order #${order._id} was delivered.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Cash received & delivered",
      cancelButtonText: "Keep order unchanged",
      confirmButtonColor: "#16a34a",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setActiveId(order._id);
    try {
      await confirmCollection(order._id).unwrap();
      await Swal.fire({
        ...getSwalThemeOptions(),
        title: "Collection recorded",
        text: `Order #${order._id} is now paid and delivered.`,
        icon: "success",
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      await Swal.fire({
        ...getSwalThemeOptions(),
        title: "Could not confirm collection",
        text: error.data?.message || "Refresh the orders and try again.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setActiveId(null);
    }
  };

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Banknote className="text-blue-600" size={32} aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Cash on delivery orders</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Record cash only after delivery and collection.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { refetch(); refetchStockIssues(); }}
          disabled={isRefreshing}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:border-blue-500 enabled:hover:bg-blue-500/10 enabled:hover:text-blue-500 enabled:hover:shadow-md enabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-60"
        >
          <RotateCcw size={17} className={isRefreshing ? "animate-spin" : undefined} aria-hidden="true" />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!isError && !isLoading && (
        <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "All cash orders", value: orders.length },
            { label: "Awaiting collection", value: awaiting.length },
            { label: "Cash still due", value: money(outstandingAmount) },
            { label: "Collected", value: collected.length },
            { label: "Cancelled", value: cancelled.length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border p-4 shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{label}</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {stockIssuesError && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">Could not check card orders needing stock review.</p>}
      {stockIssues.length > 0 && (
        <section className="mb-7 rounded-2xl border border-red-300 p-5" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-red-600"><AlertTriangle size={20} aria-hidden="true" /> {stockIssues.length} paid card order{stockIssues.length === 1 ? "" : "s"} need stock review</h2>
          <p className="mb-4 mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>These customers have paid. Arrange fulfillment or refund them in Stripe.</p>
          <div className="space-y-3">
            {stockIssues.map((order) => (
              <div key={order._id} className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
                <p className="break-all font-semibold">Order #{order._id} · {money(order.totalPrice)}</p>
                <p>{order.shippingInfo?.name} · {order.shippingInfo?.email}</p>
                <p className="break-all" style={{ color: "var(--text-secondary)" }}>Stripe session: {order.stripeSessionId}</p>
                <p>{order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isError && !isLoading && orders.length > 0 && (
        <section className="mb-5 rounded-2xl border p-4" aria-label="Filter cash orders" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_170px_auto] md:items-end">
            <div>
              <label htmlFor="cash-order-search" className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Search orders or customers</label>
              <div className="flex items-center gap-2 rounded-xl border px-3" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
                <Search size={18} className="shrink-0 text-blue-600" aria-hidden="true" />
                <input id="cash-order-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order ID, name, email, phone or product" className="w-full bg-transparent py-2.5 text-sm outline-none" style={{ color: "var(--text-primary)" }} />
              </div>
            </div>
            <div>
              <label htmlFor="cash-order-status" className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Collection status</label>
              <select id="cash-order-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                <option value="all">All statuses</option>
                <option value="awaiting">Awaiting collection</option>
                <option value="collected">Collected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="cash-order-sort" className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Sort by</label>
              <select id="cash-order-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            <button type="button" onClick={clearFilters} className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:border-blue-500" style={{ color: "var(--text-primary)", borderColor: "var(--border-color)" }}>Clear</button>
          </div>
        </section>
      )}

      {isLoading ? <div role="status" className="flex items-center gap-2 text-blue-600"><LoaderCircle className="animate-spin" /> Loading orders</div> :
        isError ? <div role="alert" style={{ color: "var(--text-primary)" }}>Could not load cash orders. <button type="button" onClick={refetch} className="font-semibold text-blue-600 underline">Retry</button></div> :
          orders.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No cash on delivery orders yet.</p> :
            visibleOrders.length === 0 ? <div className="rounded-2xl border p-8 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>No orders match these filters. <button type="button" onClick={clearFilters} className="font-semibold text-blue-600 underline">Clear filters</button></div> : (
              <>
                <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>Showing {visibleOrders.length} of {orders.length} cash orders</p>
                <div className="space-y-4">
                  {visibleOrders.map((order) => {
                    const canCollect = isAwaiting(order);
                    const statusLabel = order.status === "cancelled" ? "Cancelled" : order.paymentStatus === "paid" ? "Paid & delivered" : "Awaiting collection";
                    const statusStyle = order.status === "cancelled" ? "bg-slate-100 text-slate-700" : order.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900";
                    return (
                      <article key={order._id} className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{new Date(order.createdAt).toLocaleString()}</p>
                            <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{order.shippingInfo?.name || "Customer"}</h2>
                            <p className="break-all text-xs" style={{ color: "var(--text-secondary)" }}>#{order._id}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xl font-bold text-blue-600">{money(order.totalPrice)}</p>
                            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}>{statusLabel}</span>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2" style={{ color: "var(--text-secondary)" }}>
                          <p><span className="font-semibold" style={{ color: "var(--text-primary)" }}>Delivery:</span> {order.shippingInfo?.address}, {order.shippingInfo?.city}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {order.shippingInfo?.phone && <a className="text-blue-600 hover:underline" href={`tel:${order.shippingInfo.phone}`}>{order.shippingInfo.phone}</a>}
                            {order.shippingInfo?.email && <a className="break-all text-blue-600 hover:underline" href={`mailto:${order.shippingInfo.email}`}>{order.shippingInfo.email}</a>}
                          </div>
                        </div>
                        <div className="mt-4 space-y-1 border-t pt-3 text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                          {order.items.map((item, index) => <p key={`${item.productId}-${index}`}>{item.title} × {item.quantity}</p>)}
                        </div>
                        {canCollect && (
                          <button type="button" disabled={isConfirming} onClick={() => handleCollection(order)} className="mt-4 flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                            {activeId === order._id && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
                            Confirm cash collected & delivered
                          </button>
                        )}
                        {order.paymentStatus === "paid" && order.paidAt && <p className="mt-3 text-xs font-medium text-green-700">Collected on {new Date(order.paidAt).toLocaleString()}</p>}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
    </section>
  );
}

export default AdminCashOrders;
