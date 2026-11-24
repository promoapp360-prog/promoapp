import { Link } from "wouter";
import MarketingLayout from "../components/marketing/MarketingLayout";
import WhatsAppLink from "../components/marketing/WhatsAppLink";
import { publicClientProjects } from "../components/marketing/PortfolioExamples";
import { appPath } from "../lib/marketing";
import projectsData from "../lib/approved-projects.json";

const projects = publicClientProjects(projectsData)
  .map((project) => ({ ...project, city: project.businessType.split("·").at(-1)?.trim() ?? "" }))
  .filter((project) => Boolean(project.city));

export default function PortfolioPage() {
  return <MarketingLayout showFormLink={false}>
    <section className="sl-hero product-hero">
      <div className="marketing-container"><div className="max-w-3xl md:col-span-2">
        <span className="sl-kicker">Progetti reali, informazioni verificate</span>
        <h1>Progetti digitali realizzati da PromoApp</h1>
        <p className="sl-sub">Siti e soluzioni digitali costruiti per attività di Milano, Barletta e Reggio Calabria. Ogni scheda riporta il progetto, il settore, la città e il lavoro svolto.</p>
        <div className="sl-cta">
          <WhatsAppLink placement="portfolio-page">Parliamo del tuo progetto</WhatsAppLink>
          <Link href="/siti-web" className="sl-ghost">Scopri i siti web</Link>
        </div>
      </div></div>
    </section>
    <section className="sl-section">
      <div className="marketing-container">
        <h2 className="sl-h2">Lavori realizzati per attività locali</h2>
        <div className="sl-grid c2">
          {projects.map((project, index) => <article className="sl-card" key={project.title}>
            <img src={appPath(project.image)} alt={`${project.title}: ${project.businessType}, progetto realizzato da PromoApp a ${project.city}`}
              width={1200} height={750} loading={index === 0 ? "eager" : "lazy"} decoding="async"
              fetchPriority={index === 0 ? "high" : "auto"} className="w-full rounded-xl" />
            <p className="sl-kicker mt-4">{project.businessType}</p>
            <h3 className="mt-2 text-xl font-bold">{project.title}</h3>
            <p className="sl-lead mt-3"><strong>Esigenza:</strong> {project.need}</p>
            <p className="sl-lead mt-3"><strong>Soluzione:</strong> {project.solution}</p>
            <ul className="sl-list mt-3">{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          </article>)}
        </div>
        <p className="sl-note mt-5">I progetti e le immagini pubblicati sono quelli autorizzati nel portfolio PromoApp. Le funzioni e i risultati di ogni attività sono specifici del relativo progetto.</p>
      </div>
    </section>
    <section className="sl-section alt">
      <div className="marketing-container">
        <h2 className="sl-h2">Una soluzione adatta alla tua attività</h2>
        <p className="sl-lead">Raccontaci cosa vuoi realizzare: definiamo insieme funzioni, contenuti e costi prima di iniziare.</p>
        <nav aria-label="Servizi PromoApp" className="flex flex-wrap gap-3 mt-5">
          <Link href="/siti-web" className="whatsapp-link">Siti web</Link>
          <Link href="/gestionali" className="whatsapp-link">Gestionali</Link>
          <Link href="/app-prenotazioni" className="whatsapp-link">Prenotazioni online</Link>
          <Link href="/menu-digitali" className="whatsapp-link">Menu digitale QR</Link>
        </nav>
      </div>
    </section>
  </MarketingLayout>;
}
