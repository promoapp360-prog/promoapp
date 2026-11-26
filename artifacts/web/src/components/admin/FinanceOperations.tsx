import { useState } from "react";
import type { AdminFinanceData, FinanceWorkspace, FinanceRecurringInput } from "@workspace/api-client-react";
import { adminApi } from "@/lib/admin-api";
import { appPath } from "@/lib/marketing";
import { Button } from "@/components/ui/button";
import { FinanceField } from "./FinanceDetailsFields";
import FinanceDevelopmentTransfer from "./FinanceDevelopmentTransfer";
import { categoryLabels, fieldClass, money, cash, iso } from "./finance-ui";

export default function FinanceOperations({data,workspace,onRefresh}:{data?:AdminFinanceData;workspace?:FinanceWorkspace;onRefresh:()=>Promise<void>}) {
  const [editor,setEditor]=useState<FinanceRecurringInput|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const fresh=():FinanceRecurringInput=>({direction:"income",category:"monthly_fee",description:"",amountCents:0,intervalMonths:1,state:"potential",startDate:null,nextDate:null});
  const act=async (work:()=>Promise<unknown>)=>{
    setError("");setBusy(true);setNotice("");
    try {await work();await onRefresh();setNotice("Operazione completata e dati ricaricati.");return true;}
    catch(err){setError(err instanceof Error?err.message:"Operazione non riuscita.");return false;}
    finally{setBusy(false);}
  };
  const set=(patch:Partial<FinanceRecurringInput>)=>setEditor(editor?{...editor,...patch}:null);
  return <section className="space-y-5" aria-label="Canoni, storico ed esportazione">
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice&&<p role="status" className="text-sm text-emerald-800">{notice}</p>}
    <section className="rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">Canoni e costi ricorrenti</h3><Button size="sm" disabled={busy} onClick={()=>setEditor(fresh())}>Nuova ricorrenza</Button></div>
      <p className="my-3 text-xs text-slate-500">Nessun incasso automatico. “Genera prossima scadenza” crea una sola obbligazione non pagata e avanza la data. Le mensilità rimangono consultabili nello storico.</p>
      {editor&&<form className="mb-4 grid gap-3 rounded-xl bg-indigo-50/50 p-4 sm:grid-cols-2" onSubmit={async e=>{
        e.preventDefault();if(await act(()=>adminApi("/finance/recurring",{method:"POST",body:JSON.stringify(editor)})))setEditor(null);
      }}>
        <FinanceField label="Descrizione servizio / costo"><input required maxLength={240} className={fieldClass} value={editor.description} onChange={e=>set({description:e.target.value})}/></FinanceField>
        <FinanceField label="Tipo"><select className={fieldClass} value={editor.direction} onChange={e=>set({direction:e.target.value as "income"|"expense",category:e.target.value==="income"?"monthly_fee":"software"})}><option value="income">Canone cliente</option><option value="expense">Costo ricorrente</option></select></FinanceField>
        <FinanceField label="Cliente"><select className={fieldClass} value={editor.clientId??""} onChange={e=>set({clientId:e.target.value||null,projectId:null})}><option value="">Nessuno / costo generale</option>{data?.clients.map(c=><option key={c.id} value={c.id}>{c.companyName||c.name}</option>)}</select></FinanceField>
        <FinanceField label="Lavoro collegato"><select className={fieldClass} value={editor.projectId??""} onChange={e=>set({projectId:e.target.value||null})}><option value="">Nessuno</option>{data?.projects.filter(p=>!editor.clientId||p.clientId===editor.clientId).map(p=><option key={p.id} value={p.id}>{p.clientName} · {p.name}</option>)}</select></FinanceField>
        <FinanceField label="Importo per periodo (€)"><input required type="number" step=".01" min=".01" className={fieldClass} value={editor.amountCents/100} onChange={e=>set({amountCents:Math.round(Number(e.target.value)*100)})}/></FinanceField>
        <FinanceField label="Frequenza"><select className={fieldClass} value={editor.intervalMonths} onChange={e=>set({intervalMonths:Number(e.target.value)})}><option value={1}>Mensile</option><option value={3}>Trimestrale</option><option value={6}>Semestrale</option><option value={12}>Annuale</option></select></FinanceField>
        <FinanceField label="Decorrenza"><input type="date" className={fieldClass} value={editor.startDate??""} onChange={e=>set({startDate:e.target.value||null})}/></FinanceField>
        <FinanceField label="Prossima scadenza"><input type="date" className={fieldClass} value={editor.nextDate??""} onChange={e=>set({nextDate:e.target.value||null})}/></FinanceField>
        <FinanceField label="Stato"><select className={fieldClass} value={editor.state} onChange={e=>set({state:e.target.value as FinanceRecurringInput["state"]})}><option value="potential">Potenziale, non accettato</option><option value="active">Attivo, accordo confermato</option><option value="suspended">Sospeso</option></select></FinanceField>
        {editor.direction==="expense"&&<FinanceField label="Categoria"><select className={fieldClass} value={editor.category} onChange={e=>set({category:e.target.value})}>{Object.entries(categoryLabels).filter(([k])=>!["deposit","balance","monthly_fee"].includes(k)).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></FinanceField>}
        <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Salva ricorrenza</Button><Button type="button" variant="outline" onClick={()=>setEditor(null)}>Annulla</Button></div>
      </form>}
      <div className="grid gap-3 lg:grid-cols-2">{workspace?.recurring.map(r=><article key={r.id} className="rounded-xl border p-4">
        <h4 className="font-semibold">{r.description}</h4><p className="text-xs text-slate-500">{data?.clients.find(c=>c.id===r.clientId)?.name||data?.projects.find(p=>p.id===r.projectId)?.clientName||"Costo generale"}</p>
        <p className="my-2 text-sm">{money(r.amountCents)} ogni {r.intervalMonths} mesi · {r.state==="active"?"Attivo":r.state==="potential"?"Potenziale":"Sospeso"}</p>
        <p className="text-xs text-slate-500">Da {r.startDate||"definire"} · prossima {r.nextDate||"da definire"}</p>
        <div className="my-3 flex flex-wrap gap-3"><button className="text-xs font-semibold text-indigo-700" disabled={busy} onClick={()=>setEditor(r)}>Modifica / sospendi</button>
          {r.state==="active"&&<button disabled={busy} className="text-xs font-semibold text-indigo-700" onClick={()=>void act(()=>adminApi(`/finance/recurring/${r.id}/generate`,{method:"POST",body:JSON.stringify({dueDate:r.nextDate})}))}>Genera prossima scadenza</button>}
        </div>
        <details><summary className="cursor-pointer text-xs font-semibold">Storico delle mensilità</summary><ul className="mt-2 space-y-1 text-xs">{data?.entries.filter(e=>e.details?.recurringId===r.id).map(e=><li key={e.id}>{iso(e.dueDate)} · {money(e.amountCents)} · {e.details?.cancelled?"Annullato":cash(e)?"Pagato e riconciliato":e.paidAt?"Pagamento da verificare":"Non pagato"}</li>)}</ul></details>
      </article>)}</div>
      {!workspace?.recurring.length&&<p className="py-3 text-sm text-slate-500">Nessun canone registrato. Aggiungi un servizio mensile per cliente o una spesa ricorrente.</p>}
    </section>
    <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-bold">Storico delle variazioni e annullamenti</summary><div className="mt-3 space-y-2">
      {workspace?.history.map(h=><details className="rounded-xl border p-3 text-xs" key={h.id}><summary className="cursor-pointer">{new Date(h.createdAt).toLocaleString("it-IT")} · {h.reason} · {h.actor}</summary><p className="mt-2 break-all">Riferimento: {h.entityId}</p><div className="grid gap-2 sm:grid-cols-2"><pre className="overflow-auto whitespace-pre-wrap break-words bg-slate-50 p-2">Prima: {JSON.stringify(h.before,null,2)}</pre><pre className="overflow-auto whitespace-pre-wrap break-words bg-slate-50 p-2">Dopo: {JSON.stringify(h.after,null,2)}</pre></div></details>)}
      {!workspace?.history.length&&<p className="text-sm text-slate-500">Nessuna rettifica registrata.</p>}
    </div></details>
    <div className="flex flex-wrap gap-3">{(["csv","xlsx"] as const).map(format=><Button key={format} variant="outline" disabled={busy} onClick={()=>void act(async()=>{
      const response=await fetch(appPath(`/api/admin/finance/export?format=${format}`),{credentials:"same-origin",cache:"no-store"});
      if(!response.ok)throw new Error("Esportazione non riuscita. Verifica la sessione e riprova.");
      const url=URL.createObjectURL(await response.blob());const link=document.createElement("a");link.href=url;link.download=`promoapp-controllo-economico.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    })}>Esporta tutto {format==="csv"?"CSV":"Excel"}</Button>)}</div>
    <FinanceDevelopmentTransfer onComplete={async()=>{await onRefresh();setNotice("Trasferimento completato; contabilità aggiornata.");}}/>
  </section>;
}
