type Template = "booking" | "menu" | "catalog" | "services";

type BookingItem = { time: string; name: string; service: string; status: "ok" | "wait" | "new"; initials: string; avatar: string };
type MenuItem = { emoji: string; name: string; desc: string; price: string; old?: string; tag?: string };
type CatalogItem = { title: string; sub: string; price: string; gradient: string; emoji: string; fav?: boolean };
type ServiceItem = { icon: string; title: string; sub: string; badge?: string };

type App = {
  name: string;
  shortName: string;
  city: string;
  sector: string;
  template: Template;
  color: string;
  headerBg: string;
  icon: string;
  time: string;
  notifications?: number;
  stats: { label: string; value: string }[];
  greeting: string;
  booking?: BookingItem[];
  menu?: MenuItem[];
  catalog?: CatalogItem[];
  services?: ServiceItem[];
};

const APPS: App[] = [
  {
    name: "Studio Dentistico Rossi",
    shortName: "Dr. Rossi",
    city: "Milano",
    sector: "Dentista",
    template: "booking",
    color: "#0284c7",
    headerBg: "from-sky-500 via-cyan-500 to-blue-500",
    icon: "fa-tooth",
    time: "09:32",
    notifications: 3,
    greeting: "Ciao Dr. Rossi 👋",
    stats: [{ label: "Oggi", value: "8" }, { label: "Settimana", value: "47" }],
    booking: [
      { time: "09:00", name: "Marco Bianchi", service: "Pulizia", status: "ok", initials: "MB", avatar: "#3b82f6" },
      { time: "10:30", name: "Lucia Verdi", service: "Controllo", status: "ok", initials: "LV", avatar: "#ec4899" },
      { time: "14:00", name: "Anna Russo", service: "Otturazione", status: "wait", initials: "AR", avatar: "#10b981" },
    ],
  },
  {
    name: "Salone Aurora",
    shortName: "Aurora Beauty",
    city: "Roma",
    sector: "Estetica",
    template: "booking",
    color: "#db2777",
    headerBg: "from-pink-500 via-rose-500 to-fuchsia-500",
    icon: "fa-spa",
    time: "10:14",
    notifications: 5,
    greeting: "Buongiorno Aurora ✨",
    stats: [{ label: "Oggi", value: "12" }, { label: "Incassi", value: "€340" }],
    booking: [
      { time: "10:00", name: "Giulia M.", service: "Manicure gel", status: "ok", initials: "GM", avatar: "#f43f5e" },
      { time: "11:30", name: "Sara P.", service: "Pulizia viso", status: "new", initials: "SP", avatar: "#a855f7" },
      { time: "16:00", name: "Elena C.", service: "Massaggio 60'", status: "ok", initials: "EC", avatar: "#f97316" },
    ],
  },
  {
    name: "Pizzeria Da Mario",
    shortName: "Da Mario",
    city: "Napoli",
    sector: "Ristorante",
    template: "menu",
    color: "#dc2626",
    headerBg: "from-red-500 via-orange-500 to-amber-500",
    icon: "fa-pizza-slice",
    time: "12:48",
    notifications: 2,
    greeting: "Il nostro menu",
    stats: [{ label: "Pizze", value: "24" }, { label: "Asporto", value: "20'" }],
    menu: [
      { emoji: "🍕", name: "Margherita DOP", desc: "Pomodoro San Marzano, mozzarella di bufala", price: "8,50€", tag: "Top" },
      { emoji: "🌶️", name: "Diavola", desc: "Salame piccante calabrese, mozzarella", price: "9,00€" },
      { emoji: "🍅", name: "Capricciosa", desc: "Funghi, prosciutto cotto, carciofi, olive", price: "10,50€" },
    ],
  },
  {
    name: "Palestra FitZone",
    shortName: "FitZone",
    city: "Torino",
    sector: "Fitness",
    template: "booking",
    color: "#7c3aed",
    headerBg: "from-violet-600 via-purple-600 to-indigo-600",
    icon: "fa-dumbbell",
    time: "17:25",
    notifications: 1,
    greeting: "Corsi di oggi 💪",
    stats: [{ label: "Iscritti", value: "248" }, { label: "Live ora", value: "32" }],
    booking: [
      { time: "18:00", name: "Spinning", service: "Coach: Luca · 12 posti", status: "wait", initials: "🚴", avatar: "#8b5cf6" },
      { time: "19:00", name: "CrossFit", service: "Coach: Anna · 8 posti", status: "ok", initials: "🏋️", avatar: "#ef4444" },
      { time: "20:00", name: "Yoga Flow", service: "Coach: Sara · 15 posti", status: "ok", initials: "🧘", avatar: "#10b981" },
    ],
  },
  {
    name: "Autofficina Bianchi",
    shortName: "Bianchi Auto",
    city: "Bologna",
    sector: "Meccanico",
    template: "services",
    color: "#ea580c",
    headerBg: "from-orange-500 via-red-500 to-rose-500",
    icon: "fa-car-side",
    time: "08:47",
    notifications: 4,
    greeting: "Lavori in corso 🔧",
    stats: [{ label: "In officina", value: "6" }, { label: "Pronte", value: "3" }],
    services: [
      { icon: "fa-oil-can", title: "Tagliando completo", sub: "Olio, filtri, controllo 30 punti", badge: "Da 89€" },
      { icon: "fa-tire", title: "Cambio gomme", sub: "Stagionale + bilanciatura", badge: "Da 45€" },
      { icon: "fa-clipboard-check", title: "Revisione ministeriale", sub: "Prenotazione in 1 click", badge: "79€" },
    ],
  },
  {
    name: "Centro Medico Sanus",
    shortName: "Sanus",
    city: "Firenze",
    sector: "Medico",
    template: "booking",
    color: "#0891b2",
    headerBg: "from-teal-500 via-cyan-600 to-sky-600",
    icon: "fa-stethoscope",
    time: "11:08",
    notifications: 7,
    greeting: "Visite di oggi",
    stats: [{ label: "Pazienti", value: "1.2k" }, { label: "Specialisti", value: "9" }],
    booking: [
      { time: "09:30", name: "Dott. Ferri", service: "Cardiologia", status: "ok", initials: "DF", avatar: "#0ea5e9" },
      { time: "11:00", name: "Dott.ssa Galli", service: "Dermatologia", status: "new", initials: "DG", avatar: "#14b8a6" },
      { time: "15:30", name: "Dott. Conti", service: "Ortopedia", status: "ok", initials: "DC", avatar: "#6366f1" },
    ],
  },
  {
    name: "Barber Old Style",
    shortName: "Old Style",
    city: "Milano",
    sector: "Barbiere",
    template: "booking",
    color: "#92400e",
    headerBg: "from-amber-700 via-yellow-700 to-orange-800",
    icon: "fa-cut",
    time: "16:42",
    notifications: 2,
    greeting: "La tua agenda 💈",
    stats: [{ label: "Oggi", value: "14" }, { label: "Clienti VIP", value: "32" }],
    booking: [
      { time: "16:00", name: "Andrea R.", service: "Taglio + barba", status: "ok", initials: "AR", avatar: "#b45309" },
      { time: "17:30", name: "Luca M.", service: "Taglio classico", status: "ok", initials: "LM", avatar: "#92400e" },
      { time: "18:30", name: "Paolo D.", service: "Rasatura tradizionale", status: "wait", initials: "PD", avatar: "#a16207" },
    ],
  },
  {
    name: "Ristorante Il Gusto",
    shortName: "Il Gusto",
    city: "Verona",
    sector: "Ristorante",
    template: "menu",
    color: "#b91c1c",
    headerBg: "from-rose-600 via-red-600 to-orange-600",
    icon: "fa-utensils",
    time: "20:13",
    notifications: 3,
    greeting: "Menu della sera",
    stats: [{ label: "Tavoli", value: "18/24" }, { label: "Coperto", value: "€3" }],
    menu: [
      { emoji: "🍝", name: "Tagliatelle al ragù", desc: "Pasta fresca, ragù 8 ore", price: "12€", tag: "Chef" },
      { emoji: "🥩", name: "Bistecca Fiorentina", desc: "Manzo Chianina, 1kg", price: "45€" },
      { emoji: "🍰", name: "Tiramisù della casa", desc: "Ricetta della nonna", price: "6€" },
    ],
  },
  {
    name: "Pasticceria Dolci Sapori",
    shortName: "Dolci Sapori",
    city: "Palermo",
    sector: "Pasticceria",
    template: "menu",
    color: "#e11d48",
    headerBg: "from-pink-400 via-rose-500 to-red-500",
    icon: "fa-birthday-cake",
    time: "07:54",
    notifications: 1,
    greeting: "Le specialità di oggi",
    stats: [{ label: "Prodotti", value: "32" }, { label: "Fresco", value: "✓" }],
    menu: [
      { emoji: "🥐", name: "Cornetto siciliano", desc: "Crema di pistacchio di Bronte", price: "1,80€" },
      { emoji: "🍰", name: "Cassata classica", desc: "Ricotta, canditi, pasta reale", price: "4,00€", tag: "DOP" },
      { emoji: "🍋", name: "Granita al limone", desc: "Limoni di Sicilia IGP", price: "3,00€" },
    ],
  },
  {
    name: "Studio Legale Esposito",
    shortName: "Avv. Esposito",
    city: "Napoli",
    sector: "Legale",
    template: "services",
    color: "#334155",
    headerBg: "from-slate-700 via-gray-700 to-zinc-800",
    icon: "fa-balance-scale",
    time: "10:23",
    notifications: 8,
    greeting: "Le tue pratiche",
    stats: [{ label: "Aperte", value: "47" }, { label: "Scadenze", value: "3" }],
    services: [
      { icon: "fa-gavel", title: "Diritto civile", sub: "Cause, mediazione, risarcimenti", badge: "12 attive" },
      { icon: "fa-briefcase", title: "Diritto del lavoro", sub: "Tutela dipendenti e contratti", badge: "8 attive" },
      { icon: "fa-file-invoice-dollar", title: "Recupero crediti", sub: "Decreti ingiuntivi rapidi", badge: "5 attive" },
    ],
  },
  {
    name: "Immobiliare Casa Mia",
    shortName: "Casa Mia",
    city: "Roma",
    sector: "Immobiliare",
    template: "catalog",
    color: "#0d9488",
    headerBg: "from-teal-500 via-emerald-500 to-green-600",
    icon: "fa-home",
    time: "15:37",
    notifications: 12,
    greeting: "Nuove proposte 🏡",
    stats: [{ label: "In vendita", value: "84" }, { label: "Visite oggi", value: "6" }],
    catalog: [
      { title: "Trilocale Prati", sub: "85mq · 2° piano · ristrutturato", price: "320.000€", gradient: "from-teal-300 to-emerald-400", emoji: "🏛️", fav: true },
      { title: "Bilocale Trastevere", sub: "60mq · vista cortile interno", price: "245.000€", gradient: "from-amber-300 to-orange-400", emoji: "🏠" },
      { title: "Attico EUR", sub: "120mq · terrazzo 40mq", price: "550.000€", gradient: "from-sky-300 to-indigo-400", emoji: "🌆", fav: true },
    ],
  },
  {
    name: "Yoga Studio Zen",
    shortName: "Zen Yoga",
    city: "Bologna",
    sector: "Fitness",
    template: "booking",
    color: "#059669",
    headerBg: "from-emerald-400 via-green-500 to-teal-500",
    icon: "fa-leaf",
    time: "07:18",
    notifications: 2,
    greeting: "Namasté 🙏",
    stats: [{ label: "Iscritti", value: "156" }, { label: "Lezioni", value: "8" }],
    booking: [
      { time: "08:00", name: "Hatha Yoga", service: "Sara · Sala A", status: "ok", initials: "🧘", avatar: "#10b981" },
      { time: "12:30", name: "Vinyasa Flow", service: "Marco · Sala B", status: "ok", initials: "🌿", avatar: "#059669" },
      { time: "19:00", name: "Meditazione", service: "Luna · Sala Zen", status: "new", initials: "🕉️", avatar: "#0d9488" },
    ],
  },
  {
    name: "Boutique Eleganza",
    shortName: "Eleganza",
    city: "Milano",
    sector: "Negozio",
    template: "catalog",
    color: "#c026d3",
    headerBg: "from-fuchsia-500 via-pink-500 to-rose-500",
    icon: "fa-shopping-bag",
    time: "14:52",
    notifications: 9,
    greeting: "Nuovi arrivi 👗",
    stats: [{ label: "Articoli", value: "240" }, { label: "Carrello", value: "3" }],
    catalog: [
      { title: "Abito di seta", sub: "Collezione P/E 2026", price: "189€", gradient: "from-pink-300 to-rose-400", emoji: "👗", fav: true },
      { title: "Borsa pelle italiana", sub: "Made in Italy · 100% pelle", price: "245€", gradient: "from-fuchsia-300 to-purple-400", emoji: "👜" },
      { title: "Décolleté nude", sub: "Tacco 8cm · pelle scamosciata", price: "135€", gradient: "from-amber-200 to-pink-300", emoji: "👠", fav: true },
    ],
  },
  {
    name: "Veterinario Amico Fido",
    shortName: "Amico Fido",
    city: "Padova",
    sector: "Veterinario",
    template: "booking",
    color: "#0284c7",
    headerBg: "from-sky-400 via-blue-500 to-indigo-500",
    icon: "fa-paw",
    time: "13:05",
    notifications: 4,
    greeting: "Visite di oggi 🐾",
    stats: [{ label: "Pazienti", value: "8" }, { label: "Vaccini", value: "3" }],
    booking: [
      { time: "10:00", name: "Luna", service: "Labrador · Vaccino", status: "ok", initials: "🐕", avatar: "#0ea5e9" },
      { time: "11:30", name: "Micio", service: "Gatto · Controllo", status: "ok", initials: "🐈", avatar: "#f59e0b" },
      { time: "16:30", name: "Rocky", service: "Beagle · Toelettatura", status: "wait", initials: "🐶", avatar: "#8b5cf6" },
    ],
  },
  {
    name: "Centro Estetico Glow",
    shortName: "Glow",
    city: "Genova",
    sector: "Estetica",
    template: "menu",
    color: "#db2777",
    headerBg: "from-rose-400 via-pink-500 to-fuchsia-500",
    icon: "fa-magic",
    time: "11:36",
    notifications: 3,
    greeting: "Trattamenti del mese ✨",
    stats: [{ label: "Promo", value: "4" }, { label: "Fidelity", value: "★★★" }],
    menu: [
      { emoji: "💆‍♀️", name: "Massaggio rilassante 60'", desc: "Oli essenziali biologici", price: "55€", old: "75€", tag: "-25%" },
      { emoji: "✨", name: "Pulizia viso PRO", desc: "Estrazione + maschera vit.C", price: "45€" },
      { emoji: "💅", name: "Pedicure SPA", desc: "Bagno, scrub, smalto gel", price: "35€" },
    ],
  },
  {
    name: "Bella Napoli Pizza",
    shortName: "Bella Napoli",
    city: "Napoli",
    sector: "Pizzeria",
    template: "menu",
    color: "#f97316",
    headerBg: "from-yellow-400 via-orange-500 to-red-500",
    icon: "fa-fire",
    time: "13:21",
    notifications: 6,
    greeting: "Pizza al taglio 🔥",
    stats: [{ label: "Asporto", value: "10'" }, { label: "Domicilio", value: "✓" }],
    menu: [
      { emoji: "🍕", name: "Marinara tradizionale", desc: "Pomodoro, aglio, origano, olio EVO", price: "5,00€" },
      { emoji: "🥖", name: "Focaccia genovese", desc: "Olio extravergine, sale grosso", price: "3,50€" },
      { emoji: "🥟", name: "Calzone fritto", desc: "Ricotta, salame piccante", price: "6,00€", tag: "Top" },
    ],
  },
  {
    name: "Hotel Marina Rimini",
    shortName: "Hotel Marina",
    city: "Rimini",
    sector: "Hotel",
    template: "catalog",
    color: "#4f46e5",
    headerBg: "from-blue-500 via-indigo-600 to-violet-600",
    icon: "fa-hotel",
    time: "16:08",
    notifications: 5,
    greeting: "Le nostre camere 🌊",
    stats: [{ label: "Camere", value: "42" }, { label: "Disponibili", value: "8" }],
    catalog: [
      { title: "Vista Mare Premium", sub: "Matrimoniale + balcone fronte mare", price: "120€", gradient: "from-cyan-300 to-blue-500", emoji: "🌊", fav: true },
      { title: "Suite Famiglia", sub: "4 persone, idromassaggio", price: "210€", gradient: "from-indigo-300 to-purple-500", emoji: "🛁" },
      { title: "Standard Comfort", sub: "Singola, scrivania, smart TV", price: "75€", gradient: "from-amber-200 to-orange-400", emoji: "🛏️" },
    ],
  },
  {
    name: "Ottica Vision",
    shortName: "Ottica Vision",
    city: "Catania",
    sector: "Negozio",
    template: "catalog",
    color: "#1d4ed8",
    headerBg: "from-blue-600 via-indigo-700 to-slate-800",
    icon: "fa-glasses",
    time: "17:54",
    notifications: 2,
    greeting: "Le novità eyewear 👓",
    stats: [{ label: "Brand", value: "28" }, { label: "Sale", value: "-30%" }],
    catalog: [
      { title: "Ray-Ban Aviator Classic", sub: "Lenti polarizzate G-15", price: "159€", gradient: "from-amber-300 to-orange-500", emoji: "🕶️", fav: true },
      { title: "Occhiali da vista", sub: "Montatura titanio leggerissima", price: "245€", gradient: "from-slate-300 to-blue-400", emoji: "👓" },
      { title: "Lenti a contatto Acuvue", sub: "Confezione mensile · 6pz", price: "29€", gradient: "from-cyan-200 to-teal-400", emoji: "👁️" },
    ],
  },
  {
    name: "Pulito Veloce",
    shortName: "Pulito Veloce",
    city: "Brescia",
    sector: "Lavanderia",
    template: "services",
    color: "#0891b2",
    headerBg: "from-cyan-400 via-sky-500 to-blue-500",
    icon: "fa-tshirt",
    time: "09:14",
    notifications: 6,
    greeting: "I nostri servizi 🧺",
    stats: [{ label: "In lavaggio", value: "23" }, { label: "Pronti", value: "11" }],
    services: [
      { icon: "fa-truck", title: "Ritiro a domicilio", sub: "Gratis sopra i 30€", badge: "GRATIS" },
      { icon: "fa-bolt", title: "Stireria express", sub: "Pronto in 24h, lavaggio incluso", badge: "24h" },
      { icon: "fa-couch", title: "Tappeti & tendaggi", sub: "Pulizia profonda professionale", badge: "Pro" },
    ],
  },
  {
    name: "Asilo Girotondo",
    shortName: "Girotondo",
    city: "Firenze",
    sector: "Educazione",
    template: "services",
    color: "#ca8a04",
    headerBg: "from-yellow-400 via-amber-400 to-orange-400",
    icon: "fa-child",
    time: "08:23",
    notifications: 14,
    greeting: "Buongiorno mamma! 👶",
    stats: [{ label: "Bambini", value: "32" }, { label: "Educatori", value: "6" }],
    services: [
      { icon: "fa-camera", title: "Diario quotidiano", sub: "Foto e attività della giornata", badge: "Nuove" },
      { icon: "fa-bell", title: "Comunicazioni", sub: "Avvisi e circolari ai genitori", badge: "3" },
      { icon: "fa-apple-alt", title: "Menu settimanale", sub: "Pranzi e merende equilibrati" },
    ],
  },
];

