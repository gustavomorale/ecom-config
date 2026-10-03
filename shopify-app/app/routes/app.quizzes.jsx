/* ============================================================
   Quizzes (1.0). A store can run several quizzes, each with its own
   products, questions and look, up to its plan's number (Free 1, Starter 3,
   Standard 10, Growth 25; more on a Custom plan). The theme block's Quiz
   setting picks which one a page shows. Quizzes above the plan's number are
   kept but paused: the block shows nothing for them on the storefront.
   Editing a quiz makes it the one every editor page works on (index.editing).
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError, useRouteLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, readAllQuizzes, saveIndex, saveConfig, deleteConfig, slotKey, listCategories } from "../config.server";
import { readPlan } from "../plan.server";
import { completionsByQuiz } from "../usage.server";
import { MAX_QUIZZES, CUSTOM_PLAN_EMAIL, PLANS, nextPlan } from "../plans";

const typeOf = (cfg) => {
  if (!cfg) return null;
  if (cfg.simple && cfg.meta?.mode !== "advanced") return cfg.simple.mode === "bundle" ? "Bundle quiz" : "Product finder";
  return "Rules editor";
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const { index } = await readConfig(admin);
  const [configs, counts] = await Promise.all([readAllQuizzes(admin), completionsByQuiz(session.shop).catch(() => ({}))]);
  const cats = Object.fromEntries(listCategories().map((c) => [c.id, `${c.icon} ${c.label}`]));
  const quizzes = index.list.map((q) => {
    const cfg = configs[q.id] || null;
    return { id: q.id, name: q.name || `Quiz ${q.id}`, type: typeOf(cfg), category: cfg ? cats[cfg.meta?.category] || "" : "", ready: !!cfg, completions: counts[q.id] || 0 };
  });
  return { quizzes, editing: index.editing };
};

const nextFreeId = (list) => {
  for (let n = 1; n <= MAX_QUIZZES; n++) if (!list.some((q) => q.id === String(n))) return String(n);
  return null;
};
const cleanName = (v, fallback) => String(v || "").replace(/[<>]/g, "").trim().slice(0, 60) || fallback;

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const id = String(form.get("id") || "");
  const { shopId, index } = await readConfig(admin);
  const list = [...index.list];
  const at = list.findIndex((q) => q.id === id);
  try {
    if (intent === "edit") {
      if (at < 0) return { ok: false, error: "That quiz no longer exists" };
      await saveIndex(admin, shopId, { ...index, editing: id });
      return redirect("/app");
    }
    if (intent === "rename") {
      if (at < 0) return { ok: false, error: "That quiz no longer exists" };
      list[at] = { ...list[at], name: cleanName(form.get("name"), `Quiz ${id}`) };
      await saveIndex(admin, shopId, { ...index, list });
      return { ok: true, intent };
    }
    if (intent === "delete") {
      if (at < 0) return { ok: false, error: "That quiz no longer exists" };
      await deleteConfig(admin, shopId, slotKey(id));
      list.splice(at, 1);
      await saveIndex(admin, shopId, { list, editing: index.editing === id ? list[0]?.id || "1" : index.editing });
      return { ok: true, intent };
    }
    if (intent === "new" || intent === "duplicate") {
      const { plan } = await readPlan(admin, session.shop);
      const cap = plan.quizzes || 1;
      if (list.length >= cap) return { ok: false, error: `Your ${plan.name} plan includes ${cap} quiz${cap === 1 ? "" : "zes"}. Choose a bigger plan to add more.` };
      const nid = nextFreeId(list);
      if (!nid) return { ok: false, error: `A store can have up to ${MAX_QUIZZES} quizzes. Ask about a Custom plan for more.` };
      let name = cleanName(form.get("name"), `Quiz ${nid}`);
      if (intent === "duplicate") {
        if (at < 0) return { ok: false, error: "That quiz no longer exists" };
        const { config } = await readConfig(admin, { quiz: id });
        if (!config) return { ok: false, error: "That quiz is not set up yet, so there is nothing to copy" };
        const copy = JSON.parse(JSON.stringify(config));
        copy.meta = { ...(copy.meta || {}), slot: slotKey(nid), createdAt: new Date().toISOString() };
        await saveConfig(admin, shopId, copy);
        name = cleanName(`Copy of ${list[at].name || `Quiz ${id}`}`, `Quiz ${nid}`);
      }
      list.push({ id: nid, name, createdAt: new Date().toISOString() });
      await saveIndex(admin, shopId, { list, editing: nid });
      return redirect(intent === "new" ? "/app/start" : "/app");
    }
  } catch (e) { return { ok: false, intent, error: e.message }; }
  return { ok: false, error: "Unknown action" };
};

function QuizRow({ q, editing, paused, canAdd, busy, onSubmit }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(q.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <s-box padding="base" borderWidth="base" borderRadius="base" background={editing ? "subdued" : "base"}>
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-heading>{`Quiz ${q.id}: ${q.name}`}</s-heading>
          {editing ? <s-badge tone="info">Editing</s-badge> : null}
          {paused ? <s-badge tone="warning">Paused on your plan</s-badge> : null}
          {q.type ? <s-badge>{q.type}</s-badge> : <s-badge tone="attention">Not set up yet</s-badge>}
        </s-stack>
        <s-text color="subdued">
          {[`${q.completions.toLocaleString("en-GB")} completed this month`, q.category].filter(Boolean).join(" · ")}
        </s-text>
        {renaming ? (
          <s-stack direction="inline" gap="small" alignItems="end">
            <s-text-field label="Quiz name" value={name} maxLength={60} onInput={(e) => setName(e.currentTarget.value)} />
            <s-button variant="primary" onClick={() => { onSubmit({ intent: "rename", id: q.id, name }); setRenaming(false); }}>Save name</s-button>
            <s-button variant="tertiary" onClick={() => { setName(q.name); setRenaming(false); }}>Cancel</s-button>
          </s-stack>
        ) : (
          <s-stack direction="inline" gap="small">
            {!editing ? <s-button variant="primary" onClick={() => onSubmit({ intent: "edit", id: q.id })} {...(busy ? { disabled: true } : {})}>Edit this quiz</s-button> : <s-button href={q.ready ? "/app" : "/app/start"}>{q.ready ? "Open overview" : "Set it up"}</s-button>}
            <s-button variant="tertiary" onClick={() => setRenaming(true)}>Rename</s-button>
            {q.ready ? <s-button variant="tertiary" onClick={() => onSubmit({ intent: "duplicate", id: q.id })} {...(!canAdd || busy ? { disabled: true } : {})}>Duplicate</s-button> : null}
            {confirmDelete ? (
              <>
                <s-button tone="critical" onClick={() => { onSubmit({ intent: "delete", id: q.id }); setConfirmDelete(false); }}>{`Delete Quiz ${q.id} for good`}</s-button>
                <s-button variant="tertiary" onClick={() => setConfirmDelete(false)}>Keep it</s-button>
              </>
            ) : <s-button variant="tertiary" tone="critical" onClick={() => setConfirmDelete(true)}>Delete</s-button>}
          </s-stack>
        )}
      </s-stack>
    </s-box>
  );
}

export default function Quizzes() {
  const { quizzes, editing } = useLoaderData();
  const app = useRouteLoaderData("routes/app") || {};
  const plan = app.plan || PLANS.free;
  const planUrl = app.planUrl;
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [newName, setNewName] = useState("");
  const busy = fetcher.state !== "idle";
  const cap = plan.quizzes || 1;
  const canAdd = quizzes.length < cap && quizzes.length < MAX_QUIZZES;
  const up = nextPlan(plan);

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) shopify.toast.show(fetcher.data.intent === "delete" ? "Quiz deleted" : "Quiz renamed");
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true, duration: 8000 });
  }, [fetcher.data, shopify]);

  const submit = (data) => fetcher.submit(data, { method: "POST" });

  return (
    <s-page heading="Quizzes">
      <s-button slot="primary-action" onClick={() => submit({ intent: "new", name: newName })} {...(!canAdd || busy ? { disabled: true } : {})}>New quiz</s-button>

      <s-section>
        <s-stack direction="block" gap="small">
          <s-paragraph>Each quiz has its own products, questions and look. To show one on your store, add the CraftFrame Bundle Quiz block in the theme editor and choose its number under Quiz. Different pages can show different quizzes.</s-paragraph>
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge tone={canAdd ? "success" : "warning"}>{`${quizzes.length} of ${cap} quiz${cap === 1 ? "" : "zes"} on ${plan.name}`}</s-badge>
            {!canAdd && up && planUrl ? <s-button variant="secondary" href={planUrl} target="_top">{`${up.name} includes ${up.quizzes} quizzes`}</s-button> : null}
          </s-stack>
          {canAdd ? (
            <s-stack direction="inline" gap="small" alignItems="end">
              <s-text-field label="Name for a new quiz (optional)" value={newName} maxLength={60} placeholder="e.g. Gift finder" onInput={(e) => setNewName(e.currentTarget.value)} />
              <s-button onClick={() => submit({ intent: "new", name: newName })} {...(busy ? { loading: true } : {})}>Create and set up</s-button>
            </s-stack>
          ) : null}
        </s-stack>
      </s-section>

      <s-section heading={`Your quizzes (${quizzes.length})`}>
        <s-stack direction="block" gap="small">
          {quizzes.length ? quizzes.map((q) => (
            <QuizRow key={q.id} q={q} editing={q.id === editing} paused={Number(q.id) > cap} canAdd={canAdd} busy={busy} onSubmit={submit} />
          )) : <s-paragraph color="subdued">No quizzes yet. Create one to get started.</s-paragraph>}
        </s-stack>
      </s-section>

      <s-section heading="Need more?">
        <s-paragraph color="subdued">{`Growth includes ${PLANS.growth.quizzes} quizzes and ${PLANS.growth.limit.toLocaleString("en-GB")} completed quizzes a month. For more, ask for a Custom plan at ${CUSTOM_PLAN_EMAIL}.`}</s-paragraph>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
