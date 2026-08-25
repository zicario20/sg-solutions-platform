import type postgres from "postgres";
import type { BookkeepingServiceType } from "../../bookkeeping/src/contracts.ts";

type RootSql = postgres.Sql;
type TransactionSql = postgres.TransactionSql;
type Sql = RootSql | TransactionSql;

export interface BookkeepingActor {
  accountId: string;
  contextRef: string;
  authorizationEpoch: string | number;
  policyEpoch: string | number;
  assurance: "aal1" | "aal2";
}

type EngagementRow = { id: string; status: string; version: number };
type BookRow = {
  id: string;
  accounting_entity_ref: string;
  accounting_basis: "cash" | "accrual";
  currency: "USD";
  fiscal_year_start_month: number;
  status: string;
  version: number;
  updated_at: Date;
};

const safeReference = (value: string) => /^[A-Za-z0-9_.:-]{1,128}$/u.test(value);
const safeMonth = (value: number) => Number.isInteger(value) && value >= 1 && value <= 12;
const safeMinorAmount = (value: number) => Number.isSafeInteger(value) && value >= 0;
const safeMemo = (value: string | undefined) =>
  value === undefined || (value.length <= 512 && !/[\r\n]/u.test(value));

export class PostgresBookkeepingGateway {
  constructor(
    private readonly sql: RootSql,
    private readonly now = () => new Date(),
  ) {}

  private async lock(sql: Sql, key: string) {
    await sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  }

