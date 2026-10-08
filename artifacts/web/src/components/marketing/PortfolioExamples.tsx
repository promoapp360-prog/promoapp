import projects from "../../lib/approved-projects.json";
import { appPath } from "../../lib/marketing";

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
  return <section className="relative z-10 px-4 py-8" aria-label="Progetti realizzati e autorizzati">
    <div className="max-w-5xl mx-auto text-white">
      <h2 className="font-bold text-2xl mb-5">Esigenze reali, soluzioni realizzate</h2>
      <div className="grid sm:grid-cols-2 gap-4">{approved.map((p) => <article key={p.title} className="glass-card rounded-2xl p-5">
        <img src={appPath(p.image)} alt={`Anteprima del progetto ${p.title}`} loading="lazy" width={640} height={400} className="w-full rounded-xl mb-4" />
        <p className="text-emerald-300 text-sm">{p.businessType}</p><h3 className="font-bold text-xl mt-1">{p.title}</h3>
        <p className="text-indigo-100 text-sm mt-3"><strong>Esigenza iniziale: </strong>{p.need}</p>
        <p className="text-indigo-100 text-sm mt-2"><strong>Soluzione realizzata: </strong>{p.solution}</p>
        <ul className="text-indigo-100 text-sm list-disc pl-5 mt-3">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
      </article>)}</div>
    </div>
  </section>;
}
