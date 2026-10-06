/* ============================================================
   Server-side access to the category registry and the merchant's config.

   The registry and templates live one level up in ../../configs as browser
   IIFEs (they are also what the storefront demo loads). Rather than keep a
   second copy for Node, we run those same files in a vm sandbox with a fake
   `window`. One source of truth for what a category is.

   The merchant's config lives in one shop metafield:
     namespace: bundle_configurator, key: config, type: json
   The theme app extension reads it in Liquid, so the definition is created
   with storefront read access on first save.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const NAMESPACE = "bundle_configurator";
export const KEY = "config";

/* Locate a sibling folder of the app (configs/, src/) both in local dev, where
   this file sits in shopify-app/app, and inside a Netlify function bundle,
   where included files keep their repo-relative path under the task root. */
export function repoDir(name) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env[`BCFG_${name.toUpperCase()}_DIR`],
    path.resolve(here, "../../", name),
    path.resolve(here, "../../../", name),
    path.resolve(process.cwd(), "..", name),
    path.resolve(process.cwd(), name),
    path.resolve("/var/task", name),
    path.resolve("/var/task/shopify-app/..", name),
  ].filter(Boolean);
  for (const c of candidates) { try { if (fs.statSync(c).isDirectory()) return c; } catch (e) { /* next */ } }
  throw new Error(`Cannot find the ${name}/ folder. Looked in: ${candidates.join(", ")}`);
}
const configsDir = repoDir("configs");

let registry = null;

function loadRegistry() {
  if (registry) return registry;
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  const context = vm.createContext(sandbox);
  const files = [
    ...fs.readdirSync(path.join(configsDir, "templates")).filter((f) => f.endsWith(".js")).map((f) => path.join("templates", f)),
    "categories.js",
    "simple.js",
  ];
  for (const rel of files) {
    const src = fs.readFileSync(path.join(configsDir, rel), "utf8");
    vm.runInContext(src, context, { filename: rel });
  }
  registry = sandbox.window.BCFG_CATEGORIES || [];
  simpleApi = sandbox.window.BCFG_SIMPLE;
  return registry;
}
let simpleApi = null;

/* ---------- simple setup (1.0) ---------- */
export function simple() { loadRegistry(); return simpleApi; }
export const isSimple = (config) => !!(config && config.simple && config.meta?.mode !== "advanced");

/* A new simple setup: the category supplies questions, wording and copy;
   the products are the merchant's own. */
export function buildSimple(categoryId, mode, products) {
  const S = simple();
  const tpl = buildCategory(categoryId);
  const draft = S.fromTemplate(tpl, mode);
  draft.products = JSON.parse(JSON.stringify(products || []));
  S.suggestGrid(draft);
  tpl.copy = S.starterCopy(tpl.copy || {}, draft.mode);
  return S.compile(draft, tpl);
}

/* Recompile after the merchant edits the simple setup, keeping everything
   else on the config (look, copy edits, cart, promo, setup progress). */
export function recompile(config, nextSimple) {
  const S = simple();
  const base = { ...config };
  delete base.simple;
  return S.compile(nextSimple, base);
}

/* Emoji in the registry are HTML entities (the demo renders innerHTML). */
export function decodeEntities(s) {
  return String(s || "").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)));
}

/* A category with a season (MM-DD range, may wrap the new year) is listed
   first while it is in season. */
export function inSeason(season, now = new Date()) {
  if (!season || !season.from || !season.to) return false;
  const md = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  return season.from <= season.to ? md >= season.from && md <= season.to : md >= season.from || md <= season.to;
}

export function listCategories(now = new Date()) {
  const list = loadRegistry().map((c) => ({
    id: c.id,
    label: c.label,
    icon: decodeEntities(c.icon),
    blurb: c.blurb,
    scene: c.scene,
    seasonLabel: inSeason(c.season, now) ? c.season.label || "In season" : "",
  }));
  return [...list.filter((c) => c.seasonLabel), ...list.filter((c) => !c.seasonLabel)];
}

