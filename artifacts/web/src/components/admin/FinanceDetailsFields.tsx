import { useRef, useState, type ReactNode } from "react";
import type { FinanceClientDetails, FinanceProjectDetails, FinanceEntryDetails, FinanceWorkspace, FinanceDocumentUpload, AdminFinanceClient } from "@workspace/api-client-react";
import { adminApi } from "@/lib/admin-api";
import { appPath } from "@/lib/marketing";
import { fieldClass } from "./finance-ui";

export function FinanceField({label,children}:{label:string;children:ReactNode}) {
  return <label className="block min-w-0 space-y-1 text-xs font-semibold text-slate-600"><span>{label}</span>{children}</label>;
}
function Check({label,checked,onChange}:{label:string;checked:boolean|undefined;onChange:(v:boolean)=>void}) {
  return <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} className="mt-1"/>{label}</label>;
}
export function ClientDetailsFields({value,onChange,workspace}:{value:FinanceClientDetails;onChange:(v:FinanceClientDetails)=>void;workspace?:FinanceWorkspace}) {
  const set=(v:Partial<FinanceClientDetails>)=>onChange({...value,...v});
  return <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
    <FinanceField label="Alias confermati, uno per riga"><textarea className={fieldClass} value={(value.aliases??[]).join("\n")} onChange={e=>set({aliases:e.target.value.split("\n")})}/></FinanceField>
    <FinanceField label="Provenienza acquisizione nota"><input className={fieldClass} placeholder="Vuoto = sconosciuta" value={value.acquisitionSource??""} onChange={e=>set({acquisitionSource:e.target.value})}/></FinanceField>
    <FinanceField label="Data acquisizione effettiva, se nota"><input type="date" className={fieldClass} value={value.acquisitionDate??""} onChange={e=>set({acquisitionDate:e.target.value||null})}/></FinanceField>
    <p className="text-xs text-slate-500 sm:col-span-2">Collega solo identità verificate. Un alias non accorpa o cancella altre anagrafiche.</p>
  </div>;
}
export function ProjectDetailsFields({value,onChange}:{value:FinanceProjectDetails;onChange:(v:FinanceProjectDetails)=>void}) {
  const set=(v:Partial<FinanceProjectDetails>)=>onChange({...value,...v});
  return <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
    <FinanceField label="Stato commerciale"><select className={fieldClass} value={value.commercialState??"contact"} onChange={e=>set({commercialState:e.target.value as FinanceProjectDetails["commercialState"],...(e.target.value!=="confirmed"?{agreementConfirmed:false,creditReview:true}:{})})}>
      <option value="contact">Contatto</option><option value="demo">Demo</option><option value="quote">Preventivo</option><option value="confirmed">Confermato</option>
    </select></FinanceField>
    <FinanceField label="Stato operativo"><select className={fieldClass} value={value.operationalState??"not_started"} onChange={e=>set({operationalState:e.target.value as FinanceProjectDetails["operationalState"]})}>
      <option value="not_started">Non iniziato</option><option value="working">In lavorazione</option><option value="delivered">Consegnato</option>
    </select></FinanceField>
    <FinanceField label="Servizio"><input className={fieldClass} value={value.service??""} onChange={e=>set({service:e.target.value})}/></FinanceField>
    <FinanceField label="Data accordo confermato"><input type="date" className={fieldClass} value={value.confirmedDate??""} onChange={e=>set({confirmedDate:e.target.value||null})}/></FinanceField>
    <FinanceField label="Extra concordati (€), oltre al prezzo base"><input type="number" min="0" step=".01" className={fieldClass} value={(value.extraCents??0)/100} onChange={e=>set({extraCents:Math.round(Number(e.target.value)*100)})}/></FinanceField>
    <Check label="Importo noto, non una vendita a zero" checked={value.amountKnown} onChange={v=>set({amountKnown:v,...(!v?{agreementConfirmed:false,creditReview:true}:{})})}/>
    <Check label="Accordo definitivamente confermato" checked={value.agreementConfirmed} onChange={v=>set({agreementConfirmed:v})}/>
    <Check label="Residuo da verificare: escludi dai crediti e dai solleciti" checked={value.creditReview??true} onChange={v=>set({creditReview:v})}/>
    <FinanceField label="Incassato comunicato (€), non ancora prova di pagamento"><input type="number" min="0" step=".01" className={fieldClass} value={value.reportedReceivedCents==null?"":value.reportedReceivedCents/100} onChange={e=>set({reportedReceivedCents:e.target.value===""?null:Math.round(Number(e.target.value)*100)})}/></FinanceField>
    <FinanceField label="Residuo confermato separatamente (€), facoltativo"><input type="number" min="0" step=".01" className={fieldClass} value={value.confirmedResidualCents==null?"":value.confirmedResidualCents/100} onChange={e=>set({confirmedResidualCents:e.target.value===""?null:Math.round(Number(e.target.value)*100)})}/></FinanceField>
    <FinanceField label="Note di riconciliazione e differenze"><textarea className={fieldClass} value={value.reconciliationNotes??""} onChange={e=>set({reconciliationNotes:e.target.value})}/></FinanceField>
    <p className="text-xs text-slate-500 sm:col-span-2">Il residuo è prezzo base + extra − incassi riconciliati, indipendentemente dalle rate inserite. I canoni sono separati.</p>
  </div>;
}
export function EntryDetailsFields({value,onChange,paid,onPaid,workspace,clients,onUploadStateChange}:{value:FinanceEntryDetails;onChange:(v:FinanceEntryDetails)=>void;paid:boolean;onPaid:(v:boolean)=>void;workspace?:FinanceWorkspace;clients?:AdminFinanceClient[];onUploadStateChange:(v:boolean)=>void}) {
  const [uploading,setUploading]=useState(false),[error,setError]=useState("");
  const latest=useRef(value);latest.current=value;
  const set=(v:Partial<FinanceEntryDetails>)=>onChange({...latest.current,...v});
  return <div className="grid gap-4 rounded-xl border border-slate-200 p-3 sm:col-span-2 sm:grid-cols-2">
    <FinanceField label="Cliente diretto, se il movimento non ha un lavoro"><select className={fieldClass} value={value.clientId??""} onChange={e=>set({clientId:e.target.value||null})}><option value="">Nessuno / derivato dal lavoro</option>{clients?.map(c=><option key={c.id} value={c.id}>{c.companyName||c.name}</option>)}</select></FinanceField>
    <FinanceField label="Fornitore registrato"><select className={fieldClass} value={value.supplierId??""} onChange={e=>{const supplier=workspace?.suppliers.find(s=>s.id===e.target.value);set({supplierId:supplier?.id??null,supplier:supplier?.name??""});}}><option value="">Nessuno / inserimento libero</option>{workspace?.suppliers.filter(s=>s.active||s.id===value.supplierId).map(s=><option key={s.id} value={s.id}>{s.name}{s.active?"":" (archiviato)"}</option>)}</select></FinanceField>
    {!value.supplierId&&<FinanceField label="Fornitore / ordinante non registrato"><input className={fieldClass} value={value.supplier??""} onChange={e=>set({supplier:e.target.value})}/></FinanceField>}
    <FinanceField label="Metodo di pagamento"><input className={fieldClass} value={value.method??""} placeholder="Bonifico, carta, contanti…" onChange={e=>set({method:e.target.value})}/></FinanceField>
    <FinanceField label="Valuta originale"><select className={fieldClass} value={value.currency??"EUR"} onChange={e=>set({currency:e.target.value as "EUR"|"USD"})}><option>EUR</option><option>USD</option></select></FinanceField>
    <FinanceField label="Importo originale in valuta"><input type="number" min=".01" step=".01" className={fieldClass} value={value.originalCents==null?"":value.originalCents/100} onChange={e=>set({originalCents:e.target.value?Math.round(Number(e.target.value)*100):null})}/></FinanceField>
    <FinanceField label="Cambio indicativo USD → EUR"><input type="number" min=".000001" step=".000001" className={fieldClass} value={value.exchangeRate??""} onChange={e=>set({exchangeRate:e.target.value?Number(e.target.value):null})}/></FinanceField>
    <p className="self-end text-xs text-slate-500">L’importo euro inserito sopra è quello effettivo: non cambia automaticamente quando modifichi il cambio.</p>
    <Check label="Importo euro confermato, non stimato" checked={value.amountConfirmed} onChange={v=>set({amountConfirmed:v})}/>
    <Check label="Pagamento effettivamente avvenuto" checked={paid} onChange={onPaid}/>
    <FinanceField label="Data effettiva del pagamento"><input className={fieldClass} type="date" value={value.paidDate??""} onChange={e=>set({paidDate:e.target.value||null})}/></FinanceField>
    <FinanceField label="Riconciliazione"><select className={fieldClass} value={value.reconciliation??"unverified"} onChange={e=>set({reconciliation:e.target.value as FinanceEntryDetails["reconciliation"]})}>
      <option value="unverified">Da verificare</option><option value="reported">Comunicata, non riconciliata</option><option value="reconciled">Verificata / riconciliata</option>
    </select></FinanceField>
    <FinanceField label="Rata / riferimento facoltativo"><input className={fieldClass} value={value.installment??""} onChange={e=>set({installment:e.target.value})}/></FinanceField>
    <FinanceField label="Riferimento univoco transazione / estratto"><input className={fieldClass} value={value.externalReference??""} onChange={e=>set({externalReference:e.target.value})}/></FinanceField>
    <FinanceField label="Classificazione gestionale"><select className={fieldClass} value={value.classification??"other"} onChange={e=>set({classification:e.target.value as FinanceEntryDetails["classification"]})}>
      <option value="commercial">Sviluppo commerciale</option><option value="prototype">Sperimentazione e prototipazione</option><option value="research_review">R&S da valutare</option><option value="hosting">Hosting ordinario</option><option value="maintenance">Manutenzione</option><option value="training">Formazione e test</option><option value="other">Altro</option>
    </select></FinanceField>
    <Check label="Pubblicità attribuita espressamente all’acquisizione del cliente" checked={value.acquisitionCost} onChange={v=>set({acquisitionCost:v})}/>
    <p className="self-end text-xs text-slate-500">La classificazione R&S non certifica alcuna ammissibilità fiscale.</p>
    <FinanceField label="Note"><textarea className={fieldClass} value={value.notes??""} onChange={e=>set({notes:e.target.value})}/></FinanceField>
    <FinanceField label={uploading?"Caricamento…":"Documento riservato, massimo 10 MB"}>
      <input type="file" disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.webp,.csv" className="max-w-full text-xs" onChange={async e=>{
        const file=e.target.files?.[0];if(!file)return;
        setError("");setUploading(true);onUploadStateChange(true);
        try {
          if(file.size>10485760)throw new Error("Dimensione massima 10 MB.");
          const result=await adminApi<FinanceDocumentUpload>("/finance/documents",{method:"POST",body:JSON.stringify({name:file.name,size:file.size,contentType:file.type||"text/csv"})});
          const response=await fetch(result.uploadURL,{method:"PUT",headers:{"Content-Type":file.type||"text/csv"},body:file});
          if(!response.ok)throw new Error("Caricamento non riuscito: riprova.");
          set({documentPath:result.objectPath});
        }catch(err){setError(err instanceof Error?err.message:"Caricamento non riuscito.");}
        finally{setUploading(false);onUploadStateChange(false);}
      }}/>
      {value.documentPath && <><a className="block text-indigo-700 underline" href={appPath(`/api/admin/finance/documents/${value.documentPath.split("/").pop()}`)} target="_blank" rel="noreferrer">Apri allegato</a><button type="button" onClick={()=>set({documentPath:null})}>Rimuovi collegamento</button></>}
      {error&&<p role="alert" className="text-rose-700">{error}</p>}
    </FinanceField>
  </div>;
}
