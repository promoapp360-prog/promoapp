import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import type {
  AdminFinanceClient, AdminFinanceData, AdminFinanceEntry, AdminFinanceProject,
  AdminFinanceSupplier, FinanceClientInput, FinanceClientUpdate, FinanceEntryInput, FinanceEntryUpdate,
  FinanceProjectInput, FinanceProjectUpdate, FinanceRecurringInput, FinanceSupplierInput, FinanceSupplierUpdate, FinanceWorkspace,
} from "@workspace/api-zod";
import { projectBalance, eligibleIncome, verifiedCash, todayRome } from "./finance-calculations";
import { ObjectStorageService } from "./objectStorage";

// Schema is managed by Drizzle / the platform's development and Publish flows.
// In particular, reads never execute DDL, link people by name or create movements.
export async function ensureFinanceSchema() {
  await pool.query("SELECT customer_id,details FROM admin_finance_projects LIMIT 0");
}
const clientColumns = `id, name, company_name AS "companyName", email, phone,
 notes, details, created_at AS "createdAt"`;
const supplierColumns = `id,name,category,email,website,notes,active,created_at AS "createdAt"`;
const projectColumns = `p.id,p.client_id AS "clientId",
 COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",
 p.name,p.total_amount_cents AS "totalAmountCents",p.payment_type AS "paymentType",
 p.deposit_amount_cents AS "depositAmountCents",p.installment_count AS "installmentCount",
 p.notes,p.active,p.created_at AS "createdAt",
 p.details AS details`;
