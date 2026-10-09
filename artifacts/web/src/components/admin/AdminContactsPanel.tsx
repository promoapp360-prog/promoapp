import { useEffect, useState } from "react";
import type { AdminContact, ContactStateInput } from "@workspace/api-client-react";

const states: ContactStateInput["stato"][] = ["Nuovo", "Contattato", "Interessato", "Preventivo inviato", "Cliente acquisito", "Non interessato"];
export default function AdminContactsPanel({ contacts, busy, onState }: {
  contacts: AdminContact[]; busy: boolean; onState: (id: string, state: string) => Promise<void>;
}) {
  const [search, setSearch] = useState(""), [status, setStatus] = useState(""), [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [search, status]);
  const filtered = contacts.filter(c => (!status || c.stato === status) &&
    `${c.nomeAttivita} ${c.settore} ${c.email ?? ""} ${c.whatsapp} ${c.messaggio}`.toLowerCase().includes(search.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const current = Math.min(page, pages - 1);
  return <section aria-label="Contatti ricevuti">
    <div className="flex flex-wrap justify-between gap-3 mb-5">
      <div><h2 className="text-xl font-bold">Contatti ricevuti</h2><p className="text-sm text-slate-500 mt-1">{filtered.length} risultati · {contacts.length} contatti conservati</p></div>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Cerca contatti" placeholder="Cerca attività, telefono o messaggio" value={search} onChange={e => setSearch(e.target.value)} className="border border-slate-200 bg-white rounded-xl p-3 text-sm w-full sm:w-72" />
        <select aria-label="Filtra stato contatti" value={status} onChange={e => setStatus(e.target.value)} className="bg-white border border-slate-200 rounded-xl p-3 text-sm">
          <option value="">Tutti gli stati</option>{states.map(state => <option key={state}>{state}</option>)}
        </select>
      </div>
    </div>
    {!filtered.length && <div className="bg-white border border-slate-200 rounded-2xl p-8 text-slate-500">{contacts.length ? "Nessun contatto corrisponde alla ricerca." : "Nessun contatto ricevuto. Le richieste dei moduli del sito appariranno qui."}</div>}
    <div className="space-y-4">{filtered.slice(current * 15, current * 15 + 15).map(contact => <article key={contact.id} className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h3 className="font-bold text-lg break-words">{contact.nomeAttivita}</h3><p className="text-sm text-slate-500">{contact.settore} · {contact.servizio}</p></div>
        <p className="text-xs text-slate-500">{new Date(contact.createdAt).toLocaleString("it-IT")}</p>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm mt-4 bg-slate-50 rounded-xl p-4">{contact.messaggio || "Richiesta di informazioni senza messaggio aggiuntivo."}</p>
      <div className="flex flex-wrap gap-4 items-center justify-between mt-4 text-sm">
        <div className="flex flex-wrap gap-4">
          <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold hover:underline">WhatsApp: {contact.whatsapp}</a>
          {contact.email && <a href={`mailto:${encodeURIComponent(contact.email)}`} className="text-indigo-700 hover:underline break-all">{contact.email}</a>}
        </div>
        <label className="text-xs text-slate-500">Stato <select aria-label={`Stato ${contact.nomeAttivita}`} value={contact.stato} disabled={busy} onChange={e => void onState(contact.id, e.target.value)}
          className="ml-2 rounded-lg border border-slate-200 text-slate-800 p-2 disabled:opacity-50">{!states.includes(contact.stato as ContactStateInput["stato"]) && <option>{contact.stato}</option>}{states.map(state => <option key={state}>{state}</option>)}</select></label>
      </div>
    </article>)}</div>
    {pages > 1 && <div className="flex items-center justify-center gap-4 mt-5 text-sm">
      <button disabled={current === 0} onClick={() => setPage(current - 1)} className="disabled:opacity-30 text-indigo-700">Precedenti</button>
      <span>Pagina {current + 1} di {pages}</span><button disabled={current === pages - 1} onClick={() => setPage(current + 1)} className="disabled:opacity-30 text-indigo-700">Successivi</button>
    </div>}
  </section>;
}
