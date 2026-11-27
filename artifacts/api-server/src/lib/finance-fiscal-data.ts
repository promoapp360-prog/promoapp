import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
import { pool } from "@workspace/db";
import type {
  FinanceFiscalDocument,
  FinanceFiscalDocumentInput,
  FinanceFiscalDocumentVoidInput,
  FinanceIssuerSettings,
  FinanceSettings,
  FinanceSettingsInput,
  FinanceTaxRegime,
} from "@workspace/api-zod";
import {
  financeAudit,
  financeTransaction,
  validCalendarDate,
} from "./admin-finance-data";
import { todayRome } from "./finance-calculations";
import { ObjectStorageService } from "./objectStorage";

const MAX_CENTS=2_147_483_647;
const DEFAULT_PREFIXES={receipt:"RIC",invoice:"FAT"};
const DEFAULT_REGIMES:FinanceTaxRegime[]=[
  {id:"default-receipt-2026",name:"Prestazione con ritenuta d’acconto",regimeType:"withholding",
    documentType:"receipt",effectiveFrom:"2026-01-01",effectiveUntil:"2026-12-31",
    vatRateBps:null,withholdingRateBps:2000,notes:"Impostazione iniziale da verificare con il commercialista."},
  {id:"default-invoice-2027",name:"Società SRLS",regimeType:"vat",documentType:"invoice",
    effectiveFrom:"2027-01-01",effectiveUntil:null,vatRateBps:2200,withholdingRateBps:null,
    notes:"Impostazione iniziale da verificare con il commercialista; nessun invio allo SdI."},
];
const invalid=(message:string,status=400):never=>{throw Object.assign(new Error(message),{status});};
const clean=(value:string|undefined|null)=>value?.trim()??"";
const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
const formatMoney=(cents:number)=>`${new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(cents/100)} €`;
const formatDate=(date:string)=>{const [year,month,day]=date.slice(0,10).split("-");return `${day}/${month}/${year}`;};
const escapeFilename=(value:string)=>value.replace(/[^A-Za-z0-9_-]/g,"-");
const issuerValue=(value:Record<string,unknown>):FinanceIssuerSettings=>({
  taxId:clean(value.taxId as string|undefined),address:clean(value.address as string|undefined),
  postalCode:clean(value.postalCode as string|undefined),city:clean(value.city as string|undefined),
  province:clean(value.province as string|undefined),email:clean(value.email as string|undefined),
  pec:clean(value.pec as string|undefined),sdiCode:clean(value.sdiCode as string|undefined),
});

async function readSettings(q?:{query:(sql:string,values?:unknown[])=>Promise<{rows:any[]}>}):Promise<FinanceSettings>{
  const run=q?.query.bind(q)??pool.query.bind(pool);
  const issuerSql="SELECT value FROM admin_finance_settings WHERE key='issuer'";
  const prefixSql="SELECT value FROM admin_finance_settings WHERE key='document_prefixes'";
  const regimesSql=`SELECT id,name,regime_type AS "regimeType",document_type AS "documentType",
    effective_from::text AS "effectiveFrom",effective_until::text AS "effectiveUntil",
    vat_rate_bps AS "vatRateBps",withholding_rate_bps AS "withholdingRateBps",notes
    FROM admin_finance_tax_regimes WHERE active=true ORDER BY effective_from,id`;
  let issuerRow:{rows:any[]},prefixRow:{rows:any[]},regimeRows:{rows:any[]};
  if(q){
    issuerRow=await run(issuerSql);
    prefixRow=await run(prefixSql);
    regimeRows=await run(regimesSql);
  }else{
    [issuerRow,prefixRow,regimeRows]=await Promise.all([run(issuerSql),run(prefixSql),run(regimesSql)]);
  }
  const issuer=isRecord(issuerRow.rows[0]?.value)?issuerRow.rows[0].value:{};
  const prefixes=isRecord(prefixRow.rows[0]?.value)?prefixRow.rows[0].value:{};
  const regimes=regimeRows.rows.length?regimeRows.rows as FinanceTaxRegime[]:DEFAULT_REGIMES;
  return {
    issuer:issuerValue(issuer),
    prefixes:{
      receipt:clean(prefixes.receipt as string|undefined)||DEFAULT_PREFIXES.receipt,
      invoice:clean(prefixes.invoice as string|undefined)||DEFAULT_PREFIXES.invoice,
    },
    regimes,
  };
}

