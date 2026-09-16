/* ============================================================
   Home.
   No configuration yet: the welcome. What the app does, how the five-step
   setup goes, what it can access, and that this is a beta. One button.
   Configuration saved: the status overview, with every step editable.
   ============================================================ */
import { useEffect } from "react";
import { useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { listCategories, readConfig, themeEditorUrl } from "../config.server";
import { SetupRail, doneSteps, BETA, SUPPORT_EMAIL } from "../components/SetupRail";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config, domain } = await readConfig(admin);
  const categories = listCategories();
  const current = config ? categories.find((c) => c.id === config.meta?.category) || null : null;
  return { config, current, editorUrl: themeEditorUrl(domain), storeUrl: `https://${domain}/`, done: doneSteps(config) };
};

function Welcome() {
  return (
    <s-page heading="Welcome to Bundle Configurator">
      <s-button slot="primary-action" href="/app/category">Start setup</s-button>

      <s-section>
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge tone="info">Beta</s-badge>
            <s-text color="subdued">{`Version ${BETA.version}. Free while in beta.`}</s-text>
          </s-stack>
          <s-paragraph>
            A short questionnaire on your storefront that turns a shopper's answers into a ready-made cart: the right bundle, the right add-ons, one click to checkout. You choose what to ask, the rules decide what goes in the basket, and the widget wears your store's colours.
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section heading="How it works">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {[
            ["1. Shoppers answer", "Four to six quick questions in a block you place on any page. Answers survive a refresh and can be shared as a link."],
            ["2. Rules build the bundle", "Each answer picks a base set and adds the products that fit. Every product is one of yours, linked in setup."],
            ["3. Cart is ready", "The result screen shows what's in the set and why, then opens checkout with everything pre-loaded."],
          ].map(([h, p]) => (
            <s-box key={h} padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small-200">
                <s-heading>{h}</s-heading>
                <s-paragraph color="subdued">{p}</s-paragraph>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="Setup takes about five minutes">
        <s-ordered-list>
          <s-list-item><s-text>Category.</s-text> Pick what you sell; you get a working questionnaire immediately.</s-list-item>
          <s-list-item><s-text>Look.</s-text> Match your store's colours in one click, or set your own.</s-list-item>
          <s-list-item><s-text>Questions.</s-text> Rename, reorder, add or remove.</s-list-item>
          <s-list-item><s-text>Products.</s-text> Link each bundle and add-on to one of your products. No products yet? Import a sample set.</s-list-item>
          <s-list-item><s-text>Go live.</s-text> Add the block to your theme.</s-list-item>
        </s-ordered-list>
        <s-paragraph color="subdued">Every step can be skipped and revisited. Nothing shows on your storefront until you add the block.</s-paragraph>
      </s-section>

      <s-section slot="aside" heading="What the app can access">
        <s-unordered-list>
          <s-list-item>Read your products, to link them in setup.</s-list-item>
          <s-list-item>Read your theme's settings, to match its look.</s-list-item>
          <s-list-item>Write one setting on your shop that holds your configuration.</s-list-item>
        </s-unordered-list>
        <s-paragraph color="subdued">It never edits your theme, your products or your orders, and it stores no customer data. Shoppers' answers stay in their own browser.</s-paragraph>
      </s-section>

      <s-section slot="aside" heading="This is a beta">
        <s-paragraph>You are among the first stores using it. Things may change between updates, and some editing (rules, icons, copy) is not in the app yet.</s-paragraph>
        <s-paragraph>Found something broken or missing? <s-link href={`mailto:${SUPPORT_EMAIL}?subject=Bundle%20Configurator%20beta`}>{SUPPORT_EMAIL}</s-link>. Replies within a working day.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export default function Index() {
  const { config, current, editorUrl, storeUrl, done } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data && fetcher.data.ok === false) shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  if (!config) return <Welcome />;

  const steps = (config.steps || []).length;
  const products = [...(config.bundles || []), ...Object.values(config.accessories || {})];
  const missing = products.filter((p) => !p.variantId).length;
  const finished = !!config.meta?.setup?.live;

  return (
    <s-page heading="Bundle Configurator">
      <s-button slot="primary-action" href={editorUrl} target="_blank">Open theme editor</s-button>
      <s-button slot="secondary-actions" href={storeUrl} target="_blank" variant="tertiary">View storefront</s-button>

      <s-section>
        <SetupRail current="category" done={done} />
      </s-section>

      <s-section heading={current ? `${current.icon} ${current.label}` : "Your configurator"}>
        <s-paragraph>{current ? current.blurb : "A saved configuration."}</s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-badge tone="success">{`${steps} question${steps === 1 ? "" : "s"}`}</s-badge>
          <s-badge tone={missing ? "warning" : "success"}>
            {missing ? `${missing} of ${products.length} products need linking` : `All ${products.length} products connected`}
          </s-badge>
          {finished ? <s-badge tone="success">Setup complete</s-badge> : <s-badge tone="info">Setup in progress</s-badge>}
        </s-stack>
      </s-section>

      <s-section heading={finished ? "Edit any step" : "Next steps"}>
        {finished ? (
          <s-paragraph>Setup is complete and the theme block shows this questionnaire. Use the steps above to change the look, the questions or the products at any time.</s-paragraph>
        ) : (
          <s-paragraph>The theme block now shows this questionnaire. Continue setup to match your store's look, check the questions and connect your products.</s-paragraph>
        )}
        <s-paragraph color="subdued">
          To place it: in the theme editor choose a section, then Add block, Apps, Bundle Configurator. Or Add section, Apps, for a full-width one.
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          {finished ? (missing ? <s-button href="/app/products" variant="primary">Connect products</s-button> : null) : <s-button href="/app/look" variant="primary">Continue setup</s-button>}
          <s-button href="/app/category" variant="tertiary" tone="critical">Change category</s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Setup progress">
        <s-unordered-list>
          {["Category", "Look", "Questions", "Products", "Go live"].map((label, i) => {
            const key = ["category", "look", "questions", "products", "live"][i];
            return <s-list-item key={key}>{label}{done.includes(key) ? ": done" : ""}</s-list-item>;
          })}
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Beta">
        <s-paragraph color="subdued">{`Version ${BETA.version}. Something off? `}<s-link href={`mailto:${SUPPORT_EMAIL}?subject=Bundle%20Configurator%20beta`}>Tell us</s-link>.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
