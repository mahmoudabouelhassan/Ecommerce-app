import { Link } from "react-router-dom";
import { AlertTriangle, Banknote, Boxes, PackageX, RefreshCw, Tags } from "lucide-react";
import { useGetAdminOverviewQuery } from "../../features/products/productsApiSlice";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function AdminOverview() {
  const { data, isLoading, isError, isFetching, refetch } = useGetAdminOverviewQuery();
  if (isLoading) return <p role="status">Loading dashboard…</p>;
  if (isError) return <p role="alert">Could not load dashboard. <button onClick={refetch} className="cursor-pointer font-semibold text-blue-600 underline">Retry</button></p>;
  const cards = [
    { label: "Products", value: data.totalProducts, icon: Boxes, to: "/admin/products" },
    { label: "Low stock", value: data.lowStockCount, icon: AlertTriangle, to: "/admin/products?stock=low" },
    { label: "Out of stock", value: data.outOfStockCount, icon: PackageX, to: "/admin/products?stock=out" },
    { label: "Cash to collect", value: money(data.pendingCashAmount), detail: `${data.pendingCashCount} orders`, icon: Banknote, to: "/admin/cash-orders" },
  ];
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Overview</h2><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Live snapshot of your store.</p></div><button type="button" disabled={isFetching} onClick={refetch} className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:text-blue-600 disabled:opacity-50" style={{ borderColor: "var(--border-color)" }}><RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />Refresh</button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, to }) => <Link key={label} to={to} className="rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><Icon size={22} className="text-blue-600" /><p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>{label}</p><p className="text-2xl font-bold">{value}</p>{detail && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{detail}</p>}</Link>)}</div>
    <Link to="/admin/catalog" className="flex items-center justify-between gap-3 rounded-2xl border p-4 transition hover:border-blue-500 hover:bg-blue-500/5" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><span className="flex items-center gap-3"><Tags size={20} className="text-blue-600" /><span><strong className="block">Categories & badges</strong><span className="text-xs" style={{ color: "var(--text-secondary)" }}>Organize product categories and storefront labels</span></span></span><span aria-hidden="true" className="text-blue-600">→</span></Link>
    {data.stockIssueCount > 0 && <Link to="/admin/cash-orders" className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 font-semibold text-red-800"><AlertTriangle size={20} />{data.stockIssueCount} paid card order{data.stockIssueCount === 1 ? "" : "s"} need stock review →</Link>}
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Inventory alerts</h3><Link to="/admin/products?stock=low" className="text-sm font-semibold text-blue-600 hover:underline">Manage stock →</Link></div><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Alert threshold: {data.lowStockThreshold} units</p><div className="mt-4 space-y-3">{data.lowStockProducts.length ? data.lowStockProducts.map((product) => <div key={product._id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0" style={{ borderColor: "var(--border-color)" }}><span className="truncate">{product.title}</span><span className={product.stock === 0 ? "font-bold text-red-600" : "font-bold text-amber-600"}>{product.stock} left</span></div>) : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>All products are above the alert threshold.</p>}</div></section>
      <section className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><h3 className="font-bold">Recent stock changes</h3><div className="mt-4 space-y-3">{data.recentAdjustments.length ? data.recentAdjustments.map((entry) => <div key={entry._id} className="border-b pb-2 text-sm last:border-0" style={{ borderColor: "var(--border-color)" }}><div className="flex justify-between gap-2"><span className="truncate font-semibold">{entry.product?.title || "Removed product"}</span><span className={entry.change > 0 ? "text-green-600" : "text-red-600"}>{entry.change > 0 ? "+" : ""}{entry.change}</span></div><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{entry.reason} · {entry.admin?.name || "Admin"} · {new Date(entry.createdAt).toLocaleString()}</p></div>) : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No manual stock changes yet.</p>}</div></section>
    </div>
  </div>;
}
