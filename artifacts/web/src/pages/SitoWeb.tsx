import { useCart } from "../lib/CartContext";
import { useLocation } from "wouter";

const incluso = [
  { icon: "fa-file-lines",    testo: "5 pagine complete: Home, Chi Siamo, Servizi, Contatti, Privacy & Cookie Policy" },
  { icon: "fa-mobile-screen", testo: "Design moderno e responsive — perfetto su smartphone, tablet e computer" },
  { icon: "fa-envelope",      testo: "Form di contatto funzionante con invio email diretto" },
  { icon: "fa-map-location-dot", testo: "Google Maps integrata con la sede della tua attività" },
  { icon: "fa-magnifying-glass", testo: "SEO base: meta tag, titoli e descrizioni ottimizzati per Google" },
  { icon: "fa-share-nodes",   testo: "Link ai tuoi profili social (Facebook, Instagram, LinkedIn, ecc.)" },
  { icon: "fa-lock",          testo: "Certificato SSL (HTTPS) — sito sicuro e indicizzato da Google" },
  { icon: "fa-shield-halved", testo: "Privacy Policy e Cookie Policy GDPR-compliant incluse" },
  { icon: "fa-palette",       testo: "Colori, logo e font personalizzati sulla tua identità visiva" },
  { icon: "fa-clock",         testo: "Consegna garantita in 7 giorni lavorativi dalla ricezione dei materiali" },
  { icon: "fa-headset",       testo: "30 giorni di assistenza post-consegna inclusa" },
];

const nonIncluso = [
  "Testi e fotografie — da fornire dal cliente",
  "Hosting e dominio — acquisto separato (~15–30€/anno)",
  "E-commerce o vendita online di prodotti",
  "Blog, news o gestione articoli",
  "Area riservata o login utenti",
  "App mobile",
  "Gestionale, CRM o funzioni personalizzate",
  "Pagine aggiuntive oltre le 5 incluse",
  "Modifiche strutturali dopo i 30 giorni di assistenza",
];

const passi = [
  { n: "1", icon: "fa-paper-plane", titolo: "Ci contatti", desc: "Compila il form o scrivici su WhatsApp. Ci dici logo, colori, testi e foto della tua attività." },
  { n: "2", icon: "fa-pen-ruler",   titolo: "Progettiamo insieme", desc: "Creiamo la bozza grafica e te la mostriamo. Approvi e partiamo con lo sviluppo." },
  { n: "3", icon: "fa-rocket",      titolo: "Online in 7 giorni", desc: "Consegniamo il sito pronto. Ti affianchiamo 30 giorni per qualsiasi dubbio." },
];

const faq = [
  { q: "Posso aggiungere una sesta pagina?", a: "Il pacchetto è fisso a 5 pagine. Pagine aggiuntive si quotano separatamente su richiesta." },
  { q: "Chi acquista hosting e dominio?", a: "L'hosting e il dominio (es. .it, .com) sono a carico del cliente. Consigliamo Aruba o Register.it: il costo è circa 15–30€/anno." },
  { q: "Posso vendere prodotti sul sito?", a: "No, il sito istituzionale è pensato per presentare la tua attività, non per vendere. Per l'e-commerce esiste un piano dedicato." },
  { q: "Cosa mi serve per iniziare?", a: "Logo (o ci dici come rifarlo), testi delle pagine, 5–10 foto e le informazioni di contatto della tua attività." },
  { q: "Cosa succede dopo i 30 giorni di assistenza?", a: "Il sito rimane tuo e funzionante. Per modifiche future puoi richiedere un preventivo aggiuntivo." },
];

