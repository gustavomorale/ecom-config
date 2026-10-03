/* What counts as "connected to a Shopify product". A bundle is connected when
   it has one bundle product (variantId) or, for a gift set built from
   separate products, at least one component with a variant. */
const numeric = (v) => /^\d+$/.test(String(v || ""));

export const hasProduct = (item) =>
  !!(item && (numeric(item.variantId) || (item.components || []).some((c) => c && numeric(c.variantId))));

/* Bundles and add-ons, the things the Products step asks the merchant to connect. */
export const productSlots = (config) => [...(config?.bundles || []), ...Object.values(config?.accessories || {})];

/* Every object that holds a variant copy (price, picture, title): bundles,
   their components and add-ons. Used to refresh those copies. */
export const variantHolders = (config) => [
  ...(config?.simple?.products || []),
  ...(config?.simple?.products || []).flatMap((p) => p.components || []),
  ...(config?.bundles || []),
  ...(config?.bundles || []).flatMap((b) => b.components || []),
  ...Object.values(config?.accessories || {}),
].filter((t) => t && numeric(t.variantId));
