import { useState } from "react";
import RichiestaGestionaleModal from "../components/RichiestaGestionaleModal";

const SETTORI = [
  { icon: "fa-briefcase",         label: "Agente di commercio", color: "bg-orange-100 text-orange-700" },
  { icon: "fa-handshake",         label: "Rappresentante",       color: "bg-amber-100 text-amber-700" },
  { icon: "fa-truck",             label: "Distributore",         color: "bg-red-100 text-red-700" },
  { icon: "fa-building",          label: "Procacciatore",        color: "bg-rose-100 text-rose-700" },
  { icon: "fa-map-location-dot",  label: "Area manager",         color: "bg-orange-100 text-orange-800" },
  { icon: "fa-chart-line",        label: "Sales manager",        color: "bg-amber-100 text-amber-800" },
];

const FUNZIONI = [
  { icon: "fa-users",             color: "bg-orange-100 text-orange-600",  titolo: "Clienti & Prospect",      desc: "Anagrafica completa con indirizzo, referenti e storico visite. Mappa interattiva con tutti i tuoi clienti geolocalizzati." },
  { icon: "fa-file-invoice",      color: "bg-amber-100 text-amber-600",    titolo: "Ordini & Preventivi",     desc: "Crea ordini e preventivi direttamente dal cliente, a visita completata. Catalogo prodotti sempre aggiornato in mobilità." },
  { icon: "fa-percent",           color: "bg-red-100 text-red-600",        titolo: "Provvigioni automatiche", desc: "Calcolo automatico delle provvigioni per cliente, prodotto e tipologia d'ordine. Report mensile pronto in un clic." },
  { icon: "fa-calendar-days",     color: "bg-rose-100 text-rose-600",      titolo: "Pianificazione visite",   desc: "Agenda visite con promemoria, priorità cliente e ottimizzazione percorso. Nessun cliente dimenticato." },
  { icon: "fa-receipt",           color: "bg-orange-100 text-orange-700",  titolo: "Nota spese",              desc: "Registra chilometri, pedaggi, pasti e pernotti in pochi secondi. Export PDF per il rimborso automatico." },
  { icon: "fa-box-open",          color: "bg-amber-100 text-amber-700",    titolo: "Catalogo prodotti",       desc: "Accesso rapido a schede prodotto, listini aggiornati e disponibilità magazzino — anche offline." },
  { icon: "fa-chart-bar",         color: "bg-red-100 text-red-700",        titolo: "Report & Performance",   desc: "Venduto per cliente, zona e prodotto. Confronto mese su mese per monitorare gli obiettivi." },
  { icon: "fa-bell",              color: "bg-rose-100 text-rose-700",      titolo: "Notifiche & Scadenze",   desc: "Avvisi su clienti da ricontattare, ordini in sospeso e provvigioni maturate. Mai più nulla di perso." },
];

const FAQ = [
  { q: "Funziona senza connessione internet?", a: "Sì — la modalità desktop funziona anche offline. Le modifiche vengono sincronizzate automaticamente quando ritorni online. La web app invece richiede connessione ma funziona su qualsiasi dispositivo." },
  { q: "Posso usarlo da smartphone durante le visite?", a: "Assolutamente. La web app è ottimizzata per smartphone e tablet. Puoi registrare ordini, note visita e spese direttamente sul posto, in tempo reale." },
  { q: "Il calcolo delle provvigioni è personalizzabile?", a: "Sì. Puoi configurare percentuali differenziate per cliente, prodotto o fascia di fatturato. Il sistema calcola tutto automaticamente a fine periodo." },
  { q: "Quanti clienti posso inserire?", a: "Nessun limite. Puoi inserire tutti i tuoi clienti, prospect e lead — con storico acquisti, note, referenti e geolocalizzazione." },
  { q: "Posso esportare gli ordini per inviarli alla mandante?", a: "Sì. Gli ordini sono esportabili in PDF ed Excel. Puoi anche configurare invio automatico via email alla casa mandante." },
  { q: "Cosa succede dopo la prova gratuita?", a: "Valuterai l'app con i tuoi clienti e dati reali. Se decidi di acquistare, paghi una tantum i 199€ di personalizzazione. Nessun abbonamento mensile obbligatorio." },
];

