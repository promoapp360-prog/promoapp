import { useCallback, useEffect, useState } from "react";
import type { FinanceIntegrityIssue, FinanceIntegrityResponse } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin-api";
import { money } from "./finance-ui";

type Destination = "clients" | "receipts" | "schedule" | "documents";
const destinationFor = (issue: FinanceIntegrityIssue): { section: Destination; label: string } => {
  switch (issue.category) {
    case "income_without_allocation":
    case "legacy_paid_without_movement":
    case "historical_unreconciled":
      return { section: "receipts", label: "Apri incassi e riconciliazione" };
    case "overdue_recurring":
      return { section: "schedule", label: "Apri scadenzario" };
    case "missing_client_fiscal_data":
      return { section: "documents", label: "Apri documenti fiscali" };
    default:
      return { section: "clients", label: "Apri clienti e lavori" };
  }
};
const formatDate = (value: Date | string | null) => {
  if (!value) return "";
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

export default function FinanceIntegrity({ onNavigate }: {
  onNavigate: (section: Destination) => void;
}) {
  const [data, setData] = useState<FinanceIntegrityResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminApi<FinanceIntegrityResponse>("/finance/verification"));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifica dati non disponibile.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const severity = (value: FinanceIntegrityIssue["severity"]) => ({
    high: { label: "Da controllare", style: "bg-rose-100 text-rose-800" },
    medium: { label: "Da verificare", style: "bg-amber-100 text-amber-900" },
    low: { label: "Informazione", style: "bg-slate-100 text-slate-700" },
  })[value];

  return <section className="space-y-5" aria-label="Verifica dei dati">
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-white p-5">
      <div><h3 className="font-bold">Verifica dati</h3>
        <p className="mt-1 max-w-3xl text-xs text-slate-500">Controlli in sola lettura. Questa pagina non registra, riconcilia o corregge movimenti automaticamente.</p></div>
      <Button variant="outline" disabled={loading} data-testid="button-refresh-finance-integrity" onClick={() => void load()}>Aggiorna controlli</Button>
    </div>

    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {loading && !data && <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">Controllo delle registrazioni…</p>}
    {data && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border bg-white p-4" data-testid="metric-integrity-total">
          <p className="text-xs text-slate-500">Voci da verificare</p><strong className="mt-1 block text-xl">{data.totalIssues}</strong>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4" data-testid="metric-integrity-high">
          <p className="text-xs text-rose-800">Da controllare</p><strong className="mt-1 block text-xl text-rose-900">{data.highCount}</strong>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4" data-testid="metric-integrity-medium">
          <p className="text-xs text-amber-900">Da verificare</p><strong className="mt-1 block text-xl text-amber-950">{data.mediumCount}</strong>
        </article>
        <article className="rounded-2xl border bg-white p-4" data-testid="metric-integrity-low">
          <p className="text-xs text-slate-500">Informazioni</p><strong className="mt-1 block text-xl">{data.lowCount}</strong>
        </article>
      </div>
      {!data.items.length ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        Nessuna anomalia trovata nei controlli disponibili.
      </div> : <div className="space-y-3">{data.items.map((issue) => {
        const badge = severity(issue.severity);
        const destination = destinationFor(issue);
        return <article key={issue.id} className="rounded-2xl border bg-white p-4" data-testid={`row-integrity-${issue.id}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold">{issue.title}</h4>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badge.style}`}>{badge.label}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{issue.detail}</p>
              {(issue.clientName || issue.projectName || issue.date) && <p className="mt-2 text-xs text-slate-500">
                {[issue.clientName, issue.projectName, formatDate(issue.date)].filter(Boolean).join(" · ")}
              </p>}
              {issue.amountCents != null && <p className="mt-1 text-xs font-semibold text-slate-700">{money(issue.amountCents)}</p>}
            </div>
            <Button type="button" variant="outline" size="sm" data-testid={`button-integrity-open-${issue.id}`}
              onClick={() => onNavigate(destination.section)}>{destination.label}</Button>
          </div>
        </article>;
      })}</div>}
      <p className="text-xs text-slate-500">Nel nuovo registro una rata risulta pagata solo quando i movimenti collegati coprono l’importo. Le voci storiche marcate pagate senza movimento sono indicate separatamente e non entrano nei totali.</p>
    </>}
  </section>;
}
