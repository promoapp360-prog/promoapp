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
  if (state === "loading" || state === "error") return null;
  if (!reviews.length) return null;
  return <div data-testid="verified-reviews">
    <p className="sl-eyebrow">Recensioni approvate</p>
    <h2 className="sl-h2">Cosa dicono i clienti</h2>
    <div className="reviews-grid">{(all ? reviews : reviews.slice(0, 3)).map((review) => {
      const stars = Math.max(0, Math.min(5, Number(review.stelle) || 0));
      return <article className="review-item" key={review.id}>
        <span className="text-amber-600 tracking-wide" aria-label={`${stars} stelle su 5`}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
        <blockquote className="mt-3">“{review.testo}”</blockquote>
        <p className="mt-4 font-bold">{review.nome}</p><p className="text-sm text-gray-500">{review.attivita}</p>
        <small className="text-emerald-700">Approvata per la pubblicazione</small>
      </article>;
    })}</div>
    {reviews.length > 3 && <button type="button" className="reviews-expand" aria-expanded={all} onClick={() => setAll(!all)}>
      {all ? "Mostra meno recensioni" : `Leggi tutte le ${reviews.length} recensioni`}</button>}
  </div>;
}
