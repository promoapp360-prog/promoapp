import { Link } from "wouter";
import MarketingLayout from "../components/marketing/MarketingLayout";
import WhatsAppLink from "../components/marketing/WhatsAppLink";
import { approvedProjects } from "../components/marketing/PortfolioExamples";
import { getSEOContent, SEOFAQs, SEOSections } from "../components/marketing/SEOContent";
import { appPath } from "../lib/marketing";
import projectsData from "../lib/approved-projects.json";

type LocalPath = "/siti-web-milano";

export default function LocalSeoPage({ pagePath }: { pagePath: LocalPath }) {
  const page = getSEOContent(pagePath);
  const projects = approvedProjects(projectsData).filter((project) => page.projects?.includes(project.title));
  return <MarketingLayout service="siti-web">
    <section className="sl-hero product-hero">
      <div className="marketing-container"><div className="max-w-3xl md:col-span-2">
        <span className="sl-kicker">Siti web per attività locali · {page.city}</span>
        <h1>{page.h1}</h1>
        <p className="sl-sub">{page.intro}</p>
        <div className="sl-cta">
          <WhatsAppLink service="siti-web" placement="local-seo">Richiedi una proposta</WhatsAppLink>
          <Link href="/lavori" className="sl-ghost">Guarda i progetti realizzati</Link>
        </div>
      </div></div>
    </section>
    <SEOSections pagePath={pagePath} />
    {projects.length > 0 && <section className="sl-section">
      <div className="marketing-container">
        <h2 className="sl-h2">Progetti PromoApp realizzati a {page.city}</h2>
        <div className="sl-grid c2">
          {projects.map((project) => <article className="sl-card" key={project.title}>
            <img src={appPath(project.image)} alt={`${project.title}: ${project.businessType}, progetto realizzato da PromoApp`}
              width={1200} height={750} loading="lazy" decoding="async" className="w-full rounded-xl" />
            <p className="sl-kicker mt-4">{project.businessType}</p>
            <h3 className="mt-2 text-xl font-bold">{project.title}</h3>
            <p className="sl-lead mt-3">{project.solution}</p>
            <Link href="/lavori" className="whatsapp-link mt-4">Vedi tutti i progetti</Link>
          </article>)}
        </div>
      </div>
    </section>}
    <SEOFAQs pagePath={pagePath} />
    <section className="sl-section">
      <div className="marketing-container">
        <h2 className="sl-h2">Servizi per attività locali</h2>
        <nav aria-label="Servizi collegati" className="flex flex-wrap gap-3">
          {page.related?.map(([href, label]) => <Link key={href} href={href} className="whatsapp-link">{label}</Link>)}
        </nav>
      </div>
    </section>
  </MarketingLayout>;
}
