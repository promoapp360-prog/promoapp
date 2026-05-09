import { useState } from "react";
import RichiestaGestionaleModal from "../components/RichiestaGestionaleModal";

const SETTORI = [
  { icon: "fa-store",             label: "Negozio generico",      color: "bg-indigo-100 text-indigo-700" },
  { icon: "fa-screwdriver-wrench",label: "Ferramenta",            color: "bg-orange-100 text-orange-700" },
  { icon: "fa-car",               label: "Ricambi auto",          color: "bg-slate-100 text-slate-700" },
  { icon: "fa-basket-shopping",   label: "Alimentari",            color: "bg-green-100 text-green-700" },
  { icon: "fa-laptop",            label: "Elettronica",           color: "bg-blue-100 text-blue-700" },
  { icon: "fa-paw",               label: "Pet shop",              color: "bg-amber-100 text-amber-700" },
  { icon: "fa-boxes-stacked",     label: "Piccolo retail",        color: "bg-purple-100 text-purple-700" },
];

const FUNZIONI = [
  { icon: "fa-boxes-stacked",       color: "bg-indigo-100 text-indigo-600",  titolo: "Magazzino & Scorte",      desc: "Gestisci prodotti, categorie e varianti. Avvisi automatici quando una scorta scende sotto la soglia minima." },
  { icon: "fa-file-invoice-dollar", color: "bg-emerald-100 text-emerald-600", titolo: "Vendite & Cassa",         desc: "Registra le vendite, emetti scontrini e ricevute. Storico completo per data, prodotto e cliente." },
  { icon: "fa-users",               color: "bg-blue-100 text-blue-600",       titolo: "Clienti & CRM",           desc: "Anagrafica clienti, storico acquisti, note e preferenze. Fidelizza con promozioni mirate." },
  { icon: "fa-tags",                color: "bg-amber-100 text-amber-600",     titolo: "Listini & Sconti",        desc: "Listini differenziati per cliente o categoria. Sconti percentuali o a importo fisso in pochi clic." },
  { icon: "fa-truck",               color: "bg-purple-100 text-purple-600",   titolo: "Fornitori & Ordini",      desc: "Gestisci i tuoi fornitori, crea ordini di acquisto e ricevi la merce direttamente nel magazzino." },
  { icon: "fa-chart-line",          color: "bg-rose-100 text-rose-600",       titolo: "Report & Statistiche",   desc: "Vendite per periodo, prodotti più venduti, incassato giornaliero. Tutto a colpo d'occhio." },
  { icon: "fa-file-lines",          color: "bg-cyan-100 text-cyan-600",       titolo: "Preventivi & Documenti", desc: "Crea preventivi professionali, trasformali in ordini e inviare via email al cliente." },
  { icon: "fa-bell",                color: "bg-orange-100 text-orange-600",   titolo: "Notifiche & Avvisi",     desc: "Prodotti in esaurimento, pagamenti in scadenza, ordini da evadere. Nulla sfugge." },
];

const FAQ = [
  {
    q: "Posso usarlo su più computer in negozio?",
    a: "Se scegli la modalità Web App sì — funziona su qualsiasi browser, da qualsiasi dispositivo contemporaneamente (PC, tablet, smartphone). Se scegli il client desktop, l'installazione è su un singolo computer fisico."
  },
  {
    q: "I dati sono al sicuro?",
    a: "Assolutamente. I dati vengono salvati su server sicuri con backup automatici giornalieri. Nessun rischio di perderli anche se il computer si rompe."
  },
  {
    q: "La prova gratuita è davvero gratuita?",
    a: "Sì. Richiedi la prova, ti configuriamo un account con i tuoi dati e puoi usarlo per valutarlo. Se poi decidi di acquistare paghi solo i 199€ di personalizzazione."
  },
  {
    q: "Cosa include il prezzo di 199€?",
    a: "L'inserimento dei tuoi dati aziendali, categorie e listino prodotti di partenza, logo e colori personalizzati. Modifiche funzionali aggiuntive sono preventivate separatamente."
  },
  {
    q: "Devo sapere usare il computer?",
    a: "L'interfaccia è stata progettata per essere usata da chiunque, senza nessuna conoscenza tecnica. Se hai bisogno, ti affianchiamo anche in una videochiamata di formazione."
  },
  {
    q: "Funziona anche su Mac?",
    a: "Sì. Il client desktop è disponibile sia per Windows che per macOS. La web app invece funziona su qualsiasi browser, incluso Safari su iPhone e iPad."
  },
];

