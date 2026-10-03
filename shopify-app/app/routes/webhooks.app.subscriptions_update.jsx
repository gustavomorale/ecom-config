/* A plan was chosen, changed or ended in Shopify. Re-read it and update the
   storefront's copy (the Free plan's "Powered by CraftFrame" line). */
import { authenticate } from "../shopify.server";
import { readPlan, syncPlan } from "../plan.server";

export const action = async ({ request }) => {
  const { shop, admin, payload } = await authenticate.webhook(request);
  console.log(`[billing] subscription update for ${shop}: ${payload?.app_subscription?.name} ${payload?.app_subscription?.status}`);
  if (admin) {
    try {
      const { plan } = await readPlan(admin, shop);
      await syncPlan(admin, plan);
    } catch (e) { console.log("[billing] plan sync failed", shop, e.message); }
  }
  return new Response();
};
