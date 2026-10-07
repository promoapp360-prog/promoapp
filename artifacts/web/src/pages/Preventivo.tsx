import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { appPath, getAttribution, readConsent, whatsappUrl } from "../lib/marketing";
import { trackConversion, trackWhatsApp, trackEvent } from "../lib/analytics";
import { rememberLead } from "../lib/lead-receipt";
import { commercialVariant, sectors, prices } from "../lib/commercial";
import type { ContactResponse } from "@workspace/api-client-react";
import { useMobileFormVisibility } from "../lib/useMobileFormVisibility";
import HomeContactForm from "../components/marketing/HomeContactForm";
import "../styles/commercial.css";

const SERVICES = [
  { path: "/siti-web", icon: "fa-globe", title: "Siti web professionali", price: prices.website.label, desc: "Presenta la tua attività e fatti contattare.", cta: "Scopri i siti web" },
  { path: "/web-app", icon: "fa-laptop-code", title: "Web app e gestionali personalizzati", price: prices.webapp.label, desc: "Strumenti su misura per il tuo lavoro.", cta: "Scopri le web app" },
  { path: "/menu-digitali", icon: "fa-qrcode", title: "Menu digitali per ristoranti", price: prices.menu.label, desc: "Il tuo menu su smartphone, con QR code.", cta: "Scopri i menu digitali" },
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
  "B&B / Hotel",
];

