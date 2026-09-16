/* ============================================================
   "Match my store" from inside the admin.

   On the storefront the block sniffs computed styles live. The admin has no
   storefront DOM, so it reads the published theme's settings_data.json
   (Online Store 2.0 themes keep colour schemes and fonts there), reduces it
   to the same six readings the sniffer produces, and hands them to the very
   same tokensFrom() and confidence() from src/theme-inherit.js, run here in
   a vm sandbox. One derivation, two entry points.
   Needs the read_themes scope.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { repoDir } from "./config.server";

const srcDir = repoDir("src");

let api = null;
function runtime() {
  if (api) return api;
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  const ctx = vm.createContext(sandbox);
  for (const f of ["configurator.js", "theme-inherit.js"]) {
    vm.runInContext(fs.readFileSync(path.join(srcDir, f), "utf8"), ctx, { filename: f });
  }
  api = sandbox.window.BundleConfigurator;
  return api;
}

/* Dawn-family font handles look like "assistant_n4"; turn them into a family. */
function fontFamily(handle) {
  if (!handle || typeof handle !== "string") return "";
  const name = handle.split("_")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `"${name}", sans-serif`;
}

export async function readThemeLook(admin) {
  const res = await admin.graphql(`#graphql
    query bcfgTheme {
      themes(first: 1, roles: [MAIN]) {
        nodes {
          id name
          files(filenames: ["config/settings_data.json"], first: 1) {
            nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } }
          }
        }
      }
    }`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  const theme = data?.themes?.nodes?.[0];
  const raw = theme?.files?.nodes?.[0]?.body?.content;
  if (!raw) return { theme: theme?.name || null, readings: null, tokens: null, confidence: { level: "low", score: 0, reasons: ["Could not read the theme's settings"], source: "fallback" } };

  let settings = null;
  try { settings = JSON.parse(raw.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "")); } catch (e) { settings = null; }
  // Older Dawn-family themes point `current` at a named preset; newer ones
  // inline the object. Either way the flat keys and colour schemes live there.
  let cur = null;
  if (settings?.current && typeof settings.current === "object") cur = settings.current;
  else if (typeof settings?.current === "string" && settings.presets) cur = settings.presets[settings.current] || null;
  const schemes = cur?.color_schemes || {};
  const first = Object.values(schemes)[0]?.settings || cur || {};

  const readings = {
    accent: first.button || first.accent_1 || first.colors_accent_1 || null,
    ink: first.text || first.colors_text || null,
    paper: first.background || first.colors_background_1 || null,
    font: fontFamily(cur?.type_body_font),
    radius: Number.isFinite(Number(cur?.buttons_radius)) ? Number(cur.buttons_radius) : 12,
  };
  const A = runtime();
  const u = A.colorUtils;
  const paper = u.parse(readings.paper);
  readings.appearance = paper && u.lum(paper) < 0.35 ? "dark" : "light";

  // Same scoring as the storefront sniffer; here the source is the theme's own
  // button colour, which is a strong signal when it has any chroma at all.
  const accent = u.parse(readings.accent);
  const sat = accent ? (Math.max(accent.r, accent.g, accent.b) - Math.min(accent.r, accent.g, accent.b)) / (Math.max(accent.r, accent.g, accent.b) || 1) : 0;
  const source = !accent ? "fallback" : sat > 0.18 ? "primary-button" : "neutral-button";
  const confidence = A.confidence(readings, { source, buttons: accent ? 1 : 0, radiusFound: cur?.buttons_radius != null });
  // The scorer's reasons are written for the storefront sniffer; reword the
  // ones that mean something different when reading theme settings.
  confidence.reasons = confidence.reasons.map((r) =>
    r === "No buttons found on the page" ? "No button colour in the theme settings"
    : r === "Buttons are neutral, so the accent is a guess" ? "The theme's buttons are black or grey, so there is no brand colour to take"
    : r);
  const tokens = A.tokensFrom(readings);
  return { theme: theme?.name || null, readings, tokens, confidence };
}

export function deriveAccentTokens(hex) {
  const A = runtime();
  const u = A.colorUtils;
  const c = u.parse(hex);
  if (!c) return null;
  return {
    accent: hex,
    "accent-dark": u.hex(u.mix(c, { r: 0, g: 0, b: 0 }, 0.18)),
    "accent-soft": u.hex(u.mix(c, { r: 255, g: 255, b: 255 }, 0.94)),
    "accent-tint": u.hex(u.mix(c, { r: 255, g: 255, b: 255 }, 0.88)),
    "accent-line": u.hex(u.mix(c, { r: 255, g: 255, b: 255 }, 0.7)),
    "accent-ink": u.contrast(c, { r: 255, g: 255, b: 255 }) >= u.contrast(c, { r: 0, g: 0, b: 0 }) ? "#ffffff" : "#000000",
  };
}

export function contrastOf(fg, bg) {
  const u = runtime().colorUtils;
  const a = u.parse(fg), b = u.parse(bg);
  return a && b ? Math.round(u.contrast(a, b) * 100) / 100 : null;
}