function validateRegimes(regimes:FinanceTaxRegime[]){
  if(!regimes.length)invalid("Configura almeno un regime fiscale.");
  const sorted=[...regimes].sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom));
  const ids=new Set<string>();
  for(let index=0;index<sorted.length;index++){
    const item=sorted[index];
    if(ids.has(item.id))invalid("Ogni regime fiscale deve avere un identificativo univoco.");
    ids.add(item.id);
    if(!validCalendarDate(item.effectiveFrom)||(item.effectiveUntil&&!validCalendarDate(item.effectiveUntil)))invalid("Una data del regime fiscale non è valida.");
    if(item.effectiveUntil&&item.effectiveUntil<item.effectiveFrom)invalid("La fine del regime deve essere successiva all’inizio.");
    if((item.regimeType==="withholding"&&item.documentType!=="receipt")||(item.regimeType==="vat"&&item.documentType!=="invoice"))invalid("Il tipo di documento non corrisponde al regime fiscale.");
    if(item.regimeType==="withholding"){
      if(item.withholdingRateBps==null||item.vatRateBps!=null)invalid("Per il regime con ritenuta indica la percentuale di ritenuta.");
    }else if(item.vatRateBps==null||item.withholdingRateBps!=null)invalid("Per il regime IVA indica la relativa aliquota.");
    const previous=sorted[index-1];
    if(previous&&(!previous.effectiveUntil||previous.effectiveUntil>=item.effectiveFrom))invalid("I periodi dei regimi fiscali non possono sovrapporsi.");
  }
}

export async function getFinanceSettings():Promise<FinanceSettings>{return readSettings();}

export async function updateFinanceSettings(input:FinanceSettingsInput):Promise<FinanceSettings>{
  validateRegimes(input.regimes);
  const issuer=issuerValue(input.issuer as unknown as Record<string,unknown>);
  const prefixes={receipt:input.prefixes.receipt.trim().toUpperCase(),invoice:input.prefixes.invoice.trim().toUpperCase()};
  return financeTransaction(async q=>{
    await q.query("SELECT pg_advisory_xact_lock(7861410)");
    for(const [key,value] of [["issuer",issuer],["document_prefixes",prefixes]] as const){
      await q.query(`INSERT INTO admin_finance_settings(key,value) VALUES($1,$2)
        ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`,[key,JSON.stringify(value)]);
    }
    const ids=input.regimes.map(item=>item.id);
    await q.query(`UPDATE admin_finance_tax_regimes SET active=false WHERE NOT (id=ANY($1::text[]))`,[ids]);
    for(const regime of input.regimes){
      await q.query(`INSERT INTO admin_finance_tax_regimes
        (id,name,regime_type,document_type,effective_from,effective_until,vat_rate_bps,withholding_rate_bps,active,notes)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,true,$9)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,regime_type=EXCLUDED.regime_type,
          document_type=EXCLUDED.document_type,effective_from=EXCLUDED.effective_from,
          effective_until=EXCLUDED.effective_until,vat_rate_bps=EXCLUDED.vat_rate_bps,
          withholding_rate_bps=EXCLUDED.withholding_rate_bps,active=true,notes=EXCLUDED.notes`,
      [regime.id,regime.name.trim(),regime.regimeType,regime.documentType,regime.effectiveFrom,
        regime.effectiveUntil,regime.vatRateBps,regime.withholdingRateBps,regime.notes.trim()]);
    }
    await financeAudit(q,"finance_settings","fiscal",null,input,"Impostazioni fiscali aggiornate");
    return readSettings(q);
  });
}

