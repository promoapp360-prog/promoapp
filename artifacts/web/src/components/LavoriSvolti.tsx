import { Link } from "wouter";

type App = {
  img: string;
  name: string;
  sector: string;
};

const APPS: App[] = [
  { img: "/lavori/dentista.png", name: "Studio Marchetti", sector: "Dentista · Milano" },
  { img: "/lavori/pizzeria-mario.png", name: "L'Antico Forno", sector: "Pizzeria · Napoli" },
  { img: "/lavori/palestra-fitzone.png", name: "Iron Lab", sector: "CrossFit · Torino" },
  { img: "/lavori/immobiliare.png", name: "Domus Real Estate", sector: "Immobiliare · Roma" },
  { img: "/lavori/boutique.png", name: "Atelier Ventidue", sector: "Boutique · Milano" },
  { img: "/lavori/hotel.png", name: "Hotel Mareblu", sector: "Hotel · Rimini" },
  { img: "/lavori/autofficina.png", name: "Autofficina Delfino", sector: "Meccanico · Bologna" },
  { img: "/lavori/yoga.png", name: "Inhale Yoga", sector: "Yoga · Bologna" },
  { img: "/lavori/legale.png", name: "De Luca & Partners", sector: "Studio Legale · Napoli" },
  { img: "/lavori/pasticceria.png", name: "Fiordilatte", sector: "Pasticceria · Palermo" },
  { img: "/lavori/estetica-aurora.png", name: "Aurora Hair & Beauty", sector: "Parrucchiera · Roma" },
  { img: "/lavori/veterinario.png", name: "Clinica San Francesco", sector: "Veterinario · Padova" },
  { img: "/lavori/asilo.png", name: "Il Girotondo", sector: "Asilo Nido · Firenze" },
  { img: "/lavori/ristorante-gusto.png", name: "Osteria del Borgo", sector: "Ristorante · Verona" },
  { img: "/lavori/ottica.png", name: "Ottica Carraro", sector: "Ottica · Catania" },
];

const ROW_A = APPS.slice(0, 8);
const ROW_B = APPS.slice(7, 15);

function Card({ app }: { app: App }) {
  return (
    <div className="flex-shrink-0 w-44 md:w-52 group">
      <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 transition duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 transform">
        <img
          src={app.img}
          alt={`Mockup ${app.name}`}
          loading="lazy"
          className="w-full h-auto block"
        />
      </div>
      <div className="mt-3 text-center px-1">
        <p className="text-xs font-bold text-gray-800 leading-tight truncate">{app.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{app.sector}</p>
      </div>
    </div>
  );
}

export default function LavoriSvolti() {
  return (
    <section id="lavori" className="py-16 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-track-a {
          animation: scroll-left 50s linear infinite;
          width: max-content;
        }
        .marquee-track-b {
          animation: scroll-right 60s linear infinite;
          width: max-content;
        }
        .marquee-wrapper:hover .marquee-track-a,
        .marquee-wrapper:hover .marquee-track-b {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track-a, .marquee-track-b { animation: none; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="text-center">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Portfolio · 20 lavori realizzati
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            App che abbiamo <span className="text-indigo-600">realizzato</span> per attività come la tua
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Ogni App è progettata su misura: <strong>logo, schermate e funzioni</strong> cambiano in base al settore.
          </p>
        </div>
      </div>

      {/* Marquee row A */}
      <div className="marquee-wrapper relative">
        <div className="marquee-track-a flex gap-6 px-3">
          {[...ROW_A, ...ROW_A].map((app, i) => (
            <Card key={`a-${i}`} app={app} />
          ))}
        </div>
        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-50 to-transparent"></div>
      </div>

      {/* Marquee row B */}
      <div className="marquee-wrapper relative mt-8">
        <div className="marquee-track-b flex gap-6 px-3">
          {[...ROW_B, ...ROW_B].map((app, i) => (
            <Card key={`b-${i}`} app={app} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-50 to-transparent"></div>
      </div>

      {/* CTA "vedi tutti" */}
      <div className="text-center mt-12 px-4">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-bold shadow-md hover:scale-105 transition transform"
        >
          <i className="fas fa-images"></i>
          Vedi tutti i 20 progetti
          <i className="fas fa-arrow-right text-sm"></i>
        </Link>
        <p className="text-xs text-gray-400 mt-3">
          Scopri ogni App nel dettaglio · griglia completa
        </p>
      </div>
    </section>
  );
}
