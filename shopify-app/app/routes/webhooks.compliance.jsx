/* ============================================================
   GDPR / privacy compliance webhooks. Mandatory for any App Store listing.

   What this app stores, so the answers are honest:
   - Per shop: the OAuth session (Prisma) and one shop metafield holding the
     merchant's configuration. No customer data, no order data.
   - Shoppers' answers live only in their own browser (sessionStorage) and,
     if they choose, in a link they copy. Nothing is sent to the app.

   customers/data_request: we hold nothing about the customer; acknowledge.
   customers/redact:       nothing to delete; acknowledge.
   shop/redact:            48 hours after uninstall; drop the shop's sessions.
                           The metafield goes with the app uninstall itself.
   authenticate.webhook verifies the HMAC and rejects anything else with 401.
   ============================================================ */
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      console.log(`[compliance] data request for ${shop}, customer ${payload?.customer?.id ?? "unknown"}: no customer data held`);
      break;
    case "CUSTOMERS_REDACT":
      console.log(`[compliance] customer redact for ${shop}, customer ${payload?.customer?.id ?? "unknown"}: nothing to delete`);
      break;
    case "SHOP_REDACT":
      await db.session.deleteMany({ where: { shop } });
      console.log(`[compliance] shop redact for ${shop}: sessions removed`);
      break;
    default:
      return new Response("Unhandled topic", { status: 404 });
  }
  return new Response();
};
