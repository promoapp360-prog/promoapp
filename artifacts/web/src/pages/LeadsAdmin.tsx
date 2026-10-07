import { useState } from "react";
import { Link } from "wouter";
import type { CommercialLead } from "@workspace/api-client-react";
import { appPath } from "../lib/marketing";
import { sectors } from "../lib/commercial";

const statuses = ["Nuovo", "Contattato", "Interessato", "Preventivo inviato", "Cliente acquisito", "Non interessato"];
const field = "border border-gray-300 rounded-xl px-3 py-3 text-sm bg-white min-w-0";
export default function LeadsAdmin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [rows, setRows] = useState<CommercialLead[]>([]);
  const [filters, setFilters] = useState({ settore: "", stato: "", from: "", to: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const query = () => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const headers = () => ({ "x-admin-password": password, "Content-Type": "application/json" });
  async function load(e?: React.FormEvent) {
    e?.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/leads?${query()}`), { headers: headers(), cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Accesso o caricamento non riuscito.");
      if (!Array.isArray(data)) throw new Error("Risposta non valida.");
      setRows(data); setAuthenticated(true);
    } catch (error) { setRows([]); setMessage(error instanceof Error ? error.message : "Caricamento non riuscito."); }
    finally { setBusy(false); }
  }
  async function update(lead: CommercialLead, stato: string, qualified = false) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/leads/${lead.id}`), { method: "PATCH", headers: headers(), body: JSON.stringify({ stato, qualified }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setRows((old) => old.map((item) => item.id === lead.id ? data : item));
      setMessage(qualified ? "Contatto qualificato. Evento registrato una sola volta nel database." : "Stato aggiornato.");
    } catch { setMessage("Aggiornamento non riuscito. Ricarica l'elenco per verificare lo stato."); }
    finally { setBusy(false); }
  }
  async function notify(lead: CommercialLead) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/leads/${lead.id}/notify`), { method: "POST", headers: headers() });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error();
      setRows((old) => old.map((item) => item.id === lead.id ? { ...item, notification: "sent" } : item));
      setMessage("Notifica accettata dal servizio email.");
    } catch { setMessage("Notifica ancora in attesa. Controlla la configurazione Resend."); }
    finally { setBusy(false); }
  }
  async function download() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(appPath(`/api/admin/leads/export?${query()}`), { headers: headers() });
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = "promoapp-contatti.csv"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setMessage("Esportazione non riuscita."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-gray-50 px-4 py-8">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div><p className="font-black text-indigo-700">PromoApp.it</p><h1 className="text-3xl font-black mt-2">Gestione contatti</h1></div>
        <div className="flex gap-4 items-center"><Link href="/">Homepage</Link><Link href="/admin">Pannello esistente</Link>
          {authenticated && <button onClick={() => { setAuthenticated(false); setPassword(""); setRows([]); }}>Esci</button>}</div>
      </div>
      {message && <p className="bg-indigo-50 text-indigo-800 p-4 rounded-xl mb-5" role="status">{message}</p>}
      {!authenticated ? <form onSubmit={load} className="bg-white p-6 rounded-2xl shadow max-w-md space-y-4">
        <h2 className="font-bold text-xl">Accesso riservato</h2>
        <p className="text-sm text-gray-600">Usa la credenziale amministrativa configurata nei segreti del progetto. Non viene salvata nel browser.</p>
        <label className="block">Password amministrativa<input type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} block w-full mt-2`} /></label>
        <button className="bg-indigo-700 text-white rounded-xl px-5 py-3 font-bold" disabled={busy}>{busy ? "Verifica…" : "Accedi"}</button>
      </form> : <>
        <form onSubmit={load} className="bg-white p-4 rounded-2xl shadow grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <label className="text-sm">Settore<select className={`${field} block w-full mt-1`} value={filters.settore} onChange={(e) => setFilters({ ...filters, settore: e.target.value })}>
            <option value="">Tutti</option><option value="generale">Homepage / servizi</option>
            {Object.entries(sectors).map(([slug, sector]) => <option key={slug} value={slug}>{sector.name}</option>)}
          </select></label>
          <label className="text-sm">Stato<select className={`${field} block w-full mt-1`} value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })}>
            <option value="">Tutti</option>{statuses.map((status) => <option key={status}>{status}</option>)}
          </select></label>
          <label className="text-sm">Dal giorno (UTC)<input type="date" className={`${field} block w-full mt-1`} value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
          <label className="text-sm">Al giorno (UTC)<input type="date" className={`${field} block w-full mt-1`} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
          <button className="bg-indigo-700 text-white rounded-xl px-4 py-3 self-end" disabled={busy}>Applica filtri / aggiorna</button>
        </form>
        <div className="flex flex-wrap justify-between gap-3 mb-4"><p>{rows.length} contatti · {rows.filter((row) => row.qualifiedAt).length} qualificati</p>
          <button className="border border-indigo-700 text-indigo-700 rounded-xl px-4 py-2" onClick={download} disabled={busy}>Esporta CSV filtrato</button></div>
        <p className="text-sm text-gray-600 mb-4">Qualifica soltanto dopo aver verificato l'interesse reale. Un clic WhatsApp non è un lead. Gli eventi qualificati sono registrati internamente; l'invio offline a Google Ads richiede una configurazione separata.</p>
        <div className="grid gap-3">
          {rows.map((lead) => <article key={lead.id} className="bg-white p-5 rounded-2xl shadow grid md:grid-cols-[1fr_1fr] gap-4">
            <div><h2 className="font-bold text-lg">{lead.nomeAttivita}</h2><p className="text-sm text-gray-600">{lead.settore} · {new Date(lead.createdAt).toLocaleString("it-IT")}</p>
              <p className="text-sm mt-2">WhatsApp: {lead.whatsapp}</p><p className="text-sm break-words">Pagina: {lead.pagina}</p>
              <p className="text-sm break-words">Campagna: {lead.attribution.utm_campaign || "Non disponibile / consenso assente"}</p>
              <p className="text-sm">Fonte: {lead.attribution.utm_source || "Non disponibile"}</p>
              <p className="text-sm mt-2">Notifica: {lead.notification === "sent" ? "Accettata dal servizio email" : "In attesa"}</p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm">Stato<select value={lead.stato} onChange={(e) => update(lead, e.target.value)} disabled={busy} className={`${field} block w-full mt-1`}>
                {statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <div className="flex flex-wrap gap-3">
                <a target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white px-4 py-2 rounded-xl"
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "").replace(/^00/, "")}?text=${encodeURIComponent("Buongiorno, ti contatto in risposta alla tua richiesta a PromoApp.")}`}>Apri WhatsApp</a>
                {!lead.qualifiedAt ? <button disabled={busy} className="border border-indigo-500 px-4 py-2 rounded-xl" onClick={() => update(lead, lead.stato, true)}>Conferma contatto qualificato</button> : <span className="text-emerald-700 font-bold">Qualificato</span>}
                {lead.notification !== "sent" && <button disabled={busy} className="border px-4 py-2 rounded-xl" onClick={() => notify(lead)}>Riprova notifica</button>}
              </div>
            </div>
          </article>)}
          {!rows.length && <p className="bg-white p-5 rounded-2xl">Nessun contatto corrisponde ai filtri.</p>}
        </div>
      </>}
    </div>
  </main>;
}
