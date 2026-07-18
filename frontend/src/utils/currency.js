const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  const amount = Number(value);
  return INR_FORMATTER.format(Number.isFinite(amount) ? amount : 0);
}
