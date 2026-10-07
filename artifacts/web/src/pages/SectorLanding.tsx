import { Redirect } from "wouter";
import MarketingLayout from "../components/marketing/MarketingLayout";
import LeadForm from "../components/marketing/LeadForm";
import { sectors, prices } from "../lib/commercial";
import { whatsappUrl } from "../lib/marketing";
import { trackEvent, trackWhatsApp } from "../lib/analytics";
import "../styles/commercial.css";
import { useMobileFormVisibility } from "../lib/useMobileFormVisibility";

export default function SectorLanding({ slug }: { slug: string }) {
  useMobileFormVisibility(slug);
  const sector = Object.hasOwn(sectors, slug) ? sectors[slug as keyof typeof sectors] : undefined;
  if (!sector) return <Redirect to="/" replace />;
  const cta = sector.cta;
  return <MarketingLayout slug={slug}><div className="sector-content">
    <section className="sl-hero"><div className="marketing-container sl-hero-grid">
      <div><p className="sl-kicker">Soluzioni per {sector.name}</p><h1>{sector.headline}</h1><p className="sl-sub">{sector.intro}</p>
        <a href="#preventivo" className="whatsapp-link" onClick={() => trackEvent("cta_click", "generale", "sector-hero", slug)}>{cta}</a>
        <a href={whatsappUrl("generale", slug)} className="sl-ghost ml-2" target="_blank" rel="noopener noreferrer"
          onClick={() => trackWhatsApp("generale", "sector-hero", slug)}>Scrivici su WhatsApp</a>
        <p className="text-sm mt-4">Proposta iniziale gratuita e senza impegno. Funzioni e costi definiti insieme.</p>
      </div>
      <div id="preventivo" className="scroll-mt-6"><LeadForm key={slug} slug={slug} activity={sector.activity} cta={cta} /></div>
    </div></section>
    <section className="sl-section"><div className="marketing-container">
      <h2 className="sl-h2">Più semplicità nel lavoro di ogni giorno</h2>
      <div className="sl-grid c4">{sector.benefits.map((benefit) => <article className="sl-card" key={benefit}><h3>{benefit}</h3><p>Una soluzione progettata sul modo di lavorare della tua attività.</p></article>)}</div>
    </div></section>
    <section className="sl-section dark"><div className="marketing-container">
      <h2 className="sl-h2">Le funzioni da scegliere insieme</h2><p className="sl-lead">Non un pacchetto indistinto: includiamo nel preventivo soltanto ciò che concordiamo.</p>
      <ul className="sl-list">{sector.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      <div className="sl-card mt-6"><h3>Esempio di utilizzo — scenario illustrativo</h3><p>{sector.example}</p></div>
    </div></section>
    <section className="sl-section"><div className="marketing-container">
      <h2 className="sl-h2">Come iniziare</h2>
      <ol className="sl-steps">
        <li><h3>1. Ci racconti la tua attività</h3><p>Lascia tre dati. Ti ricontattiamo per capire esigenze e strumenti già utilizzati.</p></li>
        <li><h3>2. Ricevi una proposta chiara</h3><p>Definiamo funzioni, costi e tempi prima di qualsiasi impegno.</p></li>
        <li><h3>3. Realizziamo la soluzione concordata</h3><p>Prepariamo il progetto e concordiamo avvio, aggiornamenti e assistenza.</p></li>
      </ol>
    </div></section>
    <section className="sl-section dark"><div className="marketing-container">
      <h2 className="sl-h2">Prezzi di partenza, senza confondere i servizi</h2>
      <div className="sl-grid c3">
        {sector.offers.includes("website") && <article className="sl-card"><h3>Sito web professionale</h3><p className="text-xl font-bold">{prices.website.label}</p><p>Presentazione dell'attività e contatti. Non comprende automaticamente il gestionale.</p></article>}
        {sector.offers.includes("webapp") && <article className="sl-card"><h3>Web app e gestionale su misura</h3><p className="text-xl font-bold">{prices.webapp.label}</p><p>Agenda, prenotazioni e integrazioni definite sul tuo progetto.</p></article>}
        {sector.offers.includes("menu") && <article className="sl-card"><h3>Menu digitale QR</h3><p className="text-xl font-bold">{prices.menu.label}</p><p>Realizzazione base. Hosting, aggiornamenti e assistenza da concordare a parte.</p></article>}
      </div><p className="text-sm mt-4">{prices.note}</p>
    </div></section>
    <section className="sl-section"><div className="marketing-container">
      <h2 className="sl-h2">Un progetto personalizzato, un interlocutore diretto</h2><p className="sl-lead">Parli con chi realizza la soluzione. Il preventivo chiarisce inclusioni, extra e costi periodici. Non devi conoscere la tecnologia per iniziare.</p>
      <h2 className="sl-h2 mt-8">Domande frequenti per {sector.name.toLowerCase()}</h2>
      <div className="sl-faq">{sector.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      <div className="mt-8"><h2 className="sl-h2">Non sai ancora quale soluzione scegliere?</h2><p className="sl-lead">Partiamo dalle tue esigenze, non da un elenco di software.</p>
        <a href="#preventivo" className="whatsapp-link" onClick={() => trackEvent("cta_click", "generale", "sector-final", slug)}>{cta}</a>
      </div>
    </div></section>
    <a className="sector-sticky" href="#preventivo" onClick={() => trackEvent("cta_click", "generale", "mobile-sticky", slug)}>{cta}</a>
  </div></MarketingLayout>;
}
