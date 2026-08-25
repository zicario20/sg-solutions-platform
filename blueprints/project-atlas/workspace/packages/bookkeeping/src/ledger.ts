import type {
  AdjustingJournalEntryProposal,
  JournalEntryDraft,
  JournalEntryLine,
  PostedJournalEntry,
} from "./contracts.ts";

function validMinor(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
function validLine(line: JournalEntryLine): boolean {
  return (
    validMinor(line.debitMinor) &&
    validMinor(line.creditMinor) &&
    (line.debitMinor === 0) !== (line.creditMinor === 0) &&
    line.accountCode.trim().length > 0
  );
}

export function validateJournalEntry(entry: JournalEntryDraft): readonly string[] {
  const blockers: string[] = [];
  if (entry.status !== "draft" && entry.status !== "proposed")
    blockers.push("only_draft_or_proposed_entries_can_be_posted");
  if (entry.periodStatus === "hard_closed") blockers.push("hard_closed_period");
  if (entry.lines.length < 2 || entry.lines.some((line) => !validLine(line)))
    blockers.push("valid_double_entry_lines_required");
  const debitTotal = entry.lines.reduce((sum, line) => sum + line.debitMinor, 0);
  const creditTotal = entry.lines.reduce((sum, line) => sum + line.creditMinor, 0);
  if (debitTotal !== creditTotal) blockers.push("journal_entry_must_balance");
  return Object.freeze(blockers);
}

export function postJournalEntry(entry: JournalEntryDraft, postedAt: string): PostedJournalEntry {
  const blockers = validateJournalEntry(entry);
  if (blockers.length > 0) throw new Error(`JOURNAL_POSTING_BLOCKED:${blockers.join(",")}`);
  return Object.freeze({
    ...entry,
    status: "posted",
    postedAt,
    lines: Object.freeze(entry.lines.map((line) => Object.freeze({ ...line }))),
  });
}

export function createOpeningBalanceDraft(
  input: Omit<JournalEntryDraft, "status" | "sourceReference"> & { evidenceReference: string },
): JournalEntryDraft {
  if (!input.evidenceReference.trim()) throw new Error("OPENING_BALANCE_EVIDENCE_REQUIRED");
  if (input.periodStatus !== "open") throw new Error("OPENING_BALANCE_OPEN_PERIOD_REQUIRED");
  const draft: JournalEntryDraft = {
    ...input,
    status: "draft",
    sourceReference: `opening_balance:${input.evidenceReference}`,
  };
  const blockers = validateJournalEntry(draft);
  if (blockers.length > 0) throw new Error(`OPENING_BALANCE_BLOCKED:${blockers.join(",")}`);
  return Object.freeze({
    ...draft,
    lines: Object.freeze(draft.lines.map((line) => Object.freeze({ ...line }))),
  });
}

export function proposeAdjustingJournalEntry(input: {
  entry: JournalEntryDraft;
  adjustmentReason: string;
  evidenceReference: string;
}): AdjustingJournalEntryProposal {
  if (!input.adjustmentReason.trim() || !input.evidenceReference.trim())
    throw new Error("ADJUSTING_ENTRY_EVIDENCE_AND_REASON_REQUIRED");
  if (input.entry.periodStatus !== "open") throw new Error("ADJUSTING_ENTRY_OPEN_PERIOD_REQUIRED");
  const draft: JournalEntryDraft = {
    ...input.entry,
    status: "proposed",
    sourceReference: `adjustment:${input.evidenceReference}`,
  };
  const blockers = validateJournalEntry(draft);
  if (blockers.length > 0) throw new Error(`ADJUSTING_ENTRY_BLOCKED:${blockers.join(",")}`);
  return {
    entry: Object.freeze({
      ...draft,
      lines: Object.freeze(draft.lines.map((line) => Object.freeze({ ...line }))),
    }),
    adjustmentReason: input.adjustmentReason.trim(),
    evidenceReference: input.evidenceReference.trim(),
    requiresHumanApproval: true,
    canPostAutomatically: false,
  };
}

export function canReopenPeriod(
  status: "soft_closed" | "hard_closed",
  approvalGranted: boolean,
): boolean {
  return status === "soft_closed" && approvalGranted;
}
