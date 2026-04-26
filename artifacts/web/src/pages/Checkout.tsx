import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API_BASE = "";

const PIANI = [
  {
    id: "base",
    nome: "Piano Base",
    prezzo: 690,
    mensile: 19,
    colore: "#6366f1",
    features: ["App personalizzata", "10 pazienti + 10 appuntamenti demo gratuiti", "Notifiche Push", "Chiave di sblocco definitiva"],
  },
  {
    id: "pro",
    nome: "Piano Business Pro",
    prezzo: 899,
    mensile: 25,
    colore: "#f59e0b",
    consigliato: true,
    features: ["Tutto del Base", "Notifiche Push Illimitate", "Priorità supporto", "Aggiornamenti inclusi", "Chiave di sblocco definitiva"],
  },
];

function StripeForm({ clientSecret, importo, onSuccess }: { clientSecret: string; importo: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/checkout?success=1" },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Errore durante il pagamento");
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3 rounded-xl font-bold text-white transition"
        style={{ background: loading ? "#9ca3af" : "#6366f1", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Elaborazione..." : `Paga ${(importo / 100).toFixed(2).replace(".", ",")}€`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const [piano, setPiano] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("piano");
    return p === "pro" ? "pro" : "base";
  });
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [codiceSconto, setCodiceSconto] = useState("");
  const [scontoInfo, setScontoInfo] = useState<{ discountPercent: number; description: string } | null>(null);
  const [scontoError, setScontoError] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"stripe" | "bonifico">("stripe");
  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [importoPagare, setImportoPagare] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "pagamento" | "successo">("form");
  const [bonificoInfo, setBonificoInfo] = useState<any>(null);

  const pianoScelto = PIANI.find((p) => p.id === piano)!;
  const prezzoScontato = scontoInfo
    ? Math.round(pianoScelto.prezzo * (1 - scontoInfo.discountPercent / 100))
    : pianoScelto.prezzo;

  useEffect(() => {
    fetch(`${API_BASE}/api/checkout/publishable-key`)
      .then((r) => r.json())
      .then((d) => setStripePromise(loadStripe(d.publishableKey)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") setStep("successo");
  }, []);

  async function validaSconto() {
    if (!codiceSconto.trim()) return;
    setScontoError("");
    setScontoInfo(null);
    const res = await fetch(`${API_BASE}/api/checkout/validate-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codiceSconto }),
    });
    const data = await res.json();
    if (!res.ok) {
      setScontoError(data.error);
    } else {
      setScontoInfo(data);
    }
  }

  async function procediPagamento() {
    if (!nome.trim() || !email.trim()) {
      setError("Inserisci nome e email");
      return;
    }
    setLoading(true);
    setError("");

    if (metodoPagamento === "stripe") {
      const res = await fetch(`${API_BASE}/api/checkout/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piano, discountCode: codiceSconto || undefined, customerEmail: email, customerName: nome }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setClientSecret(data.clientSecret);
      setImportoPagare(data.importo);
      setStep("pagamento");
    } else {
      const res = await fetch(`${API_BASE}/api/checkout/bonifico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piano, discountCode: codiceSconto || undefined, customerEmail: email, customerName: nome }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setBonificoInfo(data);
      setStep("pagamento");
    }
    setLoading(false);
  }

  if (step === "successo") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pagamento confermato!</h1>
          <p className="text-gray-500 mb-6">Riceverai la tua chiave di sblocco via email entro 24 ore. Benvenuto in PromoApp!</p>
          <a href="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Torna alla Home
          </a>
        </div>
      </div>
    );
  }

  if (step === "pagamento") {
    if (metodoPagamento === "bonifico" && bonificoInfo) {
      return (
        <div className="min-h-screen bg-gray-50 py-16 px-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🏦</div>
                <h1 className="text-2xl font-bold text-gray-800">Istruzioni per il Bonifico</h1>
                <p className="text-gray-500 mt-1 text-sm">Effettua il pagamento con i dati qui sotto</p>
              </div>
              <div className="bg-indigo-50 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Intestatario:</span><strong>{bonificoInfo.intestatario}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">IBAN:</span><strong className="font-mono">{bonificoInfo.iban}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Importo:</span><strong className="text-indigo-700 text-base">{(bonificoInfo.importo / 100).toFixed(2).replace(".", ",")}€</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Causale:</span><strong>{bonificoInfo.causale}</strong></div>
              </div>
              {bonificoInfo.discountApplied > 0 && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-center text-green-700 text-sm font-medium">
                  ✅ Sconto del {bonificoInfo.discountApplied}% applicato
                </div>
              )}
              <p className="text-xs text-gray-400 text-center mt-4">
                Dopo il bonifico riceverai la chiave di sblocco via email a <strong>{email}</strong> entro 24 ore lavorative.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep("form")} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition">
                  ← Indietro
                </button>
                <a href="/" className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold text-center hover:bg-indigo-700 transition">
                  Ho capito
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <button onClick={() => setStep("form")} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
              ← Indietro
            </button>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Completa il pagamento</h1>
            <p className="text-gray-500 text-sm mb-6">
              {pianoScelto.nome} — <strong className="text-indigo-600">{(importoPagare / 100).toFixed(2).replace(".", ",")}€</strong>
              {scontoInfo && <span className="ml-2 text-green-600 text-xs">({scontoInfo.discountPercent}% sconto)</span>}
            </p>
            {stripePromise && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, locale: "it" }}>
                <StripeForm clientSecret={clientSecret} importo={importoPagare} onSuccess={() => setStep("successo")} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <a href="/" className="text-indigo-600 text-sm hover:underline">← Torna alla home</a>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Scegli il tuo piano</h1>
          <p className="text-gray-500 mt-1">Acquista la licenza definitiva della tua app</p>
        </div>

        {/* Selezione piano */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PIANI.map((p) => (
            <div
              key={p.id}
              onClick={() => setPiano(p.id)}
              className="cursor-pointer rounded-2xl border-2 p-6 transition relative"
              style={{
                borderColor: piano === p.id ? p.colore : "#e5e7eb",
                background: piano === p.id ? p.colore + "10" : "white",
                boxShadow: piano === p.id ? `0 0 0 2px ${p.colore}30` : undefined,
              }}
            >
              {p.consigliato && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">Il più scelto</span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: p.colore, background: piano === p.id ? p.colore : "transparent" }}
                >
                  {piano === p.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <h3 className="font-bold text-gray-800">{p.nome}</h3>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold" style={{ color: p.colore }}>{prezzoScontato !== p.prezzo && piano === p.id ? prezzoScontato : p.prezzo}€</span>
                <span className="text-gray-400 text-sm"> una tantum + {p.mensile}€/mese</span>
                {scontoInfo && piano === p.id && (
                  <div className="text-green-600 text-xs mt-1">
                    <s className="text-gray-400">{p.prezzo}€</s> → {prezzoScontato}€ ({scontoInfo.discountPercent}% sconto)
                  </div>
                )}
              </div>
              <ul className="space-y-1">
                {p.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span style={{ color: p.colore }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          {/* Dati cliente */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome e Cognome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Mario Rossi"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario@esempio.it"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Codice sconto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice sconto (opzionale)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codiceSconto}
                onChange={(e) => { setCodiceSconto(e.target.value); setScontoInfo(null); setScontoError(""); }}
                placeholder="es. PROMO20"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 uppercase"
              />
              <button
                onClick={validaSconto}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
              >
                Applica
              </button>
            </div>
            {scontoInfo && (
              <p className="text-green-600 text-sm mt-1">✅ {scontoInfo.discountPercent}% di sconto applicato{scontoInfo.description ? ` — ${scontoInfo.description}` : ""}</p>
            )}
            {scontoError && <p className="text-red-500 text-sm mt-1">❌ {scontoError}</p>}
          </div>

          {/* Metodo pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metodo di pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "stripe", label: "💳 Carta di credito", sub: "Pagamento sicuro via Stripe" },
                { id: "bonifico", label: "🏦 Bonifico bancario", sub: "IBAN italiano, attivazione in 24h" },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setMetodoPagamento(m.id as any)}
                  className="cursor-pointer border-2 rounded-xl p-4 transition"
                  style={{
                    borderColor: metodoPagamento === m.id ? "#6366f1" : "#e5e7eb",
                    background: metodoPagamento === m.id ? "#f0f0ff" : "white",
                  }}
                >
                  <div className="font-semibold text-sm text-gray-800">{m.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Riepilogo e CTA */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Totale da pagare</p>
              <p className="text-2xl font-bold text-gray-800">{prezzoScontato}€</p>
              {scontoInfo && <p className="text-xs text-green-600">Risparmi {pianoScelto.prezzo - prezzoScontato}€</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">+ {pianoScelto.mensile}€/mese canone</p>
              <p className="text-xs text-gray-400">✓ Chiave definitiva inclusa</p>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={procediPagamento}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition"
            style={{ background: loading ? "#9ca3af" : "#6366f1", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Elaborazione..." : metodoPagamento === "stripe" ? "Procedi al pagamento →" : "Visualizza dati bonifico →"}
          </button>

          <p className="text-xs text-center text-gray-400">
            🔒 Pagamento sicuro. Dati protetti da Stripe. Nessun addebito automatico sui canoni mensili.
          </p>
        </div>
      </div>
    </div>
  );
}
