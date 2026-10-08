import { useId, useRef, useState } from "react";
import { useLocation } from "wouter";
import { submitContact } from "@workspace/api-client-react";
import { appPath, getAttribution, readConsent, serviceCodes, serviceCta, type Service } from "../../lib/marketing";
import { commercialVariant, commercialIncentive, sectors } from "../../lib/commercial";
import { trackConversion, trackEvent } from "../../lib/analytics";
import { rememberLead } from "../../lib/lead-receipt";

export default function LeadForm({ service = "generale", slug = "generale", activity = "", cta, onBusinessNameChange }: {
  service?: Service; slug?: string; activity?: string; cta?: string; onBusinessNameChange?: (name: string) => void;
}) {
  const id = useId();
  const [, navigate] = useLocation();
  const started = useRef(false);
  const [form, setForm] = useState({ nome_attivita: "", whatsapp: "", settore: activity, website: "" });
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const incentive = commercialIncentive();
  function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (e.target.name === "nome_attivita") onBusinessNameChange?.(e.target.value);
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value })); setError("");
  }
  function invalid(event: React.FormEvent<HTMLFormElement>) {
    // Preserve native constraints without popovers covering the mobile form.
    event.preventDefault();
    const field = event.target as HTMLInputElement | HTMLSelectElement;
    setError(field.name === "whatsapp" ? "Inserisci un numero WhatsApp valido (almeno 6 caratteri)." :
      "Controlla nome attività, tipo attività e informativa privacy prima di inviare.");
    field.focus();
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!privacy) { setError("Accetta l'informativa privacy per inviare la richiesta."); return; }
    if (!/^[+\d\s().-]{6,30}$/.test(form.whatsapp) || form.whatsapp.replace(/\D/g, "").length < 6) {
      setError("Inserisci un numero WhatsApp valido."); return;
    }
    setLoading(true); setError("");
    try {
      const consent = readConsent();
      const result = await submitContact({ ...form, privacy, servizio: slug === "generale" ? serviceCodes[service] : "sector_custom",
        slug, pagina: window.location.pathname, variant: commercialVariant().key,
        attribution: getAttribution(), marketingConsent: consent.marketing, analyticsConsent: consent.analytics });
      rememberLead(result, service, slug);
      if (!result.duplicate) trackConversion(service, "form", result.leadId, slug, form.settore);
      navigate("/grazie");
    } catch { setError("La richiesta non è stata confermata. Riprova oppure scrivici su WhatsApp."); }
    finally { setLoading(false); }
  }
  return <form className="lead-form" onSubmit={submit} onInvalid={invalid} data-testid={`form-${slug}`}
    onFocusCapture={() => { if (!started.current) { trackEvent("form_start", service, "form", slug); started.current = true; } }}>
    <h3>{cta ?? serviceCta[service]}</h3>
    <p className="text-sm text-gray-500">Tre dati, nessun impegno. {service === "menu-digitali" ? incentive.promise : "Richiedi una proposta personalizzata in base alle esigenze della tua attività."}</p>
    <div><label htmlFor={`${id}-name`}>Nome attività *</label><input id={`${id}-name`} name="nome_attivita" autoComplete="organization"
      value={form.nome_attivita} onChange={change} required minLength={2} maxLength={160} placeholder="Il nome della tua attività" /></div>
    <div><label htmlFor={`${id}-business`}>Tipo attività *</label><select id={`${id}-business`} name="settore" value={form.settore} onChange={change} required>
      <option value="">Seleziona...</option>
      {Object.values(sectors).map((sector) => <option key={sector.activity} value={sector.activity}>{sector.activity}</option>)}
      <option value="Altro">Altro</option>
    </select></div>
    <div><label htmlFor={`${id}-phone`}>WhatsApp *</label><input id={`${id}-phone`} name="whatsapp" type="tel" inputMode="tel" autoComplete="tel"
      placeholder="+39..." value={form.whatsapp} onChange={change} required minLength={6} maxLength={30} /></div>
    <div className="lead-honeypot" aria-hidden="true"><label htmlFor={`${id}-website`}>Lascia vuoto</label><input id={`${id}-website`}
      name="website" autoComplete="off" tabIndex={-1} value={form.website} onChange={change} /></div>
    <label className="lead-privacy"><input type="checkbox" required checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
      <span>Ho letto l'<a href={appPath("/privacy.html")} target="_blank" rel="noopener noreferrer">informativa privacy</a> e acconsento al trattamento per rispondere alla richiesta. Nessuna iscrizione pubblicitaria.</span></label>
    {error && <p className="lead-form-status" role="alert" data-testid="lead-error">{error}</p>}
    <button type="submit" disabled={loading}>{loading ? "Invio in corso…" : service === "menu-digitali" ? serviceCta[service] : "Richiedi una proposta personalizzata"}</button>
    <p className="text-sm text-gray-500">{incentive.responseNote}</p>
    <small>I campi con * sono obbligatori.</small>
  </form>;
}
