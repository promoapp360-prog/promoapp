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

      {/* WhatsApp sempre disponibile durante lo scroll */}
      <a
        href="https://wa.me/393793602035?text=Ciao!%20Vorrei%20informazioni%20sulle%20web%20app."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contattaci su WhatsApp"
        className="fixed right-3 bottom-5 sm:right-5 sm:bottom-6 z-50 inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-full font-black text-sm shadow-xl shadow-green-950/30 transition hover:scale-105 active:scale-95"
        data-testid="link-floating-whatsapp"
      >
        <i className="fab fa-whatsapp text-xl"></i>
        <span>WhatsApp</span>
      </a>

      {/* ── HERO + FORM ── */}
      <section className="px-4 pt-2 pb-14">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 items-start">

          {/* LEFT: copy */}
          <div className="text-white">
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-indigo-100 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              <i className="fas fa-mobile-screen-button text-emerald-400 text-xs"></i>
              Web app su misura · tutti i sistemi operativi
            </div>
            <h1 className="text-[2.4rem] md:text-5xl font-black leading-[1.1] mb-3">
              La tua attività<br />
              <span className="text-yellow-300">in un'App.</span>
            </h1>
            <p className="text-indigo-200 text-base leading-relaxed mb-5">
              Creiamo web app personalizzate per attività italiane, utilizzabili su Android, iOS e tutti i sistemi operativi — con prenotazioni, fidelity card, pagamenti e notifiche.
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

      {/* ── FOOTER ── */}
      <footer className="border-t border-indigo-600 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© 2024 Promo<strong className="text-white">App</strong>.it — Sophia 2005 S.r.l. · P.IVA 08223951008</span>
          <div className="flex gap-5">
            <a href="/privacy.html" className="hover:text-white transition">Privacy</a>
            <a href="/cookie.html" className="hover:text-white transition">Cookie</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
