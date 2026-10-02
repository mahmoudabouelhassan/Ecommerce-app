import { useEffect, useRef, useState } from "react";
import { Download, FileJson, Upload, X } from "lucide-react";
import Swal from "sweetalert2";
import { getSwalThemeOptions } from "../../utils/swalTheme";
import {
  useImportProductsMutation,
  usePreviewProductImportMutation,
} from "../../features/products/productsApiSlice";
import { getProductImage, useProductImageFallback } from "../../utils/productImage";
import { badgeClassName, badgeStyle } from "../../utils/productBadge";
import ProductPrice from "../../components/ProductPrice";

const statusLabels = {
  ready: "Ready",
  imported: "Imported",
  skipped: "Not selected",
  invalid: "Invalid",
  duplicate_file: "Repeated in file",
  duplicate_database: "Already exists",
  failed: "Failed",
};

const statusColor = (status) => {
  if (status === "ready" || status === "imported") return "text-green-600";
  if (status.startsWith("duplicate")) return "text-amber-600";
  if (status === "skipped") return "text-slate-500";
  return "text-red-600";
};

const summarizeRows = (rows) => ({
  imported: rows.filter((row) => row.status === "imported").length,
  skipped: rows.filter((row) => row.status === "skipped").length,
  invalid: rows.filter((row) => row.status === "invalid").length,
  duplicate: rows.filter((row) => row.status.startsWith("duplicate")).length,
  failed: rows.filter((row) => row.status === "failed").length,
});

function DescriptionPreview({ description }) {
  if (!description) return <span style={{ color: "var(--text-secondary)" }}>No description</span>;
  if (description.length <= 160) return <p className="max-w-64 whitespace-pre-wrap break-words">{description}</p>;
  return <details className="max-w-64 break-words">
    <summary className="cursor-pointer text-blue-600">{description.slice(0, 120)}… Show more</summary>
    <p className="mt-2 whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{description}</p>
  </details>;
}

