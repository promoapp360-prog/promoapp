import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API_BASE = "";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

type Modalita = "scelta" | "acconto" | "saldo";
type StepAcconto = "progetto" | "dati" | "pagamento" | "successo";
type StepSaldo = "cerca" | "dettaglio" | "pagamento" | "successo";
type TipoCliente = "privato" | "azienda";
type MetodoPagamento = "stripe" | "paypal";

interface FormData {
  progetto: string; importoTotaleEuro: string; importoEuro: string;
  tipo: TipoCliente; nome: string; cognome: string; email: string; telefono: string;
  indirizzo: string; cap: string; citta: string; provincia: string;
  codiceFiscale: string; ragioneSociale: string; piva: string; sdi: string; pec: string;
}

interface ProgettoTrovato {
  id: string; progetto: string; nome: string; cognome: string;
  importoTotale: number; totaleVersato: number; saldoRimanente: number;
}

const EMPTY_FORM: FormData = {
  progetto: "", importoTotaleEuro: "", importoEuro: "",
  tipo: "privato", nome: "", cognome: "", email: "", telefono: "",
  indirizzo: "", cap: "", citta: "", provincia: "", codiceFiscale: "",
  ragioneSociale: "", piva: "", sdi: "", pec: "",
};

const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
const lbl = "block text-sm font-medium text-gray-700 mb-1";

function StripeForm({ importo, onSuccess }: { importo: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError("");
    const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + `${basePath}/pagamenti?success=1` },
      redirect: "if_required",
    });
    if (stripeErr) { setError(stripeErr.message || "Errore nel pagamento"); setLoading(false); return; }
    if (paymentIntent?.status === "succeeded") {
      await fetch(`${API_BASE}/api/acconto/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-4 rounded-xl font-bold text-white text-base transition flex items-center justify-center gap-2"
        style={{ background: loading ? "#9ca3af" : "#6366f1", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? <><i className="fas fa-spinner fa-spin"></i> Elaborazione...</> : <><i className="fas fa-lock"></i> Paga {(importo / 100).toFixed(2).replace(".", ",")}€ in modo sicuro</>}
      </button>
      <p className="text-xs text-center text-gray-400">🔒 Pagamento sicuro via Stripe · Riceverai subito la ricevuta via email</p>
    </form>
  );
}

function PayPalBox({ importoEuro, accontoId, confirmEndpoint, onSuccess }: {
  importoEuro: string; accontoId: string; confirmEndpoint: string; onSuccess: () => void;
}) {
  const [errore, setErrore] = useState("");
  const importo = parseFloat(importoEuro).toFixed(2);

  return (
    <div className="space-y-3">
      <PayPalButtons
        style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
        createOrder={(_data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [{
              amount: { currency_code: "EUR", value: importo },
              description: "Pagamento PromoApp.it",
            }],
          });
        }}
        onApprove={async (data, actions) => {
          setErrore("");
          try {
            await actions.order!.capture();
            const res = await fetch(`${API_BASE}${confirmEndpoint}`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accontoId, orderId: data.orderID }),
            });
            if (!res.ok) { setErrore("Errore nella conferma. Contattaci su WhatsApp."); return; }
            onSuccess();
          } catch { setErrore("Errore di connessione. Contattaci su WhatsApp al +39 379 360 2035"); }
        }}
        onError={() => setErrore("Errore PayPal. Riprova o usa la carta di credito.")}
        onCancel={() => setErrore("Pagamento annullato.")}
      />
      {errore && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 text-center">{errore}</p>}
      <p className="text-xs text-center text-gray-400">🔒 Pagamento sicuro via PayPal · Riceverai subito la ricevuta via email</p>
    </div>
  );
}

function MetodoBox({ metodo, onSelect }: { metodo: MetodoPagamento | null; onSelect: (m: MetodoPagamento) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700 text-center">Scegli come pagare</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onSelect("stripe")}
          className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition font-semibold text-sm"
          style={{ borderColor: metodo === "stripe" ? "#6366f1" : "#e5e7eb", background: metodo === "stripe" ? "#eef2ff" : "white", color: metodo === "stripe" ? "#4338ca" : "#6b7280" }}>
          <i className="fas fa-credit-card text-xl"></i>
          Carta di credito
        </button>
        <button type="button" onClick={() => onSelect("paypal")}
          className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition font-semibold text-sm"
          style={{ borderColor: metodo === "paypal" ? "#003087" : "#e5e7eb", background: metodo === "paypal" ? "#e8f0fe" : "white", color: metodo === "paypal" ? "#003087" : "#6b7280" }}>
          <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-5 object-contain" />
          PayPal
        </button>
      </div>
    </div>
  );
}

function Successo({ tipo }: { tipo: "acconto" | "saldo" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${tipo === "saldo" ? "bg-green-100" : "bg-indigo-100"}`}>
          <i className={`fas fa-check-circle text-4xl ${tipo === "saldo" ? "text-green-500" : "text-indigo-500"}`}></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{tipo === "saldo" ? "Saldo pagato!" : "Acconto confermato!"}</h1>
        <p className="text-gray-500 mb-2">{tipo === "saldo" ? "Il progetto è ora completamente saldato. Grazie!" : "Hai ricevuto la ricevuta via email."}</p>
        <p className="text-gray-500 mb-6 text-sm">Il nostro team ti contatterà presto.</p>
        <div className="bg-indigo-50 rounded-2xl p-4 mb-6 text-sm text-indigo-700">
          <i className="fab fa-whatsapp mr-2"></i>Scrivici su <strong>WhatsApp</strong> al <strong>+39 379 360 2035</strong>
        </div>
        <a href="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Torna alla home</a>
      </div>
    </div>
  );
}

