import projects from "../../lib/approved-projects.json";
import { appPath } from "../../lib/marketing";
import { trackEvent } from "../../lib/analytics";

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
export default function PortfolioExamples() {
  const approved = approvedProjects(projects);
  if (!approved.length) return null;
  return <section className="relative z-10 px-4 py-10 scroll-mt-5" id="progetti" aria-labelledby="progetti-title">
    <div className="max-w-5xl mx-auto text-white">
      <p className="text-emerald-300 text-xs font-black uppercase tracking-[0.2em] mb-2">Progetti reali, clienti reali</p>
      <h2 id="progetti-title" className="font-black text-2xl md:text-3xl mb-2">Cosa abbiamo realizzato per attività come la tua</h2>
      <p className="text-indigo-200 text-sm mb-6 max-w-2xl">Siti, prenotazioni online, gestionali ed e-commerce già al lavoro per imprese locali in tutta Italia.</p>
      <div className="grid sm:grid-cols-2 gap-4">{approved.map((p, index) => <article key={p.title} className="glass-card rounded-2xl overflow-hidden flex flex-col">
        <img src={appPath(p.image)} alt={`${p.title}: progetto realizzato da PromoApp per ${p.businessType}`}
          loading={index < 2 ? "eager" : "lazy"} decoding="async" width={800} height={500}
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
        <a href="#preventivo" onClick={() => trackEvent("cta_click", "generale", "portfolio")}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-bold text-sm min-h-12">
          Voglio una soluzione così per la mia attività
        </a>
      </div>
    </div>
  </section>;
}
