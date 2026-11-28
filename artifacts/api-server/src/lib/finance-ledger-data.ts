import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import type {
  FinanceAccountInput, FinanceLedgerData, FinanceLedgerMovement, FinanceLedgerObligation,
  FinanceMovementInput, FinanceObligationInput, FinanceReconciliationInput, FinanceHistoricalCandidate,
} from "@workspace/api-zod";
import { GetFinanceLedgerResponse as FinanceLedgerDataSchema } from "@workspace/api-zod";
import type { PoolClient } from "pg";
import { categoryMatchesDirection, financeAudit, financeTransaction, nextMonthlyDate, validCalendarDate } from "./admin-finance-data";
import { confirmedProject, todayRome } from "./finance-calculations";

const dateForTimestamp = (value: Date | string) => value instanceof Date
  ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(value)
  : value.slice(0, 10);
const dateOnly = (value: Date | string | null | undefined) => value == null
  ? null
  : value instanceof Date ? value.toISOString().slice(0,10) : value.slice(0,10);
const invalid = (message: string, status = 400): never => { throw Object.assign(new Error(message), { status }); };
const total = (values: Array<{ amountCents: number }>) => values.reduce((sum, item) => sum + Number(item.amountCents), 0);
const categoriesForDirection = (direction: string, category: string) => categoryMatchesDirection(direction, category);
type FinanceObligationRow = Omit<FinanceLedgerObligation,"dueDate"> & { dueDate:string|null };

async function addAudit(q: PoolClient, type: string, id: string, before: unknown, after: unknown, reason: string) {
  await financeAudit(q, type, id, before, after, reason);
}

async function activeAccount(q: PoolClient, accountId: string) {
  const account = (await q.query(`SELECT id,name,active FROM admin_finance_accounts WHERE id=$1 FOR UPDATE`, [accountId])).rows[0];
  if (!account || !account.active) invalid("Seleziona un conto attivo.", 404);
  return account as { id: string; name: string; active: boolean };
}

async function insertAllocation(q: PoolClient, movementId: string, obligationId: string, amountCents: number, direction: string) {
  const obligation = (await q.query(`SELECT id,direction,amount_cents AS amount FROM admin_finance_obligations WHERE id=$1 FOR UPDATE`, [obligationId])).rows[0];
  if (!obligation) invalid("Una delle scadenze selezionate non esiste più.", 404);
  if (obligation.direction !== direction) invalid("Il tipo di movimento non coincide con la scadenza.");
  const allocated = Number((await q.query(`SELECT COALESCE(sum(amount_cents),0)::int AS amount
    FROM admin_finance_movement_allocations WHERE obligation_id=$1`, [obligationId])).rows[0].amount);
  if (allocated + amountCents > Number(obligation.amount)) invalid("La ripartizione supera il residuo della scadenza.");
  await q.query(`INSERT INTO admin_finance_movement_allocations(id,movement_id,obligation_id,amount_cents)
    VALUES($1,$2,$3,$4)`, [randomUUID(), movementId, obligationId, amountCents]);
}

async function movementById(id: string): Promise<FinanceLedgerMovement | undefined> {
  const row = (await pool.query(`SELECT m.id,(m.movement_at AT TIME ZONE 'Europe/Rome')::date::text AS "movementDate",
      m.direction,m.amount_cents AS "amountCents",m.account_id AS "accountId",a.name AS "accountName",
      m.payment_method AS "paymentMethod",m.historical,m.note
    FROM admin_finance_movements m LEFT JOIN admin_finance_accounts a ON a.id=m.account_id
    WHERE m.id=$1`, [id])).rows[0];
  if (!row) return undefined;
  const allocations = await pool.query(`SELECT a.obligation_id AS "obligationId",o.description,o.due_date::text AS "dueDate",
      a.amount_cents AS "amountCents"
    FROM admin_finance_movement_allocations a
    JOIN admin_finance_obligations o ON o.id=a.obligation_id
    WHERE a.movement_id=$1 ORDER BY o.due_date NULLS LAST,o.description`, [id]);
  return { ...row, allocations: allocations.rows } as FinanceLedgerMovement;
}

