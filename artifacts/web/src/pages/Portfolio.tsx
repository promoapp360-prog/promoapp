import { Link } from "wouter";

type App = {
  img: string;
  name: string;
  city: string;
  sector: string;
  color: string;
};

const APPS: App[] = [
  { img: "/lavori/dentista.png", name: "Studio Marchetti Odontoiatria", city: "Milano", sector: "Dentista", color: "#0284c7" },
  { img: "/lavori/estetica-aurora.png", name: "Aurora Hair & Beauty", city: "Roma", sector: "Parrucchiera", color: "#db2777" },
  { img: "/lavori/pizzeria-mario.png", name: "Pizzeria L'Antico Forno", city: "Napoli", sector: "Pizzeria", color: "#dc2626" },
  { img: "/lavori/palestra-fitzone.png", name: "Iron Lab", city: "Torino", sector: "CrossFit", color: "#7c3aed" },
  { img: "/lavori/autofficina.png", name: "Autofficina Delfino", city: "Bologna", sector: "Meccanico", color: "#ea580c" },
  { img: "/lavori/centro-medico.png", name: "Poliambulatorio MediCare", city: "Firenze", sector: "Poliambulatorio", color: "#0891b2" },
  { img: "/lavori/barbiere.png", name: "Oldsmith Barbershop", city: "Milano", sector: "Barbiere", color: "#92400e" },
  { img: "/lavori/ristorante-gusto.png", name: "Osteria del Borgo Antico", city: "Verona", sector: "Ristorante", color: "#b91c1c" },
  { img: "/lavori/pasticceria.png", name: "Pasticceria Fiordilatte", city: "Palermo", sector: "Pasticceria", color: "#e11d48" },
  { img: "/lavori/legale.png", name: "De Luca & Partners", city: "Napoli", sector: "Studio Legale", color: "#334155" },
  { img: "/lavori/immobiliare.png", name: "Domus Real Estate", city: "Roma", sector: "Immobiliare", color: "#0d9488" },
  { img: "/lavori/yoga.png", name: "Inhale Yoga Studio", city: "Bologna", sector: "Yoga", color: "#059669" },
  { img: "/lavori/boutique.png", name: "Atelier Ventidue", city: "Milano", sector: "Boutique", color: "#c026d3" },
  { img: "/lavori/veterinario.png", name: "Clinica San Francesco", city: "Padova", sector: "Veterinario", color: "#0284c7" },
  { img: "/lavori/glow.png", name: "Glow Beauty Studio", city: "Genova", sector: "Estetica", color: "#db2777" },
  { img: "/lavori/bella-napoli.png", name: "Bella Napoli", city: "Napoli", sector: "Pizza delivery", color: "#f97316" },
  { img: "/lavori/hotel.png", name: "Hotel Mareblu", city: "Rimini", sector: "Hotel 4★", color: "#4f46e5" },
  { img: "/lavori/ottica.png", name: "Ottica Carraro", city: "Catania", sector: "Ottica", color: "#1d4ed8" },
  { img: "/lavori/lavanderia.png", name: "Lavafast Express", city: "Brescia", sector: "Lavanderia", color: "#0891b2" },
  { img: "/lavori/asilo.png", name: "Asilo Nido Il Girotondo", city: "Firenze", sector: "Asilo nido", color: "#ca8a04" },
];

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white">
      {/* Nav */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-2xl font-extrabold gradient-text">PromoApp.it</Link>
          <Link
            href="/#contatti"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition"
          >
            Richiedi preventivo
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-4 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-6">
          <i className="fas fa-arrow-left"></i> Torna alla home
        </Link>
        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Portfolio Lavori
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Tutte le App che abbiamo <span className="text-indigo-600">realizzato</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          20 progetti reali, ognuno costruito su misura per il proprio settore.
          <br />
          <strong className="text-gray-700">Logo, schermate e funzioni</strong> diversi per ogni attività.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8 text-xs">
          <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-700"><i className="fas fa-check-circle text-emerald-500 mr-1"></i> 20 app realizzate</span>
          <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-700"><i className="fas fa-map-marker-alt text-rose-500 mr-1"></i> 12 città italiane</span>
          <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-700"><i className="fas fa-star text-amber-500 mr-1"></i> Tutti pubblicati su iOS e Android</span>
        </div>
      </section>

      {/* Grid completa */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-12">
            {APPS.map((app, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className="w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 transform transition duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                  <img
                    src={app.img}
                    alt={`Mockup app ${app.name}`}
                    loading="lazy"
                    className="w-full h-auto block"
                  />
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
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            La prossima App in questa lista <br />può essere la <span className="text-yellow-300">tua</span>
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Raccontaci la tua attività: ti prepariamo un progetto personalizzato gratis e senza impegno.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/#contatti"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-8 py-4 rounded-xl font-extrabold shadow-xl hover:scale-105 transition transform"
            >
              <i className="fas fa-rocket"></i>
              Richiedi un preventivo
            </Link>
            <a
              href="https://wa.me/393793602035"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold transition"
            >
              <i className="fab fa-whatsapp"></i>
              Scrivici su WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p>© 2025 PromoApp.it · Sophia 2005 S.r.l. · P.IVA 08223951008</p>
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <Link href="/" className="hover:text-white">Home</Link>
          <a href="/privacy.html" className="hover:text-white">Privacy</a>
          <a href="/cookie.html" className="hover:text-white">Cookie</a>
        </div>
      </footer>
    </div>
  );
}
