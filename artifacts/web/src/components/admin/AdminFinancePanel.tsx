import { useMemo, useState } from "react";
import type {
  AdminFinanceClient,
  AdminFinanceData,
  AdminFinanceEntry,
  AdminFinanceProject,
  FinanceClientInput,
  FinanceClientUpdate,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FinanceClientForm, FinanceEntryForm, FinanceProjectForm } from "./AdminFinanceForms";

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

function FinanceMovementCard({
  entry,
  today,
  busy,
  onMarkPaid,
  onEdit,
  onDelete,
}: {
  entry: AdminFinanceEntry;
  today: string;
  busy: boolean;
  onMarkPaid: (id: string) => Promise<boolean>;
  onEdit: (entry: AdminFinanceEntry) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const overdue = !entry.paidAt && dateOnly(entry.dueDate) < today;
  const paid = Boolean(entry.paidAt);
  return (
    <article className={`rounded-xl border p-4 ${overdue ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`} data-testid={`row-finance-entry-${entry.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${entry.direction === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {entry.direction === "income" ? "Entrata" : "Spesa"}
            </span>
            <span className="text-xs text-slate-500">{categoryLabels[entry.category]}</span>
            {entry.repeatMonthly && <span className="text-xs text-indigo-600">Mensile</span>}
          </div>
          {entry.description.trim().toLocaleLowerCase("it-IT") !== categoryLabels[entry.category].toLocaleLowerCase("it-IT") && (
            <h5 className="mt-2 break-words text-sm font-semibold">{entry.description}</h5>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {paid ? "Registrato" : "Scadenza"} {displayDate(entry.dueDate)}
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
          onClick={() => onEdit(entry)}
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
                void onDelete(entry.id);
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
}

export default function AdminFinancePanel({
  data,
  month,
  loading,
  busy,
  onMonth,
  onCreateClient,
  onUpdateClient,
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
  onCreateClient: (input: FinanceClientInput) => Promise<boolean>;
  onUpdateClient: (id: string, input: FinanceClientUpdate) => Promise<boolean>;
  onCreateProject: (input: FinanceProjectInput) => Promise<boolean>;
  onUpdateProject: (id: string, input: FinanceProjectUpdate) => Promise<boolean>;
  onCreateEntry: (input: FinanceEntryInput) => Promise<boolean>;
  onUpdateEntry: (id: string, input: FinanceEntryUpdate) => Promise<boolean>;
  onMarkPaid: (id: string) => Promise<boolean>;
  onDeleteEntry: (id: string) => Promise<boolean>;
}) {
  const [projectEditor, setProjectEditor] = useState<AdminFinanceProject | "new" | null>(null);
  const [clientEditor, setClientEditor] = useState<AdminFinanceClient | "new" | null>(null);
  const [entryEditor, setEntryEditor] = useState<AdminFinanceEntry | "new" | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "income" | "expense">("all");
  const summary = data?.summary;
  const today = todayInRome();
  const visibleEntries = useMemo(() => (data?.entries ?? []).filter((entry) => {
    const inSelectedMonth = !entry.paidAt || monthInRome(entry.paidAt) === month;
    if (!inSelectedMonth) return false;
    if (filter === "open") return !entry.paidAt;
    if (filter === "income" || filter === "expense") return entry.direction === filter;
    return true;
  }), [data?.entries, filter, month]);
  const totalBalance = useMemo(() => {
    const entries = data?.entries ?? [];
    return {
      soldCents: (data?.projects ?? []).reduce((sum, project) => sum + project.totalAmountCents, 0),
      spentCents: entries.filter((entry) => entry.direction === "expense" && entry.paidAt)
        .reduce((sum, entry) => sum + entry.amountCents, 0),
      receivedCents: entries.filter((entry) => entry.direction === "income" && entry.paidAt)
        .reduce((sum, entry) => sum + entry.amountCents, 0),
      outstandingCents: entries.filter((entry) => entry.direction === "income" && !entry.paidAt)
        .reduce((sum, entry) => sum + entry.amountCents, 0),
    };
  }, [data?.entries, data?.projects]);
  const standaloneEntries = visibleEntries.filter((entry) => !entry.projectId);
  const projectsWithoutClient = data?.projects.filter((project) => !project.clientId) ?? [];
  const outstandingByClient = useMemo(() => {
    const totals = new Map<string, number>();
    for (const project of data?.projects ?? []) {
      if (project.clientId) {
        totals.set(project.clientId, (totals.get(project.clientId) ?? 0) + project.outstandingCents);
      }
    }
    return totals;
  }, [data?.projects]);

  const saveProject = (input: FinanceProjectInput | FinanceProjectUpdate, id?: string) =>
    id ? onUpdateProject(id, input as FinanceProjectUpdate) : onCreateProject(input as FinanceProjectInput);

  const renderProject = (project: AdminFinanceProject) => {
    const projectEntries = visibleEntries.filter((entry) => entry.projectId === project.id);
    const allProjectEntries = (data?.entries ?? []).filter((entry) => entry.projectId === project.id);
    return (
      <article key={project.id} className={`rounded-xl border p-4 ${project.active ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50 opacity-75"}`} data-testid={`card-finance-project-${project.id}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Lavoro</p>
            <h5 className="break-words font-semibold">{project.name}</h5>
            {project.clientId === null && <p className="text-xs text-slate-500">Cliente non associato · {project.clientName}</p>}
            {!project.active && <p className="mt-1 text-xs text-slate-500">Archiviato</p>}
          </div>
          <p className="shrink-0 text-sm font-bold">{money(project.totalAmountCents)}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <p className="text-slate-500">Incassato <strong className="text-emerald-700">{money(project.receivedCents)}</strong></p>
          <p className="text-slate-500">Da incassare <strong className="text-amber-700">{money(project.outstandingCents)}</strong></p>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-600" data-testid={`text-finance-payment-plan-${project.id}`}>
          {project.paymentType === "single"
            ? "Unica soluzione"
            : project.paymentType === "advance"
              ? `Acconto ${money(project.depositAmountCents ?? 0)} · saldo ${money(project.totalAmountCents - (project.depositAmountCents ?? 0))}`
              : project.installmentCount
                ? `${project.installmentCount} rate indicate`
                : "Pagamento a rate · numero non indicato"}
        </p>
        {project.notes && <p className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-500">{project.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => setProjectEditor(project)} className="text-xs font-semibold text-indigo-700 disabled:opacity-50" data-testid={`button-edit-finance-project-${project.id}`}>
            Modifica lavoro
          </button>
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
        <details className="mt-4 rounded-xl bg-slate-50 p-3" data-testid={`details-finance-project-movements-${project.id}`}>
          <summary className="cursor-pointer text-sm font-semibold">
            Movimenti collegati ({allProjectEntries.length})
          </summary>
          <div className="mt-3 space-y-2">
            {projectEntries.length ? projectEntries.map((entry) => (
              <FinanceMovementCard
                key={entry.id}
                entry={entry}
                today={today}
                busy={busy}
                onMarkPaid={onMarkPaid}
                onEdit={setEntryEditor}
                onDelete={onDeleteEntry}
              />
            )) : (
              <p className="text-xs text-slate-500">
                {allProjectEntries.length ? "Nessun movimento con il mese e il filtro selezionati." : "Nessun movimento ancora collegato a questo lavoro."}
              </p>
            )}
          </div>
        </details>
      </article>
    );
  };

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

      <section aria-label="Bilancio complessivo" className="space-y-3">
        <h3 className="font-semibold">Bilancio complessivo</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Venduto", totalBalance.soldCents, "text-indigo-700", "Somma degli importi concordati"],
            ["Speso", totalBalance.spentCents, "text-rose-700", "Spese registrate come pagate"],
            ["Incassato", totalBalance.receivedCents, "text-emerald-700", "Entrate già incassate"],
            ["Da incassare", totalBalance.outstandingCents, "text-amber-700", "Entrate ancora aperte"],
          ].map(([label, cents, color, description]) => (
            <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${color}`} data-testid={`finance-total-${String(label).toLowerCase().replaceAll(" ", "-")}`}>
                {money(Number(cents))}
              </p>
              <p className="mt-1 text-xs text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Riepilogo del mese" className="space-y-3">
        <h3 className="font-semibold">Riepilogo del mese</h3>
        <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Incassato nel mese", summary?.receivedCents ?? 0, "text-emerald-700"],
          ["Spese pagate nel mese", summary?.expensesCents ?? 0, "text-rose-700"],
          ["Saldo del mese", summary?.balanceCents ?? 0, (summary?.balanceCents ?? 0) < 0 ? "text-rose-700" : "text-indigo-700"],
        ].map(([label, cents, color]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`} data-testid={`finance-summary-${String(label).toLowerCase().replaceAll(" ", "-")}`}>
              {money(Number(cents))}
            </p>
          </article>
        ))}
        </div>
      </section>

      {summary && summary.overdueIncomeCents > 0 && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" data-testid="finance-overdue-reminder">
          <strong>Promemoria:</strong> {money(summary.overdueIncomeCents)} di incassi sono scaduti.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Anagrafica clienti">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Anagrafica clienti</h3>
            <p className="mt-1 text-xs text-slate-500">{data?.clients.length ?? 0} clienti registrati, collegabili ai lavori</p>
          </div>
          <Button size="sm" onClick={() => setClientEditor("new")} disabled={busy} data-testid="button-new-finance-client">
            Nuovo cliente
          </Button>
        </div>
        {clientEditor && (
          <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <h4 className="mb-3 font-semibold">{clientEditor === "new" ? "Registra un cliente" : "Modifica cliente"}</h4>
            <FinanceClientForm
              initial={clientEditor === "new" ? undefined : clientEditor}
              busy={busy}
              onCreate={onCreateClient}
              onUpdate={onUpdateClient}
              onCancel={() => setClientEditor(null)}
            />
          </div>
        )}
        {!data?.clients.length ? (
          <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            Nessun cliente registrato. Crea la prima anagrafica prima di aggiungere un lavoro.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.clients.map((client) => (
              <article key={client.id} className="rounded-xl border border-slate-200 p-4" data-testid={`card-finance-client-${client.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold">{client.name}</h4>
                    {client.companyName && <p className="text-sm text-slate-500">{client.companyName}</p>}
                  </div>
                  <button type="button" disabled={busy} onClick={() => setClientEditor(client)} className="text-xs font-semibold text-indigo-700 disabled:opacity-50" data-testid={`button-edit-finance-client-${client.id}`}>
                    Modifica
                  </button>
                </div>
                {client.email && <p className="mt-2 break-all text-xs text-slate-600">{client.email}</p>}
                {client.phone && <p className="mt-1 text-xs text-slate-600">{client.phone}</p>}
                {client.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-500">{client.notes}</p>}
                <p className="mt-3 flex justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                  <span className="text-slate-500">Da incassare sui lavori</span>
                  <strong className="text-amber-700" data-testid={`text-finance-client-outstanding-${client.id}`}>
                    {money(outstandingByClient.get(client.id) ?? 0)}
                  </strong>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Contabilità per cliente">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Contabilità per cliente</h3>
              <p className="mt-1 text-xs text-slate-500">
                Lavori e movimenti collegati sono raggruppati sotto il rispettivo cliente.
              </p>
            </div>
            <Button size="sm" onClick={() => setProjectEditor("new")} disabled={busy || !data?.clients.length} title={!data?.clients.length ? "Aggiungi prima un cliente" : undefined} data-testid="button-new-finance-project">
              Nuovo lavoro
            </Button>
          </div>

          {projectEditor && (
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <h4 className="mb-3 font-semibold">{projectEditor === "new" ? "Registra un lavoro" : "Modifica lavoro"}</h4>
              <FinanceProjectForm
                clients={data?.clients ?? []}
                initial={projectEditor === "new" ? undefined : projectEditor}
                busy={busy}
                onSave={saveProject}
                onCancel={() => setProjectEditor(null)}
              />
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2" aria-label="Filtra movimenti per tipo">
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
          ) : !data?.clients.length && !projectsWithoutClient.length ? (
            <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              Registra un cliente, poi aggiungi i suoi lavori, incassi e spese.
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.clients ?? []).map((client) => {
                const clientProjects = (data?.projects ?? []).filter((project) => project.clientId === client.id);
                const received = clientProjects.reduce((sum, project) => sum + project.receivedCents, 0);
                return (
                  <details key={client.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid={`ledger-client-${client.id}`}>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-4 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Cliente</p>
                        <h4 className="break-words font-semibold">{client.companyName || client.name}</h4>
                        {client.companyName && client.name !== client.companyName && <p className="text-xs text-slate-500">Referente: {client.name}</p>}
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                        <span className="text-slate-500">{clientProjects.length} {clientProjects.length === 1 ? "lavoro" : "lavori"}</span>
                        <span className="text-slate-500">Incassato <strong className="text-emerald-700">{money(received)}</strong></span>
                        <span className="text-slate-500">Da incassare <strong className="text-amber-700">{money(outstandingByClient.get(client.id) ?? 0)}</strong></span>
                        <span className="font-semibold text-indigo-600">Dettagli cliente</span>
                      </div>
                    </summary>
                    <div className="space-y-4 border-t border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="text-xs text-slate-500">
                          {client.email && <p>{client.email}</p>}
                          {client.phone && <p>{client.phone}</p>}
                          {client.notes && <p className="mt-1 whitespace-pre-wrap">{client.notes}</p>}
                        </div>
                        <button type="button" disabled={busy} onClick={() => setClientEditor(client)} className="text-xs font-semibold text-indigo-700 disabled:opacity-50" data-testid={`button-edit-finance-client-${client.id}`}>
                          Modifica cliente
                        </button>
                      </div>
                      {clientProjects.length ? (
                        <div className="space-y-3">{clientProjects.map(renderProject)}</div>
                      ) : (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nessun lavoro registrato per questo cliente.</p>
                      )}
                    </div>
                  </details>
                );
              })}
              {projectsWithoutClient.length > 0 && (
                <details className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50" data-testid="ledger-unassigned-projects">
                  <summary className="cursor-pointer list-none p-4 font-semibold">Lavori senza cliente associato ({projectsWithoutClient.length})</summary>
                  <div className="space-y-3 border-t border-slate-200 p-4">{projectsWithoutClient.map(renderProject)}</div>
                </details>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Movimenti generali">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Movimenti generali</h3>
              <p className="mt-1 text-xs text-slate-500">
                Qui trovi solo incassi e spese non collegati a un lavoro. I movimenti dei lavori sono dentro il cliente.
              </p>
            </div>
            <Button size="sm" onClick={() => setEntryEditor("new")} disabled={busy} data-testid="button-new-finance-entry">
              Nuovo movimento
            </Button>
          </div>

          {entryEditor && (
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <h4 className="mb-3 font-semibold">{entryEditor === "new" ? "Registra una scadenza o una spesa" : "Modifica movimento"}</h4>
              <p className="mb-3 text-xs text-slate-500">Collegando il movimento a un lavoro, verrà mostrato nella contabilità del relativo cliente.</p>
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

          {loading && !data ? (
            <p role="status" className="py-6 text-center text-sm text-slate-500">Caricamento contabilità…</p>
          ) : !standaloneEntries.length ? (
            <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              {data?.entries.length
                ? "Non ci sono movimenti generali da mostrare; le voci collegate ai lavori sono nei rispettivi clienti."
                : "Nessun movimento generale registrato."}
            </div>
          ) : (
            <div className="space-y-3">
              {standaloneEntries.map((entry) => (
                <FinanceMovementCard
                  key={entry.id}
                  entry={entry}
                  today={today}
                  busy={busy}
                  onMarkPaid={onMarkPaid}
                  onEdit={setEntryEditor}
                  onDelete={onDeleteEntry}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
