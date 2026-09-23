import { useEffect, useState } from "react";

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
  { icon: "fa-chart-line",     text: "Gestionale completo per la tua attività" },
  { icon: "fa-calendar-check", text: "Booking e prenotazioni online 24/7" },
  { icon: "fa-hotel",          text: "Hotel, B&B e strutture ricettive" },
  { icon: "fa-scissors",       text: "Agenda per parrucchieri e centri beauty" },
  { icon: "fa-boxes-stacked",  text: "Magazzino, prodotti e inventario" },
  { icon: "fa-cash-register",  text: "Vendite, pagamenti e cassa" },
  { icon: "fa-users",          text: "Clienti, fidelity e comunicazioni" },
  { icon: "fa-chart-pie",      text: "Report e notifiche automatiche" },
];

type Review = {
  id: string;
  nome: string;
  attivita: string;
  testo: string;
  stelle: string;
};

const EXAMPLE_REVIEWS: Review[] = [
  { id: "example-01", nome: "Luca", attivita: "Bar del Centro", testo: "L'app ci aiuta a gestire meglio prenotazioni e clienti durante tutta la giornata.", stelle: "3" },
  { id: "example-02", nome: "Serena", attivita: "Studio Armonia", testo: "Interfaccia chiara e tante funzioni utili, anche se stiamo ancora imparando a usarle tutte.", stelle: "3" },
  { id: "example-03", nome: "Davide", attivita: "Officina Rossi", testo: "La gestione degli appuntamenti è migliorata, ma vorremmo più personalizzazioni nel prossimo aggiornamento.", stelle: "3" },
  { id: "example-04", nome: "Martina", attivita: "Beauty Lab", testo: "Buon supporto e calendario pratico. Per il nostro team alcune schermate potrebbero essere più rapide.", stelle: "3" },
  { id: "example-05", nome: "Paolo", attivita: "Alimentari San Marco", testo: "Una soluzione utile per partire con il digitale, con qualche margine di miglioramento nelle notifiche.", stelle: "3" },
  { id: "example-06", nome: "Elena", attivita: "Masseria Verde", testo: "Abbiamo centralizzato richieste e prenotazioni in un solo posto. Molto comoda per il lavoro quotidiano.", stelle: "4" },
  { id: "example-07", nome: "Matteo", attivita: "Palestra Forma", testo: "I clienti prenotano più facilmente e noi perdiamo meno tempo al telefono. Servizio disponibile e attento.", stelle: "4" },
  { id: "example-08", nome: "Chiara", attivita: "Fioreria Magnolia", testo: "La grafica è ordinata e la gestione dei prodotti ci sta aiutando molto. Esperienza positiva.", stelle: "4" },
  { id: "example-09", nome: "Andrea", attivita: "B&B Il Glicine", testo: "Finalmente abbiamo un calendario condiviso per le camere. Semplice da aggiornare e consultare.", stelle: "4" },
  { id: "example-10", nome: "Federica", attivita: "Studio Dentistico Bianchi", testo: "La segreteria gestisce gli appuntamenti con più ordine. Buona assistenza anche dopo l'attivazione.", stelle: "4" },
  { id: "example-11", nome: "Giorgio", attivita: "Ristorante La Terrazza", testo: "Le richieste arrivano in modo più strutturato e il team riesce a lavorare meglio nei momenti pieni.", stelle: "4" },
  { id: "example-12", nome: "Valentina", attivita: "Atelier Vela", testo: "La fidelity card digitale è piaciuta subito alle nostre clienti. Soluzione elegante e funzionale.", stelle: "4" },
  { id: "example-13", nome: "Simone", attivita: "Car Service 2000", testo: "Abbiamo migliorato il flusso di lavoro e teniamo sotto controllo gli interventi con più facilità.", stelle: "4" },
  { id: "example-14", nome: "Laura", attivita: "Centro Yoga Respiro", testo: "Prenotazioni e comunicazioni sono molto più comode. Ci siamo trovati bene fin dal primo utilizzo.", stelle: "4" },
  { id: "example-15", nome: "Nicola", attivita: "Casa Vacanze Sole", testo: "Un unico strumento per richieste, calendario e contatti. Ci ha dato più ordine nella gestione.", stelle: "4" },
  { id: "example-16", nome: "Alessia", attivita: "Parrucchieri Moderni", testo: "Le clienti prenotano in autonomia e l'agenda è sempre aggiornata. Ci ha semplificato davvero la giornata.", stelle: "5" },
  { id: "example-17", nome: "Marco", attivita: "Pizzeria Vesuvio", testo: "Abbiamo tutto sotto controllo: ordini, clienti e comunicazioni. Il team è stato preciso e disponibile.", stelle: "5" },
  { id: "example-18", nome: "Ilaria", attivita: "Estetica Iris", testo: "Un'app curata, veloce e perfetta per il nostro centro. Le prenotazioni online sono aumentate.", stelle: "5" },
  { id: "example-19", nome: "Roberto", attivita: "Hotel Aurora", testo: "La gestione delle richieste è diventata molto più professionale. Ottima soluzione per la nostra struttura.", stelle: "5" },
  { id: "example-20", nome: "Francesca", attivita: "Boutique Fiore", testo: "La fidelity card e le comunicazioni ci aiutano a restare vicini alle clienti. Siamo molto soddisfatti.", stelle: "5" },
  { id: "example-21", nome: "Stefano", attivita: "Clinica Veterinaria Amici", testo: "Agenda, promemoria e contatti finalmente sono organizzati. Un grande aiuto per tutto lo staff.", stelle: "5" },
  { id: "example-22", nome: "Marta", attivita: "Pasticceria Dolcezza", testo: "L'esperienza è stata semplice dall'inizio alla fine. La nostra app è bella e pratica da usare.", stelle: "5" },
  { id: "example-23", nome: "Antonio", attivita: "Immobiliare CasaPro", testo: "Richieste e appuntamenti sono molto più facili da seguire. Un investimento utile per la nostra attività.", stelle: "5" },
  { id: "example-24", nome: "Silvia", attivita: "Pilates Studio", testo: "I clienti trovano subito gli orari disponibili e noi lavoriamo con un'agenda molto più ordinata.", stelle: "5" },
  { id: "example-25", nome: "Enrico", attivita: "Macelleria Buona Terra", testo: "La gestione clienti è diventata più semplice e le comunicazioni sono finalmente puntuali.", stelle: "5" },
  { id: "example-26", nome: "Beatrice", attivita: "Wedding Planner Alba", testo: "Tutto più professionale: richieste, scadenze e contatti sono raccolti in un unico spazio.", stelle: "5" },
  { id: "example-27", nome: "Fabio", attivita: "Lavanderia Express", testo: "Una soluzione concreta che ci fa risparmiare tempo ogni giorno. Assistenza sempre presente.", stelle: "5" },
  { id: "example-28", nome: "Giulia", attivita: "Farmacia San Luca", testo: "Chiara, veloce e personalizzata sulle nostre esigenze. I clienti la usano senza difficoltà.", stelle: "5" },
  { id: "example-29", nome: "Tommaso", attivita: "Rifugio delle Colline", testo: "Il calendario condiviso ci ha risolto diversi problemi organizzativi. Siamo molto contenti del risultato.", stelle: "5" },
  { id: "example-30", nome: "Elisa", attivita: "Nails & Co.", testo: "Le prenotazioni sono più ordinate e il rapporto con le clienti è migliorato. App davvero ben fatta.", stelle: "5" },
];

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
    fetch("/api/recensioni")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { success?: boolean; data?: Review[] }) => {
        if (data.success) setReviews(data.data ?? []);
      })
      .catch(() => {});
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.nome_attivita.trim() ||
      !form.email.trim() ||
      !form.whatsapp.trim() ||
      !form.settore ||
      !form.messaggio.trim()
    ) {
      setError("Compila tutti i campi per continuare.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invia-contatto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Errore server");
      setSent(true);
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
      const res = await fetch("/api/recensioni", {
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

  const showingExamples = reviews.length === 0;
  const displayReviews = showingExamples ? EXAMPLE_REVIEWS : reviews;

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
          href="https://wa.me/393793602035"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full font-bold text-sm transition shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/30"
          data-testid="link-nav-whatsapp"
        >
          <i className="fab fa-whatsapp text-base"></i>
          WhatsApp
        </a>
      </nav>

      {/* ── WhatsApp float ── */}
      <a
        href="https://wa.me/393793602035?text=Ciao!%20Vorrei%20informazioni%20sulle%20web%20app."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contattaci su WhatsApp"
        title="Scrivici su WhatsApp"
        className="whatsapp-float fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-50 w-14 h-14 sm:w-16 sm:h-16 inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-xl shadow-green-950/30 transition hover:scale-110 active:scale-95"
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
              Web app su misura · tutti i sistemi operativi
            </div>

            {/* Headline */}
            <h1 className="text-[2.6rem] md:text-[3.2rem] font-black leading-[1.06] mb-3 tracking-tight">
              La tua attività<br />
              <span className="gradient-text">in un'App.</span>
            </h1>
            <p className="text-indigo-200/80 text-base leading-relaxed mb-4 max-w-md">
              Creiamo web app personalizzate per attività italiane, utilizzabili
              su Android, iOS e tutti i sistemi operativi — con prenotazioni,
              fidelity card, pagamenti e notifiche.
            </p>

            {/* Prezzo in evidenza */}
            <div
              className="relative overflow-hidden inline-flex items-center gap-3 rounded-2xl border border-amber-300/35 bg-gradient-to-r from-amber-300/20 via-orange-300/15 to-amber-300/5 px-4 py-3.5 mb-3 shadow-lg shadow-amber-950/15"
              aria-label="Prezzo a partire da 399 euro più IVA"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-indigo-950 shadow-md shadow-amber-950/20">
                <i className="fas fa-tag text-base"></i>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                  Prezzo di partenza
                </p>
                <p className="mt-0.5 text-2xl font-black leading-none text-white">
                  A partire da <span className="text-amber-300">399€</span>
                  <span className="ml-1 text-sm font-bold text-amber-100">+ IVA</span>
                </p>
              </div>
              <span className="absolute -right-3 -top-5 h-14 w-14 rounded-full bg-amber-300/10" />
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

            {/* Feature list */}
            <div className="grid grid-cols-1 gap-1.5">
              {FEATURES.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 glass-card rounded-xl px-3.5 py-2 hover:bg-white/10 transition"
                >
                  <span className="feature-icon w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <i className={`fas ${item.icon} text-emerald-300 text-sm`}></i>
                  </span>
                  <span className="text-white/90 font-semibold text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT form */}
          <div className="relative z-10">
            {sent ? (
              <div
                className="bg-white rounded-3xl p-8 text-center shadow-2xl"
                data-testid="message-sent"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                  <i className="fas fa-check text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Richiesta inviata!</h3>
                <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                  Ti contatteremo entro 24 ore con il progetto completo.
                </p>
                <a
                  href="https://wa.me/393793602035"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-md"
                  data-testid="link-whatsapp-thanks"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                  Scrivici su WhatsApp
                </a>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-6 shadow-[0_32px_80px_rgba(0,0,0,0.35)] space-y-3.5"
                data-testid="form-preventivo"
              >
                {/* Form header */}
                <div className="pb-1 border-b border-gray-100">
                  <h2 className="text-lg font-black text-gray-900">Richiedi il tuo progetto</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Ti rispondiamo entro 24 ore.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="nome_attivita">
                    Nome attività <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nome_attivita" name="nome_attivita" type="text" required
                    value={form.nome_attivita} onChange={handleChange}
                    placeholder="Es. Parrucchiere Mario Rossi"
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
                    data-testid="input-nome-attivita"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="settore">
                    Tipo di attività <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="settore" name="settore" required
                    value={form.settore} onChange={handleChange}
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm"
                    data-testid="select-settore"
                  >
                    <option value="">Seleziona...</option>
                    {SETTORI.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email" name="email" type="email" required
                      value={form.email} onChange={handleChange}
                      placeholder="nome@email.it"
                      className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="whatsapp">
                      WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="whatsapp" name="whatsapp" type="tel" required
                      value={form.whatsapp} onChange={handleChange}
                      placeholder="+39 340..."
                      className="w-full border-2 border-gray-100 focus:border-emerald-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
                      data-testid="input-whatsapp"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="messaggio">
                    Cosa ti serve? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="messaggio" name="messaggio" required rows={3}
                    value={form.messaggio} onChange={handleChange}
                    placeholder="Descrivi brevemente la tua attività e cosa vorresti dall'App..."
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm resize-none placeholder:text-gray-300"
                    data-testid="textarea-messaggio"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2" data-testid="text-error">
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-black text-sm tracking-wide transition shadow-lg shadow-indigo-900/40 hover:shadow-indigo-500/30 active:scale-[0.98]"
                  data-testid="button-submit"
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio in corso...</>
                    : <><i className="fas fa-paper-plane mr-2"></i>Invia la richiesta</>}
                </button>

                <div className="text-center pt-0.5">
                  <a
                    href="https://wa.me/393793602035?text=Ciao!%20Vorrei%20un%20preventivo%20per%20la%20mia%20App."
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm font-bold transition"
                    data-testid="link-whatsapp-alt"
                  >
                    <i className="fab fa-whatsapp text-base"></i>
                    Oppure scrivici su WhatsApp
                  </a>
                </div>
              </form>
            )}
          </div>
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
              <i className={`fas ${showingExamples ? "fa-lightbulb" : "fa-shield-halved"}`}></i>
              {showingExamples ? "Esempi di feedback" : "Esperienze reali"}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              Recensioni <span className="gradient-text">{showingExamples ? "di esempio" : "verificate"}</span>
            </h2>
            <p className="text-indigo-200/70 text-sm max-w-sm mx-auto">
              {showingExamples
                ? "Testi dimostrativi per mostrarti come apparirà la sezione."
                : "Leggi le esperienze dei clienti e racconta anche la tua."}
            </p>
          </div>

          <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-5 items-start">

            {/* Reviews list */}
            <div className="space-y-3">
              {displayReviews.length > 0 ? (
                displayReviews.map((review, idx) => (
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
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black whitespace-nowrap px-2.5 py-1 rounded-full border ${
                          showingExamples
                            ? "bg-amber-400/15 text-amber-200 border-amber-300/25"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-400/25"
                        }`}
                      >
                        <i className={`fas ${showingExamples ? "fa-circle-info" : "fa-circle-check"} text-[9px]`}></i>
                        {showingExamples ? "Esempio" : "Verificata"}
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
                  <p className="text-white font-bold text-sm mb-1">Le prime recensioni verificate arriveranno qui.</p>
                  <p className="text-indigo-300 text-xs">Lascia la tua esperienza: la pubblicheremo dopo la verifica.</p>
                </div>
              )}
            </div>

            {/* Review form */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
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
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 py-7 px-4 mt-2">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs text-indigo-300/60">
            © 2024 Promo<strong className="text-white/70">App</strong>.it — Sophia 2005 S.r.l. · P.IVA 08223951008
          </span>
          <div className="flex gap-5 text-xs text-indigo-300/60">
            <a href="/privacy.html" className="hover:text-white transition">Privacy</a>
            <a href="/cookie.html" className="hover:text-white transition">Cookie</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
