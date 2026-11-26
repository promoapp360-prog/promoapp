import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  AdminFinanceClient,
  AdminFinanceEntry,
  AdminFinanceProject,
  FinanceClientInput,
  FinanceClientUpdate,
  FinanceEntryInput,
  FinanceEntryUpdate,
  FinanceProjectInput,
  FinanceProjectUpdate,
  FinanceClientDetails, FinanceProjectDetails, FinanceEntryDetails, FinanceWorkspace,
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
import { ClientDetailsFields, ProjectDetailsFields, EntryDetailsFields } from "./FinanceDetailsFields";
import { categoryLabels } from "./finance-ui";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Inserisci il nome del cliente.").max(160),
  companyName: z.string().max(160),
  email: z.string().max(254).email("Inserisci un’email valida.").or(z.literal("")),
  phone: z.string().max(60),
  notes: z.string().max(4000),
});
type ClientFormValues = z.infer<typeof clientSchema>;

const projectSchema = z.object({
  clientId: z.string().uuid("Seleziona un cliente dall’anagrafica."),
  name: z.string().trim().min(1, "Inserisci il nome del lavoro.").max(160),
  totalAmountCents: z.number().int().min(0).max(2_147_483_647),
  paymentType: z.enum(["single", "advance", "installments"]),
  depositAmountCents: z.number().int().nullable(),
  installmentCount: z.number().int().nullable(),
  notes: z.string().max(4000),
}).superRefine((values, context) => {
  if (values.paymentType === "single" && (values.depositAmountCents !== null || values.installmentCount !== null)) {
    context.addIssue({ code: "custom", path: ["paymentType"], message: "Per la soluzione unica non servono altri dettagli." });
  }
  if (values.paymentType === "advance" && (
    values.depositAmountCents === null || values.depositAmountCents <= 0 ||
    values.depositAmountCents > values.totalAmountCents || values.installmentCount !== null
  )) {
    context.addIssue({ code: "custom", path: ["depositAmountCents"], message: "Inserisci un acconto positivo, non superiore al totale." });
  }
  if (values.paymentType === "installments" && (
    values.depositAmountCents !== null ||
    (values.installmentCount !== null && (values.installmentCount < 2 || values.installmentCount > 60))
  )) {
    context.addIssue({ code: "custom", path: ["installmentCount"], message: "Indica un numero di rate da 2 a 60 oppure lascia il campo vuoto." });
  }
});
type ProjectFormValues = z.infer<typeof projectSchema>;

const entrySchema = z.object({
  projectId: z.string(),
  direction: z.enum(["income", "expense"]),
  category: z.enum(["deposit", "balance", "installment", "monthly_fee", "facebook", "google", "replit", "canva", "hosting", "domains", "software", "administration", "accountant", "consulting", "equipment", "research", "other"]),
  description: z.string().trim().max(240),
  amountCents: z.number().int().min(1, "Inserisci un importo maggiore di zero.").max(2_147_483_647),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Seleziona una data valida."),
  paid: z.boolean(),
  repeatMonthly: z.boolean(),
}).superRefine((values, context) => {
  const incomeCategories = ["deposit", "balance", "monthly_fee", "other"];
  const expenseCategories = ["facebook", "google", "replit", "canva", "hosting", "domains", "software", "administration", "accountant", "consulting", "equipment", "research", "other"];
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
  ["installment", "Rata"],
  ["balance", "Saldo"],
  ["monthly_fee", "Canone mensile"],
  ["other", "Altro incasso"],
] as const;
const expenseCategories = [
  ...Object.entries(categoryLabels).filter(([key])=>!["deposit","balance","installment","monthly_fee"].includes(key)),
] as const;
const categoryDescriptions = categoryLabels;

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

export function FinanceClientForm({
  initial,
  busy,
  onCreate,
  onUpdate,
  onCancel,
  workspace,
}: {
  initial?: AdminFinanceClient;
  busy: boolean;
  onCreate: (input: FinanceClientInput) => Promise<boolean>;
  onUpdate: (id: string, input: FinanceClientUpdate) => Promise<boolean>;
  onCancel: () => void;
  workspace?: FinanceWorkspace;
}) {
  const [details,setDetails]=useState<FinanceClientDetails>(initial?.details??{});
  useEffect(()=>{setDetails(initial?.details??{});},[initial?.id,JSON.stringify(initial?.details)]);
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", companyName: "", email: "", phone: "", notes: "" },
  });
  const { reset } = form;

  useEffect(() => {
    reset(initial ? {
      name: initial.name,
      companyName: initial.companyName ?? "",
      email: initial.email ?? "",
      phone: initial.phone ?? "",
      notes: initial.notes,
    } : { name: "", companyName: "", email: "", phone: "", notes: "" });
  }, [reset, initial?.id, initial?.name, initial?.companyName, initial?.email, initial?.phone, initial?.notes]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const input = {
            name: values.name,
            companyName: values.companyName.trim() || null,
            email: values.email.trim() || null,
            phone: values.phone.trim() || null,
            notes: values.notes,
            details: {...details,aliases:details.aliases?.map(v=>v.trim()).filter(Boolean)},
          };
          const saved = initial
            ? await onUpdate(initial.id, input)
            : await onCreate(input);
          if (saved) onCancel();
        })}
        className="grid gap-4 sm:grid-cols-2"
        data-testid="form-finance-client"
      >
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome cliente / referente</FormLabel>
            <FormControl><Input {...field} autoComplete="name" data-testid="input-finance-client-name" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="companyName" render={({ field }) => (
          <FormItem>
            <FormLabel>Azienda (facoltativa)</FormLabel>
            <FormControl><Input {...field} autoComplete="organization" data-testid="input-finance-client-company" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email (facoltativa)</FormLabel>
            <FormControl><Input {...field} type="email" autoComplete="email" data-testid="input-finance-client-email" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Telefono (facoltativo)</FormLabel>
            <FormControl><Input {...field} type="tel" autoComplete="tel" data-testid="input-finance-client-phone" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Note (facoltative)</FormLabel>
            <FormControl><textarea {...field} rows={2} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm" data-testid="input-finance-client-notes" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <details className="sm:col-span-2">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Altri dati del cliente (facoltativi)</summary>
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <ClientDetailsFields value={details} onChange={setDetails} workspace={workspace}/>
          </div>
        </details>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy} data-testid="button-save-finance-client">
            {busy ? "Salvataggio…" : initial ? "Salva cliente" : "Aggiungi cliente"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel} data-testid="button-cancel-finance-client">Annulla</Button>
        </div>
      </form>
    </Form>
  );
}

