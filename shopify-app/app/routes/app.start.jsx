/* ============================================================
   Simple setup, step 1 of 3: Your products.
   The merchant says what shoppers should end up with (one product, or a main
   product plus extras), what they sell (the category only supplies the
   questions and wording) and picks the products to recommend from their own
   catalogue. Nothing made up is ever shown to shoppers. On the first save the
   look is matched to the published theme, so there is no separate Look step.
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { listCategories, readConfig, saveConfig, buildSimple, recompile, isSimple, simple as simpleApi } from "../config.server";
import { readThemeLook } from "../theme.server";
import { refreshLinked } from "../products.server";
import { SetupRail, doneSteps } from "../components/SetupRail";
import { money } from "../lib/money";
import { QuizBar } from "../components/QuizBar";

const MAX_PRODUCTS = 24;

/* A gift set's price is the sum of its products when every one has a price. */
const setItem = (p) => ({
  ...p, role: "main", set: true, variantId: "",
  price: p.components.length && p.components.every((c) => Number(c.price) > 0) ? p.components.reduce((t, c) => t + Number(c.price) * (c.qty || 1), 0) : 0,
  image: (p.components[0] && p.components[0].image) || "",
});
const gidTail = (gid) => String(gid || "").split("/").pop();

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  const simple = isSimple(config) ? config.simple : null;
  return {
    categories: listCategories().filter((c) => c.id !== "blank"),
    category: config?.meta?.category || "",
    simple,
    advanced: !!(config && !simple),
    currency: config?.cart?.currency || "",
    done: doneSteps(config),
  };
};

const MAX_COMPONENTS = 12;
function cleanComponent(c) {
  if (!c || !/^\d+$/.test(String(c.variantId || ""))) return null;
  const out = { variantId: String(c.variantId), qty: Math.min(99, Math.max(1, Math.floor(Number(c.qty) || 1))) };
  if (Number.isFinite(Number(c.price))) out.price = Number(c.price);
  if (typeof c.productTitle === "string") { out.productTitle = c.productTitle.slice(0, 120); out.title = out.productTitle; }
  if (typeof c.image === "string") out.image = c.image;
  if (/^[a-z0-9][a-z0-9-]{0,254}$/.test(String(c.handle || ""))) out.handle = c.handle;
  return out;
}

/* A gift set: several of the store's products that all go in the cart,
   under a name the merchant gives it. Only main products can be sets. */
function cleanSet(p) {
  const components = (Array.isArray(p.components) ? p.components : []).map(cleanComponent).filter(Boolean).slice(0, MAX_COMPONENTS);
  if (!components.length) return null;
  return {
    key: /^g[a-z0-9]{1,20}$/.test(String(p.key || "")) ? p.key : `g${Date.now().toString(36)}`,
    role: "main", set: true, variantId: "",
    productTitle: String(p.productTitle || "").replace(/\s+/g, " ").trim().slice(0, 120) || "Gift set",
    price: components.every((c) => c.price > 0) ? components.reduce((t, c) => t + c.price * c.qty, 0) : 0,
    image: components[0].image || "",
    components,
  };
}

