/* ============================================================
   Sample catalogue for a template.
   Generates a Shopify product-import CSV from the merchant's own config
   (one product per bundle and per add-on, with the template's prices and a
   placeholder image), and links imported products back by handle. The app
   never needs write access to products this way.
   ============================================================ */

export const SAMPLE_TAG = "bundle-configurator-sample";
const handleFor = (kind, id) => `bcfg-${kind}-${String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function imageFor(title, accent) {
  const bg = "eef1f7", fg = (accent || "#3d5ee6").replace("#", "");
  return `https://placehold.co/900x900/${bg}/${fg}/png?text=${encodeURIComponent(title)}`;
}

export function sampleCsv(config) {
  const accent = config.brand?.theme?.accent || null;
  const category = config.meta?.category || "bundle";
  const cols = ["Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags", "Published", "Option1 Name", "Option1 Value", "Variant Price", "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Requires Shipping", "Variant Taxable", "Image Src", "Image Alt Text", "Status"];
  const rows = [];
  const add = (kind, id, title, body, price) => {
    rows.push([handleFor(kind, id), title, body, "Sample", "", kind === "bundle" ? "Bundle" : "Add-on",
      `${SAMPLE_TAG}, ${category}`, "TRUE", "Title", "Default Title", Number(price || 0).toFixed(2),
      "continue", "manual", "TRUE", "TRUE", imageFor(title, accent), title, "active"]);
  };
  (config.bundles || []).forEach((b) => {
    const contents = (b.contents || []).map((c) => `<li>${c.qty && c.qty > 1 ? `${c.qty} × ` : ""}${c.name}${c.detail ? ` (${c.detail})` : ""}</li>`).join("");
    add("bundle", b.id, b.title, `<p>${b.subtitle || ""}</p>${contents ? `<ul>${contents}</ul>` : ""}`, b.price);
  });
  Object.entries(config.accessories || {}).forEach(([k, a]) => add("addon", k, a.title || k, "<p>Sample add-on product.</p>", a.price));
  return [cols, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

/* Find imported samples by tag and link them to bundles/add-ons by handle. */
export async function linkSamples(admin, config) {
  const res = await admin.graphql(`#graphql
    query bcfgSamples($q: String!) {
      products(first: 100, query: $q) {
        nodes { id handle title featuredImage { url } variants(first: 1) { nodes { id price } } }
      }
    }`, { variables: { q: `tag:${SAMPLE_TAG}` } });
  const { data } = await res.json();
  const byHandle = new Map((data?.products?.nodes || []).map((p) => [p.handle, p]));
  let linked = 0;
  const apply = (kind, id, target) => {
    const p = byHandle.get(handleFor(kind, id));
    const v = p?.variants?.nodes?.[0];
    if (!p || !v) return;
    target.variantId = String(v.id).split("/").pop();
    target.price = Number(v.price);
    target.image = p.featuredImage?.url || target.image || "";
    target.productTitle = p.title;
    linked++;
  };
  (config.bundles || []).forEach((b) => apply("bundle", b.id, b));
  Object.entries(config.accessories || {}).forEach(([k, a]) => apply("addon", k, a));
  return { linked, found: byHandle.size };
}
