/* ============================================================
   Home: the app's central place (1.0).
   No quiz yet: the welcome. What the app does and one button.
   Otherwise: every quiz as a card, with its own setup progress, what it
   needs next and buttons straight into its Products, Questions, Look and
   Copy & cart. Choosing any of them makes that quiz the one the editor pages
   work on (the quizzes metafield's "editing"), so the home page is the router
   and the editor pages never need a quiz picker. Store-wide things sit
   around the cards: whether the block is on the theme, Black Friday, the plan
   and usage, help.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError, useRouteLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { PLANS, TRIAL_DAYS, MAX_QUIZZES, nextPlan, CUSTOM_PLAN_EMAIL } from "../plans";
import { listCategories, buildCategory, readConfig, readAllQuizzes, saveConfig, saveIndex, deleteConfig, slotKey, themeEditorUrl, toAdvanced, toSimple } from "../config.server";
import { readPlan } from "../plan.server";
import { completionsByQuiz } from "../usage.server";
import { blockOnTheme } from "../theme.server";
import { VERSION, SUPPORT_EMAIL } from "../components/SetupRail";
import { hasProduct, productSlots } from "../lib/links";
import { blackFridayNudge } from "../lib/season";

const isSimpleConfig = (config) => !!(config && config.simple && config.meta?.mode !== "advanced");

/* What a quiz card shows: type, progress and the one next step. */
function summarise(id, entry, cfg, cats, completions) {
  const base = { id, name: entry?.name || `Quiz ${id}`, completions: completions || 0 };
  if (!cfg) return { ...base, ready: false, type: null, steps: [{ label: "Pick products", done: false, href: "/app/start" }], next: "/app/start" };
  const simple = isSimpleConfig(cfg);
  const setup = cfg.meta?.setup || {};
  const products = simple ? (cfg.simple.products || []).length : productSlots(cfg).length;
  const linked = simple ? products : productSlots(cfg).filter(hasProduct).length;
  const steps = simple
    ? [{ label: "Pick products", done: products > 0, href: "/app/start" }, { label: "Check questions", done: !!setup.questions, href: "/app/grid" }]
    : [{ label: "Check questions", done: !!setup.questions, href: "/app/questions" }, { label: "Link products", done: products > 0 && linked === products, href: "/app/products" }];
  const open = steps.find((st) => !st.done);
  const head = headlineState(cfg);
  return {
    ...base, ready: true, simple, canSimple: !!cfg.simple,
    type: simple ? (cfg.simple.mode === "bundle" ? "Bundle quiz" : "Product finder") : "Rules editor",
    category: cats[cfg.meta?.category] || "",
    products, questions: (cfg.steps || []).length, steps, next: open ? open.href : null,
    headline: head.state === "custom" ? null : head,
  };
}

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const { config, domain, index } = await readConfig(admin);
  if (!config && !index.list.length) return { welcome: true };
  const [all, counts, block] = await Promise.all([readAllQuizzes(admin), completionsByQuiz(session.shop).catch(() => ({})), blockOnTheme(admin)]);
  const cats = Object.fromEntries(listCategories().map((c) => [c.id, `${c.icon} ${c.label}`]));
  const quizzes = index.list.map((q) => summarise(q.id, q, all[q.id], cats, counts[q.id]));
  return {
    welcome: false, quizzes, editing: index.editing, block,
    editorUrl: themeEditorUrl(domain), storeUrl: `https://${domain}/`,
    season: blackFridayNudge(config?.promo),
  };
};

/* The headline shoppers read first. "placeholder" is the pre-0.9 default that
   said nothing about the store; "template" is the category's own suggestion,
   fine to ship but better made personal. */
const PLACEHOLDER_TITLE = "Build custom widget for configured check out";
function templateCopy(config) {
  try { return buildCategory(config.meta?.category).copy || {}; } catch (e) { return {}; }
}
function headlineState(config) {
  const title = config.copy?.title || "";
  const tpl = templateCopy(config);
  const state = !title || title === PLACEHOLDER_TITLE ? "placeholder" : title === tpl.title ? "template" : "custom";
  return { title, state, suggestion: tpl.title || "" };
}

