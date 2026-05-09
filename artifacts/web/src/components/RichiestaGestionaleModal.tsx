import { useState } from "react";

const API_BASE = "";

interface Props {
  tipo: "gestionale360" | "agentipro";
  onClose: () => void;
}

const TIPI_SOGGETTO = [
  { value: "privato",      label: "Libero professionista / Persona fisica" },
  { value: "ditta",        label: "Ditta individuale" },
  { value: "srl",          label: "S.r.l. / S.r.l.s." },
  { value: "spa",          label: "S.p.A." },
  { value: "associazione", label: "Associazione / Ente" },
  { value: "altro",        label: "Altro" },
];

const SETTORI = [
  "Abbigliamento & Moda", "Alimentari & GDO", "Autoricambi & Automotive",
  "Elettronica & Informatica", "Ferramenta & Bricolage", "Giocattoli & Hobby",
  "Libri & Cartoleria", "Negozio generico", "Agente di commercio",
  "Rappresentante", "Distributore", "Altro",
];

const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
const lbl = "block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide";

export default function RichiestaGestionaleModal({ tipo, onClose }: Props) {
  const [form, setForm] = useState({
    nome: "", cognome: "", email: "", telefono: "",
    tipoSoggetto: "privato", ragioneSociale: "", piva: "",
    codiceFiscale: "", settore: "", note: "",
  });
  const [loading, setLoading] = useState(false);
  const [inviato, setInviato] = useState(false);
  const [errore, setErrore] = useState("");

  const nomeGestionale = tipo === "gestionale360" ? "Gestionale360" : "AgentiPro";
  const colore = tipo === "gestionale360" ? "emerald" : "orange";

  function set(field: string, val: string) { setForm(f => ({ ...f, [field]: val })); }

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.email) { setErrore("Nome ed email sono obbligatori"); return; }
    setLoading(true); setErrore("");
    const res = await fetch(`${API_BASE}/api/richiesta-gestionale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tipo }),
    });
    setLoading(false);
    if (res.ok) { setInviato(true); }
    else { setErrore("Errore nell'invio. Riprova o contattaci su WhatsApp."); }
  }

  if (inviato) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-emerald-600 text-3xl"></i>
        </div>
        <h3 className="text-2xl font-extrabold mb-2">Richiesta inviata!</h3>
        <p className="text-gray-500 mb-6">Ti contatteremo entro 24 ore con le credenziali per accedere a <strong>{nomeGestionale}</strong>.</p>
        <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">
          Chiudi
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${tipo === "gestionale360" ? "from-emerald-700 to-emerald-900" : "from-orange-600 to-red-600"} text-white p-6 rounded-t-3xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Prova gratuita</p>
              <h2 className="text-2xl font-extrabold">{nomeGestionale}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        </div>

        <form onSubmit={invia} className="p-6 space-y-5">

          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed">
            <p className="font-bold mb-1"><i className="fas fa-circle-info mr-2"></i>Cosa include la prova gratuita</p>
            <p>Riceverai un accesso personalizzato a <strong>{nomeGestionale}</strong> con i tuoi dati aziendali già inseriti. Il software può essere utilizzato <strong>online via browser</strong> oppure <strong>scaricato come applicazione per Windows e macOS</strong>. Il prezzo di 199€ comprende <em>solo la personalizzazione dei dati</em>. Eventuali modifiche funzionali aggiuntive saranno preventivate separatamente.</p>
          </div>

          {/* Dati anagrafici */}
          <div>
            <p className="font-bold text-gray-700 mb-3 text-sm"><i className="fas fa-user mr-2 text-indigo-400"></i>Dati personali</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Nome *</label>
                <input className={inp} value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Mario" required />
              </div>
              <div>
                <label className={lbl}>Cognome</label>
                <input className={inp} value={form.cognome} onChange={e => set("cognome", e.target.value)} placeholder="Rossi" />
              </div>
              <div>
                <label className={lbl}>Email *</label>
                <input className={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="mario@esempio.it" required />
              </div>
              <div>
                <label className={lbl}>Telefono</label>
                <input className={inp} type="tel" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+39 320 123 4567" />
              </div>
            </div>
          </div>

          {/* Tipo soggetto */}
          <div>
            <p className="font-bold text-gray-700 mb-3 text-sm"><i className="fas fa-building mr-2 text-indigo-400"></i>Tipo di attività</p>
            <div>
              <label className={lbl}>Sei...</label>
              <select className={inp} value={form.tipoSoggetto} onChange={e => set("tipoSoggetto", e.target.value)}>
                {TIPI_SOGGETTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Dati fiscali (mostrati se non privato) */}
          {form.tipoSoggetto !== "privato" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={lbl}>Ragione Sociale</label>
                <input className={inp} value={form.ragioneSociale} onChange={e => set("ragioneSociale", e.target.value)} placeholder="Rossi S.r.l." />
              </div>
              <div>
                <label className={lbl}>Partita IVA</label>
                <input className={inp} value={form.piva} onChange={e => set("piva", e.target.value)} placeholder="IT12345678901" />
              </div>
              <div>
                <label className={lbl}>Codice Fiscale</label>
                <input className={inp} value={form.codiceFiscale} onChange={e => set("codiceFiscale", e.target.value)} placeholder="RSSMRA80A01H501Z" />
              </div>
            </div>
          )}
          {form.tipoSoggetto === "privato" && (
            <div>
              <label className={lbl}>Codice Fiscale</label>
              <input className={inp} value={form.codiceFiscale} onChange={e => set("codiceFiscale", e.target.value)} placeholder="RSSMRA80A01H501Z" />
            </div>
          )}

          {/* Settore */}
          <div>
            <label className={lbl}>Settore attività</label>
            <select className={inp} value={form.settore} onChange={e => set("settore", e.target.value)}>
              <option value="">— Seleziona —</option>
              {SETTORI.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className={lbl}>Note aggiuntive (facoltativo)</label>
            <textarea className={`${inp} resize-none`} rows={3} value={form.note} onChange={e => set("note", e.target.value)} placeholder="Dicci qualcosa in più sulla tua attività..." />
          </div>

          {errore && <p className="text-red-500 text-sm"><i className="fas fa-triangle-exclamation mr-1"></i>{errore}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-extrabold text-white py-4 rounded-2xl text-lg transition shadow-lg ${tipo === "gestionale360" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-orange-600 hover:bg-orange-700"} disabled:opacity-60`}
          >
            {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio...</> : <><i className="fas fa-paper-plane mr-2"></i>Richiedi la tua prova gratis</>}
          </button>
          <p className="text-center text-xs text-gray-400">Nessun pagamento richiesto · Ti contatteremo entro 24 ore</p>
        </form>
      </div>
    </div>
  );
}
