import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  AdminFinanceEntry,
  AdminFinanceProject,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const projectSchema = z.object({
  clientName: z.string().trim().min(1, "Inserisci il nome del cliente.").max(160),
  name: z.string().trim().min(1, "Inserisci il nome del lavoro.").max(160),
  totalAmountCents: z.number().int().min(0).max(2_147_483_647),
  notes: z.string().max(4000),
});
type ProjectFormValues = z.infer<typeof projectSchema>;

const entrySchema = z.object({
  projectId: z.string(),
  direction: z.enum(["income", "expense"]),
  category: z.enum(["deposit", "balance", "monthly_fee", "facebook", "replit", "other"]),
  description: z.string().trim().min(1, "Descrivi il movimento.").max(240),
  amountCents: z.number().int().min(1, "Inserisci un importo maggiore di zero.").max(2_147_483_647),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Seleziona una data valida."),
  paid: z.boolean(),
  repeatMonthly: z.boolean(),
}).superRefine((values, context) => {
  const incomeCategories = ["deposit", "balance", "monthly_fee", "other"];
  const expenseCategories = ["facebook", "replit", "other"];
  if (values.direction === "income" && !incomeCategories.includes(values.category)) {
    context.addIssue({ code: "custom", path: ["category"], message: "Scegli una voce di incasso." });
  }
  if (values.direction === "expense" && !expenseCategories.includes(values.category)) {
    context.addIssue({ code: "custom", path: ["category"], message: "Scegli una voce di spesa." });
  }
});
type EntryFormValues = z.infer<typeof entrySchema>;

const incomeCategories = [
  ["deposit", "Acconto"],
  ["balance", "Saldo"],
  ["monthly_fee", "Canone mensile"],
  ["other", "Altro incasso"],
] as const;
const expenseCategories = [
  ["facebook", "Facebook"],
  ["replit", "Replit"],
  ["other", "Altra spesa"],
] as const;

