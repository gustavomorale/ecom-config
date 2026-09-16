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
  ];
  for (const rel of files) {
    const src = fs.readFileSync(path.join(configsDir, rel), "utf8");
    vm.runInContext(src, context, { filename: rel });
  }
  registry = sandbox.window.BCFG_CATEGORIES || [];
  return registry;
}

/* Emoji in the registry are HTML entities (the demo renders innerHTML). */
export function decodeEntities(s) {
  return String(s || "").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)));
}

export function listCategories() {
  return loadRegistry().map((c) => ({
    id: c.id,
    label: c.label,
    icon: decodeEntities(c.icon),
    blurb: c.blurb,
    scene: c.scene,
  }));
}

export function buildCategory(id) {
  const cat = loadRegistry().find((c) => c.id === id);
  if (!cat) throw new Error(`Unknown category: ${id}`);
  const cfg = cat.build();
  cfg.meta = { category: cat.id, createdAt: new Date().toISOString(), engine: "1.2" };
  return cfg;
}

/* ---------- metafield I/O ---------- */
const SHOP_QUERY = `#graphql
  query bcfgShop {
    shop {
      id
      myshopifyDomain
      metafield(namespace: "${NAMESPACE}", key: "${KEY}") { id value }
    }
  }`;

export async function readConfig(admin) {
  const res = await admin.graphql(SHOP_QUERY);
  const { data } = await res.json();
  const shop = data.shop;
  let config = null;
  if (shop.metafield && shop.metafield.value) {
    try { config = JSON.parse(shop.metafield.value); } catch (e) { config = null; }
  }
  return { shopId: shop.id, domain: shop.myshopifyDomain, config, metafieldId: shop.metafield ? shop.metafield.id : null };
}

/* Create the definition once so Liquid can read the value. "Taken" is fine. */
async function ensureDefinition(admin) {
  const res = await admin.graphql(`#graphql
    mutation bcfgDefine($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id }
        userErrors { code message }
      }
    }`, {
    variables: {
      definition: {
        name: "Bundle Configurator config",
        namespace: NAMESPACE,
        key: KEY,
        type: "json",
        ownerType: "SHOP",
        access: { storefront: "PUBLIC_READ" },
      },
    },
  });
  const { data } = await res.json();
  const errors = (data?.metafieldDefinitionCreate?.userErrors || []).filter((e) => e.code !== "TAKEN");
  if (errors.length) throw new Error("Metafield definition: " + errors.map((e) => e.message).join("; "));
}

export async function saveConfig(admin, shopId, config) {
  await ensureDefinition(admin);
  const res = await admin.graphql(`#graphql
    mutation bcfgSave($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id updatedAt }
        userErrors { field message }
      }
    }`, {
    variables: {
      metafields: [{ ownerId: shopId, namespace: NAMESPACE, key: KEY, type: "json", value: JSON.stringify(config) }],
    },
  });
  const { data } = await res.json();
  const errors = data?.metafieldsSet?.userErrors || [];
  if (errors.length) throw new Error("Save failed: " + errors.map((e) => e.message).join("; "));
  return data.metafieldsSet.metafields[0];
}

export async function deleteConfig(admin, shopId) {
  const res = await admin.graphql(`#graphql
    mutation bcfgDelete($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) {
        deletedMetafields { key }
        userErrors { field message }
      }
    }`, { variables: { metafields: [{ ownerId: shopId, namespace: NAMESPACE, key: KEY }] } });
  const { data } = await res.json();
  const errors = data?.metafieldsDelete?.userErrors || [];
  if (errors.length) throw new Error("Reset failed: " + errors.map((e) => e.message).join("; "));
}

/* Theme editor links. The deep link drops our block straight in, but the
   editor refuses it for dev-preview extensions and shows a red error, so the
   plain editor is used until the app is deployed (BCFG_DEEP_LINK=1). */
export const EXTENSION_UID = "01a0aa66-c9b0-7531-ab18-ec6df9e3c716"; // registered id, seen in the CDN asset path
export function themeEditorUrl(domain) {
  const base = `https://${domain}/admin/themes/current/editor`;
  // eslint-disable-next-line no-undef
  if (process.env.BCFG_DEEP_LINK === "1") return `${base}?template=index&addAppBlockId=${EXTENSION_UID}/configurator&target=newAppsSection`;
  return base;
}
