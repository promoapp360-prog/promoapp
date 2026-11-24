import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import type {
  AdminContact,
  AdminFinanceData,
  AdminOverview,
  AdminReview,
  AdminSession,
  AdminSiteControlRequest,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
  SiteControlRequestStatus,
} from "@workspace/api-client-react";
import { adminApi, AdminApiError, clearAdminSession } from "../lib/admin-api";
import { appPath } from "../lib/marketing";
import AdminOverviewPanel from "../components/admin/AdminOverviewPanel";
import AdminContactsPanel from "../components/admin/AdminContactsPanel";
import AdminReviewsPanel from "../components/admin/AdminReviewsPanel";
import AdminSiteControlsPanel from "../components/admin/AdminSiteControlsPanel";
import AdminFinancePanel from "../components/admin/AdminFinancePanel";

type AdminTab = "overview" | "contacts" | "reviews" | "visits" | "controls" | "finance";
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
export default function Admin({ initialTab = "overview" }: { initialTab?: AdminTab }) {
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<AdminOverview>();
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [siteControls, setSiteControls] = useState<AdminSiteControlRequest[]>([]);
  const [finance, setFinance] = useState<AdminFinanceData>();
  const [financeMonth, setFinanceMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [updated, setUpdated] = useState("");
  const requestId = useRef(0);

  function reset() {
    requestId.current++;
    clearAdminSession(); setAuthenticated(false); setPassword("");
    setOverview(undefined); setContacts([]); setReviews([]); setSiteControls([]); setFinance(undefined); setUpdated(""); setLoading(false);
  }
  function report(err: unknown) {
    if (err instanceof AdminApiError && err.status === 401) reset();
    setError(err instanceof AdminApiError ? err.message : "Impossibile caricare la risposta del server. Controlla la connessione e riprova.");
  }
  useEffect(() => {
    document.title = "Admin — PromoApp";
    let active = true;
    adminApi<AdminSession>("/session").then(() => { if (active) setAuthenticated(true); })
      .catch(err => { if (active && (!(err instanceof AdminApiError) || err.status !== 401)) report(err); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [summary, received, submitted, controls, financeData] = await Promise.all([
        adminApi<AdminOverview>(`/overview?days=${days}`),
        adminApi<AdminContact[]>("/contacts"), adminApi<AdminReview[]>("/reviews"),
        adminApi<AdminSiteControlRequest[]>("/controlli"),
        tab === "finance" ? adminApi<AdminFinanceData>(`/finance?month=${financeMonth}`) : Promise.resolve(undefined),
      ]);
      if (id !== requestId.current) return;
      setOverview(summary); setContacts(received); setReviews(submitted); setSiteControls(controls);
      if (financeData) setFinance(financeData);
      setError("");
      setUpdated(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) { if (id === requestId.current) report(err); }
    finally { if (id === requestId.current) setLoading(false); }
  }, [days, financeMonth, tab]);
  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => {
    if (!authenticated) return;
    void load();
    const interval = window.setInterval(() => { if (!document.hidden) void load(); }, 60000);
    const visible = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { requestId.current++; window.clearInterval(interval); document.removeEventListener("visibilitychange", visible); };
  }, [authenticated, load]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (loginBusy || !password.trim()) return;
    setLoginBusy(true); setError("");
    try {
      await adminApi<AdminSession>("/login", { method: "POST", body: JSON.stringify({ password: password.trim() }) });
      setPassword(""); setAuthenticated(true);
    } catch (err) { report(err); }
    finally { setLoginBusy(false); }
  }
  async function mutate(path: string, method: string, body?: unknown) {
    if (busy) return;
    setBusy(path); setError("");
    try {
      await adminApi(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      await load();
    } catch (err) { report(err); }
    finally { setBusy(""); }
  }
  async function mutateFinance(path: string, method: string, body?: unknown): Promise<boolean> {
    if (busy) return false;
    setBusy(path); setError("");
    try {
      await adminApi(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      await load();
      return true;
    } catch (err) {
      report(err);
      return false;
    } finally {
      setBusy("");
    }
  }
  async function logout() {
    if (busy) return;
    setBusy("logout");
    try { await adminApi("/logout", { method: "POST" }); reset(); setError(""); }
    catch (err) { report(err); }
    finally { setBusy(""); }
  }

  if (checking) return <main className="min-h-screen bg-slate-50 grid place-items-center"><h1 className="sr-only">Area riservata PromoApp</h1><p role="status">Verifica della sessione…</p></main>;
  if (!authenticated) return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-5 py-20" style={{ fontFamily: "Poppins, sans-serif" }}>
      <section className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-9 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">PromoApp · Area riservata</span>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">Il tuo pannello</h1>
        <p className="text-sm text-slate-500 mt-3 mb-7">Statistiche, recensioni, contatti e visite. Un unico accesso.</p>
        <form onSubmit={login} className="space-y-4">
          <input type="text" autoComplete="username" value="admin" readOnly className="sr-only" tabIndex={-1} aria-label="Utente admin" />
          <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700">Password amministratore</label>
          <input id="admin-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password" required disabled={loginBusy}
            className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="text-sm text-indigo-700 underline">
            {showPassword ? "Nascondi password" : "Mostra password"}
          </button>
          {error && <p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</p>}
          <button disabled={loginBusy} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-3 disabled:opacity-50">
            {loginBusy ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
        <p className="mt-5 text-xs text-slate-500">La sessione dura fino a 8 ore. La password non viene salvata nel browser.</p>
        <a href={appPath("/")} className="inline-block text-sm text-slate-500 mt-5 hover:underline">Torna al sito</a>
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-6 sm:px-8 sm:py-10" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-7">
          <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">PromoApp</p><h1 className="text-2xl sm:text-3xl font-bold mt-1">Pannello amministratore</h1></div>
          <div className="flex items-center gap-4 text-sm">
            <a href={appPath("/")} className="text-slate-500 hover:underline">Sito pubblico</a>
            <button disabled={!!busy} onClick={logout} className="bg-white border border-slate-200 rounded-xl px-4 py-2 disabled:opacity-50">Esci</button>
          </div>
        </header>
        <nav aria-label="Sezioni admin" className="flex flex-wrap gap-2 mb-6">
          {([["overview", "Statistiche"], ["contacts", "Contatti ricevuti"], ["reviews", "Recensioni"], ["visits", "Visite"], ["controls", "Controlli gratuiti"], ["finance", "Contabilità"]] as const).map(([value, label]) =>
            <button key={value} aria-current={tab === value ? "page" : undefined} onClick={() => {
              setTab(value);
              setLocation(value === "controls" ? "/admin/controlli" : value === "finance" ? "/admin?tab=finance" : "/admin");
            }}
              data-testid={`button-admin-tab-${value}`}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${tab === value ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{label}</button>)}
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-sm">
          <p className="text-slate-500">{updated ? `Ultimo aggiornamento alle ${updated}` : "Caricamento dei dati…"} · Aggiornamento automatico ogni minuto</p>
          <button onClick={() => void load()} disabled={loading || !!busy} className="text-indigo-700 font-semibold disabled:opacity-40">{loading ? "Aggiornamento…" : "Aggiorna"}</button>
        </div>
        {error && <p role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-5">{error}</p>}
        {loading && !overview && <p role="status" className="py-10 text-center text-slate-500">Caricamento del pannello…</p>}
        {overview && (tab === "overview" || tab === "visits") && <AdminOverviewPanel data={overview} days={days} onDays={setDays} visitsOnly={tab === "visits"} />}
        {tab === "contacts" && <AdminContactsPanel contacts={contacts} busy={!!busy} onState={(id, stato) => mutate(`/contacts/${encodeURIComponent(id)}`, "PATCH", { stato })} />}
        {tab === "reviews" && <AdminReviewsPanel reviews={reviews} busy={!!busy} onPublish={(id, verificata) => mutate(`/reviews/${encodeURIComponent(id)}`, "PATCH", { verificata })}
          onDelete={id => mutate(`/reviews/${encodeURIComponent(id)}`, "DELETE")} />}
        {tab === "controls" && <AdminSiteControlsPanel requests={siteControls} busy={!!busy}
          onStatus={(id, status: SiteControlRequestStatus) => mutate(`/controlli/${encodeURIComponent(id)}`, "PATCH", { status })} />}
        {tab === "finance" && <AdminFinancePanel
          data={finance}
          month={financeMonth}
          loading={loading}
          busy={!!busy}
          onMonth={setFinanceMonth}
          onCreateProject={(input: FinanceProjectInput) => mutateFinance("/finance/projects", "POST", input)}
          onUpdateProject={(id: string, input: FinanceProjectUpdate) => mutateFinance(`/finance/projects/${encodeURIComponent(id)}`, "PATCH", input)}
          onCreateEntry={(input: FinanceEntryInput) => mutateFinance("/finance/entries", "POST", input)}
          onUpdateEntry={(id: string, input: FinanceEntryUpdate) => mutateFinance(`/finance/entries/${encodeURIComponent(id)}`, "PATCH", input)}
          onMarkPaid={(id: string) => mutateFinance(`/finance/entries/${encodeURIComponent(id)}/paid`, "POST")}
          onDeleteEntry={(id: string) => mutateFinance(`/finance/entries/${encodeURIComponent(id)}`, "DELETE")}
        />}
      </div>
    </main>
  );
}
