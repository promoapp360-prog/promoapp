import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminFinanceClient, AdminFinanceProject, FinanceScheduleItem, FinanceScheduleResponse } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { FinanceField } from "./FinanceDetailsFields";
import { fieldClass, money } from "./finance-ui";

const statusText:Record<FinanceScheduleItem["status"],string>={open:"Da gestire",partial:"Parziale",paid:"Pagato",planned:"Previsto",overdue:"Scaduto",completed:"Completato"};
const typeText:Record<FinanceScheduleItem["sourceType"],string>={installment:"Incasso / rata",expense:"Spesa",recurring:"Canone",delivery:"Consegna lavoro",manual:"Promemoria"};
const weekday=["L","M","M","G","V","S","D"];
function dayName(month:string,day:number){return `${month}-${String(day).padStart(2,"0")}`;}
function formatDate(value:string){const [y,m,d]=value.slice(0,10).split("-").map(Number);return new Date(Date.UTC(y,m-1,d)).toLocaleDateString("it-IT",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});}

export default function FinanceSchedule({month,onMonth,clients,projects,onRefresh}:{month:string;onMonth:(month:string)=>void;clients:AdminFinanceClient[];projects:AdminFinanceProject[];onRefresh:()=>Promise<boolean>}){
  const [items,setItems]=useState<FinanceScheduleItem[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  const [selectedDate,setSelectedDate]=useState(`${month}-01`);
  const [showForm,setShowForm]=useState(false);
  const [draft,setDraft]=useState({title:"",dueDate:`${month}-01`,clientId:"",projectId:"",notes:""});
  const load=useCallback(async()=>{setLoading(true);try{const result=await adminApi<FinanceScheduleResponse>(`/finance/schedule?month=${encodeURIComponent(month)}`);setItems(result.items);setError("");}
    catch(err){setError(err instanceof Error?err.message:"Scadenzario non disponibile.");}finally{setLoading(false);}},[month]);
  useEffect(()=>{void load();setSelectedDate(`${month}-01`);setDraft(value=>({...value,dueDate:`${month}-01`}));},[load,month]);
  const [year,monthNumber]=month.split("-").map(Number);
  const firstWeekday=(new Date(Date.UTC(year,monthNumber-1,1)).getUTCDay()+6)%7;
  const daysInMonth=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
  const cells=Array.from({length:firstWeekday},(_,i)=>({key:`blank-${i}`,day:0})).concat(Array.from({length:daysInMonth},(_,i)=>({key:String(i+1),day:i+1})));
  const eventsByDay=useMemo(()=>{const map=new Map<string,FinanceScheduleItem[]>();for(const item of items){const day=item.dueDate.slice(0,10);map.set(day,[...(map.get(day)??[]),item]);}return map;},[items]);
  const selectedItems=eventsByDay.get(selectedDate)??[];
  const overdueCount=items.filter(item=>item.status==="overdue").length;
  const openCount=items.filter(item=>["open","partial","overdue"].includes(item.status)).length;
  const act=async(work:()=>Promise<unknown>,message:string)=>{setBusy(true);setError("");setNotice("");
    try{await work();await load();await onRefresh();setNotice(message);return true;}
    catch(err){setError(err instanceof Error?err.message:"Operazione non riuscita.");return false;}
    finally{setBusy(false);}};
  const create=async(event:React.FormEvent)=>{event.preventDefault();
    const saved=await act(()=>adminApi("/finance/manual-reminders",{method:"POST",body:JSON.stringify({
      title:draft.title.trim(),dueDate:draft.dueDate,clientId:draft.clientId||null,projectId:draft.projectId||null,notes:draft.notes,
    })}),"Promemoria salvato.");
    if(saved){setShowForm(false);setDraft({title:"",dueDate:selectedDate,clientId:"",projectId:"",notes:""});}
  };
  const complete=(item:FinanceScheduleItem)=>void act(()=>adminApi(`/finance/manual-reminders/${item.id}`,{method:"PATCH",body:JSON.stringify({completed:item.status!=="completed"})}),
    item.status==="completed"?"Promemoria riaperto.":"Promemoria completato.");
  const changeMonth=(offset:number)=>{const next=new Date(Date.UTC(year,monthNumber-1+offset,1));onMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth()+1).padStart(2,"0")}`);};
  return <section className="space-y-5" aria-label="Scadenzario">
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5">
      <div><h3 className="font-bold">Scadenzario incassi, spese e lavori</h3><p className="mt-1 text-sm text-slate-500">Le date future dei canoni sono previsioni; diventano incassi da ricevere solo quando maturano.</p></div>
      <Button disabled={busy} onClick={()=>{setDraft({title:"",dueDate:selectedDate,clientId:"",projectId:"",notes:""});setShowForm(value=>!value);}}>Nuovo promemoria</Button>
    </div>
    {showForm&&<form onSubmit={create} className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2">
      <h4 className="font-bold sm:col-span-2">Promemoria manuale</h4>
      <FinanceField label="Titolo"><Input required maxLength={240} className={fieldClass} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></FinanceField>
      <FinanceField label="Data"><Input required type="date" className={fieldClass} value={draft.dueDate} onChange={e=>setDraft({...draft,dueDate:e.target.value})}/></FinanceField>
      <FinanceField label="Cliente (facoltativo)"><select className={fieldClass} value={draft.clientId} onChange={e=>setDraft({...draft,clientId:e.target.value,projectId:""})}>
        <option value="">Nessuno</option>{clients.map(client=><option key={client.id} value={client.id}>{client.companyName||client.name}</option>)}
      </select></FinanceField>
      <FinanceField label="Lavoro collegato (facoltativo)"><select className={fieldClass} value={draft.projectId} onChange={e=>{const project=projects.find(item=>item.id===e.target.value);setDraft({...draft,projectId:e.target.value,clientId:project?.clientId??""});}}>
        <option value="">Nessuno</option>{projects.filter(project=>!draft.clientId||project.clientId===draft.clientId).map(project=><option key={project.id} value={project.id}>{project.clientName} · {project.name}</option>)}
      </select></FinanceField>
      <FinanceField label="Note (facoltative)"><textarea maxLength={2000} rows={2} className={fieldClass} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></FinanceField>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Salva promemoria</Button><Button type="button" variant="outline" onClick={()=>setShowForm(false)}>Annulla</Button></div>
    </form>}
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Scadenze da gestire</p><strong className="text-xl">{openCount}</strong></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Scadenze scadute</p><strong className="text-xl text-rose-700">{overdueCount}</strong></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Voci nel mese</p><strong className="text-xl">{items.length}</strong></div>
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.9fr)]">
      <div className="rounded-2xl border bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" onClick={()=>changeMonth(-1)} aria-label="Mese precedente" className="rounded-lg border px-3 py-2">‹</button>
          <label className="font-bold capitalize">{new Date(Date.UTC(year,monthNumber-1,1)).toLocaleDateString("it-IT",{month:"long",year:"numeric",timeZone:"UTC"})}
            <Input aria-label="Scegli mese scadenzario" type="month" className="ml-2 inline-block w-40 font-normal" value={month} onChange={e=>e.target.value&&onMonth(e.target.value)}/>
          </label>
          <button type="button" onClick={()=>changeMonth(1)} aria-label="Mese successivo" className="rounded-lg border px-3 py-2">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">{weekday.map((day,index)=><div key={`${day}-${index}`} className="py-2">{day}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({key,day})=>day===0?<div key={key} className="min-h-16"/>:<button key={key} type="button" aria-pressed={selectedDate===dayName(month,day)}
            onClick={()=>setSelectedDate(dayName(month,day))} className={`flex min-h-16 flex-col items-center rounded-xl border p-1 text-sm ${selectedDate===dayName(month,day)?"border-indigo-600 bg-indigo-50":"border-transparent hover:border-slate-200"}`}>
            <span>{day}</span><span className="mt-1 flex gap-1">{(eventsByDay.get(dayName(month,day))??[]).slice(0,4).map((item,index)=><i key={`${item.id}-${index}`} aria-label={typeText[item.sourceType]} className={`h-1.5 w-1.5 rounded-full ${item.status==="overdue"?"bg-rose-500":item.sourceType==="expense"?"bg-amber-500":item.status==="completed"||item.status==="paid"?"bg-slate-400":"bg-emerald-500"}`}/>)}</span>
          </button>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500"/>Incassi / promemoria</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500"/>Spese</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500"/>Scaduti</span></div>
      </div>
      <div className="rounded-2xl border bg-white p-4 sm:p-5">
        <h4 className="mb-3 font-bold">{formatDate(selectedDate)}</h4>
        {loading?<p className="text-sm text-slate-500">Caricamento scadenze…</p>:selectedItems.length===0?<p className="text-sm text-slate-500">Nessuna voce per questa data.</p>:
          <ul className="space-y-3">{selectedItems.map(item=><li key={item.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-indigo-700">{typeText[item.sourceType]} · {statusText[item.status]}</p>
              <p className="mt-1 font-semibold">{item.title}</p>{item.clientName&&<p className="text-xs text-slate-500">{item.clientName}</p>}
            </div>{item.amountCents!==null&&<strong className={`shrink-0 ${item.sourceType==="expense"?"text-rose-700":"text-slate-800"}`}>{item.sourceType==="expense"?"−":""}{money(item.amountCents)}</strong>}</div>
            {item.notes&&<p className="mt-2 text-xs text-slate-500">{item.notes}</p>}
            {item.sourceType==="manual"&&<button type="button" disabled={busy} onClick={()=>complete(item)} className="mt-2 text-xs font-semibold text-indigo-700">{item.status==="completed"?"Riapri promemoria":"Segna completato"}</button>}
          </li>)}</ul>}
      </div>
    </div>
  </section>;
}