const entryColumns = `e.id,e.project_id AS "projectId",p.name AS "projectName",
  COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",e.direction,e.category,e.description,
 e.amount_cents AS "amountCents",e.due_date::text AS "dueDate",e.paid_at AS "paidAt",
 e.repeat_monthly AS "repeatMonthly",e.created_at AS "createdAt",
  e.details || jsonb_build_object('recurringId',e.recurring_id) AS details`;
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
  void q; void id;
}
async function getClient(id: string) {
  return (await pool.query<AdminFinanceClient>(`SELECT ${clientColumns} FROM admin_finance_clients WHERE id=$1`, [id])).rows[0];
}
async function allEntries() {
  return (await pool.query<AdminFinanceEntry>(`SELECT ${entryColumns} FROM admin_finance_entries e
    LEFT JOIN admin_finance_projects p ON p.id=e.project_id
    LEFT JOIN admin_finance_clients c ON c.id=COALESCE(p.client_id,(e.details->>'clientId'))
    ORDER BY e.due_date DESC,e.created_at DESC`)).rows.map(e => ({ ...e, dueDate: new Date(`${String(e.dueDate).slice(0,10)}T00:00:00Z`) }));
}
async function allProjects(entries: AdminFinanceEntry[]) {
  const result = await pool.query<AdminFinanceProject>(`SELECT ${projectColumns}
    FROM admin_finance_projects p LEFT JOIN admin_finance_clients c ON c.id=p.client_id ORDER BY p.created_at DESC`);
  return result.rows.map(p => ({ ...p, ...projectBalance(p, entries) }));
}
async function saveProject(id: string, input: FinanceProjectInput | FinanceProjectUpdate, creating: boolean) {
  return financeTransaction(async q => {
    const before = (await q.query(`SELECT * FROM admin_finance_projects WHERE id=$1 FOR UPDATE`, [id])).rows[0];
    if(creating&&before) invalid("Il lavoro esiste già nell’anagrafica economica.");
    if (!creating && !before) return undefined;
    const clientId = input.clientId ?? before?.client_id;
    if (!clientId || !(await q.query("SELECT id FROM admin_finance_clients WHERE id=$1", [clientId])).rowCount) return undefined;
    const details = { creditReview:true, ...(before?.details ?? {}), ...input.details };
    if(details.confirmedDate&&!validCalendarDate(details.confirmedDate)) invalid("Data accordo non valida.");
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
      (id,client_id,client_name,name,total_amount_cents,payment_type,deposit_amount_cents,installment_count,notes,active,details)
      VALUES($1,$2,'',$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT(id) DO UPDATE SET client_id=$2,name=$3,total_amount_cents=$4,
      payment_type=$5,deposit_amount_cents=$6,installment_count=$7,notes=$8,active=$9,details=$10`,
    [id,clientId,input.name?.trim() ?? before?.name,total,paymentType,deposit,installments,
      input.notes ?? before?.notes ?? "",("active" in input ? input.active : undefined) ?? before?.active ?? true,JSON.stringify(details)]);
    await financeAudit(q,"project",id,before,{ ...input, details },"Aggiornamento lavoro e accordo");
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
      const p=(await q.query("SELECT client_id FROM admin_finance_projects WHERE id=$1",[projectId])).rows[0];
      if(!p)invalid("Salva prima i dati economici del lavoro.");
      if(details.clientId&&details.clientId!==p.client_id)invalid("Il cliente del movimento non coincide con quello del lavoro.");
    }
    if (details.clientId && !(await q.query("SELECT id FROM admin_finance_clients WHERE id=$1", [details.clientId])).rowCount) invalid("Cliente non valido.");
    if (details.supplierId) {
      const supplier = (await q.query("SELECT name,active FROM admin_finance_suppliers WHERE id=$1", [details.supplierId])).rows[0];
      if (!supplier || (!supplier.active && details.supplierId !== before?.details?.supplierId)) invalid("Seleziona un fornitore attivo.");
      details.supplier = supplier.name;
    }
    let amount = input.amountCents ?? before?.amount_cents;
    if(details.paidDate&&!validCalendarDate(details.paidDate)) invalid("Data di pagamento non valida.");
    const effectivePaid=input.paid ?? Boolean(before?.paid_at);
    if(effectivePaid && details.paidDate && details.paidDate>todayRome()) invalid("Un pagamento futuro non è un incasso effettivamente ricevuto.");
    if(input.paid===true && !details.paidDate && !before?.paid_at && !details.accontoId) invalid("Indica la data effettiva del pagamento.");
    let paidAt = input.paid === undefined ? before?.paid_at ?? null : input.paid ? details.paidDate?`${details.paidDate}T12:00:00+01:00`:before?.paid_at??null : null;
    if (input.details?.paidDate && (input.paid ?? Boolean(before?.paid_at))) paidAt = `${details.paidDate}T12:00:00+01:00`;
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
      calendarDate(input.dueDate ?? before?.due_date),paidAt,JSON.stringify(details),null]);
    await financeAudit(q,"entry",id,before,{ ...input, details, paidAt },before?.details?.cancelled?"Ripristino esplicito movimento":"Registrazione / rettifica movimento");
    return id;
  });
}
export const adminFinanceData = {
  async list(month: string): Promise<AdminFinanceData> {
    const [clients, entries] = await Promise.all([
      pool.query<AdminFinanceClient>(`SELECT ${clientColumns} FROM admin_finance_clients ORDER BY lower(COALESCE(company_name,name)),lower(name)`),
      allEntries(),
    ]);
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
    const identityKey = `${input.name.trim().toLocaleLowerCase("it-IT")}\u001f${(clean(input.companyName) ?? "").toLocaleLowerCase("it-IT")}`;
    const duplicate = await financeTransaction(async q=>{
      await q.query("SELECT pg_advisory_xact_lock(7861401)");
      if ((await q.query(`SELECT id FROM admin_finance_clients WHERE identity_key=$1`,[identityKey])).rowCount) return true;
      await verifyClientDetails(q,input.details,id);
      await q.query(`INSERT INTO admin_finance_clients(id,identity_key,name,company_name,email,phone,notes,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id,identityKey,input.name.trim(),clean(input.companyName),clean(input.email),clean(input.phone),input.notes??"",JSON.stringify(input.details??{})]);
      await financeAudit(q,"client",id,null,input,"Cliente creato nell’anagrafica interna PromoApp"); return false;
    });
    return duplicate ? null : getClient(id);
  },
  async updateClient(id: string, input: FinanceClientUpdate) {
    const saved = await financeTransaction(async q=>{
      await q.query("SELECT pg_advisory_xact_lock(7861401)");
      const current = (await q.query("SELECT * FROM admin_finance_clients WHERE id=$1 FOR UPDATE",[id])).rows[0]; if (!current) return false;
      const nextName=input.name?.trim()??current.name;
      const nextCompany=input.companyName===undefined?current.company_name:clean(input.companyName);
      const identityKey = `${nextName.toLocaleLowerCase("it-IT")}\u001f${(nextCompany ?? "").toLocaleLowerCase("it-IT")}`;
      if((await q.query(`SELECT id FROM admin_finance_clients WHERE id<>$1 AND identity_key=$2`,[id,identityKey])).rowCount)invalid("Esiste già un cliente con lo stesso nome e la stessa azienda.");
      const details = { ...current.details,...input.details }; await verifyClientDetails(q,details,id);
      await q.query(`UPDATE admin_finance_clients SET identity_key=$2,name=$3,company_name=$4,email=$5,phone=$6,notes=$7,details=$8 WHERE id=$1`,
        [id,identityKey,nextName,nextCompany,input.email===undefined?current.email:clean(input.email),
          input.phone===undefined?current.phone:clean(input.phone),input.notes??current.notes,JSON.stringify(details)]);
      await financeAudit(q,"client",id,current,input,"Aggiornamento anagrafica cliente interna"); return true;
    }); return saved?getClient(id):undefined;
  },
  async listSuppliers(): Promise<AdminFinanceSupplier[]> {
    return (await pool.query<AdminFinanceSupplier>(`SELECT ${supplierColumns} FROM admin_finance_suppliers ORDER BY active DESC,lower(name)`)).rows;
  },
  async createSupplier(input: FinanceSupplierInput): Promise<AdminFinanceSupplier | null> {
    const id = randomUUID();
    return financeTransaction(async q => {
      await q.query("SELECT pg_advisory_xact_lock(7861402)");
      if ((await q.query("SELECT id FROM admin_finance_suppliers WHERE lower(trim(name))=lower(trim($1))",[input.name])).rowCount) return null;
      await q.query(`INSERT INTO admin_finance_suppliers(id,name,category,email,website,notes)
        VALUES($1,$2,$3,$4,$5,$6)`,[id,input.name.trim(),input.category,clean(input.email),clean(input.website),input.notes?.trim()??""]);
      await financeAudit(q,"supplier",id,null,input,"Fornitore registrato nel gestionale PromoApp");
      return (await q.query<AdminFinanceSupplier>(`SELECT ${supplierColumns} FROM admin_finance_suppliers WHERE id=$1`,[id])).rows[0];
    });
  },
  async updateSupplier(id: string, input: FinanceSupplierUpdate): Promise<AdminFinanceSupplier | null | undefined> {
    return financeTransaction(async q => {
      await q.query("SELECT pg_advisory_xact_lock(7861402)");
      const before=(await q.query(`SELECT * FROM admin_finance_suppliers WHERE id=$1 FOR UPDATE`,[id])).rows[0];
      if(!before)return undefined;
      const name=input.name?.trim()??before.name;
      if((await q.query("SELECT id FROM admin_finance_suppliers WHERE id<>$1 AND lower(trim(name))=lower(trim($2))",[id,name])).rowCount)return null;
      const after={
        name,category:input.category??before.category,email:input.email===undefined?before.email:clean(input.email),
        website:input.website===undefined?before.website:clean(input.website),notes:input.notes?.trim()??before.notes,active:input.active??before.active,
      };
      await q.query(`UPDATE admin_finance_suppliers SET name=$2,category=$3,email=$4,website=$5,notes=$6,active=$7 WHERE id=$1`,
        [id,after.name,after.category,after.email,after.website,after.notes,after.active]);
      await financeAudit(q,"supplier",id,before,after,"Aggiornamento fornitore");
      return (await q.query<AdminFinanceSupplier>(`SELECT ${supplierColumns} FROM admin_finance_suppliers WHERE id=$1`,[id])).rows[0];
    });
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
  const [recurring, history, suppliers] = await Promise.all([
    pool.query(`SELECT id,project_id AS "projectId",client_id AS "clientId",direction,category,description,amount_cents AS "amountCents",
      start_date::text AS "startDate",next_date::text AS "nextDate",interval_months AS "intervalMonths",state FROM admin_finance_recurring ORDER BY description`),
    pool.query(`SELECT id,entity_type AS "entityType",entity_id AS "entityId",actor,reason,before,after,created_at AS "createdAt" FROM admin_finance_audit ORDER BY created_at DESC LIMIT 200`),
    pool.query<AdminFinanceSupplier>(`SELECT ${supplierColumns} FROM admin_finance_suppliers ORDER BY active DESC,lower(name)`),
  ]);
  return { recurring:recurring.rows,history:history.rows,suppliers:suppliers.rows,warnings:["Dati del sito pubblico esclusi dal gestionale PromoApp."] };
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
      const p=(await q.query("SELECT client_id FROM admin_finance_projects WHERE id=$1",[input.projectId])).rows[0];
      if(!p)invalid("Salva prima il lavoro.");
      if(input.clientId&&p.client_id!==input.clientId)invalid("Il cliente non coincide con quello del lavoro.");
    }
    if(input.clientId && !(await q.query("SELECT id FROM admin_finance_clients WHERE id=$1",[input.clientId])).rowCount) invalid("Cliente non valido.");
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
