/* ============================================================
   Setup step 4: Products. The only step that gates a real checkout.
   Every bundle and add-on is linked to a Shopify variant through the
   resource picker; nobody types an ID. Title, price and image come from the
   variant so the preview matches the store. Prices stay a preview until
   Storefront API sync (v1.3); checkout always charges the live price.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig } from "../config.server";
import { SetupRail, doneSteps } from "../components/SetupRail";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return redirect("/app");
  return { config, done: doneSteps(config) };
};

const gidTail = (gid) => String(gid || "").split("/").pop();

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
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
    if (typeof link.title === "string" && link.title) target.title = link.title.slice(0, 120);
  };
  try {
    (config.bundles || []).forEach((b) => apply(b, links.bundles && links.bundles[b.id]));
    Object.keys(config.accessories || {}).forEach((k) => apply(config.accessories[k], links.accessories && links.accessories[k]));
    await saveConfig(admin, shopId, config);
  } catch (e) { return { ok: false, error: e.message }; }
  if (form.get("continue") === "1") return redirect("/app/live");
  return { ok: true };
};

function ProductRow({ item, kind, link, onPick, onClear }) {
  const variantId = link ? (link.clear ? "" : link.variantId) : item.variantId;
  const title = link && !link.clear ? link.productTitle : item.productTitle;
  const price = link && !link.clear && link.price != null ? link.price : item.price;
  const image = link && !link.clear ? link.image : item.image;
  return (
    <s-box padding="base" borderWidth="base" borderRadius="base">
      <s-stack direction="inline" gap="base" alignItems="center">
        {image ? <s-thumbnail src={image} alt="" size="small" /> : null}
        <s-stack direction="block" gap="small-200">
          <s-heading>{item.title}</s-heading>
          <s-text color="subdued">{kind === "bundle" ? (item.subtitle || "Bundle") : "Add-on"}{price != null ? ` · £${Number(price).toFixed(2)}` : ""}</s-text>
          {variantId ? <s-badge tone="success">{title ? `Linked: ${title}` : `Linked to variant ${variantId}`}</s-badge> : <s-badge tone="warning">Not linked yet</s-badge>}
        </s-stack>
        <s-stack direction="inline" gap="small" style={{ marginLeft: "auto" }}>
          <s-button variant={variantId ? "secondary" : "primary"} onClick={onPick}>{variantId ? "Change" : "Choose product"}</s-button>
          {variantId ? <s-button variant="tertiary" onClick={onClear}>Unlink</s-button> : null}
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
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) { shopify.toast.show("Products saved"); setLinks({ bundles: {}, accessories: {} }); }
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
    const variants = product.variants || [];
    const v = variants[0];
    if (!v) { shopify.toast.show("That product has no variants", { isError: true }); return; }
    const image = (v.image && v.image.originalSrc) || (product.images && product.images[0] && product.images[0].originalSrc) || "";
    const link = { variantId: gidTail(v.id), price: Number(v.price), image, productTitle: product.title + (variants.length > 1 && v.title && v.title !== "Default Title" ? ` (${v.title})` : "") };
    if (variants.length > 1) shopify.toast.show(`Linked the first of ${variants.length} variants. Variant choice per option comes in the full editor.`);
    setLinks((l) => ({ ...l, [kind]: { ...l[kind], [key]: link } }));
  };
  const clear = (kind, key) => setLinks((l) => ({ ...l, [kind]: { ...l[kind], [key]: { clear: true } } }));
  const submit = (cont) => fetcher.submit({ links: JSON.stringify(links), continue: cont ? "1" : "0" }, { method: "POST" });

  return (
    <s-page heading="Connect your products." inlineSize="large">
      <s-button slot="primary-action" onClick={() => submit(true)} {...(busy ? { loading: true } : {})}>Save and continue</s-button>
      <s-button slot="secondary-actions" href="/app/live" variant="tertiary">Skip for now</s-button>

      <s-section>
        <SetupRail current="products" done={done} />
        <s-paragraph>Each bundle and add-on needs the Shopify product it puts in the cart. Prices here are a preview; checkout always charges the live price.</s-paragraph>
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-badge tone={linked === all.length ? "success" : "warning"}>{linked === all.length ? `All ${all.length} products connected` : `${all.length - linked} of ${all.length} still need a product`}</s-badge>
          {pendingCount ? <s-text color="subdued">{`${pendingCount} unsaved change${pendingCount === 1 ? "" : "s"}`}</s-text> : <s-text color="subdued">Checkout works once they are all set. You can finish setup and come back.</s-text>}
        </s-stack>
      </s-section>

      <s-section heading="Bundles">
        <s-paragraph color="subdued">The base sets a shopper can be recommended. The first matching one wins; the last is the fallback.</s-paragraph>
        <s-stack direction="block" gap="small">
          {bundles.map((b) => <ProductRow key={b.id} item={b} kind="bundle" link={links.bundles[b.id]} onPick={() => pick("bundles", b.id)} onClear={() => clear("bundles", b.id)} />)}
        </s-stack>
      </s-section>

      <s-section heading="Add-ons">
        <s-paragraph color="subdued">Products the rules add on top of the bundle, one per rule.</s-paragraph>
        <s-stack direction="block" gap="small">
          {accessories.map(([k, a]) => <ProductRow key={k} item={a} kind="accessory" link={links.accessories[k]} onPick={() => pick("accessories", k)} onClear={() => clear("accessories", k)} />)}
        </s-stack>
      </s-section>

      <s-section>
        <s-button variant="secondary" onClick={() => submit(false)} {...(busy ? { loading: true } : {})} {...(!pendingCount ? { disabled: true } : {})}>Save</s-button>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
