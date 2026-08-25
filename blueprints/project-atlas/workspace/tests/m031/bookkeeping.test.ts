import {
  analyzeVariance,
  buildBalanceSheet,
  buildCashFlowSnapshot,
  buildGeneralLedger,
  buildImportBatch,
  buildProfitAndLoss,
  buildTrialBalance,
  classifyEconomicTransaction,
  compareProfitAndLoss,
  createAccountingBook,
  createBookkeepingAuditEvent,
  createBookkeepingCase,
  createBookkeepingEngagement,
  createBookkeepingTaxHandoff,
  createClientReportPackage,
  createClientTransactionQuestion,
  createCloseChecklist,
  createDisabledAccountingIntegration,
  createFinancialExportRequest,
  createOpeningBalanceDraft,
  createTransactionSplit,
  detectIntegrationConflict,
  detectPotentialDuplicates,
  evaluateAccountingIntegrationHealth,
  evaluateAiBookkeepingSuggestion,
  evaluateExternalPosting,
  evaluateIntegrationUse,
  evaluatePeriodClose,
  evaluateTaxReadyPackage,
  normalizeMerchant,
  postJournalEntry,
  proposeAdjustingJournalEntry,
  proposeCategorizationFromRules,
  proposeReceiptMatch,
  proposeTaxMapping,
  proposeTransactionClassification,
  proposeTransferMatch,
  reconcile,
  registerFinancialAccount,
  resolveAccountingIntegrationAuthority,
  sourceTransactionIdempotencyKey,
  transitionAccountingPeriod,
  validateChartOfAccounts,
  validateJournalEntry,
} from "@atlas/bookkeeping";
import { describe, expect, it } from "vitest";

