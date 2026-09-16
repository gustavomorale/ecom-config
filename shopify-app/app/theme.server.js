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
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "../../src");

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
  const cur = settings?.current && typeof settings.current === "object" ? settings.current : null;
  const schemes = cur?.color_schemes || {};
  const first = Object.values(schemes)[0]?.settings || {};

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
