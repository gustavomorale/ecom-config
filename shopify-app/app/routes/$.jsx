/* Any address the app does not have. Shopify sometimes sends merchants to one:
   after approving a plan it opens the app at the plan's "welcome link" from the
   Partner Dashboard (2026-10-06 the Starter plan returned to "/starter?…" and got
   a 404). Inside the admin (the request carries shop, host or embedded) hand
   over to Home with the same query, so authentication still works. Opened
   directly, a plain 404. */
import { redirect } from "react-router";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop") || url.searchParams.get("host") || url.searchParams.get("embedded")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  throw new Response("Not found", { status: 404 });
};

export default function NotFound() {
  return null;
}
