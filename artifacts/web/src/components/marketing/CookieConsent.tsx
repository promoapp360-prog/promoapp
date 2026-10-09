import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { appPath, CONSENT_KEY, hasConsentChoice, readConsent, type Consent } from "../../lib/marketing";
import { updateTrackingConsent } from "../../lib/analytics";
import "../../styles/consent.css";

export default function CookieConsent() {
  const [path] = useLocation();
  const [open, setOpen] = useState(!hasConsentChoice());
  const [custom, setCustom] = useState(false);
  const [choice, setChoice] = useState<Consent>(readConsent);
  useEffect(() => {
    const show = () => { setChoice(readConsent()); setCustom(true); setOpen(true); };
    window.addEventListener("promoapp-cookie-settings", show);
    return () => window.removeEventListener("promoapp-cookie-settings", show);
  }, []);
  function save(consent: Consent) {
    const previous = readConsent();
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch { /* Keep denied if browser disallows storage. */ }
    updateTrackingConsent(consent);
    setChoice(consent); setOpen(false);
    if ((previous.analytics && !consent.analytics) || (previous.marketing && !consent.marketing)) {
      // Stop already-loaded provider scripts as well as future events.
      const domains = [window.location.hostname, `.${window.location.hostname}`, ".promoapp.it"];
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (/^(_ga|_gid|_gat|_gcl_|_fbp|_fbc)/.test(name)) {
          document.cookie = `${name}=; Max-Age=0; path=/`;
          for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
        }
      }
      window.location.reload();
    }
  }
  if (!open || /^\/(admin|gestione-contatti)(\/|$)/.test(path)) return null;
  return <section className="consent-panel" role="region" aria-label="Preferenze cookie">
    <div className="consent-content"><div>
      <h2>La tua privacy, la tua scelta</h2>
      <p>I cookie necessari fanno funzionare il sito. Analytics e strumenti pubblicitari Google e Meta restano disattivati finché non li autorizzi.
        <a href={appPath("/cookie.html")}>Leggi la Cookie Policy</a>.</p>
      {custom && <fieldset className="consent-options"><legend>Personalizza il consenso</legend>
        <label><input type="checkbox" checked disabled /> Necessari (sempre attivi)</label>
        <label><input type="checkbox" checked={choice.analytics} onChange={(e) => setChoice({ ...choice, analytics: e.target.checked })} /> Statistiche del sito e Google Analytics</label>
        <label><input type="checkbox" checked={choice.marketing} onChange={(e) => setChoice({ ...choice, marketing: e.target.checked })} /> Marketing (Google Ads e Meta)</label>
      </fieldset>}
    </div><div className="consent-actions">
      <button type="button" onClick={() => save({ analytics: false, marketing: false })}>Rifiuta non necessari</button>
      <button type="button" className="consent-accept" onClick={() => save({ analytics: true, marketing: true })}>Accetta tutti</button>
      {custom ? <button type="button" onClick={() => save(choice)}>Salva le preferenze</button>
        : <button type="button" onClick={() => setCustom(true)}>Personalizza</button>}
    </div></div>
  </section>;
}
