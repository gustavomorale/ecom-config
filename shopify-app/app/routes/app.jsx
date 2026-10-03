import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { readConfig, isSimple } from "../config.server";
import { readPlan, syncPlan } from "../plan.server";
import { completionsThisMonth } from "../usage.server";
import { usageState, nextPlan } from "../plans";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // Plan and usage. The plans live in the listing (Shopify App Pricing): the
  // merchant picks Free, Standard or Growth on Shopify's own page at install,
  // and no subscription means Free. So there is nothing to force here and no
  // redirect: the app reads the plan, keeps the storefront's copy in step (the
  // Free plan's attribution line) and shows how much of the month's
  // completions are used. A failure never blocks the UI.
  let plan = null, planUrl = null, usage = null, simpleNav = true, quiz = null;
  try {
    const known = await readConfig(admin);
    simpleNav = !known.config || isSimple(known.config);
    const entry = known.index.list.find((q) => q.id === known.quiz);
    quiz = { id: known.quiz, name: entry?.name || `Quiz ${known.quiz}`, count: known.index.list.length };
    ({ plan, planUrl } = await readPlan(admin, session.shop));
    await syncPlan(admin, plan, known);
    usage = usageState(await completionsThisMonth(session.shop), plan);
  } catch (e) {
    console.log("[billing] plan check failed", session.shop, e.message);
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "", plan, planUrl, usage, simpleNav, quiz };
};

export default function App() {
  const { apiKey, plan, planUrl, usage, simpleNav } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      {simpleNav ? (
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          <s-link href="/app/start">Products</s-link>
          <s-link href="/app/grid">Questions</s-link>
          <s-link href="/app/look">Look</s-link>
          <s-link href="/app/copy">Copy &amp; cart</s-link>
        </s-app-nav>
      ) : (
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          <s-link href="/app/questions">Questions</s-link>
          <s-link href="/app/rules">Rules</s-link>
          <s-link href="/app/products">Products</s-link>
          <s-link href="/app/look">Look</s-link>
          <s-link href="/app/copy">Copy &amp; cart</s-link>
        </s-app-nav>
      )}
      {usage && plan && plan.attribution && usage.half ? (
        <s-banner tone="info">
          {`You have used ${usage.count} of the ${usage.limit} free quiz completions this month, half your allowance.`}
          {nextPlan(plan) ? ` ${nextPlan(plan).name} includes ${nextPlan(plan).limit.toLocaleString("en-GB")} a month and removes the Powered by CraftFrame line.` : ""}
          {planUrl && nextPlan(plan) ? <s-button slot="secondary-actions" href={planUrl} target="_top">{`See ${nextPlan(plan).name}`}</s-button> : null}
        </s-banner>
      ) : null}
      {usage && plan && (usage.over || usage.near) ? (
        <s-banner tone={usage.over ? "warning" : "info"}>
          {`You have used ${usage.count.toLocaleString("en-GB")} of ${usage.limit.toLocaleString("en-GB")} quiz completions this month on the ${plan.name} plan.`}
          {usage.over ? (plan.attribution ? " Your quizzes keep working, but completions are no longer counted until the 1st. Choose a bigger plan to keep counting." : " Your quizzes keep working; choose a bigger plan to stay within your limit.") : " The count starts again on the 1st."}
          {planUrl && nextPlan(plan) ? <s-button slot="secondary-actions" href={planUrl} target="_top">{`See ${nextPlan(plan).name}`}</s-button> : null}
        </s-banner>
      ) : null}
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
