import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import express from "express";
import { pool } from "@workspace/db";
import { createAdminAuthorization } from "../src/middlewares/adminAuthorization";
import { createAdminFinanceRouter } from "../src/routes/admin-finance";
import lavoriRouter from "../src/routes/lavori";
import { categoryMatchesDirection, nextMonthlyDate } from "../src/lib/admin-finance-data";
import { todayRome } from "../src/lib/finance-calculations";
import { CreateAdminFinanceEntryBody, UpdateAdminFinanceEntryBody, CreateAdminFinanceProjectBody } from "@workspace/api-zod";
import { ObjectStorageService } from "../src/lib/objectStorage";
import { logger } from "../src/lib/logger";

test("moneta intera, patch parziali e calendario delle ricorrenze",()=>{
  assert.equal(nextMonthlyDate("2028-01-31",31),"2028-02-29");
  assert.equal(nextMonthlyDate("2028-02-29",31),"2028-03-31");
  assert.equal(nextMonthlyDate("2026-11-30",30,3),"2027-02-28");
  const base={direction:"expense",category:"replit",description:"test",amountCents:100,dueDate:"2026-11-25"};
  for(const amountCents of [1.5,-1,0,2147483648,"100"]){
    assert.equal(CreateAdminFinanceEntryBody.safeParse({...base,amountCents}).success,false);
  }
  const patch=UpdateAdminFinanceEntryBody.parse({details:{notes:"Rettifica nota"}});
  assert.deepEqual(patch.details,{notes:"Rettifica nota"});
  assert.equal(CreateAdminFinanceEntryBody.safeParse({...base,details:{originalCents:1.5}}).success,false);
  assert.equal(CreateAdminFinanceEntryBody.safeParse({direction:"income",category:"installment",description:"Rata",amountCents:100,dueDate:"2026-11-25"}).success,true);
  assert.equal(categoryMatchesDirection("income","installment"),true);
  assert.equal(categoryMatchesDirection("expense","installment"),false);
  assert.equal(CreateAdminFinanceProjectBody.safeParse({clientId:randomUUID(),name:"test",totalAmountCents:100,paymentType:"installments",installmentCount:null}).success,true);
});