async function materializeMaturedRecurringObligations() {
  const today = todayRome();
  await financeTransaction(async q => {
    const contracts = (await q.query(`SELECT id,project_id,client_id,direction,category,description,amount_cents,
        start_date::text AS start_date,next_date::text AS next_date,end_date::text AS end_date,
        interval_months,anchor_day
      FROM admin_finance_recurring
      WHERE state='active' AND start_date IS NOT NULL AND next_date IS NOT NULL
      ORDER BY id FOR UPDATE`)).rows;
    for (const contract of contracts) {
      let next = contract.next_date as string;
      const start = contract.start_date as string;
      const end = contract.end_date as string | null;
      const anchor = Number(contract.anchor_day ?? Number(start.slice(-2)));
      let generated = 0;
      while (next >= start && next <= today && (!end || next <= end)) {
        await q.query(`INSERT INTO admin_finance_obligations
          (id,direction,category,description,amount_cents,due_date,client_id,project_id,recurring_id,source_type,source_id)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'recurring',$10)
          ON CONFLICT (source_type,source_id,due_date) DO NOTHING`,
        [randomUUID(),contract.direction,contract.category,contract.description,contract.amount_cents,next,
          contract.client_id,contract.project_id,contract.id,contract.id]);
        const following = nextMonthlyDate(next, anchor, Number(contract.interval_months));
        if (following <= next) invalid("Calendario del canone non valido.");
        next = following;
        generated++;
        if (generated > 1200) invalid("Il canone ha oltre 100 anni di scadenze arretrate: serve una verifica manuale.");
      }
      if (next !== contract.next_date) {
        await q.query("UPDATE admin_finance_recurring SET next_date=$2 WHERE id=$1", [contract.id,next]);
      }
    }
  });
}

async function projectRows() {
  return (await pool.query(`SELECT p.id,p.client_id AS "clientId",p.status,
      COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",
      p.name,p.total_amount_cents AS "totalAmountCents",p.details,
      p.created_at AS "createdAt"
    FROM admin_finance_projects p
    LEFT JOIN admin_finance_clients c ON c.id=p.client_id
    ORDER BY p.created_at DESC`)).rows;
}

async function obligationRows(): Promise<FinanceObligationRow[]> {
  const rows = (await pool.query(`SELECT o.id,o.direction,o.category,o.description,o.amount_cents AS "amountCents",
      o.due_date::text AS "dueDate",o.client_id AS "clientId",
      COALESCE(NULLIF(c.company_name,''),c.name) AS "clientName",
      o.project_id AS "projectId",p.name AS "projectName",o.supplier_id AS "supplierId",
      o.source_type AS "sourceType",o.source_id AS "sourceId",
      COALESCE(sum(a.amount_cents),0)::int AS "allocatedCents"
    FROM admin_finance_obligations o
    LEFT JOIN admin_finance_movement_allocations a ON a.obligation_id=o.id
    LEFT JOIN admin_finance_projects p ON p.id=o.project_id
    LEFT JOIN admin_finance_clients c ON c.id=COALESCE(o.client_id,p.client_id)
    GROUP BY o.id,c.company_name,c.name,p.name
    ORDER BY o.due_date NULLS LAST,o.created_at DESC`)).rows;
  const today = todayRome();
  return rows.map(row => {
    const allocatedCents = Number(row.allocatedCents);
    const remainingCents = Math.max(0, Number(row.amountCents) - allocatedCents);
    return {
      ...row,
      amountCents: Number(row.amountCents),
      allocatedCents,
      remainingCents,
      overdue: Boolean(row.dueDate && row.dueDate < today && remainingCents > 0),
    } as FinanceObligationRow;
  });
}

