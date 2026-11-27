import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminFinanceClient, AdminFinanceProject, AdminFinanceSupplier, FinanceLedgerData,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { categoryLabels, fieldClass } from "./finance-ui";

const currency=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});
const money=(cents:number)=>currency.format(cents/100);
const todayInRome=()=>{
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const value=(key:string)=>parts.find(part=>part.type===key)?.value??"";
  return `${value("year")}-${value("month")}-${value("day")}`;
};
const isoDate=(value:Date|string|null|undefined)=>{
  if(!value)return "";
  return value instanceof Date?value.toISOString().slice(0,10):value.slice(0,10);
};
const displayDate=(value:Date|string|null|undefined)=>{
  const iso=isoDate(value);
  if(!iso)return "Data da definire";
  const [year,month,day]=iso.split("-").map(Number);
  return new Date(Date.UTC(year,month-1,day)).toLocaleDateString("it-IT",{timeZone:"UTC"});
};
const euroToCents=(value:string)=>Math.round(Number(value.replace(",","."))*100);
const expenseCategories=["facebook","google","replit","canva","hosting","domains","software","administration","accountant","consulting","equipment","research","other"];

type Props={
  month:string;
  clients:AdminFinanceClient[];
  projects:AdminFinanceProject[];
  suppliers:AdminFinanceSupplier[];
  onRefresh:()=>Promise<boolean>;
};

type AllocationDraft={obligationId:string;amountCents:number};

