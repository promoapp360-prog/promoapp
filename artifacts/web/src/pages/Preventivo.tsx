import { useState } from "react";

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
  "Altro (descrivo nel messaggio)",
];

const FUNZIONALITA = [
  { icon: "fa-calendar-check", color: "text-indigo-600", bg: "bg-indigo-50", label: "Prenotazioni online", desc: "I tuoi clienti prenotano direttamente dall'app, 24/7." },
  { icon: "fa-star", color: "text-yellow-600", bg: "bg-yellow-50", label: "Fidelity card digitale", desc: "Punti, premi e promozioni per fidelizzare i clienti." },
  { icon: "fa-credit-card", color: "text-emerald-600", bg: "bg-emerald-50", label: "Pagamenti online", desc: "Incassi sicuri direttamente dall'app." },
  { icon: "fa-bell", color: "text-orange-600", bg: "bg-orange-50", label: "Notifiche automatiche", desc: "Promemoria, offerte e aggiornamenti ai tuoi clienti." },
  { icon: "fa-address-book", color: "text-blue-600", bg: "bg-blue-50", label: "CRM clienti", desc: "Storico completo di ogni cliente in un unico posto." },
  { icon: "fa-chart-bar", color: "text-violet-600", bg: "bg-violet-50", label: "Statistiche e report", desc: "Capisci cosa funziona e cosa puoi migliorare." },
  { icon: "fa-boxes-stacked", color: "text-rose-600", bg: "bg-rose-50", label: "Gestione magazzino", desc: "Prodotti, giacenze e ordini sempre sotto controllo." },
  { icon: "fa-mobile-screen-button", color: "text-cyan-600", bg: "bg-cyan-50", label: "App iOS e Android", desc: "Disponibile su tutti i dispositivi, subito pronta." },
];

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_attivita.trim() || !form.email.trim() || !form.whatsapp.trim() || !form.settore || !form.messaggio.trim()) {
      setError("Compila tutti i campi obbligatori.");
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
      setError("Errore nell'invio. Puoi anche scriverci su WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-black tracking-tighter">
            Promo<span className="text-emerald-500">App</span>
            <span className="text-gray-400">.it</span>
          </a>
          <a
            href="#form"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-bold text-sm transition shadow"
            data-testid="link-nav-cta"
          >
            Richiedi gratis
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-violet-400 blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <i className="fas fa-bolt text-yellow-300 mr-1"></i> Pronta in 7 giorni · Preventivo gratuito
          </span>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-5">
            La tua attività merita<br />
            <span className="text-yellow-300">un'App professionale.</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            Realizziamo app e gestionali <strong className="text-white font-bold">su misura</strong> per qualsiasi attività italiana —
            dal medico al ristorante, dal negozio alla palestra.
            Tu ci racconti la tua idea, noi la realizziamo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <a
              href="#form"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition"
              data-testid="button-hero-cta"
            >
              <i className="fas fa-lightbulb text-yellow-300"></i>
              Raccontaci la tua idea — è gratis
              <i className="fas fa-arrow-right"></i>
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-indigo-200 text-sm">
            <span><i className="fas fa-check-circle text-emerald-400 mr-1.5"></i>Preventivo gratuito</span>
            <span><i className="fas fa-check-circle text-emerald-400 mr-1.5"></i>Pronta in 7 giorni</span>
            <span><i className="fas fa-check-circle text-emerald-400 mr-1.5"></i>Senza anticipo</span>
            <span><i className="fas fa-check-circle text-emerald-400 mr-1.5"></i>Assistenza dedicata</span>
          </div>
        </div>
      </section>

      {/* Cosa realizziamo */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Cosa realizziamo</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Tutto in <span className="text-indigo-600">un'unica App.</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-lg font-light">
              Ogni App che costruiamo può includere le funzionalità di cui la tua attività ha davvero bisogno.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FUNZIONALITA.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition flex flex-col gap-3"
                data-testid={`card-feature-${i}`}
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                  <i className={`fas ${f.icon} ${f.color} text-lg`}></i>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm mb-1">{f.label}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Settori */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Per chi lavoriamo</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Funziona per <span className="text-emerald-600">ogni tipo di attività.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: "fa-stethoscope", color: "text-indigo-600", bg: "bg-indigo-50", label: "Studi Medici & Dentisti" },
              { icon: "fa-spa", color: "text-pink-600", bg: "bg-pink-50", label: "Centri Estetici & SPA" },
              { icon: "fa-scissors", color: "text-orange-600", bg: "bg-orange-50", label: "Parrucchieri & Barber" },
              { icon: "fa-store", color: "text-emerald-600", bg: "bg-emerald-50", label: "Negozi & Retail" },
              { icon: "fa-utensils", color: "text-red-600", bg: "bg-red-50", label: "Ristoranti & Bar" },
              { icon: "fa-dumbbell", color: "text-violet-600", bg: "bg-violet-50", label: "Palestre & Fitness" },
              { icon: "fa-car-wrench", color: "text-gray-700", bg: "bg-gray-100", label: "Autorimesse & Meccanici" },
              { icon: "fa-building", color: "text-teal-600", bg: "bg-teal-50", label: "Agenzie Immobiliari" },
              { icon: "fa-scale-balanced", color: "text-rose-600", bg: "bg-rose-50", label: "Studi Legali & Notarili" },
              { icon: "fa-briefcase", color: "text-blue-600", bg: "bg-blue-50", label: "Centri Servizi & Agenzie" },
              { icon: "fa-handshake", color: "text-yellow-600", bg: "bg-yellow-50", label: "Agenti di Commercio" },
              { icon: "fa-lightbulb", color: "text-cyan-600", bg: "bg-cyan-50", label: "Qualsiasi altra attività" },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${s.bg} border-transparent hover:border-gray-200 transition`}>
                <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <i className={`fas ${s.icon} ${s.color} text-sm`}></i>
                </div>
                <span className="font-semibold text-gray-800 text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Il processo</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Semplice in 3 passi.</h2>
            <p className="text-gray-500 mt-2 font-light">Dal tuo racconto all'App pronta — senza rischi.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "1", color: "bg-indigo-600", border: "border-indigo-100", bg: "bg-indigo-50",
                icon: "fa-comments", iconColor: "text-indigo-500",
                title: "Raccontaci la tua idea",
                desc: "Compila il modulo qui sotto o scrivici su WhatsApp. Ci spieghi cosa fa la tua attività e cosa vorresti dall'App.",
                badge: "5 minuti", badgeColor: "text-indigo-600 bg-white border-indigo-200",
              },
              {
                n: "2", color: "bg-emerald-600", border: "border-emerald-100", bg: "bg-emerald-50",
                icon: "fa-file-pdf", iconColor: "text-emerald-500",
                title: "Ti prepariamo il progetto",
                desc: "Ricevi un PDF dettagliato con tutte le funzioni e una dashboard di anteprima già navigabile. Gratis.",
                badge: "Gratis e senza impegno", badgeColor: "text-emerald-700 bg-white border-emerald-200",
              },
              {
                n: "3", color: "bg-orange-500", border: "border-orange-100", bg: "bg-orange-50",
                icon: "fa-rocket", iconColor: "text-orange-500",
                title: "Accetti, paghi, parti",
                desc: "Hai 7 giorni per decidere. Dopo il pagamento la tua App è operativa in 7 giorni.",
                badge: "7 giorni per decidere", badgeColor: "text-orange-700 bg-white border-orange-200",
              },
            ].map((step, i) => (
              <div key={i} className={`${step.bg} border ${step.border} rounded-2xl p-6 flex flex-col`} data-testid={`card-step-${i}`}>
                <div className={`w-12 h-12 ${step.color} text-white rounded-full flex items-center justify-center font-black text-xl shadow-md mb-4`}>
                  {step.n}
                </div>
                <i className={`fas ${step.icon} ${step.iconColor} text-2xl mb-3`}></i>
                <h3 className="font-black text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm flex-grow leading-relaxed">{step.desc}</p>
                <div className={`mt-4 self-start text-xs font-bold px-3 py-1 rounded-full border ${step.badgeColor}`}>
                  {step.badge}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 italic mt-8 text-sm">
            Nessun anticipo. Nessun rischio. Paghi solo quando il progetto ti convince davvero.
          </p>
        </div>
      </section>

      {/* Form */}
      <section id="form" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Preventivo gratuito
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Raccontaci la tua idea.
            </h2>
            <p className="text-gray-500 font-light">
              Compila il form — ti ricontattiamo entro 24 ore con il progetto PDF gratuito.
            </p>
          </div>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-10 text-center" data-testid="message-sent">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                <i className="fas fa-check text-white text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black text-emerald-700 mb-2">Richiesta inviata!</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto font-light leading-relaxed">
                Grazie! Ti contatteremo entro 24 ore con il tuo progetto PDF gratuito e la dashboard di anteprima.
              </p>
              <a
                href="https://wa.me/393793602035"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition"
                data-testid="link-whatsapp-thanks"
              >
                <i className="fab fa-whatsapp text-xl"></i>
                Scrivici anche su WhatsApp
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-gray-50 border border-gray-200 rounded-3xl p-8 space-y-5 shadow-sm"
              data-testid="form-preventivo"
            >
              {/* Nome attività */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="nome_attivita">
                  Nome della tua attività <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome_attivita"
                  name="nome_attivita"
                  type="text"
                  required
                  value={form.nome_attivita}
                  onChange={handleChange}
                  placeholder="Es. Parrucchiere Mario Rossi"
                  className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-gray-900 outline-none transition bg-white"
                  data-testid="input-nome-attivita"
                />
              </div>

              {/* Tipo di attività */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="settore">
                  Tipo di attività <span className="text-red-500">*</span>
                </label>
                <select
                  id="settore"
                  name="settore"
                  required
                  value={form.settore}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-gray-900 outline-none transition bg-white appearance-none"
                  data-testid="select-settore"
                >
                  <option value="">Seleziona il tuo settore...</option>
                  {SETTORI.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="la-tua@email.it"
                  className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-gray-900 outline-none transition bg-white"
                  data-testid="input-email"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="whatsapp">
                  Numero WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-sm flex items-center gap-1">
                    <i className="fab fa-whatsapp text-lg"></i>
                  </span>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={handleChange}
                    placeholder="+39 340 000 0000"
                    className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl pl-12 pr-4 py-3 text-gray-900 outline-none transition bg-white"
                    data-testid="input-whatsapp"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Ti contatteremo anche qui per risponderti più velocemente.</p>
              </div>

              {/* Messaggio */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="messaggio">
                  Cosa vorresti dalla tua App? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="messaggio"
                  name="messaggio"
                  required
                  rows={5}
                  value={form.messaggio}
                  onChange={handleChange}
                  placeholder="Descrivi liberamente la tua attività e quello che ti serve. Anche una sola riga va benissimo — ci pensiamo noi al resto!"
                  className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-gray-900 outline-none transition bg-white resize-none"
                  data-testid="textarea-messaggio"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium flex items-center gap-1.5" data-testid="text-error">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg transition shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-100"
                data-testid="button-submit"
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Invio in corso...</>
                ) : (
                  <><i className="fas fa-paper-plane mr-2"></i>Invia la richiesta — è gratuita</>
                )}
              </button>

              <p className="text-center text-gray-400 text-xs">
                Nessun anticipo. Nessun vincolo. Ricevi il progetto PDF gratis e decidi con calma.
              </p>
            </form>
          )}

          {/* WhatsApp alternativa */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm mb-3">Preferisci scrivere direttamente?</p>
            <a
              href="https://wa.me/393793602035?text=Ciao!%20Vorrei%20un%20preventivo%20per%20la%20mia%20App."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-green-500 text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-bold transition"
              data-testid="link-whatsapp-alt"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Scrivici su WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer minimale */}
      <footer className="py-8 px-4 border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="font-bold text-gray-600">
            Promo<span className="text-emerald-500">App</span>.it — Sophia 2005 S.r.l. · P.IVA 08223951008
          </div>
          <div className="flex gap-4">
            <a href="/privacy.html" className="hover:text-gray-600 transition">Privacy</a>
            <a href="/cookie.html" className="hover:text-gray-600 transition">Cookie</a>
            <a href="/" className="hover:text-gray-600 transition">Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