export default function AdminImportProducts({ onClose }) {
  const [fileName, setFileName] = useState("");
  const [fileItems, setFileItems] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [error, setError] = useState("");
  const selectAllRef = useRef(null);
  const [previewImport, { isLoading: isPreviewing }] = usePreviewProductImportMutation();
  const [importProducts, { isLoading: isImporting }] = useImportProductsMutation();
  const isBusy = isPreviewing || isImporting;
  const readyRows = preview?.rows.filter((row) => row.status === "ready") || [];
  const allSelected = readyRows.length > 0 && selectedRows.size === readyRows.length;
  const display = result || preview;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedRows.size > 0 && !allSelected;
    }
  }, [selectedRows, allSelected]);

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setFileName(file.name);
    setFileItems(null);
    setPreview(null);
    setResult(null);
    setSelectedRows(new Set());
    setError("");
    if (file.size > 1024 * 1024) {
      setError("File must be 1 MB or smaller.");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const data = await previewImport(parsed).unwrap();
      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.products) ? parsed.products : [parsed];
      setFileItems(items);
      setPreview(data);
    } catch (err) {
      setError(err instanceof SyntaxError ? "This file is not valid JSON." : err?.data?.message || "Could not preview this file.");
    }
  };

  const toggleRow = (index) => {
    setSelectedRows((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedRows(allSelected ? new Set() : new Set(readyRows.map((row) => row.index)));
  };

  const confirmImport = async () => {
    if (!fileItems || selectedRows.size === 0) return;
    const indices = [...selectedRows].sort((a, b) => a - b);
    const confirmation = await Swal.fire({
      ...getSwalThemeOptions(),
      title: `Import ${indices.length} selected product${indices.length === 1 ? "" : "s"}?`,
      text: "Only the selected products will be sent. The server will check them again before saving.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Import selected",
      confirmButtonColor: "#2563eb",
    });
    if (!confirmation.isConfirmed) return;
    setError("");
    try {
      const imported = await importProducts(indices.map((index) => fileItems[index - 1])).unwrap();
      const byOriginalIndex = new Map(indices.map((index, position) => [
        index,
        { ...imported.rows[position], index },
      ]));
      const rows = preview.rows.map((row) => byOriginalIndex.get(row.index) ||
        (row.status === "ready" ? { ...row, status: "skipped" } : row));
      setResult({ rows, summary: summarizeRows(rows) });
    } catch (err) {
      setError(err?.data?.message || "Import failed. Refresh products before trying again.");
    }
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div role="dialog" aria-modal="true" aria-label="Import products from JSON" className="min-w-0 w-full max-w-[980px] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl p-5 shadow-2xl sm:p-6" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><FileJson className="text-blue-600" size={24} /><h3 className="text-xl font-bold">Import products from JSON</h3></div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Upload one product, an array, or an object with a products array. Maximum 100 products and 1 MB.</p>
        </div>
        <button type="button" disabled={isBusy} onClick={onClose} aria-label="Close import" className="cursor-pointer rounded-full p-1 hover:bg-blue-500/10 disabled:opacity-50"><X size={22} /></button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"><Upload size={18} />Choose JSON file<input type="file" accept=".json,application/json" onChange={onFile} disabled={isBusy} className="sr-only" /></label>
        <a href={`${import.meta.env.BASE_URL}products-example.json`} download="products-example.json" className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:border-blue-500 hover:text-blue-600" style={{ borderColor: "var(--border-color)" }}><Download size={17} />Download example</a>
      </div>
      {fileName && <p className="mt-3 break-all text-sm" style={{ color: "var(--text-secondary)" }}>File: {fileName}</p>}
      {isPreviewing && <p role="status" className="mt-4 text-blue-600">Checking products…</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

      {display && <>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            [result ? "Imported" : "Ready", result ? display.summary.imported : display.summary.ready, "text-green-600"],
            [result ? "Not selected" : "Selected", result ? display.summary.skipped : selectedRows.size, "text-blue-600"],
            ["Invalid", display.summary.invalid, "text-red-600"],
            ["Duplicates", display.summary.duplicate, "text-amber-600"],
            ["Failed", display.summary.failed, "text-red-600"],
          ].map(([label, count, color]) => <div key={label} className="flex min-w-28 flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-color)" }}><span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span><strong className={`text-base ${color}`}>{count}</strong></div>)}
        </div>

        {!result && <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input ref={selectAllRef} type="checkbox" checked={allSelected} onChange={toggleAll} disabled={isBusy || readyRows.length === 0} className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed" />
          Select all ready products ({selectedRows.size}/{readyRows.length})
        </label>}

        <div className="mt-3 max-h-[340px] min-w-0 overflow-auto rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
          <table className="w-full min-w-[760px] table-fixed text-left text-sm">
            <colgroup><col className="w-14" /><col className="w-12" /><col className="w-48" /><col className="w-28" /><col className="w-48" /><col /></colgroup>
            <thead className="sticky top-0 z-10" style={{ background: "var(--bg-secondary)" }}><tr><th className="p-3">Add</th><th className="p-3">Row</th><th className="p-3">Product preview</th><th className="p-3">Price / stock</th><th className="p-3">Status</th><th className="p-3">Description</th></tr></thead>
            <tbody>{display.rows.map((row) => <tr key={row.index} className="border-t align-top" style={{ borderColor: "var(--border-color)" }}>
              <td className="p-3"><input type="checkbox" aria-label={`Select row ${row.index}: ${row.title || "untitled product"}`} checked={selectedRows.has(row.index)} onChange={() => toggleRow(row.index)} disabled={Boolean(result) || isBusy || row.status !== "ready"} className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed" /></td>
              <td className="p-3">{row.index}</td>
              <td className="p-3"><div className="flex items-center gap-2"><img src={getProductImage(row)} onError={useProductImageFallback} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" /><div className="min-w-0"><span className="block truncate font-semibold" title={row.title}>{row.title || "—"}</span><span className="block truncate" style={{ color: "var(--text-secondary)" }}>{row.category}</span>{row.badge && <span className={`mt-1 ${badgeClassName(row.badgeColor)}`} style={badgeStyle(row.badgeColor)}>{row.badge}</span>}</div></div></td>
              <td className="p-3">{row.price == null ? "—" : <ProductPrice product={row} size="sm" showPercent={false} />}<span className="block text-xs" style={{ color: "var(--text-secondary)" }}>{row.stock == null ? "—" : `${row.stock} units`}</span></td>
              <td className="p-3"><span className={`font-semibold ${statusColor(row.status)}`}>{statusLabels[row.status] || row.status}</span>{row.errors.length > 0 && <p className="mt-1 break-words text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{row.errors.join("; ")}</p>}</td>
              <td className="p-3 text-xs"><DescriptionPreview description={row.description} /></td>
            </tr>)}</tbody>
          </table>
        </div>

        {!result && <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Only checked products are sent; duplicates and invalid rows cannot be selected.</p><button type="button" disabled={isBusy || selectedRows.size === 0} onClick={confirmImport} className="cursor-pointer rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">{isImporting ? "Importing…" : `Import ${selectedRows.size} selected product${selectedRows.size === 1 ? "" : "s"}`}</button></div>}
        {result && <p role="status" className="mt-4 font-semibold text-green-600">{result.summary.imported} product{result.summary.imported === 1 ? "" : "s"} added. You can close this window or choose another file.</p>}
      </>}
    </div>
  </div>;
}
