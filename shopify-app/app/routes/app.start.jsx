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
import { SetupRail, doneSteps } from "../components/SetupRail";
import { money } from "../lib/money";

const MAX_PRODUCTS = 24;
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

/* Only what the storefront needs, checked on the server. */
function cleanProduct(p, mode) {
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

  useEffect(() => {
    if (fetcher.data && fetcher.data.ok === false) shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const rebuilds = !!data.simple && (data.simple.mode !== mode || data.category !== category);
  const mains = products.filter((p) => mode === "finder" || p.role !== "extra");
  const extras = mode === "bundle" ? products.filter((p) => p.role === "extra") : [];

  const pick = async (role) => {
    let selected = null;
    try {
      selected = await shopify.resourcePicker({
        type: "product", multiple: true, filter: { variants: false, draft: false, archived: false },
        selectionIds: products.filter((p) => p.productId && (mode === "finder" || (p.role || "main") === role)).map((p) => ({ id: `gid://shopify/Product/${p.productId}` })),
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
      ...cur.filter((p) => mode === "bundle" && (p.role || "main") !== role && !pickedIds.has(p.productId)),
      ...picked,
    ].slice(0, MAX_PRODUCTS));
  };
  const setVariant = (key, id) => setProducts((cur) => cur.map((p) => {
    if (p.key !== key || !p.variants) return p;
    const v = p.variants.find((x) => x.id === id); if (!v) return p;
    return { ...p, variantId: v.id, price: v.price, image: v.image, productTitle: p.product + (v.title && v.title !== "Default Title" ? ` (${v.title})` : "") };
  }));
  const remove = (key) => setProducts((cur) => cur.filter((p) => p.key !== key));
  const save = () => fetcher.submit({ mode, category, products: JSON.stringify(products.map(({ variants, product, ...p }) => p)) }, { method: "POST" });

  const categoryOptions = useMemo(() => data.categories, [data.categories]);

  const list = (items) => (
    <s-stack direction="block" gap="small">
      {items.map((p) => (
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
          {categoryOptions.map((c) => <s-option key={c.id} value={c.id}>{`${c.icon} ${c.label}`}</s-option>)}
        </s-select>
        {rebuilds ? <s-banner tone="info">Changing this gives you fresh questions in the next step. Your products are kept.</s-banner> : null}
      </s-section>

      <s-section heading={mode === "bundle" ? `Main products (${mains.length})` : `Products to recommend (${mains.length})`}>
        <s-stack direction="block" gap="base">
          <s-paragraph color="subdued">{mode === "bundle" ? "Each shopper gets one of these, the one that best fits their answers." : "Each shopper gets the one that best fits their answers. Three to eight works well."}</s-paragraph>
          {mains.length ? list(mains) : null}
          <s-box><s-button variant={mains.length ? "secondary" : "primary"} onClick={() => pick("main")}>{mains.length ? "Change products" : "Choose products"}</s-button></s-box>
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
