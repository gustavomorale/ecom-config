import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate, billingEnabled } from "../shopify.server";

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
  let planNotice = null;
  if (billingEnabled) {
    try {
      // Any active subscription for this app counts, test or real, whatever the
      // listing calls the plan.
      const { hasActivePayment } = await billing.check({ isTest: true });
      if (!hasActivePayment) {
        const store = session.shop.replace(/\.myshopify\.com$/, "");
        const res = await admin.graphql(`#graphql
          query bcfgHandle { app { handle } }`);
        const { data } = await res.json();
        const handle = data?.app?.handle;
        if (handle) throw redirect(`https://admin.shopify.com/store/${store}/charges/${handle}/pricing_plans`, { target: "_top" });
        planNotice = "Choose a plan from the App Store listing to keep using the app after the trial.";
      }
    } catch (e) {
      if (e instanceof Response) throw e;
      planNotice = "We could not confirm your plan just now. Everything still works; try again later from the Plan card.";
    }
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "", planNotice };
};

export default function App() {
  const { apiKey, planNotice } = useLoaderData();

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
      {planNotice ? <s-banner tone="warning">{planNotice}</s-banner> : null}
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
