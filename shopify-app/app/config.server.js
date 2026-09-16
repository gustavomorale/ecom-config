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

const here = path.dirname(fileURLToPath(import.meta.url));
const configsDir = path.resolve(here, "../../configs");

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

/* Deep link into the theme editor with our block ready to drop in. */
export const EXTENSION_UID = "f81dd01f-1a3a-a4a7-f4df-7e289a2c5a3de815813a";
export function themeEditorUrl(domain) {
  return `https://${domain}/admin/themes/current/editor?template=index&addAppBlockId=${EXTENSION_UID}/configurator&target=newAppsSection`;
}