async function historicalCandidates() {
  const [projects, entries] = await Promise.all([
    pool.query(`SELECT p.id,p.client_id AS "clientId",COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",
        p.name AS "projectName",p.details->>'reportedReceivedCents' AS reported
      FROM admin_finance_projects p LEFT JOIN admin_finance_clients c ON c.id=p.client_id
      WHERE p.details->>'reportedReceivedCents' ~ '^[0-9]+$'
        AND (p.details->>'reportedReceivedCents')::numeric > 0
        AND NOT EXISTS (SELECT 1 FROM admin_finance_movements m WHERE m.external_reference='history:project:'||p.id)
      ORDER BY p.created_at`),
      pool.query(`SELECT e.id,e.direction,e.category,e.description,e.amount_cents AS "amountCents",
        e.paid_at AS "paidAt",e.details->>'paidDate' AS "paidDate",
        e.project_id AS "projectId",p.client_id AS "clientId",
        COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName",p.name AS "projectName"
      FROM admin_finance_entries e
      LEFT JOIN admin_finance_projects p ON p.id=e.project_id
      LEFT JOIN admin_finance_clients c ON c.id=COALESCE(p.client_id,e.details->>'clientId')
      WHERE e.details->>'cancelled' IS DISTINCT FROM 'true'
        AND (e.paid_at IS NOT NULL OR e.details->>'reconciliation'='reported')
        AND NOT EXISTS (SELECT 1 FROM admin_finance_movements m WHERE m.external_reference='history:entry:'||e.id)
      ORDER BY e.created_at`),
  ]);
  const candidates: unknown[] = projects.rows.map(row => ({
    sourceType: "project_reported" as const,
    id: row.id,
    direction: "income" as const,
    category: "balance",
    description: row.projectName,
    suggestedAmountCents: Number(row.reported),
    suggestedDate: null,
    clientId: row.clientId,
    clientName: row.clientName,
    projectId: row.id,
    projectName: row.projectName,
  }));
  for (const row of entries.rows) {
    const rawDate = validCalendarDate(row.paidDate) ? row.paidDate : row.paidAt ? dateForTimestamp(row.paidAt) : null;
    candidates.push({
      sourceType: "legacy_entry",
      id: row.id,
      direction: row.direction,
      category: row.category,
      description: row.description,
      suggestedAmountCents: Number(row.amountCents),
      suggestedDate: rawDate,
      clientId: row.clientId,
      clientName: row.clientName,
      projectId: row.projectId,
      projectName: row.projectName,
    });
  }
  return candidates;
}

export async function financeHistoricalCandidates():Promise<FinanceHistoricalCandidate[]>{
  return await historicalCandidates() as FinanceHistoricalCandidate[];
}

