import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

/* ---------- billing ----------
   One plan: 14 days free, then USD 25 a month, charged through the
   merchant's Shopify bill. App charges are always set in USD; Shopify shows
   merchants an approximate local amount. Off during the beta: set
   BCFG_BILLING=on to enforce it. Dev stores only ever see test charges. */
export const PLAN = "Standard";
export const PLAN_PRICE_USD = 25;
export const PLAN_TRIAL_DAYS = 14;
export const billingEnabled = process.env.BCFG_BILLING === "on";
export const billingIsTest = process.env.NODE_ENV !== "production" || process.env.BCFG_BILLING_TEST === "1";

const shopify = shopifyApp({
  billing: {
    [PLAN]: {
      lineItems: [{ amount: PLAN_PRICE_USD, currencyCode: "USD", interval: BillingInterval.Every30Days }],
      trialDays: PLAN_TRIAL_DAYS,
    },
  },
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
