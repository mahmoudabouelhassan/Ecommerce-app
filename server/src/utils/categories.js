export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const categoryKey = (value) => value.trim().toLowerCase();

// Prefer an existing all-lowercase spelling when legacy records differ only in case.
export const canonicalCategories = (values) => {
  const names = [...new Set(values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))];
  names.sort((a, b) => {
    const aLower = a === a.toLowerCase() ? 0 : 1;
    const bLower = b === b.toLowerCase() ? 0 : 1;
    return aLower - bLower || a.localeCompare(b);
  });
  const byKey = new Map();
  for (const name of names) if (!byKey.has(categoryKey(name))) byKey.set(categoryKey(name), name);
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
};

export const resolveCategory = (value, existing) =>
  canonicalCategories(existing).find((name) => categoryKey(name) === categoryKey(value)) || value.trim();

export const categoryFilter = (value) => ({ $regex: `^${escapeRegex(value.trim())}$`, $options: "i" });
