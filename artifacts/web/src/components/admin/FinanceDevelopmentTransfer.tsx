import { useState } from "react";
import type {
  FinanceDevelopmentTransferInput,
  FinanceDevelopmentTransferResult,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin-api";

function isTransferFile(value: unknown): value is FinanceDevelopmentTransferInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<FinanceDevelopmentTransferInput>;
  return input.transferId === "promoapp-dev-finance-2026-11" &&
    input.sourceEnvironment === "development" &&
    Array.isArray(input.clients) && Array.isArray(input.projects) &&
    Array.isArray(input.recurring) && Array.isArray(input.suppliers);
}

export default function FinanceDevelopmentTransfer({ onComplete }: { onComplete: () => Promise<unknown> }) {
  const [data, setData] = useState<FinanceDevelopmentTransferInput>();
  const [result, setResult] = useState<FinanceDevelopmentTransferResult>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function selectFile(file?: File) {
    setData(undefined);
    setResult(undefined);
    setError("");
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Il file supera il limite di 2 MB.");
      const parsed: unknown = JSON.parse(await file.text());
      if (!isTransferFile(parsed)) throw new Error("Questo non è il file di trasferimento contabile previsto.");
      setData(parsed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossibile leggere il file.");
    }
  }

  async function transfer() {
    if (!data || busy) return;
    const confirmed = window.confirm(
      `Trasferire nel database di questo sito ${data.clients.length} clienti, ${data.projects.length} lavori, ${data.recurring.length} canoni e ${data.suppliers.length} fornitori? L’operazione è consentita solo se il controllo economico è ancora vuoto. Nessun pagamento sarà inventato.`,
    );
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      const saved = await adminApi<FinanceDevelopmentTransferResult>("/finance/development-transfer", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setResult(saved);
      setData(undefined);
      await onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Trasferimento non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4" aria-label="Trasferimento contabilità sviluppo">
      <h4 className="font-semibold">Carica la contabilità di sviluppo</h4>
      <p className="my-2 text-xs text-slate-600">
        Usa il file fornito in chat dopo aver pubblicato questa versione e aver aperto il sito pubblicato come amministratore.
        Il trasferimento si attiva solo se qui non esistono già dati contabili.
      </p>
      <input
        type="file"
        accept=".json,application/json"
        disabled={busy}
        aria-label="Seleziona file di trasferimento contabile"
        className="max-w-full text-xs"
        onChange={event => {
          void selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        data-testid="input-finance-development-transfer"
      />
      {data && (
        <div className="mt-3 rounded-lg bg-white p-3 text-sm" data-testid="preview-finance-development-transfer">
          <p><strong>Anteprima file:</strong> {data.clients.length} clienti · {data.projects.length} lavori · {data.recurring.length} canoni · {data.suppliers.length} fornitori.</p>
          <p className="mt-1 text-xs text-slate-500">Incassi riconciliati nel file: 0. Le somme comunicate restano note dei lavori, non transazioni.</p>
          <Button size="sm" className="mt-3" disabled={busy} onClick={() => void transfer()} data-testid="button-import-finance-development-transfer">
            {busy ? "Trasferimento…" : "Trasferisci in questo gestionale"}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
      {result && (
        <p role="status" className="mt-2 text-sm text-emerald-800" data-testid="status-finance-development-transfer">
          Trasferiti: {result.imported.clients} clienti, {result.imported.projects} lavori, {result.imported.recurring} canoni e {result.imported.suppliers} fornitori. Movimenti incasso/spesa: {result.entries}.
        </p>
      )}
    </section>
  );
}
