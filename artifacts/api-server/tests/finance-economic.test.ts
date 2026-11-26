import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import express from "express";
import { pool } from "@workspace/db";
import { createAdminAuthorization } from "../src/middlewares/adminAuthorization";
import { createAdminFinanceRouter } from "../src/routes/admin-finance";
import lavoriRouter from "../src/routes/lavori";
import { nextMonthlyDate } from "../src/lib/admin-finance-data";
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
  let cookie="",csrf="",documentPath="";
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
      for(const path of ["/admin/finance?month="+month,"/admin/finance/workspace","/admin/finance/suppliers","/admin/finance/import-preview","/admin/finance/export?format=xlsx",`/admin/finance/documents/${randomUUID()}`]){
        assert.equal((await request(path,"GET",undefined,false)).status,401);
      }
      const login=await request("/admin/login","POST",{password},false);
      assert.equal(login.status,200);cookie=login.headers.get("set-cookie")!.split(";")[0];csrf=(await login.json() as any).csrfToken;
      const rejected=await fetch(`${url}/admin/finance/clients`,{method:"POST",headers:{cookie,"Content-Type":"application/json"},body:JSON.stringify({name:prefix})});
      assert.equal(rejected.status,403);
    });
    const customer=await json("/admin/finance/clients","POST",{name:prefix,details:{aliases:[`${prefix}-alias`],acquisitionSource:"Facebook",acquisitionDate:today}});
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
      let data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.entries.filter((e:any)=>e.details?.recurringId===r.id).length,1);
      assert.equal(data.entries.find((e:any)=>e.id===first.id).paidAt,null);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).outstandingCents,95000);
      await json(`/admin/finance/entries/${first.id}`,"PATCH",{paid:true,details:{paidDate:today,amountConfirmed:true,reconciliation:"reconciled"}});
      data=await json(`/admin/finance?month=${month}`);
      assert.equal(data.projects.find((p:any)=>p.id===project.id).receivedCents,20000);
      await json("/admin/finance/recurring","POST",{id:r.id,clientId:customer.id,projectId:project.id,direction:"income",category:"monthly_fee",description:prefix,amountCents:2000,intervalMonths:1,state:"suspended",startDate:today,nextDate:nextMonthlyDate(today,Number(today.slice(-2)))});
      assert.equal((await request(`/admin/finance/recurring/${r.id}/generate`,"POST",{dueDate:today})).status,400);
      const workspace=await json("/admin/finance/workspace");
      assert.equal(workspace.recurring.find((item:any)=>item.id===r.id).state,"suspended");
      assert.equal(data.entries.find((e:any)=>e.id===first.id).amountCents,1000);
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
      const supplier=await json("/admin/finance/suppliers","POST",{name:prefix,category:"software",notes:"Fornitore sintetico"});
      assert.equal((await request("/admin/finance/suppliers","POST",{name:prefix.toUpperCase(),category:"software"})).status,409);
      const expense=await json("/admin/finance/entries","POST",{direction:"expense",category:"replit",description:prefix,amountCents:2500,dueDate:today,paid:true,details:{supplierId:supplier.id,paidDate:today,amountConfirmed:true,reconciliation:"reconciled"}});
      const workspace=await json("/admin/finance/workspace");
      assert.equal(workspace.suppliers.find((s:any)=>s.id===supplier.id).category,"software");
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
  } finally {
    if(documentPath){
      try { await (await new ObjectStorageService().getObjectEntityFile(documentPath)).delete(); }
      catch { /* Cleanup must not prevent removal of the database's synthetic fixtures. */ }
    }
    const q=await pool.connect();
    try{
      await q.query("BEGIN");
      const p=(await q.query("SELECT id FROM admin_finance_projects WHERE name=$1",[prefix])).rows.map(r=>r.id);
      const e=(await q.query("SELECT id FROM admin_finance_entries WHERE description=$1",[prefix])).rows.map(r=>r.id);
      const r=(await q.query("SELECT id FROM admin_finance_recurring WHERE description=$1",[prefix])).rows.map(r=>r.id);
      const c=(await q.query("SELECT id FROM admin_finance_clients WHERE name=$1",[prefix])).rows.map(r=>r.id);
      const s=(await q.query("SELECT id FROM admin_finance_suppliers WHERE name=$1",[prefix])).rows.map(r=>r.id);
      await q.query("DELETE FROM admin_finance_audit WHERE entity_id=ANY($1::text[])",[[...p,...e,...r,...c,...s]]);
      await q.query("DELETE FROM admin_finance_entries WHERE id=ANY($1::text[])",[e]);
      await q.query("DELETE FROM admin_finance_recurring WHERE id=ANY($1::text[])",[r]);
      await q.query("DELETE FROM admin_finance_projects WHERE id=ANY($1::text[])",[p]);
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
