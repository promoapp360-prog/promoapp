import { useState, useEffect, useCallback } from "react";

const API_BASE = "";

interface DiscountCode {
  id: string; code: string; description: string | null;
  discountPercent: number; maxUses: number | null; usedCount: number;
  active: boolean; createdAt: string; expiresAt: string | null;
}
interface Acconto {
  id: string; progetto: string; tipo: string; nome: string; cognome: string;
  email: string; telefono: string; indirizzo: string; cap: string; citta: string;
  provincia: string | null; codiceFiscale: string | null; ragioneSociale: string | null;
  piva: string | null; sdi: string | null; pec: string | null;
  importoCentesimi: number; stripePaymentIntentId: string | null;
  stato: string; createdAt: string; paidAt: string | null;
}
interface Cliente {
  id: string; nome: string; cognome: string; email: string;
  telefono: string; note: string | null; createdAt: string;
}
interface VoceForm { descrizione: string; importo: string; }
interface ProgettoAdmin {
  id: string; clienteId: string | null; nome: string; url: string;
  password: string; descrizione: string; accontoVersato: number;
  createdAt: string; updatedAt: string;
  cliente: Cliente | null;
  voci: { id: string; descrizione: string; importo: number | null; ordine: number }[];
}

type Tab = "acconti" | "progetti" | "sconti" | "gestionali";

interface RichiestaGestionale {
  id: string; tipo: string; nome: string; cognome: string; email: string;
  telefono: string; tipoSoggetto: string; ragioneSociale: string | null;
  piva: string | null; codiceFiscale: string | null; settore: string | null;
  note: string | null; stato: string; username: string | null;
  passwordGestionale: string | null; createdAt: string;
}

const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
const lbl = "block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-gray-800 font-medium text-right">{children}</span>
    </div>
  );
}

const EMPTY_PROGETTO = { clienteId: "", nome: "", url: "", password: "", descrizione: "", accontoVersato: "" };
const DEFAULT_VOCI: VoceForm[] = [
  { descrizione: "Realizzazione app", importo: "0" },
  { descrizione: "Costi aggiornamento", importo: "0" },
  { descrizione: "Costo dominio", importo: "0" },
];