export default function SitoWeb() {
  const { addItem } = useCart();
  const [, navigate] = useLocation();

  function acquista() {
    addItem("sitoistituzionale");
    navigate("/registrazione?piano=sitoistituzionale");
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav minimal */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-extrabold tracking-tight">
            Promo<span className="text-emerald-500">App</span>.it
          </a>
          <button
            onClick={acquista}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-2 rounded-full text-sm transition shadow"
          >
            <i className="fas fa-cart-shopping mr-2"></i>Acquista — 399€
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1628] to-[#1e3a6e] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <span className="inline-block bg-sky-500 text-white text-xs font-bold px-4 py-1 rounded-full mb-4 tracking-widest uppercase">Offerta Limitata — Solo 50 siti</span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Realizzazione<br />
              <span className="text-sky-400">Siti Web</span><br />
              Professionali
            </h1>
            <p className="text-gray-300 text-lg mb-6 max-w-xl">
              Un sito istituzionale completo per la tua attività italiana. Design moderno, SEO incluso, consegnato in 7 giorni lavorativi.
            </p>
            <div className="flex items-end gap-4 mb-8">
              <div>
                <span className="text-5xl font-black text-white">399€</span>
                <span className="text-gray-400 line-through text-xl ml-3">599€</span>
              </div>
              <span className="text-sky-300 font-semibold text-sm">una tantum · zero canone</span>
            </div>
            <button
              onClick={acquista}
              className="bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-lg px-10 py-4 rounded-2xl shadow-xl transition hover:scale-105 active:scale-95"
            >
              <i className="fas fa-cart-shopping mr-3"></i>Ordina ora — 399€
            </button>
            <p className="text-gray-400 text-xs mt-3"><i className="fas fa-shield-halved mr-1 text-emerald-400"></i>Pagamento sicuro · Garanzia soddisfatti</p>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/promo-sito-web.png"
              alt="Realizzazione siti web professionali PromoApp"
              className="w-full max-w-md rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Cosa è incluso */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Cosa ottieni con 399€</h2>
          <p className="text-gray-500 text-center mb-10">Tutto quello che ti serve — niente di meno, niente di più</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incluso.map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${item.icon} text-white text-sm`}></i>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">{item.testo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cosa NON è incluso */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Cosa <span className="text-red-500">non</span> è incluso</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Per essere trasparenti e non creare aspettative errate</p>
          <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm">
            <ul className="space-y-3">
              {nonIncluso.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <i className="fas fa-xmark text-red-400 mt-0.5 flex-shrink-0"></i>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Hai bisogno di qualcosa di più? <a href="/#prezzi" className="text-indigo-600 font-semibold hover:underline">Scopri i nostri piani App completi</a></p>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">Come funziona</h2>
          <p className="text-gray-500 mb-12">Tre passi semplicissimi</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {passi.map((p) => (
              <div key={p.n} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center mb-4 shadow-lg">
                  <i className={`fas ${p.icon} text-white text-2xl`}></i>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-sky-400 flex items-center justify-center text-sky-600 font-black text-sm mb-3">{p.n}</div>
                <h3 className="font-bold text-lg mb-2">{p.titolo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA centrale */}
      <section className="py-16 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-center">
        <h2 className="text-3xl font-extrabold mb-3">Il tuo sito pronto in 7 giorni</h2>
        <p className="text-sky-100 mb-8 max-w-xl mx-auto">Approfitta dell'offerta limitata a 50 siti. Dopo saranno finiti.</p>
        <button
          onClick={acquista}
          className="bg-white text-sky-600 font-extrabold text-xl px-12 py-5 rounded-2xl shadow-2xl hover:scale-105 transition active:scale-95"
        >
          <i className="fas fa-cart-shopping mr-3"></i>Ordina ora — 399€
        </button>
        <p className="text-sky-200 text-xs mt-4">Prezzo definitivo, senza canoni mensili</p>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Domande frequenti</h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-5 hover:border-sky-300 transition">
                <p className="font-bold text-gray-800 mb-2"><i className="fas fa-circle-question text-sky-400 mr-2"></i>{item.q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-gray-900 text-gray-400 text-center py-8 px-4 text-sm">
        <p className="font-bold text-white mb-1">PromoApp.it</p>
        <p>P.IVA 08223951008 · <a href="/privacy.html" className="hover:underline">Privacy</a> · <a href="/cookie.html" className="hover:underline">Cookie</a></p>
      </footer>

      {/* WhatsApp */}
      <a
        href="https://wa.me/393793602035"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-[10001] hover:bg-green-600 transition-all hover:scale-110"
      >
        <i className="fab fa-whatsapp text-3xl"></i>
      </a>
    </div>
  );
}
