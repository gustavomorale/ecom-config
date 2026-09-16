/* The five-step rail. One line per step, the current one highlighted, done
   ones marked. Mirrors the mock in demo/harness.js. */
export const STEPS = [
  { n: 1, key: "category", label: "Category", href: "/app" },
  { n: 2, key: "look", label: "Look", href: "/app/look" },
  { n: 3, key: "questions", label: "Questions", href: "/app/questions" },
  { n: 4, key: "products", label: "Products", href: "/app/products" },
  { n: 5, key: "live", label: "Go live", href: "/app/live" },
];

export function SetupRail({ current, done = [] }) {
  return (
    <s-stack direction="inline" gap="small" alignItems="center">
      {STEPS.map((s) => {
        const state = s.key === current ? "current" : done.includes(s.key) ? "done" : "todo";
        const tone = state === "current" ? "info" : state === "done" ? "success" : "neutral";
        return (
          <s-link key={s.key} href={s.href}>
            <s-badge tone={tone}>{`${s.n}. ${s.label}`}</s-badge>
          </s-link>
        );
      })}
    </s-stack>
  );
}

/* Which steps count as done, derived from the config rather than a flag, so
   the rail is always truthful. */
export function doneSteps(config) {
  if (!config) return [];
  const done = ["category"];
  const setup = config.meta?.setup || {};
  if (setup.look) done.push("look");
  if (setup.questions) done.push("questions");
  const products = [...(config.bundles || []), ...Object.values(config.accessories || {})];
  if (products.length && products.every((p) => p.variantId)) done.push("products");
  if (setup.live) done.push("live");
  return done;
}
