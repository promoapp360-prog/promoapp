ALTER TABLE "admin_finance_clients" ADD COLUMN IF NOT EXISTS "tax_id" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_clients" ADD COLUMN IF NOT EXISTS "address" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_clients" ADD COLUMN IF NOT EXISTS "sector" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_clients" ADD COLUMN IF NOT EXISTS "acquisition_source" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_clients" ADD COLUMN IF NOT EXISTS "status" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_clients" ADD COLUMN IF NOT EXISTS "credentials_location_note" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_projects" ADD COLUMN IF NOT EXISTS "work_type" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_projects" ADD COLUMN IF NOT EXISTS "status" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_projects" ADD COLUMN IF NOT EXISTS "start_date" date;
--> statement-breakpoint
ALTER TABLE "admin_finance_projects" ADD COLUMN IF NOT EXISTS "delivery_date" date;
--> statement-breakpoint
ALTER TABLE "admin_finance_projects" ADD COLUMN IF NOT EXISTS "service_description" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_projects" ADD COLUMN IF NOT EXISTS "legacy_operational_state" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_projects" ADD COLUMN IF NOT EXISTS "technical_references" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "admin_finance_recurring" ADD COLUMN IF NOT EXISTS "end_date" date;
--> statement-breakpoint
ALTER TABLE "admin_finance_suppliers" ADD COLUMN IF NOT EXISTS "tax_id" text;
--> statement-breakpoint
ALTER TABLE "admin_finance_suppliers" ADD COLUMN IF NOT EXISTS "address" text;
--> statement-breakpoint
UPDATE "admin_finance_projects"
SET "service_description" = NULLIF("details"->>'service', ''),
    "legacy_operational_state" = NULLIF("details"->>'operationalState', '')
WHERE "service_description" IS NULL OR "legacy_operational_state" IS NULL;
--> statement-breakpoint
CREATE TABLE "admin_finance_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"account_type" text NOT NULL,
	"opening_balance_cents" integer DEFAULT 0 NOT NULL,
	"opening_balance_date" date,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_document_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"next_number" integer DEFAULT 1 NOT NULL,
	"prefix" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"project_id" text,
	"quote_id" text,
	"document_type" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"number" text NOT NULL,
	"issued_on" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"gross_amount_cents" integer NOT NULL,
	"vat_rate_bps" integer,
	"vat_amount_cents" integer DEFAULT 0 NOT NULL,
	"withholding_rate_bps" integer,
	"withholding_amount_cents" integer DEFAULT 0 NOT NULL,
	"net_amount_cents" integer NOT NULL,
	"storage_path" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_movement_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"movement_id" text NOT NULL,
	"obligation_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"movement_at" timestamp with time zone NOT NULL,
	"direction" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"account_id" text,
	"payment_method" text,
	"historical" boolean DEFAULT false NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"external_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_obligations" (
	"id" text PRIMARY KEY NOT NULL,
	"direction" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_date" date NOT NULL,
	"client_id" text,
	"project_id" text,
	"recurring_id" text,
	"supplier_id" text,
	"source_type" text NOT NULL,
	"source_id" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_quote_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"position" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 3) DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"number" text NOT NULL,
	"issued_on" date NOT NULL,
	"valid_until" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_amount_cents" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"reminder_type" text NOT NULL,
	"due_date" date NOT NULL,
	"client_id" text,
	"project_id" text,
	"source_type" text,
	"source_id" text,
	"generated" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_finance_tax_regimes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"regime_type" text NOT NULL,
	"document_type" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"vat_rate_bps" integer,
	"withholding_rate_bps" integer,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_finance_documents" ADD CONSTRAINT "admin_finance_documents_client_id_admin_finance_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."admin_finance_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_documents" ADD CONSTRAINT "admin_finance_documents_project_id_admin_finance_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."admin_finance_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_documents" ADD CONSTRAINT "admin_finance_documents_quote_id_admin_finance_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."admin_finance_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_movement_allocations" ADD CONSTRAINT "admin_finance_movement_allocations_movement_id_admin_finance_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."admin_finance_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_movement_allocations" ADD CONSTRAINT "admin_finance_movement_allocations_obligation_id_admin_finance_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."admin_finance_obligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_movements" ADD CONSTRAINT "admin_finance_movements_account_id_admin_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."admin_finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_obligations" ADD CONSTRAINT "admin_finance_obligations_client_id_admin_finance_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."admin_finance_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_obligations" ADD CONSTRAINT "admin_finance_obligations_project_id_admin_finance_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."admin_finance_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_obligations" ADD CONSTRAINT "admin_finance_obligations_recurring_id_admin_finance_recurring_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."admin_finance_recurring"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_obligations" ADD CONSTRAINT "admin_finance_obligations_supplier_id_admin_finance_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."admin_finance_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_quote_items" ADD CONSTRAINT "admin_finance_quote_items_quote_id_admin_finance_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."admin_finance_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_quotes" ADD CONSTRAINT "admin_finance_quotes_client_id_admin_finance_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."admin_finance_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_reminders" ADD CONSTRAINT "admin_finance_reminders_client_id_admin_finance_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."admin_finance_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_finance_reminders" ADD CONSTRAINT "admin_finance_reminders_project_id_admin_finance_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."admin_finance_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_finance_accounts_name_idx" ON "admin_finance_accounts" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_finance_document_sequences_type_year_idx" ON "admin_finance_document_sequences" USING btree ("document_type","fiscal_year");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_finance_documents_number_idx" ON "admin_finance_documents" USING btree ("document_type","fiscal_year","number");--> statement-breakpoint
CREATE INDEX "admin_finance_documents_client_idx" ON "admin_finance_documents" USING btree ("client_id","issued_on");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_finance_movement_allocations_pair_idx" ON "admin_finance_movement_allocations" USING btree ("movement_id","obligation_id");--> statement-breakpoint
CREATE INDEX "admin_finance_movement_allocations_obligation_idx" ON "admin_finance_movement_allocations" USING btree ("obligation_id");--> statement-breakpoint
CREATE INDEX "admin_finance_movements_date_idx" ON "admin_finance_movements" USING btree ("movement_at");--> statement-breakpoint
CREATE INDEX "admin_finance_movements_direction_date_idx" ON "admin_finance_movements" USING btree ("direction","movement_at");--> statement-breakpoint
CREATE INDEX "admin_finance_obligations_due_idx" ON "admin_finance_obligations" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "admin_finance_obligations_client_idx" ON "admin_finance_obligations" USING btree ("client_id","due_date");--> statement-breakpoint
CREATE INDEX "admin_finance_obligations_source_idx" ON "admin_finance_obligations" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "admin_finance_quote_items_quote_idx" ON "admin_finance_quote_items" USING btree ("quote_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_finance_quotes_number_idx" ON "admin_finance_quotes" USING btree ("number");--> statement-breakpoint
CREATE INDEX "admin_finance_quotes_client_idx" ON "admin_finance_quotes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "admin_finance_reminders_due_idx" ON "admin_finance_reminders" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "admin_finance_reminders_client_idx" ON "admin_finance_reminders" USING btree ("client_id","due_date");--> statement-breakpoint
CREATE INDEX "admin_finance_tax_regimes_dates_idx" ON "admin_finance_tax_regimes" USING btree ("effective_from","effective_until");