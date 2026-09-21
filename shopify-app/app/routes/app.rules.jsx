/* ============================================================
   Editor: Rules.
   Bundles: which base set a shopper gets. Order matters (first match wins,
   the last one is the fallback), so they can be reordered.
   Add-ons: what gets layered on top, each with a condition and a quantity
   that may be a number or an expression over the answers.
   Conditions are edited as rows; the server rebuilds and validates them
   against the questionnaire, so a rule can never reference an answer that
   does not exist.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig } from "../config.server";
import { fieldCatalog, toRows, fromRows, describe, validateQty, qtyToText } from "../lib/conditions";
import { money } from "../lib/money";
import { ConditionBuilder } from "../components/ConditionBuilder";
import { WidgetPreview } from "../components/WidgetPreview";

const clip = (s, n) => String(s ?? "").replace(/[<>]/g, "").slice(0, n);
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return redirect("/app");
  return { config, catalog: fieldCatalog(config), ruleCatalog: fieldCatalog(config, { forRules: true }) };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  let data;
  try { data = JSON.parse(String(form.get("data") || "{}")); } catch (e) { return { ok: false, error: "Could not read the rules" }; }
  const catalog = fieldCatalog(config);
  const ruleCatalog = fieldCatalog(config, { forRules: true });
  const errors = [];

  // ---- bundles: keep ids, links and contents; take order, copy and conditions
  const savedBundles = new Map((config.bundles || []).map((b) => [b.id, b]));
  const bundles = [];
  for (const inc of data.bundles || []) {
    const base = savedBundles.get(inc.id);
    if (!base) continue;
    const b = { ...base };
    b.title = clip(inc.title, 80) || base.title;
    b.subtitle = clip(inc.subtitle, 120);
    b.why = clip(inc.why, 400);
    if (!base.variantId && Number.isFinite(Number(inc.price))) b.price = Math.max(0, Number(inc.price));
    const cond = fromRows(inc.cond, catalog, base.when);
    if (cond === undefined) delete b.when; else b.when = cond;
    bundles.push(b);
  }
  if (!bundles.length) return { ok: false, error: "Keep at least one bundle" };
  // the last bundle is the fallback: it must always match
  delete bundles[bundles.length - 1].when;

  // ---- accessories: new ones can be added here; links are made on Products
  const accessories = { ...(config.accessories || {}) };
  for (const a of data.newAccessories || []) {
    const title = clip(a.title, 80);
    if (!title) continue;
    let key = slug(title) || "addon"; let n = 2;
    while (accessories[key]) key = `${slug(title)}-${n++}`;
    accessories[key] = { variantId: "", price: Math.max(0, Number(a.price) || 0), title, image: "" };
    (data.rules || []).forEach((r) => { if (r.accessory === a.tempKey) r.accessory = key; });
  }

  // ---- add-on rules
  const savedRules = new Map((config.addonRules || []).map((r) => [r.id, r]));
  const rules = [];
  const ids = new Set();
  for (const inc of data.rules || []) {
    if (!accessories[inc.accessory]) { errors.push(`A rule points at a product that does not exist.`); continue; }
    const base = savedRules.get(inc.id) || {};
    let id = base.id || slug(inc.id || inc.accessory) || "rule"; let n = 2;
    while (ids.has(id)) id = `${slug(inc.accessory)}-${n++}`;
    ids.add(id);
    const qty = validateQty(inc.qty, catalog);
    if (!qty.ok) { errors.push(`${clip(inc.text, 40) || id}: ${qty.error}`); continue; }
    const r = { ...base, id, accessory: inc.accessory, text: clip(inc.text, 100) || accessories[inc.accessory].title, reason: clip(inc.reason, 200) };
    if (qty.value === undefined) delete r.qty; else r.qty = qty.value;
    const cond = fromRows(inc.cond, ruleCatalog, base.when);
    if (cond === undefined) delete r.when; else r.when = cond;
    rules.push(r);
  }
  if (errors.length) return { ok: false, error: errors.join(" ") };

  try {
    config.bundles = bundles; config.accessories = accessories; config.addonRules = rules;
    await saveConfig(admin, shopId, config);
  } catch (e) { return { ok: false, error: e.message }; }
  return { ok: true };
};

export default function Rules() {
  const { config, catalog, ruleCatalog } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const busy = fetcher.state !== "idle";

  const [bundles, setBundles] = useState(() => (config.bundles || []).map((b) => ({ id: b.id, title: b.title || "", subtitle: b.subtitle || "", why: b.why || "", price: b.price ?? 0, linked: !!b.variantId, cond: toRows(b.when, catalog), saved: b.when })));
  const [rules, setRules] = useState(() => (config.addonRules || []).map((r) => ({ id: r.id, accessory: r.accessory, text: r.text || "", reason: r.reason || "", qty: qtyToText(r.qty), cond: toRows(r.when, ruleCatalog), saved: r.when })));
  const [newAcc, setNewAcc] = useState([]);
  const accessories = [...Object.entries(config.accessories || {}).map(([k, a]) => ({ key: k, title: a.title || k })), ...newAcc.map((a) => ({ key: a.tempKey, title: a.title || "New product" }))];

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) shopify.toast.show("Rules saved");
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true, duration: 8000 });
  }, [fetcher.data, shopify]);

  const upB = (i, patch) => setBundles((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const upR = (i, patch) => setRules((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const moveB = (i, d) => setBundles((bs) => { const a = bs.slice(); const t = a[i]; a[i] = a[i + d]; a[i + d] = t; return a; });
  const addRule = () => setRules((rs) => rs.concat([{ id: `new-${Date.now()}`, accessory: accessories[0]?.key || "", text: accessories[0]?.title || "", reason: "", qty: "1", cond: { mode: "always", rows: [] } }]));
  const addProduct = () => setNewAcc((a) => a.concat([{ tempKey: `tmp-${Date.now()}`, title: "", price: 0 }]));
  const save = () => fetcher.submit({ data: JSON.stringify({ bundles, rules, newAccessories: newAcc }) }, { method: "POST" });

  const numberNames = catalog.filter((f) => f.kind === "number").map((f) => f.field);

  return (
    <s-page heading="Rules">
      <s-button slot="primary-action" onClick={save} {...(busy ? { loading: true } : {})}>Save rules</s-button>
      <s-button slot="secondary-actions" href="/app" variant="tertiary">Back to overview</s-button>

      <s-section>
        <s-paragraph>Two decisions per shopper: which base bundle they get, and which add-ons go on top. Both follow from the answers.</s-paragraph>
      </s-section>

      <s-section heading="Bundles">
        <s-paragraph color="subdued">Checked from the top; the first one whose condition is true wins. The last one is the fallback and always matches.</s-paragraph>
        <s-stack direction="block" gap="base">
          {bundles.map((b, i) => {
            const last = i === bundles.length - 1;
            return (
              <s-box key={b.id} padding="base" borderWidth="base" borderRadius="base">
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <s-heading>{`${i + 1}. ${b.title || b.id}`}</s-heading>
                    {last ? <s-badge tone="info">Fallback</s-badge> : null}
                    {b.linked ? <s-badge tone="success">Product linked</s-badge> : <s-badge tone="warning">No product yet</s-badge>}
                  </s-stack>
                  <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                    <s-text-field label="Title" value={b.title} onInput={(e) => upB(i, { title: e.currentTarget.value })} />
                    <s-text-field label="Subtitle" value={b.subtitle} onInput={(e) => upB(i, { subtitle: e.currentTarget.value })} />
                  </s-grid>
                  <s-text-area label="Why this bundle (shown on the result)" value={b.why} rows={2} onInput={(e) => upB(i, { why: e.currentTarget.value })} />
                  {b.linked ? <s-text color="subdued">{`Price ${money(b.price, config.cart?.currency)} comes from the linked product.`}</s-text> : (
                    <s-number-field label="Preview price" value={b.price} min="0" step="0.01" onInput={(e) => upB(i, { price: e.currentTarget.value })} />
                  )}
                  {last ? <s-text color="subdued">Shown when no bundle above matches.</s-text> : (
                    <ConditionBuilder state={b.cond} saved={b.saved} catalog={catalog} alwaysLabel="Always (everything below is never reached)" onChange={(cond) => upB(i, { cond })} />
                  )}
                  <s-stack direction="inline" gap="small">
                    {i > 0 ? <s-button variant="tertiary" onClick={() => moveB(i, -1)}>Move up</s-button> : null}
                    {!last ? <s-button variant="tertiary" onClick={() => moveB(i, 1)}>Move down</s-button> : null}
                  </s-stack>
                </s-stack>
              </s-box>
            );
          })}
        </s-stack>
      </s-section>

      <s-section heading="Add-ons">
        <s-paragraph color="subdued">Each rule adds one product when its condition is true. Quantity can be a number, or a calculation over the number answers.</s-paragraph>
        <s-stack direction="block" gap="base">
          {rules.map((r, i) => (
            <s-box key={r.id} padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="base">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-heading>{r.text || "New add-on"}</s-heading>
                  <s-text color="subdued">{r.cond.mode === "always" ? "Always added" : r.cond.mode === "advanced" ? describe(r.saved, ruleCatalog) : ""}</s-text>
                </s-stack>
                <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                  <s-select label="Product" value={r.accessory} onChange={(e) => upR(i, { accessory: e.currentTarget.value })}>
                    {accessories.map((a) => <s-option key={a.key} value={a.key}>{a.title}</s-option>)}
                  </s-select>
                  <s-text-field label="Quantity" value={r.qty} placeholder="1" details={numberNames.length ? `A number, or e.g. max(0, ${numberNames[0]} - included)` : "A number"} onInput={(e) => upR(i, { qty: e.currentTarget.value })} />
                </s-grid>
                <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                  <s-text-field label="Shopper sees" value={r.text} details="{qty} shows the quantity" onInput={(e) => upR(i, { text: e.currentTarget.value })} />
                  <s-text-field label="Reason shown beside it" value={r.reason} onInput={(e) => upR(i, { reason: e.currentTarget.value })} />
                </s-grid>
                <ConditionBuilder state={r.cond} saved={r.saved} catalog={ruleCatalog} alwaysLabel="Always add it" onChange={(cond) => upR(i, { cond })} />
                <s-stack direction="inline" gap="small">
                  <s-button variant="tertiary" tone="critical" onClick={() => setRules((rs) => rs.filter((_, j) => j !== i))}>Remove rule</s-button>
                </s-stack>
              </s-stack>
            </s-box>
          ))}
          <s-stack direction="inline" gap="small">
            <s-button variant="secondary" onClick={addRule} {...(!accessories.length ? { disabled: true } : {})}>Add a rule</s-button>
            <s-button variant="tertiary" onClick={addProduct}>Add an add-on product</s-button>
          </s-stack>
          {newAcc.map((a, i) => (
            <s-box key={a.tempKey} padding="base" borderWidth="base" borderRadius="base" background="subdued">
              <s-grid gridTemplateColumns="2fr 1fr auto" gap="base" alignItems="end">
                <s-text-field label="New product name" value={a.title} onInput={(e) => setNewAcc((xs) => xs.map((x, j) => (j === i ? { ...x, title: e.currentTarget.value } : x)))} />
                <s-number-field label="Preview price" value={a.price} min="0" step="0.01" onInput={(e) => setNewAcc((xs) => xs.map((x, j) => (j === i ? { ...x, price: e.currentTarget.value } : x)))} />
                <s-button variant="tertiary" onClick={() => setNewAcc((xs) => xs.filter((_, j) => j !== i))}>Cancel</s-button>
              </s-grid>
              <s-text color="subdued">Save, then link it to a real product on the Products step.</s-text>
            </s-box>
          ))}
        </s-stack>
      </s-section>

      <s-section>
        <s-button variant="secondary" onClick={save} {...(busy ? { loading: true } : {})}>Save rules</s-button>
      </s-section>

      <s-section slot="aside" heading="Try it">
        <s-paragraph color="subdued">The saved setup, live. Save to see rule changes here.</s-paragraph>
        <WidgetPreview config={config} />
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