const FEATURES = [
  { icon: "fa-chart-line",     text: "Gestione Completa: Tutto il tuo business sotto controllo, dal palmo della mano." },
  { icon: "fa-calendar-check", text: "Richieste online: organizza appuntamenti e disponibilità con le funzioni concordate." },
  { icon: "fa-hotel",          text: "Hotel, B&B e strutture ricettive" },
  { icon: "fa-scissors",       text: "Agenda per parrucchieri e centri beauty" },
  { icon: "fa-boxes-stacked",  text: "Magazzino, prodotti e inventario" },
  { icon: "fa-cash-register",  text: "Pagamenti e acconti: strumenti e integrazioni da definire nel preventivo." },
  { icon: "fa-users",          text: "Fidelity digitale: programmi e promozioni adatti ai tuoi clienti, anche da smartphone." },
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
  useMobileFormVisibility();
  const [, navigate] = useLocation();
  const variant = commercialVariant();
  const [form, setForm] = useState({
    nome_attivita: "",
    email: "",
    whatsapp: "",
    settore: "",
    messaggio: "",
    website: "",
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
      !form.settore
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
        body: JSON.stringify({ ...form, privacy, servizio: "general", slug: "generale",
          variant: variant.key, pagina: window.location.pathname, attribution: getAttribution(),
          marketingConsent: readConsent().marketing, analyticsConsent: readConsent().analytics }),
      });
      const data = await res.json() as ContactResponse;
      if (!res.ok || !data.success) throw new Error(data.message ?? "Errore server");
      setSent(true);
      rememberLead(data, "generale");
      if (!data.duplicate) trackConversion("generale", "homepage", data.leadId);
      navigate("/grazie");
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
          href="#preventivo"
          onClick={() => trackEvent("cta_click", "generale", "nav")}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full font-bold text-sm transition shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/30"
          data-testid="link-nav-proposta"
        >
          <i className="fas fa-paper-plane text-base" aria-hidden="true"></i>
          Richiedi proposta
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
              <span className="gradient-text">{variant.headline}</span>
            </h1>
            <p className="text-indigo-200/80 text-base leading-relaxed mb-4 max-w-md">
              Realizziamo siti web, menu digitali, app e gestionali per aiutarti a presentare la tua attività, organizzare il lavoro e gestire meglio i clienti.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4" aria-label="Prezzi dei servizi">
              <Link href="/siti-web" className="rounded-xl border border-white/20 bg-white/10 p-2 text-center"><span className="block text-xs text-indigo-100">Siti web</span><strong className="block text-amber-300 text-sm">Da 399 €</strong><span className="block text-[10px]">+ IVA</span></Link>
              <Link href="/menu-digitali" className="rounded-xl border border-white/20 bg-white/10 p-2 text-center"><span className="block text-xs text-indigo-100">Menu QR</span><strong className="block text-amber-300 text-sm">99 €</strong><span className="block text-[10px]">+ IVA · una tantum</span></Link>
              <Link href="/web-app" className="rounded-xl border border-white/20 bg-white/10 p-2 text-center"><span className="block text-xs text-indigo-100">App e gestionali</span><strong className="block text-amber-300 text-sm">Su preventivo</strong></Link>
            </div>

            <a href="#preventivo"
              onClick={() => trackEvent("cta_click", "generale", "hero")}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-full px-5 py-3 mb-4 min-h-12">
              {variant.cta}
            </a>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp("generale", "hero")}
              className="inline-flex items-center gap-2 text-emerald-300 font-bold text-sm mb-4">
              <i className="fab fa-whatsapp" aria-hidden="true" /> {variant.whatsappLabel}
            </a>
            {reviews.length > 0 && <a
              href="#recensioni"
              className="ml-1 mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:border-emerald-300/50 hover:bg-white/15"
              data-testid="link-see-reviews"
            >
              <i className="fas fa-star text-amber-300"></i>
              Leggi le recensioni
              <i className="fas fa-arrow-down text-[10px] text-emerald-300"></i>
            </a>}

          </div>

          {/* RIGHT form */}
          {variant.formPosition === "hero" && <div className="relative z-10 scroll-mt-5" id="preventivo">
            <HomeContactForm form={form} onChange={handleChange} onSubmit={handleSubmit}
              sent={sent} loading={loading} error={error} privacy={privacy} onPrivacyChange={setPrivacy} sectors={SETTORI} />
          </div>}
        </div>
      </section>

      <section className="relative z-10 px-4 py-8" id="servizi">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bold text-white text-2xl mb-5">Scegli da dove iniziare</h2>
          <div className={`grid sm:grid-cols-3 gap-3${variant.pricePresentation === "compact" ? " price-compact" : ""}`}>
            {SERVICES.map((service) => <Link key={service.path} href={service.path}
              className="glass-card rounded-2xl p-4 flex gap-3 items-start hover:bg-white/15 transition" data-testid={`service-${service.path.slice(1)}`}>
              <i className={`fas ${service.icon} text-emerald-300 mt-1 text-lg w-6`} aria-hidden="true" />
              <div><h3 className="text-white font-bold text-sm">{service.title}</h3><p className="text-amber-300 font-bold text-sm mt-2">{service.price}</p>
                <p className="text-xs text-indigo-200 mt-2">{service.desc}</p><span className="block text-emerald-300 font-semibold text-xs mt-3">{service.cta} →</span></div>
            </Link>)}
          </div>
          <p className="text-[10px] text-indigo-200/70 mt-4">{prices.note}</p>
          {variant.formPosition === "after-services" && <div className="max-w-xl mx-auto mt-8 scroll-mt-5" id="preventivo">
            <HomeContactForm form={form} onChange={handleChange} onSubmit={handleSubmit} sent={sent} loading={loading} error={error}
              privacy={privacy} onPrivacyChange={setPrivacy} sectors={SETTORI} />
          </div>}
        </div>
      </section>

      <section className="relative z-10 px-4 py-8" aria-label="Soluzioni per attività">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bold text-white text-2xl mb-2">Una soluzione adatta alla tua attività</h2>
          <p className="text-indigo-200 text-sm mb-5">Scopri esempi e possibilità per il tuo settore, senza dover conoscere la tecnologia.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(sectors).map(([slug, sector]) => <Link key={slug} href={`/per/${slug}`}
              className="glass-card rounded-xl p-4 text-white font-bold text-sm hover:bg-white/15">{sector.name} <span aria-hidden="true">→</span></Link>)}
          </div>
        </div>
      </section>
      <section className="relative z-10 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bold text-white text-2xl mb-2">Strumenti pratici per organizzare il tuo lavoro</h2>
          <p className="text-indigo-200 text-sm mb-5">Scegliamo insieme le funzioni utili alla tua attività, senza includere automaticamente ciò che non serve.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{FEATURES.map((item) => <div key={item.text} className="glass-card rounded-xl p-3 flex gap-3 items-center">
            <i className={`fas ${item.icon} text-emerald-300 w-5`} aria-hidden="true" /><p className="text-white text-xs font-semibold">{item.text}</p>
          </div>)}</div>
          <Link href="/web-app" className="inline-block mt-4 text-emerald-300 text-sm font-bold">Scopri le web app e i gestionali →</Link>
        </div>
      </section>

      <section className="relative z-10 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bold text-white text-2xl mb-5">Come funziona PromoApp</h2>
          <ol className="grid sm:grid-cols-3 gap-3">
            {[["Ci racconti la tua attività", "Partiamo dalle tue esigenze e dagli strumenti che usi già."],
              ["Ricevi una proposta chiara", "Proposta iniziale gratuita e senza impegno; funzioni, costi e tempi concordati."],
              ["Realizziamo il tuo progetto", "Parli direttamente con chi realizza la soluzione e definisci avvio e assistenza."]].map(([title, text], index) =>
              <li key={title} className="glass-card rounded-2xl p-5"><p className="text-emerald-300 font-black mb-2">{index + 1}. {title}</p><p className="text-indigo-200 text-sm">{text}</p></li>)}
          </ol>
          <p className="text-indigo-200 text-sm mt-4">{prices.note}</p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-10 w-full" aria-hidden="true">
        <div className="section-divider" />
      </div>

      {/* ══════════════════════════════════════════
          RECENSIONI
      ══════════════════════════════════════════ */}
      {reviews.length > 0 && <section className="relative z-10 px-4 py-9" id="recensioni">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className={reviews.length ? "text-center mb-6" : "hidden"}>
            <div className="inline-flex items-center gap-2 shimmer-badge border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full mb-3">
              <i className="fas fa-shield-halved"></i>
              Opinioni dei clienti
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              Recensioni <span className="gradient-text">approvate</span>
            </h2>
            <p className="text-indigo-200/70 text-sm max-w-sm mx-auto">
              Leggi le esperienze dei clienti e racconta anche la tua.
            </p>
          </div>

          <div className={reviews.length ? "grid md:grid-cols-[1.15fr_0.85fr] gap-5 items-start" : "grid gap-5 items-start"}>

            {/* Reviews list */}
            <div className={reviews.length ? "space-y-3" : "hidden"}>
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
                        Approvata
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
                  <p className="text-white font-bold text-sm mb-1">{reviewsError ? "Recensioni momentaneamente non disponibili." : "Caricamento recensioni…"}</p>
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
                    <p className="text-[11px] text-gray-400 mt-0.5">Le recensioni sono sottoposte ad approvazione prima della pubblicazione.</p>
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
      </section>}

      <section className="relative z-10 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bold text-white text-2xl mb-5">Prima di iniziare</h2>
          <div className="space-y-3">
            {[["Non so quale soluzione scegliere: posso contattarvi?", "Sì. Partiamo dalle tue attività quotidiane e ti aiutiamo a capire cosa serve, senza richiederti competenze tecniche."],
              ["Il sito da 399 € comprende un gestionale?", "No. Il sito professionale parte da 399 € + IVA. Prenotazioni, gestionali, pagamenti e altre integrazioni sono su preventivo."],
              ["Devo impegnarmi per ricevere la proposta?", "No. La proposta iniziale è gratuita e senza impegno. Costi, funzioni e tempi vengono concordati prima di iniziare."]].map(([question, answer]) =>
              <details key={question} className="glass-card rounded-xl p-4"><summary className="text-white text-sm font-bold cursor-pointer">{question}</summary><p className="text-indigo-200 text-sm mt-3">{answer}</p></details>)}
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-white text-2xl font-bold mb-3">Scopri cosa possiamo realizzare per la tua attività</h2>
            <a href="#preventivo" className="inline-flex bg-emerald-500 text-white px-6 py-3 rounded-full font-bold" onClick={() => trackEvent("cta_click", "generale", "final")}>{variant.cta}</a>
          </div>
        </div>
      </section>
      <a className="sector-sticky" href="#preventivo" onClick={() => trackEvent("cta_click", "generale", "mobile-sticky")}>{variant.cta}</a>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 py-7 px-4 mt-2">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs text-indigo-300/60">
            © {new Date().getFullYear()} Promo<strong className="text-white/70">App</strong>.it · P.IVA 08223951008
          </span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-indigo-300/60">
            <a href={appPath("/dati-societari.html")} className="hover:text-white transition">Dati societari</a>
            <a href={appPath("/privacy.html")} className="hover:text-white transition">Privacy</a>
            <a href={appPath("/cookie.html")} className="hover:text-white transition">Cookie</a>
            <Link href="/admin" className="hover:text-white transition">Admin</Link>
            <span>·</span>
            <button type="button" className="hover:text-white transition" onClick={() => window.dispatchEvent(new Event("promoapp-cookie-settings"))}>Preferenze cookie</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
