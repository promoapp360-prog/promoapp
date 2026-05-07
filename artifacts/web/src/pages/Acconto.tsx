import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API_BASE = "";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Step = "progetto" | "dati" | "pagamento" | "successo";
type TipoCliente = "privato" | "azienda";

interface FormData {
  progetto: string;
  importoEuro: string;
  tipo: TipoCliente;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  codiceFiscale: string;
  ragioneSociale: string;
  piva: string;
  sdi: string;
  pec: string;
}

const EMPTY_FORM: FormData = {
  progetto: "", importoEuro: "",
  tipo: "privato",
  nome: "", cognome: "", email: "", telefono: "",
  indirizzo: "", cap: "", citta: "", provincia: "",
  codiceFiscale: "",
  ragioneSociale: "", piva: "", sdi: "", pec: "",
};

const input = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
const label = "block text-sm font-medium text-gray-700 mb-1";

function StripeForm({ clientSecret, importo, accontoId, stripePromise, onSuccess }: {
  clientSecret: string; importo: number; accontoId: string;
  stripePromise: any; onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + `${basePath}/acconto?success=1` },
      redirect: "if_required",
    });

    if (stripeErr) {
      setError(stripeErr.message || "Errore nel pagamento");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      await fetch(`${API_BASE}/api/acconto/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      onSuccess();
    }
    setLoading(false);
  }

  const importoFmt = (importo / 100).toFixed(2).replace(".", ",");

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-4 rounded-xl font-bold text-white text-base transition flex items-center justify-center gap-2"
        style={{ background: loading ? "#9ca3af" : "#6366f1", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? (
          <><i className="fas fa-spinner fa-spin"></i> Elaborazione...</>
        ) : (
          <><i className="fas fa-lock"></i> Paga {importoFmt}€ in modo sicuro</>
        )}
      </button>
      <p className="text-xs text-center text-gray-400">
        🔒 Pagamento sicuro via Stripe · Riceverai subito la ricevuta via email
      </p>
    </form>
  );
}

export default function Acconto() {
  const [step, setStep] = useState<Step>("progetto");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [accontoId, setAccontoId] = useState("");
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") setStep("successo");
    fetch(`${API_BASE}/api/checkout/publishable-key`)
      .then(r => r.json())
      .then(d => setStripePromise(loadStripe(d.publishableKey)))
      .catch(() => {});
  }, []);

  function set(field: keyof FormData, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function validaProgetto() {
    if (!form.progetto.trim()) { setError("Descrivi il progetto"); return false; }
    const importo = parseFloat(form.importoEuro);
    if (!form.importoEuro || isNaN(importo) || importo < 1) { setError("Inserisci un importo di almeno 1€"); return false; }
    return true;
  }

  function validaDati() {
    if (!form.nome || !form.cognome || !form.email || !form.telefono) { setError("Compila tutti i dati personali"); return false; }
    if (!form.indirizzo || !form.cap || !form.citta) { setError("Compila l'indirizzo completo"); return false; }
    if (form.tipo === "azienda" && (!form.ragioneSociale || !form.piva)) { setError("Ragione Sociale e P.IVA obbligatorie per le aziende"); return false; }
    return true;
  }

  async function procediPagamento() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/acconto/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setClientSecret(data.clientSecret);
      setAccontoId(data.accontoId);
      setStep("pagamento");
    } catch {
      setError("Errore di connessione. Riprova.");
    }
    setLoading(false);
  }

  const importoCentesimi = Math.round(parseFloat(form.importoEuro || "0") * 100);

  if (step === "successo") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-circle text-4xl text-green-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acconto confermato!</h1>
          <p className="text-gray-500 mb-2">Hai ricevuto la ricevuta via email.</p>
          <p className="text-gray-500 mb-6 text-sm">Il nostro team ti contatterà presto per procedere con il tuo progetto.</p>
          <div className="bg-indigo-50 rounded-2xl p-4 mb-6 text-sm text-indigo-700">
            <i className="fas fa-whatsapp mr-2"></i>
            Puoi anche scriverci su <strong>WhatsApp</strong> al <strong>+39 379 360 2035</strong>
          </div>
          <a href="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Torna alla home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-indigo-600 tracking-tighter">
            Promo<span className="text-emerald-500">App</span>.it
          </a>
          <h1 className="text-2xl font-bold text-gray-800 mt-3">Lascia un Acconto</h1>
          <p className="text-gray-500 text-sm mt-1">Versamento sicuro per il tuo progetto — riceverai subito la ricevuta via email</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["progetto", "dati", "pagamento"] as Step[]).map((s, i) => {
            const labels = ["Progetto", "Dati", "Pagamento"];
            const idx = ["progetto", "dati", "pagamento"].indexOf(step);
            const active = s === step;
            const done = i < idx;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-8 ${done || active ? "bg-indigo-400" : "bg-gray-200"}`}></div>}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${active ? "bg-indigo-600 text-white" : done ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                  {done ? <i className="fas fa-check text-xs"></i> : <span>{i + 1}</span>}
                  {labels[i]}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">

          {/* STEP 1: Progetto + importo */}
          {step === "progetto" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Il tuo progetto</h2>
                <p className="text-gray-500 text-sm">Descrivici per cosa stai lasciando l'acconto</p>
              </div>
              <div>
                <label className={label}>Descrizione del progetto *</label>
                <textarea
                  value={form.progetto}
                  onChange={e => set("progetto", e.target.value)}
                  rows={3}
                  placeholder="es. App gestionale per la mia pizzeria — 3 tavoli, ordini, cassa"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none"
                />
              </div>
              <div>
                <label className={label}>Importo acconto (€) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">€</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.importoEuro}
                    onChange={e => set("importoEuro", e.target.value)}
                    placeholder="es. 150"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Importo libero · minimo 1€ · puoi versare qualsiasi cifra</p>
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
              <button
                onClick={() => { if (validaProgetto()) { setError(""); setStep("dati"); } }}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                Continua <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {/* STEP 2: Dati cliente */}
          {step === "dati" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("progetto")} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Dati personali e fiscali</h2>
                  <p className="text-gray-500 text-sm">Necessari per la ricevuta ufficiale</p>
                </div>
              </div>

              {/* Tipo privato/azienda */}
              <div className="grid grid-cols-2 gap-3">
                {(["privato", "azienda"] as const).map(t => (
                  <button key={t} type="button" onClick={() => set("tipo", t)}
                    className="py-3 rounded-xl border-2 font-semibold text-sm transition"
                    style={{ borderColor: form.tipo === t ? "#6366f1" : "#e5e7eb", background: form.tipo === t ? "#eef2ff" : "white", color: form.tipo === t ? "#4338ca" : "#6b7280" }}>
                    {t === "privato" ? "👤 Privato / Libero prof." : "🏢 Azienda / P.IVA"}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={label}>Nome *</label><input name="nome" value={form.nome} onChange={e => set("nome", e.target.value)} className={input} placeholder="Mario" /></div>
                <div><label className={label}>Cognome *</label><input name="cognome" value={form.cognome} onChange={e => set("cognome", e.target.value)} className={input} placeholder="Rossi" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={label}>Email *</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={input} placeholder="mario@esempio.it" /></div>
                <div><label className={label}>Telefono *</label><input type="tel" value={form.telefono} onChange={e => set("telefono", e.target.value)} className={input} placeholder="+39 333 1234567" /></div>
              </div>
              <div><label className={label}>Indirizzo (via e numero) *</label><input value={form.indirizzo} onChange={e => set("indirizzo", e.target.value)} className={input} placeholder="Via Roma, 1" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={label}>CAP *</label><input value={form.cap} onChange={e => set("cap", e.target.value)} className={input} placeholder="00100" maxLength={5} /></div>
                <div className="col-span-2"><label className={label}>Città *</label><input value={form.citta} onChange={e => set("citta", e.target.value)} className={input} placeholder="Roma" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={label}>Provincia</label><input value={form.provincia} onChange={e => set("provincia", e.target.value)} className={input} placeholder="RM" maxLength={2} /></div>
                <div><label className={label}>Codice Fiscale</label><input value={form.codiceFiscale} onChange={e => set("codiceFiscale", e.target.value)} className={input} placeholder="RSSMRA80A01H501Z" maxLength={16} /></div>
              </div>

              {form.tipo === "azienda" && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Dati azienda</p>
                  <div><label className={label}>Ragione Sociale *</label><input value={form.ragioneSociale} onChange={e => set("ragioneSociale", e.target.value)} className={input} placeholder="Mia Azienda S.r.l." /></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={label}>Partita IVA *</label><input value={form.piva} onChange={e => set("piva", e.target.value)} className={input} placeholder="12345678901" maxLength={11} /></div>
                    <div><label className={label}>Codice SDI</label><input value={form.sdi} onChange={e => set("sdi", e.target.value)} className={input} placeholder="XXXXXXX" maxLength={7} /></div>
                  </div>
                  <div><label className={label}>PEC</label><input type="email" value={form.pec} onChange={e => set("pec", e.target.value)} className={input} placeholder="azienda@pec.it" /></div>
                </div>
              )}

              {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

              {/* Riepilogo acconto */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-indigo-500 font-semibold uppercase tracking-widest">Acconto per</div>
                  <div className="font-bold text-gray-800 mt-0.5 text-sm truncate max-w-[200px]">{form.progetto}</div>
                </div>
                <div className="text-2xl font-extrabold text-indigo-700">€ {parseFloat(form.importoEuro || "0").toFixed(2)}</div>
              </div>

              <button
                onClick={() => { if (validaDati()) { setError(""); procediPagamento(); } }}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                style={{ background: loading ? "#9ca3af" : "#6366f1" }}
              >
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Preparazione pagamento...</> : <><i className="fas fa-credit-card"></i> Procedi al pagamento</>}
              </button>
            </div>
          )}

          {/* STEP 3: Pagamento Stripe */}
          {step === "pagamento" && clientSecret && stripePromise && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("dati")} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Pagamento</h2>
                  <p className="text-gray-500 text-sm">Inserisci i dati della tua carta</p>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-indigo-500 font-semibold uppercase tracking-widest">Acconto per</div>
                  <div className="font-bold text-gray-800 mt-0.5 text-sm truncate max-w-[200px]">{form.progetto}</div>
                </div>
                <div className="text-2xl font-extrabold text-indigo-700">€ {parseFloat(form.importoEuro || "0").toFixed(2)}</div>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret, locale: "it" }}>
                <StripeForm
                  clientSecret={clientSecret}
                  importo={importoCentesimi}
                  accontoId={accontoId}
                  stripePromise={stripePromise}
                  onSuccess={() => setStep("successo")}
                />
              </Elements>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Dati protetti · <a href="/privacy.html" className="underline hover:text-gray-600">Privacy Policy</a> · Sophia 2005 S.r.l. · P.IVA 08223951008
        </p>
      </div>
    </div>
  );
}