const TARGETS = ["/app", "/app/start", "/app/grid", "/app/look", "/app/copy", "/app/questions", "/app/rules", "/app/products", "/app/category"];
const nextFreeId = (list) => { for (let n = 1; n <= MAX_QUIZZES; n++) if (!list.some((q) => q.id === String(n))) return String(n); return null; };
const cleanName = (v, fallback) => String(v || "").replace(/[<>]/g, "").trim().slice(0, 60) || fallback;

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const id = String(form.get("id") || "");
  const { shopId, index } = await readConfig(admin);
  const list = [...index.list];
  const at = list.findIndex((q) => q.id === id);
  const needQuiz = () => { if (at < 0) throw new Error("That quiz no longer exists. Reload the page."); };
  try {
    if (intent === "go") {
      needQuiz();
      const to = TARGETS.includes(String(form.get("to"))) ? String(form.get("to")) : "/app";
      if (index.editing !== id) await saveIndex(admin, shopId, { ...index, editing: id });
      return redirect(to);
    }
    if (intent === "rename") {
      needQuiz();
      list[at] = { ...list[at], name: cleanName(form.get("name"), `Quiz ${id}`) };
      await saveIndex(admin, shopId, { ...index, list });
      return { ok: true, intent };
    }
    if (intent === "delete") {
      needQuiz();
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
        needQuiz();
        const { config } = await readConfig(admin, { quiz: id });
        if (!config) return { ok: false, error: "That quiz is not set up yet, so there is nothing to copy" };
        const copy = JSON.parse(JSON.stringify(config));
        copy.meta = { ...(copy.meta || {}), slot: slotKey(nid), createdAt: new Date().toISOString() };
        await saveConfig(admin, shopId, copy);
        name = cleanName(`Copy of ${list[at].name || `Quiz ${id}`}`, `Quiz ${nid}`);
      }
      list.push({ id: nid, name, createdAt: new Date().toISOString() });
      await saveIndex(admin, shopId, { list, editing: nid });
      return intent === "new" ? redirect("/app/start") : { ok: true, intent };
    }
    if (intent === "advanced" || intent === "simple" || intent === "adopt-headline") {
      needQuiz();
      const { config } = await readConfig(admin, { quiz: id });
      if (!config) return { ok: false, error: "That quiz is not set up yet" };
      if (intent === "adopt-headline") {
        const tpl = templateCopy(config);
        if (!tpl.title) return { ok: false, error: "This template has no suggested headline" };
        config.copy = { ...(config.copy || {}), title: tpl.title, titleHighlight: tpl.titleHighlight || "" };
        await saveConfig(admin, shopId, config);
      } else {
        await saveConfig(admin, shopId, intent === "advanced" ? toAdvanced(config) : toSimple(config));
      }
      return { ok: true, intent };
    }
  } catch (e) { return { ok: false, intent, error: e.message }; }
  return { ok: false, error: "Unknown action" };
};

const priceLine = () => `Free for one quiz and up to ${PLANS.free.limit} completed quizzes a month. Starter USD ${PLANS.starter.price} (${PLANS.starter.quizzes} quizzes), Standard USD ${PLANS.standard.price} (${PLANS.standard.quizzes}) and Growth USD ${PLANS.growth.price} a month (${PLANS.growth.quizzes}), each with a ${TRIAL_DAYS}-day free trial. Custom plans on request.`;

/* Plan, this month's completions, quizzes used and the way to a bigger plan.
   planUrl is null when the app is not reading plans from Shopify (local
   development with BCFG_PLAN): there is no plan page to link to then. */
