/* ============================================================
   Home.
   No configuration yet: the welcome. What the app does, how the five-step
   setup goes and what it can access. One button.
   Configuration saved: the overview, laid out the way Shopify's own apps do
   it. A status banner that says whether the block is really on the theme
   (read from the theme, not assumed), a setup guide with progress and one
   expanded task at a time, quick actions into every editor page, and the
   live preview, plan and help on the side.
   ============================================================ */
import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate, billingEnabled, PLAN_PRICE_USD, PLAN_TRIAL_DAYS } from "../shopify.server";
import { listCategories, buildCategory, readConfig, saveConfig, themeEditorUrl } from "../config.server";
import { blockOnTheme } from "../theme.server";
import { VERSION, SUPPORT_EMAIL } from "../components/SetupRail";
import { WidgetPreview } from "../components/WidgetPreview";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config, domain } = await readConfig(admin);
  const categories = listCategories();
  const current = config ? categories.find((c) => c.id === config.meta?.category) || null : null;
  const billing = { enabled: billingEnabled, price: PLAN_PRICE_USD, trialDays: PLAN_TRIAL_DAYS };
  const block = config ? await blockOnTheme(admin) : null;
  return { config, current, editorUrl: themeEditorUrl(domain), storeUrl: `https://${domain}/`, billing, block, headline: config ? headlineState(config) : null };
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

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  if (form.get("intent") !== "adopt-headline") return { ok: false, error: "Unknown action" };
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  const tpl = templateCopy(config);
  if (!tpl.title) return { ok: false, error: "This template has no suggested headline" };
  try {
    config.copy = { ...(config.copy || {}), title: tpl.title, titleHighlight: tpl.titleHighlight || "" };
    await saveConfig(admin, shopId, config);
  } catch (e) { return { ok: false, error: e.message }; }
  return { ok: true };
};

