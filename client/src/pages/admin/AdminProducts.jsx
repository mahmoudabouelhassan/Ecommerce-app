import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PackagePlus, Search, X, SlidersHorizontal, RefreshCw, FileJson, Trash2, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";
import { getSwalThemeOptions } from "../../utils/swalTheme";
import { useGetAdminProductsQuery, useCreateAdminProductMutation, useUpdateAdminProductMutation, useAdjustAdminStockMutation, useArchiveAdminProductMutation, useRestoreAdminProductMutation, useGetStockAdjustmentsQuery, useGetAdminCategoriesQuery, useGetAdminBadgesQuery, useCreateBadgeMutation } from "../../features/products/productsApiSlice";
import AdminImportProducts from "./AdminImportProducts";
import { getProductImage, useProductImageFallback } from "../../utils/productImage";
import { badgeClassName, badgeStyle } from "../../utils/productBadge";
import BadgeColorField from "../../components/BadgeColorField";
import ProductPrice from "../../components/ProductPrice";
import { previewDiscountedPrice } from "../../utils/productPricing";

const emptyProduct = { title: "", price: "", category: "", image: "", images: "", description: "", stock: "0", badge: "", badgeColor: "blue", discountMode: "none", discountValue: "" };
const inputClass = "mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-blue-500";
const inputStyle = { background: "var(--bg-secondary)", borderColor: "var(--border-color)", color: "var(--text-primary)" };

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);
  const stock = ["all", "low", "out", "archived"].includes(params.get("stock")) ? params.get("stock") : "all";
  const search = params.get("search") || "";
  const [searchText, setSearchText] = useState(search);
  const [editing, setEditing] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);
  const [customBadge, setCustomBadge] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [stockForm, setStockForm] = useState({ change: "", reason: "" });
  const { data, isLoading, isFetching, isError, refetch } = useGetAdminProductsQuery({ page, stock, search });
  const { data: adjustments = [] } = useGetStockAdjustmentsQuery();
  const { data: adminCategories = [] } = useGetAdminCategoriesQuery();
  const { data: badges = [] } = useGetAdminBadgesQuery();
  const categories = adminCategories.map((item) => item.name);
  const [createProduct, { isLoading: isCreating }] = useCreateAdminProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateAdminProductMutation();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustAdminStockMutation();
  const [archiveProduct, { isLoading: isArchiving }] = useArchiveAdminProductMutation();
  const [restoreProduct, { isLoading: isRestoring }] = useRestoreAdminProductMutation();
  const [createBadge, { isLoading: isCreatingBadge }] = useCreateBadgeMutation();

  useEffect(() => {
    if (searchText === search) return;
    const timeout = setTimeout(() => setParams((current) => { const next = new URLSearchParams(current); if (searchText.trim()) next.set("search", searchText.trim()); else next.delete("search"); next.delete("page"); return next; }), 350);
    return () => clearTimeout(timeout);
  }, [searchText, search, setParams]);

  const changeFilter = (key, value) => setParams((current) => { const next = new URLSearchParams(current); if (value === "all" || !value) next.delete(key); else next.set(key, value); next.delete("page"); return next; });
  const goToPage = (nextPage) => {
    setParams((current) => { const next = new URLSearchParams(current); next.set("page", nextPage); return next; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const startCreate = () => { setEditing("new"); setStockProduct(null); setCustomCategory(false); setCustomBadge(false); setForm(emptyProduct); };
  const startEdit = (product) => { const category = categories.find((name) => name.toLowerCase() === product.category.trim().toLowerCase()); const discounted = Number.isFinite(product.originalPrice) && product.originalPrice > product.price; const discountMode = discounted ? (product.discountMode === "percentage" ? "percentage" : "price") : "none"; setEditing(product); setStockProduct(null); setCustomCategory(!category); setCustomBadge(false); setForm({ title: product.title, price: String(product.originalPrice ?? product.price), category: category || product.category, image: product.image || "", images: (product.images || []).filter((url) => url !== product.image).join("\n"), description: product.description || "", stock: String(product.stock), badge: product.badge || "", badgeColor: "blue", discountMode, discountValue: discountMode === "percentage" ? String(product.discountPercent) : discountMode === "price" ? String(product.price) : "" }); };
  const startStock = (product) => { setStockProduct(product); setEditing(null); setStockForm({ change: "", reason: "" }); };
  const notifyError = (error, fallback) => Swal.fire({ ...getSwalThemeOptions(), title: fallback, text: error.data?.message || "Please try again.", icon: "error" });

  const removeProduct = async (product) => {
    const confirmation = await Swal.fire({
      ...getSwalThemeOptions(), title: `Delete ${product.title}?`,
      text: "It will disappear from the store and cannot be purchased. Past orders will keep their product record, and you can restore it later.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Remove from store", confirmButtonColor: "#dc2626",
    });
    if (!confirmation.isConfirmed) return;
    try { await archiveProduct(product._id).unwrap(); Swal.fire({ ...getSwalThemeOptions(), title: "Product removed", icon: "success", timer: 1500, showConfirmButton: false }); }
    catch (error) { notifyError(error, "Could not remove product"); }
  };

  const restoreRemovedProduct = async (product) => {
    try { await restoreProduct(product._id).unwrap(); Swal.fire({ ...getSwalThemeOptions(), title: "Product restored", icon: "success", timer: 1500, showConfirmButton: false }); }
    catch (error) { notifyError(error, "Could not restore product"); }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const body = { title: form.title.trim(), price: Number(form.price), category: form.category.trim(), image: form.image.trim(), images: form.images.split("\n").map((value) => value.trim()).filter(Boolean), description: form.description.trim(), badge: form.badge.trim(), discount: form.discountMode === "none" ? { type: "none" } : { type: form.discountMode, value: Number(form.discountValue) } };
    if (editing === "new") body.stock = Number(form.stock);
    try {
      if (customBadge) {
        const badge = await createBadge({ name: body.badge, color: form.badgeColor }).unwrap();
        body.badge = badge.name;
      }
      if (editing === "new") await createProduct(body).unwrap();
      else await updateProduct({ id: editing._id, body }).unwrap();
      setEditing(null);
      Swal.fire({ ...getSwalThemeOptions(), title: editing === "new" ? "Product added" : "Product updated", icon: "success", timer: 1500, showConfirmButton: false });
    } catch (error) { notifyError(error, "Could not save product"); }
  };

  const saveStock = async (event) => {
    event.preventDefault();
    try {
      await adjustStock({ id: stockProduct._id, change: Number(stockForm.change), reason: stockForm.reason.trim() }).unwrap();
      setStockProduct(null);
      Swal.fire({ ...getSwalThemeOptions(), title: "Stock updated", icon: "success", timer: 1500, showConfirmButton: false });
    } catch (error) { notifyError(error, "Could not update stock"); }
  };

  const previewPrice = previewDiscountedPrice(form.price, form.discountMode, form.discountValue);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Products & inventory</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Create products, import JSON, and track stock changes.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowImport(true)} className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 font-semibold transition hover:border-blue-500 hover:text-blue-600" style={{ borderColor: "var(--border-color)" }}><FileJson size={18} />Import JSON</button><button type="button" onClick={startCreate} className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"><PackagePlus size={18} />Add product</button></div></div>
    <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><label className="text-sm font-semibold">Search products<div className="mt-1 flex items-center gap-2 rounded-xl border px-3" style={inputStyle}><Search size={17} className="text-blue-600" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Name or category" className="w-full bg-transparent py-2.5 outline-none" /></div></label><label className="text-sm font-semibold">Product status<select value={stock} onChange={(event) => changeFilter("stock", event.target.value)} className={inputClass} style={inputStyle}><option value="all">Active products</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="archived">Removed products</option></select></label><button type="button" onClick={refetch} disabled={isFetching} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:text-blue-600 disabled:opacity-50" style={{ borderColor: "var(--border-color)" }}><RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />Refresh</button></div>
    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{data ? `${data.total} products · Low stock at ${data.lowStockThreshold} units or fewer` : ""}</p>
    {isLoading ? <p role="status">Loading products…</p> : isError ? <p role="alert">Could not load products. <button onClick={refetch} className="cursor-pointer text-blue-600 underline">Retry</button></p> : data.products.length === 0 ? <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>{stock === "archived" ? "No removed products." : "No products match this filter."}</div> : <div className="space-y-3">{data.products.map((product) => <article key={product._id} className="flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><img src={getProductImage(product)} onError={useProductImageFallback} alt="" className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><h3 className="truncate font-bold">{product.title}</h3><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{product.category}</p><ProductPrice product={product} size="sm" showPercent={false} className="mt-1" />{product.badge && <span className={`mt-2 ${badgeClassName(product.badgeColor)}`} style={badgeStyle(product.badgeColor)}>{product.badge}</span>}</div><div className="text-right"><p className={`font-bold ${product.archivedAt ? "text-slate-500" : product.stock === 0 ? "text-red-600" : product.stock <= data.lowStockThreshold ? "text-amber-600" : "text-green-600"}`}>{product.stock} in stock</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{product.archivedAt ? "Removed from store" : product.stock === 0 ? "Out of stock" : product.stock <= data.lowStockThreshold ? "Low stock" : "Available"}</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><button type="button" onClick={() => startEdit(product)} className="flex-1 cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition hover:border-blue-500 hover:text-blue-600" style={{ borderColor: "var(--border-color)" }}>Edit</button>{product.archivedAt ? <button type="button" disabled={isRestoring} onClick={() => restoreRemovedProduct(product)} className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"><RotateCcw size={15} />Restore</button> : <><button type="button" onClick={() => startStock(product)} className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"><SlidersHorizontal size={15} />Stock</button><button type="button" disabled={isArchiving} onClick={() => removeProduct(product)} className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"><Trash2 size={15} />Delete</button></>}</div></article>)}</div>}
    {data?.totalPages > 1 && <nav aria-label="Product pages" className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="cursor-pointer rounded-xl border px-3 py-2 disabled:opacity-40" style={{ borderColor: "var(--border-color)" }}>Previous</button><span className="text-sm">Page {page} of {data.totalPages}</span><button type="button" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)} className="cursor-pointer rounded-xl border px-3 py-2 disabled:opacity-40" style={{ borderColor: "var(--border-color)" }}>Next</button></nav>}
    <section className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><h3 className="font-bold">Recent manual stock changes</h3><div className="mt-3 space-y-2">{adjustments.length ? adjustments.map((entry) => <p key={entry._id} className="border-b pb-2 text-sm last:border-0" style={{ borderColor: "var(--border-color)" }}><strong>{entry.product?.title || "Removed product"}</strong> <span className={entry.change > 0 ? "text-green-600" : "text-red-600"}>{entry.change > 0 ? "+" : ""}{entry.change}</span> ({entry.before} → {entry.after}) · {entry.reason} <span style={{ color: "var(--text-secondary)" }}>· {entry.admin?.name || "Admin"} · {new Date(entry.createdAt).toLocaleString()}</span></p>) : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No adjustments recorded yet.</p>}</div></section>
    {(editing || stockProduct) && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditing(null); setStockProduct(null); } }}><div role="dialog" aria-modal="true" aria-label={editing ? "Product details" : "Adjust stock"} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl p-6 shadow-2xl" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}><div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-bold">{editing ? editing === "new" ? "Add product" : "Edit product" : `Adjust stock · ${stockProduct.title}`}</h3><button type="button" aria-label="Close" onClick={() => { setEditing(null); setStockProduct(null); }} className="cursor-pointer rounded-full p-1 hover:bg-blue-500/10"><X size={22} /></button></div>
      {editing ? <form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">Product name<input required minLength={2} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} style={inputStyle} /></label>
        <label className="text-sm font-semibold">Original price (USD)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} style={inputStyle} /></label>
        <label className="text-sm font-semibold">Category<select required value={customCategory ? "__new__" : form.category} onChange={(e) => { if (e.target.value === "__new__") { setCustomCategory(true); setForm({ ...form, category: "" }); } else { setCustomCategory(false); setForm({ ...form, category: e.target.value }); } }} className={inputClass} style={inputStyle}><option value="" disabled>Choose a category</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}<option value="__new__">+ Add a new category</option></select></label>
        {customCategory && <label className="text-sm font-semibold sm:col-span-2">New category name<input required minLength={2} maxLength={60} autoFocus value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} style={inputStyle} /></label>}
        <div className="grid gap-3 rounded-xl border p-3 sm:col-span-2 sm:grid-cols-2" style={{ borderColor: "var(--border-color)" }}>
          <label className="text-sm font-semibold">Discount<select value={form.discountMode} onChange={(event) => setForm({ ...form, discountMode: event.target.value, discountValue: "" })} className={inputClass} style={inputStyle}><option value="none">No discount</option><option value="price">Enter final price</option><option value="percentage">Percentage off</option></select></label>
          {form.discountMode === "price" && <label className="text-sm font-semibold">Final price after discount (USD)<input required type="number" min="0.01" step="0.01" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} className={inputClass} style={inputStyle} /></label>}
          {form.discountMode === "percentage" && <label className="text-sm font-semibold">Discount percentage<div className="flex gap-2"><input required type="number" min="0.01" max="99.99" step="0.01" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} className={inputClass} style={inputStyle} /><select aria-label="Choose a discount percentage" value="" onChange={(event) => setForm({ ...form, discountValue: event.target.value })} className="mt-1 rounded-xl border px-2" style={inputStyle}><option value="" disabled>Choose</option>{[5, 10, 15, 20, 25, 30, 50].map((percent) => <option key={percent} value={percent}>{percent}%</option>)}</select></div></label>}
          <p className="self-end text-sm sm:col-span-2" style={{ color: "var(--text-secondary)" }}>{previewPrice === null ? form.discountMode === "none" ? "Enter a valid original price." : "Enter a discount lower than the original price." : <>Customer price: <strong className="text-blue-600">${previewPrice.toFixed(2)}</strong>{form.discountMode !== "none" && <> · Original: <span className="line-through">${Number(form.price).toFixed(2)}</span></>}</>}</p>
        </div>
        <label className="text-sm font-semibold sm:col-span-2">Product badge<select value={customBadge ? "__new__" : form.badge} onChange={(event) => { if (event.target.value === "__new__") { setCustomBadge(true); setForm({ ...form, badge: "", badgeColor: "blue" }); } else { setCustomBadge(false); setForm({ ...form, badge: event.target.value }); } }} className={inputClass} style={inputStyle}><option value="">No badge</option>{badges.map((badge) => <option key={badge._id} value={badge.name}>{badge.name}</option>)}<option value="__new__">+ Add a new badge</option></select></label>
        {customBadge && <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2"><label className="text-sm font-semibold">New badge name<input required minLength={2} maxLength={40} value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} className={inputClass} style={inputStyle} /></label><BadgeColorField value={form.badgeColor} onChange={(color) => setForm({ ...form, badgeColor: color })} previewLabel={form.badge || "Preview"} /></div>}
        <label className="text-sm font-semibold sm:col-span-2">Main image URL (optional)<input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass} style={inputStyle} /><span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Leave blank to show the default product image.</span></label>
        {form.image && <div className="flex items-center gap-3 rounded-xl border p-2 sm:col-span-2" style={{ borderColor: "var(--border-color)" }}><img src={form.image} onError={useProductImageFallback} alt="Product preview" className="h-20 w-20 rounded-lg object-cover" /><span className="text-xs" style={{ color: "var(--text-secondary)" }}>Main image preview. Use a publicly accessible HTTP(S) image URL.</span></div>}
        <label className="text-sm font-semibold sm:col-span-2">More image URLs (optional, one per line)<textarea rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className={inputClass} style={inputStyle} /><span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Up to 8 images total. If there is no main image, the first gallery image becomes the main image.</span></label>
        <label className="text-sm font-semibold sm:col-span-2">Description<textarea rows={4} maxLength={3000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} style={inputStyle} /><span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{form.description.length}/3000 characters</span></label>
        {editing === "new" && <label className="text-sm font-semibold">Initial stock<input required type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} style={inputStyle} /></label>}
        <div className="flex flex-wrap gap-2 sm:col-span-2"><button type="submit" disabled={isCreating || isUpdating || isCreatingBadge} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isCreating || isUpdating || isCreatingBadge ? "Saving…" : "Save product"}</button><button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-xl border px-5 py-2.5 font-semibold hover:border-blue-500" style={{ borderColor: "var(--border-color)" }}>Cancel</button></div>
      </form> : <form onSubmit={saveStock} className="space-y-4"><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Current stock: <strong>{stockProduct.stock}</strong>. Enter a positive number to add units or a negative number to remove units. Order reservations update stock automatically.</p><label className="block text-sm font-semibold">Change in units<input required type="number" step="1" min="-100000" max="100000" value={stockForm.change} onChange={(e) => setStockForm({ ...stockForm, change: e.target.value })} className={inputClass} style={inputStyle} /></label><label className="block text-sm font-semibold">Reason<input required minLength={3} maxLength={200} placeholder="Received shipment, damaged stock…" value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} className={inputClass} style={inputStyle} /></label><button type="submit" disabled={isAdjusting} className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isAdjusting ? "Updating…" : "Update stock"}</button></form>}
    </div></div>}
    {showImport && <AdminImportProducts onClose={() => setShowImport(false)} />}
  </div>;
}
