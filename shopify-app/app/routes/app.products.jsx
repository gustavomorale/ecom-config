/* ============================================================
   Setup step 4: Products. The only step that gates a real checkout.
   Every bundle and add-on is linked to a Shopify variant through the
   resource picker; nobody types an ID. Products with several variants get
   a variant dropdown. A sample catalogue (CSV generated from this template)
   covers stores that have nothing to link yet.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig } from "../config.server";
import { linkSamples, refreshLinked } from "../samples.server";
import { SetupRail, doneSteps } from "../components/SetupRail";
import { money } from "../lib/money";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config, domain } = await readConfig(admin);
  if (!config) return redirect("/app");
  return { config, done: doneSteps(config), importUrl: `https://${domain}/admin/products?modal=import` };
};

const gidTail = (gid) => String(gid || "").split("/").pop();

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  try {
    if (intent === "link-samples") {
      const r = await linkSamples(admin, config);
      if (!r.found) return { ok: false, intent, error: "No imported samples found yet. Import the CSV first, then try again." };
      await saveConfig(admin, shopId, config);
      return { ok: true, intent, linked: r.linked, found: r.found };
    }
    if (intent === "refresh") {
      const r = await refreshLinked(admin, config);
      if (r.checked) await saveConfig(admin, shopId, config);
      return { ok: true, intent, ...r };
    }
    let links = {};
    try { links = JSON.parse(String(form.get("links") || "{}")); } catch (e) { return { ok: false, error: "Could not read the product links" }; }
    const apply = (target, link) => {
      if (!target || !link) return;
      if (link.clear) { target.variantId = ""; delete target.productTitle; return; }
      if (!/^\d+$/.test(String(link.variantId || ""))) return;
      target.variantId = String(link.variantId);
      if (Number.isFinite(Number(link.price))) target.price = Number(link.price);
      if (typeof link.image === "string") target.image = link.image;
      if (typeof link.productTitle === "string") target.productTitle = link.productTitle.slice(0, 120);
    };
    (config.bundles || []).forEach((b) => apply(b, links.bundles && links.bundles[b.id]));
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

export default function Products() {
  const { config, done, importUrl } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [links, setLinks] = useState({ bundles: {}, accessories: {} });
  const [downloading, setDownloading] = useState(false);

  // A plain link would open outside the embedded app, without the session
  // token, and be refused. App Bridge signs fetch(), so fetch the file here
  // and hand it to the browser as a download.
  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/app/samples.csv");
      if (!res.ok) throw new Error(String(res.status));
      const name = (res.headers.get("Content-Disposition") || "").match(/filename="([^"]+)"/)?.[1] || "sample-products.csv";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      shopify.toast.show("Sample CSV downloaded");
    } catch (e) {
      shopify.toast.show("Could not download the CSV. Reload the page and try again.", { isError: true });
    } finally { setDownloading(false); }
  };
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok && fetcher.data.intent === "link-samples") shopify.toast.show(`Linked ${fetcher.data.linked} sample product${fetcher.data.linked === 1 ? "" : "s"}`);
    else if (fetcher.data.ok && fetcher.data.intent === "refresh") {
      const d = fetcher.data;
      if (d.missing) shopify.toast.show(`${d.missing} linked product${d.missing === 1 ? " no longer exists" : "s no longer exist"}. Choose ${d.missing === 1 ? "it" : "them"} again.`, { isError: true });
      else shopify.toast.show(d.changed ? `Updated ${d.changed} product${d.changed === 1 ? "" : "s"} from your catalogue` : "Prices and pictures are already up to date");
    }
    else if (fetcher.data.ok) { shopify.toast.show("Products saved"); setLinks({ bundles: {}, accessories: {} }); }
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const bundles = config.bundles || [];
  const accessories = Object.entries(config.accessories || {});
  const all = [...bundles.map((b) => ({ kind: "bundles", key: b.id, item: b })), ...accessories.map(([k, a]) => ({ kind: "accessories", key: k, item: a }))];
  const isLinked = (r) => { const l = links[r.kind][r.key]; return l ? !l.clear : !!r.item.variantId; };
  const linked = all.filter(isLinked).length;
  const pendingCount = Object.keys(links.bundles).length + Object.keys(links.accessories).length;

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
  const clear = (kind, key) => setLinks((l) => ({ ...l, [kind]: { ...l[kind], [key]: { clear: true } } }));
  const submit = (cont) => fetcher.submit({ intent: "save", links: JSON.stringify(links), continue: cont ? "1" : "0" }, { method: "POST" });

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
          <s-paragraph>Import a sample catalogue made from this template: one product per bundle and add-on, with the prices shown here and placeholder images. Good for trying the widget before your real products are ready.</s-paragraph>
          <s-stack direction="block" gap="small">
            <s-ordered-list>
              <s-list-item>Download the CSV.</s-list-item>
              <s-list-item>In Shopify, open Products, Import, and upload it.</s-list-item>
              <s-list-item>Come back here and press Link imported samples.</s-list-item>
            </s-ordered-list>
            <s-stack direction="inline" gap="base">
              <s-button onClick={downloadCsv} variant="secondary" {...(downloading ? { loading: true } : {})}>Download sample CSV</s-button>
              <s-button href={importUrl} target="_blank" variant="tertiary">Open Products import</s-button>
              <s-button onClick={() => fetcher.submit({ intent: "link-samples" }, { method: "POST" })} {...(busy ? { loading: true } : {})}>Link imported samples</s-button>
            </s-stack>
            <s-text color="subdued">Samples are tagged bundle-configurator-sample so you can find and delete them later.</s-text>
          </s-stack>
        </s-section>
      ) : null}

      <s-section heading={`Bundles (${bundles.length})`}>
        <s-paragraph color="subdued">The base sets a shopper can be recommended. The first matching one wins; the last is the fallback.</s-paragraph>
        <s-stack direction="block" gap="small">
          {bundles.map((b) => <ProductRow key={b.id} item={b} kind="bundle" currency={config.cart?.currency} link={links.bundles[b.id]} onPick={() => pick("bundles", b.id)} onClear={() => clear("bundles", b.id)} onVariant={(id) => setVariant("bundles", b.id, id)} />)}
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