function Welcome({ billing }) {
  return (
    <s-page heading="Welcome to CraftFrame Bundle Quiz">
      <s-button slot="primary-action" href="/app/category">Start setup</s-button>

      <s-section>
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-text color="subdued">{billing.enabled ? `Version ${VERSION}. ${billing.trialDays} days free, then USD ${billing.price} a month.` : `Version ${VERSION}.`}</s-text>
          </s-stack>
          <s-paragraph>
            A short questionnaire on your storefront that turns a shopper's answers into a ready-made cart: the right bundle, the right add-ons, one click to checkout. You choose what to ask, the rules decide what goes in the basket, and the widget wears your store's colours.
          </s-paragraph>
          <s-stack direction="inline" gap="base">
            <s-button variant="primary" href="/app/category">Start setup</s-button>
            <s-text color="subdued">About five minutes. Nothing shows on your store until you add the block.</s-text>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section heading="How it works">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {[
            ["1", "Shoppers answer", "Four to six quick questions in a block you place on any page. Answers survive a refresh and can be shared as a link."],
            ["2", "Rules build the bundle", "Each answer picks a base set and adds the products that fit. Every product is one of yours, linked in setup."],
            ["3", "Cart is ready", "The result shows what is in the set and why, then opens checkout with everything pre-loaded."],
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
          <s-list-item>Category: pick what you sell and get a working questionnaire immediately.</s-list-item>
          <s-list-item>Look: match your store's colours in one click, or set your own.</s-list-item>
          <s-list-item>Questions: rename, reorder, add or remove; emoji or your own product photos.</s-list-item>
          <s-list-item>Products: link each bundle and add-on to one of your products with the product picker.</s-list-item>
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

/* One row of the setup guide: a tick or an open circle, the title, and, when
   expanded, a sentence and the one action that moves it forward. */
function Task({ task, open, onToggle }) {
  const mark = { width: 22, height: 22, flex: "0 0 22px", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, marginTop: 1,
    ...(task.done ? { background: "#1a1a1a", color: "#fff" } : { border: "2px dashed #8a8a8a", color: "transparent" }) };
  return (
    <s-box padding="small" borderRadius="base" background={open ? "subdued" : "transparent"}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={mark} aria-hidden="true">{task.done ? "✓" : ""}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <s-clickable onClick={onToggle} accessibilityLabel={`${task.title}, ${task.done ? "done" : "to do"}`}>
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-text type={open ? "strong" : "generic"}>{task.title}</s-text>
              {task.badge ? <s-badge tone={task.badgeTone || "neutral"}>{task.badge}</s-badge> : null}
            </s-stack>
          </s-clickable>
          {open ? (
            <s-stack direction="block" gap="small" style={{ marginTop: 6 }}>
              <s-paragraph color="subdued">{task.text}</s-paragraph>
              <s-stack direction="inline" gap="small">
                <s-button variant={task.done ? "secondary" : "primary"} href={task.href} {...(task.external ? { target: "_blank" } : {})}>{task.done ? task.editLabel : task.actionLabel}</s-button>
                {task.secondary ? <s-button variant="tertiary" href={task.secondary.href} {...(task.secondary.external ? { target: "_blank" } : {})}>{task.secondary.label}</s-button> : null}
              </s-stack>
            </s-stack>
          ) : null}
        </div>
      </div>
    </s-box>
  );
}

export default function Index() {
  const data = useLoaderData();
  return data.config ? <Overview {...data} /> : <Welcome billing={data.billing} />;
}

function Overview({ config, current, editorUrl, storeUrl, billing, block, headline }) {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok) shopify.toast.show("Headline updated");
    else shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  const setup = config.meta?.setup || {};
  const steps = (config.steps || []).length;
  const products = [...(config.bundles || []), ...Object.values(config.accessories || {})];
  const linked = products.filter((p) => p.variantId).length;
  const rules = (config.addonRules || []).length;
  const live = block ? block.installed : !!setup.live;

  const tasks = [
    { key: "category", done: true, title: "Choose what you sell", text: `You started from ${current ? current.label : "a template"}. Changing it rebuilds the questions, rules and product links.`, href: "/app/category", actionLabel: "Choose a category", editLabel: "Change category" },
    { key: "look", done: !!setup.look, title: "Match your store's look", text: "One click reads your theme's colours, type and corners. Your own choices always win over the match.", href: "/app/look", actionLabel: "Set the look", editLabel: "Edit the look" },
    { key: "questions", done: !!setup.questions, title: "Check your questions", badge: `${steps}`, text: "Rename, reorder, add or remove. Show options as emoji rows or as picture cards with your product photos.", href: "/app/questions", actionLabel: "Review questions", editLabel: "Edit questions" },
    { key: "products", done: products.length > 0 && linked === products.length, title: "Connect your products", badge: `${linked} of ${products.length}`, badgeTone: linked === products.length ? "success" : "warning", text: "Each bundle and add-on needs the product it puts in the cart. Rename them in Rules to match what you sell.", href: "/app/products", actionLabel: "Connect products", editLabel: "Edit product links" },
    { key: "live", done: live, title: "Add the block to your theme", text: "In the theme editor choose a section, then Add block, Apps, CraftFrame Bundle Quiz. Or Add section, Apps, for a full-width one. Save the theme.", href: editorUrl, external: true, actionLabel: "Open theme editor", editLabel: "Open theme editor", secondary: { href: storeUrl, label: "View storefront", external: true } },
  ];
  const doneCount = tasks.filter((t) => t.done).length;
  const firstOpen = tasks.find((t) => !t.done);
  const [open, setOpen] = useState(firstOpen ? firstOpen.key : null);
  const [guideHidden, setGuideHidden] = useState(doneCount === tasks.length);
  const pct = Math.round((doneCount / tasks.length) * 100);

  const actions = [
    ["/app/questions", "Questions", `${steps} question${steps === 1 ? "" : "s"}. Wording, order, icons and photos.`],
    ["/app/rules", "Rules", `${(config.bundles || []).length} bundles, ${rules} add-on rule${rules === 1 ? "" : "s"}. What goes in the cart, and when.`],
    ["/app/products", "Products", `${linked} of ${products.length} linked to your catalogue.`],
    ["/app/look", "Look", `${config.brand?.preset === "base" ? "Base" : "Glass"}${config.brand?.matched ? ", matched to your theme" : ""}. Colours, corners, type.`],
    ["/app/copy", "Copy & cart", "Every word shoppers read, promo code, how the cart opens."],
    ["/app/category", "Category", `${current ? current.label : "Template"}. Start again from a different template.`],
  ];

  return (
    <s-page heading="CraftFrame Bundle Quiz">
      <s-button slot="primary-action" href={editorUrl} target="_blank">Customize in theme editor</s-button>
      <s-button slot="secondary-actions" href={storeUrl} target="_blank">View storefront</s-button>

      {block ? (
        block.installed ? (
          <s-banner tone="success" heading={`Live on your store: ${block.where.join(", ")}`}>
            {`The questionnaire is on the ${block.theme} theme. Edits you save here appear on the storefront straight away.`}
          </s-banner>
        ) : (
          <s-banner tone="info" heading="Not on your theme yet">
            {`Everything is set up, but shoppers cannot see it until the block is on the ${block.theme} theme. `}
            <s-link href={editorUrl} target="_blank">Open the theme editor</s-link>
            , choose a section, then Add block, Apps, CraftFrame Bundle Quiz.
          </s-banner>
        )
      ) : null}

      {!guideHidden ? (
        <s-section>
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-heading>Setup guide</s-heading>
              <span style={{ marginLeft: "auto" }} />
              {doneCount === tasks.length ? <s-button variant="tertiary" onClick={() => setGuideHidden(true)}>Hide</s-button> : null}
            </s-stack>
            <s-paragraph color="subdued">Use this guide to get your questionnaire in front of shoppers.</s-paragraph>
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-text color="subdued">{`${doneCount} of ${tasks.length} tasks complete`}</s-text>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={doneCount} aria-label="Setup progress" style={{ flex: 1, maxWidth: 260, height: 6, borderRadius: 3, background: "#e3e3e3", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#1a1a1a", borderRadius: 3, transition: "width .3s" }} />
              </div>
            </s-stack>
            <s-stack direction="block" gap="small-200">
              {tasks.map((t) => <Task key={t.key} task={t} open={open === t.key} onToggle={() => setOpen(open === t.key ? null : t.key)} />)}
            </s-stack>
          </s-stack>
        </s-section>
      ) : (
        <s-section>
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge tone="success">Setup complete</s-badge>
            <s-text color="subdued">All five tasks done.</s-text>
            <span style={{ marginLeft: "auto" }} />
            <s-button variant="tertiary" onClick={() => setGuideHidden(false)}>Show setup guide</s-button>
          </s-stack>
        </s-section>
      )}

      {headline && headline.state !== "custom" ? (
        <s-section>
          <s-stack direction="block" gap="small">
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-badge tone={headline.state === "placeholder" ? "warning" : "info"}>{headline.state === "placeholder" ? "Placeholder headline" : "Template headline"}</s-badge>
              <s-text type="strong">{`“${headline.title || "No headline"}”`}</s-text>
            </s-stack>
            <s-paragraph color="subdued">
              {headline.state === "placeholder"
                ? "This is the first thing shoppers read, and right now it says nothing about your store."
                : "This is the template's suggestion. It works, and one written in your own voice works better."}
            </s-paragraph>
            <s-stack direction="inline" gap="small">
              <s-button variant="primary" href="/app/copy">Write your headline</s-button>
              {headline.state === "placeholder" && headline.suggestion ? (
                <s-button variant="secondary" onClick={() => fetcher.submit({ intent: "adopt-headline" }, { method: "POST" })} {...(fetcher.state !== "idle" ? { loading: true } : {})}>{`Use “${headline.suggestion}”`}</s-button>
              ) : null}
            </s-stack>
          </s-stack>
        </s-section>
      ) : null}

      <s-section heading={current ? `${current.icon} ${current.label}` : "Your questionnaire"}>
        <s-paragraph color="subdued">Everything shoppers see and everything that decides their cart. Changes save to your store and go live at once.</s-paragraph>
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(210px, 1fr))" gap="base">
          {actions.map(([href, title, text]) => (
            <s-clickable key={href} href={href} padding="base" borderWidth="base" borderRadius="base" background="base">
              <s-stack direction="block" gap="small-200">
                <s-heading>{title}</s-heading>
                <s-paragraph color="subdued">{text}</s-paragraph>
              </s-stack>
            </s-clickable>
          ))}
        </s-grid>
      </s-section>

      <s-section slot="aside" heading="Preview">
        <WidgetPreview config={config} />
      </s-section>

      <s-section slot="aside" heading="Plan">
        <s-paragraph>{billing.enabled ? `${billing.trialDays}-day free trial, then USD ${billing.price} a month, on your Shopify bill.` : "Free for now. Later: 14 days free, then USD 25 a month, on your Shopify bill."}</s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Help">
        <s-stack direction="block" gap="small-200">
          <s-paragraph>{`Version ${VERSION}. We answer every email within two working days.`}</s-paragraph>
          <s-link href={`mailto:${SUPPORT_EMAIL}?subject=Bundle%20Configurator`}>{SUPPORT_EMAIL}</s-link>
          <s-paragraph color="subdued">The app reads your products and theme settings and writes one setting that holds your setup. It stores no customer data.</s-paragraph>
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
