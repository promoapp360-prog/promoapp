import { Link } from "wouter";
import MarketingLayout from "../components/marketing/MarketingLayout";

const links = [
  ["/siti-web", "Siti web"],
  ["/gestionali", "Gestionali"],
  ["/app-prenotazioni", "Prenotazioni online"],
  ["/menu-digitali", "Menu digitale QR"],
  ["/controllo-sito", "Controllo gratuito del sito"],
] as const;

export default function NotFound() {
  return <MarketingLayout showFormLink={false}>
    <section className="sl-section min-h-[60vh]">
      <div className="marketing-container">
        <p className="sl-kicker">Errore 404</p>
        <h1 className="sl-h2">Pagina non trovata</h1>
        <p className="sl-lead mt-4">Il link potrebbe essere errato o la pagina potrebbe essere stata spostata. Torna alla home o scegli uno dei servizi PromoApp.</p>
        <nav aria-label="Home e servizi PromoApp" className="flex flex-wrap gap-3 mt-6">
          <Link href="/" className="whatsapp-link">Torna alla home</Link>
          {links.map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-full border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-950 hover:bg-indigo-50">{label}</Link>)}
        </nav>
      </div>
    </section>
  </MarketingLayout>;
}
