/* The setup rail: the 1.0 simple setup's three steps, the current one
   highlighted, done ones marked. Pages of the rules editor are editors, not
   setup steps, so they show only the version (the 0.9 five-step rail is
   retired with the 0.9 setup). */
import { hasProduct, productSlots } from "../lib/links";

/* Version label shown in the app, and where merchants reach us. */
export const VERSION = "1.0.5";
export const SUPPORT_EMAIL = "contact@craftframe.agency";

/* The 1.0 simple setup: three steps, the look is matched on the way. */
export const SIMPLE_STEPS = [
  { n: 1, key: "products", label: "Your products", href: "/app/start" },
  { n: 2, key: "questions", label: "Questions", href: "/app/grid" },
  { n: 3, key: "live", label: "Go live", href: "/app/live" },
];

export function SetupRail({ current, done = [], simple = false }) {
  return (
    <s-stack direction="inline" gap="small" alignItems="center">
      {(simple ? SIMPLE_STEPS : []).map((s) => {
        const state = s.key === current ? "current" : done.includes(s.key) ? "done" : "todo";
        const tone = state === "current" ? "info" : state === "done" ? "success" : "neutral";
        return (
          <s-link key={s.key} href={s.href}>
            <s-badge tone={tone}>{`${s.n}. ${s.label}`}</s-badge>
          </s-link>
        );
      })}
      <span style={{ marginLeft: "auto" }} />
      <s-text color="subdued">{`Version ${VERSION}`}</s-text>
    </s-stack>
  );
}

/* Which steps count as done, derived from the config rather than a flag, so
   the rail is always truthful. */
export function doneSteps(config) {
  if (!config) return [];
  if (config.simple && config.meta?.mode !== "advanced") {
    const setup = config.meta?.setup || {};
    const out = [];
    if ((config.simple.products || []).length) out.push("products");
    if (setup.questions) out.push("questions");
    if (setup.live) out.push("live");
    return out;
  }
  const done = ["category"];
  const setup = config.meta?.setup || {};
  if (setup.look) done.push("look");
  if (setup.questions) done.push("questions");
  const products = productSlots(config);
  if (products.length && products.every(hasProduct)) done.push("products");
  if (setup.live) done.push("live");
  return done;
}
