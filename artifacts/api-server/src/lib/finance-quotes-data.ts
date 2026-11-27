import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import type {
  FinanceQuote, FinanceQuoteConversionInput, FinanceQuoteInput, FinanceQuoteStatusInput,
  FinanceQuoteUpdate, FinanceScheduleItem, FinanceScheduleResponse, FinanceManualReminder,
  FinanceManualReminderInput, FinanceManualReminderUpdate,
} from "@workspace/api-zod";
import { financeLedgerData } from "./finance-ledger-data";
import { calendarDate, financeAudit, financeTransaction, validCalendarDate } from "./admin-finance-data";
import { todayRome } from "./finance-calculations";

const invalid=(message:string,status=400):never=>{throw Object.assign(new Error(message),{status});};
const clean=(value:string|null|undefined)=>value?.trim()||null;
type QuoteLine=FinanceQuoteInput["items"][number];
type QuoteQuery={query:(sql:string,values?:unknown[])=>Promise<{rows:any[];rowCount:number|null}>};

function quoteTotal(items:QuoteLine[]) {
  if(!items.length)invalid("Inserisci almeno una voce nel preventivo.");
  let total=0;
  for(const item of items){
    if(!item.description.trim())invalid("Ogni voce deve avere una descrizione.");
    if(!Number.isFinite(item.quantity)||Math.abs(item.quantity*1000-Math.round(item.quantity*1000))>0.000001){
      invalid("Le quantità possono avere al massimo tre cifre decimali.");
    }
    const line=Math.round(item.quantity*item.unitPriceCents);
    if(!Number.isSafeInteger(line)||line<0)invalid("Controlla quantità e prezzo della voce.");
    total+=line;
    if(total>2147483647)invalid("Il totale del preventivo supera il limite consentito.");
  }
  if(total<=0)invalid("Il totale del preventivo deve essere maggiore di zero.");
  return total;
}

async function quoteSnapshot(q:QuoteQuery,id:string) {
  const quote=(await q.query(`SELECT id,client_id AS "clientId",number,issued_on::text AS "issuedOn",
      valid_until::text AS "validUntil",status,total_amount_cents AS "totalAmountCents",notes,
      created_at::text AS "createdAt"
    FROM admin_finance_quotes WHERE id=$1 FOR UPDATE`,[id])).rows[0];
  if(!quote)return undefined;
  const items=(await q.query(`SELECT id,position,description,quantity::float8 AS quantity,
      unit_price_cents AS "unitPriceCents",total_cents AS "totalCents"
    FROM admin_finance_quote_items WHERE quote_id=$1 ORDER BY position`,[id])).rows;
  return {...quote,items};
}

