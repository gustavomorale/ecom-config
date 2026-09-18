/* ============================================================
   Conditions, shared by the editor UI and the server.

   The engine accepts nested conditions ({all}, {any}, {not}, {expr}). The
   editor shows the common shape as rows: one list of tests joined by ALL or
   ANY. Anything deeper is kept exactly as saved and shown as "advanced", so
   opening the editor never flattens a template's logic.
   No server-only imports here: this file runs in the browser too.
   ============================================================ */

/* What a merchant can test, derived from the questionnaire itself. Add-on
   rules can also test which bundle was chosen (the engine puts bundleId in
   their scope); bundle conditions cannot, they run before one is chosen. */
export function fieldCatalog(config, { forRules = false } = {}) {
  const out = [];
  const seen = new Set();
  const add = (f) => { if (f.field && !seen.has(f.field)) { seen.add(f.field); out.push(f); } };
  for (const st of config.steps || []) {
    const opts = (st.options || []).map((o) => ({ value: o.value, label: o.label || String(o.value) }));
    if (st.type === "choice") add({ field: st.field, label: st.question || st.field, kind: "choice", options: opts });
    if (st.type === "boolean") add({ field: st.field, label: st.question || st.field, kind: "boolean" });
    if (st.type === "multi") add({ field: st.field, label: st.question || st.field, kind: "multi", options: opts });
    for (const c of st.counters || []) add({ field: c.field, label: c.label || c.field, kind: "number" });
    for (const t of st.toggles || []) add({ field: t.field, label: t.label || t.field, kind: "boolean" });
    if (st.followUp && st.followUp.field) {
      add({ field: st.followUp.field, label: st.followUp.label || st.followUp.field, kind: "choice",
        options: (st.followUp.options || []).map((o) => ({ value: o.value, label: o.label || String(o.value) })) });
    }
  }
  for (const name of Object.keys(config.derived || {})) add({ field: name, label: `${name} (calculated)`, kind: "number" });
  if (forRules) add({ field: "bundleId", label: "Chosen bundle", kind: "choice", options: (config.bundles || []).map((b) => ({ value: b.id, label: b.title || b.id })) });
  return out;
}

export const OPS = {
  choice: [["eq", "is"], ["ne", "is not"]],
  multi: [["includes", "includes"], ["excludes", "does not include"]],
  number: [["gte", "is at least"], ["gt", "is more than"], ["lte", "is at most"], ["lt", "is less than"], ["eq", "is exactly"]],
  boolean: [["truthy", "is yes"], ["falsy", "is no"]],
};

const isLeaf = (c) => c && typeof c === "object" && typeof c.field === "string" && !("expr" in c);
const isNegIncludes = (c) => c && c.not && isLeaf(c.not) && c.not.op === "includes";

function leafToRow(c) {
  if (isNegIncludes(c)) return { field: c.not.field, op: "excludes", value: c.not.value };
  return { field: c.field, op: c.op || "truthy", value: c.value };
}

/* A test the row editor can show without losing anything: a known answer, a
   comparison offered for its kind, and (for choices) one of its own options.
   `in` with a list, expressions, or an answer that no longer exists are not. */
function isSimple(c, catalog) {
  const leaf = isNegIncludes(c) ? c.not : c;
  if (!isLeaf(leaf)) return false;
  const f = catalog.find((x) => x.field === leaf.field);
  if (!f) return false;
  const op = isNegIncludes(c) ? "excludes" : (leaf.op || "truthy");
  if (!OPS[f.kind].some((o) => o[0] === op)) return false;
  if (f.kind === "number") return typeof leaf.value === "number";
  if (f.kind === "boolean") return true;
  return (f.options || []).some((o) => o.value === leaf.value);
}

/* → { mode: 'always' | 'all' | 'any' | 'advanced', rows, raw } */
export function toRows(cond, catalog = []) {
  if (cond == null) return { mode: "always", rows: [] };
  if (isSimple(cond, catalog)) return { mode: "all", rows: [leafToRow(cond)] };
  for (const mode of ["all", "any"]) {
    if (Array.isArray(cond[mode]) && Object.keys(cond).length === 1 && cond[mode].length && cond[mode].every((c) => isSimple(c, catalog))) {
      return { mode, rows: cond[mode].map(leafToRow) };
    }
  }
  return { mode: "advanced", rows: [], raw: cond };
}