export async function financeLedgerData(month: string): Promise<FinanceLedgerData> {
  await materializeMaturedRecurringObligations();
  const [accountsResult, projects, obligations, movementsResult, candidates, totalsResult, periodResult, cashResult] = await Promise.all([
    pool.query(`SELECT id,name,account_type AS "accountType",opening_balance_cents AS "openingBalanceCents",
      opening_balance_date::text AS "openingBalanceDate",active
      FROM admin_finance_accounts ORDER BY active DESC,name`),
    projectRows(),
    obligationRows(),
    pool.query(`SELECT m.id,(m.movement_at AT TIME ZONE 'Europe/Rome')::date::text AS "movementDate",
        m.direction,m.amount_cents AS "amountCents",m.account_id AS "accountId",a.name AS "accountName",
        m.payment_method AS "paymentMethod",m.historical,m.note
      FROM admin_finance_movements m LEFT JOIN admin_finance_accounts a ON a.id=m.account_id
      ORDER BY m.movement_at DESC LIMIT 500`),
    historicalCandidates(),
    pool.query(`SELECT
      COALESCE(sum(amount_cents) FILTER (WHERE direction='income'),0)::bigint AS received,
      COALESCE(sum(amount_cents) FILTER (WHERE direction='expense'),0)::bigint AS spent
      FROM admin_finance_movements`),
    pool.query(`SELECT
      COALESCE(sum(amount_cents) FILTER (WHERE direction='income'),0)::bigint AS received,
      COALESCE(sum(amount_cents) FILTER (WHERE direction='expense'),0)::bigint AS spent
      FROM admin_finance_movements
      WHERE to_char(movement_at AT TIME ZONE 'Europe/Rome','YYYY-MM')=$1`,[month]),
    pool.query(`SELECT COALESCE(sum(CASE WHEN m.direction='income' THEN m.amount_cents ELSE -m.amount_cents END),0)::bigint AS net
      FROM admin_finance_movements m JOIN admin_finance_accounts a ON a.id=m.account_id
      WHERE a.opening_balance_date IS NULL OR (m.movement_at AT TIME ZONE 'Europe/Rome')::date>=a.opening_balance_date`),
  ]);
  const movementIds = movementsResult.rows.map(row => row.id);
  const allocationsResult = movementIds.length ? await pool.query(`SELECT a.movement_id AS "movementId",
      a.obligation_id AS "obligationId",o.description,o.due_date::text AS "dueDate",a.amount_cents AS "amountCents"
    FROM admin_finance_movement_allocations a JOIN admin_finance_obligations o ON o.id=a.obligation_id
    WHERE a.movement_id=ANY($1::text[]) ORDER BY o.due_date NULLS LAST,o.description`, [movementIds]) : { rows: [] };
  const allocationsByMovement = new Map<string, typeof allocationsResult.rows>();
  for (const allocation of allocationsResult.rows) {
    const list = allocationsByMovement.get(allocation.movementId) ?? [];
    list.push(allocation);
    allocationsByMovement.set(allocation.movementId,list);
  }
  const movements = movementsResult.rows.map(row => ({
    ...row,
    amountCents: Number(row.amountCents),
    allocations: (allocationsByMovement.get(row.id) ?? []).map(({ movementId: _movementId, ...item }) => item),
  })) as FinanceLedgerMovement[];

  const today = todayRome();
  const receivedCents = Number(totalsResult.rows[0].received);
  const spentCents = Number(totalsResult.rows[0].spent);
  const openingBalancesCents = accountsResult.rows.reduce((sum,row) => sum+Number(row.openingBalanceCents),0);
  const movementNetSinceOpening=Number(cashResult.rows[0].net);
  const projectObligations = new Map<string, FinanceObligationRow[]>();
  for (const obligation of obligations) {
    if (obligation.projectId && obligation.direction === "income" && obligation.sourceType !== "recurring") {
      const items = projectObligations.get(obligation.projectId) ?? [];
      items.push(obligation);
      projectObligations.set(obligation.projectId,items);
    }
  }
  const projectRollups = new Map<string,{sold:number;received:number;receivable:number;overdue:number;monthSold:number}>();
  const projectCollectedByClient=new Map<string,number>();
  for(const project of projects){
    if(!project.clientId)continue;
    const collected=(projectObligations.get(project.id)??[]).reduce((sum,item)=>sum+item.allocatedCents,0);
    projectCollectedByClient.set(project.clientId,(projectCollectedByClient.get(project.clientId)??0)+collected);
  }
  let soldCents=0,monthSoldCents=0;
  for (const project of projects) {
    if (!confirmedProject(project as Parameters<typeof confirmedProject>[0]) ||
      project.status === "draft" || project.status === "cancelled" ||
      project.details?.commercialState === "draft" || project.details?.commercialState === "cancelled") continue;
    const amount = Math.max(0,Number(project.totalAmountCents)+Number(project.details?.extraCents??0));
    const related = projectObligations.get(project.id) ?? [];
    const planned = total(related);
    const received = related.reduce((sum,item) => sum+item.allocatedCents,0);
    const receivable = related.reduce((sum,item) => sum+item.remainingCents,0)+Math.max(0,amount-planned);
    const overdue = related.filter(item => item.overdue).reduce((sum,item) => sum+item.remainingCents,0);
    const projectSold = amount;
    const confirmedDate = typeof project.details?.confirmedDate === "string" ? project.details.confirmedDate : "";
    const periodSold = confirmedDate.startsWith(`${month}-`) ? projectSold : 0;
    soldCents += projectSold;
    monthSoldCents += periodSold;
    const current = projectRollups.get(project.clientId??"") ?? { sold:0,received:0,receivable:0,overdue:0,monthSold:0 };
    current.sold += projectSold;
    current.received += received;
    current.receivable += receivable;
    current.overdue += overdue;
    current.monthSold += periodSold;
    if (project.clientId) projectRollups.set(project.clientId,current);
  }
  const recurringObligations = obligations.filter(item => item.sourceType==="recurring"&&item.direction==="income"&&item.dueDate&&item.dueDate<=today);
  const nonProjectObligations = obligations.filter(item => item.direction==="income"&&!item.projectId&&item.sourceType!=="recurring");
  const recurringSold=recurringObligations.reduce((sum,item)=>sum+item.amountCents,0);
  soldCents+=recurringSold;
  const monthRecurringSold=recurringObligations.filter(item=>item.dueDate?.startsWith(`${month}-`)).reduce((sum,item)=>sum+item.amountCents,0);
  monthSoldCents+=monthRecurringSold;
  const receivableCents=[...projectRollups.values()].reduce((sum,item)=>sum+item.receivable,0)+
    recurringObligations.reduce((sum,item)=>sum+item.remainingCents,0)+nonProjectObligations.reduce((sum,item)=>sum+item.remainingCents,0);
  const overdueCents=[...projectRollups.values()].reduce((sum,item)=>sum+item.overdue,0)+
    recurringObligations.filter(item=>item.overdue).reduce((sum,item)=>sum+item.remainingCents,0)+
    nonProjectObligations.filter(item=>item.overdue).reduce((sum,item)=>sum+item.remainingCents,0);
  const monthReceivedCents=Number(periodResult.rows[0].received);
  const monthSpentCents=Number(periodResult.rows[0].spent);
  const clientResult=await pool.query(`SELECT id,COALESCE(NULLIF(company_name,''),name) AS name
    FROM admin_finance_clients ORDER BY lower(COALESCE(NULLIF(company_name,''),name))`);
  const clientBalances=clientResult.rows.map(client=>{
    const project=projectRollups.get(client.id)??{sold:0,received:0,receivable:0,overdue:0,monthSold:0};
    const clientObligations=[...recurringObligations.filter(item=>item.clientId===client.id),...nonProjectObligations.filter(item=>item.clientId===client.id)];
    return {
      clientId:client.id,clientName:client.name,
      soldCents:project.sold+clientObligations.filter(item=>item.sourceType==="recurring").reduce((sum,item)=>sum+item.amountCents,0),
      receivedCents:(projectCollectedByClient.get(client.id)??0)+clientObligations.reduce((sum,item)=>sum+item.allocatedCents,0),
      receivableCents:project.receivable+clientObligations.reduce((sum,item)=>sum+item.remainingCents,0),
      overdueCents:project.overdue+clientObligations.filter(item=>item.overdue).reduce((sum,item)=>sum+item.remainingCents,0),
    };
  });
  const summary = {
    month,soldCents,receivedCents,spentCents,openingBalancesCents,
    cashBalanceCents:openingBalancesCents+movementNetSinceOpening,
    receivableCents,overdueCents,managedMarginCents:soldCents-spentCents,
    monthSoldCents,monthReceivedCents,monthSpentCents,monthCashFlowCents:monthReceivedCents-monthSpentCents,
  };
  return FinanceLedgerDataSchema.parse({
    summary,
    accounts:accountsResult.rows.map(row=>({...row,openingBalanceCents:Number(row.openingBalanceCents)})),
    obligations,
    movements,
    historicalCandidates:candidates,
    clientBalances,
  });
}

