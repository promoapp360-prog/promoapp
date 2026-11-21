import projects from "../../lib/approved-projects.json";
import { appPath } from "../../lib/marketing";
import { Link } from "wouter";

type Project = { approved: boolean; title: string; businessType: string; need: string; solution: string; features: string[]; image: string };
export function approvedProjects(items: unknown[]): Project[] {
  return items.filter((item): item is Project => {
    if (!item || typeof item !== "object") return false;
    const p = item as Partial<Project>;
    return p.approved === true && [p.title, p.businessType, p.need, p.solution].every((v) => typeof v === "string" && v.trim()) &&
      typeof p.image === "string" && /^\/portfolio\/[\w.-]+\.(?:webp|png|jpg)$/.test(p.image) &&
      Array.isArray(p.features) && p.features.length > 0 && p.features.every((v) => typeof v === "string" && v.trim());
  });
}
export function publicClientProjects(items: unknown[]): Project[] {
  return approvedProjects(items).filter((project) => {
    const location = project.businessType.split("·").at(-1)?.trim() ?? "";
    return Boolean(location) && !/^progetto\s+promoapp$/i.test(location);
  });
}
// Il tracciamento del clic arriva dalla pagina, così questo componente resta senza dipendenze dal tracking.
export default function PortfolioExamples({ onCta }: { onCta?: () => void } = {}) {
  const approved = publicClientProjects(projects);
  if (!approved.length) return null;
  return <section className="relative z-10 px-4 py-10 scroll-mt-5" id="progetti" aria-labelledby="progetti-title">
    <div className="max-w-5xl mx-auto text-white">
      <p className="text-emerald-300 text-xs font-black uppercase tracking-[0.2em] mb-2">Progetti reali, clienti reali</p>
      <h2 id="progetti-title" className="font-black text-2xl md:text-3xl mb-2">Cosa abbiamo realizzato per attività come la tua</h2>
      <p className="text-indigo-200 text-sm mb-6 max-w-2xl">Siti web, prenotazioni online e gestionali realizzati per attività a Milano, Barletta e Reggio Calabria.</p>
      <p className="sm:hidden text-indigo-200 text-xs mb-3" aria-hidden="true">Scorri per vedere tutti i progetti →</p>
      {/* Su mobile le schede scorrono in orizzontale, così i servizi restano raggiungibili senza uno scroll lunghissimo. */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">{approved.map((p) => <article key={p.title} className="glass-card rounded-2xl overflow-hidden flex flex-col shrink-0 w-[85%] snap-center sm:w-auto">
        <img src={appPath(p.image)} alt={`${p.title}: progetto realizzato da PromoApp per ${p.businessType}`}
          loading="lazy" decoding="async" width={800} height={500}
          className="w-full aspect-[16/10] object-cover object-top bg-white/5" />
        <div className="p-5 flex flex-col flex-1">
          <p className="text-emerald-300 text-xs font-semibold">{p.businessType}</p>
          <h3 className="font-bold text-xl mt-1">{p.title}</h3>
          <p className="text-indigo-100 text-sm mt-3"><strong className="text-white">Esigenza: </strong>{p.need}</p>
          <p className="text-indigo-100 text-sm mt-2"><strong className="text-white">Soluzione: </strong>{p.solution}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">{p.features.map((f) => <li key={f} className="text-[11px] font-semibold rounded-full bg-white/10 border border-white/15 px-2.5 py-1">{f}</li>)}</ul>
        </div>
      </article>)}</div>
      <div className="mt-6 text-center">
        <a href="#preventivo" onClick={onCta}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-bold text-sm min-h-12">
          Voglio una soluzione così per la mia attività
        </a>
        <div><Link href="/lavori" className="inline-flex mt-3 min-h-11 items-center text-sm font-bold text-emerald-200 underline underline-offset-4 hover:text-white">Vedi tutti i progetti realizzati</Link></div>
      </div>
    </div>
  </section>;
}

// Caso reale collegato a un settore: compare solo dove esiste un progetto autorizzato.
const SECTOR_CASES: Record<string, string> = {
  "centri-estetici": "L'Angolo del Benessere",
  parrucchieri: "L'Angolo del Benessere",
  ristoranti: "KEOS Milano",
  negozi: "Esse Mobile",
};
export function SectorCase({ slug, onCta }: { slug: string; onCta?: () => void }) {
  const p = approvedProjects(projects).find((item) => item.title === SECTOR_CASES[slug]);
  if (!p) return null;
  return <section className="sl-section" id="caso-reale"><div className="marketing-container">
    <h2 className="sl-h2">Un progetto reale: {p.title}</h2>
    <p className="sl-lead">{p.businessType}. Un lavoro già realizzato da PromoApp, non un esempio illustrativo.</p>
    <article className="sl-card grid md:grid-cols-2 gap-6 items-center">
      <img src={appPath(p.image)} alt={`${p.title}: progetto realizzato da PromoApp per ${p.businessType}`}
        loading="lazy" decoding="async" width={800} height={500} className="w-full rounded-xl" />
      <div>
        <p><strong>Esigenza: </strong>{p.need}</p>
        <p className="mt-3"><strong>Soluzione: </strong>{p.solution}</p>
        <ul className="sl-list mt-3">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
        <a href="#preventivo" className="whatsapp-link mt-4" onClick={onCta}>Voglio una soluzione così</a>
      </div>
    </article>
  </div></section>;
}