export function buildCategory(id) {
  const cat = loadRegistry().find((c) => c.id === id);
  if (!cat) throw new Error(`Unknown category: ${id}`);
  const cfg = cat.build();
  cfg.meta = { category: cat.id, createdAt: new Date().toISOString(), engine: "1.2" };
  return cfg;
}

/* Advanced: the full rules editor. Ticks become rules (first match wins, the
   last product is the fallback) and names are written out so Rules can edit
   them. The simple setup is kept on the config, so switching back rebuilds
   from it (rule edits made in between are dropped). */
export function toAdvanced(config) {
  const next = JSON.parse(JSON.stringify(config));
  const steps = next.steps || [];
  const multi = (field) => steps.some((st) => st.field === field && st.type === "multi");
  const bundles = [...(next.bundles || [])].sort((a, b) => (b.points || []).length - (a.points || []).length);
  next.bundles = bundles.map((b, i) => {
    const out = { ...b, title: b.title || b.productTitle || "" };
    delete out.points;
    if (i < bundles.length - 1 && (b.points || []).length) out.when = { any: b.points.map((pt) => ({ field: pt.field, op: multi(pt.field) ? "includes" : "eq", value: pt.value })) };
    return out;
  });
  (next.addonRules || []).forEach((r) => { const acc = (next.accessories || {})[r.accessory]; if (!r.text && acc) r.text = acc.productTitle || ""; });
  delete next.match;
  next.meta = { ...(next.meta || {}), mode: "advanced" };
  return next;
}
export function toSimple(config) {
  const next = recompile(config, config.simple);
  next.meta = { ...(next.meta || {}) };
  delete next.meta.mode;
  return next;
}

/* ---------- metafield I/O ----------
   Multiple quizzes (1.0). Each quiz is one JSON shop metafield in the
   bundle_configurator namespace: Quiz 1 keeps the original key "config" (so
   stores from 0.9 and blocks placed before 1.0 carry on), quizzes 2 to 25 use
   "quiz_2" ... "quiz_25". The theme block's Quiz setting picks the number.
   Two more metafields:
     quizzes  admin only: { editing: "1", list: [{ id, name, createdAt }] }
     status   read by the storefront: the plan facts every quiz shares,
              { plan, attribution, quizzes, stopMonth }
   Every editor page reads and saves the quiz being edited (index.editing);
   readConfig stamps its key on config.meta.slot and saveConfig writes back
   there, so pages need no quiz parameter. */
export const INDEX_KEY = "quizzes";
export const STATUS_KEY = "status";
export const slotKey = (n) => (String(n) === "1" ? KEY : `quiz_${n}`);
export const slotOf = (key) => (key === KEY ? "1" : String(key || "").replace(/^quiz_/, ""));
const parse = (v) => { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } };

const SHOP_QUERY = `#graphql
  query bcfgShop {
    shop {
      id
      myshopifyDomain
      currencyCode
      metafield(namespace: "${NAMESPACE}", key: "${KEY}") { id value }
      idx: metafield(namespace: "${NAMESPACE}", key: "${INDEX_KEY}") { value }
      st: metafield(namespace: "${NAMESPACE}", key: "${STATUS_KEY}") { value }
    }
  }`;

function normaliseIndex(raw, hasMain) {
  const index = raw && Array.isArray(raw.list) ? { editing: String(raw.editing || "1"), list: raw.list.filter((q) => q && q.id) } : { editing: "1", list: [] };
  if (hasMain && !index.list.some((q) => q.id === "1")) index.list.unshift({ id: "1", name: "Quiz 1", createdAt: null });
  index.list.sort((a, b) => Number(a.id) - Number(b.id));
  if (index.editing !== "1" && !index.list.some((q) => q.id === index.editing)) index.editing = index.list[0]?.id || "1";
  return index;
}

/* 1.0 starts clean (decided 2026-10-06). A quiz saved by 0.9 has no simple
   setup inside (no config.simple): its names and "What's included" lists are
   the old template's placeholders, not the store's products. The first time
   1.0 reads a store, every such quiz is moved to an admin-only backup
   (legacy_<key>) and removed, and the index records migrated: true so this
   runs once. Quizzes made in 1.0 (simple, or switched to the rules editor)
   always carry config.simple and are kept. */
