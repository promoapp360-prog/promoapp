import { Router } from "express";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import {
  GetFinanceWorkspaceResponse, GetFinanceImportPreviewResponse,
  SaveFinanceRecurringBody, GenerateFinanceRecurringParams, GenerateFinanceRecurringBody, GetFinanceReminderParams,
  RequestFinanceDocumentBody, DownloadFinanceDocumentParams,
  PreviewFinanceTransactionsBody,
  TransferDevelopmentFinanceBody,
} from "@workspace/api-zod";
import { pool } from "@workspace/db";
import {
  adminFinanceData, financeWorkspace, saveRecurring, generateRecurring, importDevelopmentFinance, validCalendarDate,
} from "../lib/admin-finance-data";
import { eligibleIncome, todayRome } from "../lib/finance-calculations";
import { buildFinanceImportPreview } from "../lib/finance-import-preview";
import { ObjectStorageService } from "../lib/objectStorage";

const storage = new ObjectStorageService();
export function createFinanceToolsRouter() {
  const router=Router();
  router.post("/admin/finance/import-transactions/preview",async(req,res):Promise<void>=>{
    const body=PreviewFinanceTransactionsBody.safeParse(req.body);
    if(!body.success){res.status(400).json({message:"Controlla le transazioni: massimo 500 righe, importi positivi in centesimi e valuta EUR/USD."});return;}
    const data=await adminFinanceData.list(todayRome().slice(0,7));
    const references=new Set<string>();
    const rows=body.data.rows.map((r,i)=>{
      const anomalies:string[]=[];
      if(!r.date||!validCalendarDate(r.date))anomalies.push("Data effettiva mancante o non valida.");
      if(!r.reference.trim())anomalies.push("Riferimento univoco assente: verificare duplicazioni.");
      else if(references.has(r.reference))anomalies.push("Riferimento ripetuto nel file.");
      references.add(r.reference);
      if(r.originalCents==null||r.euroCents==null)anomalies.push("Importo originale o addebito euro non noto: nessuna conversione presunta.");
      if(!r.supplier.trim())anomalies.push("Fornitore mancante.");
      const matches=data.entries.filter(e=>(
        (r.reference&&e.details?.externalReference===r.reference)||
        (r.euroCents===e.amountCents&&r.date===e.details?.paidDate&&r.supplier.trim().toLowerCase()===e.details?.supplier?.trim().toLowerCase())
      ));
      if(matches.length>1)anomalies.push("Più movimenti compatibili: revisione manuale.");
      if(matches.some(e=>e.details?.cancelled))anomalies.push("Movimento già annullato: valuta il ripristino, non creare una seconda registrazione.");
      if(matches.some(e=>e.amountCents!==r.euroCents||(e.details?.currency??"EUR")!==r.currency))anomalies.push("Il riferimento esiste con importo o valuta differenti: serve riconciliazione esplicita.");
      return {key:r.reference||`riga-${i+1}`,name:`${r.supplier||"Fornitore da verificare"} · ${r.date||"Data mancante"}`,
        action:anomalies.length?"review":matches.length?"unchanged":"create",aliases:[],anomalies,
        proposed:{...r,matchedEntryIds:matches.map(e=>e.id),financialTransactions:"Transazione reale proposta, non importata"}} as const;
    });
    res.json(GetFinanceImportPreviewResponse.parse({blocked:true,rows,warnings:["Nessuna scrittura eseguita. Gli importi euro devono essere quelli realmente addebitati.","Il confronto non autorizza importazione definitiva, conversioni presunte o generazione di pagamenti dai totali."]}));
  });
  router.post("/admin/finance/development-transfer",async(req,res):Promise<void>=>{
    const body=TransferDevelopmentFinanceBody.safeParse(req.body);
    if(!body.success){
      res.status(400).json({message:"File di trasferimento non valido: ricarica il file generato dall’archivio di sviluppo."});
      return;
    }
    const imported=await importDevelopmentFinance(body.data);
    if(!imported){
      res.status(409).json({message:"Il database contiene già dati contabili. Nessuna voce è stata modificata o duplicata."});
      return;
    }
    res.status(201).json(imported);
  });
  router.get("/admin/finance/workspace",async (_req,res):Promise<void>=>{
    res.json(GetFinanceWorkspaceResponse.parse(await financeWorkspace()));
  });
  router.post("/admin/finance/recurring",async (req,res):Promise<void>=>{
    const body=SaveFinanceRecurringBody.safeParse(req.body);
    if(!body.success) {res.status(400).json({message:"Controlla importo, frequenza, date e stato della ricorrenza."});return;}
    res.json(await saveRecurring(body.data));
  });
  router.post("/admin/finance/recurring/:id/generate",async (req,res):Promise<void>=>{
    const params=GenerateFinanceRecurringParams.safeParse(req.params);
    const body=GenerateFinanceRecurringBody.safeParse(req.body);
    if(!params.success||!body.success){res.status(400).json({message:"Ricorrenza o data non valida."});return;}
    res.json(await generateRecurring(params.data.id,body.data.dueDate));
  });
  router.get("/admin/finance/import-preview",async (_req,res):Promise<void>=>{
    const [data,workspace]=await Promise.all([adminFinanceData.list(todayRome().slice(0,7)),financeWorkspace()]);
    res.json(GetFinanceImportPreviewResponse.parse(buildFinanceImportPreview(data,workspace)));
  });
  router.post("/admin/finance/import-preview",(_req,res)=>{
    res.status(423).json({message:"Importazione definitiva bloccata: serve approvazione esplicita del dettaglio e verifica delle protezioni gestite. Nessun dato importato."});
  });
  router.get("/admin/finance/reminders/:id",async (req,res):Promise<void>=>{
    const params=GetFinanceReminderParams.safeParse(req.params);
    if(!params.success){res.status(400).json({message:"Movimento non valido."});return;}
    const data=await adminFinanceData.list(todayRome().slice(0,7));
    const e=data.entries.find(e=>e.id===params.data.id);
    if(!e || e.paidAt || e.dueDate.toISOString().slice(0,10)>=todayRome() || !eligibleIncome(e,data.projects)){
      res.status(409).json({message:"Sollecito bloccato: credito non confermato, annullato, già pagato o non scaduto."});return;
    }
    const p=data.projects.find(p=>p.id===e.projectId);
    const amount=e.details?.recurringId||e.category==="monthly_fee"||!e.projectId?e.amountCents:Math.min(e.amountCents,p?.outstandingCents??0);
    res.json({text:`Buongiorno, vi ricordiamo la scadenza del ${e.dueDate.toLocaleDateString("it-IT",{timeZone:"UTC"})} per ${e.description}: ${new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(amount/100)} ancora da riscuotere. Se avete già pagato, vi chiediamo di inviarci il riferimento per la riconciliazione. Grazie, PromoApp.`});
  });
  router.get("/admin/finance/export",async (req,res):Promise<void>=>{
    const format=req.query.format??"csv";
    if(format!=="csv" && format!=="xlsx"){res.status(400).json({message:"Formato non valido."});return;}
    const [data,workspace,audit]=await Promise.all([adminFinanceData.list(todayRome().slice(0,7)),financeWorkspace(),
      pool.query(`SELECT entity_type,entity_id,actor,reason,before,after,created_at FROM admin_finance_audit ORDER BY created_at`)]);
    const sheets: Record<string,Record<string,unknown>[]> = {
      Clienti: data.clients.map(c=>({...c,details:JSON.stringify(c.details)})),
      Fornitori: workspace.suppliers.map(s=>({...s})),
      Lavori: data.projects.map(p=>({...p,details:JSON.stringify(p.details)})),
      Movimenti: data.entries.map(e=>({...e,dueDate:e.dueDate.toISOString().slice(0,10),details:JSON.stringify(e.details)})),
      Ricorrenze: workspace.recurring.map(r=>({...r})),
      Rettifiche: audit.rows.map(r=>({...r,before:JSON.stringify(r.before),after:JSON.stringify(r.after)})),
    };
    const safe=(v:unknown)=>{const s=v instanceof Date?v.toISOString():String(v??"");return /^[=+\-@\t\r\n]/.test(s)?`'${s}`:s;};
    if(format==="csv"){
      const rows:string[][]=[];
      for(const [name,items] of Object.entries(sheets)){
        rows.push([name]); if(!items.length){rows.push(["Nessun record"]);continue;}
        const keys=Object.keys(items[0]); rows.push(keys,...items.map(item=>keys.map(k=>safe(item[k])))); rows.push([]);
      }
      res.setHeader("Content-Disposition",'attachment; filename="promoapp-controllo-economico.csv"');
      res.type("text/csv; charset=utf-8").send("\uFEFF"+rows.map(row=>row.map(s=>`"${s.replaceAll('"','""')}"`).join(";")).join("\r\n"));return;
    }
    const book=new ExcelJS.Workbook();
    for(const [name,items] of Object.entries(sheets)){
      const sheet=book.addWorksheet(name); if(!items.length){sheet.addRow(["Nessun record"]);continue;}
      const keys=Object.keys(items[0]);sheet.addRow(keys);
      for(const row of items)sheet.addRow(keys.map(k=>typeof row[k]==="number"?row[k]:safe(row[k])));
      sheet.views=[{state:"frozen",ySplit:1}];
    }
    res.setHeader("Content-Disposition",'attachment; filename="promoapp-controllo-economico.xlsx"');
    res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await book.xlsx.write(res);res.end();
  });
  router.post("/admin/finance/documents",async (req,res):Promise<void>=>{
    const body=RequestFinanceDocumentBody.safeParse(req.body);
    if(!body.success){res.status(400).json({message:"Carica PDF, immagini o CSV, massimo 10 MB."});return;}
    const uploadURL=await storage.getObjectEntityUploadURL();
    res.json({uploadURL,objectPath:storage.normalizeObjectEntityPath(uploadURL)});
  });
  router.get("/admin/finance/documents/:id",async (req,res):Promise<void>=>{
    const params=DownloadFinanceDocumentParams.safeParse(req.params);
    if(!params.success){res.status(400).json({message:"Documento non valido."});return;}
    const file=await storage.getObjectEntityFile(`/objects/uploads/${params.data.id}`);
    const [metadata]=await file.getMetadata();
    res.setHeader("Content-Disposition",`attachment; filename="documento-${params.data.id}"`);
    res.setHeader("Content-Type",metadata.contentType??"application/octet-stream");
    res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Cache-Control","private, no-store");
    const response=await storage.downloadObject(file,0);
    if(response.body) Readable.fromWeb(response.body as import("node:stream/web").ReadableStream).on("error",err=>res.destroy(err)).pipe(res);
    else res.end();
  });
  return router;
}