/* Only what the storefront needs, checked on the server. */
function cleanProduct(p, mode) {
  if (p && p.set) return cleanSet(p);
  if (!p || !/^\d+$/.test(String(p.variantId || ""))) return null;
  const out = {
    key: /^p\d+$/.test(String(p.key || "")) ? p.key : `p${p.variantId}`,
    role: mode === "bundle" && p.role === "extra" ? "extra" : "main",
    variantId: String(p.variantId),
    productTitle: String(p.productTitle || "").slice(0, 120),
    price: Number.isFinite(Number(p.price)) ? Number(p.price) : 0,
    image: typeof p.image === "string" ? p.image : "",
  };
  if (/^\d+$/.test(String(p.productId || ""))) out.productId = String(p.productId);
  if (/^[a-z0-9][a-z0-9-]{0,254}$/.test(String(p.handle || ""))) out.handle = p.handle;
  if (typeof p.productType === "string") out.productType = p.productType.slice(0, 80);
  if (Array.isArray(p.tags)) out.tags = p.tags.filter((t) => typeof t === "string").slice(0, 20).map((t) => t.slice(0, 40));
  return out;
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const { shopId, config } = await readConfig(admin);
  if (form.get("intent") === "refresh") {
    if (!isSimple(config)) return { ok: false, error: "No simple setup yet" };
    try {
      const r = await refreshLinked(admin, config);           // updates the copies held in config.simple.products
      if (r.checked) await saveConfig(admin, shopId, recompile(config, config.simple));
      return { ok: true, intent: "refresh", ...r };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  const mode = form.get("mode") === "bundle" ? "bundle" : "finder";
  const category = String(form.get("category") || "");
  let products = [];
  try { products = JSON.parse(String(form.get("products") || "[]")); } catch (e) { return { ok: false, error: "Could not read the products" }; }
  products = products.map((p) => cleanProduct(p, mode)).filter(Boolean)
    .filter((p, i, arr) => arr.findIndex((x) => x.key === p.key) === i).slice(0, MAX_PRODUCTS);
  if (!products.some((p) => p.role === "main")) return { ok: false, error: mode === "bundle" ? "Pick at least one main product" : "Pick at least one product" };
  if (!listCategories().some((c) => c.id === category)) return { ok: false, error: "Choose what you sell" };

  try {
    const prev = isSimple(config) ? config.simple : null;
    let next;
    if (!prev || prev.mode !== mode || config.meta?.category !== category) {
      // New setup, or a different kind of quiz: fresh questions from the category.
      next = buildSimple(category, mode, products);
      if (config) {
        // Keep what the merchant already chose about the look, copy and cart.
        ["brand", "cart", "promo", "persist", "pricing"].forEach((k) => { if (config[k]) next[k] = config[k]; });
        next.meta = { ...next.meta, setup: { ...(config.meta?.setup || {}), questions: false } };
      }
      next.meta = { ...next.meta, category, createdAt: next.meta?.createdAt || new Date().toISOString() };
    } else {
      // Same quiz, products changed: keep the questions and ticks, suggest ticks
      // for questions that have none yet.
      const draft = { ...prev, products };
      simpleApi().suggestGrid(draft);
      next = recompile(config, draft);
    }
    // First time: match the look to the published theme on the way.
    if (!next.brand?.matched) {
      try {
        const look = await readThemeLook(admin);
        next.brand = next.brand || {};
        if (look.tokens) { next.brand.inherited = look.tokens; next.brand.appearance = look.readings?.appearance || "auto"; }
        next.brand.matched = { theme: look.theme, confidence: look.confidence, readings: look.readings || null, at: new Date().toISOString() };
      } catch (e) { /* the look can be matched later from the Look page */ }
    }
    await saveConfig(admin, shopId, next);
  } catch (e) { return { ok: false, error: e.message }; }
  return redirect("/app/grid");
};

function ModeCard({ value, current, title, text, onChoose }) {
  const on = value === current;
  return (
    <s-clickable onClick={() => onChoose(value)} accessibilityLabel={title} padding="base" borderWidth="base" borderRadius="base" background={on ? "subdued" : "base"} {...(on ? { borderColor: "strong" } : {})}>
      <s-stack direction="block" gap="small-200">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-heading>{title}</s-heading>
          {on ? <s-badge tone="info">Selected</s-badge> : null}
        </s-stack>
        <s-paragraph color="subdued">{text}</s-paragraph>
      </s-stack>
    </s-clickable>
  );
}

export default function Start() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [mode, setMode] = useState(data.simple?.mode || "finder");
  const [category, setCategory] = useState(data.category && data.categories.some((c) => c.id === data.category) ? data.category : "");
  const [products, setProducts] = useState(data.simple?.products || []);
  const busy = fetcher.state !== "idle";
  const sig = (list) => (list || []).map((p) => `${p.key}:${p.role}:${p.variantId}:${p.productTitle}:${(p.components || []).map((c) => c.variantId).join("+")}`).join("|");
  const unsaved = !!data.simple && sig(products) !== sig(data.simple.products);

  useEffect(() => {
    const d = fetcher.data;
    if (!d) return;
    if (d.ok === false) shopify.toast.show(d.error || "Something went wrong", { isError: true });
    else if (d.intent === "refresh") {
      if (d.missing) shopify.toast.show(`${d.missing} product${d.missing === 1 ? " no longer exists" : "s no longer exist"}. Remove ${d.missing === 1 ? "it" : "them"} and choose again.`, { isError: true });
      else shopify.toast.show(d.changed ? `Updated ${d.changed} product${d.changed === 1 ? "" : "s"} from your catalogue` : "Prices and pictures are already up to date");
    }
  }, [fetcher.data, shopify]);

  // After a refresh the loader has the new copies; show them.
  useEffect(() => { if (fetcher.data?.intent === "refresh" && data.simple) setProducts(data.simple.products); }, [data.simple, fetcher.data]);

  const rebuilds = !!data.simple && (data.simple.mode !== mode || data.category !== category);
  const mains = products.filter((p) => mode === "finder" || p.role !== "extra");
  const extras = mode === "bundle" ? products.filter((p) => p.role === "extra") : [];

  const pick = async (role) => {
    let selected = null;
    try {
      selected = await shopify.resourcePicker({
        type: "product", multiple: true, filter: { variants: false, draft: false, archived: false },
        selectionIds: products.filter((p) => !p.set && p.productId && (mode === "finder" || (p.role || "main") === role)).map((p) => ({ id: `gid://shopify/Product/${p.productId}` })),
      });
    } catch (e) { return; }
    if (!selected) return;
    const picked = selected.map((product) => {
      const variants = (product.variants || []).map((v) => ({
        id: gidTail(v.id), title: v.title || "Default", price: Number(v.price),
        image: (v.image && v.image.originalSrc) || (product.images && product.images[0] && product.images[0].originalSrc) || "",
      }));
      const v = variants[0];
      if (!v) return null;
      const existing = products.find((p) => p.productId === gidTail(product.id));
      const chosen = existing ? variants.find((x) => x.id === existing.variantId) || v : v;
      return {
        key: existing?.key || `p${chosen.id}`, role, productId: gidTail(product.id),
        variantId: chosen.id, price: chosen.price, image: chosen.image,
        productTitle: product.title + (variants.length > 1 && chosen.title !== "Default Title" ? ` (${chosen.title})` : ""),
        product: product.title, handle: product.handle, productType: product.productType || "", tags: product.tags || [], variants,
      };
    }).filter(Boolean);
    const pickedIds = new Set(picked.map((p) => p.productId));
    setProducts((cur) => [
      ...cur.filter((p) => p.set || (mode === "bundle" && (p.role || "main") !== role && !pickedIds.has(p.productId))),
      ...picked,
    ].slice(0, MAX_PRODUCTS));
  };
  const setVariant = (key, id) => setProducts((cur) => cur.map((p) => {
    if (p.key !== key || !p.variants) return p;
    const v = p.variants.find((x) => x.id === id); if (!v) return p;
    return { ...p, variantId: v.id, price: v.price, image: v.image, productTitle: p.product + (v.title && v.title !== "Default Title" ? ` (${v.title})` : "") };
  }));
  const remove = (key) => setProducts((cur) => cur.filter((p) => p.key !== key));

  // Gift sets
  const pickComponents = async () => {
    let selected = null;
    try { selected = await shopify.resourcePicker({ type: "product", multiple: true, filter: { variants: false, draft: false, archived: false } }); } catch (e) { return null; }
    if (!selected || !selected.length) return null;
    return selected.map((product) => {
      const v = (product.variants || [])[0];
      if (!v) return null;
      return {
        variantId: gidTail(v.id), qty: 1, price: Number(v.price), handle: product.handle,
        image: (v.image && v.image.originalSrc) || (product.images && product.images[0] && product.images[0].originalSrc) || "",
        productTitle: product.title + ((product.variants || []).length > 1 && v.title && v.title !== "Default Title" ? ` (${v.title})` : ""),
      };
    }).filter(Boolean);
  };
  const addSet = async () => {
    const comps = await pickComponents();
    if (!comps) return;
    const key = `g${Date.now().toString(36)}`;
    setProducts((cur) => [...cur, setItem({ key, productTitle: "", components: comps.slice(0, 12) })].slice(0, MAX_PRODUCTS));
  };
  const addToSet = async (key) => {
    const comps = await pickComponents();
    if (!comps) return;
    setProducts((cur) => cur.map((p) => (p.key === key ? setItem({ ...p, components: [...p.components, ...comps].slice(0, 12) }) : p)));
  };
  const removeFromSet = (key, i) => setProducts((cur) => cur.map((p) => (p.key === key ? setItem({ ...p, components: p.components.filter((c, j) => j !== i) }) : p)).filter((p) => !p.set || p.components.length));
  const renameSet = (key, name) => setProducts((cur) => cur.map((p) => (p.key === key ? { ...p, productTitle: name } : p)));
  const save = () => fetcher.submit({ mode, category, products: JSON.stringify(products.map(({ variants, product, ...p }) => p)) }, { method: "POST" });

  const categoryOptions = useMemo(() => data.categories, [data.categories]);

  const setRow = (p) => (
    <s-box key={p.key} padding="base" borderWidth="base" borderRadius="base">
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-badge tone="info">Gift set</s-badge>
          <s-text color="subdued">{`${p.components.length} product${p.components.length === 1 ? "" : "s"}${p.price ? `, ${money(p.price, data.currency)} in total` : ""}. All of them go in the cart.`}</s-text>
        </s-stack>
        <s-text-field label="Name shoppers see" value={p.productTitle} placeholder="e.g. The cosy night in" onInput={(e) => renameSet(p.key, e.currentTarget.value)} />
        {p.components.map((c, i) => (
          <s-grid key={`${c.variantId}-${i}`} gridTemplateColumns="40px 1fr auto" gap="base" alignItems="center">
            <s-grid-item>{c.image ? <s-thumbnail src={c.image} alt="" size="small-200" /> : <s-box inlineSize="36px" blockSize="36px" borderWidth="base" borderRadius="base" background="subdued" />}</s-grid-item>
            <s-grid-item><s-text>{`${c.productTitle} · ${money(c.price, data.currency)}`}</s-text></s-grid-item>
            <s-grid-item><s-button variant="tertiary" onClick={() => removeFromSet(p.key, i)} accessibilityLabel={`Remove ${c.productTitle} from the set`}>Remove</s-button></s-grid-item>
          </s-grid>
        ))}
        <s-stack direction="inline" gap="small">
          <s-button variant="secondary" onClick={() => addToSet(p.key)} {...(p.components.length >= 12 ? { disabled: true } : {})}>Add products to the set</s-button>
          <s-button variant="tertiary" tone="critical" onClick={() => remove(p.key)}>Remove the set</s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );

  const list = (items) => (
    <s-stack direction="block" gap="small">
      {items.map((p) => p.set ? setRow(p) : (
        <s-box key={p.key} padding="small" borderWidth="base" borderRadius="base">
          <s-grid gridTemplateColumns="48px 1fr auto" gap="base" alignItems="center">
            <s-grid-item>{p.image ? <s-thumbnail src={p.image} alt="" size="small" /> : <s-box inlineSize="44px" blockSize="44px" borderWidth="base" borderRadius="base" background="subdued" />}</s-grid-item>
            <s-grid-item>
              <s-stack direction="block" gap="small-200">
                <s-text type="strong">{p.productTitle}</s-text>
                {p.variants && p.variants.length > 1 ? (
                  <s-select label="Variant" labelAccessibilityVisibility="exclusive" value={p.variantId} onChange={(e) => setVariant(p.key, e.currentTarget.value)}>
                    {p.variants.map((v) => <s-option key={v.id} value={v.id}>{`${v.title} · ${money(v.price, data.currency)}`}</s-option>)}
                  </s-select>
                ) : <s-text color="subdued">{money(p.price, data.currency)}</s-text>}
              </s-stack>
            </s-grid-item>
            <s-grid-item><s-button variant="tertiary" onClick={() => remove(p.key)} accessibilityLabel={`Remove ${p.productTitle}`}>Remove</s-button></s-grid-item>
          </s-grid>
        </s-box>
      ))}
    </s-stack>
  );

  return (
    <s-page heading="Your products">
      <s-button slot="primary-action" onClick={save} {...(busy ? { loading: true } : {})} {...(!mains.length || !category ? { disabled: true } : {})}>Save and continue</s-button>
      <QuizBar />

      <s-section>
        <SetupRail current="products" done={data.done} simple />
        <s-paragraph>Pick the products the quiz recommends. Only products your store already sells: shoppers never see anything made up.</s-paragraph>
        {data.advanced ? (
          <s-banner tone="warning" heading="This replaces your advanced setup">
            Your store uses the advanced setup (rules and templates). Saving here starts a simple setup instead; your look and cart settings are kept.
          </s-banner>
        ) : null}
      </s-section>

      <s-section heading="What should shoppers end up with?">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap="base">
          <ModeCard value="finder" current={mode} onChoose={setMode} title="Product finder" text="Two or three questions, one product per shopper. Set up in about two minutes." />
          <ModeCard value="bundle" current={mode} onChoose={setMode} title="Bundle quiz" text="A main product plus the extras that fit, in one cart." />
        </s-grid>
      </s-section>

      <s-section heading="What do you sell?">
        <s-select label="Closest match" value={category} onChange={(e) => setCategory(e.currentTarget.value)} details="This only suggests the questions and their wording. You can change every word in the next step.">
          <s-option value="">Choose one</s-option>
          {categoryOptions.map((c) => <s-option key={c.id} value={c.id}>{`${c.icon} ${c.label}${c.seasonLabel ? ` (${c.seasonLabel})` : ""}`}</s-option>)}
        </s-select>
        {rebuilds ? <s-banner tone="info">Changing this gives you fresh questions in the next step. Your products are kept.</s-banner> : null}
      </s-section>

      <s-section heading={mode === "bundle" ? `Main products (${mains.length})` : `Products to recommend (${mains.length})`}>
        <s-stack direction="block" gap="base">
          <s-paragraph color="subdued">{mode === "bundle" ? "Each shopper gets one of these, the one that best fits their answers." : "Each shopper gets the one that best fits their answers. Three to eight works well."}</s-paragraph>
          {mains.length ? list(mains) : null}
          <s-stack direction="inline" gap="small">
            <s-button variant={mains.length ? "secondary" : "primary"} onClick={() => pick("main")}>{mains.some((p) => !p.set) ? "Change products" : "Choose products"}</s-button>
            <s-button variant="secondary" onClick={addSet}>Add a gift set</s-button>
          </s-stack>
          <s-text color="subdued">A gift set is several of your products sold together under one name, without creating a bundle product in Shopify.</s-text>
        </s-stack>
      </s-section>

      {mode === "bundle" ? (
        <s-section heading={`Extras (${extras.length})`}>
          <s-stack direction="block" gap="base">
            <s-paragraph color="subdued">Optional. Accessories that go in the cart with the main product when the answers call for them.</s-paragraph>
            {extras.length ? list(extras) : null}
            <s-box><s-button variant="secondary" onClick={() => pick("extra")}>{extras.length ? "Change extras" : "Choose extras"}</s-button></s-box>
          </s-stack>
        </s-section>
      ) : null}

      {data.simple ? (
        <s-section slot="aside" heading="Prices and pictures">
          <s-stack direction="block" gap="small">
            <s-paragraph color="subdued">Changed a product's price or photo in Shopify? Pull the latest into the quiz. Checkout always charges the live price.</s-paragraph>
            <s-box><s-button variant="secondary" onClick={() => fetcher.submit({ intent: "refresh" }, { method: "POST" })} {...(busy || unsaved ? { disabled: true } : {})}>Refresh from my catalogue</s-button></s-box>
            {unsaved ? <s-text color="subdued">Save your product changes first.</s-text> : null}
          </s-stack>
        </s-section>
      ) : null}

      <s-section slot="aside" heading="Setup, step 1 of 3">
        <s-paragraph>Your products, then Questions, then Go live. About five minutes.</s-paragraph>
        <s-paragraph color="subdued">Your theme's colours, type and corners are matched automatically when you save. You can fine-tune them later under Look.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
