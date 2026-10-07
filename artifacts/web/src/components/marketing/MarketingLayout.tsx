import type { ReactNode } from "react";
import { Link } from "wouter";
import { appPath, type Service } from "../../lib/marketing";
import WhatsAppLink from "./WhatsAppLink";

export default function MarketingLayout({ service = "generale", children }: { service?: Service; children: ReactNode }) {
  return <div className="marketing-page">
    <header className="marketing-nav"><div className="marketing-container">
      <Link href="/" className="marketing-logo" aria-label="PromoApp.it, homepage">Promo<span>App</span><em>.it</em></Link>
      <a href="#preventivo" className="sl-ghost" style={{ minHeight: 40, padding: "8px 14px", fontSize: 12 }}>Richiedi preventivo</a>
    </div></header>
    <main>{children}</main>
    <footer className="marketing-footer"><div className="marketing-container">
      <p><strong>PromoApp.it</strong> · P.IVA 08223951008</p>
      <nav aria-label="Informazioni legali" className="flex flex-wrap gap-4 mt-3">
        <Link href="/">Homepage</Link><a href={appPath("/dati-societari.html")}>Dati societari</a><a href={appPath("/privacy.html")}>Privacy</a>
        <a href={appPath("/cookie.html")}>Cookie</a>
        <button type="button" onClick={() => window.dispatchEvent(new Event("promoapp-cookie-settings"))}>Preferenze cookie</button>
      </nav>
    </div></footer>
    <WhatsAppLink service={service} placement="floating" className="whatsapp-link marketing-float"><i className="fab fa-whatsapp" aria-hidden="true" /></WhatsAppLink>
  </div>;
}