export function FinanceProjectForm({
  clients,
  initial,
  busy,
  onSave,
  onCancel,
  workspace,
}: {
  clients: AdminFinanceClient[];
  initial?: AdminFinanceProject;
  busy: boolean;
  onSave: (input: FinanceProjectInput | FinanceProjectUpdate, id?: string) => Promise<boolean>;
  onCancel: () => void;
  workspace?: FinanceWorkspace;
}) {
  const [details,setDetails]=useState<FinanceProjectDetails>(initial?.details??{commercialState:"confirmed",agreementConfirmed:true,creditReview:false,confirmedDate:todayForInput()});
  useEffect(()=>{setDetails(initial?.details??{commercialState:"confirmed",agreementConfirmed:true,creditReview:false,confirmedDate:todayForInput()});},[initial?.id,JSON.stringify(initial?.details)]);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: "",
      name: "",
      totalAmountCents: 0,
      paymentType: "single",
      depositAmountCents: null,
      installmentCount: null,
      notes: "",
    },
  });
  const { reset } = form;

  useEffect(() => {
    reset(initial
      ? {
          clientId: initial.clientId ?? "",
          name: initial.name,
          totalAmountCents: initial.totalAmountCents,
          paymentType: initial.paymentType,
          depositAmountCents: initial.depositAmountCents,
          installmentCount: initial.installmentCount,
          notes: initial.notes,
        }
      : {
          clientId: "",
          name: "",
          totalAmountCents: 0,
          paymentType: "single",
          depositAmountCents: null,
          installmentCount: null,
          notes: "",
        });
  }, [reset, initial?.id, initial?.clientId, initial?.name, initial?.totalAmountCents, initial?.paymentType, initial?.depositAmountCents, initial?.installmentCount, initial?.notes]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const saved = await onSave({
            clientId: values.clientId,
            name: values.name,
            totalAmountCents: values.totalAmountCents,
            paymentType: values.paymentType,
            depositAmountCents: values.depositAmountCents,
            installmentCount: values.installmentCount,
            notes: values.notes,
            details,
          }, initial?.id);
          if (saved) onCancel();
        })}
        className="grid gap-4 sm:grid-cols-2"
        data-testid="form-finance-project"
      >
        <FormField control={form.control} name="clientId" render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <FormControl>
              <select {...field} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" data-testid="select-finance-project-client">
                <option value="">Seleziona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}{client.companyName ? ` · ${client.companyName}` : ""}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="paymentType" render={({ field }) => (
          <FormItem>
            <FormLabel>Modalità concordata</FormLabel>
            <FormControl>
              <select
                {...field}
                onChange={(event) => {
                  const paymentType = event.target.value as ProjectFormValues["paymentType"];
                  field.onChange(paymentType);
                  if (paymentType !== "advance") form.setValue("depositAmountCents", null);
                  if (paymentType !== "installments") form.setValue("installmentCount", null);
                }}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                data-testid="select-finance-payment-type"
              >
                <option value="single">Unica soluzione</option>
                <option value="advance">Acconto + saldo</option>
                <option value="installments">Rate</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {form.watch("paymentType") === "advance" && (
          <FormField control={form.control} name="depositAmountCents" render={({ field }) => (
            <FormItem>
              <FormLabel>Acconto concordato (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0.01"
                  max={Number(form.watch("totalAmountCents") ?? 0) / 100}
                  step="0.01"
                  value={field.value == null ? "" : Number(field.value) / 100}
                  onChange={(event) => field.onChange(event.target.value === "" ? null : Math.round(Number(event.target.value) * 100))}
                  data-testid="input-finance-deposit"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}
        {form.watch("paymentType") === "installments" && (
          <FormField control={form.control} name="installmentCount" render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di rate (facoltativo)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="2"
                  max="60"
                  step="1"
                  placeholder="Se noto"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                  data-testid="input-finance-installment-count"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}
        <p className="text-xs text-slate-500 sm:col-span-2">
          {form.watch("paymentType") === "installments"
            ? "Il numero di rate è facoltativo. Il residuo contrattuale non dipende dal numero di rate o scadenze inserite."
            : "Qui registri l’accordo; le singole scadenze e gli incassi si aggiungono separatamente nei movimenti."}
        </p>
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
                value={details.amountKnown ? Number(field.value ?? 0) / 100 : ""}
                placeholder="Da definire"
                onChange={(event) => {field.onChange(Math.round(Number(event.target.value || 0) * 100));setDetails({...details,amountKnown:event.target.value!==""});}}
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
        <details className="sm:col-span-2">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Stato del lavoro e verifiche economiche</summary>
          <p className="mt-1 text-xs text-slate-500">Apri solo per preventivi non confermati, costi extra o residui da verificare.</p>
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <ProjectDetailsFields value={details} onChange={setDetails}/>
          </div>
        </details>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy} data-testid="button-save-finance-project">
            {busy ? "Salvataggio…" : initial ? "Salva modifiche" : "Aggiungi lavoro"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel} data-testid="button-cancel-finance-project">Annulla</Button>
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
  workspace,
  clients,
}: {
  projects: AdminFinanceProject[];
  initial?: AdminFinanceEntry;
  busy: boolean;
  onCreate: (input: FinanceEntryInput) => Promise<boolean>;
  onUpdate: (id: string, input: FinanceEntryUpdate) => Promise<boolean>;
  onCancel: () => void;
  workspace?: FinanceWorkspace;
  clients?: AdminFinanceClient[];
}) {
  const [uploading,setUploading]=useState(false);
  const [details,setDetails]=useState<FinanceEntryDetails>(initial?.details??{paidDate:todayForInput(),amountConfirmed:true,reconciliation:"reconciled"});
  useEffect(()=>{setDetails(initial?.details??{paidDate:todayForInput(),amountConfirmed:true,reconciliation:"reconciled"});},[initial?.id,JSON.stringify(initial?.details)]);
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      projectId: "",
      direction: "income",
      category: "deposit",
      description: "",
      amountCents: 0,
      dueDate: todayForInput(),
      paid: true,
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
          description: initial.description.trim().toLocaleLowerCase("it-IT") === categoryDescriptions[initial.category].toLocaleLowerCase("it-IT")
            ? ""
            : initial.description,
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
          paid: true,
          repeatMonthly: false,
        });
  }, [reset, initial?.id, initial?.projectId, initial?.direction, initial?.category, initial?.description, initial?.amountCents, initial?.dueDate, initial?.paidAt, initial?.repeatMonthly]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const common = {
            category: values.category,
            description: values.description.trim() || categoryDescriptions[values.category],
            amountCents: values.amountCents,
            dueDate: values.dueDate,
            repeatMonthly: values.repeatMonthly,
            details,
          };
          const saved = initial
            ? await onUpdate(initial.id, {...common,paid:values.paid,projectId:values.projectId||null})
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
        {(
          <>
            {!initial&&<FormField control={form.control} name="direction" render={({ field }) => (
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
                      form.setValue("paid", direction === "income");
                      setDetails(current=>({...current,amountConfirmed:true,reconciliation:direction==="income"?"reconciled":"unverified",paidDate:direction==="income"?todayForInput():null}));
                    }}
                    data-testid="select-finance-direction"
                  >
                    <option value="income">Entrata</option>
                    <option value="expense">Spesa</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />}
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
            <FormLabel>Dettaglio aggiuntivo (facoltativo)</FormLabel>
            <FormControl><Input {...field} placeholder="Es. prima rata, campagna estiva" data-testid="input-finance-description" /></FormControl>
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
        <EntryDetailsFields value={details} onChange={setDetails} paid={form.watch("paid")} onPaid={v=>{form.setValue("paid",v);setDetails(current=>({...current,paidDate:v?(current.paidDate||todayForInput()):null,reconciliation:v&&current.amountConfirmed?"reconciled":"unverified"}));}} workspace={workspace} clients={clients} onUploadStateChange={setUploading}/>
        <p className="text-xs text-slate-500 sm:col-span-2">Per i canoni usa “Canoni e costi ricorrenti”: le scadenze non sono incassi. Solo pagamenti riconciliati e importi confermati entrano nel bilancio.</p>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy||uploading} data-testid="button-save-finance-entry">
            {busy ? "Salvataggio…" : initial ? "Salva modifiche" : "Aggiungi movimento"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Annulla</Button>
        </div>
      </form>
    </Form>
  );
}