function PlanCard({ quizCount }) {
  const app = useRouteLoaderData("routes/app") || {};
  const { plan, usage, planUrl } = app;
  if (!plan) return <s-paragraph color="subdued">{priceLine()}</s-paragraph>;
  const up = nextPlan(plan);
  const trialDays = plan.trialEndsAt ? Math.max(0, Math.ceil((Date.parse(plan.trialEndsAt) - Date.now()) / 864e5)) : 0;
  const cap = plan.quizzes || 1;
  const meter = (value, max, label, warn) => (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label} style={{ height: 6, borderRadius: 3, background: "#e3e3e3", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.round((value / max) * 100))}%`, height: "100%", background: warn ? "#b98900" : "#1a1a1a", borderRadius: 3 }} />
    </div>
  );
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="inline" gap="small" alignItems="center">
        <s-text type="strong">{plan.name}</s-text>
        {trialDays ? <s-badge tone="info">{`Trial, ${trialDays} day${trialDays === 1 ? "" : "s"} left`}</s-badge> : null}
        {plan.price ? <s-text color="subdued">{`USD ${plan.price} a month`}</s-text> : null}
      </s-stack>
      {usage ? (
        <s-stack direction="block" gap="small-200">
          <s-text color="subdued">{`${usage.count.toLocaleString("en-GB")} of ${usage.limit.toLocaleString("en-GB")} completed quizzes this month`}</s-text>
          {meter(usage.count, usage.limit, "Completed quizzes this month", usage.over)}
        </s-stack>
      ) : null}
      <s-stack direction="block" gap="small-200">
        <s-text color="subdued">{`${quizCount} of ${cap} quiz${cap === 1 ? "" : "zes"}`}</s-text>
        {meter(quizCount, cap, "Quizzes used", quizCount >= cap)}
      </s-stack>
      {plan.attribution ? <s-text color="subdued">Results show a small Powered by CraftFrame line. Paid plans remove it.</s-text> : null}
      {planUrl
        ? <s-box><s-button variant={up && usage && (usage.half || usage.near || usage.over || quizCount >= cap) ? "primary" : "secondary"} href={planUrl} target="_top">{up ? `See ${up.name} and other plans` : "Manage plan"}</s-button></s-box>
        : <s-text color="subdued">Plans are chosen on Shopify's plan page in the live app. This development copy reads its plan from BCFG_PLAN.</s-text>}
      {!up ? <s-text color="subdued">{`Need more than Growth? Ask for a Custom plan at ${CUSTOM_PLAN_EMAIL}.`}</s-text> : null}
    </s-stack>
  );
}

function Welcome() {
  return (
    <s-page heading="Welcome to CraftFrame Bundle Quiz">
      <s-button slot="primary-action" href="/app/start">Start setup</s-button>

      <s-section>
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-text color="subdued">{`Version ${VERSION}. ${priceLine()}`}</s-text>
          </s-stack>
          <s-paragraph>
            A short quiz on your storefront that turns a shopper's answers into the right product from your store, or a main product plus the extras that fit, ready in the cart. You pick the products, tick which answers point to them, and the quiz wears your store's colours.
          </s-paragraph>
          <s-stack direction="inline" gap="base">
            <s-button variant="primary" href="/app/start">Start setup</s-button>
            <s-text color="subdued">About five minutes. Nothing shows on your store until you add the block.</s-text>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section heading="How it works">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {[
            ["1", "Shoppers answer", "Four to six quick questions in a block you place on any page. Answers survive a refresh and can be shared as a link."],
            ["2", "Answers pick the product", "Each answer points to products you chose. The best fit wins, and the extras that fit come with it."],
            ["3", "Cart is ready", "The result shows the pick and why, then opens the cart with everything in it."],
          ].map(([n, h, p]) => (
            <s-box key={n} padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small-200">
                <s-badge>{`Step ${n}`}</s-badge>
                <s-heading>{h}</s-heading>
                <s-paragraph color="subdued">{p}</s-paragraph>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="What setup covers">
        <s-ordered-list>
          <s-list-item>Your products: choose a Product finder or a Bundle quiz and pick the products to recommend. Your theme's look is matched on the way.</s-list-item>
          <s-list-item>Questions: suggested for what you sell. Rename anything and tick which products each answer points to.</s-list-item>
          <s-list-item>Go live: add the block to your theme.</s-list-item>
        </s-ordered-list>
      </s-section>

      <s-section slot="aside" heading="What the app can access">
        <s-unordered-list>
          <s-list-item>Read your products, to link them in setup.</s-list-item>
          <s-list-item>Read your theme's settings, to match its look.</s-list-item>
          <s-list-item>Write one setting on your shop that holds your configuration.</s-list-item>
        </s-unordered-list>
        <s-paragraph color="subdued">It never edits your theme, your products or your orders, and it stores no customer data. Shoppers' answers stay in their own browser.</s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Help">
        <s-paragraph>{`Version ${VERSION}. Coming next: live price sync and drop-off analytics.`}</s-paragraph>
        <s-paragraph>Something broken or missing? <s-link href={`mailto:${SUPPORT_EMAIL}?subject=Bundle%20Configurator`}>{SUPPORT_EMAIL}</s-link>. Replies within two working days.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export default function Index() {
  const data = useLoaderData();
  return data.welcome ? <Welcome /> : <Home {...data} />;
}

/* One quiz: what it is, how far its setup is, what it needs next, and the
   doors into each editor page for it. */
function QuizCard({ q, editing, paused, canAdd, busy, go, submit }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(q.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const done = q.ready ? q.steps.filter((st) => st.done).length : 0;
  const pages = q.ready
    ? (q.simple
      ? [["/app/start", "Products"], ["/app/grid", "Questions"], ["/app/look", "Look"], ["/app/copy", "Copy & cart"]]
      : [["/app/questions", "Questions"], ["/app/rules", "Rules"], ["/app/products", "Products"], ["/app/look", "Look"], ["/app/copy", "Copy & cart"]])
    : [];
  const facts = q.ready ? [q.category, `${q.products} product${q.products === 1 ? "" : "s"}`, `${q.questions} question${q.questions === 1 ? "" : "s"}`, `${q.completions.toLocaleString("en-GB")} completed this month`].filter(Boolean) : ["Not set up yet"];
  return (
    <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small-200">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-text color="subdued">{`Quiz ${q.id}`}</s-text>
            {q.type ? <s-badge>{q.type}</s-badge> : null}
            {paused ? <s-badge tone="warning">Paused on your plan</s-badge> : q.ready && !q.next ? <s-badge tone="success">Ready</s-badge> : <s-badge tone="attention">Setup in progress</s-badge>}
            {editing ? <s-badge tone="info">Last edited</s-badge> : null}
          </s-stack>
          {renaming ? (
            <s-stack direction="inline" gap="small" alignItems="end">
              <s-text-field label="Quiz name" value={name} maxLength={60} onInput={(e) => setName(e.currentTarget.value)} />
              <s-button variant="primary" onClick={() => { submit({ intent: "rename", id: q.id, name }); setRenaming(false); }}>Save name</s-button>
              <s-button variant="tertiary" onClick={() => { setName(q.name); setRenaming(false); }}>Cancel</s-button>
            </s-stack>
          ) : <s-heading>{q.name}</s-heading>}
          <s-text color="subdued">{facts.join(" · ")}</s-text>
        </s-stack>

        {q.next ? (
          <s-box padding="small" borderRadius="base" background="subdued">
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-text>{q.ready ? `Setup: ${done} of ${q.steps.length} steps done. Next: ${q.steps.find((st) => !st.done).label.toLowerCase()}.` : "Pick the products this quiz recommends to get started."}</s-text>
              <s-button variant="primary" onClick={() => go(q.id, q.next)} {...(busy ? { disabled: true } : {})}>{q.ready ? "Continue setup" : "Set it up"}</s-button>
            </s-stack>
          </s-box>
        ) : null}

        {q.headline ? (
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-text color="subdued">{`Headline: “${q.headline.title || "None yet"}”, the ${q.headline.state === "placeholder" ? "old placeholder" : "template's"}.`}</s-text>
            <s-button variant="tertiary" onClick={() => go(q.id, "/app/copy")}>Write your own</s-button>
            {q.headline.state === "placeholder" && q.headline.suggestion ? <s-button variant="tertiary" onClick={() => submit({ intent: "adopt-headline", id: q.id })}>{`Use “${q.headline.suggestion}”`}</s-button> : null}
          </s-stack>
        ) : null}

        {pages.length ? (
          <s-stack direction="inline" gap="small">
            {pages.map(([href, label]) => <s-button key={href} onClick={() => go(q.id, href)} {...(busy ? { disabled: true } : {})}>{label}</s-button>)}
          </s-stack>
        ) : null}

        <s-stack direction="inline" gap="small">
          <s-button variant="tertiary" onClick={() => setRenaming(true)}>Rename</s-button>
          {q.ready ? <s-button variant="tertiary" onClick={() => submit({ intent: "duplicate", id: q.id })} {...(!canAdd || busy ? { disabled: true } : {})}>Duplicate</s-button> : null}
          {q.ready && (q.simple || q.canSimple) ? <s-button variant="tertiary" onClick={() => submit({ intent: q.simple ? "advanced" : "simple", id: q.id })}>{q.simple ? "Switch to the rules editor" : "Back to the simple setup"}</s-button> : null}
          {confirmDelete ? (
            <>
              <s-button tone="critical" onClick={() => { submit({ intent: "delete", id: q.id }); setConfirmDelete(false); }}>{`Delete ${q.name} for good`}</s-button>
              <s-button variant="tertiary" onClick={() => setConfirmDelete(false)}>Keep it</s-button>
            </>
          ) : <s-button variant="tertiary" tone="critical" onClick={() => setConfirmDelete(true)}>Delete</s-button>}
        </s-stack>
      </s-stack>
    </s-box>
  );
}

const TOASTS = { rename: "Quiz renamed", delete: "Quiz deleted", duplicate: "Quiz duplicated", advanced: "Rules editor on", simple: "Back to the simple setup", "adopt-headline": "Headline updated" };

function Home({ quizzes, editing, block, editorUrl, storeUrl, season }) {
  const app = useRouteLoaderData("routes/app") || {};
  const plan = app.plan || PLANS.free;
  const cap = plan.quizzes || 1;
  const canAdd = quizzes.length < cap && quizzes.length < MAX_QUIZZES;
  const up = nextPlan(plan);
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const busy = fetcher.state !== "idle";
  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) shopify.toast.show(TOASTS[fetcher.data.intent] || "Saved");
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true, duration: 8000 });
  }, [fetcher.data, shopify]);
  const submit = (data) => fetcher.submit(data, { method: "POST" });
  const go = (id, to) => submit({ intent: "go", id, to });

  return (
    <s-page heading="CraftFrame Bundle Quiz">
      <s-button slot="primary-action" onClick={() => submit({ intent: "new" })} {...(!canAdd || busy ? { disabled: true } : {})}>New quiz</s-button>
      <s-button slot="secondary-actions" href={storeUrl} target="_blank">View storefront</s-button>
      <s-button slot="secondary-actions" href={editorUrl} target="_blank">Theme editor</s-button>

      {block ? (
        block.installed ? (
          <s-banner tone="success" heading={`On your store: ${block.where.join(", ")}`}>
            {`The quiz block is on the ${block.theme} theme. Saved changes appear on the storefront straight away. Each block's Quiz setting picks which quiz it shows.`}
          </s-banner>
        ) : (
          <s-banner tone="info" heading="Not on your store yet">
            {`Shoppers see a quiz once its block is on the ${block.theme} theme: in the theme editor, add the CraftFrame Bundle Quiz block to a section and choose the quiz under Quiz. `}
            <s-link href={editorUrl} target="_blank">Open the theme editor</s-link>
          </s-banner>
        )
      ) : null}

      <s-section heading="Your quizzes">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-text color="subdued">Choose what to work on. Each quiz has its own products, questions, look and copy.</s-text>
          </s-stack>
          {quizzes.map((q) => (
            <QuizCard key={q.id} q={q} editing={q.id === editing && quizzes.length > 1} paused={Number(q.id) > cap} canAdd={canAdd} busy={busy} go={go} submit={submit} />
          ))}
          {canAdd ? (
            <s-clickable onClick={() => submit({ intent: "new" })} padding="base" borderWidth="base" borderRadius="base" accessibilityLabel="Add a quiz">
              <s-stack direction="inline" gap="small" alignItems="center">
                <s-text type="strong">+ Add a quiz</s-text>
                <s-text color="subdued">{`${quizzes.length} of ${cap} on ${plan.name}. A gift finder, a second product range, a seasonal offer.`}</s-text>
              </s-stack>
            </s-clickable>
          ) : (
            <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
              <s-text color="subdued">{up ? `${plan.name} includes ${cap} quiz${cap === 1 ? "" : "zes"}. ${up.name} includes ${up.quizzes}. See the Plan card to upgrade.` : `Growth includes ${cap} quizzes. Ask for a Custom plan at ${CUSTOM_PLAN_EMAIL} for more.`}</s-text>
            </s-box>
          )}
        </s-stack>
      </s-section>

      {season ? (
        <s-section heading="Black Friday">
          <s-stack direction="block" gap="small">
            <s-text>{`${season.label}. Add an offer and every result shows the saving, with the code applied at checkout. Create the same code in Shopify, Discounts, first.`}</s-text>
            <s-box><s-button variant="secondary" onClick={() => go(editing, "/app/copy")}>Set up a Black Friday offer</s-button></s-box>
          </s-stack>
        </s-section>
      ) : null}

      <s-section slot="aside" heading="Plan and usage">
        <PlanCard quizCount={quizzes.length} />
      </s-section>

      <s-section slot="aside" heading="Showing a quiz">
        <s-stack direction="block" gap="small-200">
          <s-paragraph color="subdued">In the theme editor, add the CraftFrame Bundle Quiz block to any page, then pick the quiz under Quiz. Different pages can show different quizzes.</s-paragraph>
          <s-box><s-button variant="secondary" href={editorUrl} target="_blank">Open the theme editor</s-button></s-box>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Help">
        <s-stack direction="block" gap="small-200">
          <s-paragraph>{`Version ${VERSION}. We answer every email within two working days.`}</s-paragraph>
          <s-link href={`mailto:${SUPPORT_EMAIL}?subject=Bundle%20Quiz`}>{SUPPORT_EMAIL}</s-link>
          <s-paragraph color="subdued">The app reads your products and theme settings and writes your quiz setups to your store. It stores no customer data.</s-paragraph>
          <s-link href="https://bundle-configurator.netlify.app/privacy" target="_blank">Privacy policy</s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
export const headers = (headersArgs) => boundary.headers(headersArgs);
