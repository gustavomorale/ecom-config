/* ============================================================
   Server helpers for the products a merchant has linked in setup.
   The app only reads products (read_products); it never creates or edits them.
   ============================================================ */

/* The config keeps a copy of each linked product's price, picture and title so
   the storefront needs no API call. Copies go stale when a merchant edits a
   product; this re-reads them for every linked variant. Returns how many
   changed and how many links point at a variant that no longer exists. */
export async function refreshLinked(admin, config) {
  const targets = [...(config.bundles || []), ...Object.values(config.accessories || {})].filter((t) => /^\d+$/.test(String(t.variantId || "")));
  if (!targets.length) return { checked: 0, changed: 0, missing: 0 };
  const ids = [...new Set(targets.map((t) => `gid://shopify/ProductVariant/${t.variantId}`))];
  const found = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const res = await admin.graphql(`#graphql
      query bcfgRefresh($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant { id title price image { url } product { title featuredImage { url } } }
        }
      }`, { variables: { ids: ids.slice(i, i + 100) } });
    const { data } = await res.json();
    (data?.nodes || []).forEach((v) => { if (v && v.id) found.set(String(v.id).split("/").pop(), v); });
  }
  let changed = 0, missing = 0;
  targets.forEach((t) => {
    const v = found.get(String(t.variantId));
    if (!v) { missing++; return; }
    const image = v.image?.url || v.product?.featuredImage?.url || "";
    const title = v.product.title + (v.title && v.title !== "Default Title" ? ` (${v.title})` : "");
    const price = Number(v.price);
    if (t.image !== image || t.productTitle !== title || Number(t.price) !== price) changed++;
    t.image = image; t.productTitle = title; if (Number.isFinite(price)) t.price = price;
  });
  return { checked: targets.length, changed, missing };
}
