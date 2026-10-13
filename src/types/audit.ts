/**
 * Who changed what, and when.
 *
 * Every entity the admin can edit carries this. It is a genuinely shared concept
 * rather than a `BaseEntity` catch-all: it exists because staff actions must be
 * attributable, and it is absent from the storefront's models entirely — the
 * public never sees it.
 */
export interface AuditInfo {
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
}

/** Editorial lifecycle shared by products, courses, articles and posts. */
export type PublishStatus = "draft" | "published" | "archived";
