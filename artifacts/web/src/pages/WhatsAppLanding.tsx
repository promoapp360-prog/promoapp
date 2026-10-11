import { useEffect, useRef } from "react";
import "../styles/whatsapp-landing.css";
import { appPath } from "../lib/marketing";
import { trackWhatsAppLanding } from "../lib/analytics";
import { whatsappChoices } from "../lib/whatsapp-choices";

const WA_HREF = "https://wa.me/393793602035?text=Ciao%20PromoApp%2C%20vorrei%20informazioni%20per%20la%20mia%20attivit%C3%A0.";

const POINTS = [
  "Demo gratuita della tua soluzione in 48 ore",
  "Preventivo scritto prima di iniziare",
  "Pagamento a fasi e assistenza iniziale inclusa",
];

function WaIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.21 4.24-9.45 9.46-9.45 2.52 0 4.9.99 6.68 2.77a9.38 9.38 0 0 1 2.77 6.69c0 5.21-4.25 9.45-9.47 9.45zm8.05-17.5A11.32 11.32 0 0 0 12.04.67C5.77.67.66 5.77.66 12.05c0 2 .52 3.96 1.52 5.69L.57 23.33l5.72-1.5a11.36 11.36 0 0 0 5.44 1.39h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05z" />
    </svg>
  );
}

export default function WhatsAppLanding() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pageRef.current;
    if (!el || typeof window === "undefined") return;
    let ro: ResizeObserver | null = null;
    let observed: Element | null = null;
    const update = () => {
      const panel = document.querySelector(".consent-panel");
      if (panel !== observed) {
        ro?.disconnect();
        observed = panel;
        if (panel && typeof ResizeObserver !== "undefined") {
          ro = new ResizeObserver(update);
          ro.observe(panel);
        }
      }
      const h = panel ? Math.ceil(panel.getBoundingClientRect().height) : 0;
      el.style.setProperty("--wl-consent", h + "px");
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    return () => { mo.disconnect(); ro?.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  return (
    <div className="wl-page" ref={pageRef}>
      <header className="wl-top">
        <span className="wl-mark" aria-label="PromoApp.it">Promo<span>App</span><em>.it</em></span>
      </header>
      <main className="wl-main">
        <h1 className="wl-h1">Siti, app e gestionali <span>su misura</span> per la tua attività.</h1>
        <p className="wl-sub">Raccontaci cosa ti serve su WhatsApp. Ti rispondiamo noi, senza moduli e senza impegno.</p>
        <ul className="wl-points">
          {POINTS.map((p) => (
            <li key={p}>
              <span className="wl-check" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              {p}
            </li>
          ))}
        </ul>
        <section className="wl-sectors" aria-labelledby="wl-sectors-title">
          <h2 id="wl-sectors-title">Che attività hai?</h2>
          <div className="wl-sector-grid">
            {whatsappChoices.map(({ slug, label, message }) => (
              <a className={`wl-sector-cta${slug === "altro" ? " wl-sector-other" : ""}`} key={slug}
                href={`https://wa.me/393793602035?text=${encodeURIComponent(message)}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => trackWhatsAppLanding("sector", slug)}>
                {label}
              </a>
            ))}
          </div>
        </section>
        <a className="wl-cta" href={WA_HREF} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppLanding("hero")}>
          <WaIcon size={28} />Oppure scrivici direttamente
        </a>
        <p className="wl-note">Seguiamo pochi progetti al mese per curarli bene: scrivici ora per una demo gratuita entro 48 ore.</p>
        <p className="wl-note">Nessun vincolo</p>
        <p className="wl-services">Siti web professionali da 399 € + IVA · Prenotazioni e appuntamenti online · Gestionali e magazzino · Fidelity digitale · Menu QR</p>
        <p className="wl-human">Parli direttamente con chi realizza il tuo progetto, non con un call center.</p>
      </main>
      <footer className="wl-footer">
        <span>© 2026 PromoApp.it</span>
        <a href={appPath("/privacy.html")}>Privacy</a>
        <a href={appPath("/cookie.html")}>Cookie</a>
      </footer>
      <div className="wl-sticky">
        <a className="wl-cta wl-cta-sticky" href={WA_HREF} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppLanding("sticky")}>
          <WaIcon size={24} />Scrivici su WhatsApp
        </a>
      </div>
    </div>
  );
}
