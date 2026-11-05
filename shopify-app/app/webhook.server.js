/* ============================================================
   Webhooks about stores that may have uninstalled the app (app/uninstalled and
   the privacy topics). They need no Shopify API access, so they check Shopify's
   signature here instead of using authenticate.webhook, which first tries to
   renew the store's access token. On an uninstalled store that call adds delay
   and can fail, and Shopify gives a webhook about five seconds to answer.
   Anything unsigned, or wrongly signed, gets a 401.
   ============================================================ */
import crypto from "node:crypto";

export async function verifyWebhook(request) {
  if (request.method !== "POST") throw new Response(undefined, { status: 405 });
  const rawBody = await request.text();
  // eslint-disable-next-line no-undef
  const secret = process.env.SHOPIFY_API_SECRET || "";
  const given = Buffer.from(request.headers.get("x-shopify-hmac-sha256") || "", "base64");
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest();
  if (!secret || given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw new Response(undefined, { status: 401 });
  }
  let payload = {};
  try { payload = JSON.parse(rawBody); } catch (e) { /* signed but not JSON: nothing to read */ }
  return {
    shop: request.headers.get("x-shopify-shop-domain") || "",
    // "shop/redact" becomes "SHOP_REDACT", as authenticate.webhook reports it.
    topic: (request.headers.get("x-shopify-topic") || "").toUpperCase().replace(/[/.]/g, "_"),
    payload,
  };
}
