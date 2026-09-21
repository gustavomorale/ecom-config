/* ============================================================
   Editor: Copy & cart.
   Every word the shopper reads, the footer attribution (empty by default:
   the widget stamps nothing), the promo code, how the cart is opened and
   whether answers are remembered. Grouped by where the text appears.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig } from "../config.server";
import { WidgetPreview } from "../components/WidgetPreview";

const GROUPS = [
  { heading: "Opening", fields: [
    ["title", "Headline", "Build your bundle"],
    ["titleHighlight", "Highlighted words in the headline", "Must appear in the headline exactly"],
    ["subtitle", "Sub-headline", ""],
  ] },
  { heading: "Questions", fields: [
    ["nextLabel", "Continue button", "Continue"],
    ["backLabel", "Back button", "Back"],
    ["finishLabel", "Last step button", "See my bundle"],
    ["requiredHint", "Hint when an answer is needed", "Choose an option to continue"],
  ] },
  { heading: "Result", fields: [
    ["resultSubtitle", "Sub-headline on the result", ""],
    ["recommendationBadge", "Badge above the bundle", "Your recommendation"],
    ["whyTitle", "\"Why this bundle\" heading", "Why this bundle?"],
    ["contentsTitle", "Contents heading", "What's included"],
    ["addonsTitle", "Add-ons heading", "Recommended add-ons"],
    ["profileTitle", "Answers heading", "Your answers"],
    ["priceSuffix", "After the price", "per set"],
    ["priceNote", "Note under the price", "Prices are a preview. Checkout shows the final price."],
  ] },
  { heading: "Cart", fields: [
    ["cartPanelLabel", "Cart panel label", "Your cart will contain"],
    ["cartHint", "Hint under the totals", ""],
    ["ctaLabel", "Add to cart button", "Add to cart"],
    ["restartLabel", "Start over button", "Start over"],
    ["shareLabel", "Share link button", "Copy a link to this bundle"],
  ] },
];
const COPY_KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f[0]));
const clip = (s, n) => String(s ?? "").replace(/[<>]/g, "").slice(0, n);

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return redirect("/app");
  return { config };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  let d;
  try { d = JSON.parse(String(form.get("data") || "{}")); } catch (e) { return { ok: false, error: "Could not read the form" }; }

  config.copy = config.copy || {};
  for (const k of COPY_KEYS) {
    if (!(k in (d.copy || {}))) continue;
    const v = clip(d.copy[k], 200);
    if (v === "" && k !== "priceNote") delete config.copy[k]; else config.copy[k] = v;
  }
  if (config.copy.titleHighlight && !(config.copy.title || "").includes(config.copy.titleHighlight)) {
    return { ok: false, error: "The highlighted words must appear in the headline exactly as typed." };
  }

  config.brand = config.brand || {};
  config.brand.name = clip(d.brand?.name, 60);
  config.brand.footerText = clip(d.brand?.footerText, 120);
  config.copy.footerPrefix = clip(d.brand?.footerPrefix, 40);
  if (!config.copy.footerPrefix) delete config.copy.footerPrefix;

  config.cart = config.cart || {};
  config.cart.mode = d.cart?.mode === "ajax" ? "ajax" : "permalink";
  const sym = clip(d.cart?.currencySymbol, 4); if (sym) config.cart.currencySymbol = sym;
  const cur = clip(d.cart?.currency, 3).toUpperCase(); if (/^[A-Z]{3}$/.test(cur)) config.cart.currency = cur;

  const pct = Math.max(0, Math.min(90, Number(d.promo?.pct) || 0));
  const code = clip(d.promo?.code, 40).replace(/\s+/g, "");
  const endsAt = /^\d{4}-\d{2}-\d{2}$/.test(String(d.promo?.endsAt || "")) ? d.promo.endsAt : "";
  config.promo = code && pct ? { code, pct, endsAt } : { code: "", pct: 0, endsAt: "" };

  const mode = ["session", "local", "none"].includes(d.persist?.mode) ? d.persist.mode : "session";
  config.persist = { ...(config.persist || {}), mode, link: d.persist?.link !== false };

  try { await saveConfig(admin, shopId, config); } catch (e) { return { ok: false, error: e.message }; }
  return { ok: true };
};

export default function Copy() {
  const { config } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const busy = fetcher.state !== "idle";
  const c0 = config.copy || {};

  const [copy, setCopy] = useState(() => Object.fromEntries(COPY_KEYS.map((k) => [k, c0[k] ?? ""])));
  const [brand, setBrand] = useState({ name: config.brand?.name || "", footerText: config.brand?.footerText || "", footerPrefix: c0.footerPrefix || "" });
  const [cart, setCart] = useState({ mode: config.cart?.mode || "permalink", currencySymbol: config.cart?.currencySymbol ?? "£", currency: config.cart?.currency || "GBP" });
  const [promo, setPromo] = useState({ code: config.promo?.code || "", pct: config.promo?.pct || "", endsAt: config.promo?.endsAt || "" });
  const [persist, setPersist] = useState({ mode: config.persist?.mode || "session", link: config.persist?.link !== false });

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) shopify.toast.show("Copy saved");
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true, duration: 8000 });
  }, [fetcher.data, shopify]);

  const save = () => fetcher.submit({ data: JSON.stringify({ copy, brand, cart, promo, persist }) }, { method: "POST" });

  const previewCfg = JSON.parse(JSON.stringify(config));
  previewCfg.copy = { ...(previewCfg.copy || {}) };
  for (const k of COPY_KEYS) { if (copy[k] !== "") previewCfg.copy[k] = copy[k]; else if (k !== "priceNote") delete previewCfg.copy[k]; }
  previewCfg.brand = { ...(previewCfg.brand || {}), name: brand.name, footerText: brand.footerText };
  if (brand.footerPrefix) previewCfg.copy.footerPrefix = brand.footerPrefix;

  return (
    <s-page heading="Copy & cart">
      <s-button slot="primary-action" onClick={save} {...(busy ? { loading: true } : {})}>Save</s-button>
      <s-button slot="secondary-actions" href="/app" variant="tertiary">Back to overview</s-button>

      <s-section>
        <s-paragraph>Every word your shoppers read. Leave a field empty to use the default shown in grey.</s-paragraph>
      </s-section>

      {GROUPS.map((g) => (
        <s-section key={g.heading} heading={g.heading}>
          <s-stack direction="block" gap="base">
            {g.fields.map(([k, label, placeholder]) => (
              <s-text-field key={k} label={label} value={copy[k]} placeholder={placeholder} onInput={(e) => setCopy((c) => ({ ...c, [k]: e.currentTarget.value }))} />
            ))}
          </s-stack>
        </s-section>
      ))}

      <s-section heading="Footer attribution">
        <s-paragraph color="subdued">Optional. Leave all three empty and the widget shows no footer at all.</s-paragraph>
        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
          <s-text-field label="Words before your name" value={brand.footerPrefix} placeholder="e.g. Curated by" onInput={(e) => setBrand((b) => ({ ...b, footerPrefix: e.currentTarget.value }))} />
          <s-text-field label="Your store name" value={brand.name} onInput={(e) => setBrand((b) => ({ ...b, name: e.currentTarget.value }))} />
        </s-grid>
        <s-text-field label="Footer note" value={brand.footerText} placeholder="e.g. Free returns within 30 days" onInput={(e) => setBrand((b) => ({ ...b, footerText: e.currentTarget.value }))} />
      </s-section>

      <s-section heading="Promo code">
        <s-paragraph color="subdued">Shown on the result and added to the checkout link. Create the matching discount code in Shopify, Discounts; this only displays and applies it.</s-paragraph>
        <s-grid gridTemplateColumns="2fr 1fr 1.4fr" gap="base">
          <s-text-field label="Code" value={promo.code} placeholder="WELCOME10" onInput={(e) => setPromo((p) => ({ ...p, code: e.currentTarget.value }))} />
          <s-number-field label="Percent off" value={promo.pct} min="0" max="90" onInput={(e) => setPromo((p) => ({ ...p, pct: e.currentTarget.value }))} />
          <s-date-field label="Ends on (optional)" value={promo.endsAt} onChange={(e) => setPromo((p) => ({ ...p, endsAt: e.currentTarget.value }))} />
        </s-grid>
      </s-section>

      <s-section heading="Cart and answers">
        <s-stack direction="block" gap="base">
          <s-select label="How the cart opens" value={cart.mode} onChange={(e) => setCart((c) => ({ ...c, mode: e.currentTarget.value }))} details="Checkout link works on every theme. On-page add keeps the shopper on the page and then opens the cart.">
            <s-option value="permalink">Checkout link (works everywhere)</s-option>
            <s-option value="ajax">Add on the page, then open the cart</s-option>
          </s-select>
          <s-text color="subdued">{`Prices show in your store's currency (${cart.currency}), formatted for each shopper's language.`}</s-text>
          <s-select label="Remember a shopper's answers" value={persist.mode} onChange={(e) => setPersist((p) => ({ ...p, mode: e.currentTarget.value }))} details="Answers never leave the shopper's browser.">
            <s-option value="session">Until they close the tab</s-option>
            <s-option value="local">Until they clear their browser</s-option>
            <s-option value="none">Do not remember</s-option>
          </s-select>
          <s-checkbox label="Show &quot;Copy a link to this bundle&quot; on the result" checked={persist.link} onChange={(e) => setPersist((p) => ({ ...p, link: e.currentTarget.checked }))} />
        </s-stack>
      </s-section>

      <s-section>
        <s-button variant="secondary" onClick={save} {...(busy ? { loading: true } : {})}>Save</s-button>
      </s-section>

      <s-section slot="aside" heading="Preview">
        <WidgetPreview config={previewCfg} />
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
