/* ============================================================
   Setup step 5: Go live.
   A summary of what was set up, the theme-editor link that drops the block
   in, the storefront to try it as a shopper, and the honest list of what is
   still placeholder. Finishing marks setup done; the home page becomes the
   status view and everything stays editable.
   ============================================================ */
import { useEffect } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig, themeEditorUrl, listCategories } from "../config.server";
import { SetupRail, doneSteps } from "../components/SetupRail";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config, domain } = await readConfig(admin);
  if (!config) return redirect("/app");
  const category = listCategories().find((c) => c.id === config.meta?.category) || null;
  return { config, done: doneSteps(config), editorUrl: themeEditorUrl(domain), storeUrl: `https://${domain}/`, category };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  try {
    config.meta = config.meta || {}; config.meta.setup = config.meta.setup || {};
    config.meta.setup.live = true; config.meta.setup.completedAt = new Date().toISOString();
    await saveConfig(admin, shopId, config);
  } catch (e) { return { ok: false, error: e.message }; }
  return redirect("/app");
};

export default function Live() {
  const { config, done, editorUrl, storeUrl, category } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const busy = fetcher.state !== "idle";
  const brand = config.brand || {};
  const steps = (config.steps || []).length;
  const products = [...(config.bundles || []), ...Object.values(config.accessories || {})];
  const missing = products.filter((p) => !p.variantId).length;
  const look = [brand.preset === "base" ? "Base" : "Glass", brand.matched ? "matched to your theme" : null, brand.theme?.accent ? brand.theme.accent : null].filter(Boolean).join(", ");

  useEffect(() => {
    if (fetcher.data && fetcher.data.ok === false) shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="You are ready to go live.">
      <s-button slot="primary-action" onClick={() => fetcher.submit({}, { method: "POST" })} {...(busy ? { loading: true } : {})}>Finish setup</s-button>

      <s-section>
        <SetupRail current="live" done={done} />
        <s-paragraph>Add the CraftFrame Bundle Quiz block to any page in the theme editor. It picks up this setup automatically, and you can keep editing here.</s-paragraph>
      </s-section>

      <s-section heading="What you set up">
        <s-grid gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap="small">
          {[["Category", category ? `${category.icon} ${category.label}` : "Saved"], ["Look", look], ["Questions", String(steps)], ["Products", `${products.length - missing} of ${products.length} connected`]].map(([k, v]) => (
            <s-box key={k} padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small-200">
                <s-text color="subdued">{k}</s-text>
                <s-heading>{v}</s-heading>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
        {missing ? (
          <s-banner tone="warning" heading={`${missing} product${missing === 1 ? "" : "s"} still need${missing === 1 ? "s" : ""} linking`}>
            The widget works now; those items show in the result but only reach the cart once linked. <s-link href="/app/products">Connect products</s-link>
          </s-banner>
        ) : null}
      </s-section>

      <s-section heading="Put it on your store">
        <s-stack direction="block" gap="base">
          <s-paragraph>Open the theme editor, choose the section where the questionnaire should live, then Add block, Apps, CraftFrame Bundle Quiz. Save the theme.</s-paragraph>
          <s-stack direction="inline" gap="base">
            <s-button href={editorUrl} target="_blank">Open theme editor</s-button>
            <s-button variant="secondary" href={storeUrl} target="_blank">Try it as a shopper</s-button>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Good to know">
        <s-unordered-list>
          <s-list-item>Shoppers' answers survive a refresh, and the result has a share link.</s-list-item>
          <s-list-item>Prices in the widget are a preview; checkout charges the live price.</s-list-item>
          <s-list-item>The widget adapts to your theme's colours on the storefront, and steps down to a flat look on slow devices.</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