describe("M031 bookkeeping foundation", () => {
  const draft = {
    entryId: "je-1",
    bookId: "book-1",
    periodId: "2026-08",
    periodStatus: "open" as const,
    status: "draft" as const,
    currency: "USD" as const,
    lines: [
      { accountCode: "CASH", debitMinor: 10000, creditMinor: 0 },
      { accountCode: "REVENUE", debitMinor: 0, creditMinor: 10000 },
    ],
  };
  it("posts only balanced double-entry drafts", () => {
    expect(validateJournalEntry(draft)).toEqual([]);
    expect(postJournalEntry(draft, "2026-08-25T00:00:00.000Z").status).toBe("posted");
    expect(
      validateJournalEntry({
        ...draft,
        lines: [
          { accountCode: "CASH", debitMinor: 10000, creditMinor: 0 },
          { accountCode: "REVENUE", debitMinor: 0, creditMinor: 9000 },
        ],
      }),
    ).toContain("journal_entry_must_balance");
  });
  it("prepares opening balances as balanced, evidence-linked drafts only", () => {
    const openingBalance = createOpeningBalanceDraft({
      entryId: "opening-1",
      bookId: "book-1",
      periodId: "2026-01",
      periodStatus: "open",
      currency: "USD",
      evidenceReference: "opening-statement-2026-01",
      lines: [
        { accountCode: "CASH", debitMinor: 50000, creditMinor: 0 },
        { accountCode: "OWNER_EQUITY", debitMinor: 0, creditMinor: 50000 },
      ],
    });
    expect(openingBalance).toMatchObject({
      status: "draft",
      sourceReference: "opening_balance:opening-statement-2026-01",
    });
    expect(() => postJournalEntry(openingBalance, "2026-01-01T00:00:00.000Z")).not.toThrow();
  });
  it("prepares adjusting entries with evidence and human approval, never automatic posting", () => {
    expect(
      proposeAdjustingJournalEntry({
        entry: {
          entryId: "adjustment-1",
          bookId: "book-1",
          periodId: "2026-01",
          periodStatus: "open",
          status: "draft",
          currency: "USD",
          lines: [
            { accountCode: "EXPENSE", debitMinor: 1000, creditMinor: 0 },
            { accountCode: "ACCRUAL", debitMinor: 0, creditMinor: 1000 },
          ],
        },
        adjustmentReason: "Accrual correction",
        evidenceReference: "evidence-1",
      }),
    ).toMatchObject({
      adjustmentReason: "Accrual correction",
      evidenceReference: "evidence-1",
      requiresHumanApproval: true,
      canPostAutomatically: false,
      entry: { status: "proposed", sourceReference: "adjustment:evidence-1" },
    });
  });
  it("keeps classifications as reviewable proposals", () => {
    const transaction = {
      sourceId: "source-1",
      accountReference: "account-1",
      occurredOn: "2026-08-25",
      amountMinor: 2000,
      currency: "USD" as const,
      direction: "outflow" as const,
      description: "Office supply",
      pending: false,
    };
    expect(proposeTransactionClassification(transaction, "OFFICE_EXPENSE", 0.99)).toMatchObject({
      classification: "proposed",
      requiresHumanReview: true,
    });
    expect(sourceTransactionIdempotencyKey(transaction)).toContain("source-1");
  });
  it("normalizes merchants and applies deterministic categorization rules as review-only proposals", () => {
    const transaction = {
      sourceId: "source-merchant-1",
      accountReference: "account-1",
      occurredOn: "2026-08-25",
      amountMinor: 2000,
      currency: "USD" as const,
      direction: "outflow" as const,
      description: "Acme Office Supplies",
      pending: false,
    };
    const merchant = normalizeMerchant({
      description: transaction.description,
      aliases: { "ACME OFFICE SUPPLIES": "ACME" },
    });
    expect(
      proposeCategorizationFromRules({
        transaction,
        merchant,
        rules: [
          {
            ruleId: "rule-1",
            priority: 10,
            match: "merchant_equals",
            expectedValue: "ACME",
            accountCode: "OFFICE_EXPENSE",
            active: true,
          },
        ],
      }),
    ).toMatchObject({
      classification: "proposed",
      suggestedAccountCode: "OFFICE_EXPENSE",
      requiresHumanReview: true,
    });
    expect(classifyEconomicTransaction({ direction: "inflow", hint: "loan_proceeds" })).toBe(
      "loan_proceeds",
    );
    expect(classifyEconomicTransaction({ direction: "outflow", hint: "loan_proceeds" })).toBe(
      "unknown",
    );
    expect(
      createClientTransactionQuestion({
        questionId: "question-1",
        sourceTransactionId: transaction.sourceId,
        prompt: "Please confirm the business purpose.",
      }),
    ).toMatchObject({ status: "open", requiresHumanReview: true });
  });
  it("does not close a reconciliation automatically", () => {
    expect(
      reconcile({
        statementEndingBalanceMinor: 10000,
        clearedLedgerBalanceMinor: 10000,
        outstandingDebitMinor: 0,
        outstandingCreditMinor: 0,
      }),
    ).toMatchObject({ status: "review_required" });
  });
  it("requires controls before tax handoff and never authorizes filing", () => {
    const readiness = evaluateTaxReadyPackage({
      periodsHardClosed: true,
      reconciliationsComplete: true,
      suspenseBalanceMinor: 0,
      humanReviewCompleted: true,
    });
    expect(readiness).toMatchObject({ state: "ready_for_tax_team" });
    expect(
      proposeTaxMapping({ accountCode: "OFFICE_EXPENSE", taxCategoryReference: "tax-category-1" }),
    ).toEqual({
      accountCode: "OFFICE_EXPENSE",
      taxCategoryReference: "tax-category-1",
      status: "review_required",
      canDetermineDeductibility: false,
    });
    expect(createBookkeepingTaxHandoff({ taxCaseReference: "tax-case-1", readiness })).toEqual({
      taxCaseReference: "tax-case-1",
      status: "ready_for_review",
      canFileTaxReturn: false,
    });
  });
  it("fails closed for external accounting integrations", () => {
    expect(
      evaluateIntegrationUse({
        providerCode: "quickbooks",
        status: "disabled",
        secretReferenceConfigured: false,
        ownerApproved: false,
        killSwitchEnabled: true,
      }),
    ).toContain("integration_disabled");
  });
  it("keeps the internal ledger as the only source of truth until a provider gate is approved", () => {
    const integration = createDisabledAccountingIntegration({
      integrationId: "integration-1",
      accountingBookId: "book-1",
      providerType: "quickbooks_online",
    });
    expect(integration).toMatchObject({
      sourceOfTruth: "sg_solutions",
      syncMode: "manual_sync",
      status: "not_connected",
      killSwitchEnabled: true,
      providerActivationAllowed: false,
    });
    expect(resolveAccountingIntegrationAuthority(integration)).toEqual({
      sourceOfTruth: "sg_solutions",
      canReadExternal: false,
      canWriteExternal: false,
      canSynchronize: false,
    });
  });
  it("builds reproducible balanced reports and requires close review", () => {
    const posted = postJournalEntry(draft, "2026-08-25T00:00:00.000Z");
    const balance = buildTrialBalance(
      [posted],
      [
        { code: "CASH", name: "Cash", category: "asset", active: true, systemAccount: true },
        {
          code: "REVENUE",
          name: "Revenue",
          category: "income",
          active: true,
          systemAccount: false,
        },
      ],
    );
    expect(balance).toMatchObject({
      balanced: true,
      totalDebitMinor: 10000,
      totalCreditMinor: 10000,
    });
    expect(buildProfitAndLoss(balance)).toMatchObject({ netIncomeMinor: 10000 });
    expect(
      evaluatePeriodClose({
        reconciliationsComplete: true,
        suspenseBalanceMinor: 0,
        reviewFindingsResolved: true,
        humanReviewCompleted: false,
      }),
    ).toMatchObject({ state: "blocked" });
  });
  it("builds bounded cash-flow and comparative reports without deciding an action", () => {
    expect(
      buildCashFlowSnapshot({
        operatingCashFlowMinor: 12000,
        investingCashFlowMinor: -3000,
        financingCashFlowMinor: 5000,
      }),
    ).toMatchObject({ netCashFlowMinor: 14000 });
    expect(
      compareProfitAndLoss(
        { incomeMinor: 25000, expenseMinor: 10000, netIncomeMinor: 15000 },
        { incomeMinor: 20000, expenseMinor: 10000, netIncomeMinor: 10000 },
      ),
    ).toMatchObject({ netIncomeVarianceMinor: 5000, requiresHumanReview: true });
    expect(
      analyzeVariance({ currentMinor: 15000, priorMinor: 10000, materialityMinor: 2000 }),
    ).toMatchObject({ varianceMinor: 5000, state: "review_required", requiresHumanReview: true });
    expect(
      createClientReportPackage({
        reportPackageId: "report-package-1",
        accountingBookId: "book-1",
        reportReferences: ["trial-balance-1", "profit-loss-1", "trial-balance-1"],
      }),
    ).toEqual({
      reportPackageId: "report-package-1",
      accountingBookId: "book-1",
      reportReferences: ["trial-balance-1", "profit-loss-1"],
      status: "review_required",
      clientVisible: false,
      canExportExternally: false,
    });
  });
  it("makes imports idempotent and only proposes duplicate or receipt actions", () => {
    const batch = buildImportBatch({
      bookId: "book-1",
      accountRegistryId: "account-1",
      source: "csv",
      sourceDigest: "sha256:import",
      importedTransactionCount: 2,
      duplicateCandidateCount: 2,
    });
    const duplicates = detectPotentialDuplicates([
      {
        id: "source-1",
        accountRegistryId: "account-1",
        postedOn: "2026-08-01",
        amountMinor: -1250,
        currency: "USD",
        normalizedDescription: "Office supply",
      },
      {
        id: "source-2",
        accountRegistryId: "account-1",
        postedOn: "2026-08-01",
        amountMinor: -1250,
        currency: "USD",
        normalizedDescription: "office supply",
      },
    ]);
    const receipt = proposeReceiptMatch({
      sourceTransactionId: "source-1",
      receiptDocumentId: "document-1",
      confidence: 0.98,
    });
    expect(batch.status).toBe("review_required");
    expect(batch.idempotencyKey).toContain("sha256:import");
    expect(duplicates).toEqual([
      {
        duplicateCandidateIds: ["source-1", "source-2"],
        requiresHumanReview: true,
        automaticDeletionAllowed: false,
      },
    ]);
    expect(receipt.status).toBe("requires_review");
    expect(receipt.requiresHumanReview).toBe(true);
  });
  it("keeps a bookkeeping engagement provider-disabled until setup is reviewed", () => {
    expect(
      createBookkeepingEngagement({
        engagementId: "engagement-1",
        clientId: "client-1",
        accountingEntityId: "entity-1",
        serviceType: "monthly_bookkeeping",
        bookkeepingFrequency: "monthly",
        accountingBasis: "cash",
        bookStartOn: "2026-01-01",
        fiscalYearEndMonth: 12,
        reportingFrequency: "monthly",
      }),
    ).toMatchObject({
      status: "setup_in_progress",
      providerConnectionsEnabled: false,
      taxIntegrationEnabled: false,
      requiresHumanSetupReview: true,
    });
  });
  it("creates isolated accounting books and limited-scope bookkeeping cases", () => {
    expect(
      createAccountingBook({
        bookId: "book-1",
        accountingEntityId: "entity-1",
        accountingBasis: "cash",
        fiscalYearStartMonth: 1,
      }),
    ).toEqual({
      bookId: "book-1",
      accountingEntityId: "entity-1",
      accountingBasis: "cash",
      currency: "USD",
      fiscalYearStartMonth: 1,
      status: "setup",
    });
    expect(
      createBookkeepingCase({
        caseId: "case-1",
        caseNumber: "BK-0001",
        engagementId: "engagement-1",
        accountingEntityId: "entity-1",
        accountingBookId: "book-1",
      }),
    ).toMatchObject({ status: "setup_pending", operationalPostingAllowed: false });
  });
  it("registers financial accounts without creating an external connection", () => {
    expect(
      registerFinancialAccount({
        id: "financial-account-1",
        bookId: "book-1",
        accountName: "Operating checking",
        accountType: "bank",
      }),
    ).toEqual({
      id: "financial-account-1",
      bookId: "book-1",
      accountName: "Operating checking",
      accountType: "bank",
      currency: "USD",
      providerConnectionStatus: "not_connected",
      active: true,
    });
  });
  it("rejects unsafe chart configurations and prevents hard closing with open differences", () => {
    expect(
      validateChartOfAccounts([
        { code: "CASH", name: "Cash", category: "asset", active: true, systemAccount: true },
        {
          code: "CASH",
          name: "Cash duplicate",
          category: "asset",
          active: true,
          systemAccount: false,
        },
      ]),
    ).toContain("chart_account_codes_must_be_unique");
    expect(
      transitionAccountingPeriod({
        currentStatus: "open",
        targetStatus: "hard_closed",
        closeReviewApproved: true,
        unresolvedReconciliationDifferences: 1,
        hardCloseApprovalGranted: true,
      }),
    ).toEqual({ allowed: false, reason: "RECONCILIATION_DIFFERENCES_OPEN" });
  });
  it("keeps close checklists and accounting integration health under human control", () => {
    expect(
      createCloseChecklist({
        periodId: "period-1",
        requiredItems: [
          { code: "reconcile", completed: true },
          { code: "review", completed: false },
        ],
      }),
    ).toMatchObject({ state: "blocked", blockers: ["review"] });
    expect(
      evaluateAccountingIntegrationHealth({
        providerCode: "xero",
        status: "disabled",
        lastSyncState: "not_started",
        killSwitchEnabled: true,
      }),
    ).toEqual({ state: "disabled", canSync: false });
  });
  it("keeps bookkeeping audit evidence free of financial payloads", () => {
    expect(
      createBookkeepingAuditEvent({
        eventType: "period_close_review_requested",
        actorReference: "staff-1",
        resourceReference: "period-1",
        correlationId: "corr-1",
      }),
    ).toEqual({
      eventType: "period_close_review_requested",
      actorReference: "staff-1",
      resourceReference: "period-1",
      correlationId: "corr-1",
      financialPayloadIncluded: false,
    });
  });
  it("builds a balanced balance sheet and general ledger from posted entries", () => {
    const posted = postJournalEntry(draft, "2026-08-25T00:00:00.000Z");
    const accounts = [
      { code: "CASH", name: "Cash", category: "asset", active: true, systemAccount: true },
      { code: "REVENUE", name: "Revenue", category: "income", active: true, systemAccount: false },
      {
        code: "OWNER_EQUITY",
        name: "Owner equity",
        category: "equity",
        active: true,
        systemAccount: false,
      },
    ] as const;
    const ledger = buildGeneralLedger([posted]);
    const balanceSheet = buildBalanceSheet(
      buildTrialBalance(
        [
          posted,
          postJournalEntry(
            {
              ...draft,
              entryId: "je-2",
              lines: [
                { accountCode: "CASH", debitMinor: 5000, creditMinor: 0 },
                { accountCode: "OWNER_EQUITY", debitMinor: 0, creditMinor: 5000 },
              ],
            },
            "2026-08-25T00:00:00.000Z",
          ),
        ],
        accounts,
      ),
    );
    expect(ledger).toHaveLength(2);
    expect(balanceSheet).toMatchObject({
      assetMinor: 15000,
      liabilityMinor: 0,
      equityMinor: 5000,
      balanced: true,
    });
  });
  it("requires review for transaction splits and transfer matches", () => {
    expect(
      createTransactionSplit({
        sourceTransactionId: "source-1",
        sourceAmountMinor: -10000,
        allocations: [
          { accountCode: "OFFICE_EXPENSE", amountMinor: -6000 },
          { accountCode: "SOFTWARE_EXPENSE", amountMinor: -4000 },
        ],
      }),
    ).toMatchObject({ status: "review_required", requiresHumanReview: true });
    expect(
      proposeTransferMatch({
        first: { sourceId: "source-1", amountMinor: 10000, direction: "outflow" },
        second: { sourceId: "source-2", amountMinor: 10000, direction: "inflow" },
      }),
    ).toEqual({
      status: "proposed",
      sourceTransactionIds: ["source-1", "source-2"],
      requiresHumanReview: true,
    });
  });
  it("limits AI bookkeeping output to a reviewable suggestion", () => {
    expect(
      evaluateAiBookkeepingSuggestion({
        suggestionType: "category",
        confidence: 0.99,
      }),
    ).toEqual({
      state: "requires_human_review",
      canPost: false,
      canDetermineTaxDeductibility: false,
    });
  });
  it("blocks financial exports until MFA and human approval are present", () => {
    expect(
      createFinancialExportRequest({
        requesterReference: "staff-1",
        purpose: "client_requested_copy",
        mfaVerified: false,
        humanApprovalGranted: false,
      }),
    ).toEqual({ state: "blocked", reason: "MFA_REQUIRED" });
  });
  it("blocks external posting and protects hard-closed periods from sync conflicts", () => {
    expect(
      evaluateExternalPosting({
        providerCode: "quickbooks",
        integrationEnabled: true,
        humanApprovalGranted: true,
      }),
    ).toEqual({ allowed: false, reason: "EXTERNAL_POSTING_DISABLED" });
    expect(
      detectIntegrationConflict({
        periodStatus: "hard_closed",
        incomingChangeReference: "remote-change-1",
      }),
    ).toEqual({ state: "blocked", reason: "HARD_CLOSED_PERIOD_PROTECTED" });
  });
});
