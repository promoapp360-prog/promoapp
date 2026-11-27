import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminFinanceClient, FinanceQuote, FinanceQuoteConversionInput, FinanceQuoteInput,
  FinanceQuoteLineInput, FinanceQuotesResponse,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { FinanceField } from "./FinanceDetailsFields";
import { fieldClass, money } from "./finance-ui";

type QuoteDraft={clientId:string;issuedOn:string;validUntil:string;notes:string;items:Array<FinanceQuoteLineInput>};
type ConvertDraft={projectName:string;workType:FinanceQuoteConversionInput["workType"]|"";paymentType:FinanceQuoteConversionInput["paymentType"];
  deposit:string;installmentCount:string;startDate:string;deliveryDate:string;status:FinanceQuoteConversionInput["status"];
  singleDueDate:string;depositDueDate:string;balanceDueDate:string;installments:Array<{description:string;amount:string;dueDate:string}>;
  recurring:boolean;recurringDescription:string;recurringAmount:string;recurringInterval:number;recurringStart:string;recurringNext:string;recurringEnd:string};

const dateToday=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const emptyQuote=(clientId=""):QuoteDraft=>({clientId,issuedOn:dateToday(),validUntil:"",notes:"",items:[{description:"",quantity:1,unitPriceCents:0}]});
const newConvert=(quote:FinanceQuote):ConvertDraft=>({
  projectName:quote.items[0]?.description??"",workType:"other",paymentType:"single",deposit:"",installmentCount:"",
  startDate:"",deliveryDate:"",status:"waiting_deposit",singleDueDate:"",depositDueDate:"",balanceDueDate:"",installments:[],
  recurring:false,recurringDescription:"",recurringAmount:"",recurringInterval:1,recurringStart:dateToday(),recurringNext:dateToday(),recurringEnd:"",
});
const statusLabel:Record<FinanceQuote["status"],string>={draft:"Bozza",sent:"Inviato",accepted:"Accettato",rejected:"Rifiutato",expired:"Scaduto"};
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));}

function printQuote(quote:FinanceQuote){
  const rows=quote.items.map(item=>`<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${money(item.unitPriceCents)}</td><td>${money(item.totalCents)}</td></tr>`).join("");
  const client=[quote.companyName,quote.clientName,quote.clientAddress,quote.clientTaxId,quote.clientEmail,quote.clientPhone].filter(Boolean).map(value=>`<div>${escapeHtml(String(value))}</div>`).join("");
  const html=`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${escapeHtml(quote.number)} · PromoApp</title><style>
    body{font:15px Arial,sans-serif;color:#172033;margin:48px auto;max-width:760px;padding:0 28px}
    header{display:flex;justify-content:space-between;border-bottom:2px solid #4f46e5;padding-bottom:20px}
    h1{font-size:28px;margin:0;color:#3730a3}h2{font-size:18px;margin:28px 0 8px}
    .muted{color:#64748b;font-size:13px}.client{line-height:1.65}
    table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
    th{font-size:12px;text-transform:uppercase;color:#64748b}td:nth-child(n+2),th:nth-child(n+2){text-align:right}
    .total{text-align:right;font-size:20px;font-weight:bold;margin-top:22px}.notes{white-space:pre-wrap}
    @media print{body{margin:0 auto;padding:20px}button{display:none}}
    </style></head><body><header><div><h1>PromoApp</h1><p class="muted">Preventivo ${escapeHtml(quote.number)}</p></div><div class="muted">Data: ${escapeHtml(quote.issuedOn)}${quote.validUntil?`<br>Valido fino al: ${escapeHtml(quote.validUntil)}`:""}</div></header>
    <h2>Destinatario</h2><div class="client">${client}</div><table><thead><tr><th>Descrizione</th><th>Quantità</th><th>Prezzo unitario</th><th>Importo</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="total">Totale concordato: ${money(quote.totalAmountCents)}</p>${quote.notes?`<h2>Note</h2><p class="notes">${escapeHtml(quote.notes)}</p>`:""}
    <script>window.onload=()=>window.print()</script></body></html>`;
  const win=window.open("","_blank");
  if(!win)throw new Error("Consenti l’apertura della finestra di stampa per salvare il PDF.");
  win.opener=null;
  win.document.write(html);win.document.close();
}