export default function Admin() {
  const [password, setPassword] = useState("");
  const [autenticato, setAutenticato] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("progetti");

  // Acconti
  const [acconti, setAcconti] = useState<Acconto[]>([]);
  const [loadingAcconti, setLoadingAcconti] = useState(false);
  const [accontoAperto, setAccontoAperto] = useState<Acconto | null>(null);

  // Codici sconto
  const [codici, setCodici] = useState<DiscountCode[]>([]);
  const [loadingCodici, setLoadingCodici] = useState(false);
  const [formSconto, setFormSconto] = useState({ code: "", description: "", discountPercent: 10, maxUses: "", expiresAt: "" });
  const [scontoError, setScontoError] = useState(""); const [scontoSuccess, setScontoSuccess] = useState("");

  // Clienti
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loadingClienti, setLoadingClienti] = useState(false);
  const [clienteForm, setClienteForm] = useState({ nome: "", cognome: "", email: "", telefono: "", note: "" });
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [clienteError, setClienteError] = useState("");

  // Progetti
  const [progetti, setProgetti] = useState<ProgettoAdmin[]>([]);
  const [loadingProgetti, setLoadingProgetti] = useState(false);
  const [progettoForm, setProgettoForm] = useState<typeof EMPTY_PROGETTO>(EMPTY_PROGETTO);

  // Richieste gestionale
  const [richieste, setRichieste] = useState<RichiestaGestionale[]>([]);
  const [loadingRichieste, setLoadingRichieste] = useState(false);

  // Contatore licenze G360
  const [licenze, setLicenze] = useState<number | null>(null);
  const [licenzeInput, setLicenzeInput] = useState("");
  const [licenzeSaving, setLicenzeSaving] = useState(false);

  // Contatore visite G360
  const [visite, setVisite] = useState<number | null>(null);
  const [richiestaAperta, setRichiestaAperta] = useState<RichiestaGestionale | null>(null);
  const [richiestaEdit, setRichiestaEdit] = useState({ username: "", passwordGestionale: "", stato: "" });
  const [vociForm, setVociForm] = useState<VoceForm[]>(DEFAULT_VOCI.map(v => ({ ...v })));
  const [editingProgettoId, setEditingProgettoId] = useState<string | null>(null);
  const [progettoError, setProgettoError] = useState("");
  const [progettoSuccess, setProgettoSuccess] = useState("");

  const h = (field: string, val: string) => setProgettoForm(f => ({ ...f, [field]: val }));

  const caricaAcconti = useCallback(async () => {
    setLoadingAcconti(true);
    const res = await fetch(`${API_BASE}/api/admin/acconti`, { headers: { "x-admin-password": password } });
    if (res.ok) setAcconti(await res.json());
    setLoadingAcconti(false);
  }, [password]);

  const caricaCodici = useCallback(async () => {
    setLoadingCodici(true);
    const res = await fetch(`${API_BASE}/api/admin/codes`, { headers: { "x-admin-password": password } });
    if (res.ok) setCodici(await res.json());
    setLoadingCodici(false);
  }, [password]);

  const caricaClienti = useCallback(async () => {
    setLoadingClienti(true);
    const res = await fetch(`${API_BASE}/api/admin/clienti`, { headers: { "x-admin-password": password } });
    if (res.ok) setClienti(await res.json());
    setLoadingClienti(false);
  }, [password]);

  const caricaProgetti = useCallback(async () => {
    setLoadingProgetti(true);
    const res = await fetch(`${API_BASE}/api/admin/progetti`, { headers: { "x-admin-password": password } });
    if (res.ok) setProgetti(await res.json());
    setLoadingProgetti(false);
  }, [password]);

  const caricaRichieste = useCallback(async () => {
    setLoadingRichieste(true);
    const res = await fetch(`${API_BASE}/api/admin/richieste-gestionale`, { headers: { "x-admin-password": password } });
    if (res.ok) setRichieste(await res.json());
    setLoadingRichieste(false);
  }, [password]);

  const caricaContatore = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/gestionale/contatore`);
    if (res.ok) { const d = await res.json(); setLicenze(d.licenze); setLicenzeInput(String(d.licenze)); }
    const res2 = await fetch(`${API_BASE}/api/gestionale/visite`);
    if (res2.ok) { const d = await res2.json(); setVisite(d.visite); }
  }, []);

  async function salvaContatore(val: number) {
    setLicenzeSaving(true);
    const res = await fetch(`${API_BASE}/api/admin/gestionale/contatore`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ licenze: val }),
    });
    if (res.ok) { const d = await res.json(); setLicenze(d.licenze); setLicenzeInput(String(d.licenze)); }
    setLicenzeSaving(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) { setAuthError("Inserisci la password"); return; }
    setAuthError("Verifica in corso...");
    const res = await fetch(`${API_BASE}/api/admin/verify`, {
      headers: { "x-admin-password": password }
    });
    if (res.ok) {
      setAutenticato(true); setAuthError("");
    } else {
      setAuthError("Password errata");
    }
  }

  useEffect(() => {
    if (autenticato) { caricaAcconti(); caricaCodici(); caricaClienti(); caricaProgetti(); caricaRichieste(); caricaContatore(); }
  }, [autenticato, caricaAcconti, caricaCodici, caricaClienti, caricaProgetti, caricaRichieste, caricaContatore]);

  function apriNuovoProgetto() {
    setEditingProgettoId(null);
    setProgettoForm(EMPTY_PROGETTO);
    setVociForm(DEFAULT_VOCI.map(v => ({ ...v })));
    setProgettoError(""); setProgettoSuccess("");
  }

  function apriModificaProgetto(p: ProgettoAdmin) {
    setEditingProgettoId(p.id);
    setProgettoForm({
      clienteId: p.clienteId || "", nome: p.nome, url: p.url,
      password: p.password, descrizione: p.descrizione,
      accontoVersato: String(p.accontoVersato),
    });
    setVociForm(p.voci.length > 0
      ? p.voci.map(v => ({ descrizione: v.descrizione, importo: v.importo !== null ? String(v.importo) : "" }))
      : [{ descrizione: "", importo: "" }]
    );
    setProgettoError(""); setProgettoSuccess("");
  }

  async function salvaProgetto() {
    setProgettoError(""); setProgettoSuccess("");
    if (!progettoForm.nome.trim()) { setProgettoError("Nome obbligatorio"); return; }
    if (!progettoForm.password.trim()) { setProgettoError("Password obbligatoria"); return; }

    const vociPulite = vociForm
      .filter(v => v.descrizione.trim())
      .map(v => ({ descrizione: v.descrizione.trim(), importo: v.importo !== "" ? parseInt(v.importo) : null }));

    const body = {
      ...progettoForm,
      clienteId: progettoForm.clienteId || undefined,
      accontoVersato: progettoForm.accontoVersato ? parseInt(progettoForm.accontoVersato) : 0,
      voci: vociPulite,
    };

    const url = editingProgettoId
      ? `${API_BASE}/api/admin/progetti/${editingProgettoId}`
      : `${API_BASE}/api/admin/progetti`;
    const method = editingProgettoId ? "PUT" : "POST";

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setProgettoError(data.error); return; }
    setProgettoSuccess(editingProgettoId ? "Progetto aggiornato!" : "Progetto creato!");
    caricaProgetti();
    if (!editingProgettoId) apriNuovoProgetto();
  }

  async function eliminaProgetto(id: string, nome: string) {
    if (!confirm(`Eliminare il progetto "${nome}"? Questa azione è irreversibile.`)) return;
    await fetch(`${API_BASE}/api/admin/progetti/${id}`, { method: "DELETE", headers: { "x-admin-password": password } });
    caricaProgetti();
  }

  function apriNuovoCliente() {
    setEditingClienteId(null);
    setClienteForm({ nome: "", cognome: "", email: "", telefono: "", note: "" });
    setClienteError(""); setShowClienteForm(true);
  }

  function apriModificaCliente(c: Cliente) {
    setEditingClienteId(c.id);
    setClienteForm({ nome: c.nome, cognome: c.cognome, email: c.email, telefono: c.telefono, note: c.note || "" });
    setClienteError(""); setShowClienteForm(true);
  }

  async function salvaCliente(e: React.FormEvent) {
    e.preventDefault(); setClienteError("");
    if (!clienteForm.nome.trim()) { setClienteError("Nome obbligatorio"); return; }
    const url = editingClienteId
      ? `${API_BASE}/api/admin/clienti/${editingClienteId}`
      : `${API_BASE}/api/admin/clienti`;
    const res = await fetch(url, {
      method: editingClienteId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(clienteForm),
    });
    const data = await res.json();
    if (!res.ok) { setClienteError(data.error); return; }
    setShowClienteForm(false); caricaClienti();
  }

  async function eliminaCliente(id: string, nome: string) {
    if (!confirm(`Eliminare il cliente "${nome}"?`)) return;
    await fetch(`${API_BASE}/api/admin/clienti/${id}`, { method: "DELETE", headers: { "x-admin-password": password } });
    caricaClienti();
  }

  async function creaCodice(e: React.FormEvent) {
    e.preventDefault(); setScontoError(""); setScontoSuccess("");
    const res = await fetch(`${API_BASE}/api/admin/codes`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ code: formSconto.code, description: formSconto.description || undefined,
        discountPercent: Number(formSconto.discountPercent), maxUses: formSconto.maxUses ? Number(formSconto.maxUses) : undefined,
        expiresAt: formSconto.expiresAt || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setScontoError(data.error); return; }
    setScontoSuccess(`Codice "${data.code}" creato!`);
    setFormSconto({ code: "", description: "", discountPercent: 10, maxUses: "", expiresAt: "" });
    caricaCodici();
  }

  if (!autenticato) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Admin PromoApp</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Pannello gestione</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password admin"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Accedi</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pannello Admin</h1>
            <p className="text-gray-500 text-sm">PromoApp.it · Sophia 2005 S.r.l.</p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="text-sm text-indigo-600 hover:underline">← Sito</a>
            <button onClick={() => { setAutenticato(false); setPassword(""); }} className="text-sm text-gray-400 hover:text-gray-600">Esci</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {([["progetti", "🗂️ Progetti"], ["gestionali", "💻 Gestionali"], ["acconti", "💰 Acconti"], ["sconti", "🏷️ Codici Sconto"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${tab === t ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {label}
              {t === "gestionali" && richieste.filter(r => r.stato === "nuova").length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{richieste.filter(r => r.stato === "nuova").length}</span>
              )}
            </button>
          ))}
        </div>

        {/* =================== TAB PROGETTI =================== */}
        {tab === "progetti" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Colonna sinistra: lista progetti + clienti */}
            <div className="space-y-4">
              {/* Sezione Clienti */}
              <div className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">👤 Clienti</h2>
                  <button onClick={apriNuovoCliente}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition">
                    + Nuovo cliente
                  </button>
                </div>
                {loadingClienti ? <p className="text-gray-400 text-sm text-center py-4">Caricamento...</p>
                  : clienti.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">Nessun cliente. Inizia aggiungendone uno.</p>
                  : (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {clienti.map(c => (
                        <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{c.nome} {c.cognome}</div>
                            <div className="text-xs text-gray-400">{c.email} {c.telefono ? `· ${c.telefono}` : ""}</div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => apriModificaCliente(c)} className="text-indigo-500 text-xs hover:text-indigo-700">Modifica</button>
                            <button onClick={() => eliminaCliente(c.id, c.nome)} className="text-red-400 text-xs hover:text-red-600">🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Sezione Progetti */}
              <div className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">🗂️ Progetti in esecuzione</h2>
                  <button onClick={apriNuovoProgetto}
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700 transition">
                    + Nuovo progetto
                  </button>
                </div>
                {loadingProgetti ? <p className="text-gray-400 text-sm text-center py-4">Caricamento...</p>
                  : progetti.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">Nessun progetto ancora.</p>
                  : (
                    <div className="space-y-3">
                      {progetti.map(p => {
                        const totale = p.voci.reduce((s, v) => s + (v.importo ?? 0), 0);
                        const residuo = totale - p.accontoVersato;
                        return (
                          <div key={p.id} className={`border rounded-xl p-4 ${editingProgettoId === p.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-gray-50"}`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="font-bold text-sm text-gray-800">{p.nome}</div>
                                {p.cliente && <div className="text-xs text-gray-400">{p.cliente.nome} {p.cliente.cognome}</div>}
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => apriModificaProgetto(p)} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">Modifica</button>
                                <button onClick={() => eliminaProgetto(p.id, p.nome)} className="text-xs text-red-400 hover:text-red-600">🗑</button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">🔑 {p.password}</span>
                              {totale > 0 && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">€{totale.toLocaleString("it-IT")}</span>}
                              {p.accontoVersato > 0 && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Acconto: €{p.accontoVersato}</span>}
                              {residuo > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Residuo: €{residuo}</span>}
                              {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition">🔗 App</a>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>

            {/* Colonna destra: form progetto / form cliente */}
            <div className="space-y-4">
              {/* Form cliente (modale inline) */}
              {showClienteForm && (
                <div className="bg-white rounded-2xl shadow p-5 border-2 border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">{editingClienteId ? "Modifica cliente" : "Nuovo cliente"}</h3>
                    <button onClick={() => setShowClienteForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>
                  <form onSubmit={salvaCliente} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>Nome *</label><input value={clienteForm.nome} onChange={e => setClienteForm(f => ({ ...f, nome: e.target.value }))} className={inp} placeholder="Mario" /></div>
                      <div><label className={lbl}>Cognome</label><input value={clienteForm.cognome} onChange={e => setClienteForm(f => ({ ...f, cognome: e.target.value }))} className={inp} placeholder="Rossi" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>Email</label><input type="email" value={clienteForm.email} onChange={e => setClienteForm(f => ({ ...f, email: e.target.value }))} className={inp} placeholder="mario@esempio.it" /></div>
                      <div><label className={lbl}>Telefono</label><input value={clienteForm.telefono} onChange={e => setClienteForm(f => ({ ...f, telefono: e.target.value }))} className={inp} placeholder="+39 333 1234567" /></div>
                    </div>
                    <div><label className={lbl}>Note</label><textarea value={clienteForm.note} onChange={e => setClienteForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" /></div>
                    {clienteError && <p className="text-red-500 text-sm">{clienteError}</p>}
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                        {editingClienteId ? "Salva modifiche" : "Crea cliente"}
                      </button>
                      <button type="button" onClick={() => setShowClienteForm(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition">Annulla</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form progetto */}
              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="font-bold text-gray-800 mb-4">
                  {editingProgettoId ? "✏️ Modifica progetto" : "➕ Nuovo progetto"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Cliente</label>
                    <select value={progettoForm.clienteId} onChange={e => h("clienteId", e.target.value)} className={inp}>
                      <option value="">— Nessun cliente collegato —</option>
                      {clienti.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>
                      ))}
                    </select>
                    <button type="button" onClick={apriNuovoCliente} className="text-xs text-indigo-500 hover:underline mt-1 block">
                      + Crea nuovo cliente
                    </button>
                  </div>

                  <div>
                    <label className={lbl}>Nome progetto *</label>
                    <input value={progettoForm.nome} onChange={e => h("nome", e.target.value)} className={inp} placeholder="es. Enzo Acconciature" />
                  </div>

                  <div>
                    <label className={lbl}>Descrizione (visibile al cliente)</label>
                    <input value={progettoForm.descrizione} onChange={e => h("descrizione", e.target.value)} className={inp} placeholder="es. Gestionale appuntamenti · Calendario" />
                  </div>

                  <div>
                    <label className={lbl}>Link dell'app (URL diretto)</label>
                    <input value={progettoForm.url} onChange={e => h("url", e.target.value)} className={inp} placeholder="https://enzoacconciature.replit.app/admin" />
                  </div>

                  <div>
                    <label className={lbl}>Password per il cliente *</label>
                    <input value={progettoForm.password} onChange={e => h("password", e.target.value)} className={inp} placeholder="es. Enzo" />
                    <p className="text-xs text-gray-400 mt-1">Il cliente la inserirà nella sezione "Lavori in Esecuzione"</p>
                  </div>

                  <div>
                    <label className={lbl}>Acconto già versato (€)</label>
                    <input type="number" min="0" value={progettoForm.accontoVersato} onChange={e => h("accontoVersato", e.target.value)} className={inp} placeholder="0" />
                  </div>

                  {/* Voci */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={lbl}>Voci di costo</label>
                      <button type="button"
                        onClick={() => setVociForm(v => [...v, { descrizione: "", importo: "" }])}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
                        + Aggiungi voce
                      </button>
                    </div>
                    <div className="space-y-2">
                      {vociForm.map((v, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            value={v.descrizione}
                            onChange={e => setVociForm(vv => vv.map((x, j) => j === i ? { ...x, descrizione: e.target.value } : x))}
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="es. Realizzazione app"
                          />
                          <div className="relative w-28 flex-shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                            <input
                              type="number" min="0"
                              value={v.importo}
                              onChange={e => setVociForm(vv => vv.map((x, j) => j === i ? { ...x, importo: e.target.value } : x))}
                              className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              placeholder="TBD"
                            />
                          </div>
                          {vociForm.length > 1 && (
                            <button type="button" onClick={() => setVociForm(vv => vv.filter((_, j) => j !== i))}
                              className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Lascia il campo € vuoto per mostrare "Da definire" al cliente</p>
                  </div>

                  {progettoError && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{progettoError}</p>}
                  {progettoSuccess && <p className="text-green-600 text-sm bg-green-50 rounded-xl px-3 py-2">{progettoSuccess}</p>}

                  <div className="flex gap-3">
                    <button onClick={salvaProgetto}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                      {editingProgettoId ? "💾 Salva modifiche" : "✅ Crea progetto"}
                    </button>
                    {editingProgettoId && (
                      <button onClick={apriNuovoProgetto} className="px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition">
                        + Nuovo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================== TAB ACCONTI =================== */}
        {tab === "acconti" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-emerald-600">{(acconti.filter(a => a.stato === "pagato").reduce((s, a) => s + a.importoCentesimi, 0) / 100).toFixed(2).replace(".", ",")}€</p>
                <p className="text-sm text-gray-500 mt-1">Incassato totale</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-indigo-600">{acconti.filter(a => a.stato === "pagato").length}</p>
                <p className="text-sm text-gray-500 mt-1">Acconti pagati</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-orange-500">{acconti.filter(a => a.stato === "in_attesa").length}</p>
                <p className="text-sm text-gray-500 mt-1">In attesa</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">Tutti gli acconti</h2>
                <button onClick={caricaAcconti} className="text-sm text-indigo-600 hover:underline"><i className="fas fa-sync-alt mr-1"></i> Aggiorna</button>
              </div>
              {loadingAcconti ? <p className="text-gray-400 text-sm text-center py-12">Caricamento...</p>
                : acconti.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-inbox text-4xl text-gray-200 mb-3 block"></i>
                    <p className="text-gray-400 text-sm">Nessun acconto ricevuto</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left">
                          <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                          <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Progetto</th>
                          <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Importo</th>
                          <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stato</th>
                          <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {acconti.map((a) => (
                          <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="py-3.5 pr-4"><div className="font-semibold text-gray-800">{a.nome} {a.cognome}</div><div className="text-xs text-gray-400">{a.email}</div></td>
                            <td className="py-3.5 pr-4 max-w-[180px]"><div className="truncate text-gray-700">{a.progetto}</div></td>
                            <td className="py-3.5 pr-4"><span className="text-lg font-bold text-indigo-700">{(a.importoCentesimi / 100).toFixed(2).replace(".", ",")}€</span></td>
                            <td className="py-3.5 pr-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${a.stato === "pagato" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                {a.stato === "pagato" ? "✓ Pagato" : "⏳ In attesa"}
                              </span>
                            </td>
                            <td className="py-3.5 pr-4 text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString("it-IT")}</td>
                            <td className="py-3.5"><button onClick={() => setAccontoAperto(a)} className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold">Dettagli →</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
            {accontoAperto && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAccontoAperto(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <div><h3 className="text-lg font-bold text-gray-800">Dettaglio acconto</h3><span className="text-xs font-mono text-gray-400">#{accontoAperto.id.slice(0, 8).toUpperCase()}</span></div>
                    <button onClick={() => setAccontoAperto(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">&times;</button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <Row label="Stato"><span className={`px-3 py-1 rounded-full text-xs font-bold ${accontoAperto.stato === "pagato" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{accontoAperto.stato === "pagato" ? "✓ Pagato" : "⏳ In attesa"}</span></Row>
                    <Row label="Importo"><span className="text-xl font-bold text-indigo-700">{(accontoAperto.importoCentesimi / 100).toFixed(2).replace(".", ",")}€</span></Row>
                    <Row label="Progetto"><span className="text-gray-700">{accontoAperto.progetto}</span></Row>
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dati cliente</div>
                      <Row label="Nome">{accontoAperto.nome} {accontoAperto.cognome}</Row>
                      <Row label="Email"><a href={`mailto:${accontoAperto.email}`} className="text-indigo-600 underline">{accontoAperto.email}</a></Row>
                      <Row label="Telefono"><a href={`tel:${accontoAperto.telefono}`} className="text-indigo-600 underline">{accontoAperto.telefono}</a></Row>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <a href={`mailto:${accontoAperto.email}`} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold text-center hover:bg-indigo-700 transition"><i className="fas fa-envelope mr-2"></i>Email</a>
                    <a href={`https://wa.me/${accontoAperto.telefono.replace(/\D/g, "")}?text=Ciao%20${accontoAperto.nome}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold text-center hover:bg-green-600 transition"><i className="fab fa-whatsapp mr-2"></i>WhatsApp</a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* =================== TAB GESTIONALI =================== */}
        {tab === "gestionali" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-lg">💻 Richieste prova gratuita gestionali</h2>
              <button onClick={() => { caricaRichieste(); caricaContatore(); }} className="text-sm text-indigo-600 hover:underline"><i className="fas fa-sync-alt mr-1"></i> Aggiorna</button>
            </div>

            {/* ── Statistiche richieste ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl shadow p-4 text-center col-span-2 md:col-span-3 border-l-4 border-sky-400">
                <div className="text-4xl font-extrabold text-sky-600">{visite ?? "—"}</div>
                <div className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wide">Visite totali pagina Gestionale360</div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4 text-center">
                <div className="text-3xl font-extrabold text-indigo-600">{richieste.length}</div>
                <div className="text-xs text-gray-400 mt-1">Richieste totali</div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4 text-center">
                <div className="text-3xl font-extrabold text-emerald-600">{richieste.filter(r => r.tipo === "gestionale360").length}</div>
                <div className="text-xs text-gray-400 mt-1">Gestionale360</div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4 text-center">
                <div className="text-3xl font-extrabold text-red-500">{richieste.filter(r => r.stato === "nuova").length}</div>
                <div className="text-xs text-gray-400 mt-1">Da gestire</div>
              </div>
            </div>

            {/* ── Contatore licenze G360 ── */}
            <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-ticket text-emerald-600"></i>
                    Contatore licenze Gestionale360
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Visibile sulla landing page come "licenze rimaste"</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => salvaContatore(Math.max(0, (licenze ?? 0) - 1))} disabled={licenzeSaving || licenze === 0}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-40 transition">−</button>
                  <input
                    type="number" min={0} max={9999}
                    value={licenzeInput}
                    onChange={e => setLicenzeInput(e.target.value)}
                    onBlur={() => { const n = parseInt(licenzeInput, 10); if (!isNaN(n) && n >= 0) salvaContatore(n); else setLicenzeInput(String(licenze ?? 0)); }}
                    className="w-20 text-center text-2xl font-extrabold text-emerald-700 border-2 border-emerald-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <button onClick={() => salvaContatore((licenze ?? 0) + 1)} disabled={licenzeSaving}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-40 transition">+</button>
                  {licenzeSaving && <span className="text-xs text-gray-400 ml-1">Salvo...</span>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Sulla landing appare: <span className="text-emerald-700 font-semibold">⚡ Solo {licenze ?? "..."} licenze disponibili a questo prezzo</span>
              </p>
            </div>
            {loadingRichieste ? <p className="text-gray-400 text-sm text-center py-12">Caricamento...</p>
              : richieste.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-12 text-center">
                  <i className="fas fa-inbox text-4xl text-gray-200 mb-3 block"></i>
                  <p className="text-gray-400 text-sm">Nessuna richiesta ancora.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {richieste.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl shadow p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${r.tipo === "gestionale360" ? "bg-emerald-700" : "bg-orange-600"}`}>
                            {r.tipo === "gestionale360" ? "G" : "A"}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{r.nome} {r.cognome}</div>
                            <div className="text-xs text-gray-400">{r.tipo === "gestionale360" ? "Gestionale360" : "AgentiPro"} · {new Date(r.createdAt).toLocaleDateString("it-IT")}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.stato === "nuova" ? "bg-red-100 text-red-700" : r.stato === "inviata" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                            {r.stato === "nuova" ? "🔴 Nuova" : r.stato === "inviata" ? "🟡 Inviata" : "🟢 Attiva"}
                          </span>
                          <button onClick={() => { setRichiestaAperta(r); setRichiestaEdit({ username: r.username ?? "", passwordGestionale: r.passwordGestionale ?? "", stato: r.stato }); }}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition">
                            Gestisci
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                        <span><i className="fas fa-envelope mr-1"></i>{r.email}</span>
                        {r.telefono && <span><i className="fas fa-phone mr-1"></i>{r.telefono}</span>}
                        {r.piva && <span><i className="fas fa-building mr-1"></i>P.IVA {r.piva}</span>}
                        {r.settore && <span><i className="fas fa-tag mr-1"></i>{r.settore}</span>}
                        {r.username && <span><i className="fas fa-user-check mr-1 text-emerald-600"></i>User: <strong>{r.username}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* Modal gestisci richiesta */}
            {richiestaAperta && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRichiestaAperta(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Gestisci richiesta</h3>
                      <p className="text-xs text-gray-400">{richiestaAperta.nome} {richiestaAperta.cognome} · {richiestaAperta.tipo === "gestionale360" ? "Gestionale360" : "AgentiPro"}</p>
                    </div>
                    <button onClick={() => setRichiestaAperta(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">&times;</button>
                  </div>
                  <div className="space-y-3 text-sm mb-5">
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-4">
                      <div><span className="text-gray-400 text-xs">Email</span><p className="font-medium">{richiestaAperta.email}</p></div>
                      <div><span className="text-gray-400 text-xs">Telefono</span><p className="font-medium">{richiestaAperta.telefono || "—"}</p></div>
                      {richiestaAperta.ragioneSociale && <div><span className="text-gray-400 text-xs">Ragione Sociale</span><p className="font-medium">{richiestaAperta.ragioneSociale}</p></div>}
                      {richiestaAperta.piva && <div><span className="text-gray-400 text-xs">P.IVA</span><p className="font-medium">{richiestaAperta.piva}</p></div>}
                      {richiestaAperta.codiceFiscale && <div><span className="text-gray-400 text-xs">C.F.</span><p className="font-medium">{richiestaAperta.codiceFiscale}</p></div>}
                      {richiestaAperta.settore && <div><span className="text-gray-400 text-xs">Settore</span><p className="font-medium">{richiestaAperta.settore}</p></div>}
                      {richiestaAperta.note && <div className="col-span-2"><span className="text-gray-400 text-xs">Note</span><p className="font-medium">{richiestaAperta.note}</p></div>}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={lbl}>Username gestionale</label>
                        <input className={inp} value={richiestaEdit.username} onChange={e => setRichiestaEdit(f => ({ ...f, username: e.target.value }))} placeholder="es. mario.rossi" />
                      </div>
                      <div>
                        <label className={lbl}>Password gestionale</label>
                        <input className={inp} value={richiestaEdit.passwordGestionale} onChange={e => setRichiestaEdit(f => ({ ...f, passwordGestionale: e.target.value }))} placeholder="es. Rossi2025!" />
                      </div>
                      <div>
                        <label className={lbl}>Stato</label>
                        <select className={inp} value={richiestaEdit.stato} onChange={e => setRichiestaEdit(f => ({ ...f, stato: e.target.value }))}>
                          <option value="nuova">🔴 Nuova</option>
                          <option value="inviata">🟡 Inviata</option>
                          <option value="attiva">🟢 Attiva</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={async () => {
                      await fetch(`${API_BASE}/api/admin/richieste-gestionale/${richiestaAperta.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "x-admin-password": password },
                        body: JSON.stringify(richiestaEdit),
                      });
                      setRichiestaAperta(null); caricaRichieste();
                    }} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                      💾 Salva credenziali
                    </button>
                    <a href={`mailto:${richiestaAperta.email}?subject=Accesso%20${richiestaAperta.tipo === "gestionale360" ? "Gestionale360" : "AgentiPro"}&body=Username%3A%20${richiestaEdit.username}%0APassword%3A%20${richiestaEdit.passwordGestionale}`}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2">
                      <i className="fas fa-envelope"></i> Invia
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================== TAB SCONTI =================== */}
        {tab === "sconti" && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow text-center"><p className="text-3xl font-bold text-indigo-600">{codici.length}</p><p className="text-sm text-gray-500 mt-1">Codici totali</p></div>
              <div className="bg-white rounded-2xl p-5 shadow text-center"><p className="text-3xl font-bold text-green-600">{codici.filter(c => c.active).length}</p><p className="text-sm text-gray-500 mt-1">Codici attivi</p></div>
              <div className="bg-white rounded-2xl p-5 shadow text-center"><p className="text-3xl font-bold text-orange-500">{codici.reduce((a, c) => a + c.usedCount, 0)}</p><p className="text-sm text-gray-500 mt-1">Utilizzi totali</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Crea nuovo codice</h2>
                <form onSubmit={creaCodice} className="space-y-4">
                  <div><label className="text-sm font-medium text-gray-700">Codice *</label><input type="text" value={formSconto.code} onChange={e => setFormSconto(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="es. ESTATE30" className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 uppercase" required /></div>
                  <div><label className="text-sm font-medium text-gray-700">Descrizione</label><input type="text" value={formSconto.description} onChange={e => setFormSconto(f => ({ ...f, description: e.target.value }))} placeholder="es. Promo estate 2025" className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium text-gray-700">Sconto % *</label><input type="number" min={1} max={100} value={formSconto.discountPercent} onChange={e => setFormSconto(f => ({ ...f, discountPercent: Number(e.target.value) }))} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required /></div>
                    <div><label className="text-sm font-medium text-gray-700">Max utilizzi</label><input type="number" min={1} value={formSconto.maxUses} onChange={e => setFormSconto(f => ({ ...f, maxUses: e.target.value }))} placeholder="∞ illimitati" className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700">Scadenza</label><input type="date" value={formSconto.expiresAt} onChange={e => setFormSconto(f => ({ ...f, expiresAt: e.target.value }))} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
                  {scontoError && <p className="text-red-500 text-sm">{scontoError}</p>}
                  {scontoSuccess && <p className="text-green-600 text-sm">{scontoSuccess}</p>}
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm">+ Crea codice sconto</button>
                </form>
              </div>
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-800">Codici esistenti</h2><button onClick={caricaCodici} className="text-sm text-indigo-600 hover:underline">Aggiorna</button></div>
                {loadingCodici ? <p className="text-gray-400 text-sm text-center py-8">Caricamento...</p>
                  : codici.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">Nessun codice creato</p>
                  : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {codici.map(c => (
                        <div key={c.id} className={`rounded-xl border p-4 ${c.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                          <div className="flex items-center justify-between mb-1"><span className="font-mono font-bold text-gray-800 text-sm">{c.code}</span><span className="text-lg font-bold text-indigo-600">{c.discountPercent}%</span></div>
                          {c.description && <p className="text-xs text-gray-500 mb-2">{c.description}</p>}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Usi: {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}{c.expiresAt && ` · Scade: ${new Date(c.expiresAt).toLocaleDateString("it-IT")}`}</span>
                            <div className="flex gap-2">
                              <button onClick={async () => { await fetch(`${API_BASE}/api/admin/codes/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ active: !c.active }) }); caricaCodici(); }} className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.active ? "bg-green-200 text-green-700 hover:bg-red-100 hover:text-red-600" : "bg-gray-200 text-gray-500 hover:bg-green-100 hover:text-green-600"}`}>{c.active ? "Attivo" : "Disattivo"}</button>
                              <button onClick={async () => { if (!confirm(`Eliminare "${c.code}"?`)) return; await fetch(`${API_BASE}/api/admin/codes/${c.id}`, { method: "DELETE", headers: { "x-admin-password": password } }); caricaCodici(); }} className="text-red-400 hover:text-red-600 px-1">🗑</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
