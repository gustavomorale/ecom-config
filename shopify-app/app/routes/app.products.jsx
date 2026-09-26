/* ============================================================
   Setup step 4: Products. The only step that gates a real checkout.
   Every bundle and add-on is linked to a Shopify variant through the
   resource picker; nobody types an ID. Products with several variants get
   a variant dropdown. A bundle can instead be a gift set: several separate
   products (components) that all go in the cart, so no bundle product has to
   exist. The app only reads products; it never creates them.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig } from "../config.server";
import { refreshLinked } from "../products.server";
import { SetupRail, doneSteps } from "../components/SetupRail";
import { money } from "../lib/money";
import { hasProduct } from "../lib/links";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return redirect("/app");
  return { config, done: doneSteps(config) };
};

const gidTail = (gid) => String(gid || "").split("/").pop();
const MAX_COMPONENTS = 12;

/* A gift set component as saved: only what the storefront needs. */
function cleanComponent(c) {
  if (!c || !/^\d+$/.test(String(c.variantId || ""))) return null;
  const qty = Math.min(99, Math.max(1, Math.floor(Number(c.qty) || 1)));
  const out = { variantId: String(c.variantId), qty };
  if (Number.isFinite(Number(c.price))) out.price = Number(c.price);
  if (typeof c.productTitle === "string") { out.productTitle = c.productTitle.slice(0, 120); out.title = out.productTitle; }
  if (typeof c.image === "string") out.image = c.image;
  if (/^[a-z0-9][a-z0-9-]{0,254}$/.test(String(c.handle || ""))) out.handle = c.handle;
  return out;
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  try {
    if (intent === "refresh") {
      const r = await refreshLinked(admin, config);
      if (r.checked) await saveConfig(admin, shopId, config);
      return { ok: true, intent, ...r };
    }
    let links = {}, sets = {};
    try {
      links = JSON.parse(String(form.get("links") || "{}"));
      sets = JSON.parse(String(form.get("sets") || "{}"));
    } catch (e) { return { ok: false, error: "Could not read the product links" }; }
    const apply = (target, link) => {
      if (!target || !link) return;
      if (link.clear) { target.variantId = ""; delete target.productTitle; return; }
      if (!/^\d+$/.test(String(link.variantId || ""))) return;
      target.variantId = String(link.variantId);
      if (Number.isFinite(Number(link.price))) target.price = Number(link.price);
      if (typeof link.image === "string") target.image = link.image;
      if (typeof link.productTitle === "string") target.productTitle = link.productTitle.slice(0, 120);
    };
    (config.bundles || []).forEach((b) => {
      const link = links.bundles && links.bundles[b.id];
      apply(b, link);
      if (link && !link.clear && b.variantId) delete b.components;       // one bundle product replaces a set
      if (!sets || !(b.id in sets)) return;
      if (sets[b.id] === null) { delete b.components; return; }          // back to one bundle product
      b.components = (Array.isArray(sets[b.id]) ? sets[b.id] : []).map(cleanComponent).filter(Boolean).slice(0, MAX_COMPONENTS);
      if (b.components.length) { b.variantId = ""; delete b.productTitle; }
    });
    Object.keys(config.accessories || {}).forEach((k) => apply(config.accessories[k], links.accessories && links.accessories[k]));
    await saveConfig(admin, shopId, config);
  } catch (e) { return { ok: false, intent, error: e.message }; }
  if (form.get("continue") === "1") return redirect("/app/live");
  return { ok: true, intent };
};

