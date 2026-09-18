/* "Show this when…" as rows a merchant can read: answer, comparison, value,
   joined by all or any. Conditions deeper than that are left exactly as the
   template saved them and shown as advanced, with a way to replace them. */
import { OPS, describe } from "../lib/conditions";

export function ConditionBuilder({ state, onChange, catalog, saved, alwaysLabel = "Always" }) {
  const set = (patch) => onChange({ ...state, ...patch });
  const setRow = (i, patch) => set({ rows: state.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const firstField = catalog[0];

  const newRow = () => {
    const f = firstField;
    if (!f) return null;
    return { field: f.field, op: OPS[f.kind][0][0], value: f.options ? f.options[0]?.value : f.kind === "number" ? 1 : undefined };
  };
  const changeField = (i, field) => {
    const f = catalog.find((x) => x.field === field);
    if (!f) return;
    setRow(i, { field, op: OPS[f.kind][0][0], value: f.options ? f.options[0]?.value : f.kind === "number" ? 1 : undefined });
  };

  if (state.mode === "advanced") {
    return (
      <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
        <s-stack direction="block" gap="small-200">
          <s-text>{describe(saved, catalog)}</s-text>
          <s-text color="subdued">This combines tests in a way the row editor cannot show, so it is kept exactly as it is.</s-text>
          <s-button variant="tertiary" onClick={() => set({ mode: "all", rows: [newRow()].filter(Boolean) })}>Replace with simple rows</s-button>
        </s-stack>
      </s-box>
    );
  }

  return (
    <s-stack direction="block" gap="small">
      <s-select label="Shown when" value={state.mode} onChange={(e) => {
        const mode = e.currentTarget.value;
        set({ mode, rows: mode === "always" ? [] : state.rows.length ? state.rows : [newRow()].filter(Boolean) });
      }}>
        <s-option value="always">{alwaysLabel}</s-option>
        <s-option value="all">All of these are true</s-option>
        <s-option value="any">Any of these is true</s-option>
      </s-select>

      {state.mode !== "always" && state.rows.map((row, i) => {
        const f = catalog.find((x) => x.field === row.field) || firstField;
        if (!f) return null;
        return (
          <s-grid key={i} gridTemplateColumns="2fr 1.4fr 1.6fr auto" gap="small" alignItems="end">
            <s-select label="Answer" labelAccessibilityVisibility={i ? "exclusive" : "visible"} value={f.field} onChange={(e) => changeField(i, e.currentTarget.value)}>
              {catalog.map((c) => <s-option key={c.field} value={c.field}>{c.label}</s-option>)}
            </s-select>
            <s-select label="Comparison" labelAccessibilityVisibility={i ? "exclusive" : "visible"} value={row.op} onChange={(e) => setRow(i, { op: e.currentTarget.value })}>
              {OPS[f.kind].map(([op, text]) => <s-option key={op} value={op}>{text}</s-option>)}
            </s-select>
            {f.kind === "boolean" ? <span /> : f.kind === "number" ? (
              <s-number-field label="Value" labelAccessibilityVisibility={i ? "exclusive" : "visible"} value={row.value ?? 0} onInput={(e) => setRow(i, { value: e.currentTarget.value })} />
            ) : (
              <s-select label="Value" labelAccessibilityVisibility={i ? "exclusive" : "visible"} value={String(row.value)} onChange={(e) => setRow(i, { value: e.currentTarget.value })}>
                {(f.options || []).map((o) => <s-option key={String(o.value)} value={String(o.value)}>{o.label}</s-option>)}
              </s-select>
            )}
            <s-button variant="tertiary" tone="critical" accessibilityLabel="Remove this test" onClick={() => {
              const rows = state.rows.filter((_, j) => j !== i);
              set(rows.length ? { rows } : { mode: "always", rows: [] });
            }}>Remove</s-button>
          </s-grid>
        );
      })}

      {state.mode !== "always" ? (
        <s-stack direction="inline" gap="small">
          <s-button variant="tertiary" onClick={() => set({ rows: state.rows.concat([newRow()].filter(Boolean)) })}>Add a test</s-button>
        </s-stack>
      ) : null}
    </s-stack>
  );
}