function createFiscalPdf(data:{
  document:Pick<FinanceFiscalDocument,"documentType"|"number"|"issuedOn"|"grossAmountCents"|"vatRateBps"|"vatAmountCents"|"withholdingRateBps"|"withholdingAmountCents"|"netAmountCents"|"dueDate"|"description"|"regimeName">;
  issuer:FinanceSettings["issuer"];
  client:{name:string;taxId:string;address:string};
  projectName:string|null;
  voidReason?:string;
}):Promise<Buffer>{
  return new Promise((resolve,reject)=>{
    const pdf=new PDFDocument({size:"A4",margin:48,info:{Title:`${data.document.documentType==="receipt"?"Ricevuta":"Fattura"} ${data.document.number}`,Author:"PromoApp"}});
    const chunks:Buffer[]=[];
    pdf.on("data",(chunk:Buffer)=>chunks.push(Buffer.from(chunk)));
    pdf.on("error",reject);
    pdf.on("end",()=>resolve(Buffer.concat(chunks)));
    const {document,issuer,client}=data;
    pdf.font("Helvetica-Bold").fontSize(22).fillColor("#3f32b7").text("PromoApp",{continued:false});
    pdf.font("Helvetica").fontSize(9).fillColor("#475569");
    const issuerLines=[issuer.address,`${issuer.postalCode} ${issuer.city}${issuer.province?` (${issuer.province})`:""}`,
      issuer.taxId?`CF / P. IVA: ${issuer.taxId}`:"",issuer.email?`Email: ${issuer.email}`:"",
      issuer.pec?`PEC: ${issuer.pec}`:"",issuer.sdiCode?`Codice destinatario: ${issuer.sdiCode}`:""].filter(Boolean);
    if(issuerLines.length)pdf.text(issuerLines.join("\n"));
    pdf.moveDown(1.5);
    pdf.font("Helvetica-Bold").fontSize(20).fillColor("#0f172a")
      .text(`${document.documentType==="receipt"?"Ricevuta":"Fattura"} ${document.number}`);
    pdf.font("Helvetica").fontSize(10).fillColor("#475569").text(`Data documento: ${formatDate(document.issuedOn)}`);
    pdf.moveDown(1.2);
    pdf.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Cliente");
    pdf.font("Helvetica").fontSize(10).fillColor("#334155")
      .text([client.name,client.address,`CF / P. IVA: ${client.taxId}`].filter(Boolean).join("\n"));
    if(data.projectName){pdf.moveDown(.7);pdf.font("Helvetica-Bold").text("Lavoro");pdf.font("Helvetica").text(data.projectName);}
    pdf.moveDown(1.2);
    pdf.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Descrizione");
    pdf.font("Helvetica").fontSize(10).fillColor("#334155").text(document.description,{width:500});
    pdf.moveDown(1);
    pdf.strokeColor("#cbd5e1").moveTo(48,pdf.y).lineTo(547,pdf.y).stroke();
    pdf.moveDown(.6);
    const row=(label:string,value:string,bold=false)=>{
      const y=pdf.y;
      pdf.font(bold?"Helvetica-Bold":"Helvetica").fontSize(11).fillColor(bold?"#0f172a":"#334155")
        .text(label,48,y,{width:340});
      pdf.text(value,390,y,{width:157,align:"right"});
      pdf.moveDown(.55);
    };
    if(document.documentType==="receipt"){
      row("Compenso lordo",formatMoney(document.grossAmountCents));
      row(`Ritenuta d’acconto (${((document.withholdingRateBps??0)/100).toLocaleString("it-IT")}%)`,`− ${formatMoney(document.withholdingAmountCents)}`);
      row("Netto da corrispondere",formatMoney(document.netAmountCents),true);
    }else{
      row("Imponibile",formatMoney(document.grossAmountCents));
      row(`IVA (${((document.vatRateBps??0)/100).toLocaleString("it-IT")}%)`,formatMoney(document.vatAmountCents));
      row("Totale documento",formatMoney(document.netAmountCents),true);
    }
    if(document.dueDate){pdf.moveDown(.3);pdf.font("Helvetica").fontSize(10).fillColor("#334155").text(`Scadenza: ${formatDate(document.dueDate)}`);}
    pdf.moveDown(1.2);
    pdf.font("Helvetica").fontSize(8).fillColor("#64748b").text(`Regime applicato: ${document.regimeName}. Documento predisposto dal gestionale PromoApp; verificare i dati con il commercialista.`);
    if(document.documentType==="invoice")pdf.text("Documento PDF archiviato nel gestionale; non inviato al Sistema di Interscambio.");
    if(data.voidReason){
      pdf.moveDown(1);
      pdf.font("Helvetica-Bold").fontSize(18).fillColor("#b91c1c").text("ANNULLATO",{align:"center"});
      pdf.font("Helvetica").fontSize(10).text(data.voidReason,{align:"center"});
    }
    pdf.end();
  });
}

