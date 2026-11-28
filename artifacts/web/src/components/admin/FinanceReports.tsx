import { useCallback, useEffect, useState } from "react";
import type { FinanceReportsResponse } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { appPath } from "@/lib/marketing";
import { money } from "./finance-ui";

type PeriodType = "month" | "year";

function todayRome() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dateLabel(value: Date | string) {
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function Metric({ label, value, explanation, testId }: {
  label: string; value: number; explanation: string; testId: string;
}) {
  return <article className="rounded-2xl border bg-white p-4" title={explanation} data-testid={testId}>
    <p className="text-xs font-medium text-slate-500">{label}<span className="ml-1 cursor-help" aria-label={explanation} title={explanation}>ⓘ</span></p>
    <strong className="mt-1 block text-xl text-slate-900">{money(value)}</strong>
  </article>;
}

export default function FinanceReports() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [period, setPeriod] = useState(() => todayRome().slice(0, 7));
  const [report, setReport] = useState<FinanceReportsResponse>();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ periodType, period });
      setReport(await adminApi<FinanceReportsResponse>(`/finance/reports?${query}`));
    } catch (err) {
      setReport(undefined);
      setError(err instanceof Error ? err.message : "Report non disponibile.");
    } finally {
      setLoading(false);
    }
  }, [period, periodType]);
  useEffect(() => { void load(); }, [load]);

  const exportData = async (format: "csv" | "xlsx") => {
    setExporting(true);
    setError("");
    try {
      const response = await fetch(appPath(`/api/admin/finance/export?format=${format}`), {
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw new Error("Esportazione non riuscita. Verifica la sessione e riprova.");
      const url = URL.createObjectURL(await response.blob());
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `promoapp-archivio-commercialista.${format}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Esportazione non riuscita.");
    } finally {
      setExporting(false);
    }
  };

  const totals = report?.totals;
  return <section className="space-y-5" aria-label="Report economici">
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border bg-white p-5">
      <div><h3 className="font-bold">Report economici</h3>
        <p className="mt-1 text-xs text-slate-500">I valori del periodo e i totali storici per cliente sono indicati separatamente.</p></div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          Periodo
          <select className="block h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
            value={periodType} data-testid="select-finance-report-period-type"
            onChange={(event) => {
              const value = event.target.value as PeriodType;
              setPeriodType(value);
              setPeriod(value === "month" ? todayRome().slice(0, 7) : todayRome().slice(0, 4));
            }}>
            <option value="month">Mese</option><option value="year">Anno</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          {periodType === "month" ? "Mese da consultare" : "Anno da consultare"}
          <Input type={periodType === "month" ? "month" : "number"}
            min={periodType === "month" ? "2000-01" : "2000"}
            max={periodType === "month" ? todayRome().slice(0, 7) : todayRome().slice(0, 4)}
            value={period} data-testid="input-finance-report-period"
            onChange={(event) => setPeriod(event.target.value)} />
        </label>
        <Button variant="outline" disabled={loading} data-testid="button-refresh-finance-report" onClick={() => void load()}>Aggiorna</Button>
      </div>
    </div>

    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {loading && !report && <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">Calcolo dei report…</p>}
    {report && totals && <>
      <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-950">
        Periodo selezionato: <strong>{dateLabel(report.startDate)} – {dateLabel(report.endDate)}</strong>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Incassato nel periodo" value={totals.receivedCents}
          explanation="Somma dei movimenti di entrata con data nel periodo, inclusi solo gli incassi storici già riconciliati."
          testId="metric-report-received" />
        <Metric label="Speso nel periodo" value={totals.spentCents}
          explanation="Somma dei movimenti di uscita con data nel periodo."
          testId="metric-report-spent" />
        <Metric label="Saldo del periodo" value={totals.periodBalanceCents}
          explanation="Incassato nel periodo meno speso nel periodo."
          testId="metric-report-period-balance" />
        <Metric label="Saldo cassa alla data finale" value={totals.cashBalanceCents}
          explanation="Saldi iniziali dei conti efficaci alla data finale, più entrate meno uscite registrate fino a quella data."
          testId="metric-report-cash-balance" />
        <Metric label="Venduto nel periodo" value={totals.soldCents}
          explanation="Prezzi dei lavori confermati con data di conferma nel periodo, più canoni di entrata maturati nel periodo."
          testId="metric-report-sold" />
        <Metric label="Ritenute subite · credito" value={totals.withholdingCreditCents}
          explanation="Ritenute dei documenti fiscali non annullati emessi nel periodo; non sono incassi di cassa."
          testId="metric-report-withholding" />
        <Metric label="IVA nei documenti" value={totals.vatCents}
          explanation="IVA indicata nei documenti fiscali non annullati emessi nel periodo."
          testId="metric-report-vat" />
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h4 className="font-bold">Riepilogo per cliente</h4>
            <p className="mt-1 text-xs text-slate-500">Totali storici complessivi, non limitati al periodo selezionato.</p></div>
          <span className="cursor-help text-xs text-slate-500" title="Margine gestionale per cliente = venduto storico meno movimenti di uscita allocati a spese collegate al cliente. Non è utile fiscale.">
            Margine gestionale ⓘ
          </span>
        </div>
        {!report.clients.length ? <p className="text-sm text-slate-500">Nessun cliente in anagrafica.</p> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b text-xs text-slate-500">
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3 text-right" title="Prezzi dei lavori confermati e canoni maturati, su tutta la storia del cliente.">Venduto ⓘ</th>
                <th className="py-2 pr-3 text-right" title="Movimenti di entrata effettivi allocati a obblighi del cliente, su tutta la storia.">Incassato ⓘ</th>
                <th className="py-2 pr-3 text-right" title="Obblighi di entrata del cliente meno le quote coperte da movimenti effettivi.">Da incassare ⓘ</th>
                <th className="py-2 pr-3 text-right" title="Movimenti di uscita allocati a spese collegate al cliente.">Costi diretti ⓘ</th>
                <th className="py-2 text-right" title="Venduto storico meno costi diretti storici; margine gestionale, non fiscale.">Margine ⓘ</th>
              </tr></thead>
              <tbody>{report.clients.map((client) => <tr key={client.clientId} className="border-b last:border-0" data-testid={`row-finance-report-client-${client.clientId}`}>
                <th className="py-3 pr-3 font-medium">{client.clientName}</th>
                <td className="py-3 pr-3 text-right">{money(client.soldCents)}</td>
                <td className="py-3 pr-3 text-right">{money(client.receivedCents)}</td>
                <td className="py-3 pr-3 text-right">{money(client.receivableCents)}</td>
                <td className="py-3 pr-3 text-right">{money(client.directCostsCents)}</td>
                <td className={`py-3 text-right font-semibold ${client.marginCents < 0 ? "text-rose-700" : "text-emerald-700"}`}>{money(client.marginCents)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {([
          ["Spese per categoria", report.expensesByCategory],
          ["Spese per fornitore", report.expensesBySupplier],
        ] as const).map(([title, rows]) => <section key={title} className="rounded-2xl border bg-white p-5">
          <h4 className="font-bold">{title}</h4>
          <p className="mt-1 text-xs text-slate-500">Uscite effettive del periodo; le quote non attribuite sono separate.</p>
          {!rows.length ? <p className="mt-4 text-sm text-slate-500">Nessuna spesa registrata nel periodo.</p> :
            <ul className="mt-3 divide-y">{rows.map((row) => <li key={row.key} title={`Totale di movimenti di uscita effettivi del periodo attribuiti a ${row.label}.`} className="flex justify-between gap-3 py-2 text-sm" data-testid={`row-finance-report-breakdown-${row.key}`}>
              <span>{row.label}</span><strong>{money(row.amountCents)}</strong>
            </li>)}</ul>}
        </section>)}
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
        <div><h4 className="font-bold">Esportazione per il commercialista</h4>
          <p className="mt-1 text-xs text-slate-500">Scarica l’archivio completo: anagrafiche clienti, movimenti contabili e documenti fiscali.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={exporting} data-testid="button-finance-report-export-csv" onClick={() => void exportData("csv")}>Esporta CSV</Button>
          <Button variant="outline" disabled={exporting} data-testid="button-finance-report-export-xlsx" onClick={() => void exportData("xlsx")}>Esporta Excel</Button>
        </div>
      </section>
    </>}
  </section>;
}
