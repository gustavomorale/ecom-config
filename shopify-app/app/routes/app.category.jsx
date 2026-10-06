/* The 0.9 category template page. 1.0 starts every quiz from "Your products"
   (/app/start), where the category only suggests questions and wording, so
   this address now leads there. */
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return redirect("/app/start");
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  return redirect("/app/start");
};
