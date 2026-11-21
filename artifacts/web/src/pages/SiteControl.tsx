import { useState, type FormEvent } from "react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import { appPath, WHATSAPP_NUMBER } from "../lib/marketing";

type FormValues = {
  siteUrl: string;
  nomeAttivita: string;
  email: string;
  whatsapp: string;
  honeypot: string;
};

const EMPTY_FORM: FormValues = { siteUrl: "", nomeAttivita: "", email: "", whatsapp: "", honeypot: "" };
const steps = [
  ["1", "Inserisci il tuo sito", "Indica l’indirizzo e i recapiti per ricevere il report."],
  ["2", "Entro 48 ore ricevi il report", "Ti inviamo una valutazione chiara e senza tecnicismi."],
  ["3", "Se vuoi, sistemiamo tutto noi", "Decidi liberamente se chiedere un intervento."],
];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
}

export default function SiteControl() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [sent, setSent] = useState(false);

  function update(field: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const siteUrl = normalizeUrl(form.siteUrl);
    if (!siteUrl) { setError("Inserisci l’indirizzo del sito."); return; }
    if (!form.email.trim() && !form.whatsapp.trim()) {
      setError("Inserisci un’email oppure un numero WhatsApp."); return;
    }
    if (!authorized) { setError("Conferma di avere l’autorizzazione e accetta l’informativa privacy."); return; }

    setBusy(true); setError("");
    try {
      const response = await fetch(appPath("/api/controlli"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl,
          nomeAttivita: form.nomeAttivita.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
          authorization: true,
          privacyAccepted: true,
          honeypot: form.honeypot,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw new Error(result.message || "Non è stato possibile inviare la richiesta.");
      setSubmittedUrl(siteUrl);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invio non riuscito. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  const whatsappMessage = `Ciao, ho richiesto il controllo gratuito per il sito: ${submittedUrl}`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <MarketingLayout showFormLink={false}>
      <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
        <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-4 py-12 text-white sm:py-16">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_0.9fr] md:items-center">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Controllo gratuito del sito</p>
              <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-5xl">Scopri se il tuo sito è sicuro, veloce e pronto a ricevere clienti.</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">Analizziamo il tuo sito e ti inviamo un report chiaro, senza tecnicismi, entro 48 ore.</p>
              <ol className="mt-8 grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                {steps.map(([number, title, description]) => (
                  <li key={number} className="flex gap-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400 font-black text-indigo-950">{number}</span>
                    <div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-indigo-200">{description}</p></div>
                  </li>
                ))}
              </ol>
            </div>

            <section id="richiesta" className="scroll-mt-6 rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7" aria-labelledby="site-control-form-title">
              {sent ? (
                <div className="py-6 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><i className="fas fa-check text-2xl" aria-hidden="true" /></span>
                  <h2 id="site-control-form-title" className="mt-5 text-xl font-black">Richiesta ricevuta! Riceverai il report entro 48 ore.</h2>
                  <p className="mt-3 break-all text-sm text-slate-600">{submittedUrl}</p>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                    className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600">
                    <i className="fab fa-whatsapp text-lg" aria-hidden="true" /> Scrivici su WhatsApp
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Nessun costo, nessun impegno</p>
                  <h2 id="site-control-form-title" className="mt-2 text-xl font-black sm:text-2xl">Richiedi il controllo gratuito</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Compila i campi: ti ricontatteremo con il report entro 48 ore.</p>
                  <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                    <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
                      <label htmlFor="site-control-honeypot">Lascia vuoto</label>
                      <input id="site-control-honeypot" name="website" value={form.honeypot}
                        onChange={(event) => update("honeypot", event.target.value)} tabIndex={-1} autoComplete="off" />
                    </div>
                    <label className="block text-sm font-semibold" htmlFor="site-control-url">Indirizzo del sito *
                      <input id="site-control-url" name="siteUrl" type="text" inputMode="url" autoComplete="url" required maxLength={2048}
                        placeholder="www.tuaattivita.it" value={form.siteUrl}
                        onChange={(event) => update("siteUrl", event.target.value)}
                        onBlur={() => update("siteUrl", normalizeUrl(form.siteUrl))}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                    </label>
                    <label className="block text-sm font-semibold" htmlFor="site-control-business">Nome dell’attività *
                      <input id="site-control-business" name="nomeAttivita" type="text" autoComplete="organization" required minLength={2} maxLength={160}
                        value={form.nomeAttivita} onChange={(event) => update("nomeAttivita", event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold" htmlFor="site-control-email">Email{!form.whatsapp.trim() ? " *" : ""}
                        <input id="site-control-email" name="email" type="email" autoComplete="email" required={!form.whatsapp.trim()} maxLength={254}
                          value={form.email} onChange={(event) => update("email", event.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                      </label>
                      <label className="block text-sm font-semibold" htmlFor="site-control-whatsapp">Numero WhatsApp{!form.email.trim() ? " *" : ""}
                        <input id="site-control-whatsapp" name="whatsapp" type="tel" autoComplete="tel" required={!form.email.trim()} maxLength={30}
                          value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                      </label>
                    </div>
                    <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
                      <input type="checkbox" required checked={authorized} onChange={(event) => setAuthorized(event.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-emerald-600" />
                      <span>Dichiaro di essere il titolare o di avere l'autorizzazione del titolare del sito e acconsento all'analisi. Ho letto l'<a href={appPath("/privacy.html")} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 underline">informativa privacy</a>.</span>
                    </label>
                    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    <button type="submit" disabled={busy}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60">
                      {busy ? "Invio in corso…" : "Richiedi il controllo gratuito"}
                    </button>
                    <p className="text-center text-xs text-slate-500">Analisi su richiesta, solo con l’autorizzazione del titolare.</p>
                  </form>
                </>
              )}
            </section>
          </div>
        </section>
        <section className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-black text-indigo-950 sm:text-3xl">Cosa controlliamo</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Una revisione pratica per capire cosa funziona e dove intervenire.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["fa-key", "Dati esposti", "Chiavi, password o file nascosti visibili a chiunque"],
                ["fa-gauge-high", "Velocità ed errori", "Cosa rallenta il sito e cosa non funziona"],
                ["fa-link", "Servizi collegati", "Strumenti esterni e possibili rischi"],
                ["fa-user-xmark", "Clienti persi", "Moduli, prenotazioni o WhatsApp che non funzionano"],
              ].map(([icon, title, description]) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <i className={`fas ${icon} text-xl text-emerald-600`} aria-hidden="true" />
                  <h3 className="mt-3 text-base font-bold text-indigo-950">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
