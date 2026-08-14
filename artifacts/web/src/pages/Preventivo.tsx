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
  "Altro",
];

const LAVORI = [
  {
    nome: "Movieverse",
    settore: "Cinema & Streaming",
    desc: "App con catalogo film, prenotazioni sala, fidelity card digitale e notifiche push per i fan del grande schermo.",
    emoji: "🎬",
    gradient: "from-slate-900 via-indigo-950 to-slate-900",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    accent: "text-indigo-300",
    tags: ["Catalogo film", "Prenotazioni", "Fidelity card", "Push notifications"],
    tagStyle: "bg-indigo-500/20 text-indigo-200",
  },
  {
    nome: "La Locanda nei Sassi",
    settore: "Ristorante / Hospitality",
    desc: "App per il ristorante nel cuore di Matera: prenotazioni tavoli, menù digitale, eventi speciali e programma fedeltà.",
    emoji: "🪨",
    gradient: "from-amber-950 via-stone-900 to-amber-950",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    accent: "text-amber-300",
    tags: ["Prenotazioni tavoli", "Menù digitale", "Eventi", "Loyalty"],
    tagStyle: "bg-amber-500/20 text-amber-200",
  },
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

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(160deg,#312e81 0%,#3730a3 40%,#4338ca 100%)" }}>

      {/* ── NAV ── */}
      <nav className="w-full px-4 pt-5 pb-3 flex justify-between items-center max-w-5xl mx-auto">
        <span className="text-xl font-black tracking-tighter text-white">
          Promo<span className="text-emerald-400">App</span><span className="text-indigo-300">.it</span>
        </span>
        <a
          href="https://wa.me/393793602035"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white px-3.5 py-2 rounded-full font-bold text-sm transition shadow-lg"
          data-testid="link-nav-whatsapp"
        >
          <i className="fab fa-whatsapp"></i>
          WhatsApp
        </a>
      </nav>

      {/* ── HERO + FORM ── */}
      <section className="px-4 pt-2 pb-14">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 items-start">

          {/* LEFT: copy */}
          <div className="text-white">
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-indigo-100 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              <i className="fas fa-mobile-screen-button text-emerald-400 text-xs"></i>
              App su misura · iOS &amp; Android
            </div>
            <h1 className="text-[2.4rem] md:text-5xl font-black leading-[1.1] mb-3">
              La tua attività<br />
              <span className="text-yellow-300">in un'App.</span>
            </h1>
            <p className="text-indigo-200 text-base leading-relaxed mb-5">
              Creiamo app personalizzate per attività italiane — prenotazioni, fidelity card, pagamenti e notifiche, tutto pronto in 7 giorni.
            </p>

            <div className="space-y-2 mb-5">
              {[
                { icon: "fa-calendar-check", text: "Prenotazioni online 24/7" },
                { icon: "fa-star", text: "Fidelity card digitale" },
                { icon: "fa-bell", text: "Notifiche push ai clienti" },
                { icon: "fa-credit-card", text: "Pagamenti nell'App" },
                { icon: "fa-rocket", text: "Operativa in 7 giorni" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${item.icon} text-emerald-400 text-xs`}></i>
                  </span>
                  <span className="text-white font-medium text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-sm text-indigo-200 flex items-center gap-2">
              <i className="fas fa-shield-halved text-emerald-400 flex-shrink-0"></i>
              <span><strong className="text-white">Nessun anticipo</strong> — prima vedi il progetto, poi decidi.</span>
            </div>
          </div>

          {/* RIGHT: form */}
          <div>
            {sent ? (
              <div className="bg-white rounded-3xl p-8 text-center shadow-2xl" data-testid="message-sent">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition"
                  data-testid="link-whatsapp-thanks"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                  Scrivici su WhatsApp
                </a>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-6 shadow-2xl space-y-3.5"
                data-testid="form-preventivo"
              >
                <div>
                  <h2 className="text-lg font-black text-gray-900">Richiedi il tuo progetto</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Ti rispondiamo entro 24 ore.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="nome_attivita">
                    Nome attività <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nome_attivita" name="nome_attivita" type="text" required
                    value={form.nome_attivita} onChange={handleChange}
                    placeholder="Es. Parrucchiere Mario Rossi"
                    className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm"
                    data-testid="input-nome-attivita"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="settore">
                    Tipo di attività <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="settore" name="settore" required
                    value={form.settore} onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm bg-white"
                    data-testid="select-settore"
                  >
                    <option value="">Seleziona...</option>
                    {SETTORI.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email" name="email" type="email" required
                      value={form.email} onChange={handleChange}
                      placeholder="nome@email.it"
                      className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="whatsapp">
                      WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="whatsapp" name="whatsapp" type="tel" required
                      value={form.whatsapp} onChange={handleChange}
                      placeholder="+39 340..."
                      className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm"
                      data-testid="input-whatsapp"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="messaggio">
                    Cosa ti serve? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="messaggio" name="messaggio" required rows={3}
                    value={form.messaggio} onChange={handleChange}
                    placeholder="Descrivi brevemente la tua attività e cosa vorresti dall'App..."
                    className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-gray-900 outline-none transition text-sm resize-none"
                    data-testid="textarea-messaggio"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-medium flex items-center gap-1" data-testid="text-error">
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-black text-base transition shadow-md hover:shadow-lg active:scale-[0.98]"
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
                    className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-bold transition"
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

      {/* ── PORTFOLIO ── */}
      <section className="bg-gray-950 px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <span className="inline-block bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              Alcuni lavori
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              App che abbiamo realizzato.
            </h2>
            <p className="text-gray-400 text-sm mt-1.5">Ogni progetto è sviluppato su misura, da zero.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {LAVORI.map((l) => (
              <div
                key={l.nome}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${l.gradient} border border-white/10 p-6 flex flex-col gap-4`}
                data-testid={`card-lavoro-${l.nome.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {/* Glow decorativo */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`inline-flex items-center gap-1.5 border text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${l.badge}`}>
                      {l.settore}
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight flex items-center gap-2">
                      <span className="text-3xl">{l.emoji}</span>
                      {l.nome}
                    </h3>
                  </div>
                </div>

                {/* Desc */}
                <p className="text-gray-300 text-sm leading-relaxed">{l.desc}</p>

                {/* Tag features */}
                <div className="flex flex-wrap gap-2">
                  {l.tags.map((t) => (
                    <span key={t} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${l.tagStyle}`}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Mock screen */}
                <div className="mt-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-400/70"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400/70"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400/70"></div>
                    <div className={`ml-2 text-xs font-bold ${l.accent}`}>{l.nome} · App</div>
                  </div>
                  <div className="space-y-2">
                    {l.tags.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white/10 flex-shrink-0"></div>
                        <div className="h-2 rounded bg-white/10 flex-1" style={{ width: `${70 - i * 12}%` }}></div>
                        <div className={`text-xs ${l.accent} font-bold flex-shrink-0`}>✓</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA sotto il portfolio */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-4">La tua attività potrebbe essere la prossima.</p>
            <a
              href="#top"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-7 py-3.5 rounded-2xl transition shadow-xl text-sm"
              data-testid="button-portfolio-cta"
            >
              <i className="fas fa-arrow-up"></i>
              Richiedi il tuo progetto
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 border-t border-white/10 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© 2024 Promo<strong className="text-gray-300">App</strong>.it — Sophia 2005 S.r.l. · P.IVA 08223951008</span>
          <div className="flex gap-5">
            <a href="/privacy.html" className="hover:text-gray-300 transition">Privacy</a>
            <a href="/cookie.html" className="hover:text-gray-300 transition">Cookie</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
