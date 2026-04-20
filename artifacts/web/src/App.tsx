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
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Vendi Online</h3>
            <p className="text-gray-600 italic">Che sia un massaggio o un paio di scarpe, i tuoi clienti pagano comodamente dall'app.</p>
          </div>
        </div>
      </section>

      {/* Demo Settori */}
      <section id="demo" className="py-24 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Scegli il tuo modello</h2>
          <p className="text-gray-600 mb-16">Clicca su una demo per vedere come sarà la tua futura app.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600",
                title: "Beauty & Spa",
                desc: "Perfetta per estetiste e centri massaggi. Prenotazione oraria e fidelity card incluse.",
              },
              {
                img: "https://images.unsplash.com/photo-1505751172107-573225a9134c?auto=format&fit=crop&w=600",
                title: "Medical Center",
                desc: "Gestione pazienti, prenotazione visite e invio referti in totale sicurezza e semplicità.",
              },
              {
                img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600",
                title: "Local Shop",
                desc: "Trasforma il tuo negozio in un e-commerce tascabile. Notifiche per i nuovi arrivi.",
              },
            ].map((item) => (
              <div key={item.title} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition border border-gray-100">
                <img src={item.img} alt={item.title} className="h-56 w-full object-cover group-hover:scale-110 transition duration-500" />
                <div className="p-8 text-left">
                  <h4 className="font-bold text-2xl mb-2">{item.title}</h4>
                  <p className="text-gray-500 text-sm mb-6">{item.desc}</p>
                  <button className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                    Prova Demo
                  </button>
                </div>
              </div>
            ))}
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
      <section id="contatti" className="py-24 bg-indigo-900 text-white px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Configura la tua App</h2>
          <p className="text-center mb-10 opacity-70">Entro 24 ore riceverai una bozza della tua app personalizzata.</p>

          {sent ? (
            <div className="bg-emerald-500 rounded-2xl p-10 text-center">
              <i className="fas fa-check-circle text-5xl mb-4 block"></i>
              <h3 className="text-2xl font-bold mb-2">Richiesta inviata!</h3>
              <p className="opacity-90">Ti contatteremo entro 24 ore con la tua bozza personalizzata.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">Nome e Cognome</label>
                  <input
                    type="text"
                    name="nome"
                    required
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Mario Rossi"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">Telefono</label>
                  <input
                    type="tel"
                    name="telefono"
                    required
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="+39 333 000 0000"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="mario@esempio.it"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Tipo di attività</label>
                <select
                  name="settore"
                  required
                  value={form.settore}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-indigo-800 border border-white/20 focus:outline-none focus:border-emerald-400 transition appearance-none"
                >
                  <option value="">Seleziona il tuo settore...</option>
                  <option value="beauty">Beauty & Spa</option>
                  <option value="medical">Centro Medico</option>
                  <option value="shop">Negozio / E-commerce</option>
                  <option value="restaurant">Ristorante / Bar</option>
                  <option value="altro">Altro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Descrivi brevemente la tua attività</label>
                <textarea
                  name="messaggio"
                  rows={4}
                  value={form.messaggio}
                  onChange={handleChange}
                  placeholder="Es: ho un centro estetico con 3 dipendenti, offro trattamenti viso e massaggi..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-white/40 focus:outline-none focus:border-emerald-400 transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-bold text-lg transition shadow-xl"
              >
                <i className="fas fa-paper-plane mr-2"></i> Invia la Richiesta Gratuita
              </button>
              <p className="text-center text-xs opacity-50 pt-2">Nessun impegno. Primo mese gratuito.</p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-950 text-white py-8 px-4 text-center text-sm opacity-60">
        © {new Date().getFullYear()} PromoApp.it — Tutti i diritti riservati
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
