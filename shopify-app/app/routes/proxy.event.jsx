/* ============================================================
   Storefront events, through the Shopify app proxy:
   the store's own /apps/bundle-quiz/event is forwarded here, signed by Shopify.
   One event today: a shopper reached a result ("complete"), with the quiz
   number. It is a count only. The body carries nothing about the shopper and
   their answers are never sent. Plan limits read the store's monthly total.
   A Free store stops counting at its limit: when the total reaches it, the
   status metafield gets stopMonth and the theme block stops sending until the
   1st, so a busy free store costs nothing past its limit.
   ============================================================ */
import { authenticate } from "../shopify.server";
import { countCompletion } from "../usage.server";
import { readStatus, saveStatus } from "../config.server";
import { PLANS, monthKey } from "../plans";

const ok = () => new Response(null, { status: 204 });

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.public.appProxy(request);   // 400 when the signature is wrong
  if (!session) return ok();                                                // not installed: ignore quietly
  let body = {};
  try { body = (await request.json()) || {}; } catch (e) { /* empty body */ }
  if (body.type !== "complete") return ok();
  let total = 0;
  try { total = await countCompletion(session.shop, String(body.quiz || "1")); } catch (e) { console.log("[usage] count failed", session.shop, e.message); return ok(); }
  // Reaching the Free limit: check the plan once (a short window covers
  // simultaneous requests) and tell the block to stop sending this month.
  const limit = PLANS.free.limit;
  if (admin && total >= limit && total <= limit + 5) {
    try {
      const { shopId, status } = await readStatus(admin);
      const month = monthKey();
      if (status?.attribution && status.stopMonth !== month) await saveStatus(admin, shopId, status, { stopMonth: month });
    } catch (e) { console.log("[usage] stop flag failed", session.shop, e.message); }
  }
  return ok();
};

export const loader = () => new Response("Method not allowed", { status: 405 });
