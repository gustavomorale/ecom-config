/* ============================================================
   The store's plan, read from Shopify, and what follows from it.
   App Pricing holds the plans; the app only reads the active subscription.
   BCFG_BILLING=on in production. Elsewhere (local dev, the dev app) the plan
   is Standard unless BCFG_PLAN=free|standard|growth says otherwise, so each
   plan's behaviour can be tried without a real subscription.
   ============================================================ */
import { PLANS, planFromSubscriptions, storefrontPlan } from "./plans";
import { readConfig, saveStatus } from "./config.server";

// eslint-disable-next-line no-undef
const env = process.env;
export const billingEnabled = env.BCFG_BILLING === "on";

export async function readPlan(admin, shop) {
  const store = String(shop || "").replace(/\.myshopify\.com$/, "");
  let handle = null, plan;
  try {
    const res = await admin.graphql(`#graphql
      query bcfgPlan {
        app { handle }
        currentAppInstallation { activeSubscriptions { name status test trialDays createdAt } }
      }`);
    const { data } = await res.json();
    handle = data?.app?.handle || null;
    plan = billingEnabled ? planFromSubscriptions(data?.currentAppInstallation?.activeSubscriptions) : null;
  } catch (e) {
    plan = null;
  }
  if (!plan) plan = { ...(PLANS[env.BCFG_PLAN] || PLANS.standard), trialEndsAt: null };
  // Only the App Store app has plans on Shopify App Pricing; the dev app does
  // not, so its plan page is a 404. No link unless plans are really read.
  const planUrl = billingEnabled && handle && store ? `https://admin.shopify.com/store/${store}/charges/${handle}/pricing_plans` : null;
  return { plan, planUrl };
}

/* Keep the storefront's copy of the plan in step: the status metafield read
   by every quiz block (attribution line, how many quizzes the plan includes).
   Writes only when something changed, and keeps the counting stop. */
export async function syncPlan(admin, plan, known) {
  const { shopId, status } = known || (await readConfig(admin));
  const want = storefrontPlan(plan);
  const have = status || {};
  if (have.plan === want.plan && have.attribution === want.attribution && have.quizzes === want.quizzes) return false;
  // A store that leaves Free stops being capped: drop the counting stop.
  const patch = want.attribution ? want : { ...want, stopMonth: null };
  await saveStatus(admin, shopId, have, patch);
  return true;
}
