/* ============================================================
   Storefront events, through the Shopify app proxy:
   the store's own /apps/bundle-quiz/event is forwarded here, signed by Shopify.
   One event today: a shopper reached a result ("complete"). It is a count
   only. The body carries nothing about the shopper and their answers are
   never sent. Plan limits read the monthly total.
   ============================================================ */
import { authenticate } from "../shopify.server";
import { countCompletion } from "../usage.server";

const ok = () => new Response(null, { status: 204 });

export const action = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);   // 400 when the signature is wrong
  if (!session) return ok();                                         // not installed: ignore quietly
  let type = "";
  try { type = String((await request.json())?.type || ""); } catch (e) { /* empty body */ }
  if (type === "complete") {
    try { await countCompletion(session.shop); } catch (e) { console.log("[usage] count failed", session.shop, e.message); }
  }
  return ok();
};

export const loader = () => new Response("Method not allowed", { status: 405 });
