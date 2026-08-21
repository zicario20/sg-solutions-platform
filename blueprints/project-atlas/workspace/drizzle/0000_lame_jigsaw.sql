CREATE TYPE "public"."crm_lead_management_source" AS ENUM('chat', 'phone', 'whatsapp', 'referral', 'partner', 'other');--> statement-breakpoint
CREATE TYPE "public"."crm_lead_management_status" AS ENUM('new', 'follow_up', 'qualified', 'converted');--> statement-breakpoint
CREATE TYPE "public"."crm_lead_source" AS ENUM('web', 'whatsapp', 'phone', 'referral', 'partner', 'other');--> statement-breakpoint
CREATE TYPE "public"."crm_lead_status" AS ENUM('new', 'contact_pending', 'contacted', 'evaluation_scheduled', 'qualified', 'quote_pending', 'won', 'lost', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."service_order_status" AS ENUM('approval_pending', 'in_progress', 'waiting_documents', 'closed');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"services" text NOT NULL,
	"case_status" text DEFAULT 'under review' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"ein" text,
	"state" text,
	"status" text DEFAULT 'active' NOT NULL,
	"industry" text,
	"formed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_ein_unique" UNIQUE("ein")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "lead_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"service" text NOT NULL,
	"source" "crm_lead_management_source" DEFAULT 'chat' NOT NULL,
	"status" "crm_lead_management_status" DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"converted" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"actor" text DEFAULT 'system' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"source" "crm_lead_source" DEFAULT 'web' NOT NULL,
	"service_interest" text,
	"status" "crm_lead_status" DEFAULT 'new' NOT NULL,
	"stage" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"converted" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_contact_source_service_unique" UNIQUE("contact_id","source","service_interest")
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"client" text NOT NULL,
	"service" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"status" "service_order_status" DEFAULT 'approval_pending' NOT NULL,
	"owner" text DEFAULT 'Operations team' NOT NULL,
	"paid" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "contacts_full_name_idx" ON "contacts" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "lead_management_name_idx" ON "lead_management" USING btree ("name");--> statement-breakpoint
CREATE INDEX "lead_management_status_idx" ON "lead_management" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_notes_lead_id_created_at_idx" ON "lead_notes" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_contact_id_idx" ON "leads" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_orders_status_idx" ON "service_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_orders_client_idx" ON "service_orders" USING btree ("client");