import { useEffect, useState } from "react";
import { appPath } from "../../lib/marketing";

type Review = { id: string; nome: string; attivita: string; stelle: string; testo: string };
export default function VerifiedReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [all, setAll] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(appPath("/api/recensioni"), { signal: controller.signal }).then(async (res) => {
      const data = await res.json() as { success: boolean; data: Review[] };
      if (!res.ok || !data.success || !Array.isArray(data.data)) throw new Error();
      setReviews(data.data); setState("ready");
    }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  if (state === "loading") return <p role="status">Caricamento recensioni…</p>;
  if (state === "error") return <p role="status">Recensioni momentaneamente non disponibili. <a href={appPath("/#recensioni")}>Consulta la sezione recensioni</a>.</p>;
  if (!reviews.length) return <p>Le recensioni verificate verranno pubblicate qui.</p>;
  return <div data-testid="verified-reviews">
    <div className="reviews-grid">{(all ? reviews : reviews.slice(0, 3)).map((review) => {
      const stars = Math.max(0, Math.min(5, Number(review.stelle) || 0));
      return <article className="review-item" key={review.id}>
        <span className="text-amber-600 tracking-wide" aria-label={`${stars} stelle su 5`}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
        <blockquote className="mt-3">“{review.testo}”</blockquote>
        <p className="mt-4 font-bold">{review.nome}</p><p className="text-sm text-gray-500">{review.attivita}</p>
        <small className="text-emerald-700">Verificata</small>
      </article>;
    })}</div>
    {reviews.length > 3 && <button type="button" className="reviews-expand" aria-expanded={all} onClick={() => setAll(!all)}>
      {all ? "Mostra meno recensioni" : `Leggi tutte le ${reviews.length} recensioni`}</button>}
  </div>;
}
