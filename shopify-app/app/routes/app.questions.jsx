/* ============================================================
   Setup step 3: Questions.
   Retitle, reorder, remove, add. Per question: compact rows or picture cards.
   Per option: label, description and a visual, which is an emoji, a picture
   picked from the store (a product's or a collection's image) or a custom https
   link. Whether an answer is required is set here too. Saved as one array, the server keeps
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

/* Icons. Templates store emoji as HTML entities ("&#x1F4A7;"); the editor shows
   the character. On save only plain characters survive, because the storefront
   prints the icon as HTML. */
const decodeIcon = (s) => String(s || "").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)));
const cleanIcon = (s) => [...decodeIcon(s).replace(/[<>&"'`]/g, "").trim()].slice(0, 4).join("");

/* Templates for "Add a question". Ids get a suffix so two of a kind can coexist. */
const NEW_STEPS = [
  { type: "choice", label: "Single choice", make: (n) => ({ _new: true, id: `choice${n}`, type: "choice", field: `choice${n}`, required: true, question: "Which of these fits best?", sub: "Pick one.", options: [{ value: "a", label: "First option" }, { value: "b", label: "Second option" }, { value: "c", label: "Third option" }] }) },
  { type: "multi", label: "Multiple choice", make: (n) => ({ _new: true, id: `multi${n}`, type: "multi", field: `multi${n}`, required: false, question: "Which of these matter to you?", sub: "Pick any that apply.", options: [{ value: "a", label: "First option" }, { value: "b", label: "Second option" }, { value: "c", label: "Third option" }, { value: "d", label: "Fourth option" }] }) },
  { type: "counters", label: "Numbers", make: (n) => ({ _new: true, id: `count${n}`, type: "counters", question: "How many?", sub: "This sizes the bundle.", counters: [{ field: `qty${n}`, label: "Quantity", min: 1, max: 10, defaultValue: 1 }] }) },
  { type: "boolean", label: "Yes or no", make: (n) => ({ _new: true, id: `yesno${n}`, type: "boolean", field: `yesno${n}`, required: true, question: "Do you need this?", sub: "", options: [{ value: true, label: "Yes" }, { value: false, label: "No" }] }) },
];

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return redirect("/app");
  return { config, done: doneSteps(config) };
};

/* Merge the client's edits onto the saved steps by id. Order and removal
   come from the client; everything not editable here stays as saved. */
/* New questions arrive whole from the client (built from NEW_STEP templates);
   only their shape is trusted, every string is clipped. */
function sanitizeNew(inc) {
  if (!inc || !TYPES.includes(inc.type) || typeof inc.id !== "string") return null;
  const id = inc.id.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || null;
  if (!id) return null;
  const field = String(inc.field || id).replace(/[^a-z0-9_]/gi, "").slice(0, 40) || id;
  const st = { id, type: inc.type, question: String(inc.question || "").slice(0, 160), sub: String(inc.sub || "").slice(0, 240) };
  const opt = (o, i) => ({ value: String(o.value ?? i).slice(0, 40), label: String(o.label || "").slice(0, 80), icon: typeof o.icon === "string" ? cleanIcon(o.icon) : "" });
  if (inc.type === "choice" || inc.type === "multi") { st.field = field; st.required = !!inc.required; st.options = (inc.options || []).slice(0, 12).map(opt); if (inc.type === "multi") st.columns = 2; }
  if (inc.type === "boolean") { st.field = field; st.required = !!inc.required; st.layout = "grid"; st.options = [{ value: true, label: String(inc.options?.[0]?.label || "Yes").slice(0, 80) }, { value: false, label: String(inc.options?.[1]?.label || "No").slice(0, 80) }]; }
  if (inc.type === "counters") st.counters = (inc.counters || []).slice(0, 4).map((c, i) => ({ field: String(c.field || `${field}_${i}`).replace(/[^a-z0-9_]/gi, "").slice(0, 40), label: String(c.label || "").slice(0, 80), min: Number(c.min) || 0, max: Number(c.max) || 10, defaultValue: Number(c.defaultValue) || 0 }));
  if (inc.type === "toggles") st.toggles = (inc.toggles || []).slice(0, 8).map((t, i) => ({ field: String(t.field || `${field}_${i}`).replace(/[^a-z0-9_]/gi, "").slice(0, 40), label: String(t.label || "").slice(0, 80), icon: typeof t.icon === "string" ? cleanIcon(t.icon) : "" }));
  return st;
}

function mergeSteps(saved, incoming) {
  const byId = new Map((saved || []).map((s) => [s.id, s]));
  const out = [];
  for (const inc of incoming) {
    const base = byId.get(inc.id);
    if (!base) { const fresh = inc._new ? sanitizeNew(inc) : null; if (fresh) out.push(fresh); continue; }
    if (!TYPES.includes(base.type)) continue;
    const st = JSON.parse(JSON.stringify(base));
    if (typeof inc.question === "string") st.question = inc.question.slice(0, 160);
    if (typeof inc.sub === "string") st.sub = inc.sub.slice(0, 240);
    if (typeof inc.required === "boolean" && "field" in st) st.required = inc.required;
    if (inc.display === "cards") st.display = "cards"; else if (inc.display === "list") delete st.display;
    for (const kind of ["options", "counters", "toggles"]) {
      if (!Array.isArray(st[kind]) || !Array.isArray(inc[kind])) continue;
      st[kind].forEach((o, i) => {
        const e = inc[kind][i]; if (!e) return;
        if (typeof e.label === "string") o.label = e.label.slice(0, 80);
        if (typeof e.desc === "string" && kind === "options") { const d = e.desc.replace(/[<>]/g, "").slice(0, 120); if (d) o.desc = d; else delete o.desc; }
        // The storefront prints icons as HTML, so only plain characters (an emoji) get through.
        if (typeof e.icon === "string") o.icon = cleanIcon(e.icon);
        if (typeof e.image === "string") { const u = e.image.trim(); if (/^https:\/\/[^\s"'<>]+$/.test(u)) o.image = u.slice(0, 500); else delete o.image; }
        // where a store picture came from, so the editor can say "from product X"
        if (o.image && e.imageSource && ["product", "collection"].includes(e.imageSource.type)) o.imageSource = { type: e.imageSource.type, title: String(e.imageSource.title || "").replace(/[<>]/g, "").slice(0, 120) };
        else delete o.imageSource;
      });
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
  const updateKid = (i, kind, j, patch) => setSteps((s) => s.map((st, k) => k !== i ? st : { ...st, [kind]: st[kind].map((o, m) => (m === j ? { ...o, ...patch } : o)) }));
  const move = (i, d) => setSteps((s) => { const a = s.slice(); const t = a[i]; a[i] = a[i + d]; a[i + d] = t; return a; });
  const remove = (i) => setSteps((s) => s.filter((_, j) => j !== i));
  /* Visual source per option: emoji, a picture from the store, or a custom link. */
  const sourceOf = (o) => o._src || (o.image ? (o.imageSource ? "store" : "custom") : "emoji");
  const sized = (url) => (/cdn\.shopify\.com/.test(url) && !/[?&]width=/.test(url) ? url + (url.includes("?") ? "&" : "?") + "width=600" : url);
  const pickImage = async (i, kind, j, type) => {
    let picked = null;
    try { picked = await shopify.resourcePicker({ type, multiple: false }); } catch (e) { return; }
    const r = picked && picked[0]; if (!r) return;
    const img = type === "product"
      ? (r.images && r.images[0] && (r.images[0].originalSrc || r.images[0].url))
      : (r.image && (r.image.originalSrc || r.image.url));
    if (!img) { shopify.toast.show(`That ${type} has no image yet`, { isError: true }); return; }
    updateKid(i, kind, j, { image: sized(img), imageSource: { type, title: r.title || "" }, _src: "store" });
  };
  const addStep = (t) => setSteps((s) => {
    let n = 1; while (s.some((st) => st.id === `${t.type === "counters" ? "count" : t.type === "boolean" ? "yesno" : t.type}${n}`)) n++;
    return s.concat([t.make(n)]);
  });
  const submit = (cont) => fetcher.submit({ steps: JSON.stringify(steps), continue: cont ? "1" : "0" }, { method: "POST" });

  const n = steps.length;
  const tone = n >= 4 && n <= 6 ? "success" : "warning";
  const hint = n > 6 ? "Consider removing one or two. Every extra step loses some shoppers." : n < 4 ? "Short is fine. Add a question only if it changes what goes in the cart." : "Good length.";

  const previewCfg = { ...config, steps };

  return (
    <s-page heading="Check the questions.">
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
              {"field" in st ? (
                <s-checkbox label="An answer is required to continue" checked={!!st.required} onChange={(e) => update(i, { required: e.currentTarget.checked })} />
              ) : null}
              {kinds.some((k) => k !== "counters") ? (
                <s-select label="Show options as" value={st.display === "cards" ? "cards" : "list"} onChange={(e) => update(i, { display: e.currentTarget.value })} details="Picture cards suit product or collection photos. Compact rows suit emoji.">
                  <s-option value="list">Compact rows with a small icon</s-option>
                  <s-option value="cards">Picture cards</s-option>
                </s-select>
              ) : null}
              {kinds.map((kind) => (
                <s-stack key={kind} direction="block" gap="small">
                  <s-text color="subdued">{kind === "options" ? "Options" : kind === "counters" ? "Counters" : "Toggles"}</s-text>
                  {st[kind].map((o, j) => {
                    const src = sourceOf(o);
                    return (
                      <s-box key={j} padding="small" borderWidth="base" borderRadius="base">
                        <s-stack direction="block" gap="small">
                          <s-grid gridTemplateColumns={kind === "options" ? "1.2fr 1.6fr" : "1fr"} gap="small" alignItems="end">
                            <s-text-field label="Label" value={o.label || ""} onInput={(e) => updateKid(i, kind, j, { label: e.currentTarget.value })} />
                            {kind === "options" ? <s-text-field label="Description (optional)" value={o.desc || ""} onInput={(e) => updateKid(i, kind, j, { desc: e.currentTarget.value })} /> : null}
                          </s-grid>
                          {kind !== "counters" ? (
                            <s-grid gridTemplateColumns="56px 1fr 2fr" gap="small" alignItems="end">
                              <s-grid-item>
                                {o.image ? <s-thumbnail src={o.image} alt="" size="base" /> : <s-box inlineSize="56px" blockSize="56px" borderWidth="base" borderRadius="base" background="subdued"><div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 24 }}>{decodeIcon(o.icon)}</div></s-box>}
                              </s-grid-item>
                              <s-select label="Visual" value={src} onChange={(e) => {
                                const v = e.currentTarget.value;
                                updateKid(i, kind, j, v === "emoji" ? { _src: v, image: "", imageSource: null } : { _src: v });
                              }}>
                                <s-option value="emoji">Emoji icon</s-option>
                                <s-option value="store">Picture from my store</s-option>
                                <s-option value="custom">Custom image link</s-option>
                              </s-select>
                              {src === "emoji" ? (
                                <s-text-field label="Emoji" value={decodeIcon(o.icon)} placeholder="🙂" onInput={(e) => updateKid(i, kind, j, { icon: e.currentTarget.value })} />
                              ) : src === "store" ? (
                                <s-stack direction="block" gap="small-200">
                                  <s-stack direction="inline" gap="small">
                                    <s-button variant="secondary" onClick={() => pickImage(i, kind, j, "product")}>Choose a product</s-button>
                                    <s-button variant="secondary" onClick={() => pickImage(i, kind, j, "collection")}>Choose a collection</s-button>
                                  </s-stack>
                                  {o.imageSource ? <s-text color="subdued">{`From ${o.imageSource.type}: ${o.imageSource.title}`}</s-text> : <s-text color="subdued">Uses that product's or collection's main image.</s-text>}
                                </s-stack>
                              ) : (
                                <s-url-field label="Image link (https)" value={o.imageSource ? "" : (o.image || "")} placeholder="https://cdn.shopify.com/…" details="Upload in Shopify, Content, Files, then copy the link." onInput={(e) => updateKid(i, kind, j, { image: e.currentTarget.value, imageSource: null })} />
                              )}
                            </s-grid>
                          ) : null}
                        </s-stack>
                      </s-box>
                    );
                  })}
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

      <s-section heading="Add a question">
        <s-paragraph color="subdued">Starts with placeholder options you can rename here. Then use the answer in <s-link href="/app/rules">Rules</s-link> to decide what goes in the cart.</s-paragraph>
        <s-stack direction="inline" gap="small">
          {NEW_STEPS.map((t) => <s-button key={t.type} variant="secondary" onClick={() => addStep(t)}>{t.label}</s-button>)}
        </s-stack>
      </s-section>

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
