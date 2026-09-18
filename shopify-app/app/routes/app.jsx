import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate, PLAN, billingEnabled, billingIsTest } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, billing, session } = await authenticate.admin(request);

  // Subscription gate. With billing on, a shop without an active or trialing
  // subscription is sent to Shopify's approval page and comes back here.
  // Development stores (ours, and the ones Shopify's reviewers install on) can
  // only accept test charges, so the charge is a test one there and real
  // everywhere else.
  if (billingEnabled) {
    let isTest = billingIsTest;
    if (!isTest) {
      try {
        const res = await admin.graphql(`#graphql
          query bcfgPlan { shop { plan { partnerDevelopment } } }`);
        const { data } = await res.json();
        isTest = !!data?.shop?.plan?.partnerDevelopment;
      } catch (e) { /* fall through to a real charge */ }
    }
    // Shopify requires an absolute return URL. After approving (or declining)
    // the merchant lands back on the app inside their admin.
    const store = session.shop.replace(/\.myshopify\.com$/, "");
    // eslint-disable-next-line no-undef
    const returnUrl = `https://admin.shopify.com/store/${store}/apps/${process.env.SHOPIFY_API_KEY}/app`;
    await billing.require({
      plans: [PLAN],
      isTest,
      onFailure: async () => billing.request({ plan: PLAN, isTest, returnUrl }),
    });
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

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
