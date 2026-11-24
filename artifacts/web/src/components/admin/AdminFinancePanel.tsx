import { useMemo, useState } from "react";
import type {
  AdminFinanceData,
  AdminFinanceEntry,
  AdminFinanceProject,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FinanceEntryForm, FinanceProjectForm } from "./AdminFinanceForms";

const currency = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const categoryLabels: Record<AdminFinanceEntry["category"], string> = {
  deposit: "Acconto",
  balance: "Saldo",
  monthly_fee: "Canone mensile",
  facebook: "Facebook",
  replit: "Replit",
  other: "Altro",
};

function money(cents: number) {
  return currency.format(cents / 100);
}

function dateOnly(value: Date | string) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function displayDate(value: Date | string) {
  const [year, month, day] = dateOnly(value).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("it-IT", { timeZone: "UTC" });
}

function todayInRome() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function monthInRome(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}`;
}

export default function AdminFinancePanel({
  data,
  month,
  loading,
  busy,
  onMonth,
  onCreateProject,
  onUpdateProject,
  onCreateEntry,
  onUpdateEntry,
  onMarkPaid,
  onDeleteEntry,
}: {
  data?: AdminFinanceData;
  month: string;
  loading: boolean;
  busy: boolean;
  onMonth: (month: string) => void;
  onCreateProject: (input: FinanceProjectInput) => Promise<boolean>;
  onUpdateProject: (id: string, input: FinanceProjectUpdate) => Promise<boolean>;
  onCreateEntry: (input: FinanceEntryInput) => Promise<boolean>;
  onUpdateEntry: (id: string, input: FinanceEntryUpdate) => Promise<boolean>;
  onMarkPaid: (id: string) => Promise<boolean>;
  onDeleteEntry: (id: string) => Promise<boolean>;
}) {
  const [projectEditor, setProjectEditor] = useState<AdminFinanceProject | "new" | null>(null);
  const [entryEditor, setEntryEditor] = useState<AdminFinanceEntry | "new" | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "income" | "expense">("all");
  const summary = data?.summary;
  const today = todayInRome();
  const openIncome = useMemo(
    () => (data?.entries ?? []).filter((entry) => entry.direction === "income" && !entry.paidAt),
    [data?.entries],
  );
  const visibleEntries = useMemo(() => (data?.entries ?? []).filter((entry) => {
    const inSelectedMonth = !entry.paidAt || monthInRome(entry.paidAt) === month;
    if (!inSelectedMonth) return false;
    if (filter === "open") return !entry.paidAt;
    if (filter === "income" || filter === "expense") return entry.direction === filter;
    return true;
  }), [data?.entries, filter, month]);

  const saveProject = (input: FinanceProjectInput | FinanceProjectUpdate, id?: string) =>
    id ? onUpdateProject(id, input as FinanceProjectUpdate) : onCreateProject(input as FinanceProjectInput);

  return (
    <section aria-label="Contabilità e bilancio lavori" className="space-y-6" data-testid="panel-admin-finance">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Contabilità lavori</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Prospetto gestionale interno: segna incassi, importi da riscuotere e spese. Non è un documento fiscale.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          Mese
          <Input
            type="month"
            value={month}
            onChange={(event) => onMonth(event.target.value)}
            className="w-40 bg-white"
            data-testid="input-finance-month"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Incassato nel mese", summary?.receivedCents ?? 0, "text-emerald-700"],
          ["Spese pagate nel mese", summary?.expensesCents ?? 0, "text-rose-700"],
          ["Saldo del mese", summary?.balanceCents ?? 0, (summary?.balanceCents ?? 0) < 0 ? "text-rose-700" : "text-indigo-700"],
          ["Da riscuotere", summary?.outstandingCents ?? 0, "text-amber-700"],
        ].map(([label, cents, color]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`} data-testid={`finance-summary-${String(label).toLowerCase().replaceAll(" ", "-")}`}>
              {money(Number(cents))}
            </p>
          </article>
        ))}
      </div>

      {summary && summary.overdueIncomeCents > 0 && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" data-testid="finance-overdue-reminder">
          <strong>Promemoria:</strong> {money(summary.overdueIncomeCents)} di incassi sono scaduti.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Lavori registrati">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Lavori e clienti</h3>
              <p className="mt-1 text-xs text-slate-500">{data?.projects.length ?? 0} lavori registrati</p>
            </div>
            <Button size="sm" onClick={() => setProjectEditor("new")} disabled={busy} data-testid="button-new-finance-project">
              Nuovo lavoro
            </Button>
          </div>

          {projectEditor && (
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <h4 className="mb-3 font-semibold">{projectEditor === "new" ? "Registra un lavoro" : "Modifica lavoro"}</h4>
              <FinanceProjectForm
                initial={projectEditor === "new" ? undefined : projectEditor}
                busy={busy}
                onSave={saveProject}
                onCancel={() => setProjectEditor(null)}
              />
            </div>
          )}

          {!data?.projects.length ? (
            <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              Non ci sono ancora lavori. Aggiungine uno per collegarci acconti, saldi e canoni.
            </div>
          ) : (
            <div className="space-y-3">
              {data.projects.map((project) => (
                <article key={project.id} className={`rounded-xl border p-4 ${project.active ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50 opacity-75"}`} data-testid={`card-finance-project-${project.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words font-semibold">{project.name}</h4>
                      <p className="text-sm text-slate-500">{project.clientName}{!project.active && " · Archiviato"}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{money(project.totalAmountCents)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <p className="text-slate-500">Incassato <strong className="text-emerald-700">{money(project.receivedCents)}</strong></p>
                    <p className="text-slate-500">Da incassare <strong className="text-amber-700">{money(project.outstandingCents)}</strong></p>
                  </div>
                  {project.notes && <p className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-500">{project.notes}</p>}
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" disabled={busy} onClick={() => setProjectEditor(project)} className="text-xs font-semibold text-indigo-700 disabled:opacity-50" data-testid={`button-edit-finance-project-${project.id}`}>Modifica</button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onUpdateProject(project.id, { active: !project.active })}
                      className="text-xs text-slate-600 disabled:opacity-50"
                      data-testid={`button-archive-finance-project-${project.id}`}
                    >
                      {project.active ? "Archivia" : "Riattiva"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Movimenti e scadenze">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Movimenti e promemoria</h3>
              <p className="mt-1 text-xs text-slate-500">
                {openIncome.length} {openIncome.length === 1 ? "incasso da riscuotere" : "incassi da riscuotere"}
                {summary?.unpaidExpensesCents ? ` · ${money(summary.unpaidExpensesCents)} di spese da pagare` : ""}
              </p>
            </div>
            <Button size="sm" onClick={() => setEntryEditor("new")} disabled={busy} data-testid="button-new-finance-entry">
              Nuovo movimento
            </Button>
          </div>

          {entryEditor && (
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <h4 className="mb-3 font-semibold">{entryEditor === "new" ? "Registra una scadenza o una spesa" : "Modifica movimento"}</h4>
              <FinanceEntryForm
                projects={data?.projects ?? []}
                initial={entryEditor === "new" ? undefined : entryEditor}
                busy={busy}
                onCreate={onCreateEntry}
                onUpdate={onUpdateEntry}
                onCancel={() => setEntryEditor(null)}
              />
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {([
              ["all", "Tutti"],
              ["open", "Da fare"],
              ["income", "Incassi"],
              ["expense", "Spese"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                data-testid={`button-finance-filter-${value}`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading && !data ? (
            <p role="status" className="py-6 text-center text-sm text-slate-500">Caricamento contabilità…</p>
          ) : !visibleEntries.length ? (
            <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              {data?.entries.length ? "Non ci sono movimenti da mostrare per questo mese e filtro." : "Nessun movimento registrato: aggiungi acconti, canoni o spese per iniziare."}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleEntries.map((entry) => {
                const overdue = !entry.paidAt && dateOnly(entry.dueDate) < today;
                const paid = Boolean(entry.paidAt);
                return (
                  <article key={entry.id} className={`rounded-xl border p-4 ${overdue ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`} data-testid={`row-finance-entry-${entry.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${entry.direction === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {entry.direction === "income" ? "Entrata" : "Spesa"}
                          </span>
                          <span className="text-xs text-slate-500">{categoryLabels[entry.category]}</span>
                          {entry.repeatMonthly && <span className="text-xs text-indigo-600">Mensile</span>}
                        </div>
                        <h4 className="mt-2 break-words text-sm font-semibold">{entry.description}</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {entry.projectName ? `${entry.clientName} · ${entry.projectName}` : "Voce generale"} · {paid ? "Registrato" : "Scadenza"} {displayDate(entry.dueDate)}
                        </p>
                        {overdue && <p className="mt-1 text-xs font-semibold text-amber-800">Scaduto · promemoria da verificare</p>}
                        {paid && entry.paidAt && <p className="mt-1 text-xs text-emerald-700">Pagato/incassato il {new Date(entry.paidAt).toLocaleDateString("it-IT")}</p>}
                      </div>
                      <p className={`shrink-0 font-bold ${entry.direction === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                        {entry.direction === "income" ? "+" : "−"}{money(entry.amountCents)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {!paid && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onMarkPaid(entry.id)}
                          className="text-xs font-semibold text-emerald-700 disabled:opacity-50"
                          data-testid={`button-mark-finance-paid-${entry.id}`}
                        >
                          {entry.direction === "income" ? "Segna incassato" : "Segna pagato"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEntryEditor(entry)}
                        className="text-xs font-semibold text-indigo-700 disabled:opacity-50"
                        data-testid={`button-edit-finance-entry-${entry.id}`}
                      >
                        Modifica
                      </button>
                      {!paid && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm("Eliminare questa scadenza non ancora pagata? Le registrazioni già pagate non vengono eliminate.")) {
                              void onDeleteEntry(entry.id);
                            }
                          }}
                          className="text-xs text-rose-700 disabled:opacity-50"
                          data-testid={`button-delete-finance-entry-${entry.id}`}
                        >
                          Elimina scadenza
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
