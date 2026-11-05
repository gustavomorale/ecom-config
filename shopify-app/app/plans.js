/* ============================================================
   Plans, revised 2026-11-05. Plans limit usage, never features: both
   quiz types and everything else are on every plan.

   Defined in the App Store listing on Shopify App Pricing (Partner Dashboard).
   Two limits, combined (decided 2026-10-03): completed quizzes a month and the
   number of quizzes a store can run.
     Free      USD 0    1 quiz,   100 completions a month, "Powered by CraftFrame" line
     Starter   USD 9    3 quizzes, 300 completions, 14-day free trial, USD 90 a year
     Standard  USD 25   10 quizzes, 1,000 completions, 14-day free trial, USD 250 a year
     Growth    USD 79   25 quizzes, 5,000 completions, 14-day free trial, USD 790 a year
     Custom    by agreement: a private plan created per store in the Partner
               Dashboard (Shopify App Pricing allows four public plans).
   The app never creates charges. It reads the installation's active
   subscription and maps it to one of these by name; no subscription is Free.
   Shared by server and browser code (no server imports here).
   ============================================================ */
export const TRIAL_DAYS = 14;
export const MAX_QUIZZES = 25;
export const CUSTOM_PLAN_EMAIL = "contact@craftframe.agency";

export const PLANS = {
  free: { key: "free", name: "Free", price: 0, limit: 100, quizzes: 1, attribution: true },
  starter: { key: "starter", name: "Starter", price: 9, yearly: 90, limit: 300, quizzes: 3, attribution: false },
  standard: { key: "standard", name: "Standard", price: 25, yearly: 250, limit: 1000, quizzes: 10, attribution: false },
  growth: { key: "growth", name: "Growth", price: 79, yearly: 790, limit: 5000, quizzes: 25, attribution: false },
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
   "near" from 80%. A Free store's quiz pauses at its limit until the 1st or an
   upgrade (status.stopMonth, see proxy.event.jsx and the theme block). A paying
   store's quiz never pauses; it sees the upgrade prompt. */
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
