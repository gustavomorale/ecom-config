import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate, billingEnabled } from "../shopify.server";

const PROMPT_HOURS = 24;

export const loader = async ({ request }) => {
  const { admin, billing, session, redirect } = await authenticate.admin(request);

  // Subscription gate. The app is on Shopify App Pricing: the plan is defined
  // in the listing and Shopify creates the subscription when the merchant
  // approves it on Shopify's own plan page. The app must not create charges
  // itself (the Billing API refuses, and the reviewer's install returned 500),
  // so this only checks for an active or trialing plan and, when there is none,
  // sends the merchant to that page. Development stores see the plans at no
  // charge. A failure in the check never blocks the UI: the merchant sees the
  // app with a notice rather than an error page.
  //
  // Loop guard: after an uninstall and reinstall Shopify can show the plan as
  // "Current" on its plan page while the installation reports no active
  // subscription, so the page has nothing to approve and its back arrow returns
  // here. The app therefore redirects only when it is opened from the admin (a
  // document request, never a data request made while the merchant works or
  // saves inside the app), and at most once per PROMPT_HOURS (the time is kept in
  // a shop metafield). Otherwise it opens with a banner and a link to the plan
  // page. What Shopify reported is logged for diagnosis (no personal data).
  let planNotice = null, planUrl = null;
  if (billingEnabled) {
    try {
      // Any active subscription for this app counts, test or real, whatever the
      // listing calls the plan.
      const { hasActivePayment } = await billing.check({ isTest: true });
      if (!hasActivePayment) {
        const store = session.shop.replace(/\.myshopify\.com$/, "");
        const res = await admin.graphql(`#graphql
          query bcfgPlan {
            app { handle }
            shop { id prompted: metafield(namespace: "bundle_configurator", key: "plan_prompted_at") { value } }
            currentAppInstallation {
              activeSubscriptions { name status test }
              allSubscriptions(first: 3, reverse: true) { nodes { name status test trialDays createdAt } }
            }
          }`);
        const { data } = await res.json();
        console.log("[billing] no active plan", session.shop, JSON.stringify(data?.currentAppInstallation || null));
        const handle = data?.app?.handle;
        if (handle) planUrl = `https://admin.shopify.com/store/${store}/charges/${handle}/pricing_plans`;
        const last = Date.parse(data?.shop?.prompted?.value || "") || 0;
        const opening = !new URL(request.url).pathname.endsWith(".data");
        if (planUrl && opening && Date.now() - last > PROMPT_HOURS * 60 * 60 * 1000) {
          await admin.graphql(`#graphql
            mutation bcfgPrompted($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { message } } }`, {
            variables: { m: [{ ownerId: data.shop.id, namespace: "bundle_configurator", key: "plan_prompted_at", type: "single_line_text_field", value: new Date().toISOString() }] },
          });
          throw redirect(planUrl, { target: "_top" });
        }
        planNotice = "Shopify has not confirmed a plan for this store yet. Everything works; choose a plan to keep using the app after the trial.";
      }
    } catch (e) {
      if (e instanceof Response) throw e;
      planNotice = "We could not confirm your plan just now. Everything still works; try again later from the Plan card.";
    }
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "", planNotice, planUrl };
};

export default function App() {
  const { apiKey, planNotice, planUrl } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Overview</s-link>
        <s-link href="/app/questions">Questions</s-link>
        <s-link href="/app/rules">Rules</s-link>
        <s-link href="/app/products">Products</s-link>
        <s-link href="/app/look">Look</s-link>
        <s-link href="/app/copy">Copy &amp; cart</s-link>
      </s-app-nav>
      {planNotice ? (
        <s-banner tone="warning">
          {planNotice}
          {planUrl ? <s-button slot="secondary-actions" href={planUrl} target="_top">Choose a plan</s-button> : null}
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
