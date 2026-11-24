import { Link } from "wouter";
import MarketingLayout from "../components/marketing/MarketingLayout";
import WhatsAppLink from "../components/marketing/WhatsAppLink";
import { getSEOContent, SEOFAQs, SEOSections } from "../components/marketing/SEOContent";

type ServicePath = "/gestionali" | "/app-prenotazioni";

export default function SEOServicePage({ pagePath }: { pagePath: ServicePath }) {
  const page = getSEOContent(pagePath);
  return <MarketingLayout service={page.service}>
    <section className="sl-hero product-hero">
      <div className="marketing-container sl-hero-grid">
        <div>
          <span className="sl-kicker">Soluzioni digitali PromoApp</span>
          <h1>{page.h1}</h1>
          <p className="sl-sub">{page.intro}</p>
          <p className="sl-note">Attivazione definitiva a 399 € + IVA per web app e gestionali. Costi tecnici da 9,90 € al mese, comunicati prima dell’attivazione.</p>
          <div className="sl-cta">
            <WhatsAppLink service="web-app" placement="seo-service">Parliamo del tuo progetto</WhatsAppLink>
            <Link href="/siti-web" className="sl-ghost">Scopri i siti web per attività locali</Link>
          </div>
        </div>
        <aside className="sl-card">
          <h2 className="sl-h2" style={{ color: "#1e1b4b" }}>Funzioni definite insieme</h2>
          <p className="sl-lead">Prima di iniziare concordiamo flussi, funzioni comprese, eventuali integrazioni e costi tecnici. Non servono password o accessi per chiedere informazioni.</p>
          <Link href="/preventivo" className="whatsapp-link mt-5">Richiedi una proposta gratuita</Link>
        </aside>
      </div>
    </section>
    <SEOSections pagePath={pagePath} />
    <SEOFAQs pagePath={pagePath} />
    <section className="sl-section">
      <div className="marketing-container">
        <h2 className="sl-h2">Approfondisci le soluzioni PromoApp</h2>
        <nav aria-label="Servizi collegati" className="flex flex-wrap gap-3">
          {page.related?.map(([href, label]) => <Link key={href} href={href} className="whatsapp-link">{label}</Link>)}
        </nav>
      </div>
    </section>
  </MarketingLayout>;
}