export async function createFinanceAccount(input: FinanceAccountInput) {
  const openingBalanceDate=dateOnly(input.openingBalanceDate);
  if(openingBalanceDate&&!validCalendarDate(openingBalanceDate))invalid("Data del saldo iniziale non valida.");
  if(input.openingBalanceCents!==0&&!openingBalanceDate)invalid("Per un saldo iniziale diverso da zero, indica la data a cui si riferisce.");
  const id=randomUUID();
  return financeTransaction(async q=>{
    await q.query(`INSERT INTO admin_finance_accounts(id,name,account_type,opening_balance_cents,opening_balance_date,notes)
      VALUES($1,$2,$3,$4,$5,$6)`,[id,input.name.trim(),input.accountType,input.openingBalanceCents,openingBalanceDate,input.notes?.trim()??""]);
    await addAudit(q,"finance_account",id,null,input,"Apertura conto nel gestionale PromoApp");
    return (await q.query(`SELECT id,name,account_type AS "accountType",opening_balance_cents AS "openingBalanceCents",
      opening_balance_date::text AS "openingBalanceDate",active FROM admin_finance_accounts WHERE id=$1`,[id])).rows[0];
  });
}

export async function createFinanceObligation(input: FinanceObligationInput) {
  if (!categoriesForDirection(input.direction,input.category)) invalid("Categoria non compatibile con entrate o uscite.");
  const dueDate=dateOnly(input.dueDate);
  if (dueDate && !validCalendarDate(dueDate)) invalid("Data di scadenza non valida.");
  if (input.direction==="income"&&!input.clientId&&!input.projectId) invalid("Collega l’entrata a un cliente o a un lavoro.");
  return financeTransaction(async q=>{
    let clientId=input.clientId??null;
    if(input.projectId){
      const project=(await q.query("SELECT id,name,client_id,total_amount_cents,details FROM admin_finance_projects WHERE id=$1 FOR UPDATE",[input.projectId])).rows[0];
      if(!project)invalid("Lavoro non trovato.",404);
      if(clientId&&clientId!==project.client_id)invalid("Il cliente selezionato non coincide con il lavoro.");
      clientId=project.client_id;
      if(input.direction==="income"){
        if(!confirmedProject({details:project.details} as Parameters<typeof confirmedProject>[0]))invalid("Conferma prima il lavoro e il suo importo concordato.");
        const planned=Number((await q.query(`SELECT COALESCE(sum(amount_cents),0)::bigint AS amount
          FROM admin_finance_obligations WHERE project_id=$1 AND direction='income' AND source_type<>'recurring'`,[input.projectId])).rows[0].amount);
        const agreed=Number(project.total_amount_cents)+Number(project.details?.extraCents??0);
        if(planned+input.amountCents>agreed)invalid("La somma delle rate supererebbe l’importo concordato del lavoro.");
      }
    }
    if(clientId&&!(await q.query("SELECT id FROM admin_finance_clients WHERE id=$1",[clientId])).rowCount)invalid("Cliente non trovato.",404);
    if(input.supplierId&&!(await q.query("SELECT id FROM admin_finance_suppliers WHERE id=$1",[input.supplierId])).rowCount)invalid("Fornitore non trovato.",404);
    const id=randomUUID();
    await q.query(`INSERT INTO admin_finance_obligations
      (id,direction,category,description,amount_cents,due_date,client_id,project_id,supplier_id,source_type,source_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$1)`,
    [id,input.direction,input.category,input.description.trim(),input.amountCents,dueDate,clientId,input.projectId??null,input.supplierId??null,
      input.projectId?"project_installment":"manual"]);
    await addAudit(q,"finance_obligation",id,null,input,"Scadenza registrata");
    return id;
  }).then(async id=>(await obligationRows()).find(item=>item.id===id));
}

