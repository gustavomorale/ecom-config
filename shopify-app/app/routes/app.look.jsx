/* ============================================================
   Setup step 2: Look.
   "Match my store" reads the published theme's settings and applies them as
   the inherited layer, with a confidence badge and a way out. The merchant's
   own choices (preset, colour, corners, type) always win over the match.
   ============================================================ */
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { readConfig, saveConfig } from "../config.server";
import { readThemeLook, deriveAccentTokens, contrastOf } from "../theme.server";
import { SetupRail, doneSteps } from "../components/SetupRail";
import { WidgetPreview } from "../components/WidgetPreview";

const FONTS = {
  "Store default": "",
  "Inter": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "System": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  "Georgia": "Georgia, 'Times New Roman', serif",
  "Helvetica": "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return redirect("/app");
  const brand = config.brand || {};
  const theme = brand.theme || {};
  const accentInk = theme["accent-ink"] || (brand.inherited && brand.inherited["accent-ink"]) || "#ffffff";
  const accent = theme.accent || (brand.inherited && brand.inherited.accent) || "#3d5ee6";
  return {
    config,
    done: doneSteps(config),
    matched: brand.matched || null,
    contrast: contrastOf(accentInk, accent),
    fonts: Object.keys(FONTS),
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { shopId, config } = await readConfig(admin);
  if (!config) return { ok: false, error: "No configuration yet" };
  config.brand = config.brand || {};
  config.brand.theme = config.brand.theme || {};
  config.meta = config.meta || {};
  config.meta.setup = config.meta.setup || {};
  try {
    if (intent === "match") {
      const look = await readThemeLook(admin);
      if (look.tokens) {
        config.brand.inherited = look.tokens;
        config.brand.appearance = look.readings.appearance || "auto";
      }
      config.brand.matched = { theme: look.theme, confidence: look.confidence, at: new Date().toISOString() };
      await saveConfig(admin, shopId, config);
      return { ok: true, intent, matched: config.brand.matched };
    }
    if (intent === "unmatch") {
      delete config.brand.inherited;
      delete config.brand.matched;
      config.brand.appearance = "auto";
      await saveConfig(admin, shopId, config);
      return { ok: true, intent };
    }
    if (intent === "save") {
      const preset = String(form.get("preset") || "glass");
      const appearance = String(form.get("appearance") || "auto");
      const accent = String(form.get("accent") || "").trim();
      const radius = Number(form.get("radius"));
      const font = String(form.get("font") || "");
      config.brand.preset = preset === "base" ? "base" : "glass";
      config.brand.appearance = ["auto", "light", "dark"].includes(appearance) ? appearance : "auto";
      if (/^#[0-9a-f]{6}$/i.test(accent)) Object.assign(config.brand.theme, deriveAccentTokens(accent));
      else ["accent", "accent-dark", "accent-soft", "accent-tint", "accent-line", "accent-ink"].forEach((k) => delete config.brand.theme[k]);
      if (Number.isFinite(radius) && form.get("radius") !== "") {
        const r = Math.max(0, Math.min(28, radius));
        config.brand.theme.radius = `${r}px`;
        config.brand.theme["radius-sm"] = `${Math.max(0, r - 6)}px`;
        config.brand.theme["radius-pill"] = `${Math.max(0, r - 3)}px`;
      } else ["radius", "radius-sm", "radius-pill"].forEach((k) => delete config.brand.theme[k]);
      if (FONTS[font]) config.brand.theme.font = FONTS[font]; else delete config.brand.theme.font;
      config.meta.setup.look = true;
      await saveConfig(admin, shopId, config);
      const next = form.get("continue") === "1";
      if (next) return redirect("/app/questions");
      return { ok: true, intent };
    }
  } catch (e) {
    return { ok: false, intent, error: e.message };
  }
  return { ok: false, intent, error: "Unknown action" };
};

function ConfidenceBadge({ matched }) {
  if (!matched) return null;
  const c = matched.confidence || { level: "high", reasons: [] };
  const tone = c.level === "high" ? "success" : c.level === "medium" ? "warning" : "critical";
  const word = c.level === "high" ? "Good match" : c.level === "medium" ? "Partial match" : "Weak match";
  return (
    <s-stack direction="block" gap="small-200">
      <s-stack direction="inline" gap="small">
        <s-badge tone={tone}>{`${word}${matched.theme ? ` to ${matched.theme}` : ""}`}</s-badge>
      </s-stack>
      {c.reasons?.length ? <s-paragraph color="subdued">{c.reasons.join(". ")}.</s-paragraph> : <s-paragraph color="subdued">Colours, type and corners read cleanly. Your choices below win over the match.</s-paragraph>}
    </s-stack>
  );
}

export default function Look() {
  const { config, done, matched, contrast, fonts } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const brand = config.brand || {};
  const theme = brand.theme || {};

  const [preset, setPreset] = useState(brand.preset || "glass");
  const [appearance, setAppearance] = useState(brand.appearance || "auto");
  const [accent, setAccent] = useState(theme.accent || "");
  const [radius, setRadius] = useState(theme.radius ? parseInt(theme.radius, 10) : "");
  const [font, setFont] = useState(Object.keys(FONTS).find((k) => FONTS[k] === theme.font) || "Store default");
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.ok && fetcher.data.intent === "match") shopify.toast.show("Matched to your theme");
    if (fetcher.data.ok && fetcher.data.intent === "unmatch") shopify.toast.show("Using your own colours");
    if (fetcher.data.ok && fetcher.data.intent === "save") shopify.toast.show("Look saved");
    if (fetcher.data.ok === false) shopify.toast.show(fetcher.data.error || "Something went wrong", { isError: true });
  }, [fetcher.data, shopify]);

  // Live preview config: what is saved, plus what is being edited.
  const previewCfg = JSON.parse(JSON.stringify(config));
  previewCfg.brand = previewCfg.brand || {};
  previewCfg.brand.preset = preset;
  previewCfg.brand.appearance = appearance;
  previewCfg.brand.theme = { ...(previewCfg.brand.theme || {}) };
  if (/^#[0-9a-f]{6}$/i.test(accent)) previewCfg.brand.theme.accent = accent;
  else delete previewCfg.brand.theme.accent;
  if (radius !== "" && Number.isFinite(Number(radius))) {
    const r = Math.max(0, Math.min(28, Number(radius)));
    previewCfg.brand.theme.radius = `${r}px`; previewCfg.brand.theme["radius-sm"] = `${Math.max(0, r - 6)}px`; previewCfg.brand.theme["radius-pill"] = `${Math.max(0, r - 3)}px`;
  }
  if (FONTS[font]) previewCfg.brand.theme.font = FONTS[font]; else delete previewCfg.brand.theme.font;

  const submit = (cont) => fetcher.submit({ intent: "save", preset, appearance, accent, radius: radius === "" ? "" : String(radius), font, continue: cont ? "1" : "0" }, { method: "POST" });

  return (
    <s-page heading="Make it look like your store." inlineSize="large">
      <s-button slot="primary-action" onClick={() => submit(true)} {...(busy ? { loading: true } : {})}>Save and continue</s-button>
      <s-button slot="secondary-actions" href="/app/questions" variant="tertiary">Skip for now</s-button>

      <s-section>
        <SetupRail current="look" done={done} />
        <s-paragraph>One colour does most of the work. Match your store in a click, or pick your brand colour. Everything can be changed later.</s-paragraph>
      </s-section>

      <s-section heading="Match my store">
        <s-paragraph color="subdued">Reads your published theme's colours, type and corners. Your storefront also re-checks live, so a theme change carries through.</s-paragraph>
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-button onClick={() => fetcher.submit({ intent: "match" }, { method: "POST" })} {...(busy ? { loading: true } : {})}>
            {matched ? "Match again" : "Match my store"}
          </s-button>
          {matched ? (
            <s-button variant="tertiary" onClick={() => fetcher.submit({ intent: "unmatch" }, { method: "POST" })} {...(busy ? { disabled: true } : {})}>
              Use my own colours instead
            </s-button>
          ) : null}
        </s-stack>
        <ConfidenceBadge matched={matched} />
      </s-section>

      <s-section heading="Your choices">
        <s-stack direction="block" gap="base">
          <s-choice-list name="preset" label="Look" value={preset} onChange={(e) => setPreset(e.currentTarget.value)}>
            <s-choice value="glass" details="Translucent surfaces, depth, a soft glow on the accent.">Glass</s-choice>
            <s-choice value="base" details="Flat, quiet, closest to most themes.">Base</s-choice>
          </s-choice-list>
          <s-select label="Appearance" name="appearance" value={appearance} onChange={(e) => setAppearance(e.currentTarget.value)}>
            <s-option value="auto">Auto (follows the shopper's device)</s-option>
            <s-option value="light">Light</s-option>
            <s-option value="dark">Dark</s-option>
          </s-select>
          <s-color-field label="Brand colour" name="accent" value={accent} placeholder="Leave empty to use the match or the default" onInput={(e) => setAccent(e.currentTarget.value)} onChange={(e) => setAccent(e.currentTarget.value)} details={contrast != null ? `Button text contrast ${contrast}:1${contrast >= 4.5 ? ", passes AA" : ", below AA"}` : ""} />
          <s-number-field label="Corner radius (px)" name="radius" value={radius} min="0" max="28" placeholder="Match or default" onInput={(e) => setRadius(e.currentTarget.value)} onChange={(e) => setRadius(e.currentTarget.value)} />
          <s-select label="Typeface" name="font" value={font} onChange={(e) => setFont(e.currentTarget.value)}>
            {fonts.map((f) => <s-option key={f} value={f}>{f}</s-option>)}
          </s-select>
        </s-stack>
        <s-stack direction="inline" gap="base" style={{ marginTop: 12 }}>
          <s-button variant="secondary" onClick={() => submit(false)} {...(busy ? { loading: true } : {})}>Save</s-button>
        </s-stack>
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