function todayForInput() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function dateInputValue(value: Date | string) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export function FinanceProjectForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial?: AdminFinanceProject;
  busy: boolean;
  onSave: (input: FinanceProjectInput | FinanceProjectUpdate, id?: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { clientName: "", name: "", totalAmountCents: 0, notes: "" },
  });
  const { reset } = form;

  useEffect(() => {
    reset(initial
      ? {
          clientName: initial.clientName,
          name: initial.name,
          totalAmountCents: initial.totalAmountCents,
          notes: initial.notes,
        }
      : { clientName: "", name: "", totalAmountCents: 0, notes: "" });
  }, [reset, initial?.id, initial?.clientName, initial?.name, initial?.totalAmountCents, initial?.notes]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const saved = await onSave({
            clientName: values.clientName,
            name: values.name,
            totalAmountCents: values.totalAmountCents,
            notes: values.notes,
          }, initial?.id);
          if (saved) onCancel();
        })}
        className="grid gap-4 sm:grid-cols-2"
        data-testid="form-finance-project"
      >
        <FormField control={form.control} name="clientName" render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <FormControl><Input {...field} autoComplete="organization" data-testid="input-finance-client" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Lavoro</FormLabel>
            <FormControl><Input {...field} placeholder="Es. Sito web" data-testid="input-finance-work" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="totalAmountCents" render={({ field }) => (
          <FormItem>
            <FormLabel>Importo concordato (€)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="21474836.47"
                step="0.01"
                value={Number(field.value ?? 0) / 100}
                onChange={(event) => field.onChange(Math.round(Number(event.target.value || 0) * 100))}
                data-testid="input-finance-total"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Note (facoltative)</FormLabel>
            <FormControl><textarea {...field} rows={2} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm" data-testid="input-finance-project-notes" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy} data-testid="button-save-finance-project">
            {busy ? "Salvataggio…" : initial ? "Salva modifiche" : "Aggiungi lavoro"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Annulla</Button>
        </div>
      </form>
    </Form>
  );
}

export function FinanceEntryForm({
  projects,
  initial,
  busy,
  onCreate,
  onUpdate,
  onCancel,
}: {
  projects: AdminFinanceProject[];
  initial?: AdminFinanceEntry;
  busy: boolean;
  onCreate: (input: FinanceEntryInput) => Promise<boolean>;
  onUpdate: (id: string, input: FinanceEntryUpdate) => Promise<boolean>;
  onCancel: () => void;
}) {
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      projectId: "",
      direction: "income",
      category: "deposit",
      description: "",
      amountCents: 0,
      dueDate: todayForInput(),
      paid: false,
      repeatMonthly: false,
    },
  });
  const { reset } = form;

  useEffect(() => {
    reset(initial
      ? {
          projectId: initial.projectId ?? "",
          direction: initial.direction,
          category: initial.category,
          description: initial.description,
          amountCents: initial.amountCents,
          dueDate: dateInputValue(initial.dueDate),
          paid: Boolean(initial.paidAt),
          repeatMonthly: initial.repeatMonthly,
        }
      : {
          projectId: "",
          direction: "income",
          category: "deposit",
          description: "",
          amountCents: 0,
          dueDate: todayForInput(),
          paid: false,
          repeatMonthly: false,
        });
  }, [reset, initial?.id, initial?.projectId, initial?.direction, initial?.category, initial?.description, initial?.amountCents, initial?.dueDate, initial?.paidAt, initial?.repeatMonthly]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const common = {
            category: values.category,
            description: values.description,
            amountCents: values.amountCents,
            dueDate: values.dueDate,
            repeatMonthly: values.repeatMonthly,
          };
          const saved = initial
            ? await onUpdate(initial.id, common)
            : await onCreate({
                ...common,
                projectId: values.projectId || null,
                direction: values.direction,
                paid: values.paid,
              });
          if (saved) onCancel();
        })}
        className="grid gap-4 sm:grid-cols-2"
        data-testid="form-finance-entry"
      >
        {!initial && (
          <>
            <FormField control={form.control} name="direction" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo movimento</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    onChange={(event) => {
                      const direction = event.target.value as EntryFormValues["direction"];
                      field.onChange(direction);
                      form.setValue("category", direction === "income" ? "deposit" : "facebook");
                    }}
                    data-testid="select-finance-direction"
                  >
                    <option value="income">Entrata</option>
                    <option value="expense">Spesa</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="projectId" render={({ field }) => (
              <FormItem>
                <FormLabel>Lavoro collegato (facoltativo)</FormLabel>
                <FormControl>
                  <select {...field} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" data-testid="select-finance-project">
                    <option value="">Spesa o incasso generale</option>
                    {projects.filter((project) => project.active).map((project) => (
                      <option key={project.id} value={project.id}>{project.clientName} · {project.name}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
        {initial && (
          <p className="text-sm text-slate-600 sm:col-span-2">
            {initial.direction === "income" ? "Entrata" : "Spesa"}
            {initial.projectName ? ` · ${initial.clientName}: ${initial.projectName}` : " · voce generale"}
          </p>
        )}
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Voce</FormLabel>
            <FormControl>
              <select {...field} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" data-testid="select-finance-category">
                {(form.watch("direction") === "income" ? incomeCategories : expenseCategories).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrizione</FormLabel>
            <FormControl><Input {...field} placeholder="Es. Acconto iniziale" data-testid="input-finance-description" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="amountCents" render={({ field }) => (
          <FormItem>
            <FormLabel>Importo (€)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0.01"
                max="21474836.47"
                step="0.01"
                value={Number(field.value ?? 0) / 100}
                onChange={(event) => field.onChange(Math.round(Number(event.target.value || 0) * 100))}
                data-testid="input-finance-amount"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="dueDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Data scadenza o pagamento</FormLabel>
            <FormControl><Input {...field} type="date" data-testid="input-finance-date" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {!initial && (
          <FormField control={form.control} name="paid" render={({ field }) => (
            <FormItem className="flex items-center gap-3 self-end rounded-xl border border-slate-200 p-3">
              <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} data-testid="checkbox-finance-paid" /></FormControl>
              <FormLabel className="!mt-0">{form.watch("direction") === "income" ? "Già incassato" : "Già pagata"}</FormLabel>
              <FormMessage />
            </FormItem>
          )} />
        )}
        <FormField control={form.control} name="repeatMonthly" render={({ field }) => (
          <FormItem className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 sm:col-span-2">
            <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} data-testid="checkbox-finance-monthly" /></FormControl>
            <div>
              <FormLabel className="!mt-0">Ripeti ogni mese</FormLabel>
              <p className="mt-1 text-xs text-slate-500">Crea automaticamente la prossima scadenza mensile dopo questa.</p>
              <FormMessage />
            </div>
          </FormItem>
        )} />
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy} data-testid="button-save-finance-entry">
            {busy ? "Salvataggio…" : initial ? "Salva modifiche" : "Aggiungi movimento"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Annulla</Button>
        </div>
      </form>
    </Form>
  );
}
