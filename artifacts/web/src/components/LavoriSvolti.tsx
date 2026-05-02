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
            Ogni App è progettata su misura: <strong>logo, schermate e funzioni</strong> cambiano in base al settore.
            Ecco esempi reali di quello che abbiamo costruito.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-10">
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
