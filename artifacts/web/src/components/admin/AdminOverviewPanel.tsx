import type { AdminOverview } from "@workspace/api-client-react";

const number = (n: number) => n.toLocaleString("it-IT");
const date = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
export default function AdminOverviewPanel({ data, days, onDays, visitsOnly }: {
  data: AdminOverview; days: number; onDays: (days: number) => void; visitsOnly: boolean;
}) {
  const stats = visitsOnly ? [] : [
    ["Contatti ricevuti", number(data.contacts), "Tutti i contatti conservati"],
    ["Da contattare", number(data.newContacts), "Contatti con stato Nuovo"],
    ["Recensioni ricevute", number(data.reviews), `${data.pendingReviews} in attesa di pubblicazione`],
    ["Valutazione media", data.averageRating == null ? "—" : `${data.averageRating.toLocaleString("it-IT")} / 5`, "Solo recensioni pubblicate"],
  ];
  return (
    <section className="space-y-6" aria-label={visitsOnly ? "Visite del sito" : "Statistiche del sito"}>
      {!!stats.length && <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(([label, value, note]) => <article key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm text-slate-500">{label}</h2><p className="text-3xl font-bold mt-3">{value}</p><p className="text-xs text-slate-500 mt-3">{note}</p>
        </article>)}
      </div>}
      <div className="flex justify-between flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Conteggio visite</h2>
        <label className="text-sm text-slate-600">Periodo <select aria-label="Periodo delle visite" value={days} onChange={e => onDays(Number(e.target.value))} className="ml-2 bg-white border border-slate-200 rounded-lg p-2">
          <option value={7}>Ultimi 7 giorni</option><option value={30}>Ultimi 30 giorni</option><option value={90}>Ultimi 90 giorni</option>
        </select></label>
      </div>
      <article className="bg-white border border-indigo-200 rounded-2xl p-5">
        <h3 className="font-bold text-lg">Visite a promoapp.it/sitiweb</h3>
        <p className="text-sm text-slate-500 mt-2 mb-5">Solo gli accessi a /sitiweb, anche con la barra finale. Le altre pagine del sito non sono incluse.</p>
        {data.sitiweb ? <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ["Visite nel periodo", data.sitiweb.visits, `Ultimi ${data.days} giorni`],
            ["Visualizzazioni nel periodo", data.sitiweb.pageViews, `Ultimi ${data.days} giorni`],
            ["Visite totali registrate", data.sitiweb.totalVisits, "Dall’inizio della raccolta"],
            ["Visualizzazioni totali", data.sitiweb.totalPageViews, "Dall’inizio della raccolta"],
          ].map(([label, value, note]) => <div key={label} className="bg-indigo-50 rounded-xl p-4">
            <p className="text-sm text-indigo-900">{label}</p><p className="text-3xl font-bold text-indigo-950 mt-3">{number(Number(value))}</p>
            <p className="text-xs text-slate-500 mt-3">{note}</p>
          </div>)}
        </div> : <p role="alert" className="text-sm text-red-700">Conteggio della pagina non disponibile: aggiorna il pannello dopo la pubblicazione del server.</p>}
      </article>
      <h3 className="font-bold">Tutto il sito</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {[["Visite (sessioni)", data.visits], ["Pagine visualizzate", data.pageViews]].map(([label, value]) =>
          <article key={label} className="bg-indigo-950 text-white rounded-2xl p-6">
            <h3 className="text-indigo-200 text-sm">{label}</h3><p className="text-4xl font-bold mt-3">{number(Number(value))}</p>
            <p className="text-xs text-indigo-200 mt-3">Ultimi {data.days} giorni</p>
          </article>)}
      </div>
      <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">
        Si contano solo le visite con consenso alle statistiche. Una sessione identifica una visita nello stesso browser/tab, non una persona.
        Admin, aree riservate e bot riconosciuti sono esclusi. Giorni calcolati nel fuso orario italiano.
        {data.trackingStartedAt ? ` Prima visualizzazione registrata: ${new Date(data.trackingStartedAt).toLocaleDateString("it-IT")}.` :
          " La raccolta parte dalla pubblicazione e dal primo consenso: non sono disponibili visite storiche."}
      </p>
      <div className="grid lg:grid-cols-2 gap-5">
        <article className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold mb-4">Andamento giornaliero · tutto il sito</h3>
          <div className="max-h-80 overflow-auto"><table className="w-full text-sm text-left"><thead className="text-slate-500"><tr><th className="py-2">Giorno</th><th>Visite</th><th>Pagine</th></tr></thead>
            <tbody>{data.daily.map(day => <tr key={day.date} className="border-t border-slate-100"><td className="py-3">{date(day.date)}</td><td>{number(day.visits)}</td><td>{number(day.pageViews)}</td></tr>)}</tbody>
          </table></div>
        </article>
        <article className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold mb-4">Pagine più viste</h3>
          {!data.pages.length ? <p className="text-sm text-slate-500 py-6">Nessuna visualizzazione registrata nel periodo.</p> :
            <table className="w-full text-sm text-left"><thead className="text-slate-500"><tr><th className="py-2">Pagina</th><th className="text-right">Visualizzazioni</th></tr></thead>
              <tbody>{data.pages.map(page => <tr key={page.path} className="border-t border-slate-100"><td className="py-3 break-all pr-4">{page.path}</td><td className="text-right">{number(page.pageViews)}</td></tr>)}</tbody>
            </table>}
        </article>
      </div>
    </section>
  );
}