export default function FinanceQuotes({clients,onRefresh}:{clients:AdminFinanceClient[];onRefresh:()=>Promise<boolean>}){
  const [quotes,setQuotes]=useState<FinanceQuote[]>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [editor,setEditor]=useState<QuoteDraft|null>(null),[editing,setEditing]=useState<string|null>(null);
  const [converting,setConverting]=useState<string|null>(null),[conversion,setConversion]=useState<ConvertDraft|null>(null);
  const load=useCallback(async()=>{try{const response=await adminApi<FinanceQuotesResponse>("/finance/quotes");setQuotes(response.quotes);setError("");}
    catch(err){setError(err instanceof Error?err.message:"Preventivi non disponibili.");}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  const clientsSorted=useMemo(()=>[...clients].sort((a,b)=>(a.companyName||a.name).localeCompare(b.companyName||b.name,"it")),[clients]);
  const act=async(work:()=>Promise<unknown>,message:string)=>{
    setBusy(true);setError("");setNotice("");
    try{await work();await load();await onRefresh();setNotice(message);return true;}
    catch(err){setError(err instanceof Error?err.message:"Operazione non riuscita.");return false;}
    finally{setBusy(false);}
  };
  const saveQuote=async(event:React.FormEvent)=>{
    event.preventDefault();if(!editor)return;
    const input:FinanceQuoteInput={clientId:editor.clientId,issuedOn:editor.issuedOn,validUntil:editor.validUntil||null,notes:editor.notes,items:editor.items};
    const saved=await act(()=>editing?adminApi(`/finance/quotes/${editing}`,{method:"PATCH",body:JSON.stringify(input)}):adminApi("/finance/quotes",{method:"POST",body:JSON.stringify(input)}),editing?"Preventivo aggiornato.":"Preventivo creato.");
    if(saved){setEditor(null);setEditing(null);}
  };
  const setItem=(index:number,patch:Partial<FinanceQuoteLineInput>)=>setEditor(current=>current?{...current,items:current.items.map((item,i)=>i===index?{...item,...patch}:item)}:current);
  const beginEdit=(quote:FinanceQuote)=>{setEditing(quote.id);setEditor({clientId:quote.clientId,issuedOn:quote.issuedOn,validUntil:quote.validUntil??"",notes:quote.notes,
    items:quote.items.map(({description,quantity,unitPriceCents})=>({description,quantity,unitPriceCents}))});};
  const changeStatus=(quote:FinanceQuote,status:"sent"|"rejected"|"draft")=>void act(()=>adminApi(`/finance/quotes/${quote.id}/status`,{method:"POST",body:JSON.stringify({status})}),status==="sent"?"Preventivo segnato come inviato.":"Stato del preventivo aggiornato.");
  const saveConversion=async(event:React.FormEvent)=>{
    event.preventDefault();if(!conversion||!converting)return;
    const quote=quotes.find(item=>item.id===converting);if(!quote)return;
    const amount=(value:string)=>Math.round(Number(value||0)*100);
    const installments:FinanceQuoteConversionInput["installments"]=[];
    if(conversion.paymentType==="single")installments.push({description:"Saldo lavoro",amountCents:quote.totalAmountCents,dueDate:conversion.singleDueDate||null});
    if(conversion.paymentType==="advance"){
      const deposit=amount(conversion.deposit);
      if(!deposit||deposit>=quote.totalAmountCents){setError("L’acconto deve essere positivo e inferiore al totale.");return;}
      installments.push({description:"Acconto",amountCents:deposit,dueDate:conversion.depositDueDate||null},
        {description:"Saldo",amountCents:quote.totalAmountCents-deposit,dueDate:conversion.balanceDueDate||null});
    }
    if(conversion.paymentType==="installments")for(const row of conversion.installments){
      if(Number(row.amount)>0)installments.push({description:row.description||"Rata",amountCents:amount(row.amount),dueDate:row.dueDate||null});
    }
    if(conversion.paymentType==="installments"&&conversion.installmentCount){
      const count=Number(conversion.installmentCount);
      if(installments.length!==count){setError(`Hai indicato ${count} rate: aggiungi la stessa quantità di righe e inserisci ogni importo.`);return;}
      if(installments.reduce((sum,row)=>sum+row.amountCents,0)!==quote.totalAmountCents){
        setError("Le rate devono coprire esattamente il totale del preventivo.");return;
      }
    }
    if(conversion.paymentType==="installments"&&conversion.installments.some(row=>!row.amount||Number(row.amount)<=0)){
      setError("Inserisci l’importo di ogni rata oppure rimuovi la riga incompleta.");return;
    }
    const input:FinanceQuoteConversionInput={
      projectName:conversion.projectName.trim(),workType:conversion.workType||"other",paymentType:conversion.paymentType,
      depositAmountCents:conversion.paymentType==="advance"?amount(conversion.deposit):null,
      installmentCount:conversion.paymentType==="installments"&&conversion.installmentCount?Number(conversion.installmentCount):null,
      startDate:conversion.startDate||null,deliveryDate:conversion.deliveryDate||null,status:conversion.status,notes:"",
      installments,...(conversion.recurring?{recurring:{description:conversion.recurringDescription,amountCents:amount(conversion.recurringAmount),
        intervalMonths:conversion.recurringInterval as 1|3|6|12,startDate:conversion.recurringStart,nextDate:conversion.recurringNext,endDate:conversion.recurringEnd||null}}:{}),
    };
    const saved=await act(()=>adminApi(`/finance/quotes/${converting}/convert`,{method:"POST",body:JSON.stringify(input)}),"Preventivo convertito in lavoro; piano e canone registrati.");
    if(saved){setConverting(null);setConversion(null);}
  };
  return <section className="space-y-5" aria-label="Preventivi e lavori">
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
      <div><h3 className="font-bold">Preventivi → lavori</h3><p className="mt-1 text-sm text-slate-500">Il preventivo accettato diventa un lavoro, con rate e canoni collegati al cliente.</p></div>
      <Button disabled={busy||clients.length===0} onClick={()=>{setEditing(null);setEditor(emptyQuote(clientsSorted[0]?.id??""));setConverting(null);}}>
        Nuovo preventivo
      </Button>
    </div>
    {clients.length===0&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Prima inserisci un cliente nell’anagrafica.</p>}
    {editor&&<form onSubmit={saveQuote} className="space-y-4 rounded-2xl border border-indigo-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3"><h4 className="font-bold">{editing?"Modifica preventivo":"Crea preventivo"}</h4><button type="button" className="text-sm text-slate-500" onClick={()=>{setEditor(null);setEditing(null);}}>Chiudi</button></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <FinanceField label="Cliente"><select required className={fieldClass} value={editor.clientId} onChange={e=>setEditor({...editor,clientId:e.target.value})}>
          <option value="">Seleziona cliente</option>{clientsSorted.map(client=><option key={client.id} value={client.id}>{client.companyName||client.name}</option>)}
        </select></FinanceField>
        <FinanceField label="Data preventivo"><Input required type="date" className={fieldClass} value={editor.issuedOn} onChange={e=>setEditor({...editor,issuedOn:e.target.value})}/></FinanceField>
        <FinanceField label="Valido fino al (facoltativo)"><Input type="date" className={fieldClass} value={editor.validUntil} onChange={e=>setEditor({...editor,validUntil:e.target.value})}/></FinanceField>
      </div>
      <div className="space-y-2">
        {editor.items.map((item,index)=><div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_100px_150px_auto]">
          <FinanceField label={`Voce ${index+1}`}><Input required maxLength={240} className={fieldClass} value={item.description} onChange={e=>setItem(index,{description:e.target.value})}/></FinanceField>
          <FinanceField label="Quantità"><Input required type="number" min=".001" max="100000" step=".001" className={fieldClass} value={item.quantity} onChange={e=>setItem(index,{quantity:Number(e.target.value)})}/></FinanceField>
          <FinanceField label="Prezzo unitario (€)"><Input required type="number" min="0" step=".01" className={fieldClass} value={item.unitPriceCents/100} onChange={e=>setItem(index,{unitPriceCents:Math.round(Number(e.target.value)*100)})}/></FinanceField>
          <div className="flex items-end pb-1"><Button type="button" variant="outline" disabled={editor.items.length===1} onClick={()=>setEditor({...editor,items:editor.items.filter((_,i)=>i!==index)})}>Rimuovi</Button></div>
        </div>)}
        <Button type="button" size="sm" variant="outline" disabled={editor.items.length>=60} onClick={()=>setEditor({...editor,items:[...editor.items,{description:"",quantity:1,unitPriceCents:0}]})}>Aggiungi voce</Button>
      </div>
      <FinanceField label="Note (facoltative)"><textarea rows={2} maxLength={4000} className={fieldClass} value={editor.notes} onChange={e=>setEditor({...editor,notes:e.target.value})}/></FinanceField>
      <div className="flex flex-wrap gap-2"><Button disabled={busy}>{busy?"Salvataggio…":"Salva preventivo"}</Button><Button type="button" variant="outline" onClick={()=>{setEditor(null);setEditing(null);}}>Annulla</Button></div>
    </form>}
    {loading?<p className="rounded-xl border bg-white p-5 text-sm text-slate-500">Caricamento preventivi…</p>:
      quotes.length===0?<p className="rounded-xl border bg-white p-5 text-sm text-slate-500">Non ci sono ancora preventivi registrati.</p>:
      <div className="space-y-3">{quotes.map(quote=><article key={quote.id} className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold text-indigo-700">{quote.number} · {statusLabel[quote.status]}</p>
            <h4 className="mt-1 font-bold">{quote.companyName||quote.clientName}</h4>
            <p className="text-xs text-slate-500">Emesso il {quote.issuedOn}{quote.validUntil?` · valido fino al ${quote.validUntil}`:""}</p>
          </div><div className="text-right"><p className="text-lg font-bold">{money(quote.totalAmountCents)}</p>
            <Button size="sm" variant="outline" onClick={()=>{try{printQuote(quote);setError("");}catch(err){setError(err instanceof Error?err.message:"Stampa non disponibile.");}}}>Stampa / salva PDF</Button></div>
        </div>
        <ul className="my-3 divide-y rounded-xl border">{quote.items.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm"><span>{item.description} <span className="text-slate-500">× {item.quantity}</span></span><span>{money(item.totalCents)}</span></li>)}</ul>
        {quote.notes&&<p className="mb-3 whitespace-pre-wrap text-sm text-slate-600">{quote.notes}</p>}
        {quote.projectId&&<p className="mb-2 text-sm font-medium text-emerald-700">Lavoro collegato creato: {quote.projectId}</p>}
        <div className="flex flex-wrap gap-3 text-sm">
          {quote.status==="draft"&&<button disabled={busy} className="font-semibold text-indigo-700" onClick={()=>beginEdit(quote)}>Modifica bozza</button>}
          {quote.status==="draft"&&<button disabled={busy} className="font-semibold text-indigo-700" onClick={()=>changeStatus(quote,"sent")}>Segna come inviato</button>}
          {(quote.status==="draft"||quote.status==="sent")&&!quote.projectId&&<button disabled={busy} className="font-semibold text-emerald-700" onClick={()=>{setConverting(quote.id);setConversion(newConvert(quote));setEditor(null);}}>Accettato → crea lavoro</button>}
          {(quote.status==="draft"||quote.status==="sent")&&<button disabled={busy} className="font-semibold text-rose-700" onClick={()=>changeStatus(quote,"rejected")}>Segna rifiutato</button>}
        </div>
        {converting===quote.id&&conversion&&<form onSubmit={saveConversion} className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between"><h5 className="font-bold">Converti in lavoro per {quote.companyName||quote.clientName}</h5><button type="button" className="text-xs text-slate-500" onClick={()=>{setConverting(null);setConversion(null);}}>Annulla</button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FinanceField label="Nome del lavoro"><Input required maxLength={160} className={fieldClass} value={conversion.projectName} onChange={e=>setConversion({...conversion,projectName:e.target.value})}/></FinanceField>
            <FinanceField label="Tipo di lavoro"><select required className={fieldClass} value={conversion.workType} onChange={e=>setConversion({...conversion,workType:e.target.value as ConvertDraft["workType"]})}>
              <option value="">Seleziona</option><option value="website">Sito web</option><option value="web_app">Applicazione web</option><option value="management">Gestionale</option>
              <option value="ecommerce">E-commerce</option><option value="ads">Pubblicità</option><option value="seo">SEO</option><option value="other">Altro</option>
            </select></FinanceField>
            <FinanceField label="Stato del lavoro"><select className={fieldClass} value={conversion.status} onChange={e=>setConversion({...conversion,status:e.target.value as FinanceQuoteConversionInput["status"]})}>
              <option value="waiting_deposit">In attesa dell’acconto</option><option value="in_progress">In lavorazione</option><option value="in_review">In revisione</option>
              <option value="delivered">Consegnato</option><option value="closed">Chiuso</option><option value="cancelled">Annullato</option>
            </select></FinanceField>
            <FinanceField label="Modalità di pagamento"><select className={fieldClass} value={conversion.paymentType} onChange={e=>setConversion({...conversion,paymentType:e.target.value as ConvertDraft["paymentType"],deposit:"",installmentCount:"",installments:[]})}>
              <option value="single">Unica soluzione</option><option value="advance">Acconto + saldo</option><option value="installments">Rate</option>
            </select></FinanceField>
            <FinanceField label="Inizio lavoro (facoltativo)"><Input type="date" className={fieldClass} value={conversion.startDate} onChange={e=>setConversion({...conversion,startDate:e.target.value})}/></FinanceField>
            <FinanceField label="Consegna prevista (facoltativa)"><Input type="date" className={fieldClass} value={conversion.deliveryDate} onChange={e=>setConversion({...conversion,deliveryDate:e.target.value})}/></FinanceField>
          </div>
          {conversion.paymentType==="single"&&<FinanceField label="Scadenza saldo (facoltativa)"><Input type="date" className={fieldClass} value={conversion.singleDueDate} onChange={e=>setConversion({...conversion,singleDueDate:e.target.value})}/></FinanceField>}
          {conversion.paymentType==="advance"&&<div className="grid gap-3 sm:grid-cols-3">
            <FinanceField label="Acconto concordato (€)"><Input required type="number" min=".01" max={quote.totalAmountCents/100-.01} step=".01" className={fieldClass} value={conversion.deposit} onChange={e=>setConversion({...conversion,deposit:e.target.value})}/></FinanceField>
            <FinanceField label="Scadenza acconto"><Input type="date" className={fieldClass} value={conversion.depositDueDate} onChange={e=>setConversion({...conversion,depositDueDate:e.target.value})}/></FinanceField>
            <FinanceField label="Scadenza saldo"><Input type="date" className={fieldClass} value={conversion.balanceDueDate} onChange={e=>setConversion({...conversion,balanceDueDate:e.target.value})}/></FinanceField>
          </div>}
          {conversion.paymentType==="installments"&&<div className="space-y-3 rounded-xl border bg-white p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FinanceField label="Numero rate (facoltativo)"><Input type="number" min="2" max="60" step="1" placeholder="Se noto" className={fieldClass} value={conversion.installmentCount} onChange={e=>setConversion({...conversion,installmentCount:e.target.value})}/></FinanceField>
              <p className="self-end text-xs text-slate-500">Se non conosci le rate, registra il residuo da pianificare e aggiungi scadenze quando le concordi.</p>
            </div>
            {conversion.installments.map((row,index)=><div key={index} className="grid gap-2 sm:grid-cols-[1fr_140px_150px_auto]">
              <Input aria-label={`Descrizione rata ${index+1}`} placeholder={`Rata ${index+1}`} value={row.description} onChange={e=>setConversion({...conversion,installments:conversion.installments.map((item,i)=>i===index?{...item,description:e.target.value}:item)})}/>
              <Input aria-label={`Importo rata ${index+1}`} type="number" min=".01" step=".01" value={row.amount} onChange={e=>setConversion({...conversion,installments:conversion.installments.map((item,i)=>i===index?{...item,amount:e.target.value}:item)})}/>
              <Input aria-label={`Scadenza rata ${index+1}`} type="date" value={row.dueDate} onChange={e=>setConversion({...conversion,installments:conversion.installments.map((item,i)=>i===index?{...item,dueDate:e.target.value}:item)})}/>
              <Button type="button" variant="outline" onClick={()=>setConversion({...conversion,installments:conversion.installments.filter((_,i)=>i!==index)})}>Rimuovi</Button>
            </div>)}
            <Button type="button" size="sm" variant="outline" onClick={()=>setConversion({...conversion,installments:[...conversion.installments,{description:`Rata ${conversion.installments.length+1}`,amount:"",dueDate:""}]})}>Aggiungi rata</Button>
          </div>}
          <div className="rounded-xl border bg-white p-3">
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={conversion.recurring} onChange={e=>setConversion({...conversion,recurring:e.target.checked})}/> Aggiungi un canone ricorrente collegato</label>
            {conversion.recurring&&<div className="mt-3 grid gap-3 sm:grid-cols-2">
              <FinanceField label="Descrizione canone"><Input required className={fieldClass} value={conversion.recurringDescription} onChange={e=>setConversion({...conversion,recurringDescription:e.target.value})}/></FinanceField>
              <FinanceField label="Importo per periodo (€)"><Input required type="number" min=".01" step=".01" className={fieldClass} value={conversion.recurringAmount} onChange={e=>setConversion({...conversion,recurringAmount:e.target.value})}/></FinanceField>
              <FinanceField label="Frequenza"><select className={fieldClass} value={conversion.recurringInterval} onChange={e=>setConversion({...conversion,recurringInterval:Number(e.target.value)})}><option value={1}>Mensile</option><option value={3}>Trimestrale</option><option value={6}>Semestrale</option><option value={12}>Annuale</option></select></FinanceField>
              <FinanceField label="Decorrenza"><Input required type="date" className={fieldClass} value={conversion.recurringStart} onChange={e=>setConversion({...conversion,recurringStart:e.target.value})}/></FinanceField>
              <FinanceField label="Prossima scadenza"><Input required type="date" className={fieldClass} value={conversion.recurringNext} onChange={e=>setConversion({...conversion,recurringNext:e.target.value})}/></FinanceField>
              <FinanceField label="Fine canone (facoltativa)"><Input type="date" className={fieldClass} value={conversion.recurringEnd} onChange={e=>setConversion({...conversion,recurringEnd:e.target.value})}/></FinanceField>
            </div>}
          </div>
          <Button disabled={busy}>{busy?"Salvataggio…":"Conferma accettazione e crea lavoro"}</Button>
        </form>}
      </article>)}</div>}
  </section>;
}
