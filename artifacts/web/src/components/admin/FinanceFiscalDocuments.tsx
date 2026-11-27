import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminFinanceClient,
  AdminFinanceProject,
  FinanceFiscalDocument,
  FinanceFiscalDocumentInput,
  FinanceFiscalDocumentsResponse,
  FinanceLedgerData,
  FinanceSettings,
  FinanceSettingsInput,
  FinanceTaxRegime,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { appPath } from "@/lib/marketing";
import { FinanceField } from "./FinanceDetailsFields";
import { fieldClass, money } from "./finance-ui";

type FiscalView = "documents" | "settings";
const todayRome = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};
const displayDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};
const emptyDocument = (clientId = ""): FinanceFiscalDocumentInput => ({
  clientId, projectId: null, obligationId: null, issuedOn: todayRome(), dueDate: null,
  description: "", grossAmountCents: 0, notes: "",
});
const regimeTypeFor = (value: FinanceTaxRegime["regimeType"]): FinanceTaxRegime["documentType"] =>
  value === "vat" ? "invoice" : "receipt";

export default function FinanceFiscalDocuments({
  mode, clients, projects, onRefresh,
}: {
  mode: FiscalView;
  clients: AdminFinanceClient[];
  projects: AdminFinanceProject[];
  onRefresh: () => Promise<unknown>;
}) {
  const [settings, setSettings] = useState<FinanceSettings>();
  const [settingsDraft, setSettingsDraft] = useState<FinanceSettingsInput>();
  const [documents, setDocuments] = useState<FinanceFiscalDocument[]>([]);
  const [ledger, setLedger] = useState<FinanceLedgerData>();
  const [draft, setDraft] = useState<FinanceFiscalDocumentInput>(() => emptyDocument());
  const [voiding, setVoiding] = useState<{ id: string; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const month = todayRome().slice(0, 7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSettings, nextDocuments, nextLedger] = await Promise.all([
        adminApi<FinanceSettings>("/finance/settings"),
        adminApi<FinanceFiscalDocumentsResponse>("/finance/fiscal-documents"),
        adminApi<FinanceLedgerData>(`/finance/ledger?month=${month}`),
      ]);
      setSettings(nextSettings);
      setSettingsDraft({
        issuer: { ...nextSettings.issuer },
        prefixes: { ...nextSettings.prefixes },
        regimes: nextSettings.regimes.map((item) => ({ ...item })),
      });
      setDocuments(nextDocuments.documents);
      setLedger(nextLedger);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Non è stato possibile caricare i documenti fiscali.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { void load(); }, [load]);

  const activeRegime = useMemo(
    () => settings?.regimes.find((item) => item.effectiveFrom <= draft.issuedOn &&
      (!item.effectiveUntil || item.effectiveUntil >= draft.issuedOn)),
    [settings?.regimes, draft.issuedOn],
  );
  const eligibleObligations = useMemo(
    () => (ledger?.obligations ?? []).filter((item) => item.direction === "income" &&
      (!draft.clientId || item.clientId === draft.clientId)),
    [ledger?.obligations, draft.clientId],
  );
  const documentTotals = useMemo(() => {
    const active = documents.filter((item) => item.status !== "void");
    return {
      withholding: active.reduce((sum, item) => sum + item.withholdingAmountCents, 0),
      vat: active.reduce((sum, item) => sum + item.vatAmountCents, 0),
      net: active.reduce((sum, item) => sum + item.netAmountCents, 0),
    };
  }, [documents]);
  const issuerReady = Boolean(settings?.issuer.taxId && settings.issuer.address &&
    settings.issuer.postalCode && settings.issuer.city);
  const clientReady = clients.some((client) => client.id === draft.clientId && client.taxId && client.address);

  const act = async (work: () => Promise<unknown>, success: string) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await work();
      setNotice(success);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async (document: FinanceFiscalDocument) => {
    const response = await fetch(appPath(`/api/admin/finance/fiscal-documents/${document.id}/pdf`), {
      credentials: "same-origin", cache: "no-store",
    });
    if (!response.ok) throw new Error("PDF non disponibile. Verifica la sessione e riprova.");
    const url = URL.createObjectURL(await response.blob());
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `promoapp-${document.number}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settingsDraft) return;
    const saved = await act(async () => {
      const next = await adminApi<FinanceSettings>("/finance/settings", {
        method: "PUT", body: JSON.stringify(settingsDraft),
      });
      setSettings(next);
      setSettingsDraft({
        issuer: { ...next.issuer }, prefixes: { ...next.prefixes },
        regimes: next.regimes.map((item) => ({ ...item })),
      });
    }, "Impostazioni fiscali salvate.");
    if (saved) await load();
  };

  const issue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.clientId || draft.grossAmountCents <= 0 || !draft.description.trim()) {
      setError("Seleziona il cliente e indica descrizione e importo.");
      return;
    }
    let created: FinanceFiscalDocument | undefined;
    const success = await act(async () => {
      created = await adminApi<FinanceFiscalDocument>("/finance/fiscal-documents", {
        method: "POST",
        body: JSON.stringify({ ...draft, description: draft.description.trim(), notes: draft.notes?.trim() ?? "" }),
      });
      setDraft(emptyDocument(draft.clientId));
      await load().catch(() => undefined);
      await onRefresh().catch(() => undefined);
    }, "Documento emesso e archiviato.");
    if (!success || !created) return;
    try {
      await downloadPdf(created);
      setNotice("Documento emesso, archiviato e scaricato.");
    } catch {
      setError("Il documento è stato emesso, ma il download automatico non è riuscito. Usa “Scarica PDF” nel registro.");
      setNotice("");
    }
  };

  const voidDocument = async () => {
    if (!voiding) return;
    const selected = documents.find((item) => item.id === voiding.id);
    if (!selected) return;
    const done = await act(async () => {
      await adminApi(`/finance/fiscal-documents/${voiding.id}/void`, {
        method: "POST", body: JSON.stringify({ reason: voiding.reason }),
      });
      setVoiding(null);
      await load().catch(() => undefined);
      await onRefresh().catch(() => undefined);
    }, "Documento annullato; il numero resta nello storico.");
    if (!done) return;
  };

  const updateRegime = (id: string, patch: Partial<FinanceTaxRegime>) => {
    setSettingsDraft((current) => current ? ({
      ...current,
      regimes: current.regimes.map((item) => item.id === id
        ? { ...item, ...patch, documentType: regimeTypeFor((patch.regimeType ?? item.regimeType) as FinanceTaxRegime["regimeType"]) }
        : item),
    }) : current);
  };
  const setDocument = (patch: Partial<FinanceFiscalDocumentInput>) =>
    setDraft((current) => ({ ...current, ...patch }));

  if (loading && !settings) {
    return <section className="rounded-2xl border bg-white p-6 text-sm text-slate-500">Caricamento dati fiscali…</section>;
  }

  if (mode === "settings") {
    return <section className="space-y-5" aria-label="Impostazioni fiscali PromoApp">
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {settingsDraft && <form onSubmit={saveSettings} className="space-y-5">
        <section className="rounded-2xl border bg-white p-5">
          <h3 className="font-bold">Intestazione dei documenti</h3>
          <p className="mb-4 mt-1 text-xs text-slate-500">I PDF mostrano il marchio PromoApp e i dati qui sotto, senza nomi di persone nell’intestazione.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["taxId", "Codice fiscale / P. IVA"],
              ["address", "Indirizzo"],
              ["postalCode", "CAP"],
              ["city", "Comune"],
              ["province", "Provincia"],
              ["email", "Email"],
              ["pec", "PEC"],
              ["sdiCode", "Codice destinatario"],
            ] as const).map(([key, label]) => (
              <FinanceField key={key} label={label}>
                <Input maxLength={key === "address" ? 240 : 254}
                  value={settingsDraft.issuer[key]}
                  onChange={(event) => setSettingsDraft((current) => current ? ({
                    ...current, issuer: { ...current.issuer, [key]: event.target.value },
                  }) : current)} />
              </FinanceField>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h3 className="font-bold">Numerazioni separate per anno</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FinanceField label="Prefisso ricevute">
              <Input value={settingsDraft.prefixes.receipt} maxLength={24}
                onChange={(event) => setSettingsDraft((current) => current ? ({
                  ...current, prefixes: { ...current.prefixes, receipt: event.target.value.toUpperCase() },
                }) : current)} />
            </FinanceField>
            <FinanceField label="Prefisso fatture">
              <Input value={settingsDraft.prefixes.invoice} maxLength={24}
                onChange={(event) => setSettingsDraft((current) => current ? ({
                  ...current, prefixes: { ...current.prefixes, invoice: event.target.value.toUpperCase() },
                }) : current)} />
            </FinanceField>
          </div>
        </section>
        <section className="space-y-3 rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-bold">Regimi fiscali per data</h3>
              <p className="mt-1 text-xs text-slate-500">Le percentuali iniziali seguono il brief e sono modificabili. Verifica il regime e le aliquote con il commercialista.</p></div>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => {
              const id = globalThis.crypto?.randomUUID?.() ?? `regime-${Date.now()}`;
              setSettingsDraft((current) => current ? ({ ...current, regimes: [...current.regimes, {
                id, name: "Nuovo regime", regimeType: "vat", documentType: "invoice",
                effectiveFrom: "2028-01-01", effectiveUntil: null, vatRateBps: 2200,
                withholdingRateBps: null, notes: "",
              }] }) : current);
            }}>Aggiungi periodo</Button>
          </div>
          {settingsDraft.regimes.map((regime) => <article key={regime.id} className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <FinanceField label="Nome del regime">
              <Input value={regime.name} maxLength={120} onChange={(event) => updateRegime(regime.id, { name: event.target.value })} />
            </FinanceField>
            <FinanceField label="Tipo di documento">
              <select className={fieldClass} value={regime.regimeType} onChange={(event) =>
                updateRegime(regime.id, event.target.value === "vat"
                  ? { regimeType: "vat", vatRateBps: 2200, withholdingRateBps: null }
                  : { regimeType: "withholding", vatRateBps: null, withholdingRateBps: 2000 })}>
                <option value="withholding">Ricevuta con ritenuta</option><option value="vat">Fattura con IVA</option>
              </select>
            </FinanceField>
            <FinanceField label="Inizio periodo">
              <Input type="date" value={regime.effectiveFrom} onChange={(event) => updateRegime(regime.id, { effectiveFrom: event.target.value })} />
            </FinanceField>
            <FinanceField label="Fine periodo (facoltativa)">
              <Input type="date" value={regime.effectiveUntil ?? ""} onChange={(event) => updateRegime(regime.id, { effectiveUntil: event.target.value || null })} />
            </FinanceField>
            {regime.regimeType === "vat" ? <FinanceField label="Aliquota IVA (%)">
              <Input type="number" min="0" max="100" step=".01" value={(regime.vatRateBps ?? 0) / 100}
                onChange={(event) => updateRegime(regime.id, { vatRateBps: Math.round(Number(event.target.value || 0) * 100) })} />
            </FinanceField> : <FinanceField label="Ritenuta d’acconto (%)">
              <Input type="number" min="0" max="100" step=".01" value={(regime.withholdingRateBps ?? 0) / 100}
                onChange={(event) => updateRegime(regime.id, { withholdingRateBps: Math.round(Number(event.target.value || 0) * 100) })} />
            </FinanceField>}
            <FinanceField label="Nota">
              <Input value={regime.notes} maxLength={1000} onChange={(event) => updateRegime(regime.id, { notes: event.target.value })} />
            </FinanceField>
            <div className="flex items-end">
              <Button type="button" variant="outline" disabled={busy || settingsDraft.regimes.length <= 1}
                onClick={() => setSettingsDraft((current) => current ? ({
                  ...current, regimes: current.regimes.filter((item) => item.id !== regime.id),
                }) : current)}>Rimuovi periodo</Button>
            </div>
          </article>)}
        </section>
        <div className="flex flex-wrap gap-2"><Button disabled={busy}>Salva impostazioni</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void load()}>Ricarica</Button></div>
      </form>}
    </section>;
  }

  return <section className="space-y-5" aria-label="Documenti fiscali">
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">Ritenute registrate a credito</p><strong className="mt-1 block text-lg">{money(documentTotals.withholding)}</strong></div>
      <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">IVA nei documenti attivi</p><strong className="mt-1 block text-lg">{money(documentTotals.vat)}</strong></div>
      <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">Netto documenti attivi, non necessariamente incassato</p><strong className="mt-1 block text-lg">{money(documentTotals.net)}</strong></div>
    </div>
    <section className="rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-bold">Nuovo documento fiscale</h3>
          <p className="mt-1 text-xs text-slate-500">{activeRegime
            ? `${activeRegime.name} · ${activeRegime.documentType === "receipt" ? "ricevuta" : "fattura"}`
            : "Nessun regime configurato per la data scelta."}</p></div>
        {!issuerReady && <p className="max-w-xl rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Prima di emettere un documento, completa l’intestazione PromoApp in Impostazioni fiscali.</p>}
      </div>
      {activeRegime?.documentType === "invoice" && <p className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900">Le fatture vengono archiviate in PDF e non sono inviate allo SdI.</p>}
      <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={issue}>
        <FinanceField label="Cliente">
          <select className={fieldClass} value={draft.clientId} onChange={(event) =>
            setDocument({ clientId: event.target.value, projectId: null, obligationId: null })} required>
            <option value="">Seleziona cliente</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.companyName || client.name}</option>)}
          </select>
        </FinanceField>
        <FinanceField label="Lavoro collegato (facoltativo)">
          <select className={fieldClass} value={draft.projectId ?? ""} onChange={(event) =>
            setDocument({ projectId: event.target.value || null, obligationId: null })}>
            <option value="">Nessun lavoro</option>
            {projects.filter((project) => !draft.clientId || project.clientId === draft.clientId)
              .map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </FinanceField>
        <FinanceField label="Scadenza da collegare (facoltativa)">
          <select className={fieldClass} value={draft.obligationId ?? ""} onChange={(event) => {
            const obligation = eligibleObligations.find((item) => item.id === event.target.value);
            setDocument({
              obligationId: obligation?.id ?? null,
              clientId: obligation?.clientId ?? draft.clientId,
              projectId: obligation?.projectId ?? draft.projectId,
              grossAmountCents: obligation?.amountCents ?? draft.grossAmountCents,
              dueDate: obligation?.dueDate ?? null,
            });
          }}>
            <option value="">Nessuna: solo archivio fiscale</option>
            {eligibleObligations.filter((item) => !draft.projectId || item.projectId === draft.projectId)
              .map((item) => <option key={item.id} value={item.id}>
                {item.projectName || item.description} · lordo {money(item.amountCents)} · incassato {money(item.allocatedCents)} · residuo {money(item.remainingCents)} · {item.dueDate ? displayDate(item.dueDate) : "senza data"}
              </option>)}
          </select>
        </FinanceField>
        <FinanceField label="Data documento">
          <Input type="date" required max={todayRome()} value={draft.issuedOn}
            onChange={(event) => setDocument({ issuedOn: event.target.value })} />
        </FinanceField>
        <FinanceField label="Scadenza pagamento (facoltativa)">
          <Input type="date" min={draft.issuedOn} value={draft.dueDate ?? ""}
            onChange={(event) => setDocument({ dueDate: event.target.value || null })} />
        </FinanceField>
        <FinanceField label="Importo lordo / imponibile (€)">
          <Input type="number" required min=".01" max="21474836.47" step=".01"
            disabled={Boolean(draft.obligationId)}
            value={draft.grossAmountCents ? draft.grossAmountCents / 100 : ""}
            onChange={(event) => setDocument({ grossAmountCents: Math.round(Number(event.target.value || 0) * 100) })} />
        </FinanceField>
        <FinanceField label="Descrizione">
          <Input required maxLength={500} value={draft.description}
            onChange={(event) => setDocument({ description: event.target.value })} />
        </FinanceField>
        <FinanceField label="Note interne">
          <Input maxLength={2000} value={draft.notes ?? ""}
            onChange={(event) => setDocument({ notes: event.target.value })} />
        </FinanceField>
        {activeRegime && <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p>Lordo / imponibile: <strong>{money(draft.grossAmountCents)}</strong></p>
          {activeRegime.documentType === "receipt" && <>
            <p>Ritenuta ({((activeRegime.withholdingRateBps ?? 0) / 100).toLocaleString("it-IT")}%)</p>
            <p>Netto da corrispondere: <strong>{money(draft.grossAmountCents - Math.round(draft.grossAmountCents * (activeRegime.withholdingRateBps ?? 0) / 10000))}</strong></p>
          </>}
          {activeRegime.documentType === "invoice" && <>
            <p>IVA ({((activeRegime.vatRateBps ?? 0) / 100).toLocaleString("it-IT")}%)</p>
            <p>Totale documento: <strong>{money(draft.grossAmountCents + Math.round(draft.grossAmountCents * (activeRegime.vatRateBps ?? 0) / 10000))}</strong></p>
          </>}
        </div>}
        {draft.obligationId && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2 lg:col-span-3">
          Collegando una scadenza, il suo importo viene aggiornato al netto dovuto o al totale IVA. Gli incassi parziali già registrati restano validi se non superano il netto del documento.
        </p>}
        {!draft.obligationId && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:col-span-2 lg:col-span-3">
          Senza scadenza collegata, il PDF viene archiviato ma non modifica il bilancio né registra un incasso.
        </p>}
        {!clientReady && draft.clientId && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2 lg:col-span-3">
          Completa codice fiscale / P. IVA e indirizzo del cliente nella sua anagrafica.
        </p>}
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <Button disabled={busy || loading || !activeRegime || !issuerReady || !clientReady ||
            !draft.clientId || draft.grossAmountCents <= 0 || !draft.description.trim()}>
            Emetti e scarica PDF
          </Button>
        </div>
      </form>
    </section>

    <section className="rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-bold">Registro documenti</h3><p className="mt-1 text-xs text-slate-500">{documents.length} documenti; il PDF resta privato.</p></div>
        <Button variant="outline" size="sm" disabled={busy || loading} onClick={() => void load()}>Aggiorna</Button>
      </div>
      {!documents.length ? <p className="mt-4 text-sm text-slate-500">Nessun documento fiscale emesso.</p> :
        <div className="mt-4 space-y-3">{documents.map((document) => <article key={document.id} className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{document.number} · {document.documentType === "receipt" ? "Ricevuta" : "Fattura"}</h4>
              <span className={`rounded-full px-2 py-1 text-xs ${document.status === "paid" ? "bg-emerald-50 text-emerald-700" : document.status === "void" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>
                {document.status === "paid" ? "Pagato" : document.status === "void" ? "Annullato" : "Emesso"}
              </span></div>
            <p className="mt-1 text-sm">{document.clientName}{document.projectName ? ` · ${document.projectName}` : ""}</p>
            <p className="text-xs text-slate-500">{displayDate(document.issuedOn)} · {document.description} · {document.regimeName}</p>
            <p className="mt-2 text-sm">Lordo / imponibile {money(document.grossAmountCents)}
              {document.vatAmountCents > 0 ? ` · IVA ${money(document.vatAmountCents)}` : ""}
              {document.withholdingAmountCents > 0 ? ` · Ritenuta ${money(document.withholdingAmountCents)}` : ""}
              {" · Netto "}
              <strong>{money(document.netAmountCents)}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void act(() => downloadPdf(document), "PDF scaricato.")}>Scarica PDF</Button>
            {document.status !== "void" && document.status !== "paid" && <Button variant="outline" size="sm"
              disabled={busy} onClick={() => setVoiding({ id: document.id, reason: "" })}>Annulla</Button>}
          </div>
          {voiding?.id === document.id && <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
            <FinanceField label="Motivo dell’annullamento">
              <Input value={voiding.reason} minLength={3} maxLength={500}
                onChange={(event) => setVoiding({ ...voiding, reason: event.target.value })} />
            </FinanceField>
            <Button variant="outline" disabled={busy || voiding.reason.trim().length < 3} onClick={() => void voidDocument()}>Conferma annullamento</Button>
            <Button variant="outline" disabled={busy} onClick={() => setVoiding(null)}>Annulla</Button>
          </div>}
        </article>)}</div>}
    </section>
  </section>;
}
