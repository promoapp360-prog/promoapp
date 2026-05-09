import { useState, useEffect } from "react";
import RichiestaGestionaleModal from "../components/RichiestaGestionaleModal";

const FAQ = [
  { q: "La prova è davvero gratuita?", a: "Sì, al 100%. Ti configuriamo un account con i tuoi dati reali — prodotti, categorie, clienti — e puoi usarlo liberamente per 15 giorni. Nessuna carta di credito richiesta." },
  { q: "Devo installare qualcosa?", a: "No. Funziona direttamente nel browser — apri la pagina e sei operativo. Se preferisci, esiste anche una versione desktop per Windows e Mac che funziona anche senza internet." },
  { q: "Quanto tempo ci vuole per iniziare?", a: "Entro 24 ore dalla richiesta ricevi le credenziali con il gestionale già pronto con i tuoi dati. Nessuna configurazione tecnica da parte tua." },
  { q: "Cosa succede dopo i 15 giorni?", a: "Decidi tu. Se ti ha convinto, paghi una tantum 199€ di personalizzazione completa — nessun abbonamento mensile. Se non fa per te, non paghi nulla." },
  { q: "Funziona su smartphone e tablet?", a: "Sì. È ottimizzato per tutti i dispositivi. Puoi usarlo dal PC in negozio, dallo smartphone per controllare il magazzino, o dal tablet alla cassa." },
  { q: "Devo sapere usare il computer?", a: "No. È progettato per chi vuole semplicità: pochi clic per le operazioni più comuni. Offriamo anche una videocall gratuita di formazione iniziale." },
];

/* ══════════════════════════════════════════
   MOCKUP SCREENSHOT REALISTICI
══════════════════════════════════════════ */