async function uploadPdf(buffer:Buffer):Promise<string>{
  const storage=new ObjectStorageService();
  const uploadURL=await storage.getObjectEntityUploadURL();
  const objectPath=storage.normalizeObjectEntityPath(uploadURL);
  const response=await fetch(uploadURL,{method:"PUT",headers:{"Content-Type":"application/pdf"},body:buffer});
  if(!response.ok)invalid(`Archiviazione PDF non riuscita (HTTP ${response.status}).`,502);
  return objectPath;
}

async function cleanupPdf(path:string|undefined){
  if(!path)return;
  try{await (await new ObjectStorageService().getObjectEntityFile(path)).delete();}
  catch{/* La transazione non deve lasciare metadati se il file non può essere rimosso. */}
}

async function fiscalDocumentRows(id?:string):Promise<FinanceFiscalDocument[]>{
  const rows=(await pool.query(`SELECT d.id,d.client_id AS "clientId",
      COALESCE(NULLIF(c.company_name,''),c.name) AS "clientName",d.project_id AS "projectId",p.name AS "projectName",
      d.details->>'obligationId' AS "obligationId",d.document_type AS "documentType",d.fiscal_year AS "fiscalYear",
      d.number,d.issued_on::text AS "issuedOn",
      CASE WHEN d.status='void' THEN 'void'
        WHEN o.id IS NOT NULL AND COALESCE(a.allocated_cents,0)>=o.amount_cents THEN 'paid'
        ELSE 'issued' END AS status,
      d.gross_amount_cents AS "grossAmountCents",d.vat_rate_bps AS "vatRateBps",d.vat_amount_cents AS "vatAmountCents",
      d.withholding_rate_bps AS "withholdingRateBps",d.withholding_amount_cents AS "withholdingAmountCents",
      d.net_amount_cents AS "netAmountCents",d.details->>'dueDate' AS "dueDate",
      COALESCE(d.details->>'description','') AS description,d.created_at AS "createdAt",
      COALESCE(d.details->>'regimeName','') AS "regimeName"
    FROM admin_finance_documents d
    JOIN admin_finance_clients c ON c.id=d.client_id
    LEFT JOIN admin_finance_projects p ON p.id=d.project_id
    LEFT JOIN admin_finance_obligations o ON o.id=d.details->>'obligationId'
    LEFT JOIN LATERAL (
      SELECT COALESCE(sum(ma.amount_cents),0)::int AS allocated_cents
      FROM admin_finance_movement_allocations ma WHERE ma.obligation_id=o.id
    ) a ON true
    WHERE ($1::text IS NULL OR d.id=$1)
    ORDER BY d.issued_on DESC,d.created_at DESC`,[id??null])).rows;
  return rows.map(row=>({...row,fiscalYear:Number(row.fiscalYear),grossAmountCents:Number(row.grossAmountCents),
    vatAmountCents:Number(row.vatAmountCents),withholdingAmountCents:Number(row.withholdingAmountCents),
    netAmountCents:Number(row.netAmountCents)})) as FinanceFiscalDocument[];
}