function rowToLeaf(row, catalog) {
  const f = catalog.find((x) => x.field === row.field);
  if (!f) return null;
  const allowed = OPS[f.kind].map((o) => o[0]);
  const op = allowed.includes(row.op) ? row.op : allowed[0];
  if (f.kind === "boolean") return { field: f.field, op };
  if (f.kind === "number") {
    const n = Number(row.value);
    return { field: f.field, op, value: Number.isFinite(n) ? n : 0 };
  }
  // choice / multi: the value must be one of the question's own options, with its original type
  const match = (f.options || []).find((o) => String(o.value) === String(row.value)) || (f.options || [])[0];
  if (!match) return null;
  if (op === "excludes") return { not: { field: f.field, op: "includes", value: match.value } };
  return { field: f.field, op, value: match.value };
}

/* Editor state → a condition the engine understands. `advanced` returns the
   saved condition untouched. Returns undefined for "always". */
export function fromRows(state, catalog, saved) {
  if (!state || state.mode === "always") return undefined;
  if (state.mode === "advanced") return saved;
  const leaves = (state.rows || []).map((r) => rowToLeaf(r, catalog)).filter(Boolean);
  if (!leaves.length) return undefined;
  if (leaves.length === 1) return leaves[0];
  return { [state.mode === "any" ? "any" : "all"]: leaves };
}

/* A sentence for summaries: "Skin is Dry and Goals includes Hydration".
   Handles nested conditions too, so an advanced rule is still readable. */
export function describe(cond, catalog) {
  if (cond == null) return "Always";
  const label = (field) => (catalog.find((x) => x.field === field) || {}).label || field;
  const valueLabel = (field, v) => {
    const f = catalog.find((x) => x.field === field);
    const o = f && f.options ? f.options.find((x) => x.value === v || String(x.value) === String(v)) : null;
    return o ? o.label : String(v);
  };
  const words = { eq: "is", ne: "is not", gt: "is more than", gte: "is at least", lt: "is less than", lte: "is at most", includes: "includes", truthy: "is yes", falsy: "is no" };
  const one = (c, nested) => {
    if (c == null) return "always";
    if (Array.isArray(c)) return one({ all: c }, nested);
    if (c.all || c.any) {
      const list = (c.all || c.any).map((x) => one(x, true));
      const joined = list.join(c.all ? " and " : " or ");
      return nested && list.length > 1 ? `(${joined})` : joined;
    }
    if (c.not) {
      if (c.not.op === "includes") return `${label(c.not.field)} does not include ${valueLabel(c.not.field, c.not.value)}`;
      return `not (${one(c.not, false)})`;
    }
    if ("expr" in c) return `${c.expr} ${words[c.op] || c.op} ${c.value}`;
    const op = c.op || "truthy";
    if (op === "in") return `${label(c.field)} is one of ${(c.value || []).map((v) => valueLabel(c.field, v)).join(", ")}`;
    if (op === "truthy" || op === "falsy") return `${label(c.field)} ${words[op]}`;
    return `${label(c.field)} ${words[op] || op} ${valueLabel(c.field, c.value)}`;
  };
  const text = one(cond, false);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* Quantity: a whole number, or an expression over the answers. Mirrors the
   engine's whitelist (src/configurator.js safeExpr) so a bad expression is
   refused at save time instead of silently evaluating to 0 on the storefront. */
const EXPR_FNS = ["min", "max", "round", "floor", "ceil", "abs"];
export function validateQty(input, catalog) {
  const src = String(input ?? "").trim();
  if (src === "") return { ok: true, value: undefined };
  if (/^\d+$/.test(src)) return { ok: true, value: Number(src) };
  const tokens = src.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/%(),]|\s+/g);
  if (!tokens || tokens.join("") !== src) return { ok: false, error: "Only numbers, answer names, + - * / % ( ) and min, max, round, floor, ceil, abs are allowed." };
  const known = new Set([...catalog.filter((f) => f.kind === "number" || f.kind === "boolean").map((f) => f.field), ...catalog.filter((f) => f.kind === "boolean").map((f) => `${f.field}_n`), "included", ...EXPR_FNS]);
  const bad = tokens.filter((t) => /^[A-Za-z_]/.test(t) && !known.has(t));
  if (bad.length) return { ok: false, error: `Unknown name: ${bad[0]}. Use a number answer such as ${[...known].filter((k) => !EXPR_FNS.includes(k) && k !== "included").slice(0, 3).join(", ") || "a counter"}, or "included".` };
  return { ok: true, value: { expr: src } };
}

export const qtyToText = (q) => (q == null ? "" : typeof q === "object" ? String(q.expr || "") : String(q));
