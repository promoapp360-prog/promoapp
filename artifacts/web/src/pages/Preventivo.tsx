import { useEffect, useState } from "react";
import { Link } from "wouter";
import { appPath, getAttribution, whatsappUrl } from "../lib/marketing";
import { trackConversion, trackWhatsApp } from "../lib/analytics";
import HomeContactForm from "../components/marketing/HomeContactForm";
import "../styles/commercial.css";

const SERVICES = [
  { path: "/siti-web", icon: "fa-globe", title: "Siti web professionali", price: "Da 399 €", desc: "Presenta la tua attività e fatti contattare.", cta: "Scopri i siti web" },
  { path: "/web-app", icon: "fa-laptop-code", title: "Web app e gestionali personalizzati", price: "Su preventivo", desc: "Strumenti su misura per il tuo lavoro.", cta: "Scopri le web app" },
  { path: "/menu-digitali", icon: "fa-qrcode", title: "Menu digitali per ristoranti", price: "Da 99 €", desc: "Il tuo menu su smartphone, con QR code.", cta: "Scopri i menu digitali" },
];

const SETTORI = [
  "Negozio / Retail",
  "Ristorante / Bar / Pizzeria",
  "Studio Medico / Dentista",
  "Centro Estetico / SPA",
  "Parrucchiere / Barber",
  "Palestra / Fitness",
  "Autorimessa / Meccanico",
  "Agenzia Immobiliare",
  "Studio Legale / Notarile",
  "Centro Servizi / Agenzia",
  "Agente di Commercio",
  "Altro",
];

const FEATURES = [
  { icon: "fa-chart-line",     text: "Gestione Completa: Tutto il tuo business sotto controllo, dal palmo della mano." },
  { icon: "fa-calendar-check", text: "Zero Interruzioni: I clienti prenotano online h24 in totale autonomia." },
  { icon: "fa-hotel",          text: "Hotel, B&B e strutture ricettive" },
  { icon: "fa-scissors",       text: "Agenda per parrucchieri e centri beauty" },
  { icon: "fa-boxes-stacked",  text: "Magazzino, prodotti e inventario" },
  { icon: "fa-cash-register",  text: "Stop ai No-Show: Fai pagare in anticipo o richiedi acconti automatici al momento della prenotazione." },
  { icon: "fa-users",          text: "Fidelity Digitale: Fai tornare i clienti più spesso con la raccolta punti su smartphone, senza tessere cartacee." },
  { icon: "fa-chart-pie",      text: "Report e notifiche automatiche" },
];

type Review = {
  id: string;
  nome: string;
  attivita: string;
  testo: string;
  stelle: string;
};

function StarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || Number(value);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Valutazione">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={Number(value) === n}
          aria-label={`${n} stelle`}
          className="star-btn text-2xl leading-none focus:outline-none"
          style={{ color: n <= active ? "#f59e0b" : "#d1d5db" }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(String(n))}
        >
          ★
        </button>
      ))}
      <span className="ml-1 text-xs text-gray-400 font-medium">
        {active === 5 ? "Eccellente" : active === 4 ? "Molto buona" : active === 3 ? "Buona" : active === 2 ? "Da migliorare" : "Sufficiente"}
      </span>
    </div>
  );
}