export async function createFinanceMovement(input: FinanceMovementInput) {
  const movementDate=dateOnly(input.movementDate)!;
  if(!validCalendarDate(movementDate)||movementDate>todayRome())invalid("Indica una data effettiva non futura.");
  const seen=new Set<string>();
  let allocatedTotal=0;
  for(const allocation of input.allocations){
    if(seen.has(allocation.obligationId))invalid("Una scadenza non può essere ripetuta nella stessa ripartizione.");
    seen.add(allocation.obligationId);
    allocatedTotal+=allocation.amountCents;
  }
  if(allocatedTotal>input.amountCents)invalid("La ripartizione supera l’importo del movimento.");
  const id=randomUUID();
  await financeTransaction(async q=>{
    await activeAccount(q,input.accountId);
    await q.query(`INSERT INTO admin_finance_movements
      (id,movement_at,direction,amount_cents,account_id,payment_method,historical,note)
      VALUES($1,(($2::date + time '12:00') AT TIME ZONE 'Europe/Rome'),$3,$4,$5,$6,false,$7)`,
    [id,movementDate,input.direction,input.amountCents,input.accountId,input.paymentMethod?.trim()||null,input.note?.trim()??""]);
    for(const item of [...input.allocations].sort((a,b)=>a.obligationId.localeCompare(b.obligationId))){
      await insertAllocation(q,id,item.obligationId,item.amountCents,input.direction);
    }
    await addAudit(q,"finance_movement",id,null,{...input,historical:false},"Movimento effettivo registrato");
  });
  return movementById(id);
}

