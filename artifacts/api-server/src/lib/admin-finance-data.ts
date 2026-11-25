import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import type {
  AdminFinanceClient, AdminFinanceData, AdminFinanceEntry, AdminFinanceProject,
  FinanceClientInput, FinanceClientUpdate, FinanceEntryInput, FinanceEntryUpdate,
  FinanceProjectInput, FinanceProjectUpdate, FinanceRecurringInput, FinanceWorkspace,
} from "@workspace/api-zod";
import { projectBalance, eligibleIncome, verifiedCash, todayRome } from "./finance-calculations";
import { ObjectStorageService } from "./objectStorage";

// Schema is managed by Drizzle / the platform's development and Publish flows.
// In particular, reads never execute DDL, link people by name or create movements.
export async function ensureFinanceSchema() {
  await pool.query("SELECT customer_id,details FROM admin_finance_projects LIMIT 0");
}
const clientColumns = `id, trim(concat_ws(' ',nome,NULLIF(cognome,''))) AS name,
 company_name AS "companyName", NULLIF(email,'') AS email, NULLIF(telefono,'') AS phone,
 COALESCE(note,'') AS notes, finance_details AS details, created_at AS "createdAt"`;
const projectColumns = `p.id,p.customer_id AS "clientId",
 COALESCE(c.company_name,NULLIF(trim(concat_ws(' ',c.nome,c.cognome)),''),p.client_name) AS "clientName",
 p.name,p.total_amount_cents AS "totalAmountCents",p.payment_type AS "paymentType",
 p.deposit_amount_cents AS "depositAmountCents",p.installment_count AS "installmentCount",
 p.notes,p.active,p.created_at AS "createdAt",
 p.details || jsonb_build_object('legacyProjectId',p.legacy_project_id) AS details`;
const entryColumns = `e.id,e.project_id AS "projectId",p.name AS "projectName",
 COALESCE(c.company_name,c.nome,p.client_name) AS "clientName",e.direction,e.category,e.description,
 e.amount_cents AS "amountCents",e.due_date::text AS "dueDate",e.paid_at AS "paidAt",
 e.repeat_monthly AS "repeatMonthly",e.created_at AS "createdAt",
 e.details || jsonb_build_object('recurringId',e.recurring_id,'accontoId',e.acconto_id) AS details`;
const clean = (v: string | null | undefined) => v?.trim() || null;
export const calendarDate=(v:Date|string)=>v instanceof Date?v.toISOString().slice(0,10):v.slice(0,10);
export const validCalendarDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export const categoryMatchesDirection = (direction: string, category: string) =>
  (direction === "income" ? ["deposit", "balance", "monthly_fee", "other"] :
    ["facebook", "google", "replit", "canva", "hosting", "domains", "software", "administration", "accountant", "consulting", "equipment", "research", "other"]).includes(category);
