import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { AdminFinanceData, FinanceWorkspace } from "@workspace/api-client-react";
import { cash, confirmed, fieldClass, iso, money, categoryLabels } from "./finance-ui";
import { FinanceField } from "./FinanceDetailsFields";

export default function FinanceDashboard({data,workspace,month}:{data?:AdminFinanceData;workspace?:FinanceWorkspace;month:string}) {
  const [period,setPeriod]=useState("month"),[client,setClient]=useState(""),[project,setProject]=useState(""),[category,setCategory]=useState("");
  const [customFrom,setCustomFrom]=useState(""),[customTo,setCustomTo]=useState("");
  const [compareFrom,setCompareFrom]=useState(""),[compareTo,setCompareTo]=useState("");
  const year=Number(month.slice(0,4)),m=Number(month.slice(-2));
  const startMonth=period==="year"?1:period==="quarter"?Math.floor((m-1)/3)*3+1:m;
  const endMonth=period==="year"?12:period==="quarter"?startMonth+2:m;
  const from=period==="custom"?customFrom:`${year}-${String(startMonth).padStart(2,"0")}-01`;
  const to=period==="custom"?customTo:new Date(Date.UTC(year,endMonth,0)).toISOString().slice(0,10);
  const projects=(data?.projects??[]).filter(p=>(!client||p.clientId===client)&&(!project||p.id===project));
  const entries=(data?.entries??[]).filter(e=>(!client||projects.some(p=>p.id===e.projectId)||e.details?.clientId===client)&&(!project||e.projectId===project)&&(!category||e.category===category));
  const inRange=(value:string,a:string,b:string)=>!!a&&!!b&&value>=a&&value<=b;
  const day=(value:Date|string)=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
  const metrics=(a:string,b:string)=>{
    const paid=entries.filter(e=>cash(e)&&e.paidAt&&inRange(day(e.paidAt),a,b));
    const sum=(direction:string)=>paid.filter(e=>e.direction===direction).reduce((s,e)=>s+e.amountCents,0);
    const sold=projects.filter(p=>confirmed(p)&&p.details?.confirmedDate&&inRange(p.details.confirmedDate,a,b)).reduce((s,p)=>s+p.totalAmountCents+(p.details?.extraCents??0),0);
    const direct=paid.filter(e=>e.direction==="expense"&&e.projectId).reduce((s,e)=>s+e.amountCents,0);
    const general=paid.filter(e=>e.direction==="expense"&&!e.projectId).reduce((s,e)=>s+e.amountCents,0);
    return {paid,sold,received:sum("income"),spent:sum("expense"),direct,general};
  };
  const current=metrics(from,to),previous=metrics(compareFrom,compareTo);
  const stock=projects.filter(p=>confirmed(p)).reduce((s,p)=>s+p.outstandingCents,0);
  const potential=projects.filter(p=>!confirmed(p)&&p.details?.amountKnown).reduce((s,p)=>s+p.totalAmountCents+(p.details?.extraCents??0),0);
  const recurring=(workspace?.recurring??[]).filter(r=>(!client||r.clientId===client||projects.some(p=>p.id===r.projectId))&&(!project||r.projectId===project));
  const recurrent=(direction:string,state:string)=>recurring.filter(r=>r.direction===direction&&r.state===state).reduce((s,r)=>s+r.amountCents/r.intervalMonths,0);
  const acquiredClients=(data?.clients??[]).filter(c=>(!client||c.id===client)&&(!project||projects.some(p=>p.clientId===c.id))&&c.details?.acquisitionDate&&inRange(c.details.acquisitionDate,from,to));
  const knownClients=acquiredClients.filter(c=>!!c.details?.acquisitionSource?.trim());
  const acquired=acquiredClients.length;
  const acquisitionCost=current.paid.filter(e=>e.direction==="expense"&&e.details?.acquisitionCost&&["facebook","google"].includes(e.category)&&knownClients.some(c=>c.id===e.details?.clientId||projects.some(p=>p.id===e.projectId&&p.clientId===c.id))).reduce((s,e)=>s+e.amountCents,0);
  const monthly=useMemo(()=>{
    const map=new Map<string,{month:string;Incassi:number;Spese:number}>();
    if(from&&to&&from<=to){
      const d=new Date(`${from.slice(0,7)}-01T00:00:00Z`);
      for(let i=0;i<120&&d.toISOString().slice(0,10)<=to;i++,d.setUTCMonth(d.getUTCMonth()+1)) {
        const key=d.toISOString().slice(0,7);map.set(key,{month:key,Incassi:0,Spese:0});
      }
    }
    for(const e of current.paid){const key=day(e.paidAt!).slice(0,7);const point=map.get(key);if(point)point[e.direction==="income"?"Incassi":"Spese"]+=e.amountCents/100;}
    return [...map.values()];
  },[JSON.stringify(current.paid),from,to]);
  const distribution=(kind:"client"|"service")=>{
    const map=new Map<string,number>();
    for(const e of current.paid.filter(e=>e.direction==="income")){
      const p=projects.find(p=>p.id===e.projectId);
      const label=kind==="service"?(p?.details?.service||"Servizio da specificare"):(e.clientName||(data?.clients??[]).find(c=>c.id===e.details?.clientId)?.name||"Cliente non assegnato");
      map.set(label,(map.get(label)??0)+e.amountCents/100);
    }
    return [...map].map(([name,value])=>({name,Euro:value})).sort((a,b)=>b.Euro-a.Euro);
  };
  const tiles=[
    ["Venduto nel periodo",current.sold,previous.sold],
    ["Incassato verificato",current.received,previous.received],
    ["Speso verificato",current.spent,previous.spent],
    ["Saldo di cassa",current.received-current.spent,previous.received-previous.spent],
    ["Crediti contrattuali attuali",stock,null],
    ["Potenziale attuale",potential,null],
    ["Da pagare nel periodo",entries.filter(e=>e.direction==="expense"&&!e.paidAt&&!e.details?.cancelled&&e.details?.amountConfirmed&&inRange(iso(e.dueDate),from,to)).reduce((s,e)=>s+e.amountCents,0),null],
    ["Canoni maturati non incassati",entries.filter(e=>e.direction==="income"&&e.details?.recurringId&&!e.paidAt&&!e.details?.cancelled&&iso(e.dueDate)<=new Date().toISOString().slice(0,10)).reduce((s,e)=>s+e.amountCents,0),null],
  ] as const;
  const allProjects=data?.projects??[];
  const allEntries=data?.entries??[];
  const soldTotal=allProjects.filter(confirmed).reduce((sum,p)=>sum+p.totalAmountCents+(p.details?.extraCents??0),0);
  const receivedTotal=allEntries.filter(e=>e.direction==="income"&&cash(e)).reduce((sum,e)=>sum+e.amountCents,0);
  const spentTotal=allEntries.filter(e=>e.direction==="expense"&&cash(e)).reduce((sum,e)=>sum+e.amountCents,0);
  const monthlySold=allEntries.filter(e=>e.direction==="income"&&(e.category==="monthly_fee"||e.details?.recurringId)&&!e.details?.cancelled&&e.details?.amountConfirmed).reduce((sum,e)=>sum+e.amountCents,0);
  const allTimeTiles=[
    ["Venduto complessivo",soldTotal+monthlySold,"Accordi confermati + canoni generati"],
    ["Incassato complessivo",receivedTotal,"Pagamenti effettivi registrati"],
    ["Da incassare",data?.summary.outstandingCents??0,"Residui lavori + scadenze canoni, senza doppioni"],
    ["Speso complessivo",spentTotal,"Spese effettivamente pagate"],
    ["Saldo di cassa",receivedTotal-spentTotal,"Incassato meno speso"],
    ["Margine gestionale",soldTotal+monthlySold-spentTotal,"Venduto meno spese pagate; non utile fiscale"],
  ] as const;
  return <section aria-label="Dashboard controllo economico" className="space-y-5">
    <div><h3 className="text-lg font-bold">Bilancio PromoApp</h3><p className="mt-1 text-sm text-slate-500">Totali complessivi del gestionale, indipendenti dal mese e dai filtri sottostanti.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{allTimeTiles.map(([label,value,help],index)=><article key={label} className="rounded-2xl border border-indigo-100 bg-white p-5" data-testid={`finance-total-${index}`}><h4 className="text-sm font-semibold text-slate-600">{label}</h4><p className="mt-2 text-2xl font-bold text-indigo-800">{data?money(value):"…"}</p><p className="mt-2 text-xs text-slate-500">{help}</p></article>)}</div>
    <p className="text-xs text-slate-500">I canoni futuri non ancora generati non sono vendite o crediti. Importi da verificare e proposte restano esclusi; i pagamenti non riconciliati sono segnalati nei movimenti.</p>
    <h3 className="text-lg font-bold">Analisi per periodo</h3>
    <div className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-3 xl:grid-cols-5">
      <FinanceField label="Periodo"><select className={fieldClass} value={period} onChange={e=>setPeriod(e.target.value)}><option value="month">Mese selezionato</option><option value="quarter">Trimestre</option><option value="year">Anno</option><option value="custom">Personalizzato</option></select></FinanceField>
      <FinanceField label="Cliente"><select className={fieldClass} value={client} onChange={e=>{setClient(e.target.value);setProject("");}}><option value="">Tutti</option>{data?.clients.map(c=><option key={c.id} value={c.id}>{c.companyName||c.name}</option>)}</select></FinanceField>
      <FinanceField label="Progetto"><select className={fieldClass} value={project} onChange={e=>setProject(e.target.value)}><option value="">Tutti</option>{data?.projects.filter(p=>!client||p.clientId===client).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></FinanceField>
      <FinanceField label="Categoria movimenti"><select className={fieldClass} value={category} onChange={e=>setCategory(e.target.value)}><option value="">Tutte</option>{Object.entries(categoryLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></FinanceField>
      {period==="custom"&&<><FinanceField label="Dal"><input type="date" className={fieldClass} value={customFrom} onChange={e=>setCustomFrom(e.target.value)}/></FinanceField><FinanceField label="Al"><input type="date" className={fieldClass} value={customTo} onChange={e=>setCustomTo(e.target.value)}/></FinanceField></>}
      <FinanceField label="Confronto dal"><input type="date" className={fieldClass} value={compareFrom} onChange={e=>setCompareFrom(e.target.value)}/></FinanceField>
      <FinanceField label="Confronto al"><input type="date" className={fieldClass} value={compareTo} onChange={e=>setCompareTo(e.target.value)}/></FinanceField>
      <p className="text-xs text-slate-500 sm:col-span-3 xl:col-span-5">Venduto per data accordo; cassa per data effettiva. Crediti e potenziale sono consistenze attuali, non fatturato del periodo. La categoria filtra i movimenti, non il valore degli accordi. Da {from||"definire"} a {to||"definire"}.</p>
    </div>
    {from&&to&&from>to&&<p role="alert" className="text-rose-700">La data iniziale deve precedere quella finale.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tiles.map(([label,value,comparison])=><article key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-xs text-slate-500">{label}</h3><p className="mt-2 text-xl font-bold text-indigo-800">{money(value)}</p>
      {compareFrom&&compareTo&&comparison!==null&&<p className="mt-1 text-xs text-slate-500">Confronto {money(comparison)} · Δ {money(value-comparison)}</p>}
    </article>)}</div>
    <div className="grid gap-3 rounded-2xl border bg-white p-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
      <p>Costi diretti pagati: <strong>{money(current.direct)}</strong></p><p>Costi generali pagati: <strong>{money(current.general)}</strong></p>
      <p>Margine commerciale diretto: <strong>{money(current.sold-current.direct)}</strong></p>
      <p>Margine dopo costi generali: <strong>{money(current.sold-current.direct-current.general)}</strong></p>
      <p>Canoni attivi / mese: <strong>{money(Math.round(recurrent("income","active")))}</strong></p><p>Canoni potenziali / mese: <strong>{money(Math.round(recurrent("income","potential")))}</strong></p>
      <p>Costi ricorrenti attivi / mese: <strong>{money(Math.round(recurrent("expense","active")))}</strong></p>
      <p>Clienti acquisiti con data nota: <strong>{acquired}</strong> · origine nota {knownClients.length}</p>
      <p>Costo acquisizione attribuito: <strong>{knownClients.length&&acquisitionCost?money(Math.round(acquisitionCost/knownClients.length)):"Non calcolabile"}</strong></p>
      <p>Demo: <strong>{projects.filter(p=>p.details?.commercialState==="demo").length}</strong> · preventivi: <strong>{projects.filter(p=>p.details?.commercialState==="quote").length}</strong></p>
      <p>In lavorazione: <strong>{projects.filter(p=>p.details?.operationalState==="working").length}</strong> · consegnati: <strong>{projects.filter(p=>p.details?.operationalState==="delivered").length}</strong></p>
      <p className="text-xs text-slate-500 sm:col-span-2 xl:col-span-3">Margini gestionali: accordi del periodo meno costi verificati pagati nel periodo, non margini fiscali o di competenza. Nessuna ripartizione dei costi generali. Acquisizione: solo pubblicità direttamente attribuita ai clienti di origine nota; costi non attribuiti esclusi, non stimati. Stati e canoni: situazione attuale.</p>
    </div>
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="font-semibold">Andamento mensile incassi / spese</h3><p className="text-xs text-slate-500">EUR · solo pagamenti riconciliati · fino a 120 mesi; nessuna stima</p>
      {monthly.length?<div className="mt-4 h-64 min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}>
        <XAxis dataKey="month" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip formatter={(v:number)=>money(v*100)}/><Legend/>
        <Bar dataKey="Incassi" fill="#44986D"/><Bar dataKey="Spese" fill="#D8524F"/>
      </BarChart></ResponsiveContainer></div>:<p className="py-6 text-sm text-slate-500">Seleziona un periodo valido.</p>}
    </div>
    <div className="grid gap-4 xl:grid-cols-2">{(["client","service"] as const).map(kind=><div key={kind} className="min-w-0 rounded-2xl border bg-white p-4">
      <h3 className="font-semibold">Incassi per {kind==="client"?"cliente":"servizio"}</h3>
      {distribution(kind).length?<div className="mt-3 max-h-96 overflow-y-auto"><div style={{height:Math.max(180,distribution(kind).length*45)}}><ResponsiveContainer width="100%" height="100%"><BarChart data={distribution(kind)} layout="vertical" margin={{left:0,right:15}}>
        <XAxis type="number"/><YAxis type="category" dataKey="name" width={125} tick={{fontSize:10}}/><Tooltip formatter={(v:number)=>money(v*100)}/><Bar dataKey="Euro" fill="#61A9BD"/>
      </BarChart></ResponsiveContainer></div></div>:<p className="py-6 text-sm text-slate-500">Nessun incasso riconciliato nel periodo.</p>}
    </div>)}</div>
  </section>;
}
