type Template = "booking" | "menu" | "catalog" | "services";

type App = {
  name: string;
  city: string;
  sector: string;
  template: Template;
  color: string;
  bg: string;
  icon: string;
  items: { a: string; b: string; c?: string }[];
};

const APPS: App[] = [
  {
    name: "Studio Dentistico Rossi",
    city: "Milano",
    sector: "Dentista",
    template: "booking",
    color: "#0ea5e9",
    bg: "from-sky-500 to-cyan-500",
    icon: "fa-tooth",
    items: [
      { a: "09:00", b: "Marco Bianchi", c: "Pulizia denti" },
      { a: "10:30", b: "Lucia Verdi", c: "Visita controllo" },
      { a: "15:00", b: "Anna Russo", c: "Otturazione" },
    ],
  },
  {
    name: "Salone Aurora",
    city: "Roma",
    sector: "Estetica",
    template: "booking",
    color: "#ec4899",
    bg: "from-pink-500 to-rose-500",
    icon: "fa-spa",
    items: [
      { a: "10:00", b: "Giulia M.", c: "Manicure gel" },
      { a: "11:30", b: "Sara P.", c: "Pulizia viso" },
      { a: "16:00", b: "Elena C.", c: "Massaggio" },
    ],
  },
  {
    name: "Pizzeria Da Mario",
    city: "Napoli",
    sector: "Ristorante",
    template: "menu",
    color: "#dc2626",
    bg: "from-red-500 to-orange-500",
    icon: "fa-pizza-slice",
    items: [
      { a: "Margherita DOP", b: "Pomodoro, mozzarella di bufala", c: "8,50€" },
      { a: "Diavola", b: "Salame piccante, mozzarella", c: "9,00€" },
      { a: "Capricciosa", b: "Funghi, prosciutto, carciofi", c: "10,50€" },
    ],
  },
  {
    name: "Palestra FitZone",
    city: "Torino",
    sector: "Fitness",
    template: "booking",
    color: "#7c3aed",
    bg: "from-violet-600 to-purple-600",
    icon: "fa-dumbbell",
    items: [
      { a: "18:00", b: "Spinning", c: "12 posti" },
      { a: "19:00", b: "CrossFit", c: "8 posti" },
      { a: "20:00", b: "Yoga Flow", c: "15 posti" },
    ],
  },
  {
    name: "Autofficina Bianchi",
    city: "Bologna",
    sector: "Meccanico",
    template: "services",
    color: "#ea580c",
    bg: "from-orange-500 to-amber-500",
    icon: "fa-car-side",
    items: [
      { a: "Tagliando completo", b: "Olio, filtri e controllo", c: "fa-oil-can" },
      { a: "Cambio gomme", b: "Stagionale + bilanciatura", c: "fa-circle-notch" },
      { a: "Revisione", b: "Prenota in 1 click", c: "fa-clipboard-check" },
    ],
  },
  {
    name: "Centro Medico Sanus",
    city: "Firenze",
    sector: "Medico",
    template: "booking",
    color: "#0891b2",
    bg: "from-cyan-600 to-teal-600",
    icon: "fa-stethoscope",
    items: [
      { a: "09:30", b: "Dott. Ferri", c: "Cardiologia" },
      { a: "11:00", b: "Dott.ssa Galli", c: "Dermatologia" },
      { a: "14:30", b: "Dott. Conti", c: "Ortopedia" },
    ],
  },
  {
    name: "Barber Old Style",
    city: "Milano",
    sector: "Barbiere",
    template: "booking",
    color: "#b45309",
    bg: "from-amber-700 to-yellow-700",
    icon: "fa-cut",
    items: [
      { a: "10:00", b: "Andrea R.", c: "Taglio + barba" },
      { a: "11:30", b: "Luca M.", c: "Taglio classico" },
      { a: "17:00", b: "Paolo D.", c: "Rasatura" },
    ],
  },
  {
    name: "Ristorante Il Gusto",
    city: "Verona",
    sector: "Ristorante",
    template: "menu",
    color: "#b91c1c",
    bg: "from-red-600 to-rose-600",
    icon: "fa-utensils",
    items: [
      { a: "Tagliatelle al ragù", b: "Pasta fresca, ragù 8h", c: "12,00€" },
      { a: "Bistecca alla Fiorentina", b: "Manzo Chianina, 1kg", c: "45,00€" },
      { a: "Tiramisù della casa", b: "Ricetta tradizionale", c: "6,00€" },
    ],
  },
  {
    name: "Pasticceria Dolci Sapori",
    city: "Palermo",
    sector: "Bar",
    template: "menu",
    color: "#e11d48",
    bg: "from-rose-500 to-pink-500",
    icon: "fa-birthday-cake",
    items: [
      { a: "Cannolo siciliano", b: "Ricotta fresca, scaglie", c: "2,50€" },
      { a: "Cassata classica", b: "Dolce della tradizione", c: "4,00€" },
      { a: "Granita al limone", b: "Limoni di Sicilia", c: "3,00€" },
    ],
  },
  {
    name: "Studio Legale Esposito",
    city: "Napoli",
    sector: "Legale",
    template: "services",
    color: "#475569",
    bg: "from-slate-700 to-gray-700",
    icon: "fa-balance-scale",
    items: [
      { a: "Diritto civile", b: "Cause e mediazione", c: "fa-gavel" },
      { a: "Diritto del lavoro", b: "Tutela dipendenti", c: "fa-briefcase" },
      { a: "Recupero crediti", b: "Pratiche rapide", c: "fa-file-invoice-dollar" },
    ],
  },
  {
    name: "Immobiliare Casa Mia",
    city: "Roma",
    sector: "Immobiliare",
    template: "catalog",
    color: "#0d9488",
    bg: "from-teal-600 to-emerald-600",
    icon: "fa-home",
    items: [
      { a: "Trilocale Prati", b: "85mq, 2° piano", c: "320.000€" },
      { a: "Bilocale Trastevere", b: "60mq, ristrutturato", c: "245.000€" },
      { a: "Attico EUR", b: "120mq, terrazzo", c: "550.000€" },
    ],
  },
  {
    name: "Yoga Studio Zen",
    city: "Bologna",
    sector: "Fitness",
    template: "booking",
    color: "#059669",
    bg: "from-emerald-500 to-green-500",
    icon: "fa-leaf",
    items: [
      { a: "08:00", b: "Hatha Yoga", c: "10 posti" },
      { a: "12:30", b: "Vinyasa Flow", c: "12 posti" },
      { a: "19:00", b: "Meditazione", c: "20 posti" },
    ],
  },
  {
    name: "Boutique Eleganza",
    city: "Milano",
    sector: "Negozio",
    template: "catalog",
    color: "#c026d3",
    bg: "from-fuchsia-600 to-pink-600",
    icon: "fa-shopping-bag",
    items: [
      { a: "Abito di seta", b: "Collezione P/E 2026", c: "189€" },
      { a: "Borsa pelle", b: "Made in Italy", c: "245€" },
      { a: "Décolleté nude", b: "Tacco 8cm", c: "135€" },
    ],
  },
  {
    name: "Veterinario Amico Fido",
    city: "Padova",
    sector: "Veterinario",
    template: "booking",
    color: "#0284c7",
    bg: "from-sky-600 to-blue-600",
    icon: "fa-paw",
    items: [
      { a: "10:00", b: "Luna (Labrador)", c: "Vaccino annuale" },
      { a: "11:30", b: "Micio (Gatto)", c: "Visita controllo" },
      { a: "16:30", b: "Rocky (Beagle)", c: "Toelettatura" },
    ],
  },
  {
    name: "Centro Estetico Glow",
    city: "Genova",
    sector: "Estetica",
    template: "menu",
    color: "#db2777",
    bg: "from-pink-600 to-fuchsia-500",
    icon: "fa-magic",
    items: [
      { a: "Massaggio rilassante", b: "60 minuti, oli essenziali", c: "55€" },
      { a: "Pulizia viso pro", b: "Trattamento completo", c: "45€" },
      { a: "Pedicure SPA", b: "Bagno, scrub, smalto", c: "35€" },
    ],
  },
  {
    name: "Bella Napoli al Taglio",
    city: "Napoli",
    sector: "Pizzeria",
    template: "menu",
    color: "#f97316",
    bg: "from-orange-500 to-red-500",
    icon: "fa-fire",
    items: [
      { a: "Pizza Marinara", b: "Tradizionale napoletana", c: "5,00€" },
      { a: "Focaccia Genovese", b: "Olio e sale grosso", c: "3,50€" },
      { a: "Calzone fritto", b: "Ricotta e salame", c: "6,00€" },
    ],
  },
  {
    name: "Hotel Marina",
    city: "Rimini",
    sector: "Hotel",
    template: "catalog",
    color: "#4f46e5",
    bg: "from-indigo-600 to-blue-600",
    icon: "fa-hotel",
    items: [
      { a: "Camera Vista Mare", b: "Matrimoniale + balcone", c: "120€/notte" },
      { a: "Suite Famiglia", b: "4 persone, idromassaggio", c: "210€/notte" },
      { a: "Camera Standard", b: "Singola comfort", c: "75€/notte" },
    ],
  },
  {
    name: "Ottica Vision",
    city: "Catania",
    sector: "Negozio",
    template: "catalog",
    color: "#1d4ed8",
    bg: "from-blue-700 to-indigo-700",
    icon: "fa-glasses",
    items: [
      { a: "Ray-Ban Aviator", b: "Lenti polarizzate", c: "159€" },
      { a: "Occhiali da vista", b: "Montatura titanio", c: "245€" },
      { a: "Lenti a contatto", b: "Confezione mensile", c: "29€" },
    ],
  },
  {
    name: "Pulito Veloce",
    city: "Brescia",
    sector: "Lavanderia",
    template: "services",
    color: "#0891b2",
    bg: "from-cyan-500 to-sky-500",
    icon: "fa-tshirt",
    items: [
      { a: "Lavaggio capi", b: "Ritiro a domicilio", c: "fa-truck" },
      { a: "Stireria express", b: "Pronta in 24h", c: "fa-bolt" },
      { a: "Tappeti & tendaggi", b: "Pulizia profonda", c: "fa-couch" },
    ],
  },
  {
    name: "Asilo Nido Girotondo",
    city: "Firenze",
    sector: "Educazione",
    template: "services",
    color: "#ca8a04",
    bg: "from-yellow-500 to-amber-500",
    icon: "fa-child",
    items: [
      { a: "Diario quotidiano", b: "Foto e attività del giorno", c: "fa-camera" },
      { a: "Comunicazioni", b: "Avvisi alle famiglie", c: "fa-bell" },
      { a: "Menu settimanale", b: "Pranzi e merende", c: "fa-apple-alt" },
    ],
  },
];

