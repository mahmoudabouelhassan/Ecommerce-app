import { useState } from "react";
import Swal from "sweetalert2";
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from "../../features/products/productsApiSlice";
import { getSwalThemeOptions } from "../../utils/swalTheme";

export default function AdminSettings() {
  const { data, isLoading, isError, refetch } = useGetAdminSettingsQuery();
  if (isLoading) return <p role="status">Loading settings…</p>;
  if (isError) return <p role="alert">Could not load settings. <button onClick={refetch} className="cursor-pointer text-blue-600 underline">Retry</button></p>;
  return <SettingsForm key={JSON.stringify(data)} data={data} />;
}

function SettingsForm({ data }) {
  const [save, { isLoading: isSaving }] = useUpdateAdminSettingsMutation();
  const [form, setForm] = useState({ storeName: data.storeName, supportEmail: data.supportEmail, lowStockThreshold: data.lowStockThreshold });
  const submit = async (event) => {
    event.preventDefault();
    try {
      await save({ ...form, lowStockThreshold: Number(form.lowStockThreshold) }).unwrap();
      await Swal.fire({ ...getSwalThemeOptions(), title: "Settings saved", icon: "success", timer: 1500, showConfirmButton: false });
    } catch (error) { await Swal.fire({ ...getSwalThemeOptions(), title: "Could not save settings", text: error.data?.message || "Try again.", icon: "error" }); }
  };
  return <section className="max-w-2xl"><h2 className="text-2xl font-bold">General settings</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Store identity and inventory alerts.</p><form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
    <label className="block text-sm font-semibold">Store name<input required minLength={2} maxLength={60} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-blue-500" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }} /><span className="mt-1 block text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Shown in the navigation and footer.</span></label>
    <label className="block text-sm font-semibold">Support email<input required type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-blue-500" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }} /><span className="mt-1 block text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Shown in the footer.</span></label>
    <label className="block text-sm font-semibold">Low stock alert threshold<input required type="number" min="1" max="100" step="1" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-blue-500" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }} /><span className="mt-1 block text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Products with 1 to this number of units appear as low stock. Zero stock is shown separately.</span></label>
    <button type="submit" disabled={isSaving} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{isSaving ? "Saving…" : "Save settings"}</button>
  </form></section>;
}
