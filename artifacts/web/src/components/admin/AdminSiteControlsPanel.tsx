import { useEffect, useState } from "react";
import type { AdminSiteControlRequest, SiteControlRequestStatus } from "@workspace/api-client-react";

const statuses: SiteControlRequestStatus[] = ["Nuova", "In analisi", "Report inviato", "Cliente acquisito"];

export default function AdminSiteControlsPanel({ requests, busy, onStatus }: {
  requests: AdminSiteControlRequest[];
  busy: boolean;
  onStatus: (id: string, status: SiteControlRequestStatus) => Promise<void>;
}) {
  const [filter, setFilter] = useState<SiteControlRequestStatus | "">("");
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [filter]);
  const filtered = requests.filter((request) => !filter || request.status === filter);
  const pageSize = 15;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <section aria-label="Richieste di controllo gratuito">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-bold">Controlli gratuiti dei siti</h2>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} risultati · {requests.length} richieste conservate</p></div>
        <label className="text-sm font-semibold text-slate-600">Filtra per stato
          <select aria-label="Filtra richieste per stato" value={filter}
            onChange={(event) => setFilter(event.target.value as SiteControlRequestStatus | "")}
            className="ml-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal">
            <option value="">Tutti gli stati</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>
      {!visible.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          {requests.length ? "Nessuna richiesta corrisponde al filtro." : "Non ci sono ancora richieste di controllo."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="p-4">Ricevuta</th><th className="p-4">Sito</th><th className="p-4">Attività</th>
                <th className="p-4">Contatti</th><th className="p-4">Email</th><th className="p-4">Stato</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((request) => (
                <tr key={request.id} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap p-4 text-xs text-slate-500">{new Date(request.createdAt).toLocaleString("it-IT")}</td>
                  <td className="max-w-56 break-all p-4 font-semibold text-indigo-700">{request.siteUrl}</td>
                  <td className="p-4 font-semibold">{request.nomeAttivita}</td>
                  <td className="p-4 text-xs leading-5">
                    {request.email && <p className="break-all">{request.email}</p>}
                    {request.whatsapp && <p>{request.whatsapp}</p>}
                    {!request.email && !request.whatsapp && <span className="text-slate-400">Non indicato</span>}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${request.notification === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {request.notification === "sent" ? "Notifica inviata" : "Notifica da verificare"}
                    </span>
                  </td>
                  <td className="p-4">
                    <select aria-label={`Stato richiesta ${request.nomeAttivita}`} value={request.status} disabled={busy}
                      onChange={(event) => void onStatus(request.id, event.target.value as SiteControlRequestStatus)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-xs disabled:opacity-50">
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && <div className="mt-5 flex items-center justify-center gap-4 text-sm">
        <button disabled={current === 0} onClick={() => setPage(current - 1)} className="text-indigo-700 disabled:opacity-30">Precedenti</button>
        <span>Pagina {current + 1} di {pages}</span>
        <button disabled={current === pages - 1} onClick={() => setPage(current + 1)} className="text-indigo-700 disabled:opacity-30">Successivi</button>
      </div>}
    </section>
  );
}