function PhoneMockup({ app }: { app: App }) {
  return (
    <div className="relative mx-auto w-full max-w-[170px]">
      {/* Cornice del telefono */}
      <div className="bg-gray-900 rounded-[2rem] p-1.5 shadow-xl">
        <div className="bg-white rounded-[1.6rem] overflow-hidden">
          {/* Status bar */}
          <div className="flex justify-between items-center px-3 pt-1.5 pb-0.5 text-[8px] text-gray-700 font-semibold">
            <span>9:41</span>
            <span className="flex items-center gap-0.5">
              <i className="fas fa-signal"></i>
              <i className="fas fa-wifi"></i>
              <i className="fas fa-battery-three-quarters"></i>
            </span>
          </div>
          {/* Header */}
          <div className={`bg-gradient-to-br ${app.bg} px-3 py-2.5 text-white`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 bg-white/25 rounded-md flex items-center justify-center">
                <i className={`fas ${app.icon} text-[8px]`}></i>
              </div>
              <span className="font-bold text-[9px] truncate">{app.name}</span>
            </div>
            <p className="text-[8px] opacity-90">
              {app.template === "booking" && "Prossimi appuntamenti"}
              {app.template === "menu" && "Il nostro menu"}
              {app.template === "catalog" && "Le nostre proposte"}
              {app.template === "services" && "I nostri servizi"}
            </p>
          </div>
          {/* Content */}
          <div className="px-2 py-2 space-y-1.5 min-h-[170px] bg-gray-50">
            {app.items.map((it, i) => (
              <div key={i} className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100">
                {app.template === "booking" && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                      style={{ background: app.color }}
                    >
                      {it.a}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold text-gray-800 truncate">{it.b}</p>
                      <p className="text-[8px] text-gray-400 truncate">{it.c}</p>
                    </div>
                  </div>
                )}
                {app.template === "menu" && (
                  <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold text-gray-800 truncate">{it.a}</p>
                      <p className="text-[8px] text-gray-400 truncate">{it.b}</p>
                    </div>
                    <span className="text-[9px] font-bold shrink-0" style={{ color: app.color }}>
                      {it.c}
                    </span>
                  </div>
                )}
                {app.template === "catalog" && (
                  <div>
                    <div
                      className="h-8 rounded-md mb-1 flex items-center justify-center text-white"
                      style={{ background: app.color }}
                    >
                      <i className={`fas ${app.icon} text-[10px] opacity-50`}></i>
                    </div>
                    <p className="text-[9px] font-semibold text-gray-800 truncate">{it.a}</p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[8px] text-gray-400 truncate">{it.b}</p>
                      <span className="text-[8px] font-bold shrink-0" style={{ color: app.color }}>
                        {it.c}
                      </span>
                    </div>
                  </div>
                )}
                {app.template === "services" && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ background: app.color }}
                    >
                      <i className={`fas ${it.c} text-[8px]`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold text-gray-800 truncate">{it.a}</p>
                      <p className="text-[8px] text-gray-400 truncate">{it.b}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Bottom tab bar */}
          <div className="flex justify-around items-center py-1.5 bg-white border-t border-gray-100">
            <i className="fas fa-home text-[10px]" style={{ color: app.color }}></i>
            <i className="fas fa-calendar text-[10px] text-gray-300"></i>
            <i className="fas fa-bell text-[10px] text-gray-300"></i>
            <i className="fas fa-user text-[10px] text-gray-300"></i>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LavoriSvolti() {
  return (
    <section id="lavori" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Portfolio
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Alcuni dei nostri <span className="text-indigo-600">lavori svolti</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Ogni App è progettata su misura per il cliente: design, contenuti e funzioni cambiano in base al settore e alle esigenze.
            Ecco un assaggio di quello che abbiamo realizzato.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
          {APPS.map((app, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className="transform transition group-hover:-translate-y-1 group-hover:scale-105">
                <PhoneMockup app={app} />
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-gray-800 leading-tight">{app.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  {app.city} · {app.sector}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA finale */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Vuoi vedere la <strong>tua attività</strong> in questa lista?</p>
          <a
            href="#contatti"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-bold shadow-md hover:scale-105 transition transform"
          >
            <i className="fas fa-rocket"></i>
            Realizza la tua App
          </a>
        </div>
      </div>
    </section>
  );
}