export default function FinanceLedgerPanel({month,clients,projects,suppliers,onRefresh}:Props){
  const [data,setData]=useState<FinanceLedgerData>();
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [accountEditor,setAccountEditor]=useState(false);
  const [obligationEditor,setObligationEditor]=useState(false);
  const [movementEditor,setMovementEditor]=useState(false);
  const [accountName,setAccountName]=useState("");
  const [accountType,setAccountType]=useState<"bank"|"paypal"|"cash"|"other">("bank");
  const [openingBalance,setOpeningBalance]=useState("0");
  const [openingBalanceDate,setOpeningBalanceDate]=useState("");
  const [obligationDirection,setObligationDirection]=useState<"income"|"expense">("income");
  const [obligationCategory,setObligationCategory]=useState("installment");
  const [obligationDescription,setObligationDescription]=useState("");
  const [obligationAmount,setObligationAmount]=useState("");
  const [obligationDate,setObligationDate]=useState("");
  const [obligationClient,setObligationClient]=useState("");
  const [obligationProject,setObligationProject]=useState("");
  const [obligationSupplier,setObligationSupplier]=useState("");
  const [movementDirection,setMovementDirection]=useState<"income"|"expense">("income");
  const [movementDate,setMovementDate]=useState(todayInRome);
  const [movementAmount,setMovementAmount]=useState("");
  const [movementAccount,setMovementAccount]=useState("");
  const [paymentMethod,setPaymentMethod]=useState("");
  const [movementNote,setMovementNote]=useState("");
  const [allocationDraftId,setAllocationDraftId]=useState("");
  const [allocationDraftAmount,setAllocationDraftAmount]=useState("");
  const [allocations,setAllocations]=useState<AllocationDraft[]>([]);
  const [historyDate,setHistoryDate]=useState<Record<string,string>>({});
  const [historyAmount,setHistoryAmount]=useState<Record<string,string>>({});
  const [historyAccount,setHistoryAccount]=useState<Record<string,string>>({});

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{setData(await adminApi<FinanceLedgerData>(`/finance/ledger?month=${encodeURIComponent(month)}`));}
    catch(err){setError(err instanceof Error?err.message:"Bilancio non disponibile.");}
    finally{setLoading(false);}
  },[month]);
  useEffect(()=>{void load();},[load]);
  const accounts=data?.accounts??[];
  const activeAccounts=accounts.filter(account=>account.active);
  const openObligations=useMemo(()=>data?.obligations.filter(item=>item.remainingCents>0)??[],[data?.obligations]);
  const movementAllocations=useMemo(()=>allocations.reduce((sum,item)=>sum+item.amountCents,0),[allocations]);
  const movementAmountCents=euroToCents(movementAmount||"0");
  const eligibleObligations=openObligations.filter(item=>item.direction===movementDirection);
  const selectedProject=projects.find(project=>project.id===obligationProject);

  const refreshAll=async()=>{
    await load();
    await onRefresh();
  };
  const act=async(work:()=>Promise<unknown>,success:string)=>{
    setBusy(true);setError("");setNotice("");
    try{await work();await refreshAll();setNotice(success);return true;}
    catch(err){setError(err instanceof Error?err.message:"Operazione non riuscita.");return false;}
    finally{setBusy(false);}
  };
  const createAccount=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const cents=euroToCents(openingBalance);
    if(!Number.isSafeInteger(cents)){setError("Inserisci un saldo iniziale valido.");return;}
    if(cents!==0&&!openingBalanceDate){setError("Indica la data a cui si riferisce il saldo iniziale diverso da zero.");return;}
    if(await act(()=>adminApi("/finance/ledger/accounts",{method:"POST",body:JSON.stringify({
      name:accountName.trim(),accountType,openingBalanceCents:cents,openingBalanceDate:openingBalanceDate||null,
    })}),"Conto aggiunto. Il saldo iniziale è stato registrato come valore di apertura.")){
      setAccountName("");setOpeningBalance("0");setOpeningBalanceDate("");setAccountEditor(false);
    }
  };
  const createObligation=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const cents=euroToCents(obligationAmount);
    if(!Number.isSafeInteger(cents)||cents<1){setError("Inserisci un importo maggiore di zero.");return;}
    if(obligationDirection==="income"&&!obligationClient&&!obligationProject){setError("Collega l’incasso a un cliente o a un lavoro.");return;}
    if(await act(()=>adminApi("/finance/ledger/obligations",{method:"POST",body:JSON.stringify({
      direction:obligationDirection,category:obligationCategory,description:obligationDescription.trim(),
      amountCents:cents,dueDate:obligationDate||null,
      clientId:obligationClient||selectedProject?.clientId||null,
      projectId:obligationProject||null,
      supplierId:obligationSupplier||null,
    })}),"Scadenza aggiunta al bilancio.")){
      setObligationDescription("");setObligationAmount("");setObligationDate("");
      setObligationProject("");setObligationSupplier("");setObligationEditor(false);
    }
  };
  const createMovement=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!Number.isSafeInteger(movementAmountCents)||movementAmountCents<1){setError("Inserisci un importo effettivamente incassato o pagato.");return;}
    if(movementAllocations>movementAmountCents){setError("Le ripartizioni superano l’importo del movimento.");return;}
    if(await act(()=>adminApi("/finance/ledger/movements",{method:"POST",body:JSON.stringify({
      movementDate,direction:movementDirection,amountCents:movementAmountCents,accountId:movementAccount,
      paymentMethod:paymentMethod.trim()||undefined,note:movementNote.trim()||undefined,allocations,
    })}),movementDirection==="income"?"Incasso registrato nel conto selezionato.":"Pagamento registrato nel conto selezionato.")){
      setMovementAmount("");setPaymentMethod("");setMovementNote("");setAllocations([]);setMovementEditor(false);
    }
  };
  const addAllocation=()=>{
    const obligation=eligibleObligations.find(item=>item.id===allocationDraftId);
    const cents=euroToCents(allocationDraftAmount);
    if(!obligation||!Number.isSafeInteger(cents)||cents<1||cents>obligation.remainingCents){setError("L’importo ripartito deve essere positivo e non superare il residuo della scadenza.");return;}
    if(allocations.some(item=>item.obligationId===obligation.id)){setError("Questa scadenza è già presente nella ripartizione.");return;}
    setAllocations(current=>[...current,{obligationId:obligation.id,amountCents:cents}]);
    setAllocationDraftId("");setAllocationDraftAmount("");setError("");
  };
  const reconcile=async(candidate:FinanceLedgerData["historicalCandidates"][number])=>{
    const key=`${candidate.sourceType}:${candidate.id}`;
    const amount=euroToCents(historyAmount[key]??String(candidate.suggestedAmountCents/100));
    const date=historyDate[key]||isoDate(candidate.suggestedDate);
    const account=historyAccount[key]||"";
    if(!date||!account||!Number.isSafeInteger(amount)||amount<1){setError("Per ogni dato storico conferma importo, data effettiva e conto.");return;}
    if(await act(()=>adminApi("/finance/ledger/reconcile",{method:"POST",body:JSON.stringify({
      sourceType:candidate.sourceType,sourceId:candidate.id,movementDate:date,amountCents:amount,accountId:account,
      note:`Confermato manualmente: ${candidate.description}`,
    })}),"Dato storico riconciliato e aggiunto ai movimenti effettivi.")){
      setHistoryDate(current=>({...current,[key]:""}));
    }
  };

  return <section aria-label="Bilancio PromoApp e prima nota" className="space-y-5" data-testid="finance-ledger">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-lg font-bold">Bilancio PromoApp</h3>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">I totali complessivi non cambiano con il mese selezionato. Incassi e spese entrano nel saldo solo dopo la registrazione di un movimento effettivo.</p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={loading||busy} onClick={()=>void load()}>Aggiorna</Button>
    </div>
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {loading&&!data?<p role="status" className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Caricamento del bilancio…</p>:null}
    {data&&<>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Venduto complessivo",data.summary.soldCents,"Lavori confermati e canoni maturati"],
          ["Incassato effettivo",data.summary.receivedCents,"Movimenti registrati, inclusa la storia riconciliata"],
          ["Da incassare",data.summary.receivableCents,"Rate e canoni già maturati, al netto degli incassi allocati"],
          ["Scaduto",data.summary.overdueCents,"Residuo con scadenza superata"],
          ["Speso effettivo",data.summary.spentCents,"Pagamenti effettivamente registrati"],
          ["Saldo di cassa",data.summary.cashBalanceCents,"Saldi iniziali + incassi − spese"],
          ["Margine gestionale",data.summary.managedMarginCents,"Venduto − spese effettive; non è utile fiscale"],
          ["Saldo iniziale conti",data.summary.openingBalancesCents,"Inserisci i saldi reali alla data di apertura"],
        ].map(([label,value,help])=><article key={String(label)} className="rounded-2xl border border-indigo-100 bg-white p-4" data-testid={`ledger-total-${String(label).toLowerCase().replaceAll(" ","-")}`}>
          <h4 className="text-sm font-semibold text-slate-600">{label}</h4><p className="mt-2 text-2xl font-bold text-indigo-800">{money(Number(value))}</p><p className="mt-1 text-xs text-slate-500">{help}</p>
        </article>)}
      </div>
      <section className="rounded-2xl border bg-white p-4">
        <h4 className="font-semibold">Movimenti del mese · {month}</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <p className="rounded-xl bg-slate-50 p-3 text-sm">Venduto <strong className="block text-indigo-700">{money(data.summary.monthSoldCents)}</strong></p>
          <p className="rounded-xl bg-slate-50 p-3 text-sm">Incassato <strong className="block text-emerald-700">{money(data.summary.monthReceivedCents)}</strong></p>
          <p className="rounded-xl bg-slate-50 p-3 text-sm">Speso <strong className="block text-rose-700">{money(data.summary.monthSpentCents)}</strong></p>
          <p className="rounded-xl bg-slate-50 p-3 text-sm">Flusso netto <strong className="block text-indigo-700">{money(data.summary.monthCashFlowCents)}</strong></p>
        </div>
        <p className="mt-3 text-xs text-slate-500">Il mese filtra solo questi valori di periodo; venduto, incassato, speso, cassa, margine e crediti complessivi restano totali globali.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={()=>{setAccountEditor(value=>!value);setObligationEditor(false);setMovementEditor(false);}}>Aggiungi conto</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={()=>{setObligationEditor(value=>!value);setAccountEditor(false);setMovementEditor(false);}}>Aggiungi rata o spesa da pagare</Button>
        <Button size="sm" variant="outline" disabled={busy||!activeAccounts.length} onClick={()=>{setMovementEditor(value=>!value);setAccountEditor(false);setObligationEditor(false);if(!movementAccount&&activeAccounts[0])setMovementAccount(activeAccounts[0].id);}}>Registra incasso o pagamento</Button>
      </div>
      {!activeAccounts.length&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Prima registra un conto e il saldo reale di partenza: senza un conto non si possono registrare movimenti effettivi. Nessun saldo viene stimato.</p>}

      {accountEditor&&<form onSubmit={createAccount} className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2" data-testid="form-finance-account">
        <h4 className="font-semibold sm:col-span-2">Nuovo conto o cassa</h4>
        <label className="space-y-1 text-sm">Nome conto<Input required maxLength={120} value={accountName} onChange={e=>setAccountName(e.target.value)} placeholder="Es. Conto bancario PromoApp"/></label>
        <label className="space-y-1 text-sm">Tipo<select className={fieldClass} value={accountType} onChange={e=>setAccountType(e.target.value as typeof accountType)}><option value="bank">Banca</option><option value="paypal">PayPal</option><option value="cash">Contanti</option><option value="other">Altro</option></select></label>
        <label className="space-y-1 text-sm">Saldo reale iniziale (€)<Input type="number" step=".01" required value={openingBalance} onChange={e=>setOpeningBalance(e.target.value)}/></label>
        <label className="space-y-1 text-sm">Data del saldo iniziale<Input required={euroToCents(openingBalance||"0")!==0} type="date" value={openingBalanceDate} onChange={e=>setOpeningBalanceDate(e.target.value)}/></label>
        <p className="text-xs text-slate-500 sm:col-span-2">La data è il riferimento del saldo: i movimenti da quel giorno in poi concorrono alla cassa; quelli precedenti restano nell’incassato/speso ma non vengono sommati di nuovo al saldo iniziale.</p>
        <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Salva conto</Button><Button type="button" variant="outline" onClick={()=>setAccountEditor(false)}>Annulla</Button></div>
      </form>}

      {obligationEditor&&<form onSubmit={createObligation} className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2" data-testid="form-finance-obligation">
        <h4 className="font-semibold sm:col-span-2">Nuova rata, canone da incassare o spesa da pagare</h4>
        <label className="space-y-1 text-sm">Tipo<select className={fieldClass} value={obligationDirection} onChange={e=>{const direction=e.target.value as "income"|"expense";setObligationDirection(direction);setObligationCategory(direction==="income"?"installment":"software");}}><option value="income">Da incassare</option><option value="expense">Da pagare</option></select></label>
        <label className="space-y-1 text-sm">Categoria<select className={fieldClass} value={obligationCategory} onChange={e=>setObligationCategory(e.target.value)}>{Object.entries(categoryLabels).filter(([key])=>obligationDirection==="income"?["deposit","balance","installment","monthly_fee","other"].includes(key):expenseCategories.includes(key)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label className="space-y-1 text-sm sm:col-span-2">Descrizione<Input required maxLength={240} value={obligationDescription} onChange={e=>setObligationDescription(e.target.value)} placeholder="Es. Acconto, rata, canone o fattura"/></label>
        <label className="space-y-1 text-sm">Importo (€)<Input required type="number" step=".01" min=".01" value={obligationAmount} onChange={e=>setObligationAmount(e.target.value)}/></label>
        <label className="space-y-1 text-sm">Scadenza (facoltativa)<Input type="date" value={obligationDate} onChange={e=>setObligationDate(e.target.value)}/></label>
        {obligationDirection==="income"?<>
          <label className="space-y-1 text-sm">Cliente<select className={fieldClass} value={obligationClient} onChange={e=>{setObligationClient(e.target.value);setObligationProject("");}}><option value="">Seleziona cliente</option>{clients.map(client=><option key={client.id} value={client.id}>{client.companyName||client.name}</option>)}</select></label>
          <label className="space-y-1 text-sm">Lavoro (facoltativo)<select className={fieldClass} value={obligationProject} onChange={e=>{const value=e.target.value;setObligationProject(value);const project=projects.find(item=>item.id===value);if(project?.clientId)setObligationClient(project.clientId);}}><option value="">Nessun lavoro specifico</option>{projects.filter(project=>!obligationClient||project.clientId===obligationClient).map(project=><option key={project.id} value={project.id}>{project.clientName} · {project.name}</option>)}</select></label>
        </>:<label className="space-y-1 text-sm">Fornitore (facoltativo)<select className={fieldClass} value={obligationSupplier} onChange={e=>setObligationSupplier(e.target.value)}><option value="">Fornitore non indicato</option>{suppliers.filter(supplier=>supplier.active).map(supplier=><option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>}
        <p className="text-xs text-slate-500 sm:col-span-2">Una scadenza descrive un credito o un debito, non un pagamento. Le rate future dei lavori restano visibili come residuo; i canoni entrano nel venduto solo quando maturano.</p>
        <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Salva scadenza</Button><Button type="button" variant="outline" onClick={()=>setObligationEditor(false)}>Annulla</Button></div>
      </form>}

      {movementEditor&&<form onSubmit={createMovement} className="space-y-4 rounded-2xl border bg-white p-4" data-testid="form-finance-movement">
        <div><h4 className="font-semibold">Registra un movimento già avvenuto</h4><p className="mt-1 text-xs text-slate-500">Il movimento aggiorna la cassa solo dopo il salvataggio. Non inserire pagamenti futuri come incassati.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm">Tipo<select className={fieldClass} value={movementDirection} onChange={e=>{setMovementDirection(e.target.value as "income"|"expense");setAllocations([]);}}><option value="income">Incasso cliente</option><option value="expense">Pagamento / spesa</option></select></label>
          <label className="space-y-1 text-sm">Data effettiva<Input type="date" max={todayInRome()} required value={movementDate} onChange={e=>setMovementDate(e.target.value)}/></label>
          <label className="space-y-1 text-sm">Importo effettivo (€)<Input type="number" min=".01" step=".01" required value={movementAmount} onChange={e=>setMovementAmount(e.target.value)}/></label>
          <label className="space-y-1 text-sm">Conto<select className={fieldClass} required value={movementAccount} onChange={e=>setMovementAccount(e.target.value)}><option value="">Seleziona conto</option>{activeAccounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <label className="space-y-1 text-sm">Metodo (facoltativo)<Input maxLength={100} value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} placeholder="Bonifico, carta, PayPal…"/></label>
          <label className="space-y-1 text-sm">Nota (facoltativa)<Input maxLength={2000} value={movementNote} onChange={e=>setMovementNote(e.target.value)}/></label>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-semibold">Ripartizione su rate o scadenze (facoltativa)</p>
          <p className="mt-1 text-xs text-slate-500">Un movimento può coprire più scadenze; una scadenza può essere coperta da più movimenti. Lascia vuoto per registrare il movimento senza attribuirlo a una rata.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <select className={fieldClass} value={allocationDraftId} onChange={e=>setAllocationDraftId(e.target.value)}><option value="">Scegli scadenza aperta</option>{eligibleObligations.map(item=><option key={item.id} value={item.id}>{item.clientName||item.projectName||"Generale"} · {item.description} · residuo {money(item.remainingCents)}</option>)}</select>
            <Input type="number" min=".01" step=".01" value={allocationDraftAmount} onChange={e=>setAllocationDraftAmount(e.target.value)} placeholder="Quota €"/>
            <Button type="button" variant="outline" onClick={addAllocation}>Aggiungi quota</Button>
          </div>
          {allocations.length>0&&<ul className="mt-3 space-y-2">{allocations.map(item=>{
            const obligation=eligibleObligations.find(row=>row.id===item.obligationId);
            return <li key={item.obligationId} className="flex items-center justify-between gap-3 rounded-lg bg-white p-2 text-xs"><span>{obligation?.description??"Scadenza"} · {obligation?.clientName??"Cliente"} · {money(item.amountCents)}</span><button type="button" className="font-semibold text-rose-700" onClick={()=>setAllocations(current=>current.filter(row=>row.obligationId!==item.obligationId))}>Rimuovi</button></li>;
          })}</ul>}
          <p className="mt-2 text-xs">Allocato: {money(movementAllocations)} di {money(movementAmountCents)}</p>
        </div>
        <div className="flex gap-2"><Button disabled={busy||!activeAccounts.length}>Registra movimento</Button><Button type="button" variant="outline" onClick={()=>setMovementEditor(false)}>Annulla</Button></div>
      </form>}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border bg-white p-4" aria-label="Scadenze per cliente">
          <h4 className="font-semibold">Situazione per cliente</h4>
          <p className="mt-1 text-xs text-slate-500">Saldo complessivo delle attività confermate e canoni già maturati.</p>
          {data.clientBalances.length?<div className="mt-3 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="py-2">Cliente</th><th className="py-2">Venduto</th><th className="py-2">Incassato</th><th className="py-2">Da incassare</th><th className="py-2">Scaduto</th></tr></thead><tbody>{data.clientBalances.map(client=><tr className="border-b last:border-0" key={client.clientId}><th className="py-2 font-semibold">{client.clientName}</th><td>{money(client.soldCents)}</td><td className="text-emerald-700">{money(client.receivedCents)}</td><td className="text-amber-700">{money(client.receivableCents)}</td><td className="text-rose-700">{money(client.overdueCents)}</td></tr>)}</tbody></table></div>:<p className="mt-3 text-sm text-slate-500">Nessun cliente registrato.</p>}
        </section>
        <section className="rounded-2xl border bg-white p-4" aria-label="Scadenze aperte">
          <h4 className="font-semibold">Rate, canoni e spese aperte</h4>
          <p className="mt-1 text-xs text-slate-500">I canoni futuri non maturati non entrano nei crediti; le rate dei lavori sono conteggiate fino al loro saldo.</p>
          {openObligations.length?<ul className="mt-3 divide-y">{openObligations.slice(0,30).map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm" data-testid={`ledger-obligation-${item.id}`}>
            <span className="min-w-0"><strong className="block truncate">{item.clientName||item.supplierId&&suppliers.find(s=>s.id===item.supplierId)?.name||"Generale"} · {item.description}</strong><span className="text-xs text-slate-500">{item.dueDate?item.overdue?`Scaduta ${displayDate(item.dueDate)}`:`Scadenza ${displayDate(item.dueDate)}`:"Senza data di scadenza"} · {item.direction==="income"?"Da incassare":"Da pagare"}</span></span>
            <strong className={item.direction==="income"?"text-amber-700":"text-rose-700"}>{money(item.remainingCents)}</strong>
          </li>)}</ul>:<p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Nessuna scadenza aperta.</p>}
          {openObligations.length>30&&<p className="mt-2 text-xs text-slate-500">Mostrate le prime 30 scadenze aperte.</p>}
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-4" aria-label="Riconciliazione storica">
        <h4 className="font-semibold">Conferma incassi e spese storiche</h4>
        <p className="mt-1 text-xs text-slate-500">Le comunicazioni storiche non entrano nei totali finché non confermi personalmente importo, data effettiva e conto. La data non viene dedotta dalla data del lavoro.</p>
        {data.historicalCandidates.length?<div className="mt-3 space-y-3">{data.historicalCandidates.map(candidate=>{
          const key=`${candidate.sourceType}:${candidate.id}`;
          const currentAmount=historyAmount[key]??String((candidate.suggestedAmountCents/100).toFixed(2));
          return <article key={key} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2 xl:grid-cols-5" data-testid={`history-candidate-${candidate.id}`}>
            <div className="sm:col-span-2 xl:col-span-2"><p className="font-semibold">{candidate.clientName||"PromoApp"}{candidate.projectName?` · ${candidate.projectName}`:""}</p><p className="text-xs text-slate-500">{candidate.description} · Importo comunicato {money(candidate.suggestedAmountCents)}</p></div>
            <label className="space-y-1 text-xs">Importo confermato (€)<Input required type="number" min=".01" step=".01" value={currentAmount} onChange={e=>setHistoryAmount(value=>({...value,[key]:e.target.value}))}/></label>
            <label className="space-y-1 text-xs">Data effettiva<Input required type="date" max={todayInRome()} value={historyDate[key]??isoDate(candidate.suggestedDate)} onChange={e=>setHistoryDate(value=>({...value,[key]:e.target.value}))}/></label>
            <div className="space-y-1 text-xs"><label>Conto</label><select className={fieldClass} value={historyAccount[key]??""} onChange={e=>setHistoryAccount(value=>({...value,[key]:e.target.value}))}><option value="">Seleziona conto</option>{activeAccounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select>
              <Button className="mt-2 w-full" type="button" size="sm" disabled={busy||!activeAccounts.length} onClick={()=>void reconcile(candidate)}>Confermo questo movimento</Button>
            </div>
          </article>;
        })}</div>:<p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Nessun dato storico in attesa di conferma.</p>}
      </section>

      <section className="rounded-2xl border bg-white p-4" aria-label="Movimenti effettivi">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><h4 className="font-semibold">Movimenti effettivi recenti</h4><p className="mt-1 text-xs text-slate-500">Incassi e pagamenti registrati; i movimenti storici sono contrassegnati.</p></div><span className="text-xs text-slate-500">{data.movements.length} movimenti mostrati</span></div>
        {data.movements.length?<div className="mt-3 divide-y">{data.movements.slice(0,100).map(movement=><article key={movement.id} className="flex flex-wrap items-start justify-between gap-3 py-3" data-testid={`ledger-movement-${movement.id}`}>
          <div><p className="font-semibold">{movement.direction==="income"?"Incasso":"Spesa"} · {displayDate(movement.movementDate)}{movement.historical&&<span className="ml-2 rounded bg-amber-100 px-2 py-1 text-[10px] text-amber-900">Storico confermato</span>}</p><p className="text-xs text-slate-500">{movement.accountName||"Conto non disponibile"}{movement.paymentMethod?` · ${movement.paymentMethod}`:""}{movement.note?` · ${movement.note}`:""}</p>{movement.allocations.map(allocation=><p className="mt-1 text-xs text-slate-500" key={`${movement.id}-${allocation.obligationId}`}>Ripartito: {allocation.description} · {money(allocation.amountCents)}</p>)}</div>
          <strong className={movement.direction==="income"?"text-emerald-700":"text-rose-700"}>{movement.direction==="income"?"+":"−"}{money(movement.amountCents)}</strong>
        </article>)}</div>:<p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Nessun movimento effettivo registrato. I dati storici in attesa di conferma restano esclusi.</p>}
      </section>
    </>}
  </section>;
}
