/* ============================================================
   Simple setup, step 2 of 3: Questions.
   Each question is a short list of answers and a grid: tick which of the
   merchant's products an answer points to. On the storefront the product with
   the most ticks among the shopper's answers wins (ties go to the product
   listed first); extras go in the cart when an answer that points to them is
   chosen. Wording comes from the category and is all editable.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig, recompile, isSimple, simple as simpleApi } from "../config.server";
import { SetupRail, doneSteps } from "../components/SetupRail";
import { WidgetPreview } from "../components/WidgetPreview";
import { QuizBar } from "../components/QuizBar";

const MAX_QUESTIONS = 4, MAX_ANSWERS = 6, MIN_ANSWERS = 2;
const cell = (q, a) => `${q.field}:${a.value}`;
const newId = (prefix) => prefix + Math.random().toString(36).slice(2, 8);

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!isSimple(config)) return redirect(config ? "/app/questions" : "/app/start");
  return { config, simple: config.simple, problems: simpleApi().problems(config.simple), done: doneSteps(config) };
};

const text = (v, max) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
const safeId = (v) => /^[a-z0-9_-]{1,40}$/i.test(String(v || ""));

/* Rebuild the questions from what the browser sent, keeping only known shapes. */
function cleanQuestions(raw, mode) {
  if (!Array.isArray(raw)) return null;
  const seen = new Set();
  const qs = raw.slice(0, MAX_QUESTIONS).map((q) => {
    if (!q || !safeId(q.field) || seen.has(q.field)) return null;
    seen.add(q.field);
    const values = new Set();
    const answers = (Array.isArray(q.answers) ? q.answers : []).slice(0, MAX_ANSWERS).map((a) => {
      if (!a || !safeId(a.value) || values.has(a.value)) return null;
      values.add(a.value);
      const out = { value: String(a.value), label: text(a.label, 80) || "Answer", icon: typeof a.icon === "string" ? a.icon.slice(0, 40) : "", desc: text(a.desc, 120) };
      if (/^https:\/\/[^\s"'<>]{1,1000}$/.test(String(a.image || ""))) {
        out.image = String(a.image);
        if (["product", "collection"].includes(a.imageSource)) out.imageSource = a.imageSource;
      }
      return out;
    }).filter(Boolean);
    if (answers.length < MIN_ANSWERS) return null;
    return { id: q.field, field: q.field, title: text(q.title, 160) || "Question", sub: text(q.sub, 200), multi: !!q.multi, target: mode === "bundle" && q.target === "extra" ? "extra" : "main", display: q.display === "cards" ? "cards" : "rows", answers };
  }).filter(Boolean);
  return qs.length ? qs : null;
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const { shopId, config } = await readConfig(admin);
  if (!isSimple(config)) return { ok: false, error: "No simple setup yet" };
  let body;
  try { body = JSON.parse(String(form.get("simple") || "{}")); } catch (e) { return { ok: false, error: "Could not read the questions" }; }
  const questions = cleanQuestions(body.questions, config.simple.mode);
  if (!questions) return { ok: false, error: "Each question needs at least two answers" };
  const grid = {};
  Object.entries(body.grid && typeof body.grid === "object" ? body.grid : {}).forEach(([k, v]) => { if (Array.isArray(v)) grid[k] = v.map(String).slice(0, 50); });
  try {
    const next = recompile(config, { ...config.simple, questions, grid });
    next.meta = { ...next.meta, setup: { ...(next.meta?.setup || {}), questions: true } };
    await saveConfig(admin, shopId, next);
  } catch (e) { return { ok: false, error: e.message }; }
  if (form.get("continue") === "1") return redirect("/app/live");
  return { ok: true };
};

const th = { padding: "8px 6px", fontWeight: 500, fontSize: 12, textAlign: "center", borderBottom: "1px solid #e3e3e3", verticalAlign: "bottom", minWidth: 84 };
const td = { padding: "6px", textAlign: "center", borderBottom: "1px solid #ebebeb", verticalAlign: "middle" };

/* An answer's picture: an emoji, the photo of one of this quiz's products, or
   any product's or collection's photo through Shopify's picker. */
function AnswerVisual({ a, quizProducts, onChange }) {
  const shopify = useAppBridge();
  const withPhoto = quizProducts.filter((p) => p.image);
  const current = a.image ? (withPhoto.find((p) => p.image === a.image) ? `p:${withPhoto.find((p) => p.image === a.image).key}` : "custom") : "";
  const pick = async (type) => {
    let picked = null;
    try { picked = await shopify.resourcePicker({ type, multiple: false }); } catch (e) { return; }
    const item = picked && picked[0];
    const url = item && ((item.images && item.images[0] && item.images[0].originalSrc) || (item.image && item.image.originalSrc) || "");
    if (!url) { shopify.toast.show(`That ${type} has no photo`, { isError: true }); return; }
    onChange({ image: url, imageSource: type });
  };
  const choose = (v) => {
    if (v === "") onChange({ image: "", imageSource: "" });
    else if (v === "pick-product") pick("product");
    else if (v === "pick-collection") pick("collection");
    else if (v.startsWith("p:")) { const p = withPhoto.find((x) => `p:${x.key}` === v); if (p) onChange({ image: p.image, imageSource: "product" }); }
  };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
      <div style={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: 8, border: "1px solid #e3e3e3", background: "#f6f6f7", display: "grid", placeItems: "center", overflow: "hidden", fontSize: 20 }} aria-hidden="true">
        {a.image ? <img src={a.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (a.icon || "").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))}
      </div>
      <s-select label={`Picture for ${a.label}`} labelAccessibilityVisibility="exclusive" value={current} onChange={(e) => choose(e.currentTarget.value)}>
        <s-option value="">Emoji</s-option>
        {withPhoto.map((p) => <s-option key={p.key} value={`p:${p.key}`}>{`Photo: ${p.productTitle}`}</s-option>)}
        {current === "custom" ? <s-option value="custom">Photo chosen from your store</s-option> : null}
        <s-option value="pick-product">Another product's photo...</s-option>
        <s-option value="pick-collection">A collection's photo...</s-option>
      </s-select>
      {!a.image ? <div style={{ width: 70 }}><s-text-field label={`Emoji for ${a.label}`} labelAccessibilityVisibility="exclusive" value={(a.icon || "").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))} maxLength={8} onInput={(e) => onChange({ icon: e.currentTarget.value })} /></div> : null}
    </div>
  );
}

