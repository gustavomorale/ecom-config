/* Prices in the admin, in the store's own currency. readConfig stamps
   config.cart.currency from the shop, so pages pass that code in. */
export function money(n, code) {
  const v = Number(n);
  if (!isFinite(v)) return "";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: code || "GBP" }).format(v); } catch (e) { return v.toFixed(2); }
}