  async createAccountingEntity(input: {
    actor: BookkeepingActor;
    accountingEntityRef: string;
    organizationRef?: string;
    legalEntityType:
      | "individual"
      | "sole_proprietorship"
      | "llc"
      | "corporation"
      | "partnership"
      | "other";
    classification: "business" | "personal" | "mixed" | "unknown";
    displayName: string;
    taxIdentifierTokenRef?: string;
    baseJurisdiction?: string;
    fiscalYearEndMonth: number;
  }) {
    if (
      !safeReference(input.accountingEntityRef) ||
      (input.organizationRef !== undefined && !safeReference(input.organizationRef)) ||
      (input.taxIdentifierTokenRef !== undefined && !safeReference(input.taxIdentifierTokenRef)) ||
      (input.baseJurisdiction !== undefined && !safeReference(input.baseJurisdiction)) ||
      !safeMonth(input.fiscalYearEndMonth) ||
      input.displayName.length < 1 ||
      input.displayName.length > 160
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-entity:${input.actor.accountId}:${input.actor.contextRef}:${input.accountingEntityRef}`,
      );
      const existing = (
        await tx<{ id: string }[]>`
          select id from accounting_entities
          where id=${input.accountingEntityRef} and owner_account_id=${input.actor.accountId}
            and context_ref=${input.actor.contextRef}
            and authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and policy_epoch=${Number(input.actor.policyEpoch)}
          limit 1
        `
      )[0];
      if (existing) return { kind: "existing" as const, accountingEntityRef: existing.id };
      await tx`
        insert into accounting_entities (
          id,owner_account_id,context_ref,authorization_epoch,policy_epoch,organization_ref,
          legal_entity_type,classification,display_name,tax_identifier_token_ref,currency,country,
          base_jurisdiction,fiscal_year_end_month,status,version,created_at,updated_at
        ) values (
          ${input.accountingEntityRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},${input.organizationRef ?? null},
          ${input.legalEntityType},${input.classification},${input.displayName},${input.taxIdentifierTokenRef ?? null},'USD','US',
          ${input.baseJurisdiction ?? null},${input.fiscalYearEndMonth},'setup',1,${now},${now}
        )
      `;
      return { kind: "created" as const, accountingEntityRef: input.accountingEntityRef };
    });
  }

  async createBookkeepingCase(input: {
    actor: BookkeepingActor;
    caseRef: string;
    caseNumber: string;
    engagementRef: string;
    bookRef: string;
    organizationRef?: string;
    serviceOrderRef?: string;
    assignedBookkeeperRef?: string;
    assignedReviewerRef?: string;
    correlationId: string;
  }) {
    const optionalReferences = [
      input.organizationRef,
      input.serviceOrderRef,
      input.assignedBookkeeperRef,
      input.assignedReviewerRef,
    ];
    if (
      !safeReference(input.caseRef) ||
      !safeReference(input.caseNumber) ||
      !safeReference(input.engagementRef) ||
      !safeReference(input.bookRef) ||
      !safeReference(input.correlationId) ||
      optionalReferences.some((reference) => reference !== undefined && !safeReference(reference))
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-case:${input.actor.accountId}:${input.actor.contextRef}:${input.engagementRef}:${input.bookRef}`,
      );
      const prerequisite = (
        await tx<{ engagement_id: string; book_id: string; accounting_entity_ref: string }[]>`
          select engagement.id as engagement_id,book.id as book_id,book.accounting_entity_ref
          from bookkeeping_engagements engagement
          join accounting_books book on book.id=${input.bookRef}
            and book.accounting_entity_ref=engagement.accounting_entity_ref
          join accounting_entities entity on entity.id=book.accounting_entity_ref
          where engagement.id=${input.engagementRef}
            and engagement.owner_account_id=${input.actor.accountId}
            and engagement.context_ref=${input.actor.contextRef}
            and engagement.authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and engagement.policy_epoch=${Number(input.actor.policyEpoch)}
            and book.owner_account_id=${input.actor.accountId}
            and book.context_ref=${input.actor.contextRef}
            and book.authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and book.policy_epoch=${Number(input.actor.policyEpoch)}
            and entity.owner_account_id=${input.actor.accountId}
            and entity.context_ref=${input.actor.contextRef}
            and entity.authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and entity.policy_epoch=${Number(input.actor.policyEpoch)}
          limit 1
        `
      )[0];
      if (!prerequisite) return { kind: "not_found" as const };
      const existing = (
        await tx<{ id: string }[]>`
          select id from bookkeeping_cases
          where engagement_id=${input.engagementRef} and accounting_book_id=${input.bookRef}
            and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
            and authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and policy_epoch=${Number(input.actor.policyEpoch)}
          limit 1
        `
      )[0];
      if (existing) return { kind: "existing" as const, caseRef: existing.id };
      await tx`
        insert into bookkeeping_cases (
          id,case_number,engagement_id,accounting_book_id,owner_account_id,context_ref,
          authorization_epoch,policy_epoch,accounting_entity_ref,organization_ref,service_order_ref,
          assigned_bookkeeper_ref,assigned_reviewer_ref,status,version,created_at,updated_at
        ) values (
          ${input.caseRef},${input.caseNumber},${input.engagementRef},${input.bookRef},
          ${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},
          ${Number(input.actor.policyEpoch)},${prerequisite.accounting_entity_ref},${input.organizationRef ?? null},
          ${input.serviceOrderRef ?? null},${input.assignedBookkeeperRef ?? null},${input.assignedReviewerRef ?? null},
          'setup_pending',1,${now},${now}
        )
      `;
      await tx`
        insert into bookkeeping_audit_events (id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,event_type,resource_reference,correlation_id,created_at)
        values (${`${input.caseRef}:created`},${input.bookRef},${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},'bookkeeping_case_created',${input.caseRef},${input.correlationId},${now})
      `;
      await tx`
        insert into bookkeeping_outbox (id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,event_type,state,attempt_count,correlation_id,created_at)
        values (${`${input.caseRef}:created-event`},${input.bookRef},${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},'BookkeepingCaseCreated.v1','pending',0,${input.correlationId},${now})
      `;
      return { kind: "created" as const, caseRef: input.caseRef };
    });
  }

  async createEngagement(input: {
    actor: BookkeepingActor;
    engagementRef: string;
    accountingEntityRef: string;
    serviceType: BookkeepingServiceType;
    bookkeepingFrequency: "monthly" | "quarterly" | "annual" | "custom";
    accountingBasis: "cash" | "accrual";
    bookStartOn: Date;
    fiscalYearEndMonth: number;
    monthlyTransactionAllowance?: number;
    reportingFrequency: "monthly" | "quarterly" | "annual" | "custom";
    closePolicyRef?: string;
  }) {
    if (
      !safeReference(input.engagementRef) ||
      !safeReference(input.accountingEntityRef) ||
      !safeMonth(input.fiscalYearEndMonth) ||
      !Number.isSafeInteger(input.bookStartOn.getTime()) ||
      (input.monthlyTransactionAllowance !== undefined &&
        (!Number.isSafeInteger(input.monthlyTransactionAllowance) ||
          input.monthlyTransactionAllowance < 0)) ||
      (input.closePolicyRef !== undefined && !safeReference(input.closePolicyRef))
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-engagement:${input.actor.accountId}:${input.actor.contextRef}:${input.accountingEntityRef}`,
      );
      const entity = (
        await tx<{ id: string }[]>`
          select id from accounting_entities
          where id=${input.accountingEntityRef} and owner_account_id=${input.actor.accountId}
            and context_ref=${input.actor.contextRef}
            and authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and policy_epoch=${Number(input.actor.policyEpoch)}
            and status in ('setup','active')
          limit 1 for update
        `
      )[0];
      if (!entity) return { kind: "not_found" as const };
      const existing = (
        await tx<EngagementRow[]>`
          select id,status,version from bookkeeping_engagements
          where owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
            and authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and policy_epoch=${Number(input.actor.policyEpoch)}
            and accounting_entity_ref=${input.accountingEntityRef}
          limit 1
        `
      )[0];
      if (existing) return { kind: "existing" as const, engagementRef: existing.id };
      await tx`
        insert into bookkeeping_engagements (
          id,owner_account_id,context_ref,authorization_epoch,policy_epoch,accounting_entity_ref,service_type,
          bookkeeping_frequency,accounting_basis,book_start_on,fiscal_year_end_month,monthly_transaction_allowance,
          reporting_frequency,close_policy_ref,external_accounting_system,status,provider_connections_enabled,
          tax_integration_enabled,version,created_at,updated_at
        ) values (
          ${input.engagementRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},${input.accountingEntityRef},
          ${input.serviceType},${input.bookkeepingFrequency},${input.accountingBasis},${input.bookStartOn},
          ${input.fiscalYearEndMonth},${input.monthlyTransactionAllowance ?? null},${input.reportingFrequency},
          ${input.closePolicyRef ?? null},'disabled','setup_in_progress',false,false,1,${now},${now}
        )
      `;
      return { kind: "created" as const, engagementRef: input.engagementRef };
    });
  }

  async createBook(input: {
    actor: BookkeepingActor;
    bookRef: string;
    engagementRef: string;
    accountingEntityRef: string;
    accountingBasis: "cash" | "accrual";
    fiscalYearStartMonth: number;
  }) {
    if (
      !safeReference(input.bookRef) ||
      !safeReference(input.engagementRef) ||
      !safeReference(input.accountingEntityRef) ||
      !safeMonth(input.fiscalYearStartMonth)
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(tx, `m031-book:${input.actor.accountId}:${input.engagementRef}`);
      const engagement = (
        await tx<{ id: string }[]>`
          select engagement.id from bookkeeping_engagements engagement
          join accounting_entities entity on entity.id=engagement.accounting_entity_ref
          where engagement.id=${input.engagementRef}
            and engagement.accounting_entity_ref=${input.accountingEntityRef}
            and engagement.owner_account_id=${input.actor.accountId}
            and engagement.context_ref=${input.actor.contextRef}
            and engagement.authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and engagement.policy_epoch=${Number(input.actor.policyEpoch)}
            and entity.owner_account_id=${input.actor.accountId}
            and entity.context_ref=${input.actor.contextRef}
            and entity.authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and entity.policy_epoch=${Number(input.actor.policyEpoch)}
            and entity.status in ('setup','active')
          limit 1 for update
        `
      )[0];
      if (!engagement) return { kind: "not_found" as const };
      const created = await tx<{ id: string }[]>`
        insert into accounting_books (
          id,engagement_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,accounting_entity_ref,
          accounting_basis,currency,fiscal_year_start_month,status,version,created_at,updated_at
        ) values (
          ${input.bookRef},${input.engagementRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},${input.accountingEntityRef},
          ${input.accountingBasis},'USD',${input.fiscalYearStartMonth},'setup',1,${now},${now}
        ) on conflict (engagement_id,accounting_entity_ref) do nothing returning id
      `;
      if (created[0]) {
        await tx`
          insert into bookkeeping_audit_events (id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,event_type,resource_reference,correlation_id,created_at)
          values (${`${created[0].id}:created`},${created[0].id},${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},'accounting_book_created',${created[0].id},${`m031_book:${created[0].id}`},${now})
        `;
        await tx`
          insert into bookkeeping_outbox (id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,event_type,state,attempt_count,correlation_id,created_at)
          values (${`${created[0].id}:created-event`},${created[0].id},${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},'AccountingBookCreated.v1','pending',0,${`m031_book:${created[0].id}`},${now})
        `;
        return { kind: "created" as const, bookRef: created[0].id };
      }
      const book = (
        await tx<{ id: string }[]>`
          select id from accounting_books
          where engagement_id=${input.engagementRef} and accounting_entity_ref=${input.accountingEntityRef}
            and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
            and authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and policy_epoch=${Number(input.actor.policyEpoch)}
          limit 1
        `
      )[0];
      return book
        ? { kind: "existing" as const, bookRef: book.id }
        : { kind: "not_found" as const };
    });
  }

  async createPeriod(input: {
    actor: BookkeepingActor;
    periodRef: string;
    bookRef: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    if (
      !safeReference(input.periodRef) ||
      !safeReference(input.bookRef) ||
      !Number.isFinite(input.periodStart.getTime()) ||
      !Number.isFinite(input.periodEnd.getTime()) ||
      input.periodStart >= input.periodEnd
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-period:${input.actor.accountId}:${input.bookRef}:${input.periodStart.toISOString()}`,
      );
      const created = await tx<{ id: string }[]>`
        insert into accounting_periods (
          id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          period_start,period_end,status,version,created_at,updated_at
        ) select ${input.periodRef},b.id,${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          ${input.periodStart},${input.periodEnd},'open',1,${now},${now}
        from accounting_books b
        where b.id=${input.bookRef} and b.owner_account_id=${input.actor.accountId}
          and b.context_ref=${input.actor.contextRef}
          and b.authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and b.policy_epoch=${Number(input.actor.policyEpoch)}
        on conflict (book_id,period_start) do nothing
        returning id
      `;
      return created[0]
        ? { kind: "created" as const, periodRef: created[0].id }
        : { kind: "not_found" as const };
    });
  }

  async createChartAccount(input: {
    actor: BookkeepingActor;
    accountRef: string;
    bookRef: string;
    code: string;
    name: string;
    category: "asset" | "liability" | "equity" | "income" | "expense";
    systemAccount: boolean;
  }) {
    if (
      !safeReference(input.accountRef) ||
      !safeReference(input.bookRef) ||
      !safeReference(input.code) ||
      input.name.length === 0 ||
      input.name.length > 160 ||
      /[\r\n]/u.test(input.name)
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-chart-account:${input.actor.accountId}:${input.bookRef}:${input.code}`,
      );
      const account = await tx<{ id: string }[]>`
        insert into chart_accounts (
          id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          code,name,category,active,system_account,version,created_at,updated_at
        ) select ${input.accountRef},b.id,${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          ${input.code},${input.name},${input.category},true,${input.systemAccount},1,${now},${now}
        from accounting_books b
        where b.id=${input.bookRef} and b.owner_account_id=${input.actor.accountId}
          and b.context_ref=${input.actor.contextRef}
          and b.authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and b.policy_epoch=${Number(input.actor.policyEpoch)}
        on conflict (book_id,code) do nothing
        returning id
      `;
      if (account[0]) return { kind: "created" as const, accountRef: account[0].id };
      const existing = await tx<{ id: string }[]>`
        select id from chart_accounts
        where book_id=${input.bookRef} and code=${input.code}
          and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
          and authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and policy_epoch=${Number(input.actor.policyEpoch)}
        limit 1
      `;
      return existing[0]
        ? { kind: "existing" as const, accountRef: existing[0].id }
        : { kind: "not_found" as const };
    });
  }

  async postJournalEntry(input: {
    actor: BookkeepingActor;
    entryRef: string;
    bookRef: string;
    periodRef: string;
    correlationId: string;
    memo?: string;
    lines: readonly Readonly<{
      accountRef: string;
      debitMinor: number;
      creditMinor: number;
      memo?: string;
    }>[];
  }) {
    if (
      !safeReference(input.entryRef) ||
      !safeReference(input.bookRef) ||
      !safeReference(input.periodRef) ||
      !safeReference(input.correlationId) ||
      !safeMemo(input.memo) ||
      input.lines.length < 2 ||
      input.lines.length > 100
    )
      return { kind: "invalid" as const };
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of input.lines) {
      if (
        !safeReference(line.accountRef) ||
        !safeMinorAmount(line.debitMinor) ||
        !safeMinorAmount(line.creditMinor) ||
        !safeMemo(line.memo) ||
        (line.debitMinor === 0 && line.creditMinor === 0) ||
        (line.debitMinor > 0 && line.creditMinor > 0)
      )
        return { kind: "invalid" as const };
      totalDebit += line.debitMinor;
      totalCredit += line.creditMinor;
      if (!Number.isSafeInteger(totalDebit) || !Number.isSafeInteger(totalCredit))
        return { kind: "invalid" as const };
    }
    if (totalDebit !== totalCredit || totalDebit === 0) return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-post-entry:${input.actor.accountId}:${input.bookRef}:${input.entryRef}`,
      );
      const existing = await tx<{ id: string }[]>`
        select id from journal_entries
        where id=${input.entryRef} and book_id=${input.bookRef}
          and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
          and authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and policy_epoch=${Number(input.actor.policyEpoch)}
        limit 1 for update
      `;
      if (existing[0]) return { kind: "existing" as const, entryRef: existing[0].id };
      const period = await tx<{ id: string }[]>`
        select period.id from accounting_periods period
        join accounting_books book on book.id=period.book_id
        where period.id=${input.periodRef} and period.book_id=${input.bookRef} and period.status='open'
          and book.owner_account_id=${input.actor.accountId} and book.context_ref=${input.actor.contextRef}
          and book.authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and book.policy_epoch=${Number(input.actor.policyEpoch)}
        limit 1 for update
      `;
      if (!period[0]) return { kind: "not_found" as const };
      for (const line of input.lines) {
        const account = await tx<{ id: string }[]>`
          select id from chart_accounts
          where id=${line.accountRef} and book_id=${input.bookRef} and active=true
            and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
            and authorization_epoch=${Number(input.actor.authorizationEpoch)}
            and policy_epoch=${Number(input.actor.policyEpoch)}
          limit 1
        `;
        if (!account[0]) return { kind: "not_found" as const };
      }
      await tx`
        insert into journal_entries (
          id,book_id,period_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          status,memo,posted_at,version,created_at,updated_at
        ) values (
          ${input.entryRef},${input.bookRef},${input.periodRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          'posted',${input.memo ?? null},${now},1,${now},${now}
        )
      `;
      for (const [index, line] of input.lines.entries()) {
        await tx`
          insert into journal_entry_lines (
            id,journal_entry_id,account_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
            ordinal,debit_minor,credit_minor,memo,created_at
          ) values (
            ${`${input.entryRef}:${index + 1}`},${input.entryRef},${line.accountRef},
            ${input.actor.accountId},${input.actor.contextRef},${Number(input.actor.authorizationEpoch)},
            ${Number(input.actor.policyEpoch)},${index + 1},${line.debitMinor},${line.creditMinor},
            ${line.memo ?? null},${now}
          )
        `;
      }
      await tx`
        insert into bookkeeping_audit_events (
          id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          event_type,resource_reference,correlation_id,created_at
        ) values (
          ${`${input.entryRef}:posted`},${input.bookRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          'journal_entry_posted',${input.entryRef},${input.correlationId},${now}
        )
      `;
      await tx`
        insert into bookkeeping_outbox (
          id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          event_type,state,correlation_id,created_at
        ) values (
          ${`${input.entryRef}:posted`},${input.bookRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          'JournalEntryPosted.v1','pending',${input.correlationId},${now}
        )
      `;
      return { kind: "posted" as const, entryRef: input.entryRef };
    });
  }

  async registerFinancialAccount(input: {
    actor: BookkeepingActor;
    financialAccountRef: string;
    bookRef: string;
    accountName: string;
    accountType: "bank" | "credit_card" | "loan" | "cash" | "other";
  }) {
    if (
      !safeReference(input.financialAccountRef) ||
      !safeReference(input.bookRef) ||
      input.accountName.length === 0 ||
      input.accountName.length > 160 ||
      /[\r\n]/u.test(input.accountName)
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-financial-account:${input.actor.accountId}:${input.bookRef}:${input.financialAccountRef}`,
      );
      const account = await tx<{ id: string }[]>`
        insert into financial_account_registry (
          id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          account_name,account_type,currency,provider_connection_status,active,version,created_at,updated_at
        ) select ${input.financialAccountRef},b.id,${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          ${input.accountName},${input.accountType},'USD','not_connected',true,1,${now},${now}
        from accounting_books b
        where b.id=${input.bookRef} and b.owner_account_id=${input.actor.accountId}
          and b.context_ref=${input.actor.contextRef}
          and b.authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and b.policy_epoch=${Number(input.actor.policyEpoch)}
        on conflict (id) do nothing
        returning id
      `;
      if (!account[0])
        return { kind: "existing" as const, financialAccountRef: input.financialAccountRef };
      await tx`
        insert into bookkeeping_audit_events (
          id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          event_type,resource_reference,correlation_id,created_at
        ) values (
          ${`${input.financialAccountRef}:registered`},${input.bookRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          'financial_account_registered',${input.financialAccountRef},${`m031_financial_account:${input.financialAccountRef}`},${now}
        )
      `;
      return { kind: "created" as const, financialAccountRef: account[0].id };
    });
  }

  async recordSourceTransaction(input: {
    actor: BookkeepingActor;
    transactionRef: string;
    bookRef: string;
    financialAccountRef: string;
    sourceReference: string;
    occurredOn: Date;
    amountMinor: number;
    direction: "inflow" | "outflow";
    description: string;
  }) {
    if (
      !safeReference(input.transactionRef) ||
      !safeReference(input.bookRef) ||
      !safeReference(input.financialAccountRef) ||
      !safeReference(input.sourceReference) ||
      !Number.isSafeInteger(input.amountMinor) ||
      input.amountMinor <= 0 ||
      !Number.isFinite(input.occurredOn.getTime()) ||
      input.description.length === 0 ||
      input.description.length > 512 ||
      /[\r\n]/u.test(input.description)
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-source-transaction:${input.actor.accountId}:${input.financialAccountRef}:${input.sourceReference}`,
      );
      const created = await tx<{ id: string }[]>`
        insert into source_transactions (
          id,book_id,financial_account_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          source_reference,occurred_on,amount_minor,direction,description,pending,state,version,created_at,updated_at
        ) select ${input.transactionRef},a.book_id,a.id,${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},${input.sourceReference},
          ${input.occurredOn},${input.amountMinor},${input.direction},${input.description},false,'review_required',1,${now},${now}
        from financial_account_registry a
        where a.id=${input.financialAccountRef} and a.book_id=${input.bookRef} and a.active=true
          and a.owner_account_id=${input.actor.accountId} and a.context_ref=${input.actor.contextRef}
          and a.authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and a.policy_epoch=${Number(input.actor.policyEpoch)}
        on conflict (financial_account_id,source_reference) do nothing
        returning id
      `;
      if (created[0]) {
        await tx`
          insert into bookkeeping_audit_events (
            id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
            event_type,resource_reference,correlation_id,created_at
          ) values (
            ${`${input.transactionRef}:recorded`},${input.bookRef},${input.actor.accountId},${input.actor.contextRef},
            ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
            'source_transaction_recorded',${input.transactionRef},${`m031_source_transaction:${input.transactionRef}`},${now}
          )
        `;
        return { kind: "created" as const, transactionRef: created[0].id };
      }
      const existing = await tx<{ id: string }[]>`
        select id from source_transactions
        where financial_account_id=${input.financialAccountRef} and source_reference=${input.sourceReference}
          and owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
          and authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and policy_epoch=${Number(input.actor.policyEpoch)}
        limit 1
      `;
      return existing[0]
        ? { kind: "existing" as const, transactionRef: existing[0].id }
        : { kind: "not_found" as const };
    });
  }

  async createReconciliationSession(input: {
    actor: BookkeepingActor;
    reconciliationRef: string;
    bookRef: string;
    financialAccountRef: string;
    periodRef: string;
    statementEndingBalanceMinor: number;
    differenceMinor: number;
  }) {
    if (
      !safeReference(input.reconciliationRef) ||
      !safeReference(input.bookRef) ||
      !safeReference(input.financialAccountRef) ||
      !safeReference(input.periodRef) ||
      !Number.isSafeInteger(input.statementEndingBalanceMinor) ||
      !Number.isSafeInteger(input.differenceMinor)
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(
        tx,
        `m031-reconciliation:${input.actor.accountId}:${input.financialAccountRef}:${input.periodRef}`,
      );
      const created = await tx<{ id: string }[]>`
        insert into reconciliation_sessions (
          id,book_id,financial_account_id,period_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          statement_ending_balance_minor,difference_minor,status,version,created_at,updated_at
        ) select ${input.reconciliationRef},a.book_id,a.id,p.id,${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          ${input.statementEndingBalanceMinor},${input.differenceMinor},'review_required',1,${now},${now}
        from financial_account_registry a
        join accounting_periods p on p.book_id=a.book_id
        where a.id=${input.financialAccountRef} and a.book_id=${input.bookRef} and p.id=${input.periodRef}
          and p.status in ('open','soft_closed') and a.owner_account_id=${input.actor.accountId}
          and a.context_ref=${input.actor.contextRef}
          and a.authorization_epoch=${Number(input.actor.authorizationEpoch)}
          and a.policy_epoch=${Number(input.actor.policyEpoch)}
        on conflict (financial_account_id,period_id) do nothing
        returning id
      `;
      if (!created[0]) return { kind: "not_found" as const };
      await tx`
        insert into bookkeeping_audit_events (
          id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          event_type,resource_reference,correlation_id,created_at
        ) values (
          ${`${input.reconciliationRef}:created`},${input.bookRef},${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          'reconciliation_session_created',${input.reconciliationRef},${`m031_reconciliation:${input.reconciliationRef}`},${now}
        )
      `;
      return { kind: "created" as const, reconciliationRef: created[0].id };
    });
  }

  async getTrialBalance(input: { actor: BookkeepingActor; bookRef: string }) {
    if (!safeReference(input.bookRef)) return { kind: "invalid" as const };
    const rows = await this.sql<
      {
        id: string;
        code: string;
        name: string;
        category: string;
        debit_minor: number;
        credit_minor: number;
      }[]
    >`
      select account.id,account.code,account.name,account.category,
        coalesce(sum(line.debit_minor) filter (where entry.status='posted'),0)::bigint as debit_minor,
        coalesce(sum(line.credit_minor) filter (where entry.status='posted'),0)::bigint as credit_minor
      from chart_accounts account
      join accounting_books book on book.id=account.book_id
      left join journal_entry_lines line on line.account_id=account.id
      left join journal_entries entry on entry.id=line.journal_entry_id and entry.status='posted'
      where account.book_id=${input.bookRef} and book.owner_account_id=${input.actor.accountId}
        and book.context_ref=${input.actor.contextRef}
        and book.authorization_epoch=${Number(input.actor.authorizationEpoch)}
        and book.policy_epoch=${Number(input.actor.policyEpoch)}
      group by account.id,account.code,account.name,account.category
      order by account.code asc
    `;
    return {
      kind: "ok" as const,
      items: rows.map((row) => ({
        accountRef: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        debitMinor: Number(row.debit_minor),
        creditMinor: Number(row.credit_minor),
      })),
    };
  }

  async getProfitAndLoss(input: { actor: BookkeepingActor; bookRef: string }) {
    if (!safeReference(input.bookRef)) return { kind: "invalid" as const };
    const rows = await this.sql<{ category: "income" | "expense"; amount_minor: number }[]>`
      select account.category,
        coalesce(sum(case when account.category='income' then line.credit_minor-line.debit_minor else line.debit_minor-line.credit_minor end) filter (where entry.status='posted'),0)::bigint as amount_minor
      from chart_accounts account
      join accounting_books book on book.id=account.book_id
      left join journal_entry_lines line on line.account_id=account.id
      left join journal_entries entry on entry.id=line.journal_entry_id and entry.status='posted'
      where account.book_id=${input.bookRef} and account.category in ('income','expense')
        and book.owner_account_id=${input.actor.accountId} and book.context_ref=${input.actor.contextRef}
        and book.authorization_epoch=${Number(input.actor.authorizationEpoch)} and book.policy_epoch=${Number(input.actor.policyEpoch)}
      group by account.category
    `;
    const income = Number(rows.find((row) => row.category === "income")?.amount_minor ?? 0);
    const expense = Number(rows.find((row) => row.category === "expense")?.amount_minor ?? 0);
    return {
      kind: "ok" as const,
      incomeMinor: income,
      expenseMinor: expense,
      netIncomeMinor: income - expense,
    };
  }

  async getBalanceSheet(input: { actor: BookkeepingActor; bookRef: string }) {
    if (!safeReference(input.bookRef)) return { kind: "invalid" as const };
    const rows = await this.sql<
      { category: "asset" | "liability" | "equity" | "income" | "expense"; amount_minor: number }[]
    >`
      select account.category,
        coalesce(sum(case
          when account.category in ('asset','expense') then line.debit_minor-line.credit_minor
          else line.credit_minor-line.debit_minor
        end) filter (where entry.status='posted'),0)::bigint as amount_minor
      from chart_accounts account
      join accounting_books book on book.id=account.book_id
      left join journal_entry_lines line on line.account_id=account.id
      left join journal_entries entry on entry.id=line.journal_entry_id and entry.status='posted'
      where account.book_id=${input.bookRef} and account.category in ('asset','liability','equity','income','expense')
        and book.owner_account_id=${input.actor.accountId} and book.context_ref=${input.actor.contextRef}
        and book.authorization_epoch=${Number(input.actor.authorizationEpoch)} and book.policy_epoch=${Number(input.actor.policyEpoch)}
      group by account.category
    `;
    const amount = (category: "asset" | "liability" | "equity" | "income" | "expense") =>
      Number(rows.find((row) => row.category === category)?.amount_minor ?? 0);
    const assetsMinor = amount("asset");
    const liabilitiesMinor = amount("liability");
    const equityMinor = amount("equity");
    const currentPeriodEarningsMinor = amount("income") - amount("expense");
    return {
      kind: "ok" as const,
      assetsMinor,
      liabilitiesMinor,
      equityMinor,
      currentPeriodEarningsMinor,
      balanced: assetsMinor === liabilitiesMinor + equityMinor + currentPeriodEarningsMinor,
    };
  }

  async getGeneralLedger(input: { actor: BookkeepingActor; bookRef: string; limit?: number }) {
    if (!safeReference(input.bookRef)) return { kind: "invalid" as const };
    const limit = Math.min(Math.max(input.limit ?? 100, 1), 250);
    const rows = await this.sql<
      {
        entry_id: string;
        posted_at: Date;
        account_code: string;
        account_name: string;
        debit_minor: number;
        credit_minor: number;
        memo: string | null;
      }[]
    >`
      select entry.id as entry_id,entry.posted_at,account.code as account_code,account.name as account_name,line.debit_minor,line.credit_minor,line.memo
      from journal_entries entry
      join accounting_books book on book.id=entry.book_id
      join journal_entry_lines line on line.journal_entry_id=entry.id
      join chart_accounts account on account.id=line.account_id
      where entry.book_id=${input.bookRef} and entry.status='posted'
        and book.owner_account_id=${input.actor.accountId} and book.context_ref=${input.actor.contextRef}
        and book.authorization_epoch=${Number(input.actor.authorizationEpoch)} and book.policy_epoch=${Number(input.actor.policyEpoch)}
      order by entry.posted_at desc,line.ordinal asc limit ${limit}
    `;
    return {
      kind: "ok" as const,
      items: rows.map((row) => ({
        entryRef: row.entry_id,
        postedAt: row.posted_at.toISOString(),
        accountCode: row.account_code,
        accountName: row.account_name,
        debitMinor: Number(row.debit_minor),
        creditMinor: Number(row.credit_minor),
        memo: row.memo ?? undefined,
      })),
    };
  }

  async getCloseReadiness(input: { actor: BookkeepingActor; bookRef: string; periodRef: string }) {
    if (!safeReference(input.bookRef) || !safeReference(input.periodRef))
      return { kind: "invalid" as const };
    const result = await this.sql<{ period_id: string; blocking_reconciliations: number }[]>`
      select period.id as period_id,
        count(session.id) filter (where session.status in ('draft','in_progress','difference_detected','review_required'))::int as blocking_reconciliations
      from accounting_periods period
      join accounting_books book on book.id=period.book_id
      left join reconciliation_sessions session on session.period_id=period.id
      where period.id=${input.periodRef} and period.book_id=${input.bookRef}
        and book.owner_account_id=${input.actor.accountId} and book.context_ref=${input.actor.contextRef}
        and book.authorization_epoch=${Number(input.actor.authorizationEpoch)}
        and book.policy_epoch=${Number(input.actor.policyEpoch)}
      group by period.id
    `;
    return result[0]
      ? {
          kind: "ok" as const,
          periodRef: result[0].period_id,
          canRequestClose: result[0].blocking_reconciliations === 0,
          blockingReconciliations: Number(result[0].blocking_reconciliations),
        }
      : { kind: "not_found" as const };
  }

  async requestPeriodClose(input: {
    actor: BookkeepingActor;
    requestRef: string;
    bookRef: string;
    periodRef: string;
    reason?: string;
  }) {
    if (
      !safeReference(input.requestRef) ||
      !safeReference(input.bookRef) ||
      !safeReference(input.periodRef) ||
      !safeMemo(input.reason)
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(tx, `m031-close-request:${input.actor.accountId}:${input.periodRef}`);
      const created = await tx<{ id: string }[]>`
        insert into accounting_close_requests (
          id,book_id,period_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,
          requested_by_account_id,status,reason,version,created_at,updated_at
        ) select ${input.requestRef},period.book_id,period.id,${input.actor.accountId},${input.actor.contextRef},
          ${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},${input.actor.accountId},
          'requested',${input.reason ?? null},1,${now},${now}
        from accounting_periods period
        join accounting_books book on book.id=period.book_id
        where period.id=${input.periodRef} and period.book_id=${input.bookRef} and period.status='open'
          and book.owner_account_id=${input.actor.accountId} and book.context_ref=${input.actor.contextRef}
          and book.authorization_epoch=${Number(input.actor.authorizationEpoch)} and book.policy_epoch=${Number(input.actor.policyEpoch)}
          and not exists (select 1 from reconciliation_sessions session where session.period_id=period.id and session.status in ('draft','in_progress','difference_detected','review_required'))
        on conflict (period_id) do nothing returning id
      `;
      return created[0]
        ? { kind: "requested" as const, requestRef: created[0].id }
        : { kind: "blocked_or_existing" as const };
    });
  }

  async approvePeriodClose(input: {
    actor: BookkeepingActor;
    requestRef: string;
    reviewerAccountId: string;
    correlationId: string;
  }) {
    if (
      !safeReference(input.requestRef) ||
      !safeReference(input.reviewerAccountId) ||
      !safeReference(input.correlationId)
    )
      return { kind: "invalid" as const };
    const now = this.now();
    return this.sql.begin(async (tx) => {
      await this.lock(tx, `m031-close-approval:${input.actor.accountId}:${input.requestRef}`);
      const request = (
        await tx<
          {
            id: string;
            book_id: string;
            period_id: string;
            requested_by_account_id: string;
            owner_account_id: string;
            context_ref: string;
            authorization_epoch: number;
            policy_epoch: number;
            accounting_entity_ref: string;
          }[]
        >`
        select request.id,request.book_id,request.period_id,request.requested_by_account_id,
          request.owner_account_id,request.context_ref,request.authorization_epoch,request.policy_epoch,
          book.accounting_entity_ref
        from accounting_close_requests request
        join accounting_books book on book.id=request.book_id
        where request.id=${input.requestRef} and request.status='requested'
        limit 1 for update of request
      `
      )[0];
      if (!request) return { kind: "not_found" as const };
      if (
        input.reviewerAccountId !== input.actor.accountId ||
        input.reviewerAccountId === request.requested_by_account_id
      )
        return { kind: "denied" as const };
      const delegation = await tx<{ allowed: boolean }[]>`
        select public.atlas_auth_verify_bookkeeping_review_delegation(
          ${input.actor.accountId},${Number(input.actor.authorizationEpoch)},${Number(input.actor.policyEpoch)},
          ${request.owner_account_id},${request.context_ref},${Number(request.authorization_epoch)},
          ${Number(request.policy_epoch)},${request.accounting_entity_ref},${now}
        ) as allowed
      `;
      if (!delegation[0]?.allowed) return { kind: "denied" as const };
      const changed = await tx<{ id: string }[]>`
        update accounting_periods set status='soft_closed',version=version+1,updated_at=${now}
        where id=${request.period_id} and book_id=${request.book_id} and status='open'
        returning id
      `;
      if (!changed[0]) return { kind: "blocked_or_existing" as const };
      await tx`
        update accounting_close_requests set status='approved',reviewer_account_id=${input.reviewerAccountId},reviewed_at=${now},version=version+1,updated_at=${now}
        where id=${request.id}
      `;
      await tx`
        insert into bookkeeping_audit_events (id,book_id,owner_account_id,context_ref,authorization_epoch,policy_epoch,event_type,resource_reference,correlation_id,created_at)
        values (${`${request.id}:approved`},${request.book_id},${request.owner_account_id},${request.context_ref},${Number(request.authorization_epoch)},${Number(request.policy_epoch)},'accounting_period_soft_closed',${`${request.period_id}:reviewer:${input.reviewerAccountId}`},${input.correlationId},${now})
      `;
      return { kind: "approved" as const, periodRef: request.period_id };
    });
  }

  async claimPendingOutbox(limit = 25) {
    const count = Math.min(Math.max(limit, 1), 100);
    const now = this.now();
    return this.sql.begin(async (tx) => {
      const events = await tx<
        {
          id: string;
          book_id: string;
          event_type: string;
          correlation_id: string;
          attempt_count: number;
        }[]
      >`
        with claimable as (
          select id from bookkeeping_outbox
          where state='pending' and attempt_count<3
          order by created_at asc
          limit ${count} for update skip locked
        )
        update bookkeeping_outbox event set state='processing',attempt_count=attempt_count+1,claimed_at=${now},last_error_code=null
        from claimable where event.id=claimable.id
        returning event.id,event.book_id,event.event_type,event.correlation_id,event.attempt_count
      `;
      return events.map((event) => ({
        eventRef: event.id,
        bookRef: event.book_id,
        eventType: event.event_type,
        correlationId: event.correlation_id,
        attemptCount: Number(event.attempt_count),
      }));
    });
  }

  async settleOutboxEvent(input: { eventRef: string; delivered: boolean; errorCode?: string }) {
    if (
      !safeReference(input.eventRef) ||
      (input.errorCode !== undefined && !safeReference(input.errorCode))
    )
      return { kind: "invalid" as const };
    const now = this.now();
    const updated = await this.sql<{ id: string; state: "pending" | "delivered" | "failed" }[]>`
      update bookkeeping_outbox
      set state=case
            when ${input.delivered} then 'delivered'
            when attempt_count>=3 then 'failed'
            else 'pending'
          end,
        claimed_at=null,
        delivered_at=${input.delivered ? now : null},
        last_error_code=${input.delivered ? null : (input.errorCode ?? "delivery_failed")}
      where id=${input.eventRef} and state='processing'
      returning id,state
    `;
    return updated[0]
      ? { kind: updated[0].state, eventRef: updated[0].id }
      : { kind: "not_found" as const };
  }

  async recoverStaleOutboxProcessing(staleAfterMs = 5 * 60_000) {
    if (!Number.isSafeInteger(staleAfterMs) || staleAfterMs < 1_000)
      return { kind: "invalid" as const };
    const now = this.now();
    const staleBefore = new Date(now.getTime() - staleAfterMs);
    const rows = await this.sql<{ id: string; state: "pending" | "failed" }[]>`
      update bookkeeping_outbox
      set state=case when attempt_count>=3 then 'failed' else 'pending' end,
        claimed_at=null,
        last_error_code='delivery_claim_expired'
      where state='processing' and claimed_at<${staleBefore}
      returning id,state
    `;
    return {
      kind: "recovered" as const,
      items: rows.map((row) => ({ eventRef: row.id, state: row.state })),
    };
  }

  async listAuthorizedBooks(input: { actor: BookkeepingActor }) {
    const rows = await this.sql<BookRow[]>`
      select id,accounting_entity_ref,accounting_basis,currency,fiscal_year_start_month,status,version,updated_at
      from accounting_books
      where owner_account_id=${input.actor.accountId} and context_ref=${input.actor.contextRef}
        and authorization_epoch=${Number(input.actor.authorizationEpoch)}
        and policy_epoch=${Number(input.actor.policyEpoch)}
      order by updated_at desc
    `;
    return rows.map((row) => ({
      bookRef: row.id,
      accountingEntityRef: row.accounting_entity_ref,
      accountingBasis: row.accounting_basis,
      currency: row.currency,
      fiscalYearStartMonth: row.fiscal_year_start_month,
      status: row.status,
      version: row.version,
      updatedAt: row.updated_at.toISOString(),
    }));
  }
}
