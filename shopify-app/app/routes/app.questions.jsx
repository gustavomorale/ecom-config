/* ============================================================
   Setup step 3: Questions.
   Retitle, reorder, remove. Option labels are editable; icons and new
   questions belong to the full editor. Saved as one array, the server keeps
   the structure it knows and drops anything else.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig } from "../config.server";
import { SetupRail, doneSteps } from "../components/SetupRail";
import { WidgetPreview } from "../components/WidgetPreview";

const TYPES = ["choice", "boolean", "counters", "toggles", "multi"];

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return redirect("/app");
  return { config, done: doneSteps(config) };
};

/* Merge the client's edits onto the saved steps by id. Order and removal
   come from the client; everything not editable here stays as saved. */
function mergeSteps(saved, incoming) {
  const byId = new Map((saved || []).map((s) => [s.id, s]));
  const out = [];
  for (const inc of incoming) {
    const base = byId.get(inc.id);
    if (!base || !TYPES.includes(base.type)) continue;
    const st = JSON.parse(JSON.stringify(base));
    if (typeof inc.question === "string") st.question = inc.question.slice(0, 160);
    if (typeof inc.sub === "string") st.sub = inc.sub.slice(0, 240);
    for (const kind of ["options", "counters", "toggles"]) {
      if (!Array.isArray(st[kind]) || !Array.isArray(inc[kind])) continue;
      st[kind].forEach((o, i) => { if (inc[kind][i] && typeof inc[kind][i].label === "string") o.label = inc[kind][i].label.slice(0, 80); });
    }
    out.push(st);
  }
  return out;
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  let incoming = [];
  try { incoming = JSON.parse(String(form.get("steps") || "[]")); } catch (e) { return { ok: false, error: "Could not read the questions" }; }
  if (!Array.isArray(incoming) || !incoming.length) return { ok: false, error: "Keep at least one question" };
  try {
    config.steps = mergeSteps(config.steps, incoming);
    config.meta = config.meta || {}; config.meta.setup = config.meta.setup || {}; config.meta.setup.questions = true;
    await saveConfig(admin, shopId, config);
  } catch (e) { return { ok: false, error: e.message }; }
  if (form.get("continue") === "1") return redirect("/app/products");
  return { ok: true };
};

export default function Questions() {
  const { config, done } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [steps, setSteps] = useState(() => JSON.parse(JSON.stringify(config.steps || [])));
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) shopify.toast.show("Questions saved");
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const update = (i, patch) => setSteps((s) => s.map((st, j) => (j === i ? { ...st, ...patch } : st)));
  const updateKid = (i, kind, j, label) => setSteps((s) => s.map((st, k) => k !== i ? st : { ...st, [kind]: st[kind].map((o, m) => (m === j ? { ...o, label } : o)) }));
  const move = (i, d) => setSteps((s) => { const a = s.slice(); const t = a[i]; a[i] = a[i + d]; a[i + d] = t; return a; });
  const remove = (i) => setSteps((s) => s.filter((_, j) => j !== i));
  const submit = (cont) => fetcher.submit({ steps: JSON.stringify(steps), continue: cont ? "1" : "0" }, { method: "POST" });

  const n = steps.length;
  const tone = n >= 4 && n <= 6 ? "success" : "warning";
  const hint = n > 6 ? "Consider removing one or two. Every extra step loses some shoppers." : n < 4 ? "Short is fine. Add a question only if it changes what goes in the cart." : "Good length.";

  const previewCfg = { ...config, steps };

  return (
    <s-page heading="Check the questions." inlineSize="large">
      <s-button slot="primary-action" onClick={() => submit(true)} {...(busy ? { loading: true } : {})}>Save and continue</s-button>
      <s-button slot="secondary-actions" href="/app/products" variant="tertiary">Skip for now</s-button>

      <s-section>
        <SetupRail current="questions" done={done} />
        <s-paragraph>Retitle, reorder or remove. Shoppers finish more often with 4 to 6 questions.</s-paragraph>
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-badge tone={tone}>{`${n} question${n === 1 ? "" : "s"}`}</s-badge>
          <s-text color="subdued">{hint}</s-text>
        </s-stack>
      </s-section>

      {steps.map((st, i) => {
        const kinds = ["options", "counters", "toggles"].filter((k) => Array.isArray(st[k]) && st[k].length);
        return (
          <s-section key={st.id} heading={`${i + 1}. ${st.question || st.id}`}>
            <s-stack direction="block" gap="base">
              <s-text-field label="Question" value={st.question || ""} onInput={(e) => update(i, { question: e.currentTarget.value })} />
              <s-text-field label="Helper text" value={st.sub || ""} onInput={(e) => update(i, { sub: e.currentTarget.value })} />
              {kinds.map((kind) => (
                <s-stack key={kind} direction="block" gap="small-200">
                  <s-text color="subdued">{kind === "options" ? "Options" : kind === "counters" ? "Counters" : "Toggles"}</s-text>
                  {st[kind].map((o, j) => (
                    <s-text-field key={j} label={`${j + 1}`} labelAccessibilityVisibility="exclusive" value={o.label || ""} onInput={(e) => updateKid(i, kind, j, e.currentTarget.value)} />
                  ))}
                </s-stack>
              ))}
              <s-stack direction="inline" gap="small">
                {i > 0 ? <s-button variant="tertiary" onClick={() => move(i, -1)}>Move up</s-button> : null}
                {i < n - 1 ? <s-button variant="tertiary" onClick={() => move(i, 1)}>Move down</s-button> : null}
                {n > 1 ? <s-button variant="tertiary" tone="critical" onClick={() => remove(i)}>Remove</s-button> : null}
              </s-stack>
            </s-stack>
          </s-section>
        );
      })}

      <s-section>
        <s-button variant="secondary" onClick={() => submit(false)} {...(busy ? { loading: true } : {})}>Save</s-button>
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