export default function Gestionale360() {
  const [modalAperto, setModalAperto] = useState(false);
  const [faqAperta, setFaqAperta] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-extrabold tracking-tight">
            Promo<span className="text-emerald-500">App</span>.it
          </a>
          <div className="flex items-center gap-3">
            <a href="/" className="hidden sm:inline text-sm text-gray-500 hover:text-gray-700">← Torna al sito</a>
            <button
              onClick={() => setModalAperto(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
            >
              Richiedi la prova gratis
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #10b981 0%, transparent 60%), radial-gradient(circle at 80% 20%, #059669 0%, transparent 50%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/50 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm font-semibold text-emerald-200">Gestionale per negozi e retail</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Il gestionale che <span className="text-emerald-400">ogni negozio</span> dovrebbe avere.
            </h1>
            <p className="text-xl text-emerald-100/80 mb-8 max-w-2xl leading-relaxed">
              Magazzino, cassa, clienti, fornitori e statistiche — tutto in un unico software. Usalo direttamente nel browser oppure scaricalo sul tuo PC o Mac.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setModalAperto(true)}
                className="inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-extrabold text-lg transition shadow-xl"
              >
                <i className="fas fa-play-circle"></i>
                Richiedi la prova gratuita
              </button>
              <a
                href="#funzioni"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white hover:border-white/60 px-8 py-4 rounded-2xl font-bold text-lg transition"
              >
                Scopri le funzioni <i className="fas fa-arrow-down ml-1"></i>
              </a>
            </div>
            <p className="mt-5 text-sm text-emerald-200/60">
              <i className="fas fa-check mr-1 text-emerald-400"></i> Nessun pagamento richiesto per la prova &nbsp;·&nbsp; <i className="fas fa-check mr-1 text-emerald-400"></i> Configurato con i tuoi dati entro 24h
            </p>
          </div>
        </div>
      </section>

      {/* ─── SETTORI TARGET ─── */}
      <section className="py-14 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600 mb-2">Pensato per</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Qual è la tua attività?</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {SETTORI.map((s) => (
              <div key={s.label} className={`flex items-center gap-2.5 ${s.color} px-5 py-3 rounded-2xl font-semibold text-sm`}>
                <i className={`fas ${s.icon}`}></i>
                {s.label}
              </div>
            ))}
            <div className="flex items-center gap-2.5 bg-gray-100 text-gray-500 px-5 py-3 rounded-2xl font-semibold text-sm">
              <i className="fas fa-ellipsis"></i>
              e molti altri
            </div>
          </div>
        </div>
      </section>

      {/* ─── WEB APP vs DESKTOP ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Come funziona</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Scegli come usarlo.<br /><span className="text-emerald-600">Due modalità, un solo software.</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Al momento dell'attivazione scegli una delle due modalità. Non è possibile usarle entrambe contemporaneamente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Web App */}
            <div className="border-2 border-emerald-200 rounded-3xl p-8 bg-gradient-to-br from-emerald-50 to-white">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-5">
                <i className="fas fa-globe text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Web App</h3>
              <p className="text-gray-500 mb-5">Niente installazioni — apri il browser e sei operativo. Funziona su qualsiasi dispositivo connesso a internet.</p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Accessibile da PC, tablet e smartphone",
                  "Più utenti contemporaneamente in negozio",
                  "Aggiornamenti automatici — sempre all'ultima versione",
                  "Dati sempre sincronizzati e in cloud",
                  "Accesso da qualsiasi luogo (anche da casa)",
                ].map((v) => (
                  <li key={v} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <i className="fas fa-check text-emerald-500 mt-0.5 flex-shrink-0"></i> {v}
                  </li>
                ))}
              </ul>
              <div className="bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl px-3 py-2 inline-block">
                <i className="fas fa-star mr-1"></i> Ideale per negozi con più addetti o più punti cassa
              </div>
            </div>

            {/* Desktop */}
            <div className="border-2 border-slate-200 rounded-3xl p-8 bg-gradient-to-br from-slate-50 to-white">
              <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mb-5">
                <i className="fas fa-desktop text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">App Desktop</h3>
              <p className="text-gray-500 mb-5">Scarica e installa direttamente sul tuo computer. Disponibile per Windows e macOS.</p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Installazione su un singolo computer fisico",
                  "Funziona anche senza connessione internet",
                  "Più veloce su hardware meno recente",
                  "Nessun canone cloud — dati salvati in locale",
                  "Compatibile con Windows 10/11 e macOS 12+",
                ].map((v) => (
                  <li key={v} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <i className="fas fa-check text-slate-500 mt-0.5 flex-shrink-0"></i> {v}
                  </li>
                ))}
              </ul>
              <div className="bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 inline-block">
                <i className="fas fa-info-circle mr-1"></i> Ideale per chi lavora su un unico PC di cassa
              </div>
            </div>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
            <i className="fas fa-triangle-exclamation text-amber-500 text-xl flex-shrink-0 mt-0.5"></i>
            <p className="text-sm text-amber-800">
              <strong>Importante:</strong> le due modalità si escludono a vicenda. Non è possibile usare sia la web app che il client desktop con lo stesso account. Al momento dell'attivazione sceglierai quale modalità preferisci.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FUNZIONI ─── */}
      <section id="funzioni" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Funzionalità</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Tutto quello che ti serve,<br />già incluso.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FUNZIONI.map((f) => (
              <div key={f.titolo} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <i className={`fas ${f.icon} text-lg`}></i>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.titolo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COME FUNZIONA (3 passi) ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Processo</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Parti in 3 semplici passi</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "1", icon: "fa-paper-plane", colore: "bg-emerald-600",
                titolo: "Richiedi la prova",
                desc: "Compila il form con i tuoi dati aziendali. Non ti chiediamo nessun pagamento.",
              },
              {
                n: "2", icon: "fa-gear", colore: "bg-emerald-600",
                titolo: "Ti configuriamo l'account",
                desc: "Entro 24 ore ricevi le credenziali con il gestionale già configurato con i tuoi dati.",
              },
              {
                n: "3", icon: "fa-rocket", colore: "bg-emerald-600",
                titolo: "Usi e decidi",
                desc: "Provi il gestionale con i tuoi prodotti e il tuo modo di lavorare. Poi decidi se acquistare.",
              },
            ].map((p) => (
              <div key={p.n} className="text-center">
                <div className={`w-16 h-16 ${p.colore} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <i className={`fas ${p.icon} text-white text-xl`}></i>
                </div>
                <div className="text-4xl font-extrabold text-gray-100 -mt-2 mb-2 select-none">{p.n}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{p.titolo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PREZZO ─── */}
      <section className="py-16 bg-gradient-to-br from-emerald-900 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block bg-emerald-700/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">Prezzo</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Semplice e trasparente.</h2>
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 mb-6 text-left">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <p className="text-emerald-300 font-bold text-sm uppercase tracking-wider mb-1">Costo unico di personalizzazione</p>
                <p className="text-5xl font-extrabold">199<span className="text-2xl">€</span></p>
                <p className="text-white/50 text-sm mt-1">una tantum · IVA esclusa</p>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl px-5 py-3 text-emerald-300 text-sm font-semibold">
                <i className="fas fa-gift mr-2"></i>Prova gratuita prima di pagare
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Configurazione con i tuoi dati aziendali",
                "Inserimento categorie e listino prodotti",
                "Logo e colori personalizzati",
                "Scelta modalità Web App o Desktop",
                "Formazione iniziale inclusa (videocall)",
                "Supporto tecnico per 30 giorni",
              ].map((v) => (
                <div key={v} className="flex items-start gap-2 text-sm text-white/80">
                  <i className="fas fa-check text-emerald-400 mt-0.5 flex-shrink-0"></i> {v}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setModalAperto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-extrabold text-lg transition shadow-xl"
          >
            <i className="fas fa-play-circle"></i>
            Inizia con la prova gratuita
          </button>
          <p className="mt-4 text-white/40 text-sm">Nessun costo nascosto · Nessun abbonamento obbligatorio</p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Domande frequenti</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  className="w-full text-left flex items-center justify-between gap-4 px-6 py-4 font-semibold text-gray-800 hover:bg-gray-50 transition"
                  onClick={() => setFaqAperta(faqAperta === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <i className={`fas fa-chevron-down text-gray-400 flex-shrink-0 transition-transform ${faqAperta === i ? "rotate-180" : ""}`}></i>
                </button>
                {faqAperta === i && (
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINALE ─── */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Pronto a semplificare il tuo negozio?
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            Richiedi la prova gratuita adesso. Ti configuriamo Gestionale360 con i tuoi dati e ti mandiamo le credenziali entro 24 ore — senza impegno.
          </p>
          <button
            onClick={() => setModalAperto(true)}
            className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-extrabold text-lg transition shadow-lg"
          >
            <i className="fas fa-paper-plane"></i>
            Richiedi la prova gratis
          </button>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span><i className="fas fa-check mr-1 text-emerald-500"></i>Nessuna carta di credito</span>
            <span><i className="fas fa-check mr-1 text-emerald-500"></i>Configurato entro 24h</span>
            <span><i className="fas fa-check mr-1 text-emerald-500"></i>Supporto incluso</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold mb-1">Promo<span className="text-emerald-400">App</span>.it</div>
            <p className="text-gray-400 text-xs">Sophia 2005 S.r.l. · P.IVA 08223951008</p>
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href="/" className="hover:text-white transition">Sito principale</a>
            <a href="/privacy.html" className="hover:text-white transition">Privacy</a>
            <a href="/cookie.html" className="hover:text-white transition">Cookie</a>
            <a href="https://wa.me/393793602035" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition font-semibold">
              <i className="fab fa-whatsapp mr-1"></i>WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* WhatsApp fisso */}
      <a
        href="https://wa.me/393793602035?text=Ciao,%20vorrei%20informazioni%20su%20Gestionale360"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[10001] w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition"
        aria-label="WhatsApp"
      >
        <i className="fab fa-whatsapp text-2xl"></i>
      </a>

      {/* Modal */}
      {modalAperto && (
        <RichiestaGestionaleModal tipo="gestionale360" onClose={() => setModalAperto(false)} />
      )}
    </div>
  );
}
