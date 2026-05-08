import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API_BASE = "";
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

type Modalita = "scelta" | "acconto" | "saldo";
type StepAcconto = "progetto" | "dati" | "metodo" | "pagamento" | "successo";
type StepSaldo = "cerca" | "dettaglio" | "metodo" | "pagamento" | "successo";
type TipoCliente = "privato" | "azienda";

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
        onError={() => setErrore("Errore PayPal. Riprova più tardi.")}
        onCancel={() => setErrore("Pagamento annullato.")}
      />
      {errore && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 text-center">{errore}</p>}
      <p className="text-xs text-center text-gray-400">🔒 Pagamento sicuro via PayPal · Riceverai subito la ricevuta via email</p>
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

function MetodoPagamento({ importoEuro, etichetta, onPaypal, onStripe, loading, errore }: {
  importoEuro: string;
  etichetta: string;
  onPaypal: () => void;
  onStripe: () => void;
  loading: { paypal: boolean; stripe: boolean };
  errore: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Scegli il metodo di pagamento</h2>
        <p className="text-gray-500 text-sm">Puoi pagare con PayPal o carta di credito</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-indigo-500 font-semibold uppercase tracking-widest">{etichetta}</div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-0.5">€ {parseFloat(importoEuro || "0").toFixed(2)}</div>
        </div>
        <i className="fas fa-shield-alt text-indigo-300 text-3xl"></i>
      </div>

      <div className="space-y-3">
        <button
          onClick={onPaypal}
          disabled={loading.paypal || loading.stripe}
          className="w-full py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-3 border-2"
          style={{
            background: loading.paypal ? "#f3f4f6" : "#ffc439",
            borderColor: loading.paypal ? "#e5e7eb" : "#f0a500",
            color: "#003087",
            cursor: (loading.paypal || loading.stripe) ? "not-allowed" : "pointer",
          }}
        >
          {loading.paypal ? (
            <><i className="fas fa-spinner fa-spin"></i> Preparazione PayPal...</>
          ) : (
            <><i className="fab fa-paypal text-xl"></i> Paga con PayPal</>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 font-medium">oppure</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <button
          onClick={onStripe}
          disabled={loading.paypal || loading.stripe}
          className="w-full py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-3"
          style={{
            background: (loading.paypal || loading.stripe) ? "#9ca3af" : "#6366f1",
            color: "white",
            cursor: (loading.paypal || loading.stripe) ? "not-allowed" : "pointer",
          }}
        >
          {loading.stripe ? (
            <><i className="fas fa-spinner fa-spin"></i> Apertura pagina sicura...</>
          ) : (
            <><i className="fas fa-credit-card text-xl"></i> Paga con Carta di Credito</>
          )}
        </button>
      </div>

      {errore && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errore}</p>}

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1.5"><i className="fas fa-lock text-green-500"></i> Pagamento crittografato</div>
        <div className="flex items-center gap-1.5"><i className="fas fa-receipt text-indigo-400"></i> Ricevuta via email</div>
        <div className="flex items-center gap-1.5"><i className="fab fa-paypal text-blue-500"></i> PayPal protegge l'acquisto</div>
        <div className="flex items-center gap-1.5"><i className="fas fa-shield-alt text-purple-400"></i> Stripe sicuro al 100%</div>
      </div>
    </div>
  );
}

export default function Pagamenti() {
  const [modalita, setModalita] = useState<Modalita>("scelta");

  const [stepA, setStepA] = useState<StepAcconto>("progetto");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errA, setErrA] = useState("");
  const [loadingPaypalA, setLoadingPaypalA] = useState(false);
  const [loadingStripeA, setLoadingStripeA] = useState(false);
  const [accontoIdPaypal, setAccontoIdPaypal] = useState("");

  const [stepS, setStepS] = useState<StepSaldo>("cerca");
  const [emailSaldo, setEmailSaldo] = useState("");
  const [progetti, setProgetti] = useState<ProgettoTrovato[]>([]);
  const [progettoScelto, setProgettoScelto] = useState<ProgettoTrovato | null>(null);
  const [importoSaldoEuro, setImportoSaldoEuro] = useState("");
  const [errS, setErrS] = useState("");
  const [loadingPaypalS, setLoadingPaypalS] = useState(false);
  const [loadingStripeS, setLoadingStripeS] = useState(false);
  const [saldoIdPaypal, setSaldoIdPaypal] = useState("");

  function setF(field: keyof FormData, val: string) { setForm(f => ({ ...f, [field]: val })); }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSuccess = params.get("stripe_success");
    const stripeCancel = params.get("stripe_cancel");
    const tipoParam = params.get("tipo");
    const progetto = params.get("progetto");
    const totale = params.get("totale");
    const acconto = params.get("acconto");

    if (stripeSuccess === "1") {
      if (tipoParam === "saldo") {
        setModalita("saldo");
        setStepS("successo");
      } else {
        setModalita("acconto");
        setStepA("successo");
      }
      return;
    }

    if (stripeCancel === "1") {
      if (tipoParam === "saldo") {
        setModalita("saldo");
        setStepS("metodo");
        setErrS("Pagamento annullato. Puoi riprovare.");
      } else {
        setModalita("acconto");
        setStepA("metodo");
        setErrA("Pagamento annullato. Puoi riprovare con PayPal o carta.");
      }
      return;
    }

    if (progetto) {
      setForm(f => ({
        ...f, progetto,
        importoTotaleEuro: totale ?? "",
        importoEuro: acconto ?? "",
      }));
      setModalita("acconto");
    }
  }, []);

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

  function procediAMetodo() {
    if (validaDati()) { setErrA(""); setStepA("metodo"); }
  }

  async function procediAccontoPaypal() {
    setErrA(""); setLoadingPaypalA(true);
    try {
      const res = await fetch(`${API_BASE}/api/acconto/paypal/create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrA(data.error); setLoadingPaypalA(false); return; }
      setAccontoIdPaypal(data.accontoId);
      setStepA("pagamento");
    } catch { setErrA("Errore di connessione. Riprova."); }
    setLoadingPaypalA(false);
  }

  async function procediAccontoStripe() {
    setErrA(""); setLoadingStripeA(true);
    try {
      const res = await fetch(`${API_BASE}/api/acconto/stripe/create-session`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrA(data.error); setLoadingStripeA(false); return; }
      window.location.href = data.url;
    } catch {
      setErrA("Errore di connessione. Riprova.");
      setLoadingStripeA(false);
    }
  }

  async function cercaProgetti() {
    if (!emailSaldo.trim()) { setErrS("Inserisci la tua email"); return; }
    setLoadingPaypalS(true); setErrS("");
    try {
      const res = await fetch(`${API_BASE}/api/acconto/cerca-progetto?email=${encodeURIComponent(emailSaldo)}`);
      const data = await res.json();
      if (!res.ok) { setErrS(data.error); setLoadingPaypalS(false); return; }
      if (data.length === 0) { setErrS("Nessun progetto con saldo aperto trovato per questa email"); setLoadingPaypalS(false); return; }
      setProgetti(data); setStepS("dettaglio");
    } catch { setErrS("Errore di connessione. Riprova."); }
    setLoadingPaypalS(false);
  }

  function procediSaldoAMetodo() {
    const centesimi = Math.round(parseFloat(importoSaldoEuro) * 100);
    if (!progettoScelto) return;
    if (!importoSaldoEuro || isNaN(centesimi) || centesimi < 100) { setErrS("Inserisci un importo valido (min. 1€)"); return; }
    setErrS(""); setStepS("metodo");
  }

  async function procediSaldoPaypal() {
    if (!progettoScelto) return;
    setErrS(""); setLoadingPaypalS(true);
    try {
      const res = await fetch(`${API_BASE}/api/acconto/saldo/paypal/create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progettoRef: progettoScelto.id, importoEuro: importoSaldoEuro }),
      });
      const data = await res.json();
      if (!res.ok) { setErrS(data.error); setLoadingPaypalS(false); return; }
      setSaldoIdPaypal(data.accontoId);
      setStepS("pagamento");
    } catch { setErrS("Errore di connessione. Riprova."); }
    setLoadingPaypalS(false);
  }

  async function procediSaldoStripe() {
    if (!progettoScelto) return;
    setErrS(""); setLoadingStripeS(true);
    try {
      const res = await fetch(`${API_BASE}/api/acconto/saldo/stripe/create-session`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progettoRef: progettoScelto.id, importoEuro: importoSaldoEuro }),
      });
      const data = await res.json();
      if (!res.ok) { setErrS(data.error); setLoadingStripeS(false); return; }
      window.location.href = data.url;
    } catch {
      setErrS("Errore di connessione. Riprova.");
      setLoadingStripeS(false);
    }
  }

  if (modalita === "acconto" && stepA === "successo") return <Successo tipo="acconto" />;
  if (modalita === "saldo" && stepS === "successo") return <Successo tipo="saldo" />;

  // Stepper acconto: mostra "metodo" e "pagamento" entrambi come step 3
  const stepperIdxA = ["progetto", "dati", "metodo"].indexOf(
    stepA === "pagamento" ? "metodo" : stepA
  );

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", locale: "it_IT" }}>
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <a href="/" className="text-2xl font-bold text-indigo-600 tracking-tighter">Promo<span className="text-emerald-500">App</span>.it</a>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">Pagamenti</h1>
            <p className="text-gray-500 text-sm mt-1">Versa un acconto o paga il saldo del tuo progetto</p>
          </div>

          {/* SCELTA */}
          {modalita === "scelta" && (
            <div className="grid sm:grid-cols-2 gap-5">
              <button onClick={() => setModalita("acconto")}
                className="bg-white rounded-3xl shadow-sm p-8 text-left hover:shadow-md hover:ring-2 hover:ring-indigo-400 transition group">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-200 transition">
                  <i className="fas fa-hand-holding-usd text-2xl text-indigo-600"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Versa un Acconto</h2>
                <p className="text-gray-500 text-sm leading-relaxed">Hai già concordato un progetto con noi? Versa un acconto per iniziare.</p>
                <div className="mt-5 inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm">Inizia <i className="fas fa-arrow-right"></i></div>
              </button>
              <button onClick={() => setModalita("saldo")}
                className="bg-white rounded-3xl shadow-sm p-8 text-left hover:shadow-md hover:ring-2 hover:ring-emerald-400 transition group">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-200 transition">
                  <i className="fas fa-check-circle text-2xl text-emerald-600"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Paga il Saldo</h2>
                <p className="text-gray-500 text-sm leading-relaxed">Hai già versato un acconto e vuoi saldare il resto? Troviamo il tuo progetto.</p>
                <div className="mt-5 inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm">Cerca progetto <i className="fas fa-arrow-right"></i></div>
              </button>
            </div>
          )}

          {/* ACCONTO */}
          {modalita === "acconto" && (
            <div className="bg-white rounded-3xl shadow-sm p-8">
              {/* Stepper */}
              <div className="flex items-center justify-center gap-2 mb-7">
                {(["progetto", "dati", "metodo"] as const).map((s, i) => {
                  const labels = ["Progetto", "Dati", "Pagamento"];
                  const active = i === stepperIdxA;
                  const done = i < stepperIdxA;
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

              {/* Step Progetto */}
              {stepA === "progetto" && (
                <div className="space-y-5">
                  <div><h2 className="text-xl font-bold text-gray-800 mb-1">Il tuo progetto</h2><p className="text-gray-500 text-sm">Descrivici per cosa stai versando l'acconto</p></div>
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

              {/* Step Dati */}
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
                  {errA && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errA}</p>}
                  <button onClick={procediAMetodo}
                    className="w-full py-4 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                    style={{ background: "#6366f1" }}>
                    Scegli metodo di pagamento <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              )}

              {/* Step Metodo */}
              {stepA === "metodo" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setStepA("dati")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div></div>
                  </div>
                  <MetodoPagamento
                    importoEuro={form.importoEuro}
                    etichetta="Acconto per"
                    onPaypal={procediAccontoPaypal}
                    onStripe={procediAccontoStripe}
                    loading={{ paypal: loadingPaypalA, stripe: loadingStripeA }}
                    errore={errA}
                  />
                </div>
              )}

              {/* Step Pagamento PayPal */}
              {stepA === "pagamento" && accontoIdPaypal && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStepA("metodo")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Pagamento PayPal</h2></div>
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
                  <PayPalBox
                    importoEuro={parseFloat(form.importoEuro).toFixed(2)}
                    accontoId={accontoIdPaypal}
                    confirmEndpoint="/api/acconto/paypal/confirm"
                    onSuccess={() => setStepA("successo")}
                  />
                </div>
              )}
            </div>
          )}

          {/* SALDO */}
          {modalita === "saldo" && (
            <div className="bg-white rounded-3xl shadow-sm p-8">

              {stepS === "cerca" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setModalita("scelta")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Paga il Saldo</h2><p className="text-gray-500 text-sm">Inserisci la tua email per trovare il progetto</p></div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-sm text-emerald-700">
                    <i className="fas fa-info-circle mr-2"></i>
                    Cerchiamo tutti i tuoi progetti con saldo aperto in base all'email usata per l'acconto.
                  </div>
                  <div>
                    <label className={lbl}>La tua email *</label>
                    <input type="email" value={emailSaldo} onChange={e => setEmailSaldo(e.target.value)}
                      className={inp} placeholder="mario@esempio.it"
                      onKeyDown={e => e.key === "Enter" && cercaProgetti()} />
                  </div>
                  {errS && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errS}</p>}
                  <button onClick={cercaProgetti} disabled={loadingPaypalS}
                    className="w-full py-4 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                    style={{ background: loadingPaypalS ? "#9ca3af" : "#059669", cursor: loadingPaypalS ? "not-allowed" : "pointer" }}>
                    {loadingPaypalS ? <><i className="fas fa-spinner fa-spin"></i> Cercando...</> : <><i className="fas fa-search"></i> Cerca progetti</>}
                  </button>
                </div>
              )}

              {stepS === "dettaglio" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setStepS("cerca"); setProgetti([]); setProgettoScelto(null); }} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Scegli il progetto</h2></div>
                  </div>

                  {progetti.map(p => (
                    <button key={p.id} onClick={() => setProgettoScelto(pc => pc?.id === p.id ? null : p)}
                      className="w-full text-left rounded-2xl border-2 p-5 transition"
                      style={{ borderColor: progettoScelto?.id === p.id ? "#059669" : "#e5e7eb", background: progettoScelto?.id === p.id ? "#f0fdf4" : "white" }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-gray-800">{p.progetto}</div>
                          <div className="text-sm text-gray-500 mt-1">{p.nome} {p.cognome}</div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-xs text-gray-400">Saldo rimanente</div>
                          <div className="text-xl font-extrabold text-emerald-600">€ {(p.saldoRimanente / 100).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
                        <div><span className="font-medium">Totale:</span> €{(p.importoTotale / 100).toFixed(2)}</div>
                        <div><span className="font-medium">Versato:</span> €{(p.totaleVersato / 100).toFixed(2)}</div>
                        <div><span className="font-medium">Da pagare:</span> €{(p.saldoRimanente / 100).toFixed(2)}</div>
                      </div>
                    </button>
                  ))}

                  {progettoScelto && (
                    <div className="space-y-3">
                      <div>
                        <label className={lbl}>Importo da versare ora (€) *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">€</span>
                          <input type="number" min="1" step="0.01"
                            max={(progettoScelto.saldoRimanente / 100).toFixed(2)}
                            value={importoSaldoEuro} onChange={e => setImportoSaldoEuro(e.target.value)}
                            placeholder={(progettoScelto.saldoRimanente / 100).toFixed(2)}
                            className="w-full border border-emerald-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Massimo: €{(progettoScelto.saldoRimanente / 100).toFixed(2)}</p>
                      </div>
                      <button onClick={() => setImportoSaldoEuro((progettoScelto.saldoRimanente / 100).toFixed(2))}
                        className="w-full py-2 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition">
                        Paga tutto il saldo (€{(progettoScelto.saldoRimanente / 100).toFixed(2)})
                      </button>
                    </div>
                  )}

                  {errS && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errS}</p>}

                  {progettoScelto && (
                    <button onClick={procediSaldoAMetodo}
                      className="w-full py-4 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                      style={{ background: "#059669" }}>
                      Scegli metodo di pagamento <i className="fas fa-arrow-right"></i>
                    </button>
                  )}
                </div>
              )}

              {stepS === "metodo" && progettoScelto && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setStepS("dettaglio")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div></div>
                  </div>
                  <MetodoPagamento
                    importoEuro={importoSaldoEuro}
                    etichetta="Saldo per"
                    onPaypal={procediSaldoPaypal}
                    onStripe={procediSaldoStripe}
                    loading={{ paypal: loadingPaypalS, stripe: loadingStripeS }}
                    errore={errS}
                  />
                </div>
              )}

              {stepS === "pagamento" && saldoIdPaypal && progettoScelto && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStepS("metodo")} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-bold text-gray-800">Pagamento Saldo — PayPal</h2></div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-600 font-semibold uppercase tracking-widest">Saldo per</div>
                      <div className="font-bold text-gray-800 text-sm truncate max-w-[180px]">{progettoScelto.progetto}</div>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-600">€ {parseFloat(importoSaldoEuro).toFixed(2)}</div>
                  </div>
                  <PayPalBox
                    importoEuro={parseFloat(importoSaldoEuro).toFixed(2)}
                    accontoId={saldoIdPaypal}
                    confirmEndpoint="/api/acconto/paypal/saldo/confirm"
                    onSuccess={() => setStepS("successo")}
                  />
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
