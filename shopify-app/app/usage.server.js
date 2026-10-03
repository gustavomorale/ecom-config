/* Completion counts per shop and month (see the Usage model). */
import db from "./db.server";
import { monthKey } from "./plans";

export async function countCompletion(shop, now = new Date()) {
  const month = monthKey(now);
  return db.usage.upsert({
    where: { shop_month: { shop, month } },
    create: { shop, month, completions: 1 },
    update: { completions: { increment: 1 } },
  });
}

export async function completionsThisMonth(shop, now = new Date()) {
  const row = await db.usage.findUnique({ where: { shop_month: { shop, month: monthKey(now) } } });
  return row ? row.completions : 0;
}

export const deleteUsage = (shop) => db.usage.deleteMany({ where: { shop } });
