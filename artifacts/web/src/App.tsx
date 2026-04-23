import { useState, useEffect } from "react";

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

export default function App() {
  const [form, setForm] = useState({ nome_attivita: "", email: "", settore: "Medico", messaggio: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            <a href="#prezzi" className="hover:text-indigo-600 transition">Prezzi</a>
          </div>
          <a href="#contatti" className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition shadow-md">Inizia Ora</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 gradient-bg text-white">
        <div className="max-w-7xl mx-auto text-center">
          <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-semibold mb-4 inline-block italic">
            Soluzioni per PMI, Centri Medici ed Estetici
          </span>
          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 leading-tight">
            La tua App ufficiale.<br />Nessuno crederà al prezzo.
          </h1>
          <p className="text-xl mb-6 opacity-90 max-w-2xl mx-auto font-light">
            Basta siti web dimenticati. Entra nello smartphone dei tuoi clienti. Gestisci prenotazioni e vendite tutto online.
          </p>
          {/* Demo badge */}
          <div className="mb-8 inline-flex items-center gap-3 bg-white/15 border border-white/30 rounded-2xl px-6 py-3 text-sm font-semibold">
            <i className="fas fa-flask text-yellow-300"></i>
            <span>Prova subito la Demo gratuita — <span className="text-yellow-300">10 pazienti + 10 appuntamenti</span> già inclusi</span>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a href="#video-demo" className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition transform">
              Guarda le Demo Live
            </a>
            <a href="#contatti" className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition transform">
              Richiedi la tua App
            </a>
          </div>
          <div className="mt-10 flex justify-center items-center space-x-6 opacity-80 text-sm">
            <span><i className="fas fa-bolt mr-2"></i> Pronto in 7 giorni</span>
            <span><i className="fas fa-shield-alt mr-2"></i> Tutto incluso</span>
            <span><i className="fas fa-key mr-2"></i> Sblocco definitivo al pagamento</span>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section id="come-funziona" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold">Come funziona in 3 passi</h2>
          <p className="text-gray-500">Dal primo test all'app definitiva — senza rischi, senza sorprese.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center relative">
          {/* Linea connettore */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-indigo-100 z-0"></div>

          {/* Step 1 */}
          <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-100 relative z-10">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              1
            </div>
            <h3 className="text-xl font-bold mb-3 text-indigo-700">Prova la Demo</h3>
            <p className="text-gray-600 text-sm">Ricevi subito un'app funzionante con <strong>10 pazienti</strong> e <strong>10 appuntamenti</strong> già caricati. La testi tu stesso, gratis, senza impegno.</p>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-100 relative z-10">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              2
            </div>
            <h3 className="text-xl font-bold mb-3 text-emerald-700">Personalizziamo Insieme</h3>
            <p className="text-gray-600 text-sm">Aggiungiamo il tuo logo, i tuoi colori, i tuoi servizi. L'app viene costruita su misura per la tua attività, settore per settore.</p>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-2xl bg-orange-50 border border-orange-100 relative z-10">
            <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
              3
            </div>
            <h3 className="text-xl font-bold mb-3 text-orange-700">Chiave di Sblocco</h3>
            <p className="text-gray-600 text-sm">Dopo il pagamento del piano scelto ricevi la <strong>chiave di attivazione</strong> che sblocca l'app definitivamente — tua per sempre, senza canoni mensili.</p>
          </div>
        </div>
      </section>

      {/* Sezione Video Demo */}
      <section id="video-demo" className="py-24 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4 italic">Guarda la tua App in azione</h2>
            <p className="text-gray-400 text-lg">Prenotazioni, notifiche, catalogo prodotti — tutto in un'unica app professionale.</p>
          </div>
          {/* Video player con cornice stile schermo */}
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px #374151, 0 25px 60px rgba(0,0,0,0.6)',
            background: '#000',
          }}>
            {/* Barra titolo stile app */}
            <div style={{
              background: '#1f2937',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{width:12,height:12,borderRadius:'50%',background:'#ef4444'}}></div>
              <div style={{width:12,height:12,borderRadius:'50%',background:'#f59e0b'}}></div>
              <div style={{width:12,height:12,borderRadius:'50%',background:'#22c55e'}}></div>
              <div style={{flex:1,textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>PromoApp — Demo Live</div>
            </div>
            {/* Video */}
            <video
              autoPlay loop muted playsInline controls
              style={{ width: '100%', display: 'block' }}
            >
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
          {/* Feature pills sotto il video */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <i className="fas fa-bolt text-emerald-400"></i> Installazione in 1 click
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <i className="fas fa-bell text-orange-400"></i> Notifiche Push incluse
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <i className="fas fa-wifi text-blue-400"></i> Funziona anche offline
            </div>
          </div>
        </div>
      </section>

      {/* Demo Settori */}
      <section id="demo" className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold italic">Soluzioni su misura</h2>
            <p className="text-gray-500">Un unico motore, infinite possibilità per il tuo settore.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-indigo-600 mb-2">Studi Medici</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Gestione appuntamenti e storico visite in totale privacy.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Pronto all'uso</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-emerald-600 mb-2">Centri Estetici</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Vetrina trattamenti e notifiche per offerte flash.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Alta richiesta</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-orange-600 mb-2">Autorimesse</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Stato riparazioni e scadenze revisioni in tempo reale.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Settore Tech</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-blue-600 mb-2">Agenti di Commercio</h4>
              <p className="text-sm text-gray-600 mb-4 font-light">Catalogo asset e gestione ordini in mobilità.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 italic">Massima Efficienza</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prezzi */}
      <section id="prezzi" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 italic">Piani chiari, nessun segreto</h2>
          <p className="text-gray-500 mb-6">Scegli la soluzione più adatta alla dimensione del tuo business.</p>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-5 py-3 text-sm font-semibold mb-12">
            <i className="fas fa-key text-indigo-500"></i>
            Tutti i piani includono la <strong className="mx-1">chiave di sblocco definitiva</strong> — paghi una volta, l'app è tua per sempre.
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Piano Base */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition">
              <h4 className="text-xl font-bold mb-2">Smart PWA</h4>
              <div className="text-4xl font-bold mb-6">399€ <span className="text-sm text-gray-400 font-light">una tantum</span></div>
              <ul className="text-left space-y-4 mb-8 text-gray-600">
                <li><i className="fas fa-flask text-indigo-400 mr-2"></i> <b>Demo gratuita</b> (10 pazienti + 10 appuntamenti)</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> App personalizzata con logo e colori</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Pagina prenotazioni</li>
                <li><i className="fas fa-key text-orange-400 mr-2"></i> <b>Chiave di sblocco definitiva</b></li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza via email</li>
              </ul>
              <a href="#contatti" className="block w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition">Scegli Smart</a>
            </div>
            {/* Piano Consigliato */}
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white transform scale-105 relative">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Il più scelto</span>
              <h4 className="text-xl font-bold mb-2">Business Pro</h4>
              <div className="text-4xl font-bold mb-6">799€ <span className="text-sm opacity-70 font-light">una tantum</span></div>
              <ul className="text-left space-y-4 mb-8">
                <li><i className="fas fa-flask text-yellow-300 mr-2"></i> <b>Demo gratuita</b> (10 pazienti + 10 appuntamenti)</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> App personalizzata con logo e colori</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> <b>Notifiche Push Illimitate</b></li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Catalogo Prodotti/Servizi</li>
                <li><i className="fas fa-check text-orange-400 mr-2"></i> Gestione Coupon Sconto</li>
                <li><i className="fas fa-key text-yellow-300 mr-2"></i> <b>Chiave di sblocco definitiva</b></li>
              </ul>
              <a href="#contatti" className="block w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition">Scegli Pro</a>
            </div>
            {/* Piano Custom */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition">
              <h4 className="text-xl font-bold mb-2">Enterprise</h4>
              <div className="text-4xl font-bold mb-6">Su Misura</div>
              <ul className="text-left space-y-4 mb-8 text-gray-600">
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Pubblicazione su Store</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Integrazione Gestionale</li>
                <li><i className="fas fa-check text-emerald-500 mr-2"></i> Funzioni Avanzate</li>
              </ul>
              <a href="#contatti" className="block w-full py-3 border-2 border-gray-800 text-gray-800 rounded-xl font-bold hover:bg-gray-800 hover:text-white transition">Contattaci</a>
            </div>
          </div>
        </div>
      </section>

      {/* Form Contatti */}
      <section id="contatti" className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Inizia il tuo progetto</h2>
            <p className="opacity-70 font-light">Compila il modulo: analizzeremo la fattibilità gratuitamente.</p>
          </div>

          {sent ? (
            <div className="bg-emerald-500 rounded-2xl p-10 text-center">
              <i className="fas fa-check-circle text-5xl mb-4 block"></i>
              <h3 className="text-2xl font-bold mb-2">Richiesta inviata!</h3>
              <p className="opacity-90">Ti contatteremo entro 24 ore con la tua bozza personalizzata.</p>
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
                    placeholder="Es. Officina Rossi"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Settore</label>
                  <select
                    name="settore"
                    value={form.settore}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Medico">Medico / Professionista</option>
                    <option value="Estetica">Estetica / Parrucchiere</option>
                    <option value="Meccanico">Autorimessa / Meccanico</option>
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
                <label className="block text-sm font-medium mb-2">Cosa deve fare la tua App?</label>
                <textarea
                  name="messaggio"
                  value={form.messaggio}
                  onChange={handleChange}
                  required
                  placeholder="Descrivi brevemente la tua idea..."
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
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio in corso...</> : "Invia Richiesta Gratuita"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Banner pagina di test */}
      <div className="bg-yellow-100 border-t border-yellow-300 text-yellow-800 text-center text-sm py-3 px-4 font-medium">
        ⚠️ Questa è una pagina di test — non un sito ufficiale.
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="opacity-60">© 2026 PromoApp.it - P.IVA: [LA TUA P.IVA SE CE L'HAI]</div>
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
            <span>Creato con passione</span>
          </div>
        </div>
      </footer>

      {/* Tasto WhatsApp Flottante */}
      <a
        href="https://wa.me/39IL_TUO_NUMERO"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-50 hover:bg-green-600 transition-all hover:scale-110"
      >
        <i className="fab fa-whatsapp text-3xl"></i>
      </a>

      {/* Cookie Banner */}
      <CookieBanner />
    </>
  );
}