export function nextMonthlyDate(current: string, anchorDay: number, interval = 1): string {
  const [year, month] = current.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + interval, 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(anchorDay, last)).padStart(2, "0")}`;
}
export async function financeTransaction<T>(work: (q: PoolClient) => Promise<T>): Promise<T> {
  const q = await pool.connect();
  try { await q.query("BEGIN"); const result = await work(q); await q.query("COMMIT"); return result; }
  catch (error) { await q.query("ROLLBACK"); throw error; }
  finally { q.release(); }
}
export async function financeAudit(q: PoolClient, type: string, id: string, before: unknown, after: unknown, reason: string) {
  await q.query(`INSERT INTO admin_finance_audit(id,entity_type,entity_id,actor,reason,before,after)
    VALUES($1,$2,$3,'amministratore',$4,$5,$6)`,
  [randomUUID(), type, id, reason, before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after)]);
}
function invalid(message: string): never { throw Object.assign(new Error(message), { status: 400 }); }
async function verifyClientDetails(q: PoolClient, details: FinanceClientInput["details"], id: string) {
  if(details?.acquisitionDate&&!validCalendarDate(details.acquisitionDate))invalid("Data acquisizione non valida.");
  for (const [key, table] of [["leadId", "commercial_leads"], ["requestId", "richieste_gestionale"]] as const) {
    if (!details?.[key]) continue;
    if (!(await q.query(`SELECT id FROM ${table} WHERE id=$1`, [details[key]])).rowCount) invalid("Il contatto storico selezionato non esiste.");
    if ((await q.query(`SELECT id FROM clienti WHERE id<>$1 AND finance_details->>$2=$3`, [id, key, details[key]])).rowCount) invalid("Contatto già collegato a un altro cliente.");
  }
}
async function getClient(id: string) {
  return (await pool.query<AdminFinanceClient>(`SELECT ${clientColumns} FROM clienti WHERE id=$1`, [id])).rows[0];
}
async function allEntries() {
  return (await pool.query<AdminFinanceEntry>(`SELECT ${entryColumns} FROM admin_finance_entries e
    LEFT JOIN admin_finance_projects p ON p.id=e.project_id
    LEFT JOIN clienti c ON c.id=COALESCE(p.customer_id,(e.details->>'clientId'))
    ORDER BY e.due_date DESC,e.created_at DESC`)).rows.map(e => ({ ...e, dueDate: new Date(`${String(e.dueDate).slice(0,10)}T00:00:00Z`) }));
}
async function allProjects(entries: AdminFinanceEntry[]) {
  const result = await pool.query<AdminFinanceProject>(`SELECT ${projectColumns}
    FROM admin_finance_projects p LEFT JOIN clienti c ON c.id=p.customer_id ORDER BY p.created_at DESC`);
  // Existing public works are visible immediately, without importing or rewriting them.
  const legacy = await pool.query<{ id: string; clientId: string | null; clientName: string; name: string; notes: string; createdAt: Date }>(`
    SELECT p.id,p.cliente_id AS "clientId",COALESCE(c.company_name,c.nome,'Da associare') AS "clientName",
    p.nome AS name,p.descrizione AS notes,p.created_at AS "createdAt"
    FROM progetti_lavori p LEFT JOIN clienti c ON c.id=p.cliente_id
    WHERE NOT EXISTS(SELECT 1 FROM admin_finance_projects f WHERE f.legacy_project_id=p.id OR f.id=p.id)`);
  const projects: AdminFinanceProject[] = [...result.rows, ...legacy.rows.map(p => ({
    ...p, totalAmountCents: 0, paymentType: "single" as const, depositAmountCents: null,
    installmentCount: null, active: true, receivedCents: 0, outstandingCents: 0,
    details: { legacyProjectId: p.id, amountKnown: false, agreementConfirmed: false, creditReview: true },
  }))];
  return projects.map(p => ({ ...p, ...projectBalance(p, entries) }));
}
async function saveProject(id: string, input: FinanceProjectInput | FinanceProjectUpdate, creating: boolean) {
  return financeTransaction(async q => {
    const before = (await q.query(`SELECT * FROM admin_finance_projects WHERE id=$1 FOR UPDATE`, [id])).rows[0];
    const legacy = !before ? (await q.query(`SELECT * FROM progetti_lavori WHERE id=$1`, [id])).rows[0] : null;
    if(creating&&before) invalid("Il lavoro storico ha già una scheda economica: modifica quella esistente.");
    if (!creating && !before && !legacy) return undefined;
    const clientId = input.clientId ?? before?.customer_id ?? legacy?.cliente_id;
    if (!clientId || !(await q.query("SELECT id FROM clienti WHERE id=$1", [clientId])).rowCount) return undefined;
    const details = { creditReview:true, ...(before?.details ?? {}), ...input.details };
    if(details.confirmedDate&&!validCalendarDate(details.confirmedDate)) invalid("Data accordo non valida.");
    const legacyId = input.details?.legacyProjectId ?? before?.legacy_project_id ?? legacy?.id ?? null;
    if(input.details?.legacyProjectId!==undefined && (
      (before?.legacy_project_id && input.details.legacyProjectId!==before.legacy_project_id) ||
      (legacy && input.details.legacyProjectId!==legacy.id)
    ))invalid("Il collegamento al lavoro storico è conservato per preservarne l’identità. Modifica i dati economici senza sostituirlo.");
    if (legacyId) {
      const historical = (await q.query("SELECT id,cliente_id FROM progetti_lavori WHERE id=$1", [legacyId])).rows[0];
      if (!historical || (historical.cliente_id && historical.cliente_id !== clientId)) invalid("Il lavoro storico appartiene a un altro cliente.");
      if ((await q.query("SELECT id FROM admin_finance_projects WHERE legacy_project_id=$1 AND id<>$2", [legacyId,id])).rowCount) invalid("Lavoro storico già collegato.");
    }
    if (details.agreementConfirmed && (details.commercialState !== "confirmed" || !details.amountKnown || !details.confirmedDate)) invalid("Per confermare servono stato confermato, importo noto e data dell’accordo.");
    if (!details.agreementConfirmed) details.creditReview = true;
    if (details.confirmedResidualCents!=null && !details.reconciliationNotes?.trim()) invalid("Per un residuo confermato separatamente servono note di riconciliazione.");
    const total = input.totalAmountCents ?? before?.total_amount_cents ?? 0;
    const paymentType = input.paymentType ?? before?.payment_type ?? "single";
    const deposit = input.depositAmountCents === undefined ? before?.deposit_amount_cents ?? null : input.depositAmountCents;
    const installments = input.installmentCount === undefined ? before?.installment_count ?? null : input.installmentCount;
    if (paymentType === "advance" && (!deposit || deposit > total || installments !== null)) invalid("Acconto non valido.");
    if (paymentType === "single" && (deposit !== null || installments !== null)) invalid("Modalità di pagamento non valida.");
    if (paymentType === "installments" && deposit !== null) invalid("Indicare le singole rate nei movimenti.");
    await q.query(`INSERT INTO admin_finance_projects
      (id,customer_id,legacy_project_id,client_name,name,total_amount_cents,payment_type,deposit_amount_cents,installment_count,notes,active,details)
      VALUES($1,$2,$3,'',$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(id) DO UPDATE SET customer_id=$2,legacy_project_id=$3,name=$4,total_amount_cents=$5,
      payment_type=$6,deposit_amount_cents=$7,installment_count=$8,notes=$9,active=$10,details=$11`,
    [id,clientId,legacyId,input.name?.trim() ?? before?.name ?? legacy?.nome,total,paymentType,deposit,installments,
      input.notes ?? before?.notes ?? legacy?.descrizione ?? "",("active" in input ? input.active : undefined) ?? before?.active ?? true,JSON.stringify(details)]);
    await financeAudit(q,"project",id,before,{ ...input, details },"Aggiornamento accordo e stato lavoro");
    return id;
  });
}
async function saveEntry(id: string, input: FinanceEntryInput | FinanceEntryUpdate, creating: boolean) {
  return financeTransaction(async q => {
    const before = (await q.query(`SELECT * FROM admin_finance_entries WHERE id=$1 FOR UPDATE`, [id])).rows[0];
    if (!creating && !before) return undefined;
    if (before?.details?.cancelled && input.details?.cancelled!==false) invalid("Per correggere un movimento annullato usa il ripristino esplicito.");
    const direction = "direction" in input ? input.direction : before.direction;
    const category = input.category ?? before.category;
    if (!categoryMatchesDirection(direction, category)) invalid("Categoria non compatibile.");
    if (input.repeatMonthly) invalid("Gestisci la ricorrenza nel modulo canoni e costi, non duplicare i movimenti.");
    const details = { ...(before?.details ?? {}), ...input.details };
    if (input.details?.cancelled) invalid("Usa Annulla movimento per conservare la traccia.");
    if (input.details?.recurringId !== undefined && input.details.recurringId !== (before?.recurring_id ?? null)) invalid("Il collegamento alla ricorrenza è gestito dal sistema.");
    const projectId = input.projectId === undefined ? before?.project_id ?? null : input.projectId;
    if (projectId) {
      const p=(await q.query("SELECT customer_id FROM admin_finance_projects WHERE id=$1",[projectId])).rows[0];
      if(!p)invalid("Salva prima i dati economici del lavoro.");
      if(details.clientId&&details.clientId!==p.customer_id)invalid("Il cliente del movimento non coincide con quello del lavoro.");
    }
    if (details.clientId && !(await q.query("SELECT id FROM clienti WHERE id=$1", [details.clientId])).rowCount) invalid("Cliente non valido.");
    let amount = input.amountCents ?? before?.amount_cents;
    if(details.paidDate&&!validCalendarDate(details.paidDate)) invalid("Data di pagamento non valida.");
    const effectivePaid=input.paid ?? Boolean(before?.paid_at);
    if(effectivePaid && details.paidDate && details.paidDate>todayRome()) invalid("Un pagamento futuro non è un incasso effettivamente ricevuto.");
    if(input.paid===true && !details.paidDate && !before?.paid_at && !details.accontoId) invalid("Indica la data effettiva del pagamento.");
    let paidAt = input.paid === undefined ? before?.paid_at ?? null : input.paid ? details.paidDate?`${details.paidDate}T12:00:00+01:00`:before?.paid_at??null : null;
    if (input.details?.paidDate && (input.paid ?? Boolean(before?.paid_at))) paidAt = `${details.paidDate}T12:00:00+01:00`;
    const accontoId = before?.acconto_id ?? details.accontoId ?? null;
    if(before?.acconto_id && input.details?.accontoId!==undefined && input.details.accontoId!==before.acconto_id)invalid("Il riferimento al pagamento originale non può essere sostituito: correggi il lavoro collegato o annulla il movimento.");
    if (accontoId) {
      const payment = (await q.query("SELECT importo_centesimi,paid_at,stato FROM acconti WHERE id=$1", [accontoId])).rows[0];
      if (!payment || payment.stato !== "pagato" || !payment.paid_at || direction !== "income") invalid("Acconto non pagato o senza data effettiva: da verificare.");
      if (amount !== payment.importo_centesimi || input.paid === false) invalid("Gli importi del pagamento storico non si sovrascrivono: annulla il collegamento e riconcilia.");
      amount = payment.importo_centesimi; paidAt = payment.paid_at;
      details.amountConfirmed = true; details.reconciliation = "reconciled";
    }
    if(paidAt && calendarDate(new Date(paidAt))>todayRome())invalid("Un pagamento futuro non è un incasso effettivamente ricevuto.");
    if (details.currency === "USD" && !details.originalCents) invalid("Inserisci l’importo originale in USD.");
    if (details.reconciliation === "reconciled" && (!paidAt || !details.amountConfirmed)) invalid("Riconciliare solo pagamenti effettivi con importo confermato.");
    if (details.documentPath && !/^\/objects\/uploads\/[a-f0-9-]{36}$/.test(details.documentPath)) invalid("Documento non valido.");
    if(details.documentPath && details.documentPath!==before?.details?.documentPath) {
      const file=await new ObjectStorageService().getObjectEntityFile(details.documentPath);
      const [metadata]=await file.getMetadata();
      if(Number(metadata.size)>10485760 || !["application/pdf","image/jpeg","image/png","image/webp","text/csv"].includes(metadata.contentType??""))invalid("Documento non consentito o superiore a 10 MB.");
    }
    await q.query(`INSERT INTO admin_finance_entries
      (id,project_id,direction,category,description,amount_cents,due_date,paid_at,details,acconto_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT(id) DO UPDATE SET project_id=$2,category=$4,description=$5,amount_cents=$6,due_date=$7,paid_at=$8,details=$9,acconto_id=$10`,
    [id,projectId,direction,category,input.description?.trim() ?? before?.description,amount,
      calendarDate(input.dueDate ?? before?.due_date),paidAt,JSON.stringify(details),accontoId]);
    await financeAudit(q,"entry",id,before,{ ...input, details, paidAt },before?.details?.cancelled?"Ripristino esplicito movimento":"Registrazione / rettifica movimento");
    return id;
  });
}
export const adminFinanceData = {
  async list(month: string): Promise<AdminFinanceData> {
    const [clients, entries] = await Promise.all([pool.query<AdminFinanceClient>(`SELECT ${clientColumns} FROM clienti ORDER BY lower(nome)`),allEntries()]);
    const projects = await allProjects(entries);
    const inMonth = (e: AdminFinanceEntry) => e.paidAt && new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit"}).format(new Date(e.paidAt)) === month;
    const sum = (list: AdminFinanceEntry[]) => list.reduce((s,e)=>s+e.amountCents,0);
    const receivedCents = sum(entries.filter(e=>e.direction==="income" && verifiedCash(e) && inMonth(e)));
    const expensesCents = sum(entries.filter(e=>e.direction==="expense" && verifiedCash(e) && inMonth(e)));
    return { clients: clients.rows, projects, entries, summary: {
      month,receivedCents,expensesCents,balanceCents:receivedCents-expensesCents,
      outstandingCents: projects.reduce((s,p)=>s+p.outstandingCents,0) + sum(entries.filter(e=>e.direction==="income" && e.category==="monthly_fee" && !e.paidAt && eligibleIncome(e,projects))),
      overdueIncomeCents: projects.reduce((s,p)=>s+Math.min(p.outstandingCents,sum(entries.filter(e=>e.projectId===p.id&&!e.details?.recurringId&&!e.paidAt&&e.dueDate.toISOString().slice(0,10)<todayRome()&&eligibleIncome(e,projects)))),0)
        + sum(entries.filter(e=>e.details?.recurringId&&e.direction==="income"&&!e.paidAt&&!e.details.cancelled&&e.dueDate.toISOString().slice(0,10)<todayRome()&&e.details.amountConfirmed)),
      unpaidExpensesCents: sum(entries.filter(e=>e.direction==="expense" && !e.paidAt && e.details?.amountConfirmed && !e.details?.cancelled)),
    } };
  },
  async createClient(input: FinanceClientInput) {
    const id = randomUUID();
    const duplicate = await financeTransaction(async q=>{
      await q.query("SELECT pg_advisory_xact_lock(7861401)");
      if ((await q.query(`SELECT id FROM clienti WHERE lower(trim(concat_ws(' ',nome,NULLIF(cognome,''))))=lower(trim($1)) AND lower(COALESCE(company_name,''))=lower($2)`,[input.name,clean(input.companyName)??""])).rowCount) return true;
      await verifyClientDetails(q,input.details,id);
      await q.query(`INSERT INTO clienti(id,nome,company_name,email,telefono,note,finance_details) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [id,input.name.trim(),clean(input.companyName),clean(input.email)??"",clean(input.phone)??"",input.notes??"",JSON.stringify(input.details??{})]);
      await financeAudit(q,"client",id,null,input,"Cliente creato nell’anagrafica esistente"); return false;
    });
    return duplicate ? null : getClient(id);
  },
  async updateClient(id: string, input: FinanceClientUpdate) {
    const saved = await financeTransaction(async q=>{
      await q.query("SELECT pg_advisory_xact_lock(7861401)");
      const current = (await q.query("SELECT * FROM clienti WHERE id=$1 FOR UPDATE",[id])).rows[0]; if (!current) return false;
      const nextName=input.name?.trim()??[current.nome,current.cognome].filter(Boolean).join(" ");
      const nextCompany=input.companyName===undefined?current.company_name:clean(input.companyName);
      if((await q.query(`SELECT id FROM clienti WHERE id<>$1 AND lower(trim(concat_ws(' ',nome,NULLIF(cognome,''))))=lower($2)
        AND lower(COALESCE(company_name,''))=lower($3)`,[id,nextName,nextCompany??""])).rowCount)invalid("Esiste già un cliente con lo stesso nome e la stessa azienda.");
      const details = { ...current.finance_details,...input.details }; await verifyClientDetails(q,details,id);
      await q.query(`UPDATE clienti SET nome=$2,cognome=$3,company_name=$4,email=$5,telefono=$6,note=$7,finance_details=$8 WHERE id=$1`,
        [id,input.name?.trim()??current.nome,input.name===undefined?current.cognome:"",input.companyName===undefined?current.company_name:clean(input.companyName),
          input.email===undefined?current.email:clean(input.email)??"",input.phone===undefined?current.telefono:clean(input.phone)??"",input.notes??current.note,JSON.stringify(details)]);
      await financeAudit(q,"client",id,current,input,"Aggiornamento cliente / collegamenti espliciti"); return true;
    }); return saved?getClient(id):undefined;
  },
  async createProject(input: FinanceProjectInput) {
    const id = await saveProject(input.details?.legacyProjectId ?? randomUUID(), input, true);
    return id ? (await allProjects(await allEntries())).find(p=>p.id===id) : undefined;
  },
  async updateProject(id: string, input: FinanceProjectUpdate) {
    const saved=await saveProject(id,input,false);
    return saved?(await allProjects(await allEntries())).find(p=>p.id===id):undefined;
  },
  async createEntry(input: FinanceEntryInput) {
    const id=await saveEntry(randomUUID(),input,true); return (await allEntries()).find(e=>e.id===id);
  },
  async updateEntry(id: string, input: FinanceEntryUpdate) {
    const saved=await saveEntry(id,input,false); return saved?(await allEntries()).find(e=>e.id===id):undefined;
  },
  async markEntryPaid(id: string) {
    const current=(await allEntries()).find(e=>e.id===id); if(!current) return undefined;
    // Preserve the actual date explicitly chosen in the editor; this action cannot invent one.
    if (!current.details?.paidDate || !current.details.amountConfirmed) invalid("Modifica il movimento e indica data effettiva e importo confermato.");
    return this.updateEntry(id,{paid:true});
  },
  async deleteEntry(id: string) {
    return financeTransaction(async q=>{
      const before=(await q.query("SELECT * FROM admin_finance_entries WHERE id=$1 FOR UPDATE",[id])).rows[0];
      if(!before || before.details?.cancelled) return false;
      await q.query(`UPDATE admin_finance_entries SET details=details || '{"cancelled":true}'::jsonb,repeat_monthly=false,series_day=NULL WHERE id=$1`,[id]);
      await financeAudit(q,"entry",id,before,{cancelled:true},"Movimento annullato; originale conservato"); return true;
    });
  },
};

