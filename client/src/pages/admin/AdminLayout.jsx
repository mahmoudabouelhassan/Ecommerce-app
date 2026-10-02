import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, Banknote, Settings, Tags } from "lucide-react";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products & stock", icon: Package },
  { to: "/admin/catalog", label: "Categories & badges", icon: Tags },
  { to: "/admin/cash-orders", label: "Cash orders", icon: Banknote },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  return <div className="mx-auto max-w-7xl px-4 py-8 lg:py-10" style={{ color: "var(--text-primary)" }}>
    <div className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Store operations</p>
      <h1 className="mt-1 text-3xl font-bold">Admin dashboard</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Manage catalog, inventory, orders and store settings.</p>
    </div>
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto rounded-2xl border p-2 lg:h-fit lg:flex-col" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? "bg-blue-600 text-white" : "hover:bg-blue-500/10 hover:text-blue-600"}`}><Icon size={18} />{label}</NavLink>)}
      </nav>
      <div className="min-w-0"><Outlet /></div>
    </div>
  </div>;
}
