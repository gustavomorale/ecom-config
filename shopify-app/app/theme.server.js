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

/* Is our app block on the published theme, and where? Reads the theme's JSON
   templates and looks for a block whose type points at this app's extension.
   Best effort: null when the theme cannot be read. */
/* Themes record an app block as shopify://apps/<app handle>/blocks/<block>/<extension id>.
   The handle follows the app's name, so it changed when the app was renamed; the
   extension id does not. Match the id first, and fall back to the handles this app
   has had, so an install made under any of them is recognised. */
const BLOCK_IDS = ["01a0aacd-d373-7741-9543-994369a0c89f", "01a0aa66-c9b0-7531-ab18-ec6df9e3c716"];
const APP_HANDLES = /^(craftframe-bundle-quiz|bundle-configurator)/;
export function hasOurBlock(content) {
  const text = String(content || "").replace(/\\\//g, "/");
  const re = /shopify:\/\/apps\/([^"\/]+)\/blocks\/configurator\/([0-9a-f-]+)/g;
  let m;
  while ((m = re.exec(text))) if (BLOCK_IDS.includes(m[2]) || APP_HANDLES.test(m[1])) return true;
  return false;
}

export async function blockOnTheme(admin) {
  try {
    const res = await admin.graphql(`#graphql
      query bcfgBlock {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id name
            files(filenames: ["templates/*.json"], first: 50) {
              nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } }
            }
          }
        }
      }`);
    const { data } = await res.json();
    const theme = data?.themes?.nodes?.[0];
    if (!theme) return null;
    const pretty = (f) => {
      const n = f.replace(/^templates\//, "").replace(/\.json$/, "");
      if (n === "index") return "Home page";
      return n.split(".")[0].replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase()) + (n.includes(".") ? ` (${n.split(".").slice(1).join(".")})` : "");
    };
    const where = [];
    for (const f of theme.files?.nodes || []) {
      const content = f.body?.content || "";
      if (hasOurBlock(content)) where.push(pretty(f.filename));
    }
    return { theme: theme.name, installed: where.length > 0, where };
  } catch (e) {
    return null;
  }
}