async function ensureProjectBalanceObligation(q: PoolClient, project: any, requiredCents: number) {
  const existing=(await q.query(`SELECT id,amount_cents AS amount FROM admin_finance_obligations
    WHERE project_id=$1 AND source_type='project_balance' AND due_date IS NULL
    ORDER BY created_at LIMIT 1 FOR UPDATE`,[project.id])).rows[0];
  if(existing){
    const remaining=Number(existing.amount)-Number((await q.query(`SELECT COALESCE(sum(amount_cents),0)::int AS amount
      FROM admin_finance_movement_allocations WHERE obligation_id=$1`,[existing.id])).rows[0].amount);
    if(remaining>=requiredCents)return existing.id;
    const extra=requiredCents-remaining;
    await q.query(`UPDATE admin_finance_obligations SET amount_cents=amount_cents+$2 WHERE id=$1`,[existing.id,extra]);
    return existing.id;
  }
  const obligationId=randomUUID();
  await q.query(`INSERT INTO admin_finance_obligations
    (id,direction,category,description,amount_cents,due_date,client_id,project_id,source_type,source_id)
    VALUES($1,'income','balance',$2,$3,NULL,$4,$5,'project_balance',$6)`,
  [obligationId,`Residuo lavoro: ${project.name}`,requiredCents,project.client_id,project.id,project.id]);
  return obligationId;
}

async function allocateHistoricalIncome(q: PoolClient, movementId: string, project: any, amountCents: number) {
  const rows=(await q.query(`SELECT o.id,o.amount_cents AS amount
    FROM admin_finance_obligations o
    WHERE o.project_id=$1 AND o.direction='income' AND o.source_type<>'recurring'
    ORDER BY o.due_date NULLS LAST,o.created_at FOR UPDATE`,[project.id])).rows;
  const open=[];
  for(const row of rows){
    const allocated=Number((await q.query(`SELECT COALESCE(sum(amount_cents),0)::int AS amount
      FROM admin_finance_movement_allocations WHERE obligation_id=$1`,[row.id])).rows[0].amount);
    const remaining=Number(row.amount)-allocated;
    if(remaining>0)open.push({id:row.id,remaining});
  }
  const totalOpen=open.reduce((sum,row)=>sum+row.remaining,0);
  let remaining=amountCents;
  if(totalOpen<amountCents){
    const id=await ensureProjectBalanceObligation(q,project,amountCents-totalOpen);
    open.push({id,remaining:amountCents-totalOpen});
  }
  for(const obligation of open){
    if(remaining<=0)break;
    const applied=Math.min(remaining,obligation.remaining);
    await q.query(`INSERT INTO admin_finance_movement_allocations(id,movement_id,obligation_id,amount_cents) VALUES($1,$2,$3,$4)`,
      [randomUUID(),movementId,obligation.id,applied]);
    remaining-=applied;
  }
  if(remaining>0)invalid("Il movimento storico supera il residuo del lavoro.");
}

