/* The quiz list moved to Home (1.0): Home is the central place where each
   quiz's card leads into its editor pages. Old links land there. */
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return redirect("/app");
};
