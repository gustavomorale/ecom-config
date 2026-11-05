import { verifyWebhook } from "../webhook.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await verifyWebhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can arrive more than once; deleting nothing is fine.
  if (shop) await db.session.deleteMany({ where: { shop } });

  return new Response();
};