export async function financeWorkspace(): Promise<FinanceWorkspace> {
  const [recurring, history, legacyProjects, legacyPayments, sources, previous] = await Promise.all([
    pool.query(`SELECT id,project_id AS "projectId",client_id AS "clientId",direction,category,description,amount_cents AS "amountCents",
      start_date::text AS "startDate",next_date::text AS "nextDate",interval_months AS "intervalMonths",state FROM admin_finance_recurring ORDER BY description`),
    pool.query(`SELECT id,entity_type AS "entityType",entity_id AS "entityId",actor,reason,before,after,created_at AS "createdAt" FROM admin_finance_audit ORDER BY created_at DESC LIMIT 200`),
    pool.query(`SELECT p.id,p.nome AS name,p.cliente_id AS "clientId",p.acconto_versato AS "advanceEuro",
      COALESCE(jsonb_agg(jsonb_build_object('description',v.descrizione,'euro',v.importo) ORDER BY v.ordine) FILTER(WHERE v.id IS NOT NULL),'[]') AS items
      FROM progetti_lavori p LEFT JOIN voci_progetto v ON v.progetto_id=p.id GROUP BY p.id ORDER BY p.nome`),
    pool.query(`SELECT a.id,COALESCE(NULLIF(a.ragione_sociale,''),a.nome||' '||a.cognome) AS name,a.progetto AS description,
      a.importo_centesimi AS "amountCents",a.stato AS state,a.paid_at AS "paidAt",
      EXISTS(SELECT 1 FROM admin_finance_entries e WHERE e.acconto_id=a.id) AS linked FROM acconti a ORDER BY a.created_at DESC`),
    pool.query(`SELECT id,nome_attivita AS name,'lead' AS kind FROM commercial_leads
      UNION ALL SELECT id,COALESCE(NULLIF(ragione_sociale,''),nome||' '||cognome),'request' FROM richieste_gestionale`),
    pool.query("SELECT count(*)::int AS count FROM admin_finance_clients"),
  ]);
  return { recurring:recurring.rows,history:history.rows,legacyProjects:legacyProjects.rows,legacyPayments:legacyPayments.rows,sources:sources.rows,
    warnings:[...(previous.rows[0].count ? ["Anagrafiche della precedente contabilità da collegare manualmente: non sono state accorpate."]:[]),
      "Acconti storici in euro nelle schede lavoro: non sommati agli incassi. Verificare origine, data e possibili sovrapposizioni.",
      "Storico rettifiche: ultime 200 variazioni; l’esportazione include lo storico completo."] };
}
export async function saveRecurring(input: FinanceRecurringInput) {
  if((input.startDate&&!validCalendarDate(input.startDate))||(input.nextDate&&!validCalendarDate(input.nextDate))) invalid("Date della ricorrenza non valide.");
  if(!categoryMatchesDirection(input.direction,input.category)) invalid("Categoria ricorrenza non valida.");
  if(input.state==="active" && (!input.startDate || !input.nextDate || input.nextDate<input.startDate)) invalid("Decorrenza e prossima scadenza obbligatorie per un servizio attivo.");
  return financeTransaction(async q=>{
    const id=input.id??randomUUID();
    const before=(await q.query("SELECT * FROM admin_finance_recurring WHERE id=$1 FOR UPDATE",[id])).rows[0];
    if(input.id && !before) invalid("Ricorrenza non trovata.");
    if(input.projectId) {
      const p=(await q.query("SELECT customer_id FROM admin_finance_projects WHERE id=$1",[input.projectId])).rows[0];
      if(!p)invalid("Salva prima il lavoro.");
      if(input.clientId&&p.customer_id!==input.clientId)invalid("Il cliente non coincide con quello del lavoro.");
    }
    if(input.clientId && !(await q.query("SELECT id FROM clienti WHERE id=$1",[input.clientId])).rowCount) invalid("Cliente non valido.");
    if(input.direction==="income" && !input.projectId && !input.clientId) invalid("Collega il servizio al cliente.");
    await q.query(`INSERT INTO admin_finance_recurring(id,project_id,client_id,direction,category,description,amount_cents,start_date,next_date,interval_months,anchor_day,state)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET project_id=$2,client_id=$3,direction=$4,category=$5,
      description=$6,amount_cents=$7,start_date=$8,next_date=$9,interval_months=$10,anchor_day=$11,state=$12`,
    [id,input.projectId??null,input.clientId??null,input.direction,input.category,input.description,input.amountCents,input.startDate??null,input.nextDate??null,input.intervalMonths,
      before?.anchor_day??(input.startDate?Number(input.startDate.slice(-2)):null),input.state]);
    await financeAudit(q,"recurring",id,before,input,"Aggiornamento canone / costo ricorrente"); return {id};
  });
}
export async function generateRecurring(id: string, expectedDate: string) {
  if(!validCalendarDate(expectedDate)) invalid("Scadenza non valida.");
  return financeTransaction(async q=>{
    const r=(await q.query("SELECT *,next_date::text AS next,start_date::text AS start FROM admin_finance_recurring WHERE id=$1 FOR UPDATE",[id])).rows[0];
    if(!r || r.state!=="active" || !r.next || !r.start || r.next<r.start) invalid("Solo servizi attivi con decorrenza e scadenza definite.");
    const existing=(await q.query("SELECT id FROM admin_finance_entries WHERE recurring_id=$1 AND due_date=$2",[id,expectedDate])).rows[0];
    if(existing)return {id:existing.id};
    if(r.next!==expectedDate) invalid("La prossima scadenza è cambiata. Ricarica i dati prima di generarla.");
    const entryId=randomUUID();
    await q.query(`INSERT INTO admin_finance_entries(id,project_id,direction,category,description,amount_cents,due_date,recurring_id,details)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(recurring_id,due_date) DO NOTHING`,
    [entryId,r.project_id,r.direction,r.category,r.description,r.amount_cents,r.next,id,JSON.stringify({amountConfirmed:true,clientId:r.client_id,currency:"EUR",reconciliation:"unverified"})]);
    const next=nextMonthlyDate(r.next,r.anchor_day??Number(r.start.slice(-2)),r.interval_months);
    await q.query("UPDATE admin_finance_recurring SET next_date=$2 WHERE id=$1",[id,next]);
    await financeAudit(q,"recurring",id,r,{generatedDate:r.next,nextDate:next},"Creata scadenza non pagata; nessun incasso presunto"); return {id:entryId};
  });
}
