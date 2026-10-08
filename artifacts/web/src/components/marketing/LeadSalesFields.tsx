import { useEffect, useId, useState } from "react";
import type { CommercialLead } from "@workspace/api-client-react";
import { euro, parseEuros } from "../../lib/lead-sales";
type Amounts = { quoteAmountCents: number | null; saleAmountCents: number | null };
const inputValue = (cents: number | null | undefined) => cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
export default function LeadSalesFields({ lead, busy, save }: { lead: CommercialLead; busy: boolean; save: (amounts: Amounts) => Promise<void> }) {
  const id = useId();
  const [quote, setQuote] = useState(inputValue(lead.quoteAmountCents)), [sale, setSale] = useState(inputValue(lead.saleAmountCents));
  const [error, setError] = useState("");
  useEffect(() => { setQuote(inputValue(lead.quoteAmountCents)); setSale(inputValue(lead.saleAmountCents)); setError(""); }, [lead.quoteAmountCents, lead.saleAmountCents]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try { await save({ quoteAmountCents: parseEuros(quote), saleAmountCents: parseEuros(sale) }); }
    catch (error) { setError(error instanceof Error ? error.message : "Salvataggio non riuscito."); }
  }
  return <form onSubmit={submit} className="border-t pt-3 space-y-2">
    <p className="text-sm font-bold">Valori commerciali riservati · EUR, IVA esclusa</p>
    <label className="block text-sm" htmlFor={`${id}-quote`}>Importo preventivo
      <input id={`${id}-quote`} inputMode="decimal" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Non registrato"
        className="border rounded-xl px-3 py-2 block w-full mt-1" disabled={busy} /></label>
    <label className="block text-sm" htmlFor={`${id}-sale`}>Valore vendita conclusa
      <input id={`${id}-sale`} inputMode="decimal" value={sale} onChange={(e) => setSale(e.target.value)} placeholder="Non registrato"
        className="border rounded-xl px-3 py-2 block w-full mt-1" disabled={busy} /></label>
    <p className="text-xs text-gray-500">Salvati: preventivo {euro(lead.quoteAmountCents)} · vendita {euro(lead.saleAmountCents)}. Lascia vuoto per rimuovere il valore. Nessun pagamento viene avviato.</p>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    <button disabled={busy} className="border border-indigo-700 text-indigo-700 rounded-xl px-3 py-2 text-sm">Salva importi</button>
  </form>;
}