export async function listFinanceFiscalDocuments(){return {documents:await fiscalDocumentRows()};}

export async function issueFinanceFiscalDocument(input:FinanceFiscalDocumentInput):Promise<FinanceFiscalDocument|undefined>{
  if(!validCalendarDate(input.issuedOn)||input.issuedOn>todayRome())invalid("La data del documento deve essere valida e non futura.");
  if(input.dueDate&&(!validCalendarDate(input.dueDate)||input.dueDate<input.issuedOn))invalid("La scadenza non può precedere la data del documento.");
  let uploadedPath:string|undefined;
  const id=randomUUID();
  try{
    await financeTransaction(async q=>{
      await q.query("SELECT pg_advisory_xact_lock(7861411)");
      const settings=await readSettings(q);
      const selectedRegime=settings.regimes.find(item=>item.effectiveFrom<=input.issuedOn&&(!item.effectiveUntil||item.effectiveUntil>=input.issuedOn));
      if(!selectedRegime)throw Object.assign(new Error("Nessun regime fiscale copre la data del documento. Aggiorna le impostazioni."),{status:400});
      const regime=selectedRegime;
      const issuer=settings.issuer;
      if(!issuer.taxId||!issuer.address||!issuer.postalCode||!issuer.city)invalid("Completa CF/P. IVA, indirizzo, CAP e città di PromoApp nelle impostazioni fiscali.");
      const client=(await q.query(`SELECT id,name,company_name,tax_id,address FROM admin_finance_clients WHERE id=$1 FOR UPDATE`,[input.clientId])).rows[0];
      if(!client)invalid("Cliente non trovato.",404);
      if(!client.tax_id||!client.address)invalid("Completa CF/P. IVA e indirizzo del cliente prima di emettere il documento.");
      let projectName:string|null=null;
      if(input.projectId){
        const project=(await q.query("SELECT id,name,client_id FROM admin_finance_projects WHERE id=$1 FOR UPDATE",[input.projectId])).rows[0];
        if(!project||project.client_id!==input.clientId)invalid("Il lavoro selezionato non appartiene al cliente.",404);
        projectName=project.name;
      }
      const vatRateBps=regime.regimeType==="vat"?regime.vatRateBps:null;
      const withholdingRateBps=regime.regimeType==="withholding"?regime.withholdingRateBps:null;
      const vatAmountCents=vatRateBps==null?0:Math.round(input.grossAmountCents*vatRateBps/10000);
      const withholdingAmountCents=withholdingRateBps==null?0:Math.round(input.grossAmountCents*withholdingRateBps/10000);
      const netAmountCents=input.grossAmountCents+vatAmountCents-withholdingAmountCents;
      if(netAmountCents<=0||netAmountCents>MAX_CENTS)invalid("Il netto del documento deve essere positivo e non superare il limite gestibile.");
       let originalObligationAmountCents:number|null=null;
       let originalObligationDueDate:string|null=null;
      if(input.obligationId){
        const obligation=(await q.query(`SELECT id,direction,amount_cents AS amount,client_id AS "clientId",project_id AS "projectId",due_date::text AS "dueDate"
          FROM admin_finance_obligations WHERE id=$1 FOR UPDATE`,[input.obligationId])).rows[0];
        if(!obligation||obligation.direction!=="income"||obligation.clientId!==input.clientId)invalid("La scadenza deve essere un incasso aperto dello stesso cliente.",404);
        if(input.projectId&&obligation.projectId!==input.projectId)invalid("La scadenza non appartiene al lavoro selezionato.");
        if(Number(obligation.amount)!==input.grossAmountCents)invalid("L’importo lordo deve coincidere con la scadenza selezionata.");
         const allocated=Number((await q.query("SELECT COALESCE(sum(amount_cents),0)::int AS amount FROM admin_finance_movement_allocations WHERE obligation_id=$1",[input.obligationId])).rows[0].amount);
         if(allocated>netAmountCents)invalid("Gli incassi già registrati superano il netto del documento; correggi le allocazioni prima di collegarlo.");
        if((await q.query(`SELECT id FROM admin_finance_documents
          WHERE status<>'void' AND details->>'obligationId'=$1 LIMIT 1`,[input.obligationId])).rowCount)invalid("Esiste già un documento attivo collegato a questa scadenza.");
        originalObligationAmountCents=Number(obligation.amount);
         originalObligationDueDate=obligation.dueDate;
        await q.query("UPDATE admin_finance_obligations SET amount_cents=$2,due_date=COALESCE($3,due_date) WHERE id=$1",
          [input.obligationId,netAmountCents,input.dueDate??null]);
        await financeAudit(q,"finance_obligation",input.obligationId,{amountCents:originalObligationAmountCents},
          {amountCents:netAmountCents,documentId:id},"Scadenza aggiornata al totale effettivamente dovuto nel documento fiscale");
      }
      const fiscalYear=Number(input.issuedOn.slice(0,4));
      const prefix=regime.documentType==="receipt"?settings.prefixes.receipt:settings.prefixes.invoice;
      const sequence=(await q.query(`INSERT INTO admin_finance_document_sequences
          (id,document_type,fiscal_year,next_number,prefix)
        VALUES($1,$2,$3,2,$4)
        ON CONFLICT(document_type,fiscal_year) DO UPDATE
          SET next_number=admin_finance_document_sequences.next_number+1,prefix=EXCLUDED.prefix,updated_at=now()
        RETURNING next_number-1 AS number,prefix`,[randomUUID(),regime.documentType,fiscalYear,prefix])).rows[0];
      const number=`${sequence.prefix}-${fiscalYear}-${String(sequence.number).padStart(3,"0")}`;
      const model:FinanceFiscalDocument={
        id,clientId:client.id,clientName:client.company_name||client.name,projectId:input.projectId??null,
        projectName,obligationId:input.obligationId??null,documentType:regime.documentType as FinanceFiscalDocument["documentType"],
        fiscalYear,number,issuedOn:input.issuedOn,status:"issued",grossAmountCents:input.grossAmountCents,
        vatRateBps,vatAmountCents,withholdingRateBps,withholdingAmountCents,netAmountCents,
        dueDate:input.dueDate??null,description:input.description.trim(),createdAt:new Date(),regimeName:regime.name,
      };
      const pdf=await createFiscalPdf({document:model,issuer,client:{name:model.clientName,taxId:client.tax_id,address:client.address},
        projectName});
      uploadedPath=await uploadPdf(pdf);
      const details={description:model.description,dueDate:model.dueDate,regimeName:regime.name,
        obligationId:input.obligationId??null,originalObligationAmountCents,originalObligationDueDate,issuer,clientSnapshot:{name:model.clientName,taxId:client.tax_id,address:client.address},
        projectName,notes:input.notes?.trim()??""};
      await q.query(`INSERT INTO admin_finance_documents
        (id,client_id,project_id,document_type,fiscal_year,number,issued_on,status,gross_amount_cents,
         vat_rate_bps,vat_amount_cents,withholding_rate_bps,withholding_amount_cents,net_amount_cents,storage_path,details)
        VALUES($1,$2,$3,$4,$5,$6,$7,'issued',$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id,input.clientId,input.projectId??null,regime.documentType,fiscalYear,number,input.issuedOn,input.grossAmountCents,
        vatRateBps,vatAmountCents,withholdingRateBps,withholdingAmountCents,netAmountCents,uploadedPath,JSON.stringify(details)]);
      await financeAudit(q,"fiscal_document",id,null,{...model,storagePath:uploadedPath},"Documento fiscale generato e archiviato");
    });
  }catch(error){await cleanupPdf(uploadedPath);throw error;}
  return (await fiscalDocumentRows(id))[0];
}

export async function voidFinanceFiscalDocument(id:string,input:FinanceFiscalDocumentVoidInput):Promise<FinanceFiscalDocument|undefined>{
  const document=(await fiscalDocumentRows(id))[0];
  if(!document)throw Object.assign(new Error("Documento fiscale non trovato."),{status:404});
  let uploadedPath:string|undefined,previousPath:string|undefined;
  try{
    await financeTransaction(async q=>{
      const row=(await q.query("SELECT * FROM admin_finance_documents WHERE id=$1 FOR UPDATE",[id])).rows[0];
      if(!row)invalid("Documento fiscale non trovato.",404);
      if(row.status==="void")return;
      const details=isRecord(row.details)?row.details:{};
      const obligationId=typeof details.obligationId==="string"?details.obligationId:null;
      if(obligationId){
        const allocations=Number((await q.query("SELECT COALESCE(sum(amount_cents),0)::int AS amount FROM admin_finance_movement_allocations WHERE obligation_id=$1",[obligationId])).rows[0].amount);
        const original=Number(details.originalObligationAmountCents);
        if(!Number.isInteger(original)||original<=0)invalid("Non puoi annullare: manca l’importo originario della scadenza.",409);
        if(allocations>original)invalid("Non puoi annullare: gli incassi collegati superano l’importo originario della scadenza. Registra prima una rettifica.");
        await q.query("UPDATE admin_finance_obligations SET amount_cents=$2,due_date=$3::date WHERE id=$1",
          [obligationId,original,details.originalObligationDueDate??null]);
      }
      const issuer=isRecord(details.issuer)?issuerValue(details.issuer):null;
      const clientSnapshot=isRecord(details.clientSnapshot)?details.clientSnapshot:null;
      if(!issuer||!clientSnapshot)throw Object.assign(new Error("Impossibile annullare: i dati originali del documento non sono disponibili."),{status:409});
      const updated={...details,voidReason:input.reason.trim(),voidedAt:new Date().toISOString()};
      const pdf=await createFiscalPdf({
        document,issuer,
        client:{name:String(clientSnapshot.name??""),taxId:String(clientSnapshot.taxId??""),address:String(clientSnapshot.address??"")},
        projectName:document.projectName,voidReason:input.reason.trim(),
      });
      uploadedPath=await uploadPdf(pdf);
      previousPath=row.storage_path;
      await q.query("UPDATE admin_finance_documents SET status='void',details=$2,storage_path=$3 WHERE id=$1",
        [id,JSON.stringify(updated),uploadedPath]);
      await financeAudit(q,"fiscal_document",id,row,{status:"void",reason:input.reason.trim()},"Documento fiscale annullato; PDF aggiornato e numerazione conservata");
    });
  }catch(error){await cleanupPdf(uploadedPath);throw error;}
  if(uploadedPath&&previousPath)await cleanupPdf(previousPath);
  return (await fiscalDocumentRows(id))[0];
}

export async function financeFiscalDocumentFile(id:string){
  const row=(await pool.query(`SELECT storage_path AS "storagePath",number,status,details
    FROM admin_finance_documents WHERE id=$1`,[id])).rows[0];
  if(!row)invalid("Documento fiscale non trovato.",404);
  if(!row.storagePath)invalid("PDF del documento non disponibile.",404);
  const file=await new ObjectStorageService().getObjectEntityFile(row.storagePath);
  return {file,filename:`promoapp-${escapeFilename(row.number)}${row.status==="void"?"-annullato":""}.pdf`};
}