async function retireLegacy(admin, shopId, rawIndex) {
  const all = await readAllQuizzes(admin);
  const retired = [];
  for (const [id, cfg] of Object.entries(all)) {
    if (!cfg || cfg.simple) continue;
    const key = slotKey(id);
    await setJson(admin, shopId, `legacy_${key}`, { retiredAt: new Date().toISOString(), config: cfg });
    await deleteConfig(admin, shopId, key);
    retired.push(id);
  }
  const prev = rawIndex && Array.isArray(rawIndex.list) ? rawIndex.list : [];
  const list = prev.filter((q) => q && !retired.includes(String(q.id)) && all[q.id]);
  const editing = list.some((q) => q.id === String(rawIndex?.editing)) ? String(rawIndex.editing) : list[0]?.id || "1";
  await saveIndex(admin, shopId, { editing, list, migrated: true });
  if (retired.length) console.log("[migrate] retired 0.9 quizzes", retired.join(","));
}

/* The quiz being edited (or `quiz` when given), plus the index and status. */
export async function readConfig(admin, { quiz } = {}, retry = true) {
  const res = await admin.graphql(SHOP_QUERY);
  const { data } = await res.json();
  const shop = data.shop;
  const rawIndex = parse(shop.idx?.value);
  if (retry && !rawIndex?.migrated) {
    await retireLegacy(admin, shop.id, rawIndex);
    return readConfig(admin, { quiz }, false);
  }
  const index = normaliseIndex(rawIndex, !!shop.metafield?.value);
  const status = parse(shop.st?.value) || null;
  const editing = String(quiz || index.editing || "1");
  let mf = shop.metafield;
  if (editing !== "1") {
    const r2 = await admin.graphql(`#graphql
      query bcfgQuiz($key: String!) { shop { metafield(namespace: "${NAMESPACE}", key: $key) { id value } } }`, { variables: { key: slotKey(editing) } });
    mf = (await r2.json()).data?.shop?.metafield || null;
  }
  let config = parse(mf?.value);
  if (config) {
    // Prices are the store's, so the currency is too (templates default to GBP).
    if (shop.currencyCode) config.cart = { ...(config.cart || {}), currency: shop.currencyCode, useIntl: true };
    config.meta = { ...(config.meta || {}), slot: slotKey(editing) };
  }
  return { shopId: shop.id, domain: shop.myshopifyDomain, config, metafieldId: mf ? mf.id : null, quiz: editing, index, status };
}

/* Create a definition once per key so Liquid can read the value. "Taken" is fine. */
async function ensureDefinition(admin, key, name, storefront = true) {
  const res = await admin.graphql(`#graphql
    mutation bcfgDefine($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id }
        userErrors { code message }
      }
    }`, {
    variables: {
      definition: {
        name, namespace: NAMESPACE, key, type: "json", ownerType: "SHOP",
        ...(storefront ? { access: { storefront: "PUBLIC_READ" } } : {}),
      },
    },
  });
  const { data } = await res.json();
  const errors = (data?.metafieldDefinitionCreate?.userErrors || []).filter((e) => e.code !== "TAKEN");
  if (errors.length) throw new Error("Metafield definition: " + errors.map((e) => e.message).join("; "));
}

async function setJson(admin, shopId, key, value) {
  const res = await admin.graphql(`#graphql
    mutation bcfgSave($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id updatedAt }
        userErrors { field message }
      }
    }`, {
    variables: { metafields: [{ ownerId: shopId, namespace: NAMESPACE, key, type: "json", value: JSON.stringify(value) }] },
  });
  const { data } = await res.json();
  const errors = data?.metafieldsSet?.userErrors || [];
  if (errors.length) throw new Error("Save failed: " + errors.map((e) => e.message).join("; "));
  return data.metafieldsSet.metafields[0];
}

