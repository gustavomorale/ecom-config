/* Resource route: the sample catalogue for the saved template, as a Shopify
   product-import CSV. Products → Import in the admin publishes them to the
   Online Store, then "Link imported samples" on the Products step wires them
   to the bundles and add-ons by handle. */
import { authenticate } from "../shopify.server";
import { readConfig } from "../config.server";
import { sampleCsv } from "../samples.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config } = await readConfig(admin);
  if (!config) return new Response("No configuration yet", { status: 404 });
  const name = `bundle-quiz-samples-${config.meta?.category || "template"}.csv`;
  return new Response(sampleCsv(config), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
};
