import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AdminFinanceSupplier, AdminFinanceEntry, FinanceSupplierInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { cash, fieldClass, money } from "./finance-ui";

const categories = {
  advertising: "Pubblicità", hosting: "Hosting", software: "Software",
  domains: "Domini", professional: "Professionisti", administration: "Amministrazione",
  equipment: "Attrezzature", other: "Altro",
} as const;
const schema = z.object({
  name: z.string().trim().min(1, "Inserisci il nome.").max(160),
  category: z.enum(["advertising", "hosting", "software", "domains", "professional", "administration", "equipment", "other"]),
  email: z.string().email("Email non valida.").or(z.literal("")),
  website: z.string().max(2048),
  notes: z.string().max(4000),
});
type Values = z.infer<typeof schema>;
const suggestions: FinanceSupplierInput[] = [
  { name: "Meta", category: "advertising" },
  { name: "Google", category: "advertising" },
  { name: "Replit", category: "software" },
];

export default function FinanceSuppliers({ suppliers, entries, onRefresh }: {
  suppliers: AdminFinanceSupplier[]; entries: AdminFinanceEntry[]; onRefresh: () => Promise<void>;
}) {
  const [editor, setEditor] = useState<AdminFinanceSupplier | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", category: "other", email: "", website: "", notes: "" },
  });
  const open = (supplier: AdminFinanceSupplier | "new") => {
    form.reset(supplier === "new" ? { name: "", category: "other", email: "", website: "", notes: "" }
      : { ...supplier, email: supplier.email ?? "", website: supplier.website ?? "" });
    setEditor(supplier); setError("");
  };
  const act = async (work: () => Promise<unknown>) => {
    setBusy(true); setError(""); setNotice("");
    try { await work(); await onRefresh(); setNotice("Fornitore salvato."); return true; }
    catch (err) { setError(err instanceof Error ? err.message : "Salvataggio non riuscito."); return false; }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 rounded-2xl border bg-white p-5" aria-label="Anagrafica fornitori">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-bold">Anagrafica fornitori</h3><p className="mt-1 text-xs text-slate-500">Associa ogni spesa al fornitore. Nessun collegamento agli account o addebito automatico.</p></div>
      <Button disabled={busy} onClick={() => open("new")} data-testid="button-new-finance-supplier">Nuovo fornitore</Button>
    </div>
    <div className="flex flex-wrap gap-2">{suggestions.filter(s => !suppliers.some(p => p.name.toLowerCase() === s.name.toLowerCase())).map(s =>
      <Button key={s.name} size="sm" variant="outline" disabled={busy} data-testid={`button-add-supplier-${s.name.toLowerCase()}`} onClick={() => void act(() => adminApi("/finance/suppliers", { method: "POST", body: JSON.stringify(s) }))}>Aggiungi {s.name}</Button>
    )}</div>
    {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {editor && <Form {...form}><form className="grid gap-4 rounded-xl bg-indigo-50/50 p-4 sm:grid-cols-2" data-testid="form-finance-supplier" onSubmit={form.handleSubmit(async values => {
      const input = { ...values, email: values.email.trim() || null, website: values.website.trim() || null };
      const id = editor === "new" ? null : editor.id;
      if (await act(() => adminApi(`/finance/suppliers${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: JSON.stringify(input) }))) setEditor(null);
    })}>
      {(["name", "email", "website", "notes"] as const).map(name => <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem>
        <FormLabel>{{ name: "Nome fornitore", email: "Email facoltativa", website: "Sito web facoltativo", notes: "Note" }[name]}</FormLabel>
        <FormControl><Input {...field} data-testid={`input-supplier-${name}`} /></FormControl><FormMessage />
      </FormItem>} />)}
      <FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Categoria</FormLabel><FormControl><select {...field} className={fieldClass} data-testid="select-supplier-category">{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></FormControl><FormMessage /></FormItem>} />
      <div className="flex items-end gap-2"><Button disabled={busy} data-testid="button-save-finance-supplier">Salva fornitore</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setEditor(null)}>Annulla</Button></div>
    </form></Form>}
    {!suppliers.length && <p className="text-sm text-slate-500">Nessun fornitore. Aggiungi Meta, Google, Replit o un altro fornitore.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{suppliers.map(s => {
      const related = entries.filter(e => e.direction === "expense" && e.details?.supplierId === s.id && !e.details?.cancelled);
      return <article key={s.id} className="space-y-2 rounded-xl border p-4" data-testid={`card-finance-supplier-${s.id}`}>
        <h4 className="font-bold">{s.name} {!s.active && <span className="text-xs font-normal text-slate-500">Archiviato</span>}</h4>
        <p className="text-xs text-slate-500">{categories[s.category]}{s.email ? ` · ${s.email}` : ""}</p>
        {s.notes && <p className="whitespace-pre-wrap text-xs text-slate-500">{s.notes}</p>}
        <p className="text-sm">Pagato: <strong>{money(related.filter(cash).reduce((sum, e) => sum + e.amountCents, 0))}</strong> · Da pagare: <strong>{money(related.filter(e => !e.paidAt && e.details?.amountConfirmed).reduce((sum, e) => sum + e.amountCents, 0))}</strong></p>
        <div className="flex gap-3"><button type="button" disabled={busy} className="text-xs font-semibold text-indigo-700" onClick={() => open(s)} data-testid={`button-edit-supplier-${s.id}`}>Modifica</button>
          <button type="button" disabled={busy} className="text-xs text-slate-600" data-testid={`button-archive-supplier-${s.id}`} onClick={() => void act(() => adminApi(`/finance/suppliers/${s.id}`, { method: "PATCH", body: JSON.stringify({ active: !s.active }) }))}>{s.active ? "Archivia" : "Riattiva"}</button></div>
      </article>;
    })}</div>
  </section>;
}
