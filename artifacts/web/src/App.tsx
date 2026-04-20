import { useState } from "react";

export default function App() {
  const [form, setForm] = useState({ nome: "", email: "", telefono: "", settore: "", messaggio: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
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
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto font-light">
            Basta siti web dimenticati. Entra nello smartphone dei tuoi clienti. Gestisci prenotazioni e vendite tutto online.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a href="#demo" className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition transform">
              Guarda le Demo Live
            </a>
            <a href="#contatti" className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition transform">
              Richiedi la tua App
            </a>
          </div>
          <div className="mt-10 flex justify-center items-center space-x-6 opacity-80 text-sm">
            <span><i className="fas fa-bolt mr-2"></i> Pronto in 7 giorni</span>
            <span><i className="fas fa-shield-alt mr-2"></i> Tutto incluso</span>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section id="come-funziona" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold">Semplifichiamo la tua vita aziendale</h2>
          <p className="text-gray-500">Tutto il processo è pensato per chi non ha tempo da perdere.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <div className="p-8 rounded-2xl hover:bg-gray-50 transition">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="fas fa-magic"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Zero Tecnicismi</h3>
            <p className="text-gray-600 italic">"Non so come si faccia" non è più una scusa. Pensiamo a tutto noi, tu ci metti solo il logo.</p>
          </div>
          <div className="p-8 rounded-2xl hover:bg-gray-50 transition">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Sempre in tasca</h3>
            <p className="text-gray-600 italic">Invia notifiche push per offerte o promemoria appuntamenti direttamente sul telefono del cliente.</p>
          </div>
          <div className="p-8 rounded-2xl hover:bg-gray-50 transition">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="fas fa-euro-sign"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Costi Abbattuti</h3>
            <p className="text-gray-600 italic">Prezzi chiari, nessun costo nascosto. Paghi solo per quello che ti serve davvero per crescere.</p>
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
      <section id="prezzi" className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center border-2 border-dashed border-gray-200 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Abbonamento All-Inclusive</h2>
          <div className="text-6xl font-black text-indigo-600 mb-4">
            €49<span className="text-xl text-gray-400 font-normal">/mese</span>
          </div>
          <p className="text-gray-500 mb-8 font-medium text-lg">Nessuna sorpresa. Ci occupiamo noi di aggiornamenti e manutenzione.</p>
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-10 text-gray-700">
            <div><i className="fas fa-check text-emerald-500 mr-2"></i> Pubblicazione Store</div>
            <div><i className="fas fa-check text-emerald-500 mr-2"></i> Assistenza 24/7</div>
            <div><i className="fas fa-check text-emerald-500 mr-2"></i> Notifiche Illimitate</div>
            <div><i className="fas fa-check text-emerald-500 mr-2"></i> Pagamenti Online</div>
          </div>
          <a href="#contatti" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-indigo-700 transition">
            Inizia il tuo mese gratuito
          </a>
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
                    name="nome"
                    required
                    value={form.nome}
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
                    <option value="medico">Medico / Professionista</option>
                    <option value="estetica">Estetica / Parrucchiere</option>
                    <option value="autorimessa">Autorimessa / Meccanico</option>
                    <option value="agente">Agente di Commercio</option>
                    <option value="altro">Altro</option>
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
                  placeholder="Descrivi brevemente la tua idea..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition shadow-lg"
              >
                Invia Richiesta Gratuita
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-60 text-sm">
          <div>© {new Date().getFullYear()} PromoApp.it - Soluzioni Digitali Snelle</div>
          <div className="mt-4 md:mt-0 space-x-6 italic">
            <span>Creato con passione per i piccoli business</span>
          </div>
        </div>
      </footer>

      {/* Tasto WhatsApp Flottante */}
      <a
        href="https://wa.me/39IL_TUO_NUMERO"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg z-50 hover:bg-green-600 transition"
      >
        <i className="fab fa-whatsapp fa-2x"></i>
      </a>
    </>
  );
}
