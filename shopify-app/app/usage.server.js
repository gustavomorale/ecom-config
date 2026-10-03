/* Completion counts per shop and month (see the Usage model). */
import db from "./db.server";
import { monthKey } from "./plans";

/* Adds one completion to the store's month (what plan limits read) and to the
   quiz's month (the Quizzes page). Returns the store's new total. */
export async function countCompletion(shop, quiz = "1", now = new Date()) {
  const month = monthKey(now);
  const q = /^\d{1,2}$/.test(String(quiz)) ? String(quiz) : "1";
  const [row] = await db.$transaction([
    db.usage.upsert({
      where: { shop_month: { shop, month } },
      create: { shop, month, completions: 1 },
      update: { completions: { increment: 1 } },
    }),
    db.quizUsage.upsert({
      where: { shop_month_quiz: { shop, month, quiz: q } },
      create: { shop, month, quiz: q, completions: 1 },
      update: { completions: { increment: 1 } },
    }),
  ]);
  return row.completions;
}

/* This month's completions per quiz: { "1": 12, "2": 3 }. */
export async function completionsByQuiz(shop, now = new Date()) {
  const rows = await db.quizUsage.findMany({ where: { shop, month: monthKey(now) } });
  return Object.fromEntries(rows.map((r) => [r.quiz, r.completions]));
}

export async function completionsThisMonth(shop, now = new Date()) {
  const row = await db.usage.findUnique({ where: { shop_month: { shop, month: monthKey(now) } } });
  return row ? row.completions : 0;
}

export const deleteUsage = async (shop) => {
  await db.usage.deleteMany({ where: { shop } });
  await db.quizUsage.deleteMany({ where: { shop } });
};