function StatusBadge({ status, color }: { status: "ok" | "wait" | "new"; color: string }) {
  if (status === "ok") return <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">OK</span>;
  if (status === "wait") return <span className="text-[7px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">In attesa</span>;
  return <span className="text-[7px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: color }}>NEW</span>;
}

function PhoneMockup({ app }: { app: App }) {
  return (
    <div className="relative mx-auto w-full max-w-[180px]">
      {/* Cornice del telefono */}
      <div className="bg-gray-900 rounded-[2.2rem] p-[3px] shadow-2xl ring-1 ring-black/20">
        <div className="bg-white rounded-[2rem] overflow-hidden relative">
          {/* Status bar con notch (Dynamic Island) */}
          <div className="relative bg-white pt-1.5 pb-1 px-3 flex justify-between items-center text-[8px] font-bold text-gray-900">
            <span>{app.time}</span>
            {/* Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 w-10 h-3 bg-black rounded-full"></div>
            <span className="flex items-center gap-0.5">
              <i className="fas fa-signal text-[7px]"></i>
              <i className="fas fa-wifi text-[7px]"></i>
              <i className="fas fa-battery-three-quarters text-[8px]"></i>
            </span>
          </div>

          {/* Header */}
          <div className={`bg-gradient-to-br ${app.headerBg} px-3 pt-2.5 pb-3 text-white relative overflow-hidden`}>
            {/* decorazione */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full"></div>
            <div className="absolute -right-6 top-6 w-10 h-10 bg-white/5 rounded-full"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 bg-white/25 backdrop-blur rounded-md flex items-center justify-center shrink-0">
                  <i className={`fas ${app.icon} text-[9px]`}></i>
                </div>
                <span className="font-bold text-[9px] truncate">{app.shortName}</span>
              </div>
              {app.notifications && (
                <div className="relative">
                  <i className="fas fa-bell text-[9px]"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] font-bold rounded-full w-3 h-3 flex items-center justify-center">{app.notifications}</span>
                </div>
              )}
            </div>
            <p className="text-[8px] opacity-95 mt-1.5 relative truncate">{app.greeting}</p>
            {/* Stats pills */}
            <div className="flex gap-1 mt-1.5 relative">
              {app.stats.map((s, i) => (
                <div key={i} className="bg-white/20 backdrop-blur rounded-md px-1.5 py-0.5 flex-1">
                  <p className="text-[6px] opacity-80 leading-none">{s.label}</p>
                  <p className="text-[9px] font-bold leading-tight">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-2 py-2 space-y-1.5 min-h-[140px] bg-gray-50">
            {app.booking?.map((it, i) => (
              <div key={i} className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{ background: it.avatar }}>
                  {it.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[8px] font-semibold text-gray-800 truncate">{it.name}</p>
                    <span className="text-[7px] text-gray-400 shrink-0">{it.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-[7px] text-gray-400 truncate">{it.service}</p>
                    <StatusBadge status={it.status} color={app.color} />
                  </div>
                </div>
              </div>
            ))}

            {app.menu?.map((it, i) => (
              <div key={i} className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 flex items-center gap-1.5">
                <div className="w-8 h-8 bg-gray-50 rounded-md flex items-center justify-center text-base shrink-0">{it.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-[8px] font-semibold text-gray-800 truncate">{it.name}</p>
                    {it.tag && <span className="text-[6px] font-bold text-white px-1 py-0.5 rounded" style={{ background: app.color }}>{it.tag}</span>}
                  </div>
                  <p className="text-[7px] text-gray-400 truncate leading-tight">{it.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  {it.old && <p className="text-[6px] text-gray-300 line-through">{it.old}</p>}
                  <p className="text-[8px] font-bold" style={{ color: app.color }}>{it.price}</p>
                </div>
              </div>
            ))}

            {app.catalog?.map((it, i) => (
              <div key={i} className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 flex items-center gap-1.5">
                <div className={`w-9 h-9 rounded-md bg-gradient-to-br ${it.gradient} flex items-center justify-center text-base shrink-0 shadow-inner`}>
                  {it.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-semibold text-gray-800 truncate">{it.title}</p>
                  <p className="text-[7px] text-gray-400 truncate leading-tight">{it.sub}</p>
                  <p className="text-[8px] font-bold mt-0.5" style={{ color: app.color }}>{it.price}</p>
                </div>
                <i className={`fas fa-heart text-[8px] shrink-0 ${it.fav ? "text-rose-500" : "text-gray-200"}`}></i>
              </div>
            ))}

            {app.services?.map((it, i) => (
              <div key={i} className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0" style={{ background: app.color }}>
                  <i className={`fas ${it.icon} text-[9px]`}></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[8px] font-semibold text-gray-800 truncate">{it.title}</p>
                    {it.badge && <span className="text-[6px] font-bold px-1 py-0.5 rounded shrink-0" style={{ background: `${app.color}15`, color: app.color }}>{it.badge}</span>}
                  </div>
                  <p className="text-[7px] text-gray-400 truncate leading-tight">{it.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom tab bar con home indicator */}
          <div className="bg-white border-t border-gray-100">
            <div className="flex justify-around items-center py-1.5">
              <i className="fas fa-home text-[10px]" style={{ color: app.color }}></i>
              <i className="fas fa-calendar-alt text-[10px] text-gray-300"></i>
              <i className="fas fa-comment-dots text-[10px] text-gray-300"></i>
              <i className="fas fa-user text-[10px] text-gray-300"></i>
            </div>
            {/* iOS home indicator */}
            <div className="flex justify-center pb-1">
              <div className="w-10 h-0.5 bg-gray-900 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LavoriSvolti() {
  return (
    <section id="lavori" className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Portfolio
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Alcune App che abbiamo <span className="text-indigo-600">realizzato</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Ogni App è progettata su misura per il cliente: design, contenuti e funzioni cambiano in base al settore.
            Ecco un assaggio del nostro lavoro.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-10">
          {APPS.map((app, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className="transform transition duration-300 group-hover:-translate-y-2 group-hover:scale-[1.03]">
                <PhoneMockup app={app} />
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs font-bold text-gray-800 leading-tight">{app.name}</p>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <i className="fas fa-map-marker-alt text-[8px]"></i>
                  {app.city}
                  <span className="text-gray-300">·</span>
                  <span className="font-medium" style={{ color: app.color }}>{app.sector}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA finale */}
        <div className="mt-16 text-center">
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