function ProductRow({ item, kind, link, currency, onPick, onClear, onVariant }) {
  const cleared = link && link.clear;
  const variantId = cleared ? "" : link ? link.variantId : item.variantId;
  const productTitle = cleared ? "" : link ? link.productTitle : item.productTitle;
  const price = cleared ? item.price : link && link.price != null ? link.price : item.price;
  const image = cleared ? "" : link ? link.image : item.image;
  const variants = link && link.variants && link.variants.length > 1 ? link.variants : null;
  return (
    <s-box padding="base" borderWidth="base" borderRadius="base" background={variantId ? "base" : "subdued"}>
      <s-grid gridTemplateColumns="56px 1fr auto" gap="base" alignItems="center">
        <s-grid-item>
          {image ? <s-thumbnail src={image} alt="" size="base" /> : <s-box inlineSize="56px" blockSize="56px" borderWidth="base" borderRadius="base" background="subdued" />}
        </s-grid-item>
        <s-grid-item>
          <s-stack direction="block" gap="small-200">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-heading>{item.title || item.productTitle}</s-heading>
              {variantId ? <s-badge tone="success">Linked</s-badge> : <s-badge tone="warning">Needs a product</s-badge>}
            </s-stack>
            <s-text color="subdued">
              {kind === "bundle" ? (item.subtitle || "Bundle") : "Add-on"}{price != null ? ` · ${money(price, currency)}` : ""}{productTitle ? ` · ${productTitle}` : ""}
            </s-text>
            {variants ? (
              <s-select label="Variant" labelAccessibilityVisibility="exclusive" value={variantId} onChange={(e) => onVariant(e.currentTarget.value)}>
                {variants.map((v) => <s-option key={v.id} value={v.id}>{`${v.title} · ${money(v.price, currency)}`}</s-option>)}
              </s-select>
            ) : null}
          </s-stack>
        </s-grid-item>
        <s-grid-item>
          <s-stack direction="inline" gap="small">
            <s-button variant={variantId ? "secondary" : "primary"} onClick={onPick}>{variantId ? "Change" : "Choose product"}</s-button>
            {variantId ? <s-button variant="tertiary" onClick={onClear}>Unlink</s-button> : null}
          </s-stack>
        </s-grid-item>
      </s-grid>
    </s-box>
  );
}

/* A bundle built from separate products. Each component is one variant and a
   quantity; all of them go in the cart. */
