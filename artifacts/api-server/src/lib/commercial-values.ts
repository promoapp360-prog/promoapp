type CommercialEvent = { event: string; at: string; quoteAmountCents?: number | null; saleAmountCents?: number | null };
const amount = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 2147483647 ? value : null;
// Values are private operational records, not payments, invoices or ad conversions.
export function commercialValues(events: CommercialEvent[]) {
  const last = [...events].reverse().find((event) => event.event === "commercial_values");
  return { quoteAmountCents: amount(last?.quoteAmountCents), saleAmountCents: amount(last?.saleAmountCents) };
}
export function recordCommercialValues(events: CommercialEvent[], patch: { quoteAmountCents?: number | null; saleAmountCents?: number | null }) {
  const previous = commercialValues(events);
  const next = {
    quoteAmountCents: patch.quoteAmountCents === undefined ? previous.quoteAmountCents : patch.quoteAmountCents,
    saleAmountCents: patch.saleAmountCents === undefined ? previous.saleAmountCents : patch.saleAmountCents,
  };
  if (next.quoteAmountCents === previous.quoteAmountCents && next.saleAmountCents === previous.saleAmountCents) return events;
  return [...events, { event: "commercial_values", at: new Date().toISOString(), ...next }];
}
