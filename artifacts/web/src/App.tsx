import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCart } from "./lib/CartContext";
import CartDrawer from "./components/CartDrawer";

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookiesAccepted")) {
      setVisible(true);
    }
  }, []);

  function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    setVisible(false);
  }

  return (
    <div
      className={`fixed bottom-0 left-0 w-full bg-gray-900 text-white p-6 z-[10000] transform transition-transform duration-500 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm opacity-80">
          Utilizziamo i cookie per migliorare la tua esperienza e analizzare il traffico. Cliccando su "Accetta", acconsenti all'uso dei cookie secondo la nostra{" "}
          <a href="/privacy.html" className="underline">Privacy Policy</a>.
        </p>
        <div className="flex gap-4">
          <button
            onClick={acceptCookies}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition"
          >
            Accetta
          </button>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

interface SchedaVoce { descrizione: string; importo: number | null; }
interface Scheda { id: string; nome: string; url: string; descrizione: string; voci: SchedaVoce[]; accontoVersato: number; totale: number; }

function LockModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/lavori/sblocca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, password: pwd }),
      });
      const data = await res.json() as { success: boolean; token?: string; message?: string };
      if (data.success && data.token) {
        sessionStorage.setItem(`preview_token_${projectId}`, data.token);
        navigate(`/lavori/${projectId}`);
        onClose();
      } else {
        setErr(data.message ?? "Password errata. Riprova.");
        setPwd("");
      }
    } catch {
      setErr("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10002] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-lock text-indigo-600 text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Accesso protetto</h3>
        <p className="text-gray-500 text-sm mb-6 font-light">Inserisci la password per visualizzare questo progetto</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setErr(""); }}
            placeholder="Password"
            className={`w-full border-2 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none transition ${err ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-indigo-500"}`}
          />
          {err && <p className="text-red-500 text-sm font-medium">{err}</p>}
          <button
            type="submit"
            disabled={loading || !pwd}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <><i className="fas fa-spinner fa-spin mr-2"></i>Verifica...</>
              : <>Apri il progetto <i className="fas fa-arrow-right ml-2"></i></>}
          </button>
        </form>
        <button onClick={onClose} className="mt-4 text-gray-400 hover:text-gray-600 text-sm transition">Annulla</button>
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({ nome_attivita: "", email: "", settore: "Negozio", messaggio: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockModal, setLockModal] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lavoriPwd, setLavoriPwd] = useState("");
  const [lavoriPwdErr, setLavoriPwdErr] = useState(false);
  const [progettoVisibile, setProgettoVisibile] = useState<string | null>(null);
  const [scheda, setScheda] = useState<Scheda | null>(() => {
    try {
      const s = sessionStorage.getItem("lavori_scheda");
      if (!s) return null;
      const parsed = JSON.parse(s) as Scheda;
      if (!parsed.id) {
        sessionStorage.removeItem("lavori_scheda");
        sessionStorage.removeItem("lavori_progetto");
        return null;
      }
      return parsed;
    } catch {
      sessionStorage.removeItem("lavori_scheda");
      sessionStorage.removeItem("lavori_progetto");
      return null;
    }
  });
  const { item, addItem, openCart } = useCart();

  async function sblocaLavori(e: React.FormEvent) {
    e.preventDefault();
    if (!lavoriPwd.trim()) { setLavoriPwdErr(true); return; }
    try {
      const res = await fetch("/api/lavori/sblocca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: lavoriPwd.trim() }),
      });
      const data = await res.json() as { success: boolean; scheda?: Scheda; message?: string };
      if (data.success && data.scheda) {
        sessionStorage.setItem("lavori_progetto", data.scheda.id);
        sessionStorage.setItem("lavori_scheda", JSON.stringify(data.scheda));
        setProgettoVisibile(data.scheda.id);
        setScheda(data.scheda);
        setLavoriPwdErr(false);
      } else {
        setLavoriPwdErr(true);
        setLavoriPwd("");
      }
    } catch {
      setLavoriPwdErr(true);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invia-contatto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Errore server");
      setSent(true);
    } catch {
      setError("Errore nell'invio. Riprova o contattaci su WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Navigazione */}
      <nav className="fixed w-full z-50 glass border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600 tracking-tighter">
            Promo<span className="text-emerald-500">App</span>.it
          </div>
          <div className="hidden md:flex space-x-8 font-medium text-sm uppercase tracking-wide">
            <a href="#come-funziona" className="hover:text-indigo-600 transition">Come Funziona</a>
            <a href="#demo" className="hover:text-indigo-600 transition">Demo Settori</a>
            <a href="#soluzioni-pronte" className="hover:text-indigo-600 transition">Soluzioni Pronte</a>
            <a href="#lavori" className="hover:text-indigo-600 transition">In Esecuzione</a>
            <a href="#prezzi" className="hover:text-indigo-600 transition">Prezzi</a>
            <a href="/pagamenti" className="text-emerald-600 font-semibold hover:text-emerald-700 transition">Pagamenti</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-50 transition"
              title="Carrello"
            >
              <i className="fas fa-shopping-cart text-indigo-600 text-lg"></i>
              {item && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
              )}
            </button>
            <a href="https://promo-app.replit.app/prova-gratis" target="_blank" rel="noopener noreferrer" className="hidden md:inline-block bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition shadow-md">Inizia Ora</a>
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-indigo-50 transition"
              aria-label="Menu"
            >
              <span className={`block w-6 h-0.5 bg-indigo-700 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
              <span className={`block w-6 h-0.5 bg-indigo-700 transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
              <span className={`block w-6 h-0.5 bg-indigo-700 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
            </button>
          </div>
        </div>
        {/* Menu mobile a scomparsa */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-screen border-t border-gray-100" : "max-h-0"}`}>
          <div className="bg-white px-4 py-4 flex flex-col gap-1">
            {[
              { href: "#come-funziona", label: "Come Funziona", icon: "fa-info-circle" },
              { href: "#demo", label: "Demo Settori", icon: "fa-th-large" },
              { href: "#soluzioni-pronte", label: "Soluzioni Pronte", icon: "fa-box-open" },
              { href: "#lavori", label: "In Esecuzione", icon: "fa-tasks" },
              { href: "#prezzi", label: "Prezzi", icon: "fa-tag" },
            ].map(({ href, label, icon }) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 transition text-sm">
                <i className={`fas ${icon} w-5 text-indigo-400`}></i> {label}
              </a>
            ))}
            <a href="/pagamenti" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-700 font-bold hover:bg-emerald-50 transition text-sm">
              <i className="fab fa-paypal w-5 text-emerald-500"></i> Pagamenti
            </a>
            <div className="pt-2 border-t border-gray-100 mt-1">
              <a href="https://promo-app.replit.app/prova-gratis" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm">
                <i className="fas fa-rocket"></i> Inizia Ora — Gratis
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 gradient-bg text-white">
        <div className="max-w-7xl mx-auto text-center">
          <span className="bg-white/20 px-4 py-1 rounded-full text-xs font-semibold mb-3 inline-block italic">
            La tua App professionale, pronta in 7 giorni
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Realizziamo l'App<br />che <span className="text-yellow-300">la tua attività merita.</span>
          </h1>
          <p className="text-base md:text-lg mb-6 opacity-90 max-w-2xl mx-auto font-light">
            Ogni attività è diversa. Per questo costruiamo <strong>app e gestionali su misura</strong> — qualunque sia il tuo settore. Tu ce la chiedi, noi la realizziamo. <a href="#soluzioni-pronte" className="underline decoration-yellow-300 decoration-2 underline-offset-4 hover:text-yellow-300 transition">Oppure scegli una delle nostre soluzioni già pronte →</a>
          </p>
          <div className="flex flex-col items-center gap-3">
            <a
              href="#contatti"
              className="group inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-base md:text-lg shadow-2xl hover:scale-105 transition transform"
            >
              <i className="fas fa-lightbulb text-yellow-300 text-xl"></i>
              <span>Raccontaci la tua idea — la realizziamo</span>
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </a>
            <a
              href="https://promo-app.replit.app/prova-gratis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white text-sm underline underline-offset-4 decoration-white/40 hover:decoration-white"
            >
              oppure guarda una demo già pronta →
            </a>
          </div>
          <div className="mt-6 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 opacity-80 text-sm">
            <span><i className="fas fa-bolt mr-2"></i> Pronto in 7 giorni</span>
            <span><i className="fas fa-shield-alt mr-2"></i> Tutto incluso</span>
            <span><i className="fas fa-key mr-2"></i> Sblocco definitivo</span>
          </div>
        </div>
      </section>

      {/* Promo Sito Web — in bella vista */}
      <section className="py-14 bg-gradient-to-br from-[#0a1628] to-[#1e3a6e] text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 order-2 lg:order-1">
            <span className="inline-block bg-sky-500 text-white text-xs font-bold px-4 py-1 rounded-full mb-4 tracking-widest uppercase">
              <i className="fas fa-fire mr-1 text-yellow-300"></i>Offerta Limitata — Solo 50 siti
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Realizzazione<br />
              <span className="text-sky-400">Siti Web</span><br />
              Professionali
            </h2>
            <ul className="space-y-2 text-gray-300 text-sm mb-6">
              <li><i className="fas fa-check text-emerald-400 mr-2"></i>Design moderno e personalizzato</li>
              <li><i className="fas fa-check text-emerald-400 mr-2"></i>Veloci, sicuri e ottimizzati per Google</li>
              <li><i className="fas fa-check text-emerald-400 mr-2"></i>Perfetti su tutti i dispositivi</li>
              <li><i className="fas fa-check text-emerald-400 mr-2"></i>Assistenza e supporto dedicato</li>
            </ul>
            <div className="flex items-end gap-4 mb-6">
              <span className="text-5xl font-black">399€</span>
              <span className="text-gray-400 line-through text-xl">599€</span>
              <span className="text-sky-300 text-sm font-semibold">una tantum</span>
            </div>
            <a
              href="/sito-web"
              className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-lg px-10 py-4 rounded-2xl shadow-xl transition hover:scale-105 active:scale-95"
            >
              <i className="fas fa-arrow-right mr-2"></i>Scopri e Ordina
            </a>
          </div>
          <div className="flex-1 order-1 lg:order-2 flex justify-center">
            <img
              src="/promo-sito-web.png"
              alt="Siti web professionali PromoApp"
              className="w-full max-w-md rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Cosa fa la tua App — sezione UNICA combinata (clienti + team) */}
      <section className="py-14 bg-gradient-to-b from-white to-indigo-50/40 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Cosa fa la tua App
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Tutto in <span className="text-indigo-600">un'unica App</span>.
            </h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              Una soluzione completa: per i tuoi <strong>clienti</strong> e per la <strong>gestione interna</strong> della tua attività.
            </p>
          </div>

          <div className="grid md:grid-cols-[200px_1fr] gap-8 items-center">
            {/* Immagine compatta */}
            <div className="flex justify-center">
              <img
                src="/promo-app-flyer.png"
                alt="PromoApp – Tutte le funzioni in un'unica App"
                width="220"
                height="320"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full max-w-[200px] md:max-w-[220px] h-auto object-contain rounded-2xl shadow-xl"
              />
            </div>

            {/* Due colonne di feature */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
                  <i className="fas fa-users"></i> Per i tuoi clienti
                </h3>
                <ul className="space-y-2.5">
                  {[
                    { icon: "fa-calendar-check", color: "text-indigo-500", label: "Prenotazioni e appuntamenti online" },
                    { icon: "fa-star", color: "text-yellow-500", label: "Fidelity card e promozioni mirate" },
                    { icon: "fa-credit-card", color: "text-emerald-500", label: "Pagamenti online sicuri" },
                    { icon: "fa-bell", color: "text-orange-500", label: "Notifiche e promemoria automatici" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${item.color} flex-shrink-0`}>
                        <i className={`fas ${item.icon} text-xs`}></i>
                      </div>
                      <span className="text-gray-700">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-2">
                  <i className="fas fa-briefcase"></i> Per te e il tuo team
                </h3>
                <ul className="space-y-2.5">
                  {[
                    { icon: "fa-address-book", color: "text-indigo-500", label: "CRM clienti centralizzato" },
                    { icon: "fa-file-invoice-dollar", color: "text-emerald-500", label: "Preventivi, fatture e contabilità" },
                    { icon: "fa-chart-bar", color: "text-blue-500", label: "Statistiche e agenda team" },
                    { icon: "fa-sync-alt", color: "text-purple-500", label: "Sincronizzato su PC, tablet, mobile" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${item.color} flex-shrink-0`}>
                        <i className={`fas ${item.icon} text-xs`}></i>
                      </div>
                      <span className="text-gray-700">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CTA centrali */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="https://promo-app.replit.app/prova-gratis"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md"
            >
              <i className="fas fa-play"></i> Prova la demo gratuita
            </a>
            <a
              href="#contatti"
              className="inline-flex items-center justify-center gap-2 border-2 border-indigo-200 text-indigo-600 px-7 py-3 rounded-xl font-bold hover:border-indigo-600 transition"
            >
              Richiedi un preventivo
            </a>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section id="come-funziona" className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Come funziona in 3 passi</h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Dal racconto della tua idea all'App pronta da usare — semplice, senza rischi.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center relative">
          {/* Linea connettore */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-indigo-100 z-0"></div>

          {/* Step 1 — Idea */}
          <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 relative z-10 flex flex-col">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              1
            </div>
            <div className="text-3xl mb-3"><i className="fas fa-comments text-indigo-500"></i></div>
            <h3 className="text-xl font-bold mb-3 text-indigo-700">Raccontaci la tua idea</h3>
            <p className="text-gray-600 text-sm flex-grow">Compili il modulo o ci scrivi su WhatsApp. Ci spieghi cosa fa la tua attività e cosa vorresti dalla tua App — anche se hai solo un'idea generica.</p>
            <div className="mt-4 inline-block self-center text-xs font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full border border-indigo-200">
              <i className="fas fa-clock mr-1"></i> 5 minuti
            </div>
          </div>

          {/* Step 2 — Progetto PDF */}
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 relative z-10 flex flex-col">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              2
            </div>
            <div className="text-3xl mb-3"><i className="fas fa-file-pdf text-emerald-500"></i></div>
            <h3 className="text-xl font-bold mb-3 text-emerald-700">Ti prepariamo il progetto</h3>
            <p className="text-gray-600 text-sm flex-grow">Ricevi un <strong>progetto in PDF</strong> con tutte le funzioni della tua App e una <strong>dashboard di anteprima</strong> già navigabile. Vedi com'è prima di decidere.</p>
            <div className="mt-4 inline-block self-center text-xs font-semibold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200">
              <i className="fas fa-gift mr-1"></i> Gratis e senza impegno
            </div>
          </div>

          {/* Step 3 — 7 giorni per accettare */}
          <div className="p-6 rounded-2xl bg-orange-50 border border-orange-100 relative z-10 flex flex-col">
            <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              3
            </div>
            <div className="text-3xl mb-3"><i className="fas fa-rocket text-orange-500"></i></div>
            <h3 className="text-xl font-bold mb-3 text-orange-700">Accetti, paghi, parti</h3>
            <p className="text-gray-600 text-sm flex-grow">Hai <strong>7 giorni di tempo</strong> per accettare il progetto. Dopo il pagamento ricevi la chiave di attivazione e l'App è subito pronta da usare.</p>
            <div className="mt-4 inline-block self-center text-xs font-semibold text-orange-700 bg-white px-3 py-1 rounded-full border border-orange-200">
              <i className="fas fa-hourglass-half mr-1"></i> 7 giorni per decidere
            </div>
          </div>
        </div>

        {/* Riassunto / CTA */}
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <p className="text-gray-500 italic mb-6">Nessun anticipo. Nessun rischio. Paghi solo quando il progetto ti convince davvero.</p>
          <a
            href="#contatti"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition transform"
          >
            <i className="fas fa-lightbulb text-yellow-300"></i>
            Inizia: raccontaci la tua idea
            <i className="fas fa-arrow-right"></i>
          </a>
        </div>
      </section>

      {/* Demo Settori */}
      <section id="demo" className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold italic">Funziona per ogni tipo di attività</h2>
            <p className="text-gray-500">Un'unica piattaforma adattata al tuo settore — pronta in 7 giorni.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { color: "text-indigo-600", bg: "bg-indigo-50", name: "Studi Medici & Dentisti", desc: "Prenotazioni, storico visite e promemoria automatici.", badge: "Pronto all'uso" },
              { color: "text-pink-600", bg: "bg-pink-50", name: "Centri Estetici & SPA", desc: "Vetrina trattamenti, fidelity card e offerte flash.", badge: "Alta richiesta" },
              { color: "text-orange-600", bg: "bg-orange-50", name: "Parrucchieri & Barber", desc: "Agenda online, clienti fidelizzati e promozioni.", badge: "Molto richiesto" },
              { color: "text-emerald-600", bg: "bg-emerald-50", name: "Negozi & Retail", desc: "Shop integrato, gestione magazzino e ordini online.", badge: "E-commerce" },
              { color: "text-blue-600", bg: "bg-blue-50", name: "Ristoranti & Bar", desc: "Menu digitale, prenotazioni tavoli e ordini d'asporto.", badge: "Food & Beverage" },
              { color: "text-violet-600", bg: "bg-violet-50", name: "Palestre & Fitness", desc: "Abbonamenti, prenotazione corsi e accessi digitali.", badge: "Sport & Wellness" },
              { color: "text-orange-500", bg: "bg-orange-50", name: "Autorimesse & Meccanici", desc: "Stato riparazioni, scadenze revisioni e devis online.", badge: "Settore Tech" },
              { color: "text-cyan-600", bg: "bg-cyan-50", name: "Centri Servizi & Agenzie", desc: "Gestione pratiche, appuntamenti e documenti digitali.", badge: "Professionisti" },
              { color: "text-rose-600", bg: "bg-rose-50", name: "Studi Legali & Notarili", desc: "Agenda clienti, archivio pratiche e notifiche scadenze.", badge: "Legal & Pro" },
              { color: "text-teal-600", bg: "bg-teal-50", name: "Immobiliari", desc: "Vetrina immobili, richieste visite e gestione contatti.", badge: "Real Estate" },
              { color: "text-yellow-600", bg: "bg-yellow-50", name: "Agenti di Commercio", desc: "Catalogo prodotti, ordini in mobilità e statistiche.", badge: "Massima efficienza" },
              { color: "text-gray-700", bg: "bg-gray-100", name: "Qualsiasi altra attività", desc: "Costruiamo l'app su misura per le tue esigenze specifiche.", badge: "Su richiesta" },
            ].map((item, i) => (
              <div key={i} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition`}>
                <div className={`inline-block ${item.bg} ${item.color} text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-lg mb-3`}>{item.badge}</div>
                <h4 className={`font-bold ${item.color} mb-2 text-sm`}>{item.name}</h4>
                <p className="text-xs text-gray-500 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Soluzioni Pronte all'uso — Prodotti operativi */}
      <section id="soluzioni-pronte" className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Già operativi</span>
            <h2 className="text-3xl md:text-4xl font-bold italic mb-3">Hai fretta? Abbiamo già <span className="text-indigo-600">due gestionali pronti</span></h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-light mb-5">
              Per due dei settori più richiesti abbiamo già sviluppato gestionali completi, online e operativi.
              Provali gratis e parti subito — oppure costruiamo la tua app su misura.
            </p>
            {/* Offerta Lancio Lifetime */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-2xl px-6 py-4 shadow-xl">
              <i className="fas fa-fire text-yellow-300 text-2xl"></i>
              <div className="text-left">
                <div className="text-base md:text-lg font-extrabold">OFFERTA LANCIO — Licenza a vita a <span className="text-yellow-300">199€</span></div>
                <div className="text-xs md:text-sm opacity-95 font-medium">Una tantum, <strong>zero canone mensile per sempre</strong> · Solo le prime <strong>1.000 licenze</strong></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Gestionale360 */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-3xl p-8 hover:shadow-xl transition flex flex-col">
              <span className="absolute -top-3 right-6 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-extrabold uppercase whitespace-nowrap shadow-lg">
                <i className="fas fa-fire text-yellow-300 mr-1"></i> Offerta lancio
              </span>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center text-white text-xl">
                  <i className="fas fa-store"></i>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">Per Negozi & Retail</div>
                  <h3 className="text-2xl font-bold text-gray-900">Gestionale<span className="text-emerald-700">360</span></h3>
                </div>
              </div>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Il gestionale italiano per il tuo negozio. <strong>Magazzino, vendite, arrivi, contabilità, clienti e fornitori</strong> in un'unica app — pensato per ferramenta, abbigliamento, alimentari, giocattoli ed elettronica.
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6 flex-grow">
                <li><i className="fas fa-check text-emerald-600 mr-2"></i> Magazzino sotto controllo con avvisi sotto scorta</li>
                <li><i className="fas fa-check text-emerald-600 mr-2"></i> Cassa e vendite veloci con calcolo IVA</li>
                <li><i className="fas fa-check text-emerald-600 mr-2"></i> Arrivi, fornitori e bolle di carico</li>
                <li><i className="fas fa-check text-emerald-600 mr-2"></i> Contabilità chiara e clienti fidelizzati</li>
              </ul>

              {/* Box Offerta Lifetime */}
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-2xl p-5 mb-4 shadow-lg">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold">199€</span>
                  <span className="text-xs uppercase tracking-widest opacity-80">una tantum</span>
                </div>
                <div className="text-sm font-semibold mb-2">Licenza a vita · zero canone mensile</div>
                <div className="text-xs opacity-90 flex items-center gap-2">
                  <i className="fas fa-bolt text-yellow-300"></i>
                  <span>Solo per le prime <strong>1.000 licenze</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => addItem("gestionale360")}
                  className="flex-1 text-center bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-xl font-bold transition shadow-md"
                >
                  Acquista a 199€ <i className="fas fa-arrow-right ml-2"></i>
                </button>
                <a
                  href="https://gestionale360.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 px-5 py-3 rounded-xl font-bold transition"
                >
                  Prova gratis
                </a>
              </div>
            </div>

            {/* AgentiPro / Gestione Agenti */}
            <div className="relative bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-3xl p-8 hover:shadow-xl transition flex flex-col">
              <span className="absolute -top-3 right-6 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-extrabold uppercase whitespace-nowrap shadow-lg">
                <i className="fas fa-fire text-yellow-300 mr-1"></i> Offerta lancio
              </span>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white text-xl">
                  <i className="fas fa-briefcase"></i>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-orange-600">Per Agenti di Commercio</div>
                  <h3 className="text-2xl font-bold text-gray-900">Agenti<span className="text-orange-600">Pro</span></h3>
                </div>
              </div>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Il gestionale dedicato agli <strong>agenti di commercio</strong>: clienti, ordini, provvigioni, visite e spese — tutto in mobilità, sempre a portata di mano anche fuori ufficio.
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6 flex-grow">
                <li><i className="fas fa-check text-orange-600 mr-2"></i> Anagrafica clienti completa e georeferenziata</li>
                <li><i className="fas fa-check text-orange-600 mr-2"></i> Ordini in mobilità e catalogo prodotti</li>
                <li><i className="fas fa-check text-orange-600 mr-2"></i> Calcolo automatico provvigioni</li>
                <li><i className="fas fa-check text-orange-600 mr-2"></i> Pianificazione visite e nota spese</li>
              </ul>

              {/* Box Offerta Lifetime */}
              <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-2xl p-5 mb-4 shadow-lg">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold">199€</span>
                  <span className="text-xs uppercase tracking-widest opacity-80">una tantum</span>
                </div>
                <div className="text-sm font-semibold mb-2">Licenza a vita · zero canone mensile</div>
                <div className="text-xs opacity-90 flex items-center gap-2">
                  <i className="fas fa-bolt text-yellow-300"></i>
                  <span>Solo per le prime <strong>1.000 licenze</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => addItem("agentipro")}
                  className="flex-1 text-center bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-bold transition shadow-md"
                >
                  Acquista a 199€ <i className="fas fa-arrow-right ml-2"></i>
                </button>
                <a
                  href="https://gestioneagenti.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center border-2 border-orange-600 text-orange-600 hover:bg-orange-50 px-5 py-3 rounded-xl font-bold transition"
                >
                  Provalo ora
                </a>
              </div>
            </div>
          </div>

          {/* Bridge to custom */}
          <div className="mt-10 text-center bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-700 mb-3">
              <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
              <strong>Il tuo settore non è qui?</strong> Nessun problema — la nostra specialità sono le <strong>app personalizzate</strong>.
            </p>
            <a href="#contatti" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline">
              Raccontaci la tua idea, la realizziamo per te <i className="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Lavori in Esecuzione */}
      <section id="lavori" className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              <i className="fas fa-hammer mr-1"></i> In Lavorazione
            </span>
            <h2 className="text-3xl md:text-4xl font-bold italic mb-3">Lavori in Esecuzione</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-light">
              Alcuni progetti sono visibili in anteprima ai clienti. Clicca su una card per richiedere l'accesso e visualizzare il lavoro in corso.
            </p>
          </div>

          {!scheda ? (
            <div className="max-w-sm mx-auto">
              <form onSubmit={sblocaLavori} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-lock text-indigo-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Area riservata clienti</h3>
                <p className="text-gray-400 text-sm mb-6">Inserisci la password ricevuta da PromoApp per vedere il tuo progetto</p>
                <input
                  type="password"
                  value={lavoriPwd}
                  onChange={e => { setLavoriPwd(e.target.value); setLavoriPwdErr(false); }}
                  placeholder="Password"
                  className={`w-full border-2 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none transition mb-3 ${lavoriPwdErr ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-indigo-500"}`}
                />
                {lavoriPwdErr && <p className="text-red-500 text-sm mb-3">Password non riconosciuta. Riprova.</p>}
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition">
                  Accedi al progetto <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </form>
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
              {/* Header progetto */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl px-7 py-6 mb-4 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-extrabold uppercase px-3 py-1 rounded-full">
                    <i className="fas fa-hammer mr-1"></i> In corso
                  </span>
                  {scheda.url && (
                    <a href={scheda.url} target="_blank" rel="noopener noreferrer"
                      className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition flex items-center gap-1">
                      <i className="fas fa-external-link-alt text-xs"></i> Apri app
                    </a>
                  )}
                </div>
                <h3 className="text-2xl font-bold">{scheda.nome}</h3>
                {scheda.descrizione && <p className="text-white/75 text-sm mt-1 font-light">{scheda.descrizione}</p>}
              </div>

              {/* Scheda costi */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Riepilogo costi</h4>
                  <div className="space-y-3">
                    {scheda.voci.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-1">
                        <span className="text-gray-600">{v.descrizione}</span>
                        {v.importo !== null
                          ? <span className="font-semibold text-gray-800">€ {v.importo.toLocaleString("it-IT")}</span>
                          : <span className="text-gray-400 italic text-xs bg-gray-100 px-2 py-0.5 rounded-full">Da definire</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {scheda.totale > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between font-bold text-sm">
                      <span className="text-gray-700">Totale progetto</span>
                      <span className="text-gray-900">€ {scheda.totale.toLocaleString("it-IT")}</span>
                    </div>
                    {scheda.accontoVersato > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Acconto versato</span>
                        <span className="font-semibold">− € {scheda.accontoVersato.toLocaleString("it-IT")}</span>
                      </div>
                    )}
                    <div className="bg-indigo-50 rounded-2xl px-4 py-3 flex justify-between items-center mt-2">
                      <span className="font-bold text-indigo-700 text-sm">Residuo da saldare</span>
                      <span className="font-extrabold text-indigo-700 text-lg">
                        € {Math.max(0, scheda.totale - scheda.accontoVersato).toLocaleString("it-IT")}
                      </span>
                    </div>
                  </div>
                )}

                {(scheda.totale - scheda.accontoVersato) > 0 && (
                  <div className="px-6 pb-6">
                    <a
                      href={`/pagamenti?progetto=${encodeURIComponent(scheda.nome)}&totale=${scheda.totale}`}
                      className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-center transition"
                    >
                      <i className="fas fa-credit-card mr-2"></i>Vai al pagamento
                    </a>
                  </div>
                )}
              </div>

              <button onClick={() => { setProgettoVisibile(null); sessionStorage.removeItem("lavori_progetto"); sessionStorage.removeItem("lavori_scheda"); setScheda(null); setLavoriPwd(""); }}
                className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition">
                <i className="fas fa-sign-out-alt mr-1"></i> Esci dall'area riservata
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Prezzi */}
      <section id="prezzi" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 italic">Quanto costa la tua App?</h2>
          <p className="text-gray-500 mb-6 max-w-2xl mx-auto">Prezzo chiaro, nessuna sorpresa. <strong>L'App costa una sola volta</strong> — il canone mensile copre solo hosting, aggiornamenti e assistenza.</p>

          {/* Promo Banner 6+6 */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl px-6 py-4 text-sm font-bold mb-6 shadow-lg">
            <i className="fas fa-fire text-yellow-300 text-xl"></i>
            <span className="text-base">PROMO LANCIO — Paghi 6 mesi, gli altri 6 sono <span className="text-yellow-300 underline">GRATIS</span></span>
          </div>
          <div className="block mb-12 text-xs text-gray-500 italic">Promo valida sul primo anno di canone — solo per le prime richieste</div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Piano Base — App Semplice */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition flex flex-col">
              <div className="inline-block self-start bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">App Essenziale</div>
              <h4 className="text-2xl font-bold mb-1">Base</h4>
              <p className="text-gray-400 text-xs font-light mb-4 italic">Per attività che vogliono iniziare bene</p>
              <div className="mb-1">
                <span className="text-5xl font-extrabold text-gray-900">690€</span>
              </div>
              <div className="text-xs text-gray-500 font-light mb-1">prezzo dell'App — pagamento unico</div>
              <div className="text-indigo-600 font-bold text-sm mb-6">+ 19€/mese · hosting & assistenza</div>
              <ul className="text-left space-y-3 mb-8 text-gray-600 text-sm flex-grow">
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> App con logo e colori della tua attività</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Gestionale clienti e appuntamenti</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Gestione magazzino base</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Shop online per prodotti e servizi</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Agenda prenotazioni online</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Promemoria automatici ai clienti</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Vetrina servizi e listino prezzi</li>
                <li><i className="fas fa-key text-orange-400 mr-2"></i> App tua per sempre</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza via email</li>
              </ul>
              <button
                onClick={() => addItem("base")}
                className="block w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-shopping-cart text-sm"></i>
                {item?.id === "base" ? "Nel carrello ✓" : "Aggiungi al Carrello"}
              </button>
            </div>
            {/* Piano Pro — App Avanzata con Integrazioni */}
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white transform md:scale-105 relative flex flex-col">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">Il più scelto</span>
              <div className="inline-block self-start bg-yellow-300 text-indigo-900 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">App Avanzata</div>
              <h4 className="text-2xl font-bold mb-1">Business Pro</h4>
              <p className="text-indigo-200 text-xs font-light mb-4 italic">Per chi vuole crescere con integrazioni e dati</p>
              <div className="text-5xl font-extrabold mb-1">890€</div>
              <div className="text-xs text-indigo-200 font-light mb-1">prezzo dell'App — pagamento unico</div>
              <div className="text-yellow-300 font-bold text-sm mb-6">+ 29€/mese · hosting & assistenza</div>
              <ul className="text-left space-y-3 mb-8 text-sm flex-grow">
                <li className="font-semibold"><i className="fas fa-star text-yellow-300 mr-2"></i> Tutto il piano Base, più:</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Integrazione con gestionali esistenti</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Pagamenti online (Stripe, PayPal, bonifico)</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Statistiche vendite, clienti e fatturato</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Notifiche push illimitate</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Fidelity card digitale e coupon</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Più operatori e accessi multipli</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> CRM avanzato e segmentazione clienti</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Assistenza prioritaria</li>
              </ul>
              <button
                onClick={() => addItem("pro")}
                className="block w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-shopping-cart text-sm"></i>
                {item?.id === "pro" ? "Nel carrello ✓" : "Aggiungi al Carrello"}
              </button>
            </div>
            {/* Piano Custom — Su Misura */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-dashed border-gray-300 hover:shadow-xl transition flex flex-col">
              <div className="inline-block self-start bg-gray-900 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Su Misura</div>
              <h4 className="text-2xl font-bold mb-1">Personalizzata</h4>
              <p className="text-gray-400 text-xs font-light mb-4 italic">Hai un'idea precisa? La realizziamo per te</p>
              <div className="text-5xl font-extrabold text-gray-900 mb-1">Preventivo</div>
              <div className="text-xs text-gray-500 font-light mb-6">prezzo personalizzato in base alle tue esigenze</div>
              <ul className="text-left space-y-3 mb-8 text-gray-600 text-sm flex-grow">
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Qualunque funzione tu chieda</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Pubblicazione su App Store e Google Play</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Integrazioni con software esterni e API</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Multi-sede, multi-utente, multi-lingua</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Design completamente custom</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Project manager dedicato</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza dedicata e SLA garantito</li>
                <li><i className="fas fa-key text-orange-400 mr-2"></i> App tua per sempre</li>
              </ul>
              <a href="#contatti" className="block w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition">Richiedi un Preventivo →</a>
            </div>
          </div>

          {/* App Desktop add-on */}
          <div className="mt-10 max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl px-6 py-5 flex gap-4 items-start text-left shadow-sm">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-desktop text-white text-xl"></i>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">
                App Desktop installabile su PC e Mac
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold align-middle">Opzione aggiuntiva</span>
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Ogni app che realizziamo può essere trasformata in un <strong>programma installabile sul computer</strong> del cliente, con la sua icona personalizzata sul desktop. Funziona su <strong>Windows (.exe)</strong> e <strong>macOS (.dmg)</strong> — si apre come qualsiasi altro software, senza browser. Ideale per gestionali, casse, magazzino e strumenti di uso quotidiano. Richiedilo nel preventivo.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Form Contatti — Richiesta Preventivo */}
      <section id="contatti" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Richiedi un Preventivo</div>
            <h2 className="text-3xl font-bold">Raccontaci la tua idea</h2>
            <p className="opacity-70 font-light mt-2">Analizziamo la fattibilità <strong>gratuitamente</strong> e ti rispondiamo entro 24 ore con un preventivo su misura.</p>
          </div>

          {sent ? (
            <div className="bg-emerald-500 rounded-2xl p-10 text-center">
              <i className="fas fa-check-circle text-5xl mb-4 block"></i>
              <h3 className="text-2xl font-bold mb-2">Richiesta inviata!</h3>
              <p className="opacity-90">Ti contatteremo entro 24 ore con il tuo preventivo personalizzato.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Attività</label>
                  <input
                    type="text"
                    name="nome_attivita"
                    required
                    value={form.nome_attivita}
                    onChange={handleChange}
                    placeholder="Es. Bar Centrale"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo di Attività</label>
                  <select
                    name="settore"
                    value={form.settore}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Medico">Studio Medico / Dentistico</option>
                    <option value="Estetica">Centro Estetico / SPA</option>
                    <option value="Parrucchiere">Parrucchiere / Barber</option>
                    <option value="Negozio">Negozio / Retail</option>
                    <option value="Ristorazione">Ristorante / Bar</option>
                    <option value="Palestra">Palestra / Fitness</option>
                    <option value="Meccanico">Autorimessa / Meccanico</option>
                    <option value="Servizi">Centro Servizi / Agenzia</option>
                    <option value="Legale">Studio Legale / Notarile</option>
                    <option value="Immobiliare">Agenzia Immobiliare</option>
                    <option value="Agente">Agente di Commercio</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email di contatto</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tua@email.it"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cosa deve fare la tua App? <span className="text-gray-500 font-light">(funzioni, integrazioni, esempi)</span></label>
                <textarea
                  name="messaggio"
                  value={form.messaggio}
                  onChange={handleChange}
                  required
                  placeholder="Es. mi serve un'app con prenotazioni online, gestione clienti, shop integrato per vendere i miei prodotti, integrazione col mio gestionale attuale..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio in corso...</> : "Richiedi il tuo Preventivo Gratuito"}
              </button>
              <p className="text-center text-xs text-gray-500 italic">
                I tuoi dati sono trattati secondo la nostra <a href="/privacy.html" className="underline hover:text-white">Privacy Policy</a>. Nessuno spam, promesso.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8 text-sm">
            <div>
              <div className="text-xl font-bold text-indigo-600 tracking-tighter mb-2">
                Promo<span className="text-emerald-500">App</span>.it
              </div>
              <p className="text-gray-500 font-light leading-relaxed">
                App e gestionali su misura per qualunque attività italiana. Tu ce la chiedi, noi la realizziamo.
              </p>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-3 uppercase tracking-widest text-xs">Le nostre soluzioni</div>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#contatti" className="hover:text-indigo-600 transition"><i className="fas fa-mobile-alt text-indigo-500 mr-2 w-4"></i>App personalizzata su misura</a></li>
                <li><a href="https://gestionale360.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 transition"><i className="fas fa-store text-emerald-700 mr-2 w-4"></i>Gestionale360 — per negozi</a></li>
                <li><a href="https://gestioneagenti.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition"><i className="fas fa-briefcase text-orange-600 mr-2 w-4"></i>AgentiPro — per agenti di commercio</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-3 uppercase tracking-widest text-xs">Contatti</div>
              <ul className="space-y-2 text-gray-600">
                <li><a href="https://wa.me/393793602035" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition"><i className="fab fa-whatsapp text-green-500 mr-2 w-4"></i>WhatsApp +39 379 360 2035</a></li>
                <li><a href="#contatti" className="hover:text-indigo-600 transition"><i className="fas fa-envelope text-indigo-500 mr-2 w-4"></i>Richiedi un preventivo</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="opacity-70 text-center md:text-left">
            © 2026 <strong>PromoApp.it</strong><br className="md:hidden" />
            <span className="opacity-80"> · Sophia 2005 S.r.l. · P.IVA 08223951008</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://www.facebook.com/profile.php?id=61568000249468"
              target="_blank"
              rel="noopener noreferrer"
              title="Seguici su Facebook"
              className="text-gray-500 hover:text-blue-600 transition-colors text-2xl"
            >
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a
              href="https://www.instagram.com/promoapp.it/"
              target="_blank"
              rel="noopener noreferrer"
              title="Seguici su Instagram"
              className="text-gray-500 hover:text-pink-500 transition-colors text-2xl"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>
          <div className="opacity-60 italic flex gap-6">
            <a href="/privacy.html" className="hover:underline">Privacy Policy</a>
            <a href="/cookie.html" className="hover:underline">Cookie Policy</a>
            <a href="/admin" className="hover:underline">Admin</a>
          </div>
          </div>
        </div>
      </footer>

      {/* Tasto WhatsApp Flottante */}
      <a
        href="https://wa.me/393793602035"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-[10001] hover:bg-green-600 transition-all hover:scale-110"
      >
        <i className="fab fa-whatsapp text-3xl"></i>
      </a>

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Lock Modal */}
      {lockModal && <LockModal projectId={lockModal} onClose={() => setLockModal(null)} />}

      {/* Carrello */}
      <CartDrawer />
    </>
  );
}