function SetRow({ item, components, currency, onAdd, onQty, onVariant, onRemove, onSingle }) {
  const total = components.reduce((sum, c) => sum + (Number(c.price) || 0) * (Number(c.qty) || 1), 0);
  return (
    <s-box padding="base" borderWidth="base" borderRadius="base" background={components.length ? "base" : "subdued"}>
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-heading>{item.title}</s-heading>
          {components.length
            ? <s-badge tone="success">{`Gift set · ${components.length} product${components.length === 1 ? "" : "s"}`}</s-badge>
            : <s-badge tone="warning">Needs products</s-badge>}
          {components.length ? <s-text color="subdued">{`${money(total, currency)} in total`}</s-text> : null}
        </s-stack>
        {components.map((c, i) => {
          const variants = c.variants && c.variants.length > 1 ? c.variants : null;
          return (
            <s-grid key={`${c.variantId}-${i}`} gridTemplateColumns="44px 1fr 96px auto" gap="base" alignItems="center">
              <s-grid-item>
                {c.image ? <s-thumbnail src={c.image} alt="" size="small" /> : <s-box inlineSize="44px" blockSize="44px" borderWidth="base" borderRadius="base" background="subdued" />}
              </s-grid-item>
              <s-grid-item>
                <s-stack direction="block" gap="small-200">
                  <s-text>{c.productTitle || c.title}</s-text>
                  {variants ? (
                    <s-select label="Variant" labelAccessibilityVisibility="exclusive" value={c.variantId} onChange={(e) => onVariant(i, e.currentTarget.value)}>
                      {variants.map((v) => <s-option key={v.id} value={v.id}>{`${v.title} · ${money(v.price, currency)}`}</s-option>)}
                    </s-select>
                  ) : <s-text color="subdued">{money(c.price, currency)}</s-text>}
                </s-stack>
              </s-grid-item>
              <s-grid-item>
                <s-number-field label="Quantity" labelAccessibilityVisibility="exclusive" value={c.qty} min="1" max="99" onInput={(e) => onQty(i, e.currentTarget.value)} />
              </s-grid-item>
              <s-grid-item>
                <s-button variant="tertiary" onClick={() => onRemove(i)} accessibilityLabel={`Remove ${c.productTitle || c.title}`}>Remove</s-button>
              </s-grid-item>
            </s-grid>
          );
        })}
        <s-stack direction="inline" gap="small">
          <s-button variant={components.length ? "secondary" : "primary"} onClick={onAdd} {...(components.length >= MAX_COMPONENTS ? { disabled: true } : {})}>Add products</s-button>
          <s-button variant="tertiary" onClick={onSingle}>Use one bundle product instead</s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

export default function Products() {
  const { config, done } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [links, setLinks] = useState({ bundles: {}, accessories: {} });
  // Gift sets being edited: bundle id -> components, or null for "back to one product".
  const [sets, setSets] = useState({});
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok && fetcher.data.intent === "refresh") {
      const d = fetcher.data;
      if (d.missing) shopify.toast.show(`${d.missing} linked product${d.missing === 1 ? " no longer exists" : "s no longer exist"}. Choose ${d.missing === 1 ? "it" : "them"} again.`, { isError: true });
      else shopify.toast.show(d.changed ? `Updated ${d.changed} product${d.changed === 1 ? "" : "s"} from your catalogue` : "Prices and pictures are already up to date");
    }
    else if (fetcher.data.ok) { shopify.toast.show("Products saved"); setLinks({ bundles: {}, accessories: {} }); setSets({}); }
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const bundles = config.bundles || [];
  const accessories = Object.entries(config.accessories || {});
  const all = [...bundles.map((b) => ({ kind: "bundles", key: b.id, item: b })), ...accessories.map(([k, a]) => ({ kind: "accessories", key: k, item: a }))];
  const setOf = (b) => (b.id in sets ? sets[b.id] : (b.components && b.components.length ? b.components : null));
  const isLinked = (r) => {
    if (r.kind === "bundles" && setOf(r.item)) return setOf(r.item).length > 0;
    const l = links[r.kind][r.key];
    return l ? !l.clear : hasProduct(r.kind === "bundles" && r.key in sets ? { variantId: r.item.variantId } : r.item);
  };
  const linked = all.filter(isLinked).length;
  const pendingCount = Object.keys(links.bundles).length + Object.keys(links.accessories).length + Object.keys(sets).length;

  const pick = async (kind, key) => {
    let selected = null;
    try {
      selected = await shopify.resourcePicker({ type: "product", multiple: false, filter: { variants: true, draft: false, archived: false } });
    } catch (e) { return; }
    const product = selected && selected[0];
    if (!product) return;
    const variants = (product.variants || []).map((v) => ({
      id: gidTail(v.id), title: v.title || "Default", price: Number(v.price),
      image: (v.image && v.image.originalSrc) || (product.images && product.images[0] && product.images[0].originalSrc) || "",
    }));
    const v = variants[0];
    if (!v) { shopify.toast.show("That product has no variants", { isError: true }); return; }
    const label = (vv) => product.title + (variants.length > 1 && vv.title && vv.title !== "Default Title" ? ` (${vv.title})` : "");
    setLinks((l) => ({ ...l, [kind]: { ...l[kind], [key]: { variantId: v.id, price: v.price, image: v.image, productTitle: label(v), variants, product: product.title } } }));
  };
  const setVariant = (kind, key, id) => setLinks((l) => {
    const cur = l[kind][key]; if (!cur || !cur.variants) return l;
    const v = cur.variants.find((x) => x.id === id); if (!v) return l;
    const title = cur.product + (v.title && v.title !== "Default Title" ? ` (${v.title})` : "");
    return { ...l, [kind]: { ...l[kind], [key]: { ...cur, variantId: v.id, price: v.price, image: v.image, productTitle: title } } };
  });
  // Gift sets
  const editSet = (b, fn) => setSets((s) => ({ ...s, [b.id]: fn((b.id in s ? s[b.id] : b.components) || []) }));
  const startSet = (b) => {
    setSets((s) => ({ ...s, [b.id]: [] }));
    setLinks((l) => { const n = { ...l.bundles }; delete n[b.id]; return { ...l, bundles: n }; });
  };
  const addToSet = async (b) => {
    let selected = null;
    try {
      selected = await shopify.resourcePicker({ type: "product", multiple: true, filter: { variants: true, draft: false, archived: false } });
    } catch (e) { return; }
    if (!selected || !selected.length) return;
    const added = selected.map((product) => {
      const variants = (product.variants || []).map((v) => ({
        id: gidTail(v.id), title: v.title || "Default", price: Number(v.price),
        image: (v.image && v.image.originalSrc) || (product.images && product.images[0] && product.images[0].originalSrc) || "",
      }));
      const v = variants[0];
      if (!v) return null;
      const label = product.title + (variants.length > 1 && v.title && v.title !== "Default Title" ? ` (${v.title})` : "");
      return { variantId: v.id, qty: 1, price: v.price, image: v.image, productTitle: label, handle: product.handle, variants, product: product.title };
    }).filter(Boolean);
    editSet(b, (cs) => cs.concat(added).slice(0, MAX_COMPONENTS));
  };
  const setQty = (b, i, qty) => editSet(b, (cs) => cs.map((c, j) => (j === i ? { ...c, qty } : c)));
  const removeFromSet = (b, i) => editSet(b, (cs) => cs.filter((c, j) => j !== i));
  const setSetVariant = (b, i, id) => editSet(b, (cs) => cs.map((c, j) => {
    if (j !== i || !c.variants) return c;
    const v = c.variants.find((x) => x.id === id); if (!v) return c;
    return { ...c, variantId: v.id, price: v.price, image: v.image, productTitle: c.product + (v.title && v.title !== "Default Title" ? ` (${v.title})` : "") };
  }));
  const backToSingle = (b) => setSets((s) => {
    if (!(b.components && b.components.length)) { const n = { ...s }; delete n[b.id]; return n; }
    return { ...s, [b.id]: null };
  });

  const clear = (kind, key) => setLinks((l) => ({ ...l, [kind]: { ...l[kind], [key]: { clear: true } } }));
  const submit = (cont) => fetcher.submit({
    intent: "save", links: JSON.stringify(links), continue: cont ? "1" : "0",
    sets: JSON.stringify(Object.fromEntries(Object.entries(sets).map(([k, cs]) => [k, cs && cs.map(cleanComponent).filter(Boolean)]))),
  }, { method: "POST" });

  return (
    <s-page heading="Connect your products.">
      <s-button slot="primary-action" onClick={() => submit(true)} {...(busy ? { loading: true } : {})}>Save and continue</s-button>
      <s-button slot="secondary-actions" href="/app/live" variant="tertiary">Skip for now</s-button>

      <s-section>
        <SetupRail current="products" done={done} />
        <s-paragraph>Each bundle and add-on needs the Shopify product it puts in the cart. Prices here are a preview; checkout always charges the live price.</s-paragraph>
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-badge tone={linked === all.length ? "success" : "warning"}>{linked === all.length ? `All ${all.length} products connected` : `${all.length - linked} of ${all.length} still need a product`}</s-badge>
          {pendingCount ? <s-text color="subdued">{`${pendingCount} unsaved change${pendingCount === 1 ? "" : "s"}`}</s-text> : <s-text color="subdued">Checkout works once they are all set. You can finish setup and come back.</s-text>}
        </s-stack>
        {linked ? (
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-button variant="secondary" onClick={() => fetcher.submit({ intent: "refresh" }, { method: "POST" })} {...(busy || pendingCount ? { disabled: true } : {})}>Refresh prices and pictures</s-button>
            <s-text color="subdued">Changed a product's photo or price? This pulls the latest into the questionnaire.</s-text>
          </s-stack>
        ) : null}
      </s-section>

      {linked < all.length ? (
        <s-section heading="No matching products yet?">
          <s-paragraph>The template's bundles and add-ons are placeholders. Rename them in Rules to match what you sell, then link each one here. You can also skip for now: the questionnaire already works in the preview, and Add to cart fills the cart once every item is linked.</s-paragraph>
          <s-stack direction="inline" gap="base">
            <s-button href="/app/rules" variant="secondary">Open Rules</s-button>
          </s-stack>
        </s-section>
      ) : null}

      <s-section heading={`Bundles (${bundles.length})`}>
        <s-paragraph color="subdued">The base sets a shopper can be recommended. The first matching one wins; the last is the fallback. Link each to one bundle product, or build it as a gift set from separate products that all go in the cart.</s-paragraph>
        <s-stack direction="block" gap="small">
          {bundles.map((b) => {
            const set = setOf(b);
            if (set) {
              return <SetRow key={b.id} item={b} components={set} currency={config.cart?.currency}
                onAdd={() => addToSet(b)} onQty={(i, q) => setQty(b, i, q)} onVariant={(i, id) => setSetVariant(b, i, id)}
                onRemove={(i) => removeFromSet(b, i)} onSingle={() => backToSingle(b)} />;
            }
            return (
              <s-stack key={b.id} direction="block" gap="small-200">
                <ProductRow item={b} kind="bundle" currency={config.cart?.currency} link={links.bundles[b.id]} onPick={() => pick("bundles", b.id)} onClear={() => clear("bundles", b.id)} onVariant={(id) => setVariant("bundles", b.id, id)} />
                <s-box><s-button variant="tertiary" onClick={() => startSet(b)}>Build this as a gift set from separate products</s-button></s-box>
              </s-stack>
            );
          })}
        </s-stack>
      </s-section>

      <s-section heading={`Add-ons (${accessories.length})`}>
        <s-paragraph color="subdued">Products the rules add on top of the bundle, one per rule.</s-paragraph>
        <s-stack direction="block" gap="small">
          {accessories.map(([k, a]) => <ProductRow key={k} item={a} kind="accessory" currency={config.cart?.currency} link={links.accessories[k]} onPick={() => pick("accessories", k)} onClear={() => clear("accessories", k)} onVariant={(id) => setVariant("accessories", k, id)} />)}
        </s-stack>
      </s-section>

      <s-section>
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-button variant="secondary" onClick={() => submit(false)} {...(busy ? { loading: true } : {})} {...(!pendingCount ? { disabled: true } : {})}>Save</s-button>
          {pendingCount ? <s-text color="subdued">Unsaved links are lost if you leave this page.</s-text> : null}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