async function editingSlot(admin) {
  const res = await admin.graphql(`#graphql
    query bcfgEditing { shop { metafield(namespace: "${NAMESPACE}", key: "${INDEX_KEY}") { value } } }`);
  const raw = parse((await res.json()).data?.shop?.metafield?.value);
  return String(raw?.editing || "1");
}

/* Saves to the quiz the config was read from (config.meta.slot), or, for a
   config built fresh on this request, to the quiz being edited. */
export async function saveConfig(admin, shopId, config) {
  const key = config.meta?.slot || slotKey(await editingSlot(admin));
  config.meta = { ...(config.meta || {}), slot: key };
  await ensureDefinition(admin, key, key === KEY ? "Bundle Configurator config" : `Bundle Quiz ${slotOf(key)}`);
  return setJson(admin, shopId, key, config);
}

/* Deletes the quiz being edited (or the given key). */
export async function deleteConfig(admin, shopId, key) {
  const k = key || slotKey(await editingSlot(admin));
  const res = await admin.graphql(`#graphql
    mutation bcfgDelete($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) {
        deletedMetafields { key }
        userErrors { field message }
      }
    }`, { variables: { metafields: [{ ownerId: shopId, namespace: NAMESPACE, key: k }] } });
  const { data } = await res.json();
  const errors = data?.metafieldsDelete?.userErrors || [];
  if (errors.length) throw new Error("Reset failed: " + errors.map((e) => e.message).join("; "));
}

export async function saveIndex(admin, shopId, index) {
  await ensureDefinition(admin, INDEX_KEY, "Bundle Quiz list", false);
  return setJson(admin, shopId, INDEX_KEY, { editing: String(index.editing || "1"), list: index.list, migrated: index.migrated !== false });
}

/* Just the status metafield and the shop id (cheap; used by the app proxy). */
export async function readStatus(admin) {
  const res = await admin.graphql(`#graphql
    query bcfgStatus { shop { id metafield(namespace: "${NAMESPACE}", key: "${STATUS_KEY}") { value } } }`);
  const shop = (await res.json()).data?.shop;
  return { shopId: shop?.id, status: parse(shop?.metafield?.value) };
}

/* Merges into the status metafield (plan facts and the counting stop). */
export async function saveStatus(admin, shopId, current, patch) {
  const next = { ...(current || {}), ...patch };
  await ensureDefinition(admin, STATUS_KEY, "Bundle Quiz status");
  await setJson(admin, shopId, STATUS_KEY, next);
  return next;
}

/* Every quiz's config, for the Quizzes page (type, name, setup state). */
export async function readAllQuizzes(admin) {
  const res = await admin.graphql(`#graphql
    query bcfgAll { shop { metafields(namespace: "${NAMESPACE}", first: 40) { nodes { key value } } } }`);
  const nodes = (await res.json()).data?.shop?.metafields?.nodes || [];
  const out = {};
  for (const n of nodes) {
    if (n.key !== KEY && !/^quiz_\d+$/.test(n.key)) continue;
    out[slotOf(n.key)] = parse(n.value);
  }
  return out;
}

/* Theme editor links. The deep link opens the editor on the home page with our
   block ready to drop into a new Apps section. Shopify's format is
   addAppBlockId={app client id}/{block file name}. The editor refuses it for
   dev-preview extensions and shows a red error, so local dev can turn it off
   with BCFG_DEEP_LINK=0. The pages keep the manual instructions either way. */
export const EXTENSION_UID = "01a0aa66-c9b0-7531-ab18-ec6df9e3c716"; // registered id, seen in the CDN asset path
export function themeEditorUrl(domain) {
  const base = `https://${domain}/admin/themes/current/editor`;
  // eslint-disable-next-line no-undef
  const key = process.env.SHOPIFY_API_KEY;
  // eslint-disable-next-line no-undef
  if (!key || process.env.BCFG_DEEP_LINK === "0") return base;
  return `${base}?template=index&addAppBlockId=${key}/configurator&target=newAppsSection`;
}
