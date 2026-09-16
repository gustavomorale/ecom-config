/* ============================================================
   Home. First access: step 1 of setup, "What are you selling?".
   Picking a category seeds a complete working template and saves it to the
   shop metafield; from that moment the theme block shows a real questionnaire.
   With a config saved, this page is the status overview. The remaining setup
   steps (Look, Questions, Products, Go live) land here next.
   ============================================================ */
import { useEffect } from "react";
import { useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { listCategories, buildCategory, readConfig, saveConfig, deleteConfig, themeEditorUrl } from "../config.server";
import { SetupRail, doneSteps } from "../components/SetupRail";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config, domain } = await readConfig(admin);
  const categories = listCategories();
  const current = config ? categories.find((c) => c.id === config.meta?.category) || null : null;
  return { categories, config, current, editorUrl: themeEditorUrl(domain), done: doneSteps(config) };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { shopId } = await readConfig(admin);
  try {
    if (intent === "choose") {
      const cfg = buildCategory(String(form.get("category")));
      await saveConfig(admin, shopId, cfg);
      return { ok: true, intent, category: cfg.meta.category };
    }
    if (intent === "reset") {
      await deleteConfig(admin, shopId);
      return { ok: true, intent };
    }
  } catch (e) {
    return { ok: false, intent, error: e.message };
  }
  return { ok: false, intent, error: "Unknown action" };
};

export default function Index() {
  const { categories, config, current, editorUrl, done } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const busy = fetcher.state !== "idle";
  const pending = busy ? fetcher.formData?.get("category") : null;

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok && fetcher.data.intent === "choose") shopify.toast.show("Template saved. Your questionnaire is live in the theme block.");
    if (fetcher.data.ok && fetcher.data.intent === "reset") shopify.toast.show("Reset. Pick a category to start again.");
    if (!fetcher.data.ok) shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const choose = (id) => fetcher.submit({ intent: "choose", category: id }, { method: "POST" });
  const reset = () => fetcher.submit({ intent: "reset" }, { method: "POST" });

  if (!config) {
    return (
      <s-page heading="What are you selling?">
        <s-section>
          <s-paragraph>
            Pick the closest match. You get a working questionnaire straight away and edit it from there. Nothing here is final.
          </s-paragraph>
          <s-grid gridTemplateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap="base">
            {categories.map((c) => (
              <s-box key={c.id} padding="base" borderWidth="base" borderRadius="base" background="base">
                <s-stack direction="block" gap="small-200">
                  <s-text>{c.icon}</s-text>
                  <s-heading>{c.label}</s-heading>
                  <s-paragraph color="subdued">{c.blurb}</s-paragraph>
                  <s-button
                    variant={c.id === "blank" ? "tertiary" : "secondary"}
                    onClick={() => choose(c.id)}
                    {...(pending === c.id ? { loading: true } : {})}
                    {...(busy && pending !== c.id ? { disabled: true } : {})}
                  >
                    {c.id === "blank" ? "Start from blank" : "Use this"}
                  </s-button>
                </s-stack>
              </s-box>
            ))}
          </s-grid>
        </s-section>
        <s-section slot="aside" heading="Setup, step 1 of 5">
          <s-paragraph>Category, then Look, Questions, Products, Go live. One decision per step, about five minutes in all.</s-paragraph>
        </s-section>
      </s-page>
    );
  }

  const steps = (config.steps || []).length;
  const products = [...(config.bundles || []), ...Object.values(config.accessories || {})];
  const missing = products.filter((p) => !p.variantId).length;
  const finished = !!config.meta?.setup?.live;

  return (
    <s-page heading="Bundle Configurator">
      <s-button slot="primary-action" href={editorUrl} target="_blank">Add the block to your theme</s-button>
      <s-section>
        <SetupRail current="category" done={done} />
      </s-section>
      <s-section heading={current ? `${current.icon} ${current.label}` : "Your configurator"}>
        <s-paragraph>{current ? current.blurb : "A saved configuration."}</s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-badge tone="success">{`${steps} question${steps === 1 ? "" : "s"}`}</s-badge>
          <s-badge tone={missing ? "warning" : "success"}>
            {missing ? `${missing} of ${products.length} products need a variant` : `All ${products.length} products connected`}
          </s-badge>
        </s-stack>
      </s-section>
      <s-section heading={finished ? "Edit any step" : "Next steps"}>
        {finished ? (
          <s-paragraph>Setup is complete and the theme block shows this questionnaire. Use the steps above to change the look, the questions or the products at any time.</s-paragraph>
        ) : (
          <s-paragraph>
            The theme block now shows this questionnaire. Continue setup to match your store's look, check the questions and connect your products.
          </s-paragraph>
        )}
        {finished ? (missing ? <s-button href="/app/products" variant="primary">Connect products</s-button> : null) : <s-button href="/app/look" variant="primary">Continue setup</s-button>}
        <s-paragraph color="subdued">
          If the block is not added for you, in the theme editor choose a section, then Add block, Apps, Bundle Configurator.
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-button href={editorUrl} target="_blank">Open theme editor</s-button>
          <s-button variant="tertiary" tone="critical" onClick={reset} {...(busy ? { loading: true } : {})}>
            Change category
          </s-button>
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
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
