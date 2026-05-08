import { useState } from "react";

const API_BASE = "";

const PIANI = [
  {
    id: "base",
    nome: "Piano Base",
    prezzo: 690,
    mensile: 19,
    colore: "#6366f1",
    features: [
      "App personalizzata con logo e colori",
      "Gestionale clienti e appuntamenti",
      "Gestione magazzino base",
      "Shop online per prodotti e servizi",
      "App tua per sempre",
    ],
  },
  {
    id: "pro",
    nome: "Piano Business Pro",
    prezzo: 890,
    mensile: 29,
    colore: "#f59e0b",
    consigliato: true,
    features: [
      "Tutto del piano Base, più:",
      "Integrazione con gestionali esistenti",
      "Pagamenti online (PayPal, bonifico)",
      "Statistiche vendite e clienti",
      "CRM avanzato e assistenza prioritaria",
    ],
  },
  {
    id: "gestionale360",
    nome: "Gestionale360",
    prezzo: 199,
    mensile: 0,
    colore: "#059669",
    features: [
      "Magazzino sotto controllo con avvisi sotto scorta",
      "Cassa e vendite veloci con calcolo IVA",
      "Arrivi, fornitori e bolle di carico",
      "Contabilità chiara e clienti fidelizzati",
      "Licenza a vita · zero canone mensile",
    ],
  },
  {
    id: "agentipro",
    nome: "AgentiPro",
    prezzo: 199,
    mensile: 0,
    colore: "#ea580c",
    features: [
      "Anagrafica clienti completa e georeferenziata",
      "Ordini in mobilità e catalogo prodotti",
      "Calcolo automatico provvigioni",
      "Pianificazione visite e nota spese",
      "Licenza a vita · zero canone mensile",
    ],
  },
  {
    id: "sitoistituzionale",
    nome: "Sito Web Istituzionale",
    prezzo: 399,
    mensile: 0,
    colore: "#0ea5e9",
    features: [
      "5 pagine: Home, Chi Siamo, Servizi, Contatti, Privacy",
      "Design responsive per mobile, tablet e PC",
      "Form di contatto + Google Maps integrata",
      "SEO base e link profili social",
      "30 giorni di assistenza · consegna in 7 gg lavorativi",
    ],
  },
];

function getClienteDati() {
  try {
    const raw = sessionStorage.getItem("cliente_dati");
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {}
  return null;
}

export default function Checkout() {
  const [piano, setPiano] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("piano");
    return PIANI.find(pl => pl.id === p) ? p! : "base";
  });
  const [nome, setNome] = useState(() => {
    const d = getClienteDati();
    return d ? `${d.nome ?? ""} ${d.cognome ?? ""}`.trim() : "";
  });
  const [email, setEmail] = useState(() => getClienteDati()?.email ?? "");
  const [codiceSconto, setCodiceSconto] = useState("");
  const [scontoInfo, setScontoInfo] = useState<{ discountPercent: number; description: string } | null>(null);
  const [scontoError, setScontoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "bonifico">("form");
  const [bonificoInfo, setBonificoInfo] = useState<any>(null);

  const pianoScelto = PIANI.find((p) => p.id === piano)!;
  const prezzoScontato = scontoInfo
    ? Math.round(pianoScelto.prezzo * (1 - scontoInfo.discountPercent / 100))
    : pianoScelto.prezzo;

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
    if (!res.ok) setScontoError(data.error);
    else setScontoInfo(data);
  }

  async function procediBonifico() {
    if (!nome.trim() || !email.trim()) { setError("Inserisci nome e email"); return; }
    setLoading(true); setError("");
    const res = await fetch(`${API_BASE}/api/checkout/bonifico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ piano, discountCode: codiceSconto || undefined, customerEmail: email, customerName: nome }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setBonificoInfo(data);
    setStep("bonifico");
    setLoading(false);
  }

  if (step === "bonifico" && bonificoInfo) {
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
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">📞 Vuoi pagare con PayPal?</p>
              <p>Scrivici su WhatsApp al <strong>+39 379 360 2035</strong> e ti inviamo il link di pagamento diretto.</p>
            </div>
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <a href="/" className="text-indigo-600 text-sm hover:underline">← Torna alla home</a>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Scegli il tuo piano</h1>
          <p className="text-gray-500 mt-1">Acquista la licenza definitiva della tua app</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PIANI.map((p) => (
            <div key={p.id} onClick={() => setPiano(p.id)}
              className="cursor-pointer rounded-2xl border-2 p-6 transition relative"
              style={{ borderColor: piano === p.id ? p.colore : "#e5e7eb", background: piano === p.id ? p.colore + "10" : "white", boxShadow: piano === p.id ? `0 0 0 2px ${p.colore}30` : undefined }}>
              {p.consigliato && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">Il più scelto</span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: p.colore, background: piano === p.id ? p.colore : "transparent" }}>
                  {piano === p.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <h3 className="font-bold text-gray-800">{p.nome}</h3>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold" style={{ color: p.colore }}>
                  {scontoInfo && piano === p.id ? prezzoScontato : p.prezzo}€
                </span>
                <span className="text-gray-400 text-sm"> una tantum{p.mensile > 0 ? ` + ${p.mensile}€/mese` : ""}</span>
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
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome e Cognome *</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Mario Rossi"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mario@esempio.it"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice sconto (opzionale)</label>
            <div className="flex gap-2">
              <input type="text" value={codiceSconto}
                onChange={(e) => { setCodiceSconto(e.target.value); setScontoInfo(null); setScontoError(""); }}
                placeholder="es. PROMO20"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 uppercase" />
              <button onClick={validaSconto} className="px-5 py-3 rounded-xl font-bold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition">
                Applica
              </button>
            </div>
            {scontoInfo && <p className="text-green-600 text-sm mt-1">✅ {scontoInfo.discountPercent}% di sconto applicato{scontoInfo.description ? ` — ${scontoInfo.description}` : ""}</p>}
            {scontoError && <p className="text-red-500 text-sm mt-1">❌ {scontoError}</p>}
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-800">
            <p className="font-semibold mb-1">💳 Come pagare</p>
            <p>Puoi pagare tramite <strong>bonifico bancario</strong> o <strong>PayPal</strong> scrivendo su WhatsApp al <a href="https://wa.me/393793602035" className="underline font-bold">+39 379 360 2035</a></p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Totale da pagare</p>
              <p className="text-2xl font-bold text-gray-800">{prezzoScontato}€</p>
              {scontoInfo && <p className="text-xs text-green-600">Risparmi {pianoScelto.prezzo - prezzoScontato}€</p>}
            </div>
            <div className="text-right">
              {pianoScelto.mensile > 0 && <p className="text-xs text-gray-400">+ {pianoScelto.mensile}€/mese canone</p>}
              <p className="text-xs text-gray-400">✓ App tua per sempre</p>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={procediBonifico} disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition"
            style={{ background: loading ? "#9ca3af" : "#6366f1", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Elaborazione..." : "Visualizza dati bonifico →"}
          </button>

          <p className="text-xs text-center text-gray-400">
            🔒 Dati protetti. Nessun addebito automatico.
          </p>
        </div>
      </div>
    </div>
  );
}
