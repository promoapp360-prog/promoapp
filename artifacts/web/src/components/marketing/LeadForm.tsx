import { useId, useState } from "react";
import { submitContact } from "@workspace/api-client-react";
import { appPath, getAttribution, serviceNames, type Service } from "../../lib/marketing";
import { trackConversion } from "../../lib/analytics";
import WhatsAppLink from "./WhatsAppLink";

export default function LeadForm({ service = "generale" }: { service?: Service }) {
  const id = useId();
  const [form, setForm] = useState({ nome_attivita: "", whatsapp: "", settore: "", messaggio: "", website: "" });
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
    setError("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || sent) return;
    if (!privacy) { setError("Leggi e accetta l'informativa privacy per inviare la richiesta."); return; }
    if (!/^[+\d\s().-]{6,30}$/.test(form.whatsapp) || form.whatsapp.replace(/\D/g, "").length < 6) {
      setError("Inserisci un numero di telefono valido."); return;
    }
    setLoading(true); setError("");
    try {
      const result = await submitContact({
        ...form, nome_attivita: form.nome_attivita.trim(), settore: form.settore.trim(),
        messaggio: form.messaggio.trim(), whatsapp: form.whatsapp.trim(),
        servizio: service, pagina: window.location.pathname, attribution: getAttribution(),
      });
      if (!result.success) throw new Error(result.message ?? "Invio non riuscito.");
      setSent(true);
      trackConversion(service);
      setForm({ nome_attivita: "", whatsapp: "", settore: "", messaggio: "", website: "" });
    } catch {
      setError("La richiesta non è stata inviata. Riprova oppure contattaci su WhatsApp.");
    } finally { setLoading(false); }
  }
  if (sent) return <div className="lead-form lead-form-success" role="status" data-testid="lead-success">
    <h3>Richiesta inviata!</h3><p>Grazie. Ti ricontatteremo al numero indicato per parlare di {serviceNames[service]}.</p>
    <WhatsAppLink service={service} placement="thanks">Continua su WhatsApp</WhatsAppLink>
  </div>;
  return <form className="lead-form" onSubmit={submit} data-testid={`form-${service}`}>
    <h3>Parliamo di {serviceNames[service]}</h3>
    <p className="text-sm text-gray-500">Lasciaci i tuoi recapiti. Nessun pagamento richiesto.</p>
    <div><label htmlFor={`${id}-name`}>Nome *</label><input id={`${id}-name`} name="nome_attivita" autoComplete="name"
      placeholder="Il tuo nome o quello dell'attività" value={form.nome_attivita} onChange={change} required minLength={2} maxLength={160} /></div>
    <div><label htmlFor={`${id}-phone`}>Telefono / WhatsApp *</label><input id={`${id}-phone`} name="whatsapp" type="tel" autoComplete="tel"
      placeholder="+39..." value={form.whatsapp} onChange={change} required minLength={6} maxLength={30} /></div>
    <div><label htmlFor={`${id}-business`}>Tipo di attività *</label><input id={`${id}-business`} name="settore"
      placeholder="Es. negozio, studio, ristorante" value={form.settore} onChange={change} required minLength={2} maxLength={120} /></div>
    <div><label htmlFor={`${id}-request`}>Di cosa hai bisogno? *</label><textarea id={`${id}-request`} name="messaggio" rows={3}
      placeholder="Raccontaci brevemente il tuo progetto..." value={form.messaggio} onChange={change} required minLength={10} maxLength={5000} /></div>
    <div className="lead-honeypot" aria-hidden="true"><label htmlFor={`${id}-website`}>Lascia vuoto</label><input id={`${id}-website`}
      name="website" autoComplete="off" tabIndex={-1} value={form.website} onChange={change} /></div>
    <label className="lead-privacy"><input type="checkbox" required checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
      <span>Ho letto l'<a href={appPath("/privacy.html")} target="_blank" rel="noopener noreferrer">informativa privacy</a> e acconsento al trattamento dei dati per ricevere risposta alla mia richiesta. Nessuna iscrizione pubblicitaria.</span></label>
    {error && <p className="lead-form-status" role="alert" data-testid="lead-error">{error}</p>}
    <button type="submit" disabled={loading}>{loading ? "Invio in corso…" : "Richiedi il tuo preventivo"}</button>
    <small>I campi con * sono obbligatori.</small>
  </form>;
}