export default function Preventivo() {
  const [form, setForm] = useState({
    nome_attivita: "",
    email: "",
    whatsapp: "",
    settore: "",
    messaggio: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    nome: "",
    attivita: "",
    stelle: "5",
    testo: "",
  });
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    fetch(appPath("/api/recensioni"))
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { success?: boolean; data?: Review[] }) => {
        if (data.success) setReviews(data.data ?? []);
      })
      .catch(() => setReviewsError(true));
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || sent) return;
    if (
      !form.nome_attivita.trim() ||
      !form.whatsapp.trim() ||
      !form.settore ||
      !form.messaggio.trim()
    ) {
      setError("Compila tutti i campi per continuare.");
      return;
    }
    if (!privacy) { setError("Accetta l'informativa privacy per inviare la richiesta."); return; }
    if (!/^[+\d\s().-]{6,30}$/.test(form.whatsapp) || form.whatsapp.replace(/\D/g, "").length < 6) {
      setError("Inserisci un numero di telefono valido."); return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(appPath("/api/invia-contatto"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, servizio: "generale", pagina: window.location.pathname, attribution: getAttribution() }),
      });
      const data = await res.json() as { success?: boolean; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message ?? "Errore server");
      setSent(true);
      trackConversion("generale", "homepage");
    } catch {
      setError("Errore nell'invio. Puoi scriverci direttamente su WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  function handleReviewChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value });
    setReviewError("");
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reviewLoading || reviewSent) return;
    if (
      !reviewForm.nome.trim() ||
      !reviewForm.attivita.trim() ||
      !reviewForm.testo.trim() ||
      reviewForm.testo.trim().length < 10
    ) {
      setReviewError("Compila tutti i campi e scrivi almeno 10 caratteri.");
      return;
    }
    setReviewLoading(true);
    setReviewError("");
    try {
      const res = await fetch(appPath("/api/recensioni"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message ?? "Errore server");
      setReviewSent(true);
      setReviewForm({ nome: "", attivita: "", stelle: "5", testo: "" });
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Errore nell'invio della recensione."
      );
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen font-sans relative overflow-x-hidden"
      style={{
        background:
          "linear-gradient(145deg,#1e1b4b 0%,#2d2570 30%,#3b2f8a 60%,#1a2744 100%)",
      }}
    >
      {/* ── Decorative ambient orbs ── */}
      <div
        className="orb pointer-events-none fixed top-[-120px] right-[-100px] w-[420px] h-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb orb-2 pointer-events-none fixed bottom-[10%] left-[-80px] w-[320px] h-[320px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb orb-3 pointer-events-none fixed top-[50%] left-[55%] w-[260px] h-[260px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
        }}
      />

      {/* ── NAV ── */}
      <nav className="relative z-10 w-full px-5 pt-4 pb-2 flex justify-between items-center max-w-5xl mx-auto">
        <span className="text-[1.35rem] font-black tracking-tighter text-white select-none">
          Promo<span className="text-emerald-400">App</span>
          <span className="text-indigo-300">.it</span>
        </span>
        <a
          href={whatsappUrl()}
          onClick={() => trackWhatsApp("generale", "nav")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full font-bold text-sm transition shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/30"
          data-testid="link-nav-whatsapp"
        >
          <i className="fab fa-whatsapp text-base"></i>
          Richiedi Demo
        </a>
      </nav>

      {/* ── WhatsApp float ── */}
      <a
        href={whatsappUrl()}
        onClick={() => trackWhatsApp("generale", "floating")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contattaci su WhatsApp"
        title="Scrivici su WhatsApp"
        className="whatsapp-float fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-[10001] w-14 h-14 sm:w-16 sm:h-16 inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-xl shadow-green-950/30 transition hover:scale-110 active:scale-95"
        data-testid="link-floating-whatsapp"
      >
        <i className="fab fa-whatsapp text-2xl sm:text-3xl"></i>
      </a>

      {/* ══════════════════════════════════════════
          HERO + FORM
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-4 pt-2 pb-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1.1fr_0.9fr] gap-7 items-start">

          {/* LEFT copy */}
          <div className="text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 shimmer-badge border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full mb-3">
              <i className="fas fa-mobile-screen-button text-emerald-400"></i>
               Siti web · Web app · Menu digitali
            </div>

            {/* Headline */}
            <h1 className="text-[2.3rem] md:text-[2.8rem] font-black leading-[1.12] mb-4 tracking-tight">
              <span className="gradient-text">Più Clienti, Meno Stress:</span> L'App su misura per gestire la tua attività.
            </h1>
            <p className="text-indigo-200/80 text-base leading-relaxed mb-4 max-w-md">
              Dimentica il telefono che squilla mentre lavori. Ricevi prenotazioni h24, azzera i no-show e fidelizza i clienti con un'unica piattaforma facile da usare. Creata su misura per te.
            </p>

            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer"
              onClick={() => trackWhatsApp("generale", "hero")}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-full px-5 py-3 mb-4 min-h-12">
              <i className="fab fa-whatsapp text-lg" aria-hidden="true" /> Richiedi una Demo Gratuita su WhatsApp
            </a>
            <div className="grid gap-2 mb-4" id="servizi" aria-label="I servizi PromoApp">
              {SERVICES.map((service) => <Link key={service.path} href={service.path}
                className="glass-card rounded-2xl p-4 flex gap-3 items-start hover:bg-white/15 transition"
                data-testid={`service-${service.path.slice(1)}`}>
                <i className={`fas ${service.icon} text-emerald-300 mt-1 text-lg w-6`} aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <h2 className="font-bold text-sm max-w-[240px]">{service.title}</h2>
                    <span className="text-amber-300 font-bold text-sm whitespace-nowrap">{service.price}</span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-1">{service.desc}</p>
                  <span className="block text-emerald-300 font-semibold text-xs mt-2">{service.cta} →</span>
                </div>
              </Link>)}
              <p className="text-[10px] text-indigo-200/70">Prezzi di partenza + IVA. Extra, hosting e dominio definiti nel preventivo.</p>
            </div>

            <a
              href="#recensioni"
              className="ml-1 mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:border-emerald-300/50 hover:bg-white/15"
              data-testid="link-see-reviews"
            >
              <i className="fas fa-star text-amber-300"></i>
              Leggi le recensioni
              <i className="fas fa-arrow-down text-[10px] text-emerald-300"></i>
            </a>

          </div>

          {/* RIGHT form */}
          <div className="relative z-10 scroll-mt-5" id="preventivo">
            <HomeContactForm form={form} onChange={handleChange} onSubmit={handleSubmit}
              sent={sent} loading={loading} error={error} privacy={privacy} onPrivacyChange={setPrivacy} sectors={SETTORI} />
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bold text-white text-2xl mb-2">Tutto ciò che serve per automatizzare il tuo lavoro</h2>
          <p className="text-indigo-200 text-sm mb-5">Soluzioni su misura da integrare nella tua Web App per farti risparmiare tempo ogni giorno.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{FEATURES.map((item) => <div key={item.text} className="glass-card rounded-xl p-3 flex gap-3 items-center">
            <i className={`fas ${item.icon} text-emerald-300 w-5`} aria-hidden="true" /><p className="text-white text-xs font-semibold">{item.text}</p>
          </div>)}</div>
          <Link href="/web-app" className="inline-block mt-4 text-emerald-300 text-sm font-bold">Scopri le web app e i gestionali →</Link>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-10 w-full" aria-hidden="true">
        <div className="section-divider" />
      </div>

      {/* ══════════════════════════════════════════
          RECENSIONI
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-4 py-9" id="recensioni">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 shimmer-badge border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full mb-3">
              <i className="fas fa-shield-halved"></i>
              Esperienze reali
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              Recensioni <span className="gradient-text">verificate</span>
            </h2>
            <p className="text-indigo-200/70 text-sm max-w-sm mx-auto">
              Leggi le esperienze dei clienti e racconta anche la tua.
            </p>
          </div>

          <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-5 items-start">

            {/* Reviews list */}
            <div className="space-y-3">
              {reviews.length > 0 ? (
                 (showAllReviews ? reviews : reviews.slice(0, 3)).map((review, idx) => (
                  <article
                    key={review.id}
                    className="review-card glass-card rounded-2xl p-4 shadow-xl hover:bg-white/10 transition"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        {/* Avatar circle */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-inner"
                          style={{
                            background:
                              "linear-gradient(135deg,#6366f1,#8b5cf6)",
                          }}
                        >
                          {review.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-white text-sm leading-tight">{review.nome}</h3>
                          <p className="text-indigo-300 text-xs">{review.attivita}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black whitespace-nowrap px-2.5 py-1 rounded-full border border-emerald-400/25">
                        <i className="fas fa-circle-check text-[9px]"></i>
                        Verificata
                      </span>
                    </div>
                    <div className="text-yellow-400 text-base mb-2.5 tracking-wide" aria-label={`${review.stelle} stelle su 5`}>
                      {"★".repeat(Number(review.stelle))}
                      <span className="text-white/15">{"★".repeat(5 - Number(review.stelle))}</span>
                    </div>
                    <p className="text-indigo-100/80 text-sm leading-relaxed italic">"{review.testo}"</p>
                  </article>
                ))
              ) : (
                <div className="glass-card rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-comments text-2xl text-emerald-300"></i>
                  </div>
                  <p className="text-white font-bold text-sm mb-1">{reviewsError ? "Recensioni momentaneamente non disponibili." : "Caricamento recensioni verificate…"}</p>
                  <p className="text-indigo-300 text-xs">Lascia la tua esperienza: la pubblicheremo dopo la verifica.</p>
                </div>
              )}
              {reviews.length > 3 && <button type="button" onClick={() => setShowAllReviews(!showAllReviews)} aria-expanded={showAllReviews}
                className="rounded-full border border-white/30 px-5 py-3 text-white text-xs font-bold hover:bg-white/10">
                {showAllReviews ? "Mostra meno recensioni" : `Leggi tutte le ${reviews.length} recensioni`}
              </button>}
            </div>

            {/* Review form */}
            <details className="group bg-white rounded-2xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.3)]" data-testid="review-disclosure">
              <summary className="cursor-pointer flex items-center justify-between gap-3 text-sm font-bold text-indigo-700 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500" data-testid="button-write-review">
                <span><i className="fas fa-pen mr-2" aria-hidden="true" />Scrivi una recensione</span>
                <i className="fas fa-chevron-down text-xs transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-4">
              {reviewSent ? (
                <div className="text-center py-6" data-testid="message-review-sent">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                    <i className="fas fa-check text-white text-xl"></i>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Grazie per la recensione!</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    La leggeremo e, dopo la verifica, potrà apparire nella sezione pubblica.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3" data-testid="form-recensione">
                  <div className="pb-2 border-b border-gray-100">
                    <h3 className="text-base font-black text-gray-900">Lascia una recensione</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Ogni recensione viene verificata prima della pubblicazione.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Nome
                      </label>
                      <input
                        name="nome"
                        value={reviewForm.nome}
                        onChange={handleReviewChange}
                        placeholder="Il tuo nome"
                        aria-label="Il tuo nome"
                        required
                        className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
                        data-testid="input-review-nome"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Attività
                      </label>
                      <input
                        name="attivita"
                        value={reviewForm.attivita}
                        onChange={handleReviewChange}
                        placeholder="La tua attività"
                        aria-label="La tua attività"
                        required
                        className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
                        data-testid="input-review-attivita"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Valutazione
                    </label>
                    <StarPicker
                      value={reviewForm.stelle}
                      onChange={(v) => setReviewForm({ ...reviewForm, stelle: v })}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      La tua esperienza
                    </label>
                    <textarea
                      name="testo"
                      value={reviewForm.testo}
                      onChange={handleReviewChange}
                      placeholder="Racconta brevemente la tua esperienza..."
                      aria-label="La tua recensione"
                      required
                      rows={4}
                      className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm resize-none placeholder:text-gray-300"
                      data-testid="textarea-review-testo"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2" data-testid="text-review-error">
                      <i className="fas fa-exclamation-circle"></i> {reviewError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white py-3 rounded-xl font-black text-sm transition shadow-lg shadow-indigo-900/30 active:scale-[0.98]"
                    data-testid="button-submit-review"
                  >
                    {reviewLoading
                      ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio in corso...</>
                      : <><i className="fas fa-paper-plane mr-2"></i>Invia recensione</>}
                  </button>
                </form>
              )}
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Il modulo finale segue immediatamente le recensioni, senza sezioni intermedie. */}
      <section className="relative z-10 px-4 pt-2 pb-10" id="preventivo-finale" aria-label="Richiedi una consulenza gratuita">
        <div className="max-w-xl mx-auto">
          <HomeContactForm placement="final" form={form} onChange={handleChange} onSubmit={handleSubmit}
            sent={sent} loading={loading} error={error} privacy={privacy} onPrivacyChange={setPrivacy} sectors={SETTORI} />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 py-7 px-4 mt-2">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs text-indigo-300/60">
            © 2024 Promo<strong className="text-white/70">App</strong>.it · P.IVA 08223951008
          </span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-indigo-300/60">
            <a href={appPath("/dati-societari.html")} className="hover:text-white transition">Dati societari</a>
            <a href={appPath("/privacy.html")} className="hover:text-white transition">Privacy</a>
            <a href={appPath("/cookie.html")} className="hover:text-white transition">Cookie</a>
            <span>·</span>
            <button type="button" className="hover:text-white transition" onClick={() => window.dispatchEvent(new Event("promoapp-cookie-settings"))}>Preferenze cookie</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
