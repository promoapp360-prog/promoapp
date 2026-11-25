import { useState } from "react";
import type { FinanceImportPreview, FinanceTransactionRow } from "@workspace/api-client-react";
import { adminApi } from "@/lib/admin-api";

export function parseTransactionCsv(text:string):FinanceTransactionRow[] {
  const first=text.replace(/^\uFEFF/,"").split(/\r?\n/,1)[0];
  const sep=first.includes(";")?";":",";
  const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
  const source=text.replace(/^\uFEFF/,"");
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='"'){
      if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
    }else if(c===sep&&!quoted){row.push(cell);cell="";}
    else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&source[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";}
    else cell+=c;
  }
  if(quoted)throw new Error("CSV non valido: virgolette non chiuse.");
  row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
  const headers=rows.shift()?.map(h=>h.trim().toLowerCase())??[];
  const required=["reference","date","supplier","description","original_amount","currency","euro_amount"];
  if(required.some(h=>!headers.includes(h)))throw new Error(`Colonne obbligatorie: ${required.join(", ")}.`);
  if(rows.length>500)throw new Error("Massimo 500 transazioni per anteprima.");
  const cents=(value:string)=>{
    if(!value.trim())return null;
    const normalized=value.trim().includes(",")?value.trim().replaceAll(".","").replace(",","."):value.trim();
    if(!/^\d+(\.\d{1,2})?$/.test(normalized))throw new Error(`Importo non valido: ${value}. Usa importi positivi, senza simboli di valuta.`);
    return Math.round(Number(normalized)*100);
  };
  return rows.map(values=>{
    const get=(h:string)=>values[headers.indexOf(h)]?.trim()??"";
    const currency=get("currency").toUpperCase();
    if(currency!=="EUR"&&currency!=="USD")throw new Error("Sono supportate solo valute EUR e USD.");
    return {reference:get("reference"),date:get("date")||null,supplier:get("supplier"),description:get("description"),originalCents:cents(get("original_amount")),euroCents:cents(get("euro_amount")),currency};
  });
}
export default function FinanceTransactionPreview(){
  const [preview,setPreview]=useState<FinanceImportPreview>(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  return <details className="mt-4 rounded-xl border p-3"><summary className="cursor-pointer text-sm font-semibold">Confronta transazioni reali da CSV, senza importarle</summary>
    <p className="my-3 text-xs text-slate-500">Colonne: reference, date (AAAA-MM-GG), supplier, description, original_amount, currency, euro_amount. Importi positivi in unità di valuta; date o euro sconosciuti possono restare vuoti e saranno segnalati. Separatore virgola o punto e virgola. Massimo 500 righe.</p>
    <input type="file" accept=".csv,text/csv" disabled={busy} className="max-w-full text-xs" onChange={async e=>{
      const file=e.target.files?.[0];if(!file)return;setError("");setBusy(true);
      try{if(file.size>1048576)throw new Error("CSV massimo 1 MB.");const rows=parseTransactionCsv(await file.text());setPreview(await adminApi<FinanceImportPreview>("/finance/import-transactions/preview",{method:"POST",body:JSON.stringify({rows})}));}
      catch(err){setError(err instanceof Error?err.message:"Anteprima non disponibile.");}finally{setBusy(false);e.target.value="";}
    }}/>
    {busy&&<p role="status" className="mt-2 text-xs">Confronto in corso…</p>}{error&&<p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
    {preview&&<div className="mt-3 space-y-2">{preview.warnings.map(w=><p key={w} className="text-xs text-amber-800">{w}</p>)}{preview.rows.map((r,i)=><details key={`${r.key}-${i}`} className="rounded-lg bg-slate-50 p-2 text-xs"><summary>{r.name} · {{create:"Da creare",unchanged:"Invariato",review:"Da verificare",update:"Da aggiornare"}[r.action]}</summary><p className="my-2 text-amber-800">{r.anomalies.join(" ")}</p><pre className="whitespace-pre-wrap break-words">{JSON.stringify(r.proposed,null,2)}</pre></details>)}</div>}
  </details>;
}
