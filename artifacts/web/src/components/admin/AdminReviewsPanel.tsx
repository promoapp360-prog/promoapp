import { useState } from "react";
import type { AdminReview } from "@workspace/api-client-react";

export default function AdminReviewsPanel({ reviews, busy, onPublish, onDelete }: {
  reviews: AdminReview[]; busy: boolean; onPublish: (id: string, published: boolean) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState("all");
  const selected = reviews.filter(review => filter === "all" || review.verificata === (filter === "published"));
  return <section aria-label="Gestione recensioni">
    <div className="flex flex-wrap justify-between gap-3 mb-5">
      <div><h2 className="text-xl font-bold">Recensioni</h2><p className="text-sm text-slate-500 mt-1">{reviews.filter(r => !r.verificata).length} da verificare · {reviews.filter(r => r.verificata).length} pubblicate</p></div>
      <select aria-label="Filtra recensioni" value={filter} onChange={e => setFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl p-3 text-sm">
        <option value="all">Tutte le recensioni</option><option value="pending">In attesa</option><option value="published">Pubblicate</option>
      </select>
    </div>
    {!selected.length && <div className="bg-white border border-slate-200 rounded-2xl p-8 text-slate-500">Nessuna recensione {filter === "pending" ? "in attesa" : filter === "published" ? "pubblicata" : "ricevuta"}.</div>}
    <div className="grid md:grid-cols-2 gap-4">{selected.map(review => <article key={review.id} className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="font-bold">{review.nome}</h3><p className="text-sm text-slate-500">{review.attivita}</p></div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${review.verificata ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{review.verificata ? "Pubblicata" : "In attesa"}</span>
      </div>
      <p className="text-sm font-semibold text-indigo-600 mt-3">Valutazione: {review.stelle} / 5</p>
      <p className="text-sm whitespace-pre-wrap break-words text-slate-700 mt-3">{review.testo}</p>
      <p className="text-xs text-slate-400 mt-4">{new Date(review.createdAt).toLocaleString("it-IT")}</p>
      <div className="flex justify-between gap-3 mt-5">
        <button disabled={busy} onClick={() => void onPublish(review.id, !review.verificata)} className="text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 disabled:opacity-50">{review.verificata ? "Nascondi dal sito" : "Approva e pubblica"}</button>
        <button disabled={busy} onClick={() => { if (window.confirm(`Eliminare definitivamente la recensione di ${review.nome}? Non potrà essere recuperata da questo pannello.`)) void onDelete(review.id); }}
          className="text-sm text-red-600 px-3 py-2 disabled:opacity-50">Elimina</button>
      </div>
    </article>)}</div>
  </section>;
}
