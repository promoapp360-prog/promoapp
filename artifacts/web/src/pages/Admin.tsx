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

export default function Admin() {
  const [password, setPassword] = useState("");
  const [autenticato, setAutenticato] = useState(false);
  const [authError, setAuthError] = useState("");
  const [codici, setCodici] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountPercent: 10,
    maxUses: "",
    expiresAt: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const caricaCodici = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/admin/codes`, {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const data = await res.json();
      setCodici(data);
    }
    setLoading(false);
  }, [password]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) { setAuthError("Inserisci la password"); return; }
    setAutenticato(true);
    setAuthError("");
  }

  useEffect(() => {
    if (autenticato) caricaCodici();
  }, [autenticato, caricaCodici]);

  async function creaCodice(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const res = await fetch(`${API_BASE}/api/admin/codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({
        code: form.code,
        description: form.description || undefined,
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
          <p className="text-gray-400 text-sm text-center mb-6">Pannello gestione codici sconto</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password admin"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
              Accedi
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pannello Admin</h1>
            <p className="text-gray-500 text-sm">Gestione codici sconto PromoApp</p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="text-sm text-indigo-600 hover:underline">← Sito</a>
            <button
              onClick={() => { setAutenticato(false); setPassword(""); }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Esci
            </button>
          </div>
        </div>

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
          {/* Form creazione */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Crea nuovo codice</h2>
            <form onSubmit={creaCodice} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Codice *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="es. ESTATE30"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrizione (opzionale)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="es. Promo estate 2025"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sconto % *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max utilizzi</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="∞ illimitati"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Scadenza (opzionale)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              {formSuccess && <p className="text-green-600 text-sm">{formSuccess}</p>}
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm">
                + Crea codice sconto
              </button>
            </form>
          </div>

          {/* Lista codici */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Codici esistenti</h2>
              <button onClick={caricaCodici} className="text-sm text-indigo-600 hover:underline">
                Aggiorna
              </button>
            </div>
            {loading ? (
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
                        <button
                          onClick={() => toggleAttivo(c.id, !c.active)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.active ? "bg-green-200 text-green-700 hover:bg-red-100 hover:text-red-600" : "bg-gray-200 text-gray-500 hover:bg-green-100 hover:text-green-600"}`}
                        >
                          {c.active ? "Attivo" : "Disattivo"}
                        </button>
                        <button
                          onClick={() => eliminaCodice(c.id, c.code)}
                          className="text-red-400 hover:text-red-600 px-1"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
