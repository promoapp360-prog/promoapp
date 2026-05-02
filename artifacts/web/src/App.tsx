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
  const [form, setForm] = useState({ nome_attivita: "", email: "", settore: "Negozio", messaggio: "" });
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
            Realizziamo l'App<br />che <span className="text-yellow-300">la tua attività merita.</span>
          </h1>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto font-light">
            Ogni attività è diversa. Per questo costruiamo <strong>app e gestionali su misura</strong> — qualunque sia il tuo settore, qualunque sia la funzione che ti serve. Tu ce la chiedi, noi la realizziamo.
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href="#contatti"
              className="group inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg md:text-xl shadow-2xl hover:scale-105 transition transform"
            >
              <i className="fas fa-lightbulb text-yellow-300 text-2xl"></i>
              <span>Raccontaci la tua idea — la realizziamo</span>
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </a>
            <a
              href="https://promo-app.replit.app/prova-gratis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white text-sm underline underline-offset-4 decoration-white/40 hover:decoration-white"
            >
              oppure guarda una demo già pronta →
            </a>
          </div>
          <div className="mt-10 flex justify-center items-center space-x-6 opacity-80 text-sm">
            <span><i className="fas fa-bolt mr-2"></i> Pronto in 7 giorni</span>
            <span><i className="fas fa-shield-alt mr-2"></i> Tutto incluso</span>
            <span><i className="fas fa-key mr-2"></i> Sblocco definitivo al pagamento</span>
          </div>
        </div>
      </section>

      {/* Sezione Flyer Promozionale — POSIZIONE 1 (facciamo tutto) */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="w-full max-w-xs md:max-w-sm h-[480px] md:h-[520px] flex items-center justify-center">
                <img
                  src="/promo-app-flyer.png"
                  alt="PromoApp – Una sola App, tutte le funzioni che ti servono"
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
                />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                Una sola App.<br />
                <span className="text-indigo-600">Tutte le funzioni che ti servono.</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8">
                Una soluzione personalizzata per far crescere la tua attività — con tutte le funzioni che servono davvero, già pronte all'uso.
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
                    <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${item.color} flex-shrink-0`}>
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

      {/* Sezione Mockup App — POSIZIONE 2 (medici) */}
      <section className="py-20 bg-gradient-to-b from-white to-indigo-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="w-full max-w-xs md:max-w-sm h-[480px] md:h-[520px] flex items-center justify-center">
                <img
                  src="/promo-app-mockup.png"
                  alt="PromoApp – Clienti, appuntamenti e messaggi tutto in un posto"
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
                />
              </div>
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
                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${item.color} flex-shrink-0 shadow-sm`}>
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

      {/* Sezione Gestionale */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2 flex justify-center">
              <div className="w-full max-w-xs md:max-w-sm h-[480px] md:h-[520px] flex items-center justify-center">
                <img
                  src="/promo-app-gestionale.png"
                  alt="PromoApp – Gestionali personalizzati su tutti i dispositivi"
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
                />
              </div>
            </div>
            <div className="md:order-1">
              <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                Gestionali personalizzati.<br />
                <span className="text-indigo-600">La tua azienda sempre connessa.</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8">
                Non solo app per i tuoi clienti — anche un <strong>gestionale completo</strong> per te e il tuo team. Lavora ovunque, da qualsiasi dispositivo, sempre sincronizzato.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "fa-users", color: "text-indigo-500", label: "CRM Clienti — tutti i contatti in un unico posto" },
                  { icon: "fa-file-invoice-dollar", color: "text-emerald-500", label: "Gestione preventivi e fatture in pochi clic" },
                  { icon: "fa-calendar-alt", color: "text-orange-500", label: "Agenda e appuntamenti senza stress" },
                  { icon: "fa-chart-bar", color: "text-blue-500", label: "Statistiche e piano di lavoro per il team" },
                  { icon: "fa-sync-alt", color: "text-purple-500", label: "Sincronizzato su PC, tablet e smartphone" },
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
                <a href="#contatti"
                  className="inline-block bg-indigo-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-center">
                  Chiedici quello che ti serve →
                </a>
                <a href="https://wa.me/393793602035" target="_blank" rel="noopener noreferrer"
                  className="inline-block bg-green-500 text-white px-7 py-3 rounded-xl font-bold hover:bg-green-600 transition text-center">
                  <i className="fab fa-whatsapp mr-2"></i> Scrivici su WhatsApp
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
            <h2 className="text-3xl font-bold italic">Funziona per ogni tipo di attività</h2>
            <p className="text-gray-500">Un'unica piattaforma adattata al tuo settore — pronta in 7 giorni.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { color: "text-indigo-600", bg: "bg-indigo-50", name: "Studi Medici & Dentisti", desc: "Prenotazioni, storico visite e promemoria automatici.", badge: "Pronto all'uso" },
              { color: "text-pink-600", bg: "bg-pink-50", name: "Centri Estetici & SPA", desc: "Vetrina trattamenti, fidelity card e offerte flash.", badge: "Alta richiesta" },
              { color: "text-orange-600", bg: "bg-orange-50", name: "Parrucchieri & Barber", desc: "Agenda online, clienti fidelizzati e promozioni.", badge: "Molto richiesto" },
              { color: "text-emerald-600", bg: "bg-emerald-50", name: "Negozi & Retail", desc: "Shop integrato, gestione magazzino e ordini online.", badge: "E-commerce" },
              { color: "text-blue-600", bg: "bg-blue-50", name: "Ristoranti & Bar", desc: "Menu digitale, prenotazioni tavoli e ordini d'asporto.", badge: "Food & Beverage" },
              { color: "text-violet-600", bg: "bg-violet-50", name: "Palestre & Fitness", desc: "Abbonamenti, prenotazione corsi e accessi digitali.", badge: "Sport & Wellness" },
              { color: "text-orange-500", bg: "bg-orange-50", name: "Autorimesse & Meccanici", desc: "Stato riparazioni, scadenze revisioni e devis online.", badge: "Settore Tech" },
              { color: "text-cyan-600", bg: "bg-cyan-50", name: "Centri Servizi & Agenzie", desc: "Gestione pratiche, appuntamenti e documenti digitali.", badge: "Professionisti" },
              { color: "text-rose-600", bg: "bg-rose-50", name: "Studi Legali & Notarili", desc: "Agenda clienti, archivio pratiche e notifiche scadenze.", badge: "Legal & Pro" },
              { color: "text-teal-600", bg: "bg-teal-50", name: "Immobiliari", desc: "Vetrina immobili, richieste visite e gestione contatti.", badge: "Real Estate" },
              { color: "text-yellow-600", bg: "bg-yellow-50", name: "Agenti di Commercio", desc: "Catalogo prodotti, ordini in mobilità e statistiche.", badge: "Massima efficienza" },
              { color: "text-gray-700", bg: "bg-gray-100", name: "Qualsiasi altra attività", desc: "Costruiamo l'app su misura per le tue esigenze specifiche.", badge: "Su richiesta" },
            ].map((item, i) => (
              <div key={i} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition`}>
                <div className={`inline-block ${item.bg} ${item.color} text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-lg mb-3`}>{item.badge}</div>
                <h4 className={`font-bold ${item.color} mb-2 text-sm`}>{item.name}</h4>
                <p className="text-xs text-gray-500 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prezzi */}
      <section id="prezzi" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 italic">Quanto costa la tua App?</h2>
          <p className="text-gray-500 mb-6 max-w-2xl mx-auto">Prezzo chiaro, nessuna sorpresa. <strong>L'App costa una sola volta</strong> — il canone mensile copre solo hosting, aggiornamenti e assistenza.</p>

          {/* Promo Banner 6+6 */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl px-6 py-4 text-sm font-bold mb-6 shadow-lg">
            <i className="fas fa-fire text-yellow-300 text-xl"></i>
            <span className="text-base">PROMO LANCIO — Paghi 6 mesi, gli altri 6 sono <span className="text-yellow-300 underline">GRATIS</span></span>
          </div>
          <div className="block mb-12 text-xs text-gray-500 italic">Promo valida sul primo anno di canone — solo per le prime richieste</div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Piano Base — App Semplice */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition flex flex-col">
              <div className="inline-block self-start bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">App Essenziale</div>
              <h4 className="text-2xl font-bold mb-1">Base</h4>
              <p className="text-gray-400 text-xs font-light mb-4 italic">Per attività che vogliono iniziare bene</p>
              <div className="mb-1">
                <span className="text-5xl font-extrabold text-gray-900">690€</span>
              </div>
              <div className="text-xs text-gray-500 font-light mb-1">prezzo dell'App — pagamento unico</div>
              <div className="text-indigo-600 font-bold text-sm mb-6">+ 19€/mese · hosting & assistenza</div>
              <ul className="text-left space-y-3 mb-8 text-gray-600 text-sm flex-grow">
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> App con logo e colori della tua attività</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Gestionale clienti e appuntamenti</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Gestione magazzino base</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Shop online per prodotti e servizi</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Agenda prenotazioni online</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Promemoria automatici ai clienti</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Vetrina servizi e listino prezzi</li>
                <li><i className="fas fa-key text-orange-400 mr-2"></i> App tua per sempre</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza via email</li>
              </ul>
              <a href="/checkout?piano=base" className="block w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition">Richiedi la Base →</a>
            </div>
            {/* Piano Pro — App Avanzata con Integrazioni */}
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white transform md:scale-105 relative flex flex-col">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">Il più scelto</span>
              <div className="inline-block self-start bg-yellow-300 text-indigo-900 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">App Avanzata</div>
              <h4 className="text-2xl font-bold mb-1">Business Pro</h4>
              <p className="text-indigo-200 text-xs font-light mb-4 italic">Per chi vuole crescere con integrazioni e dati</p>
              <div className="text-5xl font-extrabold mb-1">890€</div>
              <div className="text-xs text-indigo-200 font-light mb-1">prezzo dell'App — pagamento unico</div>
              <div className="text-yellow-300 font-bold text-sm mb-6">+ 29€/mese · hosting & assistenza</div>
              <ul className="text-left space-y-3 mb-8 text-sm flex-grow">
                <li className="font-semibold"><i className="fas fa-star text-yellow-300 mr-2"></i> Tutto il piano Base, più:</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Integrazione con gestionali esistenti</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Pagamenti online (Stripe, PayPal, bonifico)</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Statistiche vendite, clienti e fatturato</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Notifiche push illimitate</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Fidelity card digitale e coupon</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Più operatori e accessi multipli</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> CRM avanzato e segmentazione clienti</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Assistenza prioritaria</li>
              </ul>
              <a href="/checkout?piano=pro" className="block w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition">Richiedi la Pro →</a>
            </div>
            {/* Piano Custom — Su Misura */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-dashed border-gray-300 hover:shadow-xl transition flex flex-col">
              <div className="inline-block self-start bg-gray-900 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Su Misura</div>
              <h4 className="text-2xl font-bold mb-1">Personalizzata</h4>
              <p className="text-gray-400 text-xs font-light mb-4 italic">Hai un'idea precisa? La realizziamo per te</p>
              <div className="text-5xl font-extrabold text-gray-900 mb-1">Preventivo</div>
              <div className="text-xs text-gray-500 font-light mb-6">prezzo personalizzato in base alle tue esigenze</div>
              <ul className="text-left space-y-3 mb-8 text-gray-600 text-sm flex-grow">
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Qualunque funzione tu chieda</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Pubblicazione su App Store e Google Play</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Integrazioni con software esterni e API</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Multi-sede, multi-utente, multi-lingua</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Design completamente custom</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Project manager dedicato</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza dedicata e SLA garantito</li>
                <li><i className="fas fa-key text-orange-400 mr-2"></i> App tua per sempre</li>
              </ul>
              <a href="#contatti" className="block w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition">Richiedi un Preventivo →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Form Contatti — Richiesta Preventivo */}
      <section id="contatti" className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Richiedi un Preventivo</div>
            <h2 className="text-3xl font-bold">Raccontaci la tua idea</h2>
            <p className="opacity-70 font-light mt-2">Analizziamo la fattibilità <strong>gratuitamente</strong> e ti rispondiamo entro 24 ore con un preventivo su misura.</p>
          </div>

          {sent ? (
            <div className="bg-emerald-500 rounded-2xl p-10 text-center">
              <i className="fas fa-check-circle text-5xl mb-4 block"></i>
              <h3 className="text-2xl font-bold mb-2">Richiesta inviata!</h3>
              <p className="opacity-90">Ti contatteremo entro 24 ore con il tuo preventivo personalizzato.</p>
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
                    placeholder="Es. Bar Centrale"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo di Attività</label>
                  <select
                    name="settore"
                    value={form.settore}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Medico">Studio Medico / Dentistico</option>
                    <option value="Estetica">Centro Estetico / SPA</option>
                    <option value="Parrucchiere">Parrucchiere / Barber</option>
                    <option value="Negozio">Negozio / Retail</option>
                    <option value="Ristorazione">Ristorante / Bar</option>
                    <option value="Palestra">Palestra / Fitness</option>
                    <option value="Meccanico">Autorimessa / Meccanico</option>
                    <option value="Servizi">Centro Servizi / Agenzia</option>
                    <option value="Legale">Studio Legale / Notarile</option>
                    <option value="Immobiliare">Agenzia Immobiliare</option>
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
                <label className="block text-sm font-medium mb-2">Cosa deve fare la tua App? <span className="text-gray-500 font-light">(funzioni, integrazioni, esempi)</span></label>
                <textarea
                  name="messaggio"
                  value={form.messaggio}
                  onChange={handleChange}
                  required
                  placeholder="Es. mi serve un'app con prenotazioni online, gestione clienti, shop integrato per vendere i miei prodotti, integrazione col mio gestionale attuale..."
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
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio in corso...</> : "Richiedi il tuo Preventivo Gratuito"}
              </button>
              <p className="text-center text-xs text-gray-500 italic">
                I tuoi dati sono trattati secondo la nostra <a href="/privacy.html" className="underline hover:text-white">Privacy Policy</a>. Nessuno spam, promesso.
              </p>
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
          <div className="opacity-70 text-center md:text-left">
            © 2026 <strong>PromoApp.it</strong><br className="md:hidden" />
            <span className="opacity-80"> · Sophia 2005 S.r.l. · P.IVA 08223951008</span>
          </div>
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
