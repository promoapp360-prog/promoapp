import { useState, useEffect } from "react";

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookiesAccepted")) {
      setVisible(true);
    }
  }, []);

  function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    setVisible(false);
  }

  return (
    <div
      className={`fixed bottom-0 left-0 w-full bg-gray-900 text-white p-6 z-[10000] transform transition-transform duration-500 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm opacity-80">
          Utilizziamo i cookie per migliorare la tua esperienza e analizzare il traffico. Cliccando su "Accetta", acconsenti all'uso dei cookie secondo la nostra{" "}
          <a href="/privacy.html" className="underline">Privacy Policy</a>.
        </p>
        <div className="flex gap-4">
          <button
            onClick={acceptCookies}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition"
          >
            Accetta
          </button>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({ nome_attivita: "", email: "", settore: "Medico", messaggio: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      setError("Errore nell'invio. Riprova o contattaci su WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Navigazione */}
      <nav className="fixed w-full z-50 glass border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600 tracking-tighter">
            Promo<span className="text-emerald-500">App</span>.it
          </div>
          <div className="hidden md:flex space-x-8 font-medium text-sm uppercase tracking-wide">
            <a href="#come-funziona" className="hover:text-indigo-600 transition">Come Funziona</a>
            <a href="#demo" className="hover:text-indigo-600 transition">Demo Settori</a>
            <a href="#prezzi" className="hover:text-indigo-600 transition">Prezzi</a>
          </div>
          <a href="https://promo-app.replit.app/prova-gratis" target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition shadow-md">Inizia Ora</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 gradient-bg text-white">
        <div className="max-w-7xl mx-auto text-center">
          <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-semibold mb-4 inline-block italic">
            La tua App professionale, pronta in 7 giorni
          </span>
          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 leading-tight">
            La tua App ufficiale.<br />Nessuno crederà al prezzo.
          </h1>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto font-light">
            Basta siti web dimenticati. Entra nello smartphone dei tuoi clienti. Gestisci prenotazioni, ordini, clienti, promozioni e vendite — tutto online, tutto in un'unica app.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a href="https://promo-app.replit.app/prova-gratis" target="_blank" rel="noopener noreferrer" className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition transform">
              Guarda le Demo Live
            </a>
            <a href="#contatti" className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition transform">
              Richiedi la tua App
            </a>
          </div>
          <div className="mt-10 flex justify-center items-center space-x-6 opacity-80 text-sm">
            <span><i className="fas fa-bolt mr-2"></i> Pronto in 7 giorni</span>
            <span><i className="fas fa-shield-alt mr-2"></i> Tutto incluso</span>
            <span><i className="fas fa-key mr-2"></i> Sblocco definitivo al pagamento</span>
          </div>
        </div>
      </section>

      {/* Sezione Mockup App */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="/promo-app-mockup.png"
                alt="PromoApp – Clienti, appuntamenti e messaggi tutto in un posto"
                className="w-full max-w-xs md:max-w-sm rounded-3xl shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                Clienti, appuntamenti e messaggi.<br />
                <span className="text-indigo-600">Tutto in un unico posto.</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8">
                Smetti di usare carta, fogli Excel e WhatsApp allo stesso tempo. PromoApp riunisce tutto in un'app professionale pensata per la tua attività.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "fa-calendar-check", color: "text-indigo-500", label: "Calendario prenotazioni in tempo reale" },
                  { icon: "fa-bell", color: "text-orange-500", label: "Promemoria automatici ai tuoi clienti" },
                  { icon: "fa-comments", color: "text-emerald-500", label: "Messaggi e promozioni via WhatsApp" },
                  { icon: "fa-chart-line", color: "text-blue-500", label: "Contabilità e fatture sempre sott'occhio" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${item.color} flex-shrink-0`}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <span className="text-gray-700 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <a href="https://promo-app.replit.app/prova-gratis" target="_blank" rel="noopener noreferrer"
                  className="inline-block bg-indigo-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-center">
                  Prova la Demo gratuita →
                </a>
                <a href="#prezzi"
                  className="inline-block border-2 border-indigo-200 text-indigo-600 px-7 py-3 rounded-xl font-bold hover:border-indigo-600 transition text-center">
                  Vedi i prezzi
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section id="come-funziona" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold">Come funziona in 3 passi</h2>
          <p className="text-gray-500">Dal primo test all'app definitiva — senza rischi, senza sorprese.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center relative">
          {/* Linea connettore */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-indigo-100 z-0"></div>

          {/* Step 1 */}
          <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-100 relative z-10">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              1
            </div>
            <h3 className="text-xl font-bold mb-3 text-indigo-700">Prova la Demo</h3>
            <p className="text-gray-600 text-sm">Ricevi subito un'app funzionante e già configurata. La testi tu stesso, gratis, senza impegno.</p>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-100 relative z-10">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              2
            </div>
            <h3 className="text-xl font-bold mb-3 text-emerald-700">Personalizziamo Insieme</h3>
            <p className="text-gray-600 text-sm">Aggiungiamo il tuo logo, i tuoi colori, i tuoi servizi. L'app viene costruita su misura per la tua attività, settore per settore.</p>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-2xl bg-orange-50 border border-orange-100 relative z-10">
            <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              3
            </div>
            <h3 className="text-xl font-bold mb-3 text-orange-700">Chiave di Sblocco</h3>
            <p className="text-gray-600 text-sm">Dopo il pagamento del piano scelto ricevi la <strong>chiave di attivazione</strong> che sblocca l'app definitivamente — tua per sempre, senza canoni mensili.</p>
          </div>
        </div>
      </section>

      {/* Sezione Flyer Promozionale */}
      <section className="py-20 bg-gradient-to-b from-white to-indigo-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Immagine */}
            <div className="flex justify-center">
              <img
                src="/promo-app-flyer.png"
                alt="PromoApp – La tua App, più clienti, più vendite"
                className="w-full max-w-xs md:max-w-sm rounded-3xl shadow-2xl"
              />
            </div>
            {/* Testo */}
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                La tua App.<br />
                <span className="text-indigo-600">Più clienti, più vendite.</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8">
                Una soluzione <strong>personalizzata</strong> per far crescere la tua attività — con tutte le funzioni che servono davvero, già pronte all'uso.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "fa-calendar-check", color: "text-indigo-500", label: "Prenotazioni e richieste in un click" },
                  { icon: "fa-star", color: "text-yellow-500", label: "Fidelity card digitale per i tuoi clienti" },
                  { icon: "fa-credit-card", color: "text-emerald-500", label: "Pagamenti online semplici e sicuri" },
                  { icon: "fa-tag", color: "text-pink-500", label: "Promozioni e offerte mirate" },
                  { icon: "fa-box", color: "text-orange-500", label: "Gestione magazzino e punti vendita" },
                  { icon: "fa-palette", color: "text-blue-500", label: "Personalizzata con logo e colori tuoi" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${item.color} flex-shrink-0 shadow-sm`}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <span className="text-gray-700 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <a href="#contatti"
                  className="inline-block bg-indigo-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-center">
                  Richiedi un Preventivo →
                </a>
                <a href="#prezzi"
                  className="inline-block border-2 border-indigo-200 text-indigo-600 px-7 py-3 rounded-xl font-bold hover:border-indigo-600 transition text-center">
                  Vedi i prezzi
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Settori */}
      <section id="demo" className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold italic">Soluzioni su misura</h2>
            <p className="text-gray-500">Un unico motore, infinite possibilità per il tuo settore.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-indigo-600 mb-2">Studi Medici</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Gestione appuntamenti e storico visite in totale privacy.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Pronto all'uso</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-emerald-600 mb-2">Centri Estetici</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Vetrina trattamenti e notifiche per offerte flash.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Alta richiesta</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-orange-600 mb-2">Autorimesse</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Stato riparazioni e scadenze revisioni in tempo reale.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Settore Tech</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-blue-600 mb-2">Agenti di Commercio</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Catalogo asset e gestione ordini in mobilità.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Massima Efficienza</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prezzi */}
      <section id="prezzi" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 italic">Piani chiari, nessun segreto</h2>
          <p className="text-gray-500 mb-6">Scegli la soluzione più adatta alla dimensione del tuo business.</p>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-5 py-3 text-sm font-semibold mb-12">
            <i className="fas fa-key text-indigo-500"></i>
            Tutti i piani includono la <strong className="mx-1">chiave di sblocco definitiva</strong> — paghi una volta, l'app è tua per sempre.
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Piano Base */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition">
              <div className="inline-block bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Promo Limitata</div>
              <h4 className="text-xl font-bold mb-1">Base</h4>
              <p className="text-gray-400 text-xs font-light mb-3 italic">Agenda online, piccolo negozio, piccola attività</p>
              <div className="mb-1">
                <span className="text-4xl font-bold">690€</span>
                <span className="text-sm text-gray-400 font-light"> una tantum</span>
              </div>
              <div className="text-indigo-600 font-bold mb-6">+ 19€/mese</div>
              <ul className="text-left space-y-3 mb-8 text-gray-600 text-sm">
                <li><i className="fas fa-flask text-indigo-400 mr-2"></i> <b>Demo gratuita</b> inclusa</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> App con logo e colori della tua attività</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Agenda prenotazioni online</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Scheda clienti e storico</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Promemoria automatici via notifica</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Vetrina servizi / listino prezzi</li>
                <li><i className="fas fa-key text-orange-400 mr-2"></i> <b>Chiave di sblocco definitiva</b></li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza via email</li>
              </ul>
              <a href="/checkout?piano=base" className="block w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition">Acquista Base →</a>
            </div>
            {/* Piano Consigliato */}
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white transform scale-105 relative">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Il più scelto</span>
              <h4 className="text-xl font-bold mb-1">Business Pro</h4>
              <p className="text-indigo-300 text-xs font-light mb-3 italic">Gestione avanzata, shop online, statistiche</p>
              <div className="text-4xl font-bold mb-1">899€</div>
              <div className="text-indigo-200 text-sm font-light mb-1">una tantum</div>
              <div className="text-yellow-300 font-bold mb-6">+ 25€/mese</div>
              <ul className="text-left space-y-3 mb-8 text-sm">
                <li><i className="fas fa-flask text-yellow-300 mr-2"></i> <b>Demo gratuita</b> inclusa</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Tutto il piano Base incluso</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> <b>Shop integrato</b> — vendi prodotti/servizi online</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Statistiche vendite e clienti</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> <b>Notifiche Push Illimitate</b></li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Coupon e promozioni personalizzate</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Gestione magazzino / disponibilità</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Più operatori / accessi multipli</li>
                <li><i className="fas fa-key text-yellow-300 mr-2"></i> <b>Chiave di sblocco definitiva</b></li>
              </ul>
              <a href="/checkout?piano=pro" className="block w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition">Acquista Pro →</a>
            </div>
            {/* Piano Custom */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition">
              <h4 className="text-xl font-bold mb-2">Personalizzata</h4>
              <div className="text-4xl font-bold mb-6">Su Misura</div>
              <ul className="text-left space-y-3 mb-8 text-gray-600 text-sm">
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Funzionalità su richiesta</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Pubblicazione su App Store</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Integrazione con gestionali</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza dedicata</li>
                <li><i className="fas fa-key text-orange-400 mr-2"></i> <b>Chiave di sblocco definitiva</b></li>
              </ul>
              <a href="#contatti" className="block w-full py-3 border-2 border-gray-800 text-gray-800 rounded-xl font-bold hover:bg-gray-800 hover:text-white transition">Contattaci</a>
            </div>
          </div>
        </div>
      </section>

      {/* Form Contatti */}
      <section id="contatti" className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Inizia il tuo progetto</h2>
            <p className="opacity-70 font-light">Compila il modulo: analizzeremo la fattibilità gratuitamente.</p>
          </div>

          {sent ? (
            <div className="bg-emerald-500 rounded-2xl p-10 text-center">
              <i className="fas fa-check-circle text-5xl mb-4 block"></i>
              <h3 className="text-2xl font-bold mb-2">Richiesta inviata!</h3>
              <p className="opacity-90">Ti contatteremo entro 24 ore con la tua bozza personalizzata.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Attività</label>
                  <input
                    type="text"
                    name="nome_attivita"
                    required
                    value={form.nome_attivita}
                    onChange={handleChange}
                    placeholder="Es. Officina Rossi"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Settore</label>
                  <select
                    name="settore"
                    value={form.settore}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Medico">Medico / Professionista</option>
                    <option value="Estetica">Estetica / Parrucchiere</option>
                    <option value="Meccanico">Autorimessa / Meccanico</option>
                    <option value="Agente">Agente di Commercio</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email di contatto</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tua@email.it"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cosa deve fare la tua App?</label>
                <textarea
                  name="messaggio"
                  value={form.messaggio}
                  onChange={handleChange}
                  required
                  placeholder="Descrivi brevemente la tua idea..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio in corso...</> : "Invia Richiesta Gratuita"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Banner pagina di test */}
      <div className="bg-yellow-100 border-t border-yellow-300 text-yellow-800 text-center text-sm py-3 px-4 font-medium">
        ⚠️ Questa è una pagina di test — non un sito ufficiale.
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="opacity-60">© 2026 PromoApp.it - P.IVA: [LA TUA P.IVA SE CE L'HAI]</div>
          <div className="flex items-center gap-5">
            <a
              href="https://www.facebook.com/profile.php?id=61568000249468"
              target="_blank"
              rel="noopener noreferrer"
              title="Seguici su Facebook"
              className="text-gray-500 hover:text-blue-600 transition-colors text-2xl"
            >
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a
              href="https://www.instagram.com/promoapp.it/"
              target="_blank"
              rel="noopener noreferrer"
              title="Seguici su Instagram"
              className="text-gray-500 hover:text-pink-500 transition-colors text-2xl"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>
          <div className="opacity-60 italic flex gap-6">
            <a href="/privacy.html" className="hover:underline">Privacy Policy</a>
            <a href="/cookie.html" className="hover:underline">Cookie Policy</a>
            <span>Creato con passione</span>
          </div>
        </div>
      </footer>

      {/* Tasto WhatsApp Flottante */}
      <a
        href="https://wa.me/393793602035"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-[10001] hover:bg-green-600 transition-all hover:scale-110"
      >
        <i className="fab fa-whatsapp text-3xl"></i>
      </a>

      {/* Cookie Banner */}
      <CookieBanner />
    </>
  );
}
