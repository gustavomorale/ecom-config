/* ============================================================
   The store's plan, read from Shopify, and what follows from it.
   App Pricing holds the plans; the app only reads the active subscription.
   BCFG_BILLING=on in production. Elsewhere (local dev, the dev app) the plan
   is Standard unless BCFG_PLAN=free|standard|growth says otherwise, so each
   plan's behaviour can be tried without a real subscription.
   ============================================================ */
import { PLANS, planFromSubscriptions, storefrontPlan } from "./plans";
import { readConfig, saveConfig } from "./config.server";

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
  const planUrl = handle && store ? `https://admin.shopify.com/store/${store}/charges/${handle}/pricing_plans` : null;
  return { plan, planUrl };
}

/* Keep the storefront's copy of the plan (attribution line) in step. Writes
   only when it changed. */
export async function syncPlan(admin, plan, known) {
  const { shopId, config } = known || (await readConfig(admin));
  if (!config) return false;
  const want = storefrontPlan(plan);
  const have = config.plan || {};
  if (have.key === want.key && have.attribution === want.attribution) return false;
  config.plan = want;
  await saveConfig(admin, shopId, config);
  return true;
}
