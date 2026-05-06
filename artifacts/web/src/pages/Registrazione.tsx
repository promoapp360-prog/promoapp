import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SignIn, SignUp, useUser } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Step = "scelta" | "accedi" | "registrati" | "dati";
type TipoCliente = "privato" | "azienda";

interface DatiCliente {
  tipo: TipoCliente;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  ragioneSociale: string;
  piva: string;
  sdi: string;
  pec: string;
}

function DatiForm({ piano, onComplete }: { piano: string; onComplete: (dati: DatiCliente) => void }) {
  const { user } = useUser();
  const [tipo, setTipo] = useState<TipoCliente>("privato");
  const [form, setForm] = useState<DatiCliente>({
    tipo: "privato",
    nome: user?.firstName ?? "",
    cognome: user?.lastName ?? "",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    telefono: "",
    indirizzo: "",
    cap: "",
    citta: "",
    provincia: "",
    ragioneSociale: "",
    piva: "",
    sdi: "",
    pec: "",
  });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.cognome || !form.email || !form.telefono || !form.indirizzo || !form.cap || !form.citta) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }
    if (tipo === "azienda" && (!form.ragioneSociale || !form.piva)) {
      setError("Compila Ragione Sociale e P.IVA.");
      return;
    }
    onComplete({ ...form, tipo });
  }

  const input = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Sei un privato o un'azienda?</p>
        <div className="grid grid-cols-2 gap-3">
          {(["privato", "azienda"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTipo(t); setForm((f) => ({ ...f, tipo: t })); }}
              className="py-3 rounded-xl border-2 font-semibold text-sm transition"
              style={{
                borderColor: tipo === t ? "#6366f1" : "#e5e7eb",
                background: tipo === t ? "#eef2ff" : "white",
                color: tipo === t ? "#4338ca" : "#6b7280",
              }}
            >
              {t === "privato" ? "👤 Privato" : "🏢 Azienda / P.IVA"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Nome *</label>
          <input name="nome" value={form.nome} onChange={handleChange} className={input} placeholder="Mario" />
        </div>
        <div>
          <label className={label}>Cognome *</label>
          <input name="cognome" value={form.cognome} onChange={handleChange} className={input} placeholder="Rossi" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Email *</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className={input} placeholder="mario@esempio.it" />
        </div>
        <div>
          <label className={label}>Telefono *</label>
          <input name="telefono" type="tel" value={form.telefono} onChange={handleChange} className={input} placeholder="+39 333 1234567" />
        </div>
      </div>

      <div>
        <label className={label}>Indirizzo (via e numero) *</label>
        <input name="indirizzo" value={form.indirizzo} onChange={handleChange} className={input} placeholder="Via Roma, 1" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>CAP *</label>
          <input name="cap" value={form.cap} onChange={handleChange} className={input} placeholder="00100" maxLength={5} />
        </div>
        <div className="col-span-2">
          <label className={label}>Città *</label>
          <input name="citta" value={form.citta} onChange={handleChange} className={input} placeholder="Roma" />
        </div>
      </div>

      <div>
        <label className={label}>Provincia</label>
        <input name="provincia" value={form.provincia} onChange={handleChange} className={input} placeholder="RM" maxLength={2} />
      </div>

      {tipo === "azienda" && (
        <div className="border-t border-gray-100 pt-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Dati azienda</p>
          <div>
            <label className={label}>Ragione Sociale *</label>
            <input name="ragioneSociale" value={form.ragioneSociale} onChange={handleChange} className={input} placeholder="Mia Azienda S.r.l." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Partita IVA *</label>
              <input name="piva" value={form.piva} onChange={handleChange} className={input} placeholder="IT12345678901" maxLength={11} />
            </div>
            <div>
              <label className={label}>Codice SDI</label>
              <input name="sdi" value={form.sdi} onChange={handleChange} className={input} placeholder="XXXXXXX" maxLength={7} />
            </div>
          </div>
          <div>
            <label className={label}>PEC</label>
            <input name="pec" type="email" value={form.pec} onChange={handleChange} className={input} placeholder="azienda@pec.it" />
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-base"
      >
        Continua al pagamento →
      </button>
    </form>
  );
}

export default function Registrazione() {
  const [, navigate] = useLocation();
  const { isSignedIn, isLoaded } = useUser();
  const [step, setStep] = useState<Step>("scelta");

  const params = new URLSearchParams(window.location.search);
  const piano = params.get("piano") ?? "base";

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setStep("dati");
    }
  }, [isLoaded, isSignedIn]);

  function handleDatiComplete(dati: DatiCliente) {
    sessionStorage.setItem("cliente_dati", JSON.stringify(dati));
    navigate(`/checkout?piano=${piano}`);
  }

  const appearance = {
    cssLayerName: "clerk",
    variables: {
      colorPrimary: "#6366f1",
      colorForeground: "#1f2937",
      colorMutedForeground: "#6b7280",
      colorDanger: "#ef4444",
      colorBackground: "#ffffff",
      colorInput: "#f9fafb",
      colorInputForeground: "#1f2937",
      colorNeutral: "#e5e7eb",
      fontFamily: "Inter, sans-serif",
      borderRadius: "0.75rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "text-gray-800 font-bold",
      headerSubtitle: "text-gray-500",
      socialButtonsBlockButtonText: "text-gray-700 font-medium",
      formFieldLabel: "text-gray-700 font-medium",
      footerActionLink: "text-indigo-600 font-semibold",
      footerActionText: "text-gray-500",
      dividerText: "text-gray-400",
      identityPreviewEditButton: "text-indigo-600",
      formFieldSuccessText: "text-emerald-600",
      alertText: "text-gray-700",
      logoBox: "mb-2",
      logoImage: "h-10",
      socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50",
      formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
      formFieldInput: "bg-gray-50 border-gray-200",
      footerAction: "border-t border-gray-100",
      dividerLine: "bg-gray-200",
      alert: "border border-red-100 bg-red-50",
      otpCodeFieldInput: "border-gray-300",
      formFieldRow: "",
      main: "",
    },
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-indigo-600 tracking-tighter">
            Promo<span className="text-emerald-500">App</span>.it
          </a>
          <p className="text-gray-500 text-sm mt-1">
            {step === "dati"
              ? "Inserisci i tuoi dati di fatturazione"
              : "Crea il tuo account per acquistare"}
          </p>
        </div>

        {/* Indicatore piano */}
        {(() => {
          const PIANI_INFO: Record<string, { nome: string; prezzo: string; mensile: string }> = {
            base:          { nome: "Base",         prezzo: "690", mensile: "+ 19€/mese" },
            pro:           { nome: "Business Pro", prezzo: "890", mensile: "+ 29€/mese" },
            gestionale360: { nome: "Gestionale360",prezzo: "199", mensile: "Licenza a vita" },
            agentipro:     { nome: "AgentiPro",    prezzo: "199", mensile: "Licenza a vita" },
          };
          const info = PIANI_INFO[piano] ?? PIANI_INFO["base"];
          return (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-500 font-semibold uppercase tracking-widest">Piano selezionato</span>
                <div className="font-bold text-gray-800">{info.nome}</div>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-indigo-700">{info.prezzo}€</span>
                <div className="text-xs text-gray-400">{info.mensile}</div>
              </div>
            </div>
          );
        })()}

        {/* Step: scelta o auth */}
        {step === "scelta" && (
          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 text-center">Come vuoi procedere?</h2>
            <button
              onClick={() => setStep("registrati")}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-user-plus"></i>
              Crea un nuovo account
            </button>
            <button
              onClick={() => setStep("accedi")}
              className="w-full py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-indigo-300 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-sign-in-alt text-indigo-600"></i>
              Hai già un account? Accedi
            </button>
          </div>
        )}

        {step === "accedi" && (
          <div>
            <button onClick={() => setStep("scelta")} className="mb-4 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <i className="fas fa-arrow-left text-xs"></i> Indietro
            </button>
            <SignIn
              routing="hash"
              fallbackRedirectUrl={`${basePath}/registrazione?piano=${piano}`}
              signUpUrl={`${basePath}/registrazione?piano=${piano}`}
              appearance={appearance}
            />
          </div>
        )}

        {step === "registrati" && (
          <div>
            <button onClick={() => setStep("scelta")} className="mb-4 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <i className="fas fa-arrow-left text-xs"></i> Indietro
            </button>
            <SignUp
              routing="hash"
              fallbackRedirectUrl={`${basePath}/registrazione?piano=${piano}`}
              signInUrl={`${basePath}/registrazione?piano=${piano}`}
              appearance={appearance}
            />
          </div>
        )}

        {step === "dati" && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Dati di fatturazione</h2>
            <DatiForm piano={piano} onComplete={handleDatiComplete} />
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Dati protetti · <a href="/privacy.html" className="underline hover:text-gray-600">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