export default function Pagamenti() {
  const [modalita, setModalita] = useState<Modalita>("scelta");
  const [stripePromise, setStripePromise] = useState<any>(null);

  const [stepA, setStepA] = useState<StepAcconto>("progetto");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errA, setErrA] = useState("");
  const [loadingA, setLoadingA] = useState(false);
  const [csAcconto, setCsAcconto] = useState("");
  const [metodoA, setMetodoA] = useState<MetodoPagamento | null>(null);
  const [accontoIdPaypal, setAccontoIdPaypal] = useState("");

  const [stepS, setStepS] = useState<StepSaldo>("cerca");
  const [emailSaldo, setEmailSaldo] = useState("");
  const [progetti, setProgetti] = useState<ProgettoTrovato[]>([]);
  const [progettoScelto, setProgettoScelto] = useState<ProgettoTrovato | null>(null);
  const [importoSaldoEuro, setImportoSaldoEuro] = useState("");
  const [errS, setErrS] = useState("");
  const [loadingS, setLoadingS] = useState(false);
  const [csSaldo, setCsSaldo] = useState("");
  const [importoSaldoCent, setImportoSaldoCent] = useState(0);
  const [metodoS, setMetodoS] = useState<MetodoPagamento | null>(null);
  const [saldoIdPaypal, setSaldoIdPaypal] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setModalita(params.get("tipo") === "saldo" ? "saldo" : "acconto");
      setStepA("successo"); setStepS("successo");
    }
    fetch(`${API_BASE}/api/checkout/publishable-key`)
      .then(r => r.json())
      .then(d => setStripePromise(loadStripe(d.publishableKey)))
      .catch(() => {});
  }, []);

  function setF(field: keyof FormData, val: string) { setForm(f => ({ ...f, [field]: val })); }

  function validaProgetto() {
    if (!form.progetto.trim()) { setErrA("Descrivi il progetto"); return false; }
    if (form.importoTotaleEuro) {
      const tot = parseFloat(form.importoTotaleEuro);
      if (isNaN(tot) || tot < 1) { setErrA("Importo totale non valido"); return false; }
    }
    const acc = parseFloat(form.importoEuro);
    if (!form.importoEuro || isNaN(acc) || acc < 1) { setErrA("Inserisci un importo di almeno 1€"); return false; }
    if (form.importoTotaleEuro && acc > parseFloat(form.importoTotaleEuro)) { setErrA("L'acconto non può superare il totale del progetto"); return false; }
    return true;
  }
  function validaDati() {
    if (!form.nome || !form.cognome || !form.email || !form.telefono) { setErrA("Compila tutti i dati personali"); return false; }
    if (!form.indirizzo || !form.cap || !form.citta) { setErrA("Compila l'indirizzo completo"); return false; }
    if (form.tipo === "azienda" && (!form.ragioneSociale || !form.piva)) { setErrA("Ragione Sociale e P.IVA obbligatorie"); return false; }
    return true;
  }

  async function procediPagamentoAccontoStripe() {
    setErrA(""); setLoadingA(true);
    try {
      const res = await fetch(`${API_BASE}/api/acconto/create-intent`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tipoPagamento: "acconto" }),
      });
      const data = await res.json();
      if (!res.ok) { setErrA(data.error); setLoadingA(false); return; }
      setCsAcconto(data.clientSecret);
      setStepA("pagamento");
    } catch { setErrA("Errore di connessione. Riprova."); }
    setLoadingA(false);
  }

  async function procediPagamentoAccontoPaypal() {
    setErrA(""); setLoadingA(true);
    try {
      const res = await fetch(`${API_BASE}/api/acconto/paypal/create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrA(data.error); setLoadingA(false); return; }
      setAccontoIdPaypal(data.accontoId);
      setStepA("pagamento");
    } catch { setErrA("Errore di connessione. Riprova."); }
    setLoadingA(false);
  }

  async function procediMetodoAcconto() {
    if (!metodoA) { setErrA("Scegli un metodo di pagamento"); return; }
    if (metodoA === "stripe") await procediPagamentoAccontoStripe();
    else await procediPagamentoAccontoPaypal();
  }

  async function cercaProgetti() {
    if (!emailSaldo.trim()) { setErrS("Inserisci la tua email"); return; }
    setLoadingS(true); setErrS("");
    try {
      const res = await fetch(`${API_BASE}/api/acconto/cerca-progetto?email=${encodeURIComponent(emailSaldo)}`);
      const data = await res.json();
      if (!res.ok) { setErrS(data.error); setLoadingS(false); return; }
      if (data.length === 0) { setErrS("Nessun progetto con saldo aperto trovato per questa email"); setLoadingS(false); return; }
      setProgetti(data); setStepS("dettaglio");
    } catch { setErrS("Errore di connessione. Riprova."); }
    setLoadingS(false);
  }

  async function procediPagamentoSaldoStripe() {
    if (!progettoScelto) return;
    const centesimi = Math.round(parseFloat(importoSaldoEuro) * 100);
    if (!importoSaldoEuro || isNaN(centesimi) || centesimi < 100) { setErrS("Inserisci un importo valido (min. 1€)"); return; }
    if (centesimi > progettoScelto.saldoRimanente) { setErrS(`Il saldo rimanente è ${(progettoScelto.saldoRimanente / 100).toFixed(2)}€`); return; }
    setLoadingS(true); setErrS("");
    try {
      const res = await fetch(`${API_BASE}/api/acconto/saldo/create-intent`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progettoRef: progettoScelto.id, importoEuro: importoSaldoEuro }),
      });
      const data = await res.json();
      if (!res.ok) { setErrS(data.error); setLoadingS(false); return; }
      setCsSaldo(data.clientSecret);
      setImportoSaldoCent(centesimi);
      setStepS("pagamento");
    } catch { setErrS("Errore di connessione. Riprova."); }
    setLoadingS(false);
  }

  async function procediPagamentoSaldoPaypal() {
    if (!progettoScelto) return;
    const centesimi = Math.round(parseFloat(importoSaldoEuro) * 100);
    if (!importoSaldoEuro || isNaN(centesimi) || centesimi < 100) { setErrS("Inserisci un importo valido (min. 1€)"); return; }
    setLoadingS(true); setErrS("");
    try {
      const res = await fetch(`${API_BASE}/api/acconto/saldo/paypal/create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progettoRef: progettoScelto.id, importoEuro: importoSaldoEuro }),
      });
      const data = await res.json();
      if (!res.ok) { setErrS(data.error); setLoadingS(false); return; }
      setSaldoIdPaypal(data.accontoId);
      setImportoSaldoCent(centesimi);
      setStepS("pagamento");
    } catch { setErrS("Errore di connessione. Riprova."); }
    setLoadingS(false);
  }

  async function procediMetodoSaldo() {
    if (!metodoS) { setErrS("Scegli un metodo di pagamento"); return; }
    if (metodoS === "stripe") await procediPagamentoSaldoStripe();
    else await procediPagamentoSaldoPaypal();
  }

  if ((modalita === "acconto" && stepA === "successo") || (modalita === "saldo" && stepS === "successo")) {
    return <Successo tipo={modalita === "saldo" ? "saldo" : "acconto"} />;
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", locale: "it_IT" }}>
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <a href="/" className="text-2xl font-bold text-indigo-600 tracking-tighter">Promo<span className="text-emerald-500">App</span>.it</a>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">Pagamenti</h1>
            <p className="text-gray-500 text-sm mt-1">Versa un acconto o paga il saldo del tuo progetto</p>
          </div>

          {/* SCELTA MODALITÀ */}
          {modalita === "scelta" && (
            <div className="grid sm:grid-cols-2 gap-5">
              <button onClick={() => setModalita("acconto")}
                className="bg-white rounded-3xl shadow-sm p-8 text-left hover:shadow-md hover:ring-2 hover:ring-indigo-400 transition group">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-200 transition">
                  <i className="fas fa-hand-holding-usd text-2xl text-indigo-600"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Versa un Acconto</h2>
                <p className="text-gray-500 text-sm leading-relaxed">Hai già concordato un progetto con noi? Versa un acconto per iniziare.</p>
                <div className="mt-5 inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  Inizia <i className="fas fa-arrow-right"></i>
                </div>
              </button>
              <button onClick={() => setModalita("saldo")}
                className="bg-white rounded-3xl shadow-sm p-8 text-left hover:shadow-md hover:ring-2 hover:ring-emerald-400 transition group">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-200 transition">
                  <i className="fas fa-check-circle text-2xl text-emerald-600"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Paga il Saldo</h2>
                <p className="text-gray-500 text-sm leading-relaxed">Hai già versato un acconto e vuoi saldare il resto? Troviamo il tuo progetto.</p>
                <div className="mt-5 inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  Cerca progetto <i className="fas fa-arrow-right"></i>
                </div>
              </button>
            </div>
          )}

          {/* FLUSSO ACCONTO */}
          {modalita === "acconto" && (
            <div className="bg-white rounded-3xl shadow-sm p-8">
              {/* Stepper */}
              <div className="flex items-center justify-center gap-2 mb-7">
                {(["progetto", "dati", "pagamento"] as const).map((s, i) => {
                  const labels = ["Progetto", "Dati", "Pagamento"];
                  const idx = ["progetto", "dati", "pagamento"].indexOf(stepA);
                  const active = s === stepA; const done = i < idx;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      {i > 0 && <div className={`h-px w-8 ${done || active ? "bg-indigo-400" : "bg-gray-200"}`}></div>}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${active ? "bg-indigo-600 text-white" : done ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                        {done ? <i className="fas fa-check text-xs"></i> : <span>{i + 1}</span>} {labels[i]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 1 - Progetto */}
              {stepA === "progetto" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Il tuo progetto</h2>
                    <p className="text-gray-500 text-sm">Descrivici per cosa stai versando l'acconto</p>
                  </div>
                  <div>
                    <label className={lbl}>Descrizione del progetto *</label>
                    <textarea value={form.progetto} onChange={e => setF("progetto", e.target.value)} rows={3}
                      placeholder="es. App gestionale per la mia pizzeria — 3 tavoli, ordini, cassa"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Importo totale concordato (€)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">€</span>
                        <input type="number" min="1" step="0.01" value={form.importoTotaleEuro} onChange={e => setF("importoTotaleEuro", e.target.value)}
                          placeholder="es. 890" className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Facoltativo — aiuta a tracciare il saldo</p>
                    </div>
                    <div>
                      <label className={lbl}>Acconto da versare ora (€) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-bold">€</span>
                        <input type="number" min="1" step="0.01" value={form.importoEuro} onChange={e => setF("importoEuro", e.target.value)}
                          placeholder="es. 300" className="w-full border border-indigo-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Minimo 1€ · importo libero</p>
                    </div>
                  </div>
                  {form.importoTotaleEuro && form.importoEuro && parseFloat(form.importoTotaleEuro) > 0 && parseFloat(form.importoEuro) > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                      <i className="fas fa-info-circle mr-2"></i>
                      Saldo rimanente dopo questo acconto: <strong>{Math.max(0, parseFloat(form.importoTotaleEuro) - parseFloat(form.importoEuro)).toFixed(2).replace(".", ",")}€</strong>
                    </div>
                  )}
                  {errA && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errA}</p>}
                  <button onClick={() => { if (validaProgetto()) { setErrA(""); setStepA("dati"); } }}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    Continua <i className="fas fa-arrow-right"></i>
                  </button>
                  <button onClick={() => setModalita("scelta")} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">← Torna alla scelta</button>
                </div>
              )}

              {/* Step 2 - Dati */}
              {stepA === "dati" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setStepA("progetto")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Dati personali e fiscali</h2><p className="text-gray-500 text-sm">Necessari per la ricevuta ufficiale</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["privato", "azienda"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setF("tipo", t)}
                        className="py-3 rounded-xl border-2 font-semibold text-sm transition"
                        style={{ borderColor: form.tipo === t ? "#6366f1" : "#e5e7eb", background: form.tipo === t ? "#eef2ff" : "white", color: form.tipo === t ? "#4338ca" : "#6b7280" }}>
                        {t === "privato" ? "👤 Privato" : "🏢 Azienda"}
                      </button>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={lbl}>Nome *</label><input value={form.nome} onChange={e => setF("nome", e.target.value)} className={inp} placeholder="Mario" /></div>
                    <div><label className={lbl}>Cognome *</label><input value={form.cognome} onChange={e => setF("cognome", e.target.value)} className={inp} placeholder="Rossi" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={lbl}>Email *</label><input type="email" value={form.email} onChange={e => setF("email", e.target.value)} className={inp} placeholder="mario@esempio.it" /></div>
                    <div><label className={lbl}>Telefono *</label><input type="tel" value={form.telefono} onChange={e => setF("telefono", e.target.value)} className={inp} placeholder="+39 333 1234567" /></div>
                  </div>
                  <div><label className={lbl}>Indirizzo *</label><input value={form.indirizzo} onChange={e => setF("indirizzo", e.target.value)} className={inp} placeholder="Via Roma, 1" /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className={lbl}>CAP *</label><input value={form.cap} onChange={e => setF("cap", e.target.value)} className={inp} placeholder="00100" maxLength={5} /></div>
                    <div className="col-span-2"><label className={lbl}>Città *</label><input value={form.citta} onChange={e => setF("citta", e.target.value)} className={inp} placeholder="Roma" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={lbl}>Provincia</label><input value={form.provincia} onChange={e => setF("provincia", e.target.value)} className={inp} placeholder="RM" maxLength={2} /></div>
                    <div><label className={lbl}>Codice Fiscale</label><input value={form.codiceFiscale} onChange={e => setF("codiceFiscale", e.target.value)} className={inp} placeholder="RSSMRA80A01H501Z" maxLength={16} /></div>
                  </div>
                  {form.tipo === "azienda" && (
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <p className="text-sm font-semibold text-gray-700">Dati azienda</p>
                      <div><label className={lbl}>Ragione Sociale *</label><input value={form.ragioneSociale} onChange={e => setF("ragioneSociale", e.target.value)} className={inp} /></div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><label className={lbl}>P.IVA *</label><input value={form.piva} onChange={e => setF("piva", e.target.value)} className={inp} maxLength={11} /></div>
                        <div><label className={lbl}>SDI</label><input value={form.sdi} onChange={e => setF("sdi", e.target.value)} className={inp} maxLength={7} /></div>
                      </div>
                      <div><label className={lbl}>PEC</label><input type="email" value={form.pec} onChange={e => setF("pec", e.target.value)} className={inp} /></div>
                    </div>
                  )}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-indigo-500 font-semibold uppercase tracking-widest">Acconto per</div>
                      <div className="font-bold text-gray-800 mt-0.5 text-sm truncate max-w-[180px]">{form.progetto}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-indigo-700">€ {parseFloat(form.importoEuro || "0").toFixed(2)}</div>
                      {form.importoTotaleEuro && <div className="text-xs text-gray-400">su {parseFloat(form.importoTotaleEuro).toFixed(2)}€ totali</div>}
                    </div>
                  </div>

                  <MetodoBox metodo={metodoA} onSelect={m => { setMetodoA(m); setErrA(""); }} />

                  {errA && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errA}</p>}
                  <button onClick={() => { if (validaDati()) { setErrA(""); procediMetodoAcconto(); } }} disabled={loadingA || !metodoA}
                    className="w-full py-4 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                    style={{ background: loadingA || !metodoA ? "#9ca3af" : "#6366f1", cursor: loadingA || !metodoA ? "not-allowed" : "pointer" }}>
                    {loadingA ? <><i className="fas fa-spinner fa-spin"></i> Preparazione...</> : <><i className="fas fa-lock"></i> Procedi al pagamento</>}
                  </button>
                </div>
              )}

              {/* Step 3 - Pagamento */}
              {stepA === "pagamento" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStepA("dati")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Pagamento</h2></div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-indigo-500 font-semibold uppercase tracking-widest">Acconto per</div>
                      <div className="font-bold text-gray-800 text-sm truncate max-w-[180px]">{form.progetto}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-indigo-700">€ {parseFloat(form.importoEuro || "0").toFixed(2)}</div>
                      {form.importoTotaleEuro && <div className="text-xs text-gray-400">su {parseFloat(form.importoTotaleEuro).toFixed(2)}€ totali</div>}
                    </div>
                  </div>

                  {metodoA === "stripe" && csAcconto && stripePromise && (
                    <Elements stripe={stripePromise} options={{ clientSecret: csAcconto, locale: "it" }}>
                      <StripeForm importo={Math.round(parseFloat(form.importoEuro) * 100)} onSuccess={() => setStepA("successo")} />
                    </Elements>
                  )}

                  {metodoA === "paypal" && accontoIdPaypal && (
                    <PayPalBox
                      importoEuro={parseFloat(form.importoEuro).toFixed(2)}
                      accontoId={accontoIdPaypal}
                      confirmEndpoint="/api/acconto/paypal/confirm"
                      onSuccess={() => setStepA("successo")}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* FLUSSO SALDO */}
          {modalita === "saldo" && (
            <div className="bg-white rounded-3xl shadow-sm p-8">
              {stepS === "cerca" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setModalita("scelta")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Paga il Saldo</h2><p className="text-gray-500 text-sm">Inserisci la tua email per trovare il progetto</p></div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-sm text-emerald-700">
                    <i className="fas fa-info-circle mr-2"></i>Usa la stessa email con cui hai versato l'acconto
                  </div>
                  <div>
                    <label className={lbl}>La tua email *</label>
                    <input type="email" value={emailSaldo} onChange={e => setEmailSaldo(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && cercaProgetti()}
                      className={inp} placeholder="mario@esempio.it" />
                  </div>
                  {errS && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errS}</p>}
                  <button onClick={cercaProgetti} disabled={loadingS}
                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                    style={{ background: loadingS ? "#9ca3af" : "#059669" }}>
                    {loadingS ? <><i className="fas fa-spinner fa-spin"></i> Ricerca...</> : <><i className="fas fa-search"></i> Cerca il mio progetto</>}
                  </button>
                </div>
              )}

              {stepS === "dettaglio" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStepS("cerca")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Seleziona il progetto</h2><p className="text-gray-500 text-sm">Trovati {progetti.length} progetto/i con saldo aperto</p></div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {progetti.map(p => (
                      <button key={p.id} onClick={() => { setProgettoScelto(p); setImportoSaldoEuro((p.saldoRimanente / 100).toFixed(2)); }}
                        className={`w-full text-left rounded-2xl border-2 p-4 transition ${progettoScelto?.id === p.id ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="font-bold text-gray-800 mb-2">{p.progetto}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-100 rounded-lg p-2 text-center">
                            <div className="text-gray-400 mb-0.5">Totale</div>
                            <div className="font-bold text-gray-700">{(p.importoTotale / 100).toFixed(2)}€</div>
                          </div>
                          <div className="bg-indigo-50 rounded-lg p-2 text-center">
                            <div className="text-indigo-400 mb-0.5">Versato</div>
                            <div className="font-bold text-indigo-700">{(p.totaleVersato / 100).toFixed(2)}€</div>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2 text-center">
                            <div className="text-amber-500 mb-0.5">Saldo</div>
                            <div className="font-bold text-amber-600">{(p.saldoRimanente / 100).toFixed(2)}€</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {progettoScelto && (
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <div>
                        <label className={lbl}>Importo da versare ora (€) *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">€</span>
                          <input type="number" min="1" step="0.01" max={(progettoScelto.saldoRimanente / 100).toFixed(2)}
                            value={importoSaldoEuro} onChange={e => setImportoSaldoEuro(e.target.value)}
                            className="w-full border border-emerald-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Saldo massimo: <strong>{(progettoScelto.saldoRimanente / 100).toFixed(2).replace(".", ",")}€</strong>
                          {importoSaldoEuro && parseFloat(importoSaldoEuro) === progettoScelto.saldoRimanente / 100 && (
                            <span className="ml-2 text-emerald-600 font-semibold">✓ Saldo completo</span>
                          )}
                        </p>
                      </div>

                      <MetodoBox metodo={metodoS} onSelect={m => { setMetodoS(m); setErrS(""); }} />

                      {errS && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errS}</p>}
                      <button onClick={procediMetodoSaldo} disabled={loadingS || !metodoS}
                        className="w-full py-4 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                        style={{ background: loadingS || !metodoS ? "#9ca3af" : "#059669", cursor: loadingS || !metodoS ? "not-allowed" : "pointer" }}>
                        {loadingS ? <><i className="fas fa-spinner fa-spin"></i> Preparazione...</> : <><i className="fas fa-lock"></i> Procedi al pagamento</>}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {stepS === "pagamento" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStepS("dettaglio")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Pagamento Saldo</h2></div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-500 font-semibold uppercase tracking-widest">Saldo per</div>
                      <div className="font-bold text-gray-800 text-sm truncate max-w-[180px]">{progettoScelto?.progetto}</div>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-700">€ {parseFloat(importoSaldoEuro || "0").toFixed(2)}</div>
                  </div>

                  {metodoS === "stripe" && csSaldo && stripePromise && (
                    <Elements stripe={stripePromise} options={{ clientSecret: csSaldo, locale: "it" }}>
                      <StripeForm importo={importoSaldoCent} onSuccess={() => setStepS("successo")} />
                    </Elements>
                  )}

                  {metodoS === "paypal" && saldoIdPaypal && (
                    <PayPalBox
                      importoEuro={parseFloat(importoSaldoEuro).toFixed(2)}
                      accontoId={saldoIdPaypal}
                      confirmEndpoint="/api/acconto/paypal/saldo/confirm"
                      onSuccess={() => setStepS("successo")}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Dati protetti · <a href="/privacy.html" className="underline hover:text-gray-600">Privacy Policy</a> · Sophia 2005 S.r.l. · P.IVA 08223951008
          </p>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
