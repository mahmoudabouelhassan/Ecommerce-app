import { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { getSwalThemeOptions } from "../../utils/swalTheme";
import {
  useGetAdminCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
  useGetAdminBadgesQuery, useCreateBadgeMutation, useUpdateBadgeMutation, useDeleteBadgeMutation,
} from "../../features/products/productsApiSlice";
import { badgeClassName, badgeStyle } from "../../utils/productBadge";
import BadgeColorField from "../../components/BadgeColorField";

const fieldClass = "w-full rounded-xl border px-3 py-2.5 outline-none focus:border-blue-500";
const fieldStyle = { background: "var(--bg-secondary)", borderColor: "var(--border-color)" };
const notifyError = (error, title) => Swal.fire({ ...getSwalThemeOptions(), title, text: error?.data?.message || "Please try again.", icon: "error" });

export default function AdminTaxonomy() {
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useGetAdminCategoriesQuery();
  const { data: badges = [], isLoading: badgesLoading, isError: badgesError } = useGetAdminBadgesQuery();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] = useDeleteCategoryMutation();
  const [createBadge, { isLoading: isCreatingBadge }] = useCreateBadgeMutation();
  const [updateBadge, { isLoading: isUpdatingBadge }] = useUpdateBadgeMutation();
  const [deleteBadge, { isLoading: isDeletingBadge }] = useDeleteBadgeMutation();
  const [categoryForm, setCategoryForm] = useState({ key: "", name: "" });
  const [badgeForm, setBadgeForm] = useState({ id: "", name: "", color: "blue" });
  const categoryBusy = isCreatingCategory || isUpdatingCategory || isDeletingCategory;
  const badgeBusy = isCreatingBadge || isUpdatingBadge || isDeletingBadge;

  const saveCategory = async (event) => {
    event.preventDefault();
    try {
      if (categoryForm.key) await updateCategory({ key: categoryForm.key, name: categoryForm.name.trim() }).unwrap();
      else await createCategory({ name: categoryForm.name.trim() }).unwrap();
      setCategoryForm({ key: "", name: "" });
    } catch (error) { notifyError(error, "Could not save category"); }
  };

  const removeCategory = async (category) => {
    const alternatives = categories.filter((item) => item.key !== category.key);
    if (category.totalProducts && !alternatives.length) {
      await Swal.fire({ ...getSwalThemeOptions(), title: "Add another category first", text: "Products need a replacement category before this one can be deleted.", icon: "info" });
      return;
    }
    const confirmation = await Swal.fire({
      ...getSwalThemeOptions(),
      title: `Delete ${category.name}?`,
      text: category.totalProducts ? `${category.totalProducts} products, including removed products, will move to the category you choose.` : "This category has no products.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Delete category", confirmButtonColor: "#dc2626",
      ...(category.totalProducts ? { input: "select", inputPlaceholder: "Choose replacement category", inputOptions: Object.fromEntries(alternatives.map((item) => [item.name, item.name])), inputValidator: (value) => value ? undefined : "Choose a replacement category" } : {}),
    });
    if (!confirmation.isConfirmed) return;
    try {
      await deleteCategory({ key: category.key, replacement: category.totalProducts ? confirmation.value : "" }).unwrap();
      if (categoryForm.key === category.key) setCategoryForm({ key: "", name: "" });
    } catch (error) { notifyError(error, "Could not delete category"); }
  };

  const saveBadge = async (event) => {
    event.preventDefault();
    const body = { name: badgeForm.name.trim(), color: badgeForm.color };
    try {
      if (badgeForm.id) await updateBadge({ id: badgeForm.id, body }).unwrap();
      else await createBadge(body).unwrap();
      setBadgeForm({ id: "", name: "", color: "blue" });
    } catch (error) { notifyError(error, "Could not save badge"); }
  };

  const removeBadge = async (badge) => {
    const confirmation = await Swal.fire({
      ...getSwalThemeOptions(), title: `Delete ${badge.name}?`,
      text: badge.productCount ? `The badge will be removed from ${badge.productCount} products. The products stay in the store.` : "The badge will be removed from the choices.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Delete badge", confirmButtonColor: "#dc2626",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await deleteBadge(badge._id).unwrap();
      if (badgeForm.id === badge._id) setBadgeForm({ id: "", name: "", color: "blue" });
    } catch (error) { notifyError(error, "Could not delete badge"); }
  };

  return <div className="space-y-7">
    <div><h2 className="text-2xl font-bold">Categories & badges</h2><p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Manage the labels used in product forms and storefront cards.</p></div>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-2"><Tags size={20} className="text-blue-600" /><h3 className="text-lg font-bold">Categories</h3></div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Renaming updates assigned products. Deleting a used category moves its products to another category.</p>
        <form onSubmit={saveCategory} className="mt-5 flex flex-wrap items-end gap-2">
          <label className="min-w-48 flex-1 text-sm font-semibold">{categoryForm.key ? "Rename category" : "New category"}<input required minLength={2} maxLength={60} value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} className={`mt-1 ${fieldClass}`} style={fieldStyle} /></label>
          <button disabled={categoryBusy} type="submit" className="flex cursor-pointer items-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Plus size={17} />{categoryForm.key ? "Save" : "Add"}</button>
          {categoryForm.key && <button type="button" onClick={() => setCategoryForm({ key: "", name: "" })} className="cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border-color)" }}>Cancel</button>}
        </form>
        {categoriesLoading ? <p className="mt-5 text-sm">Loading categories…</p> : categoriesError ? <p role="alert" className="mt-5 text-sm text-red-600">Could not load categories.</p> : <div className="mt-5 max-h-[480px] space-y-2 overflow-y-auto">
          {categories.length ? categories.map((category) => <div key={category.key} className="flex flex-wrap items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border-color)" }}>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{category.name}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{category.activeProducts} active · {category.totalProducts} total products</p></div>
            <button type="button" onClick={() => setCategoryForm({ key: category.key, name: category.name })} disabled={categoryBusy} aria-label={`Edit ${category.name}`} className="cursor-pointer rounded-lg border p-2 text-blue-600 hover:bg-blue-500/10 disabled:opacity-50" style={{ borderColor: "var(--border-color)" }}><Pencil size={16} /></button>
            <button type="button" onClick={() => removeCategory(category)} disabled={categoryBusy} aria-label={`Delete ${category.name}`} className="cursor-pointer rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-500/10 disabled:opacity-50"><Trash2 size={16} /></button>
          </div>) : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No categories yet. Add one here or from the product form.</p>}
        </div>}
      </section>

      <section className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-2"><Tags size={20} className="text-purple-600" /><h3 className="text-lg font-bold">Product badges</h3></div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>New, Sale, Best Seller, Limited and Featured are ready to use. Editing a badge updates every product using it.</p>
        <form onSubmit={saveBadge} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-semibold">{badgeForm.id ? "Edit badge" : "New badge"}<input required minLength={2} maxLength={40} value={badgeForm.name} onChange={(event) => setBadgeForm({ ...badgeForm, name: event.target.value })} className={`mt-1 ${fieldClass}`} style={fieldStyle} /></label>
          <BadgeColorField value={badgeForm.color} onChange={(color) => setBadgeForm({ ...badgeForm, color })} previewLabel={badgeForm.name || "Preview"} />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button disabled={badgeBusy} type="submit" className="flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Plus size={17} />{badgeForm.id ? "Save" : "Add"}</button>
            {badgeForm.id && <button type="button" onClick={() => setBadgeForm({ id: "", name: "", color: "blue" })} className="cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border-color)" }}>Cancel</button>}
          </div>
        </form>
        {badgesLoading ? <p className="mt-5 text-sm">Loading badges…</p> : badgesError ? <p role="alert" className="mt-5 text-sm text-red-600">Could not load badges.</p> : <div className="mt-5 max-h-[480px] space-y-2 overflow-y-auto">
          {badges.map((badge) => <div key={badge._id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border-color)" }}>
            <span className={badgeClassName(badge.color)} style={badgeStyle(badge.color)}>{badge.name}</span><span className="min-w-0 flex-1 text-right text-xs" style={{ color: "var(--text-secondary)" }}>{badge.productCount} products</span>
            <button type="button" onClick={() => setBadgeForm({ id: badge._id, name: badge.name, color: badge.color })} disabled={badgeBusy} aria-label={`Edit ${badge.name}`} className="cursor-pointer rounded-lg border p-2 text-blue-600 hover:bg-blue-500/10 disabled:opacity-50" style={{ borderColor: "var(--border-color)" }}><Pencil size={16} /></button>
            <button type="button" onClick={() => removeBadge(badge)} disabled={badgeBusy} aria-label={`Delete ${badge.name}`} className="cursor-pointer rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-500/10 disabled:opacity-50"><Trash2 size={16} /></button>
          </div>)}
        </div>}
      </section>
    </div>
  </div>;
}