function ScreenDashboard() {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white font-sans select-none">
      {/* title bar */}
      <div className="bg-gray-900 px-3 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        <div className="flex-1 mx-2 bg-gray-700 rounded px-2 py-0.5 text-gray-400 text-[10px] truncate">app.gestionale360.com/dashboard</div>
      </div>
      <div className="flex" style={{ height: 280 }}>
        {/* sidebar */}
        <div className="w-32 bg-[#1a2e1a] text-white flex-shrink-0 flex flex-col py-3">
          <div className="px-3 mb-4">
            <span className="text-emerald-400 font-extrabold text-xs">Gestionale</span>
            <span className="text-white font-extrabold text-xs">360</span>
          </div>
          {[
            { icon: "fa-gauge-high", label: "Dashboard", active: true },
            { icon: "fa-boxes-stacked", label: "Magazzino", active: false },
            { icon: "fa-cash-register", label: "Cassa", active: false },
            { icon: "fa-users", label: "Clienti", active: false },
            { icon: "fa-truck", label: "Fornitori", active: false },
            { icon: "fa-chart-line", label: "Report", active: false },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-2 mx-2 px-2 py-1.5 rounded-lg mb-0.5 text-[10px] ${item.active ? "bg-emerald-600 text-white font-bold" : "text-gray-400"}`}>
              <i className={`fas ${item.icon} w-3 text-center text-[9px]`}></i>
              {item.label}
            </div>
          ))}
        </div>
        {/* main */}
        <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] font-extrabold text-gray-800">Buongiorno, Marco</div>
              <div className="text-[9px] text-gray-400">Lunedì 9 Maggio 2026</div>
            </div>
            <div className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Ferramenta Bianchi</div>
          </div>
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { label: "Incassato oggi", val: "€ 1.347", icon: "fa-euro-sign", color: "border-l-emerald-500 bg-white" },
              { label: "Scontrini", val: "28", icon: "fa-receipt", color: "border-l-blue-500 bg-white" },
              { label: "Ordini attivi", val: "6", icon: "fa-clipboard-list", color: "border-l-amber-500 bg-white" },
              { label: "Scorte basse", val: "3", icon: "fa-triangle-exclamation", color: "border-l-red-500 bg-white" },
            ].map(k => (
              <div key={k.label} className={`border-l-2 rounded-r-lg p-1.5 shadow-sm ${k.color}`}>
                <div className="text-[9px] text-gray-400 mb-0.5">{k.label}</div>
                <div className="text-sm font-extrabold text-gray-800">{k.val}</div>
              </div>
            ))}
          </div>
          {/* grafico bar simulato */}
          <div className="bg-white rounded-lg border border-gray-100 p-2 mb-2">
            <div className="text-[9px] font-semibold text-gray-500 mb-1.5">Vendite ultime 7 settimane (€)</div>
            <div className="flex items-end gap-1 h-12">
              {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className={`w-full rounded-t ${i === 6 ? "bg-emerald-500" : "bg-emerald-200"}`} style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
          </div>
          {/* alert scorta bassa */}
          <div className="bg-red-50 border border-red-100 rounded-lg p-1.5 flex items-center gap-1.5">
            <i className="fas fa-triangle-exclamation text-red-400 text-[9px]"></i>
            <span className="text-[9px] text-red-700 font-medium">3 prodotti stanno finendo — <span className="underline cursor-pointer">vedi magazzino</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenMagazzino() {
  const prodotti = [
    { cod: "FER-001", nome: "Vite 6×80 zincata", cat: "Viteria", giacenza: 42, min: 50, prezzo: "€0,18", stato: "low" },
    { cod: "FER-088", nome: "Tassello Fischer SX10", cat: "Ancoranti", giacenza: 180, min: 100, prezzo: "€0,35", stato: "ok" },
    { cod: "UTE-022", nome: "Cutter 18mm Stanley", cat: "Utensili", giacenza: 8, min: 15, prezzo: "€7,90", stato: "low" },
    { cod: "ELE-044", nome: "Cavo HO7RN-F 3×1,5", cat: "Elettrico", giacenza: 320, min: 50, prezzo: "€1,80/m", stato: "ok" },
    { cod: "COL-011", nome: "Colla vinilica 1kg", cat: "Collanti", giacenza: 6, min: 20, prezzo: "€6,50", stato: "low" },
  ];
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white font-sans select-none">
      <div className="bg-gray-900 px-3 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        <div className="flex-1 mx-2 bg-gray-700 rounded px-2 py-0.5 text-gray-400 text-[10px]">app.gestionale360.com/magazzino</div>
      </div>
      <div className="p-3 bg-gray-50" style={{ minHeight: 240 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-extrabold text-gray-800">Magazzino</div>
          <div className="flex gap-1">
            <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-[9px] text-gray-500 flex items-center gap-1"><i className="fas fa-search text-gray-300"></i> Cerca prodotto...</div>
            <div className="bg-emerald-600 text-white rounded-lg px-2 py-1 text-[9px] font-bold">+ Aggiungi</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="grid text-[9px] font-bold text-gray-400 uppercase bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "3rem 1fr 5rem 4rem 4rem 3rem" }}>
            <div className="px-2 py-1.5">Cod.</div>
            <div className="px-2 py-1.5">Prodotto</div>
            <div className="px-2 py-1.5">Categoria</div>
            <div className="px-2 py-1.5">Giacenza</div>
            <div className="px-2 py-1.5">Prezzo</div>
            <div className="px-2 py-1.5"></div>
          </div>
          {prodotti.map(p => (
            <div key={p.cod} className="grid border-b border-gray-50 hover:bg-emerald-50/40 text-[10px]" style={{ gridTemplateColumns: "3rem 1fr 5rem 4rem 4rem 3rem" }}>
              <div className="px-2 py-1.5 text-gray-400 font-mono text-[9px]">{p.cod}</div>
              <div className="px-2 py-1.5 font-semibold text-gray-800 truncate">{p.nome}</div>
              <div className="px-2 py-1.5 text-gray-400">{p.cat}</div>
              <div className={`px-2 py-1.5 font-bold ${p.stato === "low" ? "text-red-600" : "text-emerald-600"}`}>
                {p.giacenza} {p.stato === "low" && <i className="fas fa-arrow-down text-[8px]"></i>}
              </div>
              <div className="px-2 py-1.5 text-gray-600">{p.prezzo}</div>
              <div className="px-2 py-1.5 text-gray-300 text-[9px]"><i className="fas fa-ellipsis-v"></i></div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 text-[9px] text-red-600 font-semibold flex items-center gap-1">
          <i className="fas fa-triangle-exclamation"></i> 3 prodotti sotto scorta minima
        </div>
      </div>
    </div>
  );
}

function ScreenClienti() {
  const clienti = [
    { nome: "Rossi Mario", loc: "Roma (RM)", tot: "€3.240", ultime: "07/05/26", tag: "Frequente" },
    { nome: "Bianchi S.r.l.", loc: "Milano (MI)", tot: "€8.100", ultime: "06/05/26", tag: "Business" },
    { nome: "Condominio Verdi", loc: "Napoli (NA)", tot: "€980", ultime: "02/05/26", tag: "Privato" },
    { nome: "Elettro Sud", loc: "Bari (BA)", tot: "€5.500", ultime: "28/04/26", tag: "Business" },
    { nome: "Garage Ferrari", loc: "Torino (TO)", tot: "€1.670", ultime: "22/04/26", tag: "Privato" },
  ];
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white font-sans select-none">
      <div className="bg-gray-900 px-3 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        <div className="flex-1 mx-2 bg-gray-700 rounded px-2 py-0.5 text-gray-400 text-[10px]">app.gestionale360.com/clienti</div>
      </div>
      <div className="p-3 bg-gray-50" style={{ minHeight: 240 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-extrabold text-gray-800">Clienti <span className="text-gray-400 font-normal text-[9px] ml-1">247 totali</span></div>
          <div className="flex gap-1">
            <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-[9px] text-gray-500 flex items-center gap-1"><i className="fas fa-search text-gray-300"></i> Cerca...</div>
            <div className="bg-emerald-600 text-white rounded-lg px-2 py-1 text-[9px] font-bold">+ Nuovo cliente</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="grid text-[9px] font-bold text-gray-400 uppercase bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "1fr 5rem 4rem 5rem 4rem" }}>
            <div className="px-2 py-1.5">Nome</div>
            <div className="px-2 py-1.5">Località</div>
            <div className="px-2 py-1.5">Acquistato</div>
            <div className="px-2 py-1.5">Ultimo acq.</div>
            <div className="px-2 py-1.5">Tag</div>
          </div>
          {clienti.map(c => (
            <div key={c.nome} className="grid border-b border-gray-50 hover:bg-emerald-50/40 text-[10px]" style={{ gridTemplateColumns: "1fr 5rem 4rem 5rem 4rem" }}>
              <div className="px-2 py-1.5 font-semibold text-gray-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[8px] font-bold flex-shrink-0">{c.nome[0]}</span>
                <span className="truncate">{c.nome}</span>
              </div>
              <div className="px-2 py-1.5 text-gray-400 text-[9px]">{c.loc}</div>
              <div className="px-2 py-1.5 font-bold text-emerald-600">{c.tot}</div>
              <div className="px-2 py-1.5 text-gray-400 text-[9px]">{c.ultime}</div>
              <div className="px-2 py-1.5">
                <span className={`text-[8px] px-1 py-0.5 rounded font-semibold ${c.tag === "Business" ? "bg-blue-100 text-blue-700" : c.tag === "Frequente" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{c.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenOrdini() {
  const ordini = [
    { num: "#ORD-1042", cliente: "Rossi Mario", data: "09/05/26", totale: "€87,40", stato: "Completato", sc: "bg-emerald-100 text-emerald-700" },
    { num: "#ORD-1041", cliente: "Bianchi S.r.l.", data: "09/05/26", totale: "€340,00", stato: "In corso", sc: "bg-blue-100 text-blue-700" },
    { num: "#ORD-1040", cliente: "Elettro Sud", data: "08/05/26", totale: "€215,60", stato: "Completato", sc: "bg-emerald-100 text-emerald-700" },
    { num: "#ORD-1039", cliente: "Condominio Verdi", data: "08/05/26", totale: "€58,00", stato: "In attesa", sc: "bg-amber-100 text-amber-700" },
    { num: "#ORD-1038", cliente: "Garage Ferrari", data: "07/05/26", totale: "€126,80", stato: "Completato", sc: "bg-emerald-100 text-emerald-700" },
  ];
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white font-sans select-none">
      <div className="bg-gray-900 px-3 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        <div className="flex-1 mx-2 bg-gray-700 rounded px-2 py-0.5 text-gray-400 text-[10px]">app.gestionale360.com/ordini</div>
      </div>
      <div className="p-3 bg-gray-50" style={{ minHeight: 240 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-extrabold text-gray-800">Ordini</div>
          <div className="bg-emerald-600 text-white rounded-lg px-2 py-1 text-[9px] font-bold">+ Nuovo ordine</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="grid text-[9px] font-bold text-gray-400 uppercase bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: "4rem 1fr 5rem 5rem 5rem" }}>
            <div className="px-2 py-1.5">N°</div>
            <div className="px-2 py-1.5">Cliente</div>
            <div className="px-2 py-1.5">Data</div>
            <div className="px-2 py-1.5">Totale</div>
            <div className="px-2 py-1.5">Stato</div>
          </div>
          {ordini.map(o => (
            <div key={o.num} className="grid border-b border-gray-50 hover:bg-emerald-50/40 text-[10px]" style={{ gridTemplateColumns: "4rem 1fr 5rem 5rem 5rem" }}>
              <div className="px-2 py-1.5 text-gray-400 font-mono text-[9px]">{o.num}</div>
              <div className="px-2 py-1.5 font-semibold text-gray-800">{o.cliente}</div>
              <div className="px-2 py-1.5 text-gray-400 text-[9px]">{o.data}</div>
              <div className="px-2 py-1.5 font-bold text-gray-700">{o.totale}</div>
              <div className="px-2 py-1.5"><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${o.sc}`}>{o.stato}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenStatistiche() {
  const mesi = ["Gen", "Feb", "Mar", "Apr", "Mag"];
  const vals = [62, 78, 55, 91, 85];
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white font-sans select-none">
      <div className="bg-gray-900 px-3 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        <div className="flex-1 mx-2 bg-gray-700 rounded px-2 py-0.5 text-gray-400 text-[10px]">app.gestionale360.com/report</div>
      </div>
      <div className="p-3 bg-gray-50" style={{ minHeight: 240 }}>
        <div className="text-[11px] font-extrabold text-gray-800 mb-2">Report & Statistiche — 2026</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Fatturato anno", val: "€ 58.240", trend: "+12%", up: true },
            { label: "Clienti attivi", val: "247", trend: "+8%", up: true },
            { label: "Prodotti venduti", val: "3.841", trend: "+5%", up: true },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-lg border border-gray-100 p-2">
              <div className="text-[9px] text-gray-400">{k.label}</div>
              <div className="text-sm font-extrabold text-gray-800">{k.val}</div>
              <div className={`text-[9px] font-semibold ${k.up ? "text-emerald-600" : "text-red-500"}`}>{k.trend} vs anno prec.</div>
            </div>
          ))}
        </div>
        {/* bar chart */}
        <div className="bg-white rounded-lg border border-gray-100 p-2">
          <div className="text-[9px] font-semibold text-gray-500 mb-2">Fatturato mensile 2026 (€k)</div>
          <div className="flex items-end gap-2 h-16">
            {vals.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="text-[8px] text-gray-500">{Math.round(h * 1.1)}k</div>
                <div className={`w-full rounded-t ${i === vals.length - 1 ? "bg-emerald-500" : "bg-emerald-200"}`} style={{ height: `${h}%` }}></div>
                <div className="text-[8px] text-gray-400">{mesi[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPALE
══════════════════════════════════════════ */
export default function Gestionale360() {
  const [modalAperto, setModalAperto] = useState(false);
  const [faqAperta, setFaqAperta] = useState<number | null>(null);
  const [schermataAttiva, setSchermataAttiva] = useState<"dashboard" | "magazzino" | "clienti" | "ordini" | "statistiche">("dashboard");
  const [licenze, setLicenze] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/gestionale/contatore").then(r => r.ok ? r.json() : null).then(d => { if (d) setLicenze(d.licenze); }).catch(() => {});

  }, []);

  function apriModale() {
    (window as any).fbq?.("track", "Lead");
    setModalAperto(true);
  }

  const schermate = [
    { id: "dashboard", label: "Dashboard", icon: "fa-gauge-high" },
    { id: "magazzino", label: "Magazzino", icon: "fa-boxes-stacked" },
    { id: "clienti", label: "Clienti", icon: "fa-users" },
    { id: "ordini", label: "Ordini", icon: "fa-clipboard-list" },
    { id: "statistiche", label: "Statistiche", icon: "fa-chart-line" },
  ] as const;

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══ NAVBAR ══ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-lg font-extrabold tracking-tight flex-shrink-0">
            Promo<span className="text-emerald-500">App</span>.it
          </a>
          <button
            onClick={() => apriModale()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
          >
            Prova gratis 15 giorni
          </button>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section className="bg-gradient-to-b from-[#0d2318] to-[#0f2e1e] text-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8 md:pt-16 md:pb-10">
          {/* badge */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 bg-emerald-600/30 border border-emerald-500/30 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-300">Prova gratuita 15 giorni · Attivazione in 24h</span>
            </div>
          </div>
          {/* headline */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-center leading-tight mb-4 text-white">
            Il gestionale semplice per<br className="hidden md:block" />
            <span className="text-emerald-400"> negozi e attività locali</span>
          </h1>
          <p className="text-center text-base md:text-lg text-emerald-100/70 max-w-xl mx-auto mb-8">
            Magazzino, clienti, ordini e fornitori in un'unica piattaforma semplice da usare.<br className="hidden md:block" /> Nessuna installazione. Funziona subito.
          </p>
          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-3">
            <button
              onClick={() => apriModale()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-extrabold text-lg transition shadow-2xl"
            >
              <i className="fas fa-play-circle text-xl"></i>
              Prova gratis 15 giorni
            </button>
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border-2 border-white/25 hover:border-white/50 text-white px-8 py-4 rounded-2xl font-bold text-base transition"
            >
              <i className="fas fa-desktop text-base"></i>
              Guarda la demo
            </a>
          </div>
          <p className="text-center text-xs text-emerald-300/50">
            <i className="fas fa-check mr-1 text-emerald-400"></i>Nessuna carta di credito &nbsp;·&nbsp;
            <i className="fas fa-check mr-1 text-emerald-400"></i>Nessuna installazione &nbsp;·&nbsp;
            <i className="fas fa-check mr-1 text-emerald-400"></i>Attivazione immediata
          </p>
          <p className="text-center text-sm text-emerald-200/60 mt-2">
            Dopo la prova: <span className="text-white font-bold">199€ una tantum</span> · nessun abbonamento
          </p>
          {/* Badge licenze rimaste */}
          {licenze !== null && (
            <div className="flex justify-center mt-4">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-full px-4 py-1.5 text-xs font-bold animate-pulse">
                <i className="fas fa-bolt text-amber-400"></i>
                Solo {licenze} licenze disponibili a questo prezzo
              </div>
            </div>
          )}
          {/* hero screenshot */}
          <div className="mt-10 max-w-4xl mx-auto">
            <ScreenDashboard />
          </div>
        </div>
      </section>

      {/* ══ PROBLEMI DEL CLIENTE ══ */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Ti riconosci in qualcuna di queste situazioni?</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { prefix: "fab", icon: "fa-whatsapp",   iconColor: "text-green-500 bg-green-50",  testo: "Ordini sparsi su WhatsApp e difficili da ritrovare?" },
              { prefix: "fas", icon: "fa-box",         iconColor: "text-orange-500 bg-orange-50", testo: "Magazzino difficile da tenere aggiornato?" },
              { prefix: "fas", icon: "fa-table",       iconColor: "text-blue-500 bg-blue-50",    testo: "Clienti e fornitori gestiti su fogli Excel?" },
              { prefix: "fas", icon: "fa-clock",       iconColor: "text-red-500 bg-red-50",      testo: "Troppo tempo perso tra app diverse?" },
            ].map(p => (
              <div key={p.testo} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-xl ${p.iconColor} flex items-center justify-center flex-shrink-0`}>
                  <i className={`${p.prefix} ${p.icon} text-lg`}></i>
                </div>
                <p className="font-semibold text-gray-700 text-sm">{p.testo}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-6 text-sm">
            Gestionale360 risolve tutto questo in un unico posto. <strong className="text-emerald-700">Semplice da usare dal primo giorno.</strong>
          </p>
        </div>
      </section>

      {/* ══ DEMO SCHERMATE ══ */}
      <section id="demo" className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Demo</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Sfoglia le schermate reali</h2>
            <p className="text-gray-500 mt-2 text-sm">Clicca su ogni sezione per vedere come appare il gestionale</p>
          </div>
          {/* tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {schermate.map(s => (
              <button
                key={s.id}
                onClick={() => setSchermataAttiva(s.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${schermataAttiva === s.id ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <i className={`fas ${s.icon} text-xs`}></i>
                {s.label}
              </button>
            ))}
          </div>
          <div className="transition-all">
            {schermataAttiva === "dashboard"    && <ScreenDashboard />}
            {schermataAttiva === "magazzino"    && <ScreenMagazzino />}
            {schermataAttiva === "clienti"      && <ScreenClienti />}
            {schermataAttiva === "ordini"       && <ScreenOrdini />}
            {schermataAttiva === "statistiche"  && <ScreenStatistiche />}
          </div>

        </div>
      </section>

      {/* ══ BENEFICI (benefit-led, non tecnico) ══ */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Cosa ottieni</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Quello che cambia dal primo giorno</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "fa-eye",              color: "bg-emerald-100 text-emerald-700", titolo: "Controlli subito cosa sta finendo", desc: "Scorte basse? Il sistema ti avvisa in tempo reale. Niente più rimanenze a sorpresa o prodotti esauriti." },
              { icon: "fa-bolt",             color: "bg-amber-100 text-amber-700",    titolo: "Trovi clienti e fornitori in pochi secondi", desc: "Tutto in un posto: storico acquisti, note, contatti. Basta cercare tra mille fogli e WhatsApp." },
              { icon: "fa-cash-register",    color: "bg-blue-100 text-blue-700",      titolo: "Registri una vendita in 10 secondi", desc: "Cassa intuitiva: selezioni il prodotto, segni la quantità, emetti lo scontrino. Finito." },
              { icon: "fa-chart-simple",     color: "bg-rose-100 text-rose-700",      titolo: "Sai esattamente quanto hai guadagnato", desc: "Report giornaliero, settimanale, mensile. Sempre aggiornato, sempre a portata di mano." },
              { icon: "fa-truck-fast",       color: "bg-purple-100 text-purple-700",  titolo: "Non dimentichi mai un ordine fornitore", desc: "Gestisci gli ordini d'acquisto direttamente dal gestionale. La merce arriva e il magazzino si aggiorna da solo." },
              { icon: "fa-mobile-screen",    color: "bg-teal-100 text-teal-700",      titolo: "Accedi da qualsiasi dispositivo", desc: "PC in negozio, tablet alla cassa, smartphone a casa. Funziona tutto, senza installare nulla." },
            ].map(f => (
              <div key={f.titolo} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                  <i className={`fas ${f.icon}`}></i>
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm mb-1.5 leading-snug">{f.titolo}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SCREENSHOT PRODOTTO — layout alternato ══ */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 space-y-16">

          {/* blocco 1 — magazzino */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Magazzino</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-3">Vedi cosa sta per finire<br />prima che finisca davvero.</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">Ogni prodotto ha una soglia minima. Quando le scorte scendono sotto, il gestionale ti avvisa subito — così non ti fai cogliere impreparato.</p>
              <ul className="space-y-2">
                {["Avvisi automatici per scorte basse", "Filtro per categoria, fornitore o giacenza", "Aggiunta prodotti con barcode o codice interno", "Storico movimenti entrata/uscita"].map(v => (
                  <li key={v} className="flex items-start gap-2 text-sm text-gray-700">
                    <i className="fas fa-check text-emerald-500 mt-0.5 flex-shrink-0 text-xs"></i>{v}
                  </li>
                ))}
              </ul>
            </div>
            <ScreenMagazzino />
          </div>

          {/* blocco 2 — clienti */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-1 md:order-2">
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Clienti</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-3">Trovi ogni cliente<br />in meno di 3 secondi.</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">Niente più rubrica telefonica o Excel. Hai tutto: storico acquisti, indirizzo, note, quanto ha speso nel tempo.</p>
              <ul className="space-y-2">
                {["Ricerca per nome, telefono o città", "Storico completo degli acquisti", "Tag clienti (business, privato, frequente)", "Invio offerte e promemoria via email"].map(v => (
                  <li key={v} className="flex items-start gap-2 text-sm text-gray-700">
                    <i className="fas fa-check text-emerald-500 mt-0.5 flex-shrink-0 text-xs"></i>{v}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-2 md:order-1">
              <ScreenClienti />
            </div>
          </div>

          {/* blocco 3 — ordini */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Ordini & Cassa</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-3">Zero ordini dimenticati.<br />Zero confusione.</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">Ogni vendita viene registrata automaticamente. Stato dell'ordine sempre aggiornato — completato, in corso, in attesa.</p>
              <ul className="space-y-2">
                {["Cassa veloce con ricerca prodotto istantanea", "Emissione scontrino o ricevuta in un clic", "Storico ordini filtrabili per data o cliente", "Export in PDF o Excel"].map(v => (
                  <li key={v} className="flex items-start gap-2 text-sm text-gray-700">
                    <i className="fas fa-check text-emerald-500 mt-0.5 flex-shrink-0 text-xs"></i>{v}
                  </li>
                ))}
              </ul>
            </div>
            <ScreenOrdini />
          </div>

        </div>
      </section>

      {/* ══ 3 PASSI ══ */}
      <section className="py-12 bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Sei operativo in 3 passi</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "1", icon: "fa-paper-plane", titolo: "Richiedi la prova gratis", desc: "Compila il form. Nessuna carta di credito, nessun contratto. Solo un indirizzo email." },
              { n: "2", icon: "fa-gear",        titolo: "Riceivi l'account pronto", desc: "Entro 24h ti configuriamo il gestionale con i tuoi dati: prodotti, clienti, categorie." },
              { n: "3", icon: "fa-store",       titolo: "Usi dal primo giorno", desc: "Apri il browser e sei operativo. Supporto incluso per qualsiasi domanda." },
            ].map(p => (
              <div key={p.n} className="text-center">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <i className={`fas ${p.icon} text-white text-lg`}></i>
                </div>
                <div className="text-5xl font-extrabold text-emerald-100 select-none leading-none mb-2">{p.n}</div>
                <h3 className="font-extrabold text-gray-900 mb-1.5">{p.titolo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA CENTRALE ══ */}
      <section className="py-12 bg-emerald-700 text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-2xl md:text-3xl font-extrabold mb-2">Inizia gratis oggi.</div>
          <p className="text-emerald-100/80 text-sm mb-6">15 giorni di prova. Configurato con i tuoi dati. Nessun impegno.</p>
          <button
            onClick={() => apriModale()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-emerald-700 px-10 py-4 rounded-2xl font-extrabold text-lg hover:bg-emerald-50 transition shadow-xl"
          >
            <i className="fas fa-play-circle"></i>
            Prova gratis 15 giorni
          </button>
          <p className="mt-3 text-xs text-emerald-200/60">Nessuna carta · Nessuna installazione · Attivazione in 24h</p>
        </div>
      </section>

      {/* ══ PREZZO ══ */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5">Prezzo</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">Paghi una volta sola. Per sempre.</h2>
          <p className="text-gray-500 text-sm mb-8">Nessun abbonamento mensile, nessun costo nascosto. Il gestionale è tuo.</p>
          <div className="border-2 border-emerald-200 rounded-2xl p-8 text-left max-w-md mx-auto bg-emerald-50 shadow-md">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-extrabold text-emerald-700">199€</span>
              <span className="text-sm text-gray-400">una tantum · IVA esclusa</span>
            </div>
            <div className="text-xs text-gray-400 mb-4">Licenza a vita — zero canone mensile</div>
            <div className="space-y-1.5">
              {["Configurazione completa con i tuoi dati", "Logo e colori personalizzati", "Videocall di formazione inclusa", "30 giorni di supporto tecnico"].map(v => (
                <div key={v} className="flex items-start gap-2 text-sm text-gray-700">
                  <i className="fas fa-check text-emerald-500 mt-0.5 flex-shrink-0 text-xs"></i>{v}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Se dopo i 15 giorni non ti convince, non paghi nulla. Punto.</p>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Domande frequenti</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <button
                  className="w-full text-left flex items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-800 text-sm hover:bg-gray-50 transition"
                  onClick={() => setFaqAperta(faqAperta === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <i className={`fas fa-chevron-down text-gray-400 flex-shrink-0 transition-transform text-xs ${faqAperta === i ? "rotate-180" : ""}`}></i>
                </button>
                {faqAperta === i && (
                  <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINALE ══ */}
      <section className="py-14 bg-gradient-to-b from-[#0d2318] to-[#0f2e1e] text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Pronto a semplificare il tuo negozio?</h2>
          <p className="text-emerald-100/60 text-sm mb-7">Richiedi la prova gratis. Nessun impegno, nessuna carta di credito.</p>
          <button
            onClick={() => apriModale()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-extrabold text-lg transition shadow-2xl"
          >
            <i className="fas fa-play-circle text-xl"></i>
            Prova gratis 15 giorni
          </button>
          <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-emerald-300/50">
            <span><i className="fas fa-check mr-1 text-emerald-400"></i>Nessuna carta</span>
            <span><i className="fas fa-check mr-1 text-emerald-400"></i>Nessuna installazione</span>
            <span><i className="fas fa-check mr-1 text-emerald-400"></i>Attivazione in 24h</span>
          </div>
        </div>
      </section>

      {/* ══ FOOTER MINIMAL ══ */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>Promo<span className="text-emerald-400">App</span>.it · Sophia 2005 S.r.l. · P.IVA 08223951008</span>
          <div className="flex gap-4">
            <a href="/" className="hover:text-white transition">Home</a>
            <a href="/privacy.html" className="hover:text-white transition">Privacy</a>
            <a href="https://wa.me/393793602035" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 font-semibold transition">
              <i className="fab fa-whatsapp mr-1"></i>WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* ══ WHATSAPP FISSO ══ */}
      <a
        href="https://wa.me/393793602035?text=Ciao,%20vorrei%20una%20demo%20di%20Gestionale360"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[10001] flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition group"
        aria-label="WhatsApp"
      >
        <i className="fab fa-whatsapp text-2xl"></i>
        <span className="text-sm font-bold hidden group-hover:inline transition-all">Scrivici su WhatsApp</span>
      </a>

      {modalAperto && (
        <RichiestaGestionaleModal tipo="gestionale360" onClose={() => setModalAperto(false)} />
      )}
    </div>
  );
}
