/* ============================================================
   Plans (1.0), decided 2026-09-28. Plans limit usage, never features: both
   quiz types and everything else are on every plan.

   Defined in the App Store listing on Shopify App Pricing (Partner Dashboard).
   Two limits, combined (decided 2026-10-03): completed quizzes a month and the
   number of quizzes a store can run.
     Free      USD 0    1 quiz,   50 completions a month, "Powered by CraftFrame" line
     Starter   USD 9    3 quizzes, 300 completions, 21-day free trial
     Standard  USD 25   10 quizzes, 2,000 completions, 21-day free trial
     Growth    USD 79   25 quizzes, 15,000 completions, 21-day free trial
     Custom    by agreement: a private plan created per store in the Partner
               Dashboard (Shopify App Pricing allows four public plans).
   The app never creates charges. It reads the installation's active
   subscription and maps it to one of these by name; no subscription is Free.
   Shared by server and browser code (no server imports here).
   ============================================================ */
export const TRIAL_DAYS = 21;
export const MAX_QUIZZES = 25;
export const CUSTOM_PLAN_EMAIL = "contact@craftframe.agency";

export const PLANS = {
  free: { key: "free", name: "Free", price: 0, limit: 50, quizzes: 1, attribution: true },
  starter: { key: "starter", name: "Starter", price: 9, limit: 300, quizzes: 3, attribution: false },
  standard: { key: "standard", name: "Standard", price: 25, limit: 2000, quizzes: 10, attribution: false },
  growth: { key: "growth", name: "Growth", price: 79, limit: 15000, quizzes: 25, attribution: false },
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

/* Where a store stands this month. "half" from 50% (shown on Free only),
   "near" from 80%. Over the limit the quiz keeps working (a store is never
   broken mid-month); the merchant sees the upgrade prompt. A Free store stops
   sending completions once it reaches its limit (see proxy.event.jsx), so its
   count settles at the limit until the 1st. */
export function usageState(count, plan) {
  const limit = plan?.limit || PLANS.free.limit;
  const pct = Math.min(100, Math.round((count / limit) * 100));
  return { count, limit, pct, half: count >= limit * 0.5 && count < limit * 0.8, near: count >= limit * 0.8 && count < limit, over: count >= limit };
}

/* What the storefront needs to know about the plan, kept on the status
   metafield (one per store, not one per quiz). */
export const storefrontPlan = (plan) => ({ plan: plan.key, attribution: !!plan.attribution, quizzes: plan.quizzes || 1 });

const LADDER = ["free", "starter", "standard", "growth"];
export const nextPlan = (plan) => PLANS[LADDER[LADDER.indexOf(plan.key) + 1]] || null;