/* ─── Mockup screenshot Gestionale Agenti ─── */
function MockupAgenti() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white text-xs font-sans">
      {/* browser bar */}
      <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400"></span>
        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
        <span className="w-3 h-3 rounded-full bg-green-400"></span>
        <div className="flex-1 mx-3 bg-gray-700 rounded-full px-3 py-1 text-gray-300 text-xs">gestioneagenti.com</div>
      </div>
      {/* app layout */}
      <div className="flex h-64">
        {/* sidebar */}
        <div className="w-40 bg-orange-700 text-white p-3 flex flex-col gap-1 flex-shrink-0">
          <div className="text-white font-bold text-sm mb-3 px-1">AgentiPro</div>
          {[
            { icon: "fa-th-large", label: "Dashboard" },
            { icon: "fa-users", label: "Clienti" },
            { icon: "fa-file-invoice", label: "Ordini" },
            { icon: "fa-percent", label: "Provvigioni" },
            { icon: "fa-calendar", label: "Visite" },
            { icon: "fa-receipt", label: "Nota spese" },
          ].map((item, i) => (
            <div key={item.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${i === 0 ? "bg-white/20 font-semibold" : "opacity-70 hover:opacity-100"}`}>
              <i className={`fas ${item.icon} w-3 text-center`}></i>
              {item.label}
            </div>
          ))}
        </div>
        {/* main area */}
        <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
          <div className="font-bold text-gray-700 mb-3 text-sm">Dashboard — Maggio 2026</div>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Ordini mese", val: "47", color: "text-orange-600 bg-orange-50 border-orange-100" },
              { label: "Fatturato", val: "€23.4k", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { label: "Provvigioni", val: "€1.870", color: "text-amber-600 bg-amber-50 border-amber-100" },
            ].map(k => (
              <div key={k.label} className={`border rounded-xl p-2 ${k.color}`}>
                <div className="font-extrabold text-base">{k.val}</div>
                <div className="text-gray-400 text-[10px]">{k.label}</div>
              </div>
            ))}
          </div>
          {/* visite oggi */}
          <div className="bg-white rounded-xl border border-gray-100 p-2">
            <div className="font-semibold text-gray-600 mb-2 text-xs">Visite di oggi</div>
            {[
              { nome: "Ferramenta Rossi", ora: "09:00", stato: "Completata", color: "bg-green-100 text-green-700" },
              { nome: "Calzature Bianchi", ora: "11:30", stato: "In corso", color: "bg-orange-100 text-orange-700" },
              { nome: "Negozio Verde", ora: "15:00", stato: "Programmata", color: "bg-gray-100 text-gray-500" },
            ].map(v => (
              <div key={v.nome} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-[10px] w-10">{v.ora}</span>
                  <span className="text-gray-700 font-medium text-[11px]">{v.nome}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${v.color}`}>{v.stato}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mockup ordine mobile ─── */
function MockupMobile() {
  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-white text-xs font-sans w-48 mx-auto">
      <div className="bg-gray-800 py-1.5 flex justify-center">
        <div className="w-16 h-1.5 bg-gray-600 rounded-full"></div>
      </div>
      <div className="bg-orange-600 text-white p-3">
        <div className="font-bold text-sm">Nuovo ordine</div>
        <div className="text-orange-200 text-[10px]">Ferramenta Rossi s.n.c.</div>
      </div>
      <div className="p-3 space-y-2">
        {[
          { cod: "VT-001", nome: "Vite 6×80", qt: "100", pr: "€18,00" },
          { cod: "TR-220", nome: "Tassello Fischer", qt: "50", pr: "€12,50" },
          { cod: "AN-310", nome: "Ancora M10", qt: "30", pr: "€9,00" },
        ].map(p => (
          <div key={p.cod} className="flex justify-between items-center border-b border-gray-100 pb-1.5">
            <div>
              <div className="font-semibold text-gray-800 text-[11px]">{p.nome}</div>
              <div className="text-gray-400 text-[10px]">Qt: {p.qt}</div>
            </div>
            <div className="text-orange-600 font-bold text-[11px]">{p.pr}</div>
          </div>
        ))}
        <div className="bg-orange-600 text-white text-center rounded-xl py-2 font-bold text-[11px] mt-2">
          Invia ordine ✓
        </div>
      </div>
    </div>
  );
}

export default function AgentiPro() {
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
              className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
            >
              Richiedi la prova gratis
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-br from-orange-900 via-orange-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #f97316 0%, transparent 60%), radial-gradient(circle at 80% 20%, #ea580c 0%, transparent 50%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-700/50 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              <span className="text-sm font-semibold text-orange-200">Gestionale per agenti di commercio</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Gestisci la tua attività da <span className="text-orange-400">qualsiasi posto</span>.
            </h1>
            <p className="text-xl text-orange-100/80 mb-8 leading-relaxed">
              Clienti, ordini, provvigioni e visite in un unico gestionale. Pensato per chi lavora in mobilità.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setModalAperto(true)}
                className="inline-flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-2xl font-extrabold text-lg transition shadow-xl"
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
            <p className="mt-5 text-sm text-orange-200/60">
              <i className="fas fa-check mr-1 text-orange-400"></i> Nessun pagamento per la prova &nbsp;·&nbsp;
              <i className="fas fa-check mr-1 text-orange-400"></i> Configurato entro 24h
            </p>
          </div>
          {/* Mockup desktop nel hero */}
          <div className="hidden md:block">
            <MockupAgenti />
          </div>
        </div>
      </section>

      {/* ─── SETTORI TARGET ─── */}
      <section className="py-14 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600 mb-2">Pensato per</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Chi usa AgentiPro?</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {SETTORI.map((s) => (
              <div key={s.label} className={`flex items-center gap-2.5 ${s.color} px-5 py-3 rounded-2xl font-semibold text-sm`}>
                <i className={`fas ${s.icon}`}></i>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SCREENSHOT APP ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Come appare</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Interfaccia semplice,<br />pensata per chi è sempre in giro.</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Funziona nel browser e come app desktop — scegli tu come usarla.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <MockupAgenti />
              <p className="text-center text-xs text-gray-400 mt-3">Dashboard agente — versione browser / desktop</p>
            </div>
            <div className="space-y-5">
              {[
                { icon: "fa-map-location-dot", color: "text-orange-600 bg-orange-100", titolo: "Mappa clienti interattiva", desc: "Tutti i tuoi clienti su mappa. In un colpo d'occhio vedi chi è vicino a te, l'ultima visita fatta e quando ricontattarli." },
                { icon: "fa-mobile-screen", color: "text-amber-600 bg-amber-100", titolo: "Ordini direttamente in visita", desc: "Registra l'ordine mentre sei dal cliente. Catalogo prodotti, listini e disponibilità sempre aggiornati." },
                { icon: "fa-percent", color: "text-red-600 bg-red-100", titolo: "Provvigioni calcolate in automatico", desc: "Fine mese? Il report provvigioni è già pronto — per cliente, prodotto e mandante." },
              ].map(f => (
                <div key={f.titolo} className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${f.icon} text-lg`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{f.titolo}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* mobile mockup */}
          <div className="mt-16 grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1 space-y-5">
              {[
                { icon: "fa-route", color: "text-orange-600 bg-orange-100", titolo: "Pianifica il giro visite", desc: "Ottimizza il percorso tra i tuoi clienti. Aggiungi promemoria e priorità per non dimenticare nessuno." },
                { icon: "fa-receipt", color: "text-amber-600 bg-amber-100", titolo: "Nota spese in un tap", desc: "Registra chilometri, pedaggi e rimborsi direttamente dallo smartphone. Export PDF con un clic per la mandante." },
                { icon: "fa-wifi-slash", color: "text-slate-600 bg-slate-100", titolo: "Funziona anche offline", desc: "Zona senza segnale? Nessun problema. La modalità desktop lavora anche senza internet e si sincronizza appena torni connesso." },
              ].map(f => (
                <div key={f.titolo} className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${f.icon} text-lg`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{f.titolo}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div>
                <MockupMobile />
                <p className="text-center text-xs text-gray-400 mt-3">Versione mobile — ordine in visita</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WEB APP vs DESKTOP ─── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Come funziona</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Scegli come usarlo.<br /><span className="text-orange-600">Due modalità, un solo software.</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">Al momento dell'attivazione scegli una delle due modalità. Non è possibile usarle entrambe contemporaneamente.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-orange-200 rounded-3xl p-8 bg-gradient-to-br from-orange-50 to-white">
              <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mb-5">
                <i className="fas fa-globe text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Web App</h3>
              <p className="text-gray-500 mb-5">Apri il browser e sei operativo. Funziona su PC, tablet e smartphone — ideale per chi lavora su più dispositivi.</p>
              <ul className="space-y-2.5 mb-6">
                {["Accessibile da qualsiasi dispositivo", "Aggiornamenti automatici", "Dati sincronizzati in cloud", "Accesso anche da casa o in trasferta", "Più utenti in contemporanea"].map(v => (
                  <li key={v} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <i className="fas fa-check text-orange-500 mt-0.5 flex-shrink-0"></i> {v}
                  </li>
                ))}
              </ul>
              <div className="bg-orange-100 text-orange-800 text-xs font-semibold rounded-xl px-3 py-2 inline-block">
                <i className="fas fa-star mr-1"></i> Ideale per chi usa smartphone e tablet in visita
              </div>
            </div>
            <div className="border-2 border-slate-200 rounded-3xl p-8 bg-gradient-to-br from-slate-50 to-white">
              <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mb-5">
                <i className="fas fa-desktop text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">App Desktop</h3>
              <p className="text-gray-500 mb-5">Installa su Windows o macOS. Funziona anche senza connessione internet.</p>
              <ul className="space-y-2.5 mb-6">
                {["Funziona anche offline", "Installazione su un singolo PC", "Dati salvati in locale — più veloce", "Sincronizzazione automatica al rientro", "Compatibile con Windows 10/11 e macOS 12+"].map(v => (
                  <li key={v} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <i className="fas fa-check text-slate-500 mt-0.5 flex-shrink-0"></i> {v}
                  </li>
                ))}
              </ul>
              <div className="bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 inline-block">
                <i className="fas fa-info-circle mr-1"></i> Ideale per zone con segnale scarso
              </div>
            </div>
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
            <i className="fas fa-triangle-exclamation text-amber-500 text-xl flex-shrink-0 mt-0.5"></i>
            <p className="text-sm text-amber-800"><strong>Importante:</strong> le due modalità si escludono a vicenda. Non è possibile usare sia la web app che il client desktop con lo stesso account. Al momento dell'attivazione sceglierai quale preferisci.</p>
          </div>
        </div>
      </section>

      {/* ─── FUNZIONI ─── */}
      <section id="funzioni" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Funzionalità</span>
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

      {/* ─── 3 PASSI ─── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Processo</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Parti in 3 semplici passi</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "1", icon: "fa-paper-plane", titolo: "Richiedi la prova", desc: "Compila il form con i tuoi dati. Nessun pagamento richiesto." },
              { n: "2", icon: "fa-gear",         titolo: "Ti configuriamo l'account", desc: "Entro 24 ore ricevi le credenziali con l'app pronta con i tuoi clienti." },
              { n: "3", icon: "fa-rocket",       titolo: "Usi e decidi", desc: "Provi AgentiPro nel tuo lavoro quotidiano. Poi decidi liberamente se acquistare." },
            ].map((p) => (
              <div key={p.n} className="text-center">
                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
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
      <section className="py-16 bg-gradient-to-br from-orange-900 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block bg-orange-700/50 border border-orange-500/30 text-orange-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">Prezzo</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Semplice e trasparente.</h2>
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 mb-6 text-left">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <p className="text-orange-300 font-bold text-sm uppercase tracking-wider mb-1">Costo unico di personalizzazione</p>
                <p className="text-5xl font-extrabold">199<span className="text-2xl">€</span></p>
                <p className="text-white/50 text-sm mt-1">una tantum · IVA esclusa</p>
              </div>
              <div className="bg-orange-500/20 border border-orange-400/30 rounded-2xl px-5 py-3 text-orange-300 text-sm font-semibold">
                <i className="fas fa-gift mr-2"></i>Prova gratuita prima di pagare
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {["Configurazione con i tuoi dati aziendali", "Inserimento clienti e mandanti di partenza", "Logo e colori personalizzati", "Scelta modalità Web App o Desktop", "Formazione iniziale inclusa (videocall)", "Supporto tecnico per 30 giorni"].map(v => (
                <div key={v} className="flex items-start gap-2 text-sm text-white/80">
                  <i className="fas fa-check text-orange-400 mt-0.5 flex-shrink-0"></i> {v}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setModalAperto(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-2xl font-extrabold text-lg transition shadow-xl"
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
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINALE ─── */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Pronto a lavorare meglio?</h2>
          <p className="text-gray-500 mb-8 text-lg">Richiedi la prova gratuita. Ti configuriamo AgentiPro con i tuoi clienti e dati entro 24 ore — senza impegno.</p>
          <button
            onClick={() => setModalAperto(true)}
            className="inline-flex items-center gap-3 bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-2xl font-extrabold text-lg transition shadow-lg"
          >
            <i className="fas fa-paper-plane"></i>
            Richiedi la prova gratis
          </button>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span><i className="fas fa-check mr-1 text-orange-500"></i>Nessuna carta di credito</span>
            <span><i className="fas fa-check mr-1 text-orange-500"></i>Configurato entro 24h</span>
            <span><i className="fas fa-check mr-1 text-orange-500"></i>Supporto incluso</span>
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
            <a href="/gestionale360" className="hover:text-white transition">Gestionale360</a>
            <a href="/privacy.html" className="hover:text-white transition">Privacy</a>
            <a href="https://wa.me/393793602035" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition font-semibold">
              <i className="fab fa-whatsapp mr-1"></i>WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* WhatsApp fisso */}
      <a
        href="https://wa.me/393793602035?text=Ciao,%20vorrei%20informazioni%20su%20AgentiPro"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[10001] w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition"
        aria-label="WhatsApp"
      >
        <i className="fab fa-whatsapp text-2xl"></i>
      </a>

      {modalAperto && (
        <RichiestaGestionaleModal tipo="agentipro" onClose={() => setModalAperto(false)} />
      )}
    </div>
  );
}
