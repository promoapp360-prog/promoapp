import { useCallback, useEffect, useMemo, useState } from "react";
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
  FinanceWorkspace, FinanceLedgerData,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FinanceClientForm, FinanceProjectForm } from "./AdminFinanceForms";
import FinanceLedgerPanel from "./FinanceLedgerPanel";
import FinanceOperations from "./FinanceOperations";
import FinanceSuppliers from "./FinanceSuppliers";
import { adminApi } from "@/lib/admin-api";
import { confirmed } from "./finance-ui";

const currency = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

function money(cents: number) {
  return currency.format(cents / 100);
}

function displayDate(value: Date | string) {
  const iso=value instanceof Date?value.toISOString().slice(0,10):value.slice(0,10);
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("it-IT", { timeZone: "UTC" });
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

function FinanceMovementCard({entry}:{entry:AdminFinanceEntry}) {
  return <article className="rounded-xl border border-amber-200 bg-amber-50/40 p-4" data-testid={`row-finance-entry-${entry.id}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold text-amber-900">Voce dell’archivio precedente · non conteggiata nel nuovo bilancio</p>
        <h5 className="mt-1 break-words text-sm font-semibold">{entry.description}</h5>
        {entry.clientName&&<p className="mt-1 text-xs text-slate-600">{entry.clientName}{entry.projectName?` · ${entry.projectName}`:""}</p>}
        <p className="mt-1 text-xs text-slate-500">{entry.paidAt?"Data riportata": "Scadenza riportata"} {displayDate(entry.paidAt??entry.dueDate)} · da confermare nella sezione riconciliazione</p>
      </div>
      <p className={`shrink-0 font-bold ${entry.direction==="income"?"text-emerald-700":"text-rose-700"}`}>{entry.direction==="income"?"+":"−"}{money(entry.amountCents)}</p>
    </div>
  </article>;
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
  onRefresh,
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
  onRefresh: () => Promise<boolean>;
}) {
  const [workspace,setWorkspace]=useState<FinanceWorkspace>();
  const [ledgerData,setLedgerData]=useState<FinanceLedgerData>();
  const [workspaceError,setWorkspaceError]=useState("");
  const loadWorkspace=useCallback(async()=>{
    try{setWorkspace(await adminApi<FinanceWorkspace>("/finance/workspace"));setWorkspaceError("");}
    catch(err){setWorkspaceError(err instanceof Error?err.message:"Storico non disponibile.");}
  },[]);
  useEffect(()=>{void loadWorkspace();},[data,loadWorkspace]);
  const loadLedger=useCallback(async()=>{
    try{setLedgerData(await adminApi<FinanceLedgerData>(`/finance/ledger?month=${encodeURIComponent(month)}`));}
    catch{setLedgerData(undefined);}
  },[month]);
  useEffect(()=>{void loadLedger();},[loadLedger]);
  const [projectEditor, setProjectEditor] = useState<AdminFinanceProject | "new" | null>(null);
  const [clientEditor, setClientEditor] = useState<AdminFinanceClient | "new" | null>(null);
  const [section, setSection] = useState<"balance" | "clients" | "suppliers" | "receipts">("balance");
  const [filter, setFilter] = useState<"all" | "open" | "income" | "expense">("all");
  const visibleEntries = useMemo(() => (data?.entries ?? []).filter((entry) => {
    const inSelectedMonth = !entry.paidAt || monthInRome(entry.paidAt) === month;
    if (!inSelectedMonth) return false;
    if (filter === "open") return !entry.paidAt;
    if (filter === "income" || filter === "expense") return entry.direction === filter;
    return true;
  }), [data?.entries, filter, month]);
  const projectsWithoutClient = data?.projects.filter((project) => !project.clientId) ?? [];
  const outstandingByClient = useMemo(() => new Map((ledgerData?.clientBalances??[]).map(item=>[item.clientId,item.receivableCents])),[ledgerData?.clientBalances]);
  const projectLedgerTotals=(project:AdminFinanceProject)=>{
    if(!ledgerData)return null;
    const obligations=ledgerData.obligations.filter(item=>item.direction==="income"&&item.projectId===project.id&&item.sourceType!=="recurring");
    const planned=obligations.reduce((sum,item)=>sum+item.amountCents,0);
    return {
      received:obligations.reduce((sum,item)=>sum+item.allocatedCents,0),
      outstanding:obligations.reduce((sum,item)=>sum+item.remainingCents,0)+Math.max(0,project.totalAmountCents+(project.details?.extraCents??0)-planned),
    };
  };

  const saveProject = (input: FinanceProjectInput | FinanceProjectUpdate, id?: string) =>
    id ? onUpdateProject(id, input as FinanceProjectUpdate) : onCreateProject(input as FinanceProjectInput);

  const renderProject = (project: AdminFinanceProject) => {
    const projectEntries = visibleEntries.filter((entry) => entry.projectId === project.id);
    const allProjectEntries = (data?.entries ?? []).filter((entry) => entry.projectId === project.id);
    const ledgerTotals=projectLedgerTotals(project);
    return (
      <article key={project.id} className={`rounded-xl border p-4 ${project.active ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50 opacity-75"}`} data-testid={`card-finance-project-${project.id}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-600">{project.clientName}</p>
            <h5 className="break-words font-semibold">{project.name}</h5>
            {project.clientId === null && <p className="text-xs text-slate-500">Cliente non associato · {project.clientName}</p>}
            {!project.active && <p className="mt-1 text-xs text-slate-500">Archiviato</p>}
          </div>
          <p className="shrink-0 text-sm font-bold">{project.details?.amountKnown?money(project.totalAmountCents+(project.details.extraCents??0)):"Importo da definire"}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <p className="text-slate-500">Incassato <strong className="text-emerald-700">{ledgerTotals?money(ledgerTotals.received):"—"}</strong></p>
          <p className="text-slate-500">Da incassare <strong className="text-amber-700">{ledgerTotals?money(ledgerTotals.outstanding):"—"}</strong></p>
        </div>
        <p className="mt-2 text-xs text-slate-500">Commerciale: {{contact:"Contatto",demo:"Demo",quote:"Preventivo",confirmed:"Confermato"}[project.details?.commercialState??"contact"]} · Operativo: {{not_started:"Non iniziato",working:"In lavorazione",delivered:"Consegnato"}[project.details?.operationalState??"not_started"]}</p>
        {!confirmed(project)&&<p className="mt-1 text-xs text-amber-800">Non è una vendita confermata né un credito esigibile.</p>}
        {project.details?.creditReview&&<p className="mt-1 text-xs text-amber-800">Residuo da verificare · solleciti bloccati</p>}
        {project.details?.reportedReceivedCents!=null&&<p className="mt-2 text-xs text-amber-800">Incassato comunicato: {money(project.details.reportedReceivedCents)} · {ledgerTotals?`differenza rispetto agli incassi confermati: ${money(project.details.reportedReceivedCents-ledgerTotals.received)}`:"in attesa di verifica nel nuovo bilancio"}.</p>}
        {project.details?.reconciliationNotes&&<p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{project.details.reconciliationNotes}</p>}
        {project.details?.amountKnown&&confirmed(project)&&<p className="mt-2 text-xs text-slate-500">Extra inclusi: {money(project.details.extraCents??0)} · spese e pagamenti effettivi sono nel nuovo bilancio.</p>}
        {workspace?.recurring.filter(r=>r.projectId===project.id).map(r=><p key={r.id} className="mt-2 text-xs text-indigo-700">Canone collegato: {r.description} · {money(r.amountCents)} / {r.intervalMonths} mesi · {r.state}</p>)}
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
              <FinanceMovementCard key={entry.id} entry={entry}/>
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
          <h2 className="text-xl font-bold">Il lavoro e i conti di PromoApp</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Clienti, lavori, pagamenti, canoni, fornitori e spese del gestionale interno. Separato dai dati del sito pubblico.
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

      <nav aria-label="Sezioni del gestionale" className="flex flex-wrap gap-2">
        {([["balance","Panoramica e bilancio"],["clients","Clienti e lavori"],["suppliers","Fornitori e spese"],["receipts","Incassi, rate e canoni"]] as const).map(([value,label])=><button key={value} type="button" aria-pressed={section===value} data-testid={`button-finance-section-${value}`} onClick={()=>{setSection(value);setFilter("all");}} className={`rounded-xl px-4 py-2 text-sm font-semibold ${section===value?"bg-indigo-600 text-white":"border bg-white text-slate-600"}`}>{label}</button>)}
      </nav>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={()=>{setSection("clients");setClientEditor("new");}}>Aggiungi cliente</Button>
        <Button size="sm" variant="outline" disabled={busy||!data?.clients.length} onClick={()=>{setSection("clients");setProjectEditor("new");}}>Aggiungi lavoro</Button>
        <Button size="sm" disabled={busy} onClick={()=>setSection("receipts")} data-testid="button-new-finance-entry">Apri incassi, rate e spese</Button>
      </div>
      {(section==="balance"||section==="receipts"||section==="suppliers")&&<FinanceLedgerPanel
        month={month} clients={data?.clients??[]} projects={data?.projects??[]} suppliers={workspace?.suppliers??[]} onRefresh={onRefresh}
      />}
      {section==="suppliers"&&<FinanceSuppliers suppliers={workspace?.suppliers??[]} entries={data?.entries??[]} onRefresh={loadWorkspace}/>}
      {workspaceError&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{workspaceError}</p>}

      <section hidden={section!=="clients"} className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Anagrafica clienti">
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
              workspace={workspace}
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
                  <span className="text-slate-500">Da incassare · lavori e canoni</span>
                  <strong className="text-amber-700" data-testid={`text-finance-client-outstanding-${client.id}`}>
                    {ledgerData?money(outstandingByClient.get(client.id) ?? 0):"—"}
                  </strong>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="space-y-5">
        <section hidden={section!=="clients"} className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Contabilità per cliente">
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
                workspace={workspace}
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
                const received = ledgerData?.clientBalances.find(item=>item.clientId===client.id)?.receivedCents;
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
                         <span className="text-slate-500">Incassato <strong className="text-emerald-700">{received==null?"—":money(received)}</strong></span>
                         <span className="text-slate-500">Da incassare <strong className="text-amber-700">{ledgerData?money(outstandingByClient.get(client.id) ?? 0):"—"}</strong></span>
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
                      {visibleEntries.filter(e=>!e.projectId&&e.details?.clientId===client.id).map(entry=><FinanceMovementCard key={entry.id} entry={entry}/>)}
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

      </div>
      {section==="receipts"&&<FinanceOperations data={data} workspace={workspace} onRefresh={async()=>{await onRefresh();await loadWorkspace();}}/>}
    </section>
  );
}
