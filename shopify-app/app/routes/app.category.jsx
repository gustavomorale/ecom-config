/* ============================================================
   Setup step 1: "What are you selling?"
   Picking a category seeds a complete working template and saves it to the
   shop metafield; from that moment the theme block shows a real questionnaire.
   ============================================================ */
import { useEffect } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { listCategories, buildCategory, readConfig, saveConfig, deleteConfig } from "../config.server";
import { SetupRail, doneSteps } from "../components/SetupRail";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  return { categories: listCategories(), config, done: doneSteps(config) };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { shopId, config } = await readConfig(admin);
  try {
    if (intent === "choose") {
      if (config) await deleteConfig(admin, shopId);
      const cfg = buildCategory(String(form.get("category")));
      await saveConfig(admin, shopId, cfg);
      return redirect("/app/look");
    }
  } catch (e) {
    return { ok: false, intent, error: e.message };
  }
  return { ok: false, intent, error: "Unknown action" };
};

export default function Category() {
  const { categories, config, done } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const busy = fetcher.state !== "idle";
  const pending = busy ? fetcher.formData?.get("category") : null;

  useEffect(() => {
    if (fetcher.data && fetcher.data.ok === false) shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const choose = (id) => fetcher.submit({ intent: "choose", category: id }, { method: "POST" });

  return (
    <s-page heading="What are you selling?">
      {config ? <s-button slot="secondary-actions" href="/app" variant="tertiary">Keep current setup</s-button> : null}
      <s-section>
        <SetupRail current="category" done={done} />
        <s-paragraph>
          Pick the closest match. You get a working questionnaire straight away and edit it from there. Nothing here is final.
        </s-paragraph>
        {config ? (
          <s-banner tone="warning" heading="Choosing a category replaces your current setup">
            Questions, look and product links are rebuilt from the new template.
          </s-banner>
        ) : null}
      </s-section>
      <s-section>
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
        <s-paragraph color="subdued">Three categories ship as full templates (home security, subscription boxes, cosmetics). The rest are complete starters sized so you edit rather than author.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
