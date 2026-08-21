import { pgTable, serial, text, timestamp, pgEnum, integer, index, unique } from 'drizzle-orm/pg-core';

export const crmLeadSource = pgEnum('crm_lead_source', [
  'web',
  'whatsapp',
  'phone',
  'referral',
  'partner',
  'other',
]);

export const crmLeadStatus = pgEnum('crm_lead_status', [
  'new',
  'contact_pending',
  'contacted',
  'evaluation_scheduled',
  'qualified',
  'quote_pending',
  'won',
  'lost',
  'disqualified',
]);

export const crmLeadManagementStatus = pgEnum('crm_lead_management_status', [
  'new',
  'follow_up',
  'qualified',
  'converted',
]);

export const crmLeadManagementSource = pgEnum('crm_lead_management_source', [
  'chat',
  'phone',
  'whatsapp',
  'referral',
  'partner',
  'other',
]);

export const serviceOrderStatus = pgEnum('service_order_status', [
  'approval_pending',
  'in_progress',
  'waiting_documents',
  'closed',
]);

export const crmContacts = pgTable(
  'contacts',
  {
    id: serial('id').primaryKey(),
    fullName: text('full_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    preferredLanguage: text('preferred_language').notNull().default('en'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('contacts_email_unique').on(table.email),
    index('contacts_phone_idx').on(table.phone),
    index('contacts_full_name_idx').on(table.fullName),
  ],
);

export const crmLeads = pgTable(
  'leads',
  {
    id: serial('id').primaryKey(),
    contactId: integer('contact_id').notNull().references(() => crmContacts.id, {
      onDelete: 'cascade',
    }),
    source: crmLeadSource('source').notNull().default('web'),
    serviceInterest: text('service_interest'),
    status: crmLeadStatus('status').notNull().default('new'),
    stage: text('stage').notNull().default('new'),
    notes: text('notes'),
    converted: integer('converted').default(0).notNull(),
    score: integer('score').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('leads_contact_id_idx').on(table.contactId),
    index('leads_status_idx').on(table.status),
    unique('leads_contact_source_service_unique').on(
      table.contactId,
      table.source,
      table.serviceInterest,
    ),
  ],
);

export const crmClients = pgTable(
  'clients',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    services: text('services').notNull(),
    caseStatus: text('case_status').notNull().default('under review'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('clients_email_unique').on(table.email),
    index('clients_name_idx').on(table.name),
  ],
);

export const crmCompanies = pgTable(
  'companies',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    ein: text('ein'),
    state: text('state'),
    status: text('status').notNull().default('active'),
    industry: text('industry'),
    formed: text('formed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('companies_ein_unique').on(table.ein)],
);

export const crmLeadManagement = pgTable(
  'lead_management',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    service: text('service').notNull(),
    source: crmLeadManagementSource('source').notNull().default('chat'),
    status: crmLeadManagementStatus('status').notNull().default('new'),
    score: integer('score').notNull().default(0),
    converted: integer('converted').notNull().default(0),
    summary: text('summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_management_name_idx').on(table.name), index('lead_management_status_idx').on(table.status)],
);

export const crmServiceOrders = pgTable(
  'service_orders',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id'),
    client: text('client').notNull(),
    service: text('service').notNull(),
    price: integer('price').notNull().default(0),
    discount: integer('discount').notNull().default(0),
    status: serviceOrderStatus('status').notNull().default('approval_pending'),
    owner: text('owner').notNull().default('Operations team'),
    paid: integer('paid').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('service_orders_status_idx').on(table.status), index('service_orders_client_idx').on(table.client)],
);

export const crmLeadNotes = pgTable(
  'lead_notes',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id').notNull().references(() => crmLeads.id, {
      onDelete: 'cascade',
    }),
    actor: text('actor').notNull().default('system'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_notes_lead_id_created_at_idx').on(table.leadId, table.createdAt)],
);
