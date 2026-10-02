import { badgeClassName, badgeStyle } from "../utils/productBadge";

const presets = ["blue", "red", "amber", "green", "purple", "slate"];
const isHex = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
const pickerValue = (value) => value.length === 4 && isHex(value)
  ? `#${[...value.slice(1)].map((digit) => digit + digit).join("")}`
  : isHex(value) ? value : "#e5e7eb";

export default function BadgeColorField({ value, onChange, previewLabel = "Preview" }) {
  const custom = !presets.includes(value);
  return <div className="min-w-0 text-sm font-semibold">
    <label htmlFor="badge-color-choice" className="block">Badge color</label>
    <select id="badge-color-choice" value={custom ? "custom" : value} onChange={(event) => onChange(event.target.value === "custom" ? "#e5e7eb" : event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-blue-500" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
      {presets.map((color) => <option key={color} value={color}>{color}</option>)}
      <option value="custom">Custom Hex color</option>
    </select>
    {custom && <div className="mt-2 flex items-center gap-2">
      <input aria-label="Custom badge color" required type="text" pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?" title="Enter a Hex color such as #e5e7eb" placeholder="#e5e7eb" value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-2 outline-none focus:border-blue-500" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }} />
      <input aria-label="Pick badge color" type="color" value={pickerValue(value)} onChange={(event) => onChange(event.target.value)} className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border p-1" style={{ borderColor: "var(--border-color)" }} />
    </div>}
    <div className="mt-2 flex min-h-7 items-center gap-2"><span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Preview:</span><span className={badgeClassName(value)} style={badgeStyle(value)}>{previewLabel || "Preview"}</span></div>
  </div>;
}
