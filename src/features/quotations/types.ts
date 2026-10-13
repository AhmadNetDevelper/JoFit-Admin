import type { SportId } from "@/features/sports";
import type { AuditInfo, ListQuery, MoneyRange } from "@/types";

/**
 * The admin side of quotations is an INBOX, not a workflow engine.
 *
 * Staff can read a request, assign it and record where it got to. What the
 * platform does *next* — pricing, approval steps, SLAs, whether a quotation
 * converts into an order — is an OPEN BUSINESS DECISION, so no such step is
 * modelled here.
 */
export type QuotationSubjectKind =
  | "gym-equipment"
  | "facility"
  | "bulk-order"
  | "custom-equipment"
  | "corporate";

export const QUOTATION_STATUSES = ["new", "in-review", "quoted", "won", "lost"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export interface QuotationRequest {
  readonly id: string;
  readonly reference: string;
  readonly subjectKind: QuotationSubjectKind;
  readonly organisationName: string;
  readonly contactName: string;
  readonly email: string;
  readonly phone?: string;
  /** Live `AdminQuotationDto` has no `sportIds` at all — optional, never populated from the API. */
  readonly sportIds?: readonly SportId[];
  readonly quantityEstimate?: number;
  /**
   * Live `AdminQuotationDto.budgetRange` is a free-text `string | null`, not a
   * structured range — there is no reliable way to parse it back into a
   * `MoneyRange`. Kept for the mock/local-only path; the HTTP adapter never
   * populates it and stores the raw live string in `budgetRangeText` instead.
   */
  readonly budgetRange?: MoneyRange;
  /** The live API's raw `budgetRange` string, when the data came from `httpQuotationsAdminService`. */
  readonly budgetRangeText?: string;
  readonly message: string;
  readonly status: QuotationStatus;
  /** Admin user id, or `null` when nobody has picked it up. */
  readonly assigneeId: string | null;
  /** The assignee's display name, straight off `AdminQuotationDto.assigneeName` — so the UI can show who it is, not just their id. `undefined` when unassigned. */
  readonly assigneeName?: string;
  readonly submittedAt: string;
  readonly internalNote?: string;
  /** Live `AdminQuotationDto` has no `audit` field at all — optional, never populated from the API. */
  readonly audit?: AuditInfo;
  /** Live-only field (`AdminQuotationDto.preferredContact`); no admin-type consumer yet. */
  readonly preferredContact?: string;
}

export const QUOTATION_SORT_FIELDS = ["reference", "submittedAt", "status", "organisationName"] as const;
export type QuotationSortField = (typeof QUOTATION_SORT_FIELDS)[number];

export interface QuotationListQuery extends ListQuery<QuotationSortField> {
  readonly statuses?: readonly QuotationStatus[];
  readonly subjectKinds?: readonly QuotationSubjectKind[];
  readonly assigneeId?: string;
  readonly unassignedOnly?: boolean;
}
