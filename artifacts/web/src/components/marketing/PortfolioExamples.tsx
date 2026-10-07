export default function PortfolioExamples() {
  return <div className="portfolio-grid" data-testid="portfolio">
    <article className="portfolio-item">
      <a href="https://nyx-milano-club.replit.app" target="_blank" rel="noopener noreferrer" className="portfolio-image" aria-label="Apri il sito KEOS Milano">
        <img src={`${import.meta.env.BASE_URL}portfolio/keos-milano.webp`} alt="Schermata reale del sito KEOS Milano con tessera digitale"
          width={430} height={720} loading="lazy" className="w-full h-full object-cover object-top" />
      </a>
      <p className="text-xs font-bold text-emerald-700 mt-5 mb-2 uppercase tracking-wider">Sito web e tessera digitale</p>
      <h3 className="font-bold text-xl">KEOS Milano</h3>
      <p className="text-sm text-gray-500 mt-3 mb-4">Il progetto Milano, precedentemente NYX, presenta il locale e l'accesso alla tessera digitale. Questa è una schermata del sito pubblico, non un mockup.</p>
      <a className="font-bold text-indigo-700" href="https://nyx-milano-club.replit.app" target="_blank" rel="noopener noreferrer">Visita il sito funzionante →</a>
    </article>
    <aside className="portfolio-item p-6 justify-center">
      <h3 className="font-bold text-xl mb-4">Vuoi vedere un esempio adatto alla tua attività?</h3>
      <p className="text-gray-500 text-sm">Raccontaci il tuo settore. Ti mostreremo i lavori e le funzionalità pertinenti durante il confronto, senza pubblicare le aree riservate dei clienti.</p>
      <a href="#preventivo" className="mt-5 font-bold text-indigo-700">Parliamo del tuo progetto →</a>
    </aside>
  </div>;
}