test("controllo economico persistente e protetto, senza modifiche ai servizi pubblici",async t=>{
  assert.notEqual(process.env.NODE_ENV,"production","I test di scrittura sono consentiti solo in sviluppo.");
  const prefix=`__finance_test_${randomUUID()}`;
  const password="Synthetic-economic-password";
  const app=express();app.use(express.json({limit:"2mb"}));
  app.use((req,_res,next)=>{req.log=logger;next();});
  app.use(createAdminAuthorization(()=>password,()=>"Synthetic-economic-signing-key"));
  app.use(createAdminFinanceRouter());app.use(lavoriRouter);
  const server=app.listen(0,"127.0.0.1");
  await new Promise<void>(resolve=>server.once("listening",resolve));
  const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
   let cookie="",csrf="",documentPath="",quoteId="",quoteProjectId="",quoteRecurringId="",manualReminderId="",fiscalDocumentId="";
   let ledgerClientId="",ledgerProjectId="",ledgerAccountId="",reportExpenseObligationId="",unallocatedMovementId="",integrityDocumentId="";
   const fiscalDocumentIds:string[]=[];
  let fiscalSettingsSnapshot:{settings:any[];regimes:any[];sequences:any[];regimeIds:string[]}|null=null;
  const fiscalTestTaxId=`TEST${randomUUID().replaceAll("-","").slice(0,16)}`;
  const request=async(path:string,method="GET",body?:unknown,authorized=true)=>{
    return fetch(`${url}${path}`,{method,signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json",...(authorized?{cookie,"x-admin-csrf":csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  };
  const json=async(path:string,method="GET",body?:unknown)=>{
    const response=await request(path,method,body);
    assert.ok(response.ok,`${method} ${path}: HTTP ${response.status}`);
    return response.status===204?null:response.json() as Promise<any>;
  };
  const today=todayRome(),month=today.slice(0,7);
  const legacyId=randomUUID(),accontoId=randomUUID();
  try{
    await t.test("tutte le risorse economiche richiedono accesso e protezione CSRF",async()=>{
       for(const path of ["/admin/finance?month="+month,"/admin/finance/workspace","/admin/finance/suppliers","/admin/finance/import-preview","/admin/finance/development-transfer","/admin/finance/export?format=xlsx","/admin/finance/reports?periodType=month&period="+month,"/admin/finance/verification",`/admin/finance/documents/${randomUUID()}`,"/admin/finance/quotes","/admin/finance/schedule?month="+month,"/admin/finance/settings","/admin/finance/fiscal-documents"]){
        assert.equal((await request(path,"GET",undefined,false)).status,401);
      }
      const login=await request("/admin/login","POST",{password},false);
      assert.equal(login.status,200);cookie=login.headers.get("set-cookie")!.split(";")[0];csrf=(await login.json() as any).csrfToken;
      const rejected=await fetch(`${url}/admin/finance/clients`,{method:"POST",headers:{cookie,"Content-Type":"application/json"},body:JSON.stringify({name:prefix})});
      assert.equal(rejected.status,403);
    });
    const customer=await json("/admin/finance/clients","POST",{name:prefix,details:{aliases:[`${prefix}-alias`],acquisitionSource:"Facebook",acquisitionDate:today}});
    await t.test("il trasferimento richiede file valido e non sovrascrive un archivio popolato",async()=>{
      const before=(await pool.query(`SELECT
        (SELECT count(*)::int FROM admin_finance_clients) AS clients,
        (SELECT count(*)::int FROM admin_finance_projects) AS projects,
        (SELECT count(*)::int FROM admin_finance_entries) AS entries,
        (SELECT count(*)::int FROM admin_finance_recurring) AS recurring,
        (SELECT count(*)::int FROM admin_finance_suppliers) AS suppliers`)).rows[0];
      assert.equal((await request("/admin/finance/development-transfer","POST",{transferId:"wrong"})).status,400);
      const response=await request("/admin/finance/development-transfer","POST",{
        transferId:"promoapp-dev-finance-2026-11",sourceEnvironment:"development",
        clients:[],projects:[],recurring:[],suppliers:[],
      });
      if(Object.values(before as Record<string,number>).some(count=>count>0)) assert.equal(response.status,409);
      else assert.equal(response.status,201);
      const after=(await pool.query(`SELECT
        (SELECT count(*)::int FROM admin_finance_clients) AS clients,
        (SELECT count(*)::int FROM admin_finance_projects) AS projects,
        (SELECT count(*)::int FROM admin_finance_entries) AS entries,
        (SELECT count(*)::int FROM admin_finance_recurring) AS recurring,
        (SELECT count(*)::int FROM admin_finance_suppliers) AS suppliers`)).rows[0];
      assert.deepEqual(after,before);
    });
    const project=await json("/admin/finance/projects","POST",{clientId:customer.id,name:prefix,totalAmountCents:100000,paymentType:"installments",installmentCount:null});
    const paid=await json("/admin/finance/entries","POST",{direction:"income",category:"deposit",projectId:project.id,description:prefix,amountCents:20000,dueDate:today,paid:true,details:{amountConfirmed:true,reconciliation:"reconciled",paidDate:today,method:"Bonifico"}});
    await t.test("nessun credito da demo o importi sconosciuti; residuo senza rate",async()=>{
      let data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).outstandingCents,0);
      await json(`/admin/finance/projects/${project.id}`,"PATCH",{details:{amountKnown:true,commercialState:"confirmed",agreementConfirmed:true,confirmedDate:today,creditReview:false,extraCents:15000}});
      data=await json(`/admin/finance?month=${month}`);
      const p=data.projects.find((p:any)=>p.id===project.id);
      assert.equal(p.outstandingCents,95000);assert.equal(p.receivedCents,20000);assert.equal(p.installmentCount,null);
      // Duplicate schedules do not double the contractual receivable.
      for(let i=0;i<2;i++)await json("/admin/finance/entries","POST",{direction:"income",category:"balance",projectId:project.id,description:prefix,amountCents:95000,dueDate:"2020-01-01",paid:false,details:{amountConfirmed:true}});
      data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).outstandingCents,95000);
      assert.ok(data.summary.overdueIncomeCents>=95000);
      await json(`/admin/finance/projects/${project.id}`,"PATCH",{details:{creditReview:true}});
      const entries=(await json(`/admin/finance?month=${month}`)).entries;
      const due=entries.find((e:any)=>e.projectId===project.id&&!e.paidAt);
      assert.equal((await request(`/admin/finance/reminders/${due.id}`)).status,409);
      await json(`/admin/finance/projects/${project.id}`,"PATCH",{details:{creditReview:false}});
      assert.equal((await request(`/admin/finance/reminders/${due.id}`)).status,200);
    });
    await t.test("canoni espliciti, idempotenti e mai incassati automaticamente",async()=>{
      const r=await json("/admin/finance/recurring","POST",{clientId:customer.id,projectId:project.id,direction:"income",category:"monthly_fee",description:prefix,amountCents:1000,intervalMonths:1,state:"active",startDate:today,nextDate:today});
      const first=await json(`/admin/finance/recurring/${r.id}/generate`,"POST",{dueDate:today});
      const repeated=await json(`/admin/finance/recurring/${r.id}/generate`,"POST",{dueDate:today});
      assert.equal(first.id,repeated.id);
      let ledger=await json(`/admin/finance/ledger?month=${month}`);
      assert.equal(ledger.obligations.filter((item:any)=>item.sourceType==="recurring"&&item.sourceId===r.id).length,1);
      assert.equal(ledger.obligations.find((item:any)=>item.id===first.id).remainingCents,1000);
      let data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).outstandingCents,95000);
      await json("/admin/finance/recurring","POST",{id:r.id,clientId:customer.id,projectId:project.id,direction:"income",category:"monthly_fee",description:prefix,amountCents:2000,intervalMonths:1,state:"suspended",startDate:today,nextDate:nextMonthlyDate(today,Number(today.slice(-2)))});
      assert.equal((await request(`/admin/finance/recurring/${r.id}/generate`,"POST",{dueDate:today})).status,400);
      const workspace=await json("/admin/finance/workspace");
      assert.equal(workspace.recurring.find((item:any)=>item.id===r.id).state,"suspended");
      ledger=await json(`/admin/finance/ledger?month=${month}`);
      assert.equal(ledger.obligations.find((item:any)=>item.id===first.id).amountCents,1000);
    });
    await t.test("rettifica, annullamento e ripristino conservano lo storico",async()=>{
      await json(`/admin/finance/entries/${paid.id}`,"PATCH",{amountCents:25000,details:{notes:"Rettifica sintetica"}});
      let data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).outstandingCents,90000);
      assert.equal(data.entries.find((e:any)=>e.id===paid.id).details.reconciliation,"reconciled");
      await json(`/admin/finance/entries/${paid.id}`,"DELETE");
      data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).outstandingCents,115000);
      assert.equal(data.entries.find((e:any)=>e.id===paid.id).details.cancelled,true);
      await json(`/admin/finance/entries/${paid.id}`,"PATCH",{details:{cancelled:false}});
      data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).outstandingCents,90000);
      const history=(await json("/admin/finance/workspace")).history.filter((h:any)=>h.entityId===paid.id);
      assert.ok(history.length>=4);assert.ok(history.some((h:any)=>h.before?.details?.cancelled===true));
    });
    await t.test("una modifica parziale non trasforma un incasso riconciliato in un pagamento futuro",async()=>{
      const getPaid=async()=>(await json(`/admin/finance?month=${month}`)).entries.find((e:any)=>e.id===paid.id);
      const before=await getPaid();
      const future=`${Number(today.slice(0,4))+1}${today.slice(4)}`;
      const rejected=await request(`/admin/finance/entries/${paid.id}`,"PATCH",{details:{paidDate:future}});
      assert.equal(rejected.status,400);
      assert.deepEqual(await getPaid(),before);
    });
    await t.test("USD ed euro confermati non sono ricalcolati dal cambio",async()=>{
      const expense=await json("/admin/finance/entries","POST",{direction:"expense",category:"replit",description:prefix,amountCents:239144,dueDate:today,paid:true,details:{currency:"USD",originalCents:263597,exchangeRate:.907,amountConfirmed:true,paidDate:today,reconciliation:"reconciled",classification:"research_review",supplier:prefix,externalReference:prefix}});
      const changed=await json(`/admin/finance/entries/${expense.id}`,"PATCH",{details:{exchangeRate:1.2}});
      assert.equal(changed.amountCents,239144);assert.equal(changed.details.originalCents,263597);assert.equal(changed.details.currency,"USD");
      assert.equal((await request("/admin/finance/entries","POST",{direction:"expense",category:"replit",description:prefix,amountCents:239144,dueDate:today,paid:false,details:{externalReference:prefix}})).status,409);
    });
    await t.test("il sito conserva accessi e dati, esclusi dall’anagrafica e dai lavori gestionali",async()=>{
      const publicClientId=randomUUID();
      await pool.query(`INSERT INTO clienti(id,nome,cognome,email) VALUES($1,$2,'','test@example.invalid')`,[publicClientId,prefix]);
      await pool.query(`INSERT INTO progetti_lavori(id,cliente_id,nome,password,acconto_versato) VALUES($1,$2,$3,$4,40)`,[legacyId,publicClientId,prefix,password]);
      await pool.query(`INSERT INTO voci_progetto(id,progetto_id,descrizione,importo) VALUES($1,$2,$3,400)`,[randomUUID(),legacyId,prefix]);
      const original=await json("/lavori/sblocca","POST",{password});
      await json(`/admin/finance/projects/${project.id}`,"PATCH",{notes:"Aggiornamento solo interno"});
      const updated=await json("/lavori/sblocca","POST",{password});
      assert.deepEqual(updated,original);
      const data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.some((p:any)=>p.id===legacyId),false);
      assert.equal(data.clients.some((c:any)=>c.id===publicClientId),false);
      assert.equal((await request(`/admin/finance/projects/${legacyId}`,"PATCH",{name:prefix})).status,404);
      assert.equal((await request("/admin/finance/projects","POST",{clientId:publicClientId,name:prefix,totalAmountCents:10000,paymentType:"single"})).status,404);
    });
    await t.test("gli acconti del sito non entrano nei movimenti interni",async()=>{
      await pool.query(`INSERT INTO acconti(id,progetto,nome,cognome,email,telefono,indirizzo,cap,citta,importo_centesimi,stato,paid_at) VALUES($1,$2,'Test','','test@example.invalid','','','','',5000,'pagato',$3)`,[accontoId,prefix,new Date(`${today}T12:00:00Z`)]);
      const data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.entries.some((e:any)=>e.details?.accontoId===accontoId),false);
      const workspace=await json("/admin/finance/workspace");
      assert.equal("legacyPayments" in workspace,false);
      assert.equal("legacyProjects" in workspace,false);
      assert.equal("sources" in workspace,false);
      assert.equal((await pool.query("SELECT count(*)::int AS count FROM acconti WHERE id=$1",[accontoId])).rows[0].count,1);
    });
    await t.test("fornitori persistenti, spese collegate e archiviazione senza cancellazioni",async()=>{
      const supplier=await json("/admin/finance/suppliers","POST",{name:prefix,category:"software",taxId:"TEST0000000000001",address:"Via Fornitore 1",notes:"Fornitore sintetico"});
      assert.equal((await request("/admin/finance/suppliers","POST",{name:prefix.toUpperCase(),category:"software"})).status,409);
      const expense=await json("/admin/finance/entries","POST",{direction:"expense",category:"replit",description:prefix,amountCents:2500,dueDate:today,paid:true,details:{supplierId:supplier.id,paidDate:today,amountConfirmed:true,reconciliation:"reconciled"}});
      const workspace=await json("/admin/finance/workspace");
      assert.equal(workspace.suppliers.find((s:any)=>s.id===supplier.id).category,"software");
       assert.equal(workspace.suppliers.find((s:any)=>s.id===supplier.id).taxId,"TEST0000000000001");
       assert.equal(workspace.suppliers.find((s:any)=>s.id===supplier.id).address,"Via Fornitore 1");
      const reloaded=(await json(`/admin/finance?month=${month}`)).entries.find((e:any)=>e.id===expense.id);
      assert.equal(reloaded.details.supplierId,supplier.id);
      assert.equal(reloaded.details.supplier,prefix);
      const monthData=await json(`/admin/finance?month=${month}`);
      const cashExpenses=monthData.entries.filter((e:any)=>e.direction==="expense"&&e.paidAt&&!e.details?.cancelled&&e.details?.amountConfirmed&&e.details?.reconciliation==="reconciled"&&new Date(e.paidAt).toISOString().slice(0,7)===month);
      assert.equal(monthData.summary.expensesCents,cashExpenses.reduce((sum:number,e:any)=>sum+e.amountCents,0));
      assert.equal(monthData.summary.balanceCents,monthData.summary.receivedCents-monthData.summary.expensesCents);
      await json(`/admin/finance/suppliers/${supplier.id}`,"PATCH",{active:false});
      assert.equal((await json("/admin/finance/suppliers")).find((s:any)=>s.id===supplier.id).active,false);
      assert.equal((await json(`/admin/finance?month=${month}`)).entries.find((e:any)=>e.id===expense.id).amountCents,2500);
      assert.equal((await request("/admin/finance/entries","POST",{direction:"expense",category:"replit",description:prefix,amountCents:100,dueDate:today,details:{supplierId:supplier.id}})).status,400);
    });
    await t.test("anteprime ripetibili non scrivono dati né trasformano stime in pagamenti",async()=>{
      const count=async()=>(await pool.query("SELECT (SELECT count(*) FROM clienti)::int AS clients,(SELECT count(*) FROM admin_finance_entries)::int AS entries,(SELECT count(*) FROM admin_finance_audit)::int AS audit")).rows[0];
      const before=await count();
      const first=await json("/admin/finance/import-preview"),second=await json("/admin/finance/import-preview");
      assert.deepEqual(first,second);assert.equal(first.blocked,true);assert.equal(first.rows.length,20);
      assert.equal(first.rows.some((r:any)=>r.name==="Fabrizio Affuso"),false);
      assert.equal((await request("/admin/finance/import-preview","POST",{})).status,423);
      const row={reference:`${prefix}-import`,date:today,supplier:"Replit",description:prefix,originalCents:1000,euroCents:900,currency:"USD"};
      const transactions=await json("/admin/finance/import-transactions/preview","POST",{rows:[row,{...row,date:null}]});
      assert.equal(transactions.rows[0].action,"create");assert.equal(transactions.rows[1].action,"review");
      const conflicting=await json("/admin/finance/import-transactions/preview","POST",{rows:[{...row,reference:prefix}]});
      assert.equal(conflicting.rows[0].action,"review");
      assert.deepEqual(await count(),before);
    });
    await t.test("CSV ed Excel includono movimenti, canoni e rettifiche",async()=>{
      const csv=await request("/admin/finance/export?format=csv");
      assert.equal(csv.status,200);const text=await csv.text();
      assert.ok(text.includes(prefix));assert.ok(text.includes("Rettifiche"));assert.ok(text.includes("Ricorrenze"));assert.ok(text.includes("Fornitori"));
      const xlsx=await request("/admin/finance/export?format=xlsx");
      assert.equal(xlsx.status,200);
      assert.equal(Buffer.from(await xlsx.arrayBuffer()).subarray(0,2).toString(),"PK");
    });
    await t.test("documenti privati caricati direttamente e leggibili solo dopo accesso",async()=>{
      const signed=await json("/admin/finance/documents","POST",{name:"synthetic.csv",size:12,contentType:"text/csv"});
      documentPath=signed.objectPath;
      const put=await fetch(signed.uploadURL,{method:"PUT",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"text/csv"},body:"test;amount\n"});
      assert.equal(put.status,200);
      const path=`/admin/finance/documents/${documentPath.split("/").pop()}`;
      assert.equal((await request(path,"GET",undefined,false)).status,401);
      const download=await request(path);assert.equal(download.status,200);assert.equal(await download.text(),"test;amount\n");
      await json(`/admin/finance/entries/${paid.id}`,"PATCH",{details:{documentPath}});
      const reloaded=(await json(`/admin/finance?month=${month}`)).entries.find((e:any)=>e.id===paid.id);
      assert.equal(reloaded.details.documentPath,documentPath);
    });
    await t.test("bilancio nuovo: venduto, incassi allocati, residuo e canoni maturati",async()=>{
      const baseline=await json(`/admin/finance/ledger?month=${month}`);
      const ledgerClientName=`${prefix}_ledger`;
       const ledgerClient=await json("/admin/finance/clients","POST",{name:ledgerClientName});ledgerClientId=ledgerClient.id;
       const ledgerProject=await json("/admin/finance/projects","POST",{
        clientId:ledgerClient.id,name:ledgerClientName,totalAmountCents:100000,paymentType:"advance",depositAmountCents:50000,
       });ledgerProjectId=ledgerProject.id;
      await json(`/admin/finance/projects/${ledgerProject.id}`,"PATCH",{details:{
        amountKnown:true,commercialState:"confirmed",agreementConfirmed:true,confirmedDate:today,creditReview:false,extraCents:0,
      }});
      const deposit=await json("/admin/finance/ledger/obligations","POST",{
        direction:"income",category:"deposit",description:"Acconto concordato",amountCents:50000,dueDate:today,
        clientId:ledgerClient.id,projectId:ledgerProject.id,
      });
      const balance=await json("/admin/finance/ledger/obligations","POST",{
        direction:"income",category:"balance",description:"Saldo finale",amountCents:50000,
        dueDate:new Date(Date.parse(`${today}T00:00:00Z`)+14*86400000).toISOString().slice(0,10),
        clientId:ledgerClient.id,projectId:ledgerProject.id,
      });
      assert.equal((await request("/admin/finance/ledger/accounts","POST",{
        name:`${prefix}_ledger_conto_senza_data`,accountType:"bank",openingBalanceCents:1000,
      })).status,400);
       const account=await json("/admin/finance/ledger/accounts","POST",{
        name:`${prefix}_ledger_conto`,accountType:"bank",openingBalanceCents:0,openingBalanceDate:today,
       });ledgerAccountId=account.id;
      await json("/admin/finance/ledger/movements","POST",{
        movementDate:today,direction:"income",amountCents:50000,accountId:account.id,
        paymentMethod:"Bonifico",note:`${prefix}_ledger acconto`,
        allocations:[{obligationId:deposit.id,amountCents:50000}],
      });
      let ledger=await json(`/admin/finance/ledger?month=${month}`);
      assert.equal(ledger.summary.soldCents-baseline.summary.soldCents,100000);
      assert.equal(ledger.summary.receivedCents-baseline.summary.receivedCents,50000);
      assert.equal(ledger.summary.cashBalanceCents-baseline.summary.cashBalanceCents,50000);
      assert.equal(ledger.summary.receivableCents-baseline.summary.receivableCents,50000);
      assert.equal(ledger.obligations.find((item:any)=>item.id===deposit.id).remainingCents,0);
      assert.equal(ledger.obligations.find((item:any)=>item.id===balance.id).remainingCents,50000);
      assert.equal(ledger.clientBalances.find((item:any)=>item.clientId===ledgerClient.id).receivedCents,50000);
      assert.equal(ledger.clientBalances.find((item:any)=>item.clientId===ledgerClient.id).receivableCents,50000);

      const threeMonthsAgo=new Date(Date.parse(`${today}T00:00:00Z`)-90*86400000).toISOString().slice(0,10);
      const [year,monthNumber,day]=threeMonthsAgo.split("-").map(Number);
      const startDate=new Date(Date.UTC(year,monthNumber-1,day+1)).toISOString().slice(0,10);
      const recurring=await json("/admin/finance/recurring","POST",{
        clientId:ledgerClient.id,projectId:ledgerProject.id,direction:"income",category:"monthly_fee",
        description:"Canone mensile test",amountCents:1000,intervalMonths:1,state:"active",startDate,nextDate:startDate,
       });
      ledger=await json(`/admin/finance/ledger?month=${month}`);
      const matured=ledger.obligations.filter((item:any)=>item.sourceType==="recurring"&&item.sourceId===recurring.id);
      assert.equal(matured.length,3);
      assert.equal(ledger.obligations.some((item:any)=>item.sourceType==="recurring"&&item.sourceId===recurring.id&&String(item.dueDate).slice(0,10)>today),false);
      assert.equal(ledger.summary.soldCents-baseline.summary.soldCents,103000);
      assert.equal(ledger.summary.receivedCents-baseline.summary.receivedCents,50000);
      assert.equal(ledger.summary.receivableCents-baseline.summary.receivableCents,53000);
      assert.equal(ledger.summary.overdueCents-baseline.summary.overdueCents,3000);
      assert.ok(matured.every((item:any)=>item.remainingCents===1000&&item.overdue));

      const historicalProject=await json("/admin/finance/projects","POST",{
        clientId:ledgerClient.id,name:`${ledgerClientName}_historical`,totalAmountCents:25000,paymentType:"single",
      });
      await json(`/admin/finance/projects/${historicalProject.id}`,"PATCH",{details:{
        amountKnown:true,commercialState:"confirmed",agreementConfirmed:true,confirmedDate:today,
        creditReview:false,extraCents:0,reportedReceivedCents:8000,
      }});
      ledger=await json(`/admin/finance/ledger?month=${month}`);
      assert.equal(ledger.summary.receivedCents-baseline.summary.receivedCents,50000);
      const candidate=ledger.historicalCandidates.find((item:any)=>item.sourceType==="project_reported"&&item.id===historicalProject.id);
      assert.ok(candidate);
      const reconciled=await json("/admin/finance/ledger/reconcile","POST",{
        sourceType:"project_reported",sourceId:historicalProject.id,movementDate:today,
        amountCents:8000,accountId:account.id,note:`${prefix}_ledger storico confermato`,
      });
      assert.equal(reconciled.historical,true);
      assert.equal((await request("/admin/finance/ledger/reconcile","POST",{
        sourceType:"project_reported",sourceId:historicalProject.id,movementDate:today,
        amountCents:8000,accountId:account.id,
      })).status,409);
      ledger=await json(`/admin/finance/ledger?month=${month}`);
      assert.equal(ledger.summary.receivedCents-baseline.summary.receivedCents,58000);
      assert.equal(ledger.summary.cashBalanceCents-baseline.summary.cashBalanceCents,58000);
      assert.equal(ledger.historicalCandidates.some((item:any)=>item.id===historicalProject.id),false);

        assert.equal((await request("/admin/finance/quotes","POST",{
          clientId:ledgerClient.id,issuedOn:today,items:[{description:"Quantità non valida",quantity:1.0001,unitPriceCents:100000}],
        })).status,400);
        const quote=await json("/admin/finance/quotes","POST",{
          clientId:ledgerClient.id,issuedOn:today,validUntil:null,notes:`${prefix}_preventivo`,
          items:[{description:`${prefix}_sito web`,quantity:1,unitPriceCents:100000}],
        });
        quoteId=quote.id;
        assert.match(quote.number,/^PREV-\d{4}-\d{3,}$/);
        assert.equal(quote.totalAmountCents,100000);
        await json(`/admin/finance/quotes/${quote.id}/status`,"POST",{status:"sent"});
        const nextDue=nextMonthlyDate(today,Number(today.slice(-2)));
        const accepted=await json(`/admin/finance/quotes/${quote.id}/convert`,"POST",{
          projectName:`${prefix}_lavoro_da_preventivo`,workType:"website",paymentType:"advance",
          depositAmountCents:50000,installmentCount:null,startDate:today,deliveryDate:nextDue,
          status:"in_progress",notes:"",installments:[
            {description:"Acconto concordato",amountCents:50000,dueDate:today},
            {description:"Saldo concordato",amountCents:50000,dueDate:nextDue},
          ],
          recurring:{description:`${prefix}_canone futuro`,amountCents:2000,intervalMonths:1,startDate:nextDue,nextDate:nextDue,endDate:null},
        });
        quoteProjectId=accepted.projectId;quoteRecurringId=accepted.recurringId;
        assert.equal(accepted.quoteId,quote.id);assert.equal(accepted.createdInstallments,2);
        assert.ok(accepted.recurringId);
        assert.equal((await request(`/admin/finance/quotes/${quote.id}/convert`,"POST",{
          projectName:"Doppia conversione",workType:"other",paymentType:"single",depositAmountCents:null,
          installmentCount:null,startDate:null,deliveryDate:null,status:"in_progress",notes:"",installments:[],
        })).status,409);
        const listed=await json("/admin/finance/quotes");
        assert.equal(listed.quotes.find((item:any)=>item.id===quote.id).status,"accepted");
        assert.equal(listed.quotes.find((item:any)=>item.id===quote.id).projectId,accepted.projectId);
        const beforeReceipt=await json(`/admin/finance/ledger?month=${month}`);
        assert.equal(beforeReceipt.summary.soldCents-ledger.summary.soldCents,100000);
        assert.equal(beforeReceipt.summary.receivableCents-ledger.summary.receivableCents,100000);
        const quoteDeposit=beforeReceipt.obligations.find((item:any)=>item.projectId===accepted.projectId&&item.category==="deposit");
        assert.ok(quoteDeposit);
        await json("/admin/finance/ledger/movements","POST",{
          movementDate:today,direction:"income",amountCents:50000,accountId:account.id,paymentMethod:"Bonifico",
          note:`${prefix}_preventivo incasso`,allocations:[{obligationId:quoteDeposit.id,amountCents:50000}],
        });
        const afterReceipt=await json(`/admin/finance/ledger?month=${month}`);
        assert.equal(afterReceipt.summary.receivedCents-beforeReceipt.summary.receivedCents,50000);
        assert.equal(afterReceipt.summary.receivableCents-beforeReceipt.summary.receivableCents,-50000);
        assert.equal(afterReceipt.obligations.find((item:any)=>item.id===quoteDeposit.id).remainingCents,0);

        const reminder=await json("/admin/finance/manual-reminders","POST",{
          title:`${prefix}_promemoria`,dueDate:today,clientId:ledgerClient.id,projectId:accepted.projectId,notes:"Verificare consegna",
        });
        manualReminderId=reminder.id;
        const currentSchedule=await json(`/admin/finance/schedule?month=${month}`);
        assert.ok(currentSchedule.items.some((item:any)=>item.id===quoteDeposit.id&&item.status==="paid"));
        assert.ok(currentSchedule.items.some((item:any)=>item.id===reminder.id&&item.sourceType==="manual"));
        await json(`/admin/finance/manual-reminders/${reminder.id}`,"PATCH",{completed:true});
        const completedSchedule=await json(`/admin/finance/schedule?month=${month}`);
        assert.equal(completedSchedule.items.find((item:any)=>item.id===reminder.id).status,"completed");
        const futureSchedule=await json(`/admin/finance/schedule?month=${nextDue.slice(0,7)}`);
        assert.ok(futureSchedule.items.some((item:any)=>item.id.startsWith(`recurring:${accepted.recurringId}:`)&&item.status==="planned"));
        assert.ok(futureSchedule.items.some((item:any)=>item.sourceType==="delivery"&&item.title.includes(`${prefix}_lavoro_da_preventivo`)));
        assert.ok(futureSchedule.items.some((item:any)=>item.sourceType==="installment"&&item.title.includes("Saldo concordato")));
        const futureTotals=await json(`/admin/finance/ledger?month=${nextDue.slice(0,7)}`);
        assert.equal(futureTotals.summary.soldCents-ledger.summary.soldCents,100000);

        fiscalSettingsSnapshot={
          settings:(await pool.query("SELECT * FROM admin_finance_settings WHERE key=ANY($1::text[])",[["issuer","document_prefixes"]])).rows,
          regimes:(await pool.query("SELECT * FROM admin_finance_tax_regimes")).rows,
          sequences:(await pool.query("SELECT * FROM admin_finance_document_sequences WHERE document_type='receipt' AND fiscal_year=$1",[Number(today.slice(0,4))])).rows,
          regimeIds:[],
        };
        const clientWithTaxData=await json(`/admin/finance/clients/${ledgerClient.id}`,"PATCH",{
          taxId:fiscalTestTaxId,address:"Via Test fiscale 1, Roma",
        });
        assert.equal(clientWithTaxData.taxId,fiscalTestTaxId);
        const currentSettings=await json("/admin/finance/settings");
        fiscalSettingsSnapshot.regimeIds=currentSettings.regimes.map((item:any)=>item.id);
        const configured=await json("/admin/finance/settings","PUT",{
          ...currentSettings,
          issuer:{...currentSettings.issuer,taxId:fiscalTestTaxId,address:"Via Test PromoApp 1",postalCode:"00100",city:"Roma",province:"RM"},
        });
        assert.equal(configured.regimes.find((item:any)=>item.documentType==="receipt").withholdingRateBps,2000);
        const vatRegime=configured.regimes.find((item:any)=>item.documentType==="invoice");
        assert.equal(vatRegime.effectiveFrom,"2027-01-01");
        assert.equal(vatRegime.vatRateBps,2200);
        const openBalance=futureTotals.obligations.find((item:any)=>item.projectId===accepted.projectId&&item.description==="Saldo concordato");
        assert.ok(openBalance);
        await json("/admin/finance/ledger/movements","POST",{
          movementDate:today,direction:"income",amountCents:10000,accountId:account.id,paymentMethod:"Bonifico",
          note:`${prefix}_ledger incasso parziale saldo`,allocations:[{obligationId:openBalance.id,amountCents:10000}],
        });
        const fiscalDocument=await json("/admin/finance/fiscal-documents","POST",{
          clientId:ledgerClient.id,projectId:accepted.projectId,obligationId:openBalance.id,issuedOn:today,
          dueDate:today,description:"Saldo del lavoro",grossAmountCents:openBalance.amountCents,notes:"Documento di prova",
        });
        fiscalDocumentId=fiscalDocument.id;
         fiscalDocumentIds.push(fiscalDocument.id);
        assert.equal(fiscalDocument.documentType,"receipt");
        assert.equal(fiscalDocument.grossAmountCents,50000);
        assert.equal(fiscalDocument.withholdingAmountCents,10000);
        assert.equal(fiscalDocument.netAmountCents,40000);
        const pdfResponse=await request(`/admin/finance/fiscal-documents/${fiscalDocument.id}/pdf`);
        assert.equal(pdfResponse.status,200);
        assert.equal(Buffer.from(await pdfResponse.arrayBuffer()).subarray(0,4).toString(),"%PDF");
        const originalPdfPath=(await pool.query("SELECT storage_path FROM admin_finance_documents WHERE id=$1",[fiscalDocument.id])).rows[0].storage_path;
        const adjustedLedger=await json(`/admin/finance/ledger?month=${month}`);
        assert.equal(adjustedLedger.obligations.find((item:any)=>item.id===openBalance.id).amountCents,40000);
        assert.equal(adjustedLedger.obligations.find((item:any)=>item.id===openBalance.id).remainingCents,30000);
        assert.equal(adjustedLedger.obligations.find((item:any)=>item.id===openBalance.id).dueDate.slice(0,10),today);
        const voided=await json(`/admin/finance/fiscal-documents/${fiscalDocument.id}/void`,"POST",{reason:"Documento sintetico di test"});
        assert.equal(voided.status,"void");
        const voidPdfPath=(await pool.query("SELECT storage_path FROM admin_finance_documents WHERE id=$1",[fiscalDocument.id])).rows[0].storage_path;
        assert.notEqual(voidPdfPath,originalPdfPath);
        const voidPdfResponse=await request(`/admin/finance/fiscal-documents/${fiscalDocument.id}/pdf`);
        assert.equal(Buffer.from(await voidPdfResponse.arrayBuffer()).subarray(0,4).toString(),"%PDF");
        const restoredLedger=await json(`/admin/finance/ledger?month=${month}`);
        assert.equal(restoredLedger.obligations.find((item:any)=>item.id===openBalance.id).amountCents,50000);
        assert.equal(restoredLedger.obligations.find((item:any)=>item.id===openBalance.id).remainingCents,40000);
        const restoredFutureLedger=await json(`/admin/finance/ledger?month=${nextDue.slice(0,7)}`);
        assert.equal(restoredFutureLedger.obligations.find((item:any)=>item.id===openBalance.id).dueDate.slice(0,10),nextDue);
    });

    await t.test("report per periodo, margini, controlli e archivio export",async()=>{
      assert.ok(ledgerClientId&&ledgerProjectId&&ledgerAccountId);
      const reportPath=`/admin/finance/reports?periodType=month&period=${month}`;
      const baseline=await json(reportPath);
      const baselineClient=baseline.clients.find((item:any)=>item.clientId===ledgerClientId);
      assert.ok(baselineClient);
      assert.equal((await json(`/admin/finance/reports?periodType=year&period=${today.slice(0,4)}`)).periodType,"year");
      assert.equal((await request(`/admin/finance/reports?periodType=month&period=${today.slice(0,4)}`)).status,400);

      const supplier=await json("/admin/finance/suppliers","POST",{name:`${prefix}_report_supplier`,category:"software"});
      const expenseObligation=await json("/admin/finance/ledger/obligations","POST",{
        direction:"expense",category:"replit",description:`${prefix}_report_spesa`,amountCents:1234,dueDate:today,
        clientId:ledgerClientId,projectId:ledgerProjectId,supplierId:supplier.id,
      });
      reportExpenseObligationId=expenseObligation.id;
      await json("/admin/finance/ledger/movements","POST",{
        movementDate:today,direction:"expense",amountCents:1234,accountId:ledgerAccountId,
        note:`${prefix}_ledger spesa per report`,allocations:[{obligationId:expenseObligation.id,amountCents:1234}],
      });
      const unallocatedMovement=await json("/admin/finance/ledger/movements","POST",{
        movementDate:today,direction:"income",amountCents:321,accountId:ledgerAccountId,
        note:`${prefix}_ledger incasso da attribuire`,allocations:[],
      });
      unallocatedMovementId=unallocatedMovement.id;
      await json(`/admin/finance/projects/${ledgerProjectId}`,"PATCH",{status:"delivered",details:{operationalState:"delivered"}});

      const fiscalDocument=await json("/admin/finance/fiscal-documents","POST",{
        clientId:ledgerClientId,projectId:ledgerProjectId,issuedOn:today,dueDate:today,
        description:"Documento sintetico per controllo anagrafica",grossAmountCents:2000,notes:"",
      });
      integrityDocumentId=fiscalDocument.id;fiscalDocumentIds.push(fiscalDocument.id);
      await json(`/admin/finance/clients/${ledgerClientId}`,"PATCH",{taxId:null,address:null});

      const report=await json(reportPath);
      assert.equal(report.totals.receivedCents-baseline.totals.receivedCents,321);
      assert.equal(report.totals.spentCents-baseline.totals.spentCents,1234);
      assert.equal(report.totals.periodBalanceCents-baseline.totals.periodBalanceCents,-913);
      assert.equal(report.totals.withholdingCreditCents-baseline.totals.withholdingCreditCents,400);
      assert.equal(report.expensesBySupplier.find((item:any)=>item.key===supplier.id).amountCents,1234);
      const reportClient=report.clients.find((item:any)=>item.clientId===ledgerClientId);
      assert.equal(reportClient.directCostsCents-baselineClient.directCostsCents,1234);
      assert.equal(reportClient.marginCents-baselineClient.marginCents,-1234);

      const checks=await json("/admin/finance/verification");
      const issue=(category:string,id:string)=>checks.items.find((item:any)=>item.category===category&&item.entityId===id);
      assert.ok(issue("income_without_allocation",unallocatedMovementId));
      assert.ok(issue("delivered_open_balance",ledgerProjectId));
      assert.ok(issue("legacy_paid_without_movement",paid.id));
      assert.ok(checks.items.some((item:any)=>item.category==="overdue_recurring"&&item.clientName===`${prefix}_ledger`));
      assert.ok(issue("missing_client_fiscal_data",integrityDocumentId));

      const csv=await request("/admin/finance/export?format=csv");
      assert.equal(csv.status,200);const text=await csv.text();
      assert.ok(text.includes("Movimenti effettivi"));assert.ok(text.includes("Documenti fiscali"));
      assert.ok(text.includes(`${prefix}_ledger incasso da attribuire`));
      assert.ok(text.includes("netAmountEuro"));assert.ok(text.includes("Clienti"));
      const xlsx=await request("/admin/finance/export?format=xlsx");
      assert.equal(xlsx.status,200);assert.equal(Buffer.from(await xlsx.arrayBuffer()).subarray(0,2).toString(),"PK");
    });
  } finally {
    if(documentPath){
      try { await (await new ObjectStorageService().getObjectEntityFile(documentPath)).delete(); }
      catch { /* Cleanup must not prevent removal of the database's synthetic fixtures. */ }
    }
    if(fiscalDocumentIds.length){
      const stored=(await pool.query("SELECT storage_path FROM admin_finance_documents WHERE id=ANY($1::text[])",[fiscalDocumentIds])).rows;
      for(const document of stored)if(document.storage_path){
        try{await (await new ObjectStorageService().getObjectEntityFile(document.storage_path)).delete();}
        catch{/* The PDF may already have been removed by an interrupted test run. */}
      }
    }
    const q=await pool.connect();
    try{
      await q.query("BEGIN");
      const p=(await q.query("SELECT id FROM admin_finance_projects WHERE name=$1",[prefix])).rows.map(r=>r.id);
      const ledgerP=(await q.query("SELECT id FROM admin_finance_projects WHERE name LIKE $1",[`${prefix}_ledger%`])).rows.map(r=>r.id);
      const e=(await q.query("SELECT id FROM admin_finance_entries WHERE description=$1",[prefix])).rows.map(r=>r.id);
      const r=(await q.query("SELECT id FROM admin_finance_recurring WHERE description=$1",[prefix])).rows.map(r=>r.id);
      const ledgerC=(await q.query("SELECT id FROM admin_finance_clients WHERE name=$1",[`${prefix}_ledger`])).rows.map(r=>r.id);
      const ledgerR=(await q.query("SELECT id FROM admin_finance_recurring WHERE description='Canone mensile test' AND client_id=ANY($1::text[])",[ledgerC])).rows.map(r=>r.id);
      const c=(await q.query("SELECT id FROM admin_finance_clients WHERE name=ANY($1::text[])",[[prefix,`${prefix}_ledger`]])).rows.map(r=>r.id);
       const s=(await q.query("SELECT id FROM admin_finance_suppliers WHERE name LIKE $1",[`${prefix}%`])).rows.map(r=>r.id);
      const a=(await q.query("SELECT id FROM admin_finance_accounts WHERE name=$1",[`${prefix}_ledger_conto`])).rows.map(r=>r.id);
      const reminderIds=manualReminderId?[manualReminderId]:[];
      const quoteIds=quoteId?[quoteId]:[];
      const quoteRecurringIds=quoteRecurringId?[quoteRecurringId]:[];
      const quoteProjectIds=quoteProjectId?[quoteProjectId]:[];
      const o=(await q.query(`SELECT id FROM admin_finance_obligations WHERE project_id=ANY($1::text[]) OR recurring_id=ANY($2::text[]) OR description LIKE $3`,[[...p,...ledgerP,...quoteProjectIds],[...r,...ledgerR,...quoteRecurringIds],`${prefix}_ledger%`])).rows.map(r=>r.id);
      const m=(await q.query(`SELECT id FROM admin_finance_movements WHERE account_id=ANY($1::text[]) OR note LIKE $2`,[a,`%${prefix}_ledger%`])).rows.map(r=>r.id);
        await q.query("DELETE FROM admin_finance_audit WHERE entity_id=ANY($1::text[])",[[...p,...ledgerP,...quoteProjectIds,...quoteIds,...quoteRecurringIds,...reminderIds,...e,...r,...ledgerR,...c,...s,...a,...o,...m,...fiscalDocumentIds]]);
       if(fiscalSettingsSnapshot){
          await q.query("DELETE FROM admin_finance_documents WHERE id=ANY($1::text[])",[fiscalDocumentIds]);
         await q.query("DELETE FROM admin_finance_settings WHERE key=ANY($1::text[])",[["issuer","document_prefixes"]]);
         for(const row of fiscalSettingsSnapshot.settings)await q.query(`INSERT INTO admin_finance_settings(key,value,updated_at)
           VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=EXCLUDED.updated_at`,
         [row.key,row.value,row.updated_at]);
         const previousRegimeIds=fiscalSettingsSnapshot.regimes.map((item:any)=>item.id);
         await q.query("DELETE FROM admin_finance_tax_regimes WHERE id=ANY($1::text[]) AND NOT(id=ANY($2::text[]))",
           [fiscalSettingsSnapshot.regimeIds,previousRegimeIds]);
         for(const row of fiscalSettingsSnapshot.regimes)await q.query(`INSERT INTO admin_finance_tax_regimes
           (id,name,regime_type,document_type,effective_from,effective_until,vat_rate_bps,withholding_rate_bps,active,notes)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET
             name=EXCLUDED.name,regime_type=EXCLUDED.regime_type,document_type=EXCLUDED.document_type,
             effective_from=EXCLUDED.effective_from,effective_until=EXCLUDED.effective_until,
             vat_rate_bps=EXCLUDED.vat_rate_bps,withholding_rate_bps=EXCLUDED.withholding_rate_bps,
             active=EXCLUDED.active,notes=EXCLUDED.notes`,
         [row.id,row.name,row.regime_type,row.document_type,row.effective_from,row.effective_until,row.vat_rate_bps,
           row.withholding_rate_bps,row.active,row.notes]);
         await q.query("DELETE FROM admin_finance_document_sequences WHERE document_type='receipt' AND fiscal_year=$1",[Number(today.slice(0,4))]);
         for(const row of fiscalSettingsSnapshot.sequences)await q.query(`INSERT INTO admin_finance_document_sequences
           (id,document_type,fiscal_year,next_number,prefix,updated_at) VALUES($1,$2,$3,$4,$5,$6)`,
         [row.id,row.document_type,row.fiscal_year,row.next_number,row.prefix,row.updated_at]);
         await q.query("DELETE FROM admin_finance_audit WHERE entity_type='finance_settings' AND after->'issuer'->>'taxId'=$1",[fiscalTestTaxId]);
       }
      await q.query("DELETE FROM admin_finance_reminders WHERE id=ANY($1::text[])",[reminderIds]);
      await q.query("DELETE FROM admin_finance_movement_allocations WHERE movement_id=ANY($1::text[]) OR obligation_id=ANY($2::text[])",[m,o]);
      await q.query("DELETE FROM admin_finance_movements WHERE id=ANY($1::text[])",[m]);
      await q.query("DELETE FROM admin_finance_obligations WHERE id=ANY($1::text[])",[o]);
      if(quoteIds.length){
        await q.query("DELETE FROM admin_finance_quote_items WHERE quote_id=ANY($1::text[])",[quoteIds]);
        await q.query("DELETE FROM admin_finance_quotes WHERE id=ANY($1::text[])",[quoteIds]);
      }
      await q.query("DELETE FROM admin_finance_accounts WHERE id=ANY($1::text[])",[a]);
      await q.query("DELETE FROM admin_finance_entries WHERE id=ANY($1::text[])",[e]);
      await q.query("DELETE FROM admin_finance_recurring WHERE id=ANY($1::text[])",[[...r,...ledgerR,...quoteRecurringIds]]);
      await q.query("DELETE FROM admin_finance_projects WHERE id=ANY($1::text[])",[[...p,...ledgerP,...quoteProjectIds]]);
      await q.query("DELETE FROM voci_progetto WHERE progetto_id=$1",[legacyId]);
      await q.query("DELETE FROM progetti_lavori WHERE id=$1",[legacyId]);
      await q.query("DELETE FROM acconti WHERE progetto=$1",[prefix]);
      await q.query("DELETE FROM admin_finance_clients WHERE id=ANY($1::text[])",[c]);
      await q.query("DELETE FROM admin_finance_suppliers WHERE id=ANY($1::text[])",[s]);
      await q.query("DELETE FROM clienti WHERE nome=$1",[prefix]);
      await q.query("COMMIT");
    }catch(err){await q.query("ROLLBACK");throw err;}
    finally{q.release();server.closeAllConnections();server.close();await pool.end();}
  }
});
