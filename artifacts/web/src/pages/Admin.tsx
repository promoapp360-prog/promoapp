import { useState, useEffect, useCallback } from "react";

const API_BASE = "";

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface Acconto {
  id: string;
  progetto: string;
  tipo: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string | null;
  codiceFiscale: string | null;
  ragioneSociale: string | null;
  piva: string | null;
  sdi: string | null;
  pec: string | null;
  importoCentesimi: number;
  stripePaymentIntentId: string | null;
  stato: string;
  createdAt: string;
  paidAt: string | null;
}

type Tab = "sconti" | "acconti";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [autenticato, setAutenticato] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("acconti");

  const [codici, setCodici] = useState<DiscountCode[]>([]);
  const [loadingCodici, setLoadingCodici] = useState(false);

  const [acconti, setAcconti] = useState<Acconto[]>([]);
  const [loadingAcconti, setLoadingAcconti] = useState(false);
  const [accontoAperto, setAccontoAperto] = useState<Acconto | null>(null);

  const [form, setForm] = useState({
    code: "", description: "", discountPercent: 10, maxUses: "", expiresAt: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const caricaCodici = useCallback(async () => {
    setLoadingCodici(true);
    const res = await fetch(`${API_BASE}/api/admin/codes`, {
      headers: { "x-admin-password": password },
    });
    if (res.ok) setCodici(await res.json());
    setLoadingCodici(false);
  }, [password]);

  const caricaAcconti = useCallback(async () => {
    setLoadingAcconti(true);
    const res = await fetch(`${API_BASE}/api/admin/acconti`, {
      headers: { "x-admin-password": password },
    });
    if (res.ok) setAcconti(await res.json());
    setLoadingAcconti(false);
  }, [password]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) { setAuthError("Inserisci la password"); return; }
    setAutenticato(true);
    setAuthError("");
  }

  useEffect(() => {
    if (autenticato) { caricaCodici(); caricaAcconti(); }
  }, [autenticato, caricaCodici, caricaAcconti]);

  async function creaCodice(e: React.FormEvent) {
    e.preventDefault();
    setFormError(""); setFormSuccess("");
    const res = await fetch(`${API_BASE}/api/admin/codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({
        code: form.code, description: form.description || undefined,
        discountPercent: Number(form.discountPercent),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error); return; }
    setFormSuccess(`Codice "${data.code}" creato con successo!`);
    setForm({ code: "", description: "", discountPercent: 10, maxUses: "", expiresAt: "" });
    caricaCodici();
  }

  async function toggleAttivo(id: string, active: boolean) {
    await fetch(`${API_BASE}/api/admin/codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ active }),
    });
    caricaCodici();
  }

  async function eliminaCodice(id: string, code: string) {
    if (!confirm(`Eliminare il codice "${code}"?`)) return;
    await fetch(`${API_BASE}/api/admin/codes/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
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
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
              Accedi
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totaleAccontiPagati = acconti.filter(a => a.stato === "pagato").reduce((s, a) => s + a.importoCentesimi, 0);
  const accontiPagati = acconti.filter(a => a.stato === "pagato").length;
  const accontiAttesa = acconti.filter(a => a.stato === "in_attesa").length;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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

        {/* Tab Bar */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("acconti")}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${tab === "acconti" ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            💰 Acconti
          </button>
          <button onClick={() => setTab("sconti")}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${tab === "sconti" ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            🏷️ Codici Sconto
          </button>
        </div>

        {/* =================== TAB ACCONTI =================== */}
        {tab === "acconti" && (
          <>
            {/* KPI */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-emerald-600">{(totaleAccontiPagati / 100).toFixed(2).replace(".", ",")}€</p>
                <p className="text-sm text-gray-500 mt-1">Incassato totale</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-indigo-600">{accontiPagati}</p>
                <p className="text-sm text-gray-500 mt-1">Acconti pagati</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-orange-500">{accontiAttesa}</p>
                <p className="text-sm text-gray-500 mt-1">In attesa</p>
              </div>
            </div>

            {/* Lista acconti */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">Tutti gli acconti</h2>
                <button onClick={caricaAcconti} className="text-sm text-indigo-600 hover:underline">
                  <i className="fas fa-sync-alt mr-1"></i> Aggiorna
                </button>
              </div>
              {loadingAcconti ? (
                <p className="text-gray-400 text-sm text-center py-12">Caricamento...</p>
              ) : acconti.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-4xl text-gray-200 mb-3 block"></i>
                  <p className="text-gray-400 text-sm">Nessun acconto ancora ricevuto</p>
                  <p className="text-gray-300 text-xs mt-1">Condividi il link <strong>/acconto</strong> con i tuoi clienti</p>
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
                          <td className="py-3.5 pr-4">
                            <div className="font-semibold text-gray-800">{a.nome} {a.cognome}</div>
                            <div className="text-xs text-gray-400">{a.email}</div>
                          </td>
                          <td className="py-3.5 pr-4 max-w-[180px]">
                            <div className="truncate text-gray-700">{a.progetto}</div>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className="text-lg font-bold text-indigo-700">{(a.importoCentesimi / 100).toFixed(2).replace(".", ",")}€</span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${a.stato === "pagato" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                              {a.stato === "pagato" ? "✓ Pagato" : "⏳ In attesa"}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-xs text-gray-400">
                            {new Date(a.createdAt).toLocaleDateString("it-IT")}
                          </td>
                          <td className="py-3.5">
                            <button onClick={() => setAccontoAperto(a)}
                              className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold">
                              Dettagli →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modale dettaglio acconto */}
            {accontoAperto && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAccontoAperto(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Dettaglio acconto</h3>
                      <span className="text-xs font-mono text-gray-400">#{accontoAperto.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <button onClick={() => setAccontoAperto(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">&times;</button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <Row label="Stato">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${accontoAperto.stato === "pagato" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {accontoAperto.stato === "pagato" ? "✓ Pagato" : "⏳ In attesa"}
                      </span>
                    </Row>
                    <Row label="Importo"><span className="text-xl font-bold text-indigo-700">{(accontoAperto.importoCentesimi / 100).toFixed(2).replace(".", ",")}€</span></Row>
                    <Row label="Progetto"><span className="text-gray-700">{accontoAperto.progetto}</span></Row>
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dati cliente</div>
                      <Row label="Nome">{accontoAperto.nome} {accontoAperto.cognome}</Row>
                      <Row label="Email"><a href={`mailto:${accontoAperto.email}`} className="text-indigo-600 underline">{accontoAperto.email}</a></Row>
                      <Row label="Telefono"><a href={`tel:${accontoAperto.telefono}`} className="text-indigo-600 underline">{accontoAperto.telefono}</a></Row>
                      <Row label="Indirizzo">{accontoAperto.indirizzo}, {accontoAperto.cap} {accontoAperto.citta}{accontoAperto.provincia ? ` (${accontoAperto.provincia})` : ""}</Row>
                      {accontoAperto.codiceFiscale && <Row label="Cod. Fiscale">{accontoAperto.codiceFiscale}</Row>}
                    </div>
                    {accontoAperto.tipo === "azienda" && (
                      <div className="border-t border-gray-100 pt-3">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dati azienda</div>
                        {accontoAperto.ragioneSociale && <Row label="Ragione Sociale">{accontoAperto.ragioneSociale}</Row>}
                        {accontoAperto.piva && <Row label="P.IVA">{accontoAperto.piva}</Row>}
                        {accontoAperto.sdi && <Row label="SDI">{accontoAperto.sdi}</Row>}
                        {accontoAperto.pec && <Row label="PEC">{accontoAperto.pec}</Row>}
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-3">
                      <Row label="Stripe PI">{accontoAperto.stripePaymentIntentId ? <span className="font-mono text-xs text-gray-500">{accontoAperto.stripePaymentIntentId}</span> : "—"}</Row>
                      <Row label="Creato il">{new Date(accontoAperto.createdAt).toLocaleString("it-IT")}</Row>
                      {accontoAperto.paidAt && <Row label="Pagato il">{new Date(accontoAperto.paidAt).toLocaleString("it-IT")}</Row>}
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <a href={`mailto:${accontoAperto.email}?subject=Acconto progetto: ${encodeURIComponent(accontoAperto.progetto)}`}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold text-center hover:bg-indigo-700 transition">
                      <i className="fas fa-envelope mr-2"></i>Scrivi email
                    </a>
                    <a href={`https://wa.me/${accontoAperto.telefono.replace(/\D/g, "")}?text=Ciao%20${accontoAperto.nome}%2C%20riguardo%20al%20progetto%20${encodeURIComponent(accontoAperto.progetto)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold text-center hover:bg-green-600 transition">
                      <i className="fab fa-whatsapp mr-2"></i>WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* =================== TAB SCONTI =================== */}
        {tab === "sconti" && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-indigo-600">{codici.length}</p>
                <p className="text-sm text-gray-500 mt-1">Codici totali</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-green-600">{codici.filter((c) => c.active).length}</p>
                <p className="text-sm text-gray-500 mt-1">Codici attivi</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow text-center">
                <p className="text-3xl font-bold text-orange-500">{codici.reduce((a, c) => a + c.usedCount, 0)}</p>
                <p className="text-sm text-gray-500 mt-1">Utilizzi totali</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Crea nuovo codice</h2>
                <form onSubmit={creaCodice} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Codice *</label>
                    <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="es. ESTATE30"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 uppercase" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Descrizione (opzionale)</label>
                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="es. Promo estate 2025"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Sconto % *</label>
                      <input type="number" min={1} max={100} value={form.discountPercent}
                        onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Max utilizzi</label>
                      <input type="number" min={1} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                        placeholder="∞ illimitati"
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Scadenza (opzionale)</label>
                    <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  {formError && <p className="text-red-500 text-sm">{formError}</p>}
                  {formSuccess && <p className="text-green-600 text-sm">{formSuccess}</p>}
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm">
                    + Crea codice sconto
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Codici esistenti</h2>
                  <button onClick={caricaCodici} className="text-sm text-indigo-600 hover:underline">Aggiorna</button>
                </div>
                {loadingCodici ? (
                  <p className="text-gray-400 text-sm text-center py-8">Caricamento...</p>
                ) : codici.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nessun codice creato</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {codici.map((c) => (
                      <div key={c.id} className={`rounded-xl border p-4 ${c.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-gray-800 text-sm">{c.code}</span>
                          <span className="text-lg font-bold text-indigo-600">{c.discountPercent}%</span>
                        </div>
                        {c.description && <p className="text-xs text-gray-500 mb-2">{c.description}</p>}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            Usi: {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}
                            {c.expiresAt && ` · Scade: ${new Date(c.expiresAt).toLocaleDateString("it-IT")}`}
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => toggleAttivo(c.id, !c.active)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.active ? "bg-green-200 text-green-700 hover:bg-red-100 hover:text-red-600" : "bg-gray-200 text-gray-500 hover:bg-green-100 hover:text-green-600"}`}>
                              {c.active ? "Attivo" : "Disattivo"}
                            </button>
                            <button onClick={() => eliminaCodice(c.id, c.code)} className="text-red-400 hover:text-red-600 px-1">🗑</button>
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-gray-800 font-medium text-right">{children}</span>
    </div>
  );
}