export async function reconcileFinanceHistory(input: FinanceReconciliationInput) {
  const movementDate=dateOnly(input.movementDate)!;
  if(!validCalendarDate(movementDate)||movementDate>todayRome())invalid("Indica una data storica effettiva non futura.");
  const externalReference=input.sourceType==="project_reported"?`history:project:${input.sourceId}`:`history:entry:${input.sourceId}`;
  const id=randomUUID();
  await financeTransaction(async q=>{
    await activeAccount(q,input.accountId);
    if((await q.query("SELECT id FROM admin_finance_movements WHERE external_reference=$1",[externalReference])).rowCount)invalid("Questa voce storica è già stata riconciliata.",409);
    let direction:"income"|"expense",category:string,description:string,project:any=null,amount=input.amountCents;
    if(input.sourceType==="project_reported"){
      project=(await q.query(`SELECT p.id,p.client_id,p.name,p.total_amount_cents,p.details
        FROM admin_finance_projects p WHERE p.id=$1 FOR UPDATE`,[input.sourceId])).rows[0];
      if(!project||!Number.isSafeInteger(Number(project.details?.reportedReceivedCents))||Number(project.details.reportedReceivedCents)<=0)invalid("Dato storico del lavoro non trovato.",404);
      direction="income";category="balance";description=project.name;
      const limit=Number(project.total_amount_cents)+Number(project.details?.extraCents??0);
      const already=Number((await q.query(`SELECT COALESCE(sum(a.amount_cents),0)::int AS amount
        FROM admin_finance_movement_allocations a JOIN admin_finance_obligations o ON o.id=a.obligation_id
        WHERE o.project_id=$1 AND o.direction='income' AND o.source_type<>'recurring'`,[project.id])).rows[0].amount);
      if(amount+already>limit)invalid("L’importo confermato supera il totale del lavoro.");
    }else{
      const entry=(await q.query(`SELECT e.id,e.direction,e.category,e.description,e.amount_cents,e.project_id,e.details,e.paid_at,
          p.id AS joined_project,p.client_id AS project_client_id,p.name AS project_name,p.total_amount_cents AS project_total,p.details AS project_details
        FROM admin_finance_entries e LEFT JOIN admin_finance_projects p ON p.id=e.project_id
        WHERE e.id=$1 FOR UPDATE OF e`,[input.sourceId])).rows[0];
      const historical=entry?.paid_at||entry?.details?.reconciliation==="reported";
      if(!entry||entry.details?.cancelled||!historical)invalid("Registrazione storica non trovata o non candidata.",404);
      direction=entry.direction;category=entry.category;description=entry.description;
      if(entry.joined_project)project={id:entry.joined_project,client_id:entry.project_client_id,name:entry.project_name,total_amount_cents:entry.project_total,details:entry.project_details};
    }
    if(!categoriesForDirection(direction,category))invalid("La categoria storica non coincide con il tipo di movimento.");
    await q.query(`INSERT INTO admin_finance_movements
      (id,movement_at,direction,amount_cents,account_id,payment_method,historical,note,external_reference)
      VALUES($1,(($2::date + time '12:00') AT TIME ZONE 'Europe/Rome'),$3,$4,$5,$6,true,$7,$8)`,
    [id,movementDate,direction,amount,input.accountId,input.paymentMethod?.trim()||null,input.note?.trim()??"Riconciliazione storica confermata",externalReference]);
    if(direction==="income"&&project)await allocateHistoricalIncome(q,id,project,amount);
    await addAudit(q,"finance_movement",id,null,{sourceType:input.sourceType,sourceId:input.sourceId,amountCents:amount,movementDate}, "Incasso o spesa storica confermata dall’amministratore");
  });
  return movementById(id);
}

export async function generateRecurringObligation(id: string, expected: Date|string) {
  const expectedDate=dateOnly(expected)!;
  if(!validCalendarDate(expectedDate))invalid("Scadenza non valida.");
  const obligationId=await financeTransaction(async q=>{
    const contract=(await q.query(`SELECT id,project_id,client_id,direction,category,description,amount_cents,
      start_date::text AS start_date,next_date::text AS next_date,end_date::text AS end_date,interval_months,anchor_day,state
      FROM admin_finance_recurring WHERE id=$1 FOR UPDATE`,[id])).rows[0];
    if(!contract||contract.state!=="active"||!contract.start_date||!contract.next_date||contract.next_date<contract.start_date)invalid("Solo canoni attivi con decorrenza e scadenza definite.");
    const existing=(await q.query(`SELECT id FROM admin_finance_obligations WHERE source_type='recurring' AND source_id=$1 AND due_date=$2`,[id,expectedDate])).rows[0];
    if(existing)return existing.id as string;
    if(contract.next_date!==expectedDate)invalid("La prossima scadenza è cambiata. Ricarica i dati.");
    const created=randomUUID();
    await q.query(`INSERT INTO admin_finance_obligations
      (id,direction,category,description,amount_cents,due_date,client_id,project_id,recurring_id,source_type,source_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'recurring',$9)
      ON CONFLICT(source_type,source_id,due_date) DO NOTHING`,
    [created,contract.direction,contract.category,contract.description,contract.amount_cents,expectedDate,
      contract.client_id,contract.project_id,contract.id]);
    const next=nextMonthlyDate(expectedDate,Number(contract.anchor_day??Number(contract.start_date.slice(-2))),Number(contract.interval_months));
    await q.query("UPDATE admin_finance_recurring SET next_date=$2 WHERE id=$1",[id,next]);
    await addAudit(q,"recurring",id,contract,{generatedDate:expectedDate,nextDate:next},"Creata scadenza non pagata; nessun incasso presunto");
    return (await q.query(`SELECT id FROM admin_finance_obligations WHERE source_type='recurring' AND source_id=$1 AND due_date=$2`,[id,expectedDate])).rows[0].id as string;
  });
  return obligationRows().then(rows=>rows.find(row=>row.id===obligationId));
}
