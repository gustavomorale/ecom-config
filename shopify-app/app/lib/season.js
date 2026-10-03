/* Black Friday to Cyber Monday: the Friday after the fourth Thursday of
   November, this year or next if it has passed. */
export function blackFriday(now = new Date()) {
  const iso = (d) => d.toISOString().slice(0, 10);
  for (const y of [now.getFullYear(), now.getFullYear() + 1]) {
    const nov1 = new Date(Date.UTC(y, 10, 1));
    const firstThu = 1 + ((4 - nov1.getUTCDay() + 7) % 7);
    const fri = new Date(Date.UTC(y, 10, firstThu + 21 + 1));
    const mon = new Date(Date.UTC(y, 10, firstThu + 21 + 4));
    if (mon.getTime() + 864e5 > now.getTime()) {
      const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
      return { start: iso(fri), end: iso(mon), label: `${fmt(fri)} to ${fmt(mon)} ${y}` };
    }
  }
  return { start: "", end: "", label: "" };
}

/* Worth nudging: from 1 October until Cyber Monday, when no code covers it. */
export function blackFridayNudge(promo, now = new Date()) {
  const bf = blackFriday(now);
  if (!bf.start || now.getUTCMonth() < 9 || bf.start.slice(0, 4) !== String(now.getUTCFullYear())) return null;
  const covered = promo && promo.code && promo.pct && (!promo.endsAt || promo.endsAt >= bf.start);
  return covered ? null : bf;
}