async function saveQuoteLines(q:QuoteQuery,quoteId:string,items:QuoteLine[]) {
  await q.query("DELETE FROM admin_finance_quote_items WHERE quote_id=$1",[quoteId]);
  for(const [position,item] of items.entries()){
    const totalCents=Math.round(item.quantity*item.unitPriceCents);
    await q.query(`INSERT INTO admin_finance_quote_items
      (id,quote_id,position,description,quantity,unit_price_cents,total_cents)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [randomUUID(),quoteId,position,item.description.trim(),item.quantity,item.unitPriceCents,totalCents]);
  }
}

export async function financeQuotes():Promise<{quotes:FinanceQuote[]}>{
  const result=await pool.query(`SELECT q.id,q.client_id AS "clientId",c.name AS "clientName",
      c.company_name AS "companyName",c.email AS "clientEmail",c.phone AS "clientPhone",
      c.tax_id AS "clientTaxId",c.address AS "clientAddress",q.number,
      q.issued_on::text AS "issuedOn",q.valid_until::text AS "validUntil",q.status,
      q.total_amount_cents AS "totalAmountCents",q.notes,p.id AS "projectId",
      q.created_at::text AS "createdAt"
    FROM admin_finance_quotes q
    JOIN admin_finance_clients c ON c.id=q.client_id
    LEFT JOIN admin_finance_projects p ON p.details->>'sourceQuoteId'=q.id
    ORDER BY q.issued_on DESC,q.created_at DESC`);
  const ids=result.rows.map(row=>row.id as string);
  const lineRows=ids.length?await pool.query(`SELECT id,quote_id AS "quoteId",position,description,
      quantity::float8 AS quantity,unit_price_cents AS "unitPriceCents",total_cents AS "totalCents"
    FROM admin_finance_quote_items WHERE quote_id=ANY($1::text[]) ORDER BY position`,[ids]):{rows:[]};
  const linesByQuote=new Map<string,any[]>();
  for(const line of lineRows.rows){
    const lines=linesByQuote.get(line.quoteId)??[];
    const {quoteId:_quoteId,...item}=line;
    lines.push(item);
    linesByQuote.set(line.quoteId,lines);
  }
  const today=todayRome();
  return {quotes:result.rows.map(row=>{
    const status=row.validUntil&&row.validUntil<today&&["draft","sent"].includes(row.status)?"expired":row.status;
    return {...row,status,totalAmountCents:Number(row.totalAmountCents),items:linesByQuote.get(row.id)??[]} as FinanceQuote;
  })};
}

export async function createFinanceQuote(input:FinanceQuoteInput):Promise<FinanceQuote>{
  if(!validCalendarDate(input.issuedOn))invalid("La data del preventivo non è valida.");
  const validUntil=input.validUntil??null;
  if(validUntil&&(!validCalendarDate(validUntil)||validUntil<input.issuedOn))invalid("La validità non può precedere la data del preventivo.");
  const total=quoteTotal(input.items);
  const id=randomUUID();
  await financeTransaction(async q=>{
    if(!(await q.query("SELECT id FROM admin_finance_clients WHERE id=$1",[input.clientId])).rowCount)invalid("Cliente non trovato.",404);
    const year=Number(input.issuedOn.slice(0,4));
    await q.query("SELECT pg_advisory_xact_lock(7861403,$1)",[year]);
    const sequence=(await q.query(`SELECT COALESCE(max(substring(number from 11)::integer),0)::int AS current
      FROM admin_finance_quotes WHERE number LIKE $1 AND substring(number from 11) ~ '^[0-9]+$'`,
    [`PREV-${year}-%`])).rows[0].current as number;
    const number=`PREV-${year}-${String(Number(sequence)+1).padStart(3,"0")}`;
    await q.query(`INSERT INTO admin_finance_quotes
      (id,client_id,number,issued_on,valid_until,status,total_amount_cents,notes)
      VALUES($1,$2,$3,$4,$5,'draft',$6,$7)`,
    [id,input.clientId,number,input.issuedOn,validUntil,total,input.notes?.trim()??""]);
    await saveQuoteLines(q,id,input.items);
    await financeAudit(q,"quote",id,null,{...input,number,totalAmountCents:total},"Preventivo interno creato");
  });
  const quote=(await financeQuotes()).quotes.find(item=>item.id===id);
  if(!quote)invalid("Il preventivo creato non è stato ricaricato.",500);
  return quote!;
}

export async function updateFinanceQuote(id:string,input:FinanceQuoteUpdate):Promise<FinanceQuote|undefined>{
  const result=await financeTransaction(async q=>{
    const before=await quoteSnapshot(q,id);
    if(!before)return "missing" as const;
    if(before.status!=="draft"||before.validUntil&&before.validUntil<todayRome())invalid("Solo un preventivo in bozza e non scaduto può essere modificato.");
    const nextClient=input.clientId??before.clientId;
    if(!(await q.query("SELECT id FROM admin_finance_clients WHERE id=$1",[nextClient])).rowCount)invalid("Cliente non trovato.",404);
    const validUntil=input.validUntil===undefined?before.validUntil:input.validUntil;
    if(validUntil&&(!validCalendarDate(validUntil)||validUntil<before.issuedOn))invalid("La validità non può precedere la data del preventivo.");
    const notes=input.notes??before.notes;
    const items=input.items??before.items;
    const total=quoteTotal(items);
    await q.query(`UPDATE admin_finance_quotes SET client_id=$2,valid_until=$3,total_amount_cents=$4,notes=$5 WHERE id=$1`,
      [id,nextClient,validUntil,total,notes.trim()]);
    if(input.items)await saveQuoteLines(q,id,input.items);
    await financeAudit(q,"quote",id,before,{...before,clientId:nextClient,validUntil,totalAmountCents:total,notes,items},"Preventivo in bozza aggiornato");
    return "saved" as const;
  });
  if(result==="missing")return undefined;
  return (await financeQuotes()).quotes.find(item=>item.id===id);
}

export async function updateFinanceQuoteStatus(id:string,input:FinanceQuoteStatusInput):Promise<FinanceQuote|undefined>{
  const result=await financeTransaction(async q=>{
    const before=await quoteSnapshot(q,id);
    if(!before)return "missing" as const;
    if(before.status==="accepted")invalid("Un preventivo accettato è collegato al lavoro e non può essere riaperto.");
    if(before.validUntil&&before.validUntil<todayRome())invalid("Il preventivo è scaduto: crea un nuovo preventivo con validità aggiornata.");
    if(input.status==="sent"&&before.status!=="draft"&&before.status!=="sent")invalid("Solo una bozza può essere inviata.");
    if(input.status==="rejected"&&before.status!=="draft"&&before.status!=="sent"&&before.status!=="rejected")invalid("Stato preventivo non valido.");
    await q.query("UPDATE admin_finance_quotes SET status=$2 WHERE id=$1",[id,input.status]);
    await financeAudit(q,"quote",id,before,{...before,status:input.status},"Stato preventivo aggiornato");
    return "saved" as const;
  });
  if(result==="missing")return undefined;
  return (await financeQuotes()).quotes.find(item=>item.id===id);
}

function preparedInstallments(input:FinanceQuoteConversionInput,totalCents:number) {
  let rows=[...input.installments];
  if(input.paymentType==="single"){
    if(input.depositAmountCents!==null||input.installmentCount!==null)invalid("Per la soluzione unica non servono acconto o numero rate.");
    if(!rows.length)rows=[{description:"Saldo lavoro",amountCents:totalCents,dueDate:null}];
    if(rows.length!==1||rows[0].amountCents!==totalCents)invalid("La soluzione unica deve avere una sola scadenza pari al totale.");
  }else if(input.paymentType==="advance"){
    const deposit=input.depositAmountCents;
    if(deposit===null||deposit<=0||deposit>=totalCents||input.installmentCount!==null)invalid("L’acconto deve essere positivo e inferiore al totale.");
    const depositCents=deposit??0;
    if(!rows.length)rows=[
      {description:"Acconto",amountCents:depositCents,dueDate:null},
      {description:"Saldo",amountCents:totalCents-depositCents,dueDate:null},
    ];
    if(rows.length!==2||rows[0].amountCents!==depositCents)invalid("Il piano acconto + saldo deve contenere acconto e saldo.");
  }else{
    if(input.depositAmountCents!==null)invalid("Per il pagamento a rate non indicare un acconto separato.");
    if(input.installmentCount!==null&&(rows.length!==input.installmentCount||input.installmentCount<2))invalid("Il numero indicato deve corrispondere alle rate definite.");
    if(rows.length===0)rows=[{description:"Rate da definire",amountCents:totalCents,dueDate:null}];
  }
  let sum=0;
  for(const row of rows){
    if(!row.description.trim()||!Number.isSafeInteger(row.amountCents)||row.amountCents<=0)invalid("Controlla descrizione e importo di ogni rata.");
    if(row.dueDate&&!validCalendarDate(row.dueDate))invalid("Una delle scadenze indicate non è valida.");
    sum+=row.amountCents;
  }
  if(sum>totalCents)invalid("La somma delle rate supera il totale del preventivo.");
  if(input.paymentType==="single"&&sum!==totalCents)invalid("Il saldo unico deve corrispondere al totale.");
  if(input.paymentType==="advance"&&sum!==totalCents)invalid("Acconto e saldo devono coprire il totale concordato.");
  if(input.paymentType==="installments"&&input.installmentCount!==null&&sum!==totalCents)invalid("Le rate definite devono coprire il totale concordato.");
  if(sum<totalCents)rows.push({description:"Residuo da pianificare",amountCents:totalCents-sum,dueDate:null});
  return rows;
}

export async function convertFinanceQuoteToProject(id:string,input:FinanceQuoteConversionInput){
  const today=todayRome();
  if(input.startDate&&!validCalendarDate(input.startDate))invalid("La data di inizio lavoro non è valida.");
  if(input.deliveryDate&&!validCalendarDate(input.deliveryDate))invalid("La data di consegna non è valida.");
  if(input.startDate&&input.deliveryDate&&input.deliveryDate<input.startDate)invalid("La consegna prevista non può precedere l’inizio.");
  const prepared=await financeTransaction(async q=>{
    const quote=await quoteSnapshot(q,id);
    if(!quote)return "missing" as const;
    if(quote.status==="accepted"){
      const project=(await q.query("SELECT id FROM admin_finance_projects WHERE details->>'sourceQuoteId'=$1",[id])).rows[0];
      if(project)return {conflict:true as const};
      invalid("Preventivo già accettato.");
    }
    if(quote.status==="rejected"||quote.validUntil&&quote.validUntil<today)invalid("Solo un preventivo non scaduto e non rifiutato può diventare lavoro.");
    const client=(await q.query(`SELECT id,name,company_name FROM admin_finance_clients WHERE id=$1 FOR UPDATE`,[quote.clientId])).rows[0];
    if(!client)invalid("Cliente non trovato.",404);
    const installments=preparedInstallments(input,Number(quote.totalAmountCents));
    const projectId=randomUUID();
    const planCount=input.paymentType==="installments"
      ?input.installmentCount??(installments.length>1?installments.length:null):null;
    const details={
      commercialState:"confirmed",agreementConfirmed:true,amountKnown:true,creditReview:false,
      confirmedDate:today,service:input.projectName.trim(),sourceQuoteId:id,
    };
    const serviceDescription=quote.items.map((item:any)=>item.description).join("; ").slice(0,2000);
    await q.query(`INSERT INTO admin_finance_projects
      (id,client_id,client_name,name,total_amount_cents,payment_type,deposit_amount_cents,installment_count,
       work_type,status,start_date,delivery_date,service_description,technical_references,notes,active,details)
      VALUES($1,$2,'',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'{}'::jsonb,$13,true,$14)`,
    [projectId,client.id,input.projectName.trim(),quote.totalAmountCents,input.paymentType,
      input.paymentType==="advance"?input.depositAmountCents:null,planCount,input.workType,input.status,
      input.startDate,input.deliveryDate,serviceDescription,input.notes.trim()||quote.notes,JSON.stringify(details)]);
    const obligationIds:string[]=[];
    for(const [index,row] of installments.entries()){
      const obligationId=randomUUID();
      const category=input.paymentType==="advance"?(index===0?"deposit":"balance")
        :input.paymentType==="single"?"balance":"installment";
      await q.query(`INSERT INTO admin_finance_obligations
        (id,direction,category,description,amount_cents,due_date,client_id,project_id,source_type,source_id)
        VALUES($1,'income',$2,$3,$4,$5,$6,$7,'project_installment',$1)`,
      [obligationId,category,row.description.trim(),row.amountCents,row.dueDate,client.id,projectId]);
      obligationIds.push(obligationId);
    }
    let recurringId:string|null=null;
    if(input.recurring){
      const recurring=input.recurring;
      if(!validCalendarDate(recurring.startDate)||!validCalendarDate(recurring.nextDate)||
        (recurring.endDate&&!validCalendarDate(recurring.endDate))||
        recurring.nextDate<recurring.startDate||
        (recurring.endDate&&(recurring.endDate<recurring.startDate||recurring.nextDate>recurring.endDate))){
        invalid("Controlla decorrenza, prossima scadenza e termine del canone.");
      }
      recurringId=randomUUID();
      await q.query(`INSERT INTO admin_finance_recurring
        (id,project_id,client_id,direction,category,description,amount_cents,start_date,next_date,end_date,interval_months,anchor_day,state)
        VALUES($1,$2,$3,'income','monthly_fee',$4,$5,$6,$7,$8,$9,$10,'active')`,
      [recurringId,projectId,client.id,recurring.description.trim(),recurring.amountCents,
        recurring.startDate,recurring.nextDate,recurring.endDate,recurring.intervalMonths,Number(recurring.startDate.slice(-2))]);
      await financeAudit(q,"recurring",recurringId,null,{...recurring,projectId,clientId:client.id,direction:"income",state:"active"},"Canone avviato da preventivo accettato");
    }
    await q.query("UPDATE admin_finance_quotes SET status='accepted' WHERE id=$1",[id]);
    await financeAudit(q,"project",projectId,null,{quoteId:id,clientId:client.id,name:input.projectName,totalAmountCents:quote.totalAmountCents,
      paymentType:input.paymentType,status:input.status,installmentIds:obligationIds,recurringId},"Lavoro creato da preventivo accettato");
    await financeAudit(q,"quote",id,quote,{status:"accepted",projectId},"Preventivo accettato e convertito in lavoro");
    return {projectId,quoteId:id,createdInstallments:obligationIds.length,recurringId};
  });
  if(prepared==="missing")invalid("Preventivo non trovato.",404);
  if(typeof prepared==="object"&&"conflict" in prepared)invalid("Il preventivo è già stato convertito in un lavoro.",409);
  return prepared;
}

function monthRange(month:string) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))invalid("Seleziona un mese valido.");
  const [year,monthNumber]=month.split("-").map(Number);
  const lastDay=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
  return {start:`${month}-01`,end:`${month}-${String(lastDay).padStart(2,"0")}`};
}

export async function financeSchedule(month:string):Promise<FinanceScheduleResponse>{
  const {start,end}=monthRange(month);
  const ledger=await financeLedgerData(month);
  const items:FinanceScheduleItem[]=[];
  for(const obligation of ledger.obligations){
    const dueDate=obligation.dueDate instanceof Date?obligation.dueDate.toISOString().slice(0,10):obligation.dueDate;
    if(!dueDate||dueDate<start||dueDate>end)continue;
    const status=obligation.remainingCents===0?"paid":obligation.overdue?"overdue"
      :obligation.allocatedCents>0?"partial":"open";
    items.push({
      id:obligation.id,sourceType:obligation.direction==="expense"?"expense":obligation.sourceType==="recurring"?"recurring":"installment",
      dueDate,title:`${obligation.direction==="expense"?"Pagamento":"Incasso"} · ${obligation.description}`,
      clientName:obligation.clientName,amountCents:obligation.remainingCents,status,notes:obligation.projectName??"",
    });
  }
  const [futureRecurring,deliveries,manual]=await Promise.all([
    pool.query(`SELECT r.id,r.direction,r.description,r.amount_cents AS "amountCents",r.next_date::text AS "dueDate",
        COALESCE(NULLIF(c.company_name,''),c.name) AS "clientName"
      FROM admin_finance_recurring r LEFT JOIN admin_finance_clients c ON c.id=r.client_id
      WHERE r.state='active' AND r.next_date BETWEEN $1 AND $2
        AND (r.end_date IS NULL OR r.next_date<=r.end_date)
        AND NOT EXISTS(SELECT 1 FROM admin_finance_obligations o WHERE o.source_type='recurring' AND o.source_id=r.id AND o.due_date=r.next_date)
      ORDER BY r.next_date,r.id`,[start,end]),
    pool.query(`SELECT p.id,p.name,p.delivery_date::text AS "dueDate",p.status,
        COALESCE(NULLIF(c.company_name,''),c.name,p.client_name) AS "clientName"
      FROM admin_finance_projects p LEFT JOIN admin_finance_clients c ON c.id=p.client_id
      WHERE p.delivery_date BETWEEN $1 AND $2 AND COALESCE(p.status,'')<>'cancelled'
      ORDER BY p.delivery_date,p.name`,[start,end]),
    pool.query(`SELECT r.id,r.title,r.due_date::text AS "dueDate",r.client_id AS "clientId",
        COALESCE(NULLIF(c.company_name,''),c.name) AS "clientName",r.project_id AS "projectId",
        r.notes,r.completed_at
      FROM admin_finance_reminders r LEFT JOIN admin_finance_clients c ON c.id=r.client_id
      WHERE r.reminder_type='manual' AND r.due_date BETWEEN $1 AND $2
      ORDER BY r.due_date,r.created_at`,[start,end]),
  ]);
  for(const row of futureRecurring.rows){
    items.push({id:`recurring:${row.id}:${row.dueDate}`,sourceType:"recurring",dueDate:row.dueDate,
      title:`Canone previsto · ${row.description}`,clientName:row.clientName,amountCents:Number(row.amountCents),
      status:"planned",notes:"Scadenza futura: non è ancora venduto né da incassare."});
  }
  for(const row of deliveries.rows){
    const status=row.status==="delivered"||row.status==="closed"?"completed":row.dueDate<todayRome()?"overdue":"open";
    items.push({id:`delivery:${row.id}`,sourceType:"delivery",dueDate:row.dueDate,title:`Consegna lavoro · ${row.name}`,
      clientName:row.clientName,amountCents:null,status,notes:"Data prevista di consegna"});
  }
  for(const row of manual.rows){
    items.push({id:row.id,sourceType:"manual",dueDate:row.dueDate,title:row.title,clientName:row.clientName,
      amountCents:null,status:row.completed_at?"completed":row.dueDate<todayRome()?"overdue":"open",notes:row.notes??""});
  }
  items.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.title.localeCompare(b.title,"it"));
  return {month,items};
}

async function manualReminderById(id:string):Promise<FinanceManualReminder|undefined>{
  const row=(await pool.query(`SELECT r.id,r.title,r.due_date::text AS "dueDate",r.client_id AS "clientId",
      COALESCE(NULLIF(c.company_name,''),c.name) AS "clientName",r.project_id AS "projectId",r.notes,
      (r.completed_at IS NOT NULL) AS completed,r.created_at::text AS "createdAt"
    FROM admin_finance_reminders r LEFT JOIN admin_finance_clients c ON c.id=r.client_id
    WHERE r.id=$1 AND r.reminder_type='manual'`,[id])).rows[0];
  return row as FinanceManualReminder|undefined;
}

export async function createFinanceManualReminder(input:FinanceManualReminderInput){
  if(!validCalendarDate(input.dueDate))invalid("Data promemoria non valida.");
  const id=randomUUID();
  await financeTransaction(async q=>{
    let clientId=input.clientId??null;
    if(input.projectId){
      const project=(await q.query("SELECT client_id FROM admin_finance_projects WHERE id=$1",[input.projectId])).rows[0];
      if(!project)invalid("Lavoro non trovato.",404);
      if(clientId&&clientId!==project.client_id)invalid("Il cliente non coincide con il lavoro.");
      clientId=project.client_id;
    }
    if(clientId&&!(await q.query("SELECT id FROM admin_finance_clients WHERE id=$1",[clientId])).rowCount)invalid("Cliente non trovato.",404);
    await q.query(`INSERT INTO admin_finance_reminders(id,title,reminder_type,due_date,client_id,project_id,generated,notes)
      VALUES($1,$2,'manual',$3,$4,$5,false,$6)`,
    [id,input.title.trim(),input.dueDate,clientId,input.projectId??null,input.notes?.trim()??""]);
    await financeAudit(q,"manual_reminder",id,null,input,"Promemoria manuale creato");
  });
  return manualReminderById(id);
}

export async function updateFinanceManualReminder(id:string,input:FinanceManualReminderUpdate){
  if(input.dueDate&&!validCalendarDate(input.dueDate))invalid("Data promemoria non valida.");
  const exists=await financeTransaction(async q=>{
    const before=(await q.query(`SELECT * FROM admin_finance_reminders WHERE id=$1 AND reminder_type='manual' FOR UPDATE`,[id])).rows[0];
    if(!before)return false;
    const dueDate=input.dueDate??calendarDate(before.due_date);
    const completedAt=input.completed===undefined?before.completed_at:input.completed?new Date():null;
    await q.query("UPDATE admin_finance_reminders SET due_date=$2,completed_at=$3 WHERE id=$1",[id,dueDate,completedAt]);
    await financeAudit(q,"manual_reminder",id,before,{dueDate,completed:!!completedAt},"Promemoria manuale aggiornato");
    return true;
  });
  return exists?manualReminderById(id):undefined;
}
