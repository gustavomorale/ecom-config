/* ============================================================
   Plans (1.0), decided 2026-09-28. Plans limit usage, never features: both
   quiz types and everything else are on every plan.

   Defined in the App Store listing on Shopify App Pricing (Partner Dashboard):
     Free      USD 0    50 completions a month, "Powered by CraftFrame" line
     Starter   USD 9    300 completions, 21-day free trial (added 2026-10-03)
     Standard  USD 25   2,000 completions, 21-day free trial
     Growth    USD 79   15,000 completions, 21-day free trial
   The app never creates charges. It reads the installation's active
   subscription and maps it to one of these by name; no subscription is Free.
   Shared by server and browser code (no server imports here).
   ============================================================ */
export const TRIAL_DAYS = 21;

export const PLANS = {
  free: { key: "free", name: "Free", price: 0, limit: 50, attribution: true },
  starter: { key: "starter", name: "Starter", price: 9, limit: 300, attribution: false },
  standard: { key: "standard", name: "Standard", price: 25, limit: 2000, attribution: false },
  growth: { key: "growth", name: "Growth", price: 79, limit: 15000, attribution: false },
};

/* Subscription name as set in the listing -> plan. Unknown paid names count
   as Standard so a renamed plan never drops a paying store to Free. */
export function planFromSubscriptions(subs) {
  const active = (subs || []).filter((s) => s && ["ACTIVE", "ACCEPTED"].includes(String(s.status || "ACTIVE").toUpperCase()));
  if (!active.length) return { ...PLANS.free, trialEndsAt: null };
  const s = active[0];
  const name = String(s.name || "").toLowerCase();
  const plan = name.includes("growth") ? PLANS.growth : name.includes("starter") ? PLANS.starter : name.includes("free") ? PLANS.free : PLANS.standard;
  let trialEndsAt = null;
  if (s.trialDays && s.createdAt) {
    const end = new Date(Date.parse(s.createdAt) + Number(s.trialDays) * 864e5);
    if (end.getTime() > Date.now()) trialEndsAt = end.toISOString();
  }
  return { ...plan, trialEndsAt };
}

export const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);

/* Where a store stands this month. "near" from 80%. Over the limit the quiz
   keeps working (a store is never broken mid-month); the merchant sees the
   upgrade prompt. */
export function usageState(count, plan) {
  const limit = plan?.limit || PLANS.free.limit;
  const pct = Math.min(100, Math.round((count / limit) * 100));
  return { count, limit, pct, near: count >= limit * 0.8 && count < limit, over: count >= limit };
}

/* What the storefront needs to know, kept on the config metafield. */
export const storefrontPlan = (plan) => ({ key: plan.key, attribution: !!plan.attribution });

const LADDER = ["free", "starter", "standard", "growth"];
export const nextPlan = (plan) => PLANS[LADDER[LADDER.indexOf(plan.key) + 1]] || null;