function Grid({ q, products, quizProducts, grid, onTick, onLabel, onVisual, onRemoveAnswer }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid #e3e3e3", borderRadius: 8 }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left", minWidth: 260 }}>Answer and picture</th>
            {products.map((p) => <th key={p.key} style={th} scope="col">{p.productTitle}</th>)}
            <th style={{ ...th, minWidth: 40 }}><span style={{ position: "absolute", left: -9999 }}>Remove</span></th>
          </tr>
        </thead>
        <tbody>
          {q.answers.map((a) => {
            const ticked = grid[cell(q, a)] || [];
            return (
              <tr key={a.value}>
                <td style={{ ...td, textAlign: "left" }}>
                  <s-text-field label="Answer" labelAccessibilityVisibility="exclusive" value={a.label} onInput={(e) => onLabel(a.value, e.currentTarget.value)} />
                  <AnswerVisual a={a} quizProducts={quizProducts} onChange={(patch) => onVisual(a.value, patch)} />
                </td>
                {products.map((p) => (
                  <td key={p.key} style={td}>
                    <input type="checkbox" style={{ width: 18, height: 18 }} checked={ticked.includes(p.key)}
                      aria-label={`${a.label} points to ${p.productTitle}`} onChange={(e) => onTick(cell(q, a), p.key, e.currentTarget.checked)} />
                  </td>
                ))}
                <td style={td}>
                  {q.answers.length > MIN_ANSWERS ? <s-button variant="tertiary" icon="delete" accessibilityLabel={`Remove answer ${a.label}`} onClick={() => onRemoveAnswer(a.value)} /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Questions() {
  const { config, simple, problems, done } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [questions, setQuestions] = useState(simple.questions);
  const [grid, setGrid] = useState(simple.grid || {});
  const [dirty, setDirty] = useState(false);
  const busy = fetcher.state !== "idle";
  const bundle = simple.mode === "bundle";
  const mains = simple.products.filter((p) => !bundle || p.role !== "extra");
  const extras = bundle ? simple.products.filter((p) => p.role === "extra") : [];

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) { shopify.toast.show("Questions saved"); setDirty(false); }
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const edit = (fn) => { setDirty(true); fn(); };
  const updateQ = (i, patch) => edit(() => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q))));
  const updateA = (i, value, patch) => edit(() => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, answers: q.answers.map((a) => (a.value === value ? { ...a, ...patch } : a)) } : q))));
  const addA = (i) => edit(() => setQuestions((qs) => qs.map((q, j) => (j === i && q.answers.length < MAX_ANSWERS ? { ...q, answers: [...q.answers, { value: newId("a"), label: "New answer", icon: "", desc: "" }] } : q))));
  const removeA = (i, value) => edit(() => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, answers: q.answers.filter((a) => a.value !== value) } : q))));
  const addQ = () => edit(() => setQuestions((qs) => [...qs, { id: "", field: newId("q"), title: "New question", sub: "", multi: false, target: "main",
    answers: [{ value: newId("a"), label: "First answer", icon: "", desc: "" }, { value: newId("a"), label: "Second answer", icon: "", desc: "" }] }].map((q) => ({ ...q, id: q.field }))));
  const removeQ = (i) => edit(() => setQuestions((qs) => qs.filter((q, j) => j !== i)));
  const moveQ = (i, d) => edit(() => setQuestions((qs) => { const n = [...qs]; const t = n[i + d]; if (!t) return qs; n[i + d] = n[i]; n[i] = t; return n; }));
  const tick = (k, key, on) => edit(() => setGrid((g) => {
    const cur = g[k] || [];
    return { ...g, [k]: on ? [...cur.filter((x) => x !== key), key] : cur.filter((x) => x !== key) };
  }));

  const submit = (cont) => fetcher.submit({ simple: JSON.stringify({ questions, grid }), continue: cont ? "1" : "0" }, { method: "POST" });

  return (
    <s-page heading="Check the questions">
      <s-button slot="primary-action" onClick={() => submit(true)} {...(busy ? { loading: true } : {})}>Save and continue</s-button>
      <s-button slot="secondary-actions" onClick={() => submit(false)} {...(!dirty || busy ? { disabled: true } : {})}>Save</s-button>
      <QuizBar />

      <s-section>
        <SetupRail current="questions" done={done} simple />
        <s-paragraph>
          {bundle
            ? "Rename anything. Tick which main product each answer points to: the one with the most ticks wins. Extras go in the cart when a shopper picks an answer that points to them."
            : "Rename anything. Tick which product each answer points to: the one with the most ticks among the shopper's answers wins, and ties go to the product listed first."}
        </s-paragraph>
        {problems.length && !dirty ? (
          <s-banner tone="warning" heading="Worth a look">
            <s-unordered-list>{problems.map((p) => <s-list-item key={p}>{p}</s-list-item>)}</s-unordered-list>
          </s-banner>
        ) : null}
        <s-text color="subdued">The first ticks were suggested from your product names, types and tags. Check them before going live.</s-text>
      </s-section>

      {questions.map((q, i) => {
        const cols = bundle && q.target === "extra" ? extras : mains;
        return (
          <s-section key={q.field} heading={`Question ${i + 1}${bundle ? (q.target === "extra" ? ", picks extras" : ", picks the main product") : ""}`}>
            <s-stack direction="block" gap="base">
              <s-text-field label="Question" value={q.title} onInput={(e) => updateQ(i, { title: e.currentTarget.value })} />
              <s-text-field label="Helper text" value={q.sub || ""} onInput={(e) => updateQ(i, { sub: e.currentTarget.value })} />
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-checkbox label="Shoppers can pick several answers" checked={!!q.multi} onChange={(e) => updateQ(i, { multi: e.currentTarget.checked })} />
                <s-select label="Show answers as" value={q.display === "cards" ? "cards" : "rows"} onChange={(e) => updateQ(i, { display: e.currentTarget.value })} details="Picture cards suit product photos; rows suit emoji.">
                  <s-option value="rows">Rows with an emoji or picture</s-option>
                  <s-option value="cards">Picture cards</s-option>
                </s-select>
                {bundle ? (
                  <s-select label="Answers point to" value={q.target} onChange={(e) => updateQ(i, { target: e.currentTarget.value })}>
                    <s-option value="main">Main products</s-option>
                    <s-option value="extra">Extras</s-option>
                  </s-select>
                ) : null}
              </s-stack>
              {cols.length ? (
                <Grid q={q} products={cols} quizProducts={simple.products} grid={grid}
                  onTick={tick} onLabel={(value, label) => updateA(i, value, { label })} onVisual={(value, patch) => updateA(i, value, patch)} onRemoveAnswer={(value) => removeA(i, value)} />
              ) : <s-banner tone="info">No extras yet. Add them in step 1, or point this question at the main products.</s-banner>}
              <s-stack direction="inline" gap="small">
                <s-button variant="secondary" onClick={() => addA(i)} {...(q.answers.length >= MAX_ANSWERS ? { disabled: true } : {})}>Add an answer</s-button>
                <s-button variant="tertiary" onClick={() => moveQ(i, -1)} {...(i === 0 ? { disabled: true } : {})}>Move up</s-button>
                <s-button variant="tertiary" onClick={() => moveQ(i, 1)} {...(i === questions.length - 1 ? { disabled: true } : {})}>Move down</s-button>
                <s-button variant="tertiary" tone="critical" onClick={() => removeQ(i)} {...(questions.length <= 1 ? { disabled: true } : {})}>Remove question</s-button>
              </s-stack>
            </s-stack>
          </s-section>
        );
      })}

      <s-section>
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-button variant="secondary" onClick={addQ} {...(questions.length >= MAX_QUESTIONS ? { disabled: true } : {})}>Add a question</s-button>
          <s-text color="subdued">{`Up to ${MAX_QUESTIONS} questions. Fewer questions, more finished quizzes.`}</s-text>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Preview">
        <s-stack direction="block" gap="small">
          <WidgetPreview config={config} />
          <s-text color="subdued">{dirty ? "Save to see your changes here." : "This is what shoppers see."}</s-text>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
