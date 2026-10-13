import { adminListParams, httpClient, orNull } from "@/services";
import type { Paginated } from "@/types";

import type { QuotationRequest, QuotationStatus, QuotationSubjectKind } from "../types";
import type { QuotationsAdminService } from "./quotations.contract";

const enc = encodeURIComponent;

/** What `GET/PUT /v1/admin/quotation-requests*` actually answers — `AdminQuotationDto`. */
interface AdminQuotationDto {
  readonly id: number;
  readonly reference: string;
  readonly subjectKind: string;
  readonly organisationName: string;
  readonly contactName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly preferredContact: string;
  readonly message: string;
  readonly quantityEstimate: string | null;
  readonly budgetRange: string | null;
  readonly customerId: number | null;
  readonly status: string;
  readonly assigneeId: number | null;
  readonly assigneeName: string | null;
  readonly internalNote: string | null;
  readonly submittedAt: string;
}

function toQuotationRequest(dto: AdminQuotationDto): QuotationRequest {
  return {
    id: String(dto.id),
    reference: dto.reference,
    subjectKind: dto.subjectKind as QuotationSubjectKind,
    organisationName: dto.organisationName,
    contactName: dto.contactName,
    email: dto.email,
    phone: dto.phone ?? undefined,
    /* No live source at all — see the field's own doc comment in ../types. */
    sportIds: undefined,
    /* Live sends a free-text string (or null); parsed to the admin type's `number`. */
    quantityEstimate: dto.quantityEstimate != null ? Number(dto.quantityEstimate) : undefined,
    /* Can't reconstruct a structured MoneyRange from live's free-text string —
       kept raw instead (see ../types doc comment). */
    budgetRange: undefined,
    budgetRangeText: dto.budgetRange ?? undefined,
    message: dto.message,
    status: dto.status as QuotationStatus,
    assigneeId: dto.assigneeId != null ? String(dto.assigneeId) : null,
    assigneeName: dto.assigneeName ?? undefined,
    submittedAt: dto.submittedAt,
    internalNote: dto.internalNote ?? undefined,
    /* No live source at all — see the field's own doc comment in ../types. */
    audit: undefined,
    preferredContact: dto.preferredContact,
  };
}

/** The quotations inbox over `/v1/admin/quotation-requests`. */
export const httpQuotationsAdminService: QuotationsAdminService = {
  listRequests: async (query = {}) => {
    const page = await httpClient.get<Paginated<AdminQuotationDto>>("/v1/admin/quotation-requests", {
      query: {
        ...adminListParams(query),
        statuses: query.statuses,
        /* `subjectKinds`/`SubjectKinds` has no backing parameter on the live GET at
           all (checked docs/api-live/admin.json) — dropped rather than sent as a
           silent no-op. */
        /* Real bug fixed: live wants the plural `AssigneeIds` array, not a singular
           `assigneeId`. */
        assigneeIds: query.assigneeId ? [query.assigneeId] : undefined,
        unassignedOnly: query.unassignedOnly,
      },
      auth: true,
    });
    return { items: page.items.map(toQuotationRequest), meta: page.meta };
  },
  getRequest: async (id) => {
    const dto = await orNull(
      httpClient.get<AdminQuotationDto>(`/v1/admin/quotation-requests/${enc(id)}`, { auth: true }),
    );
    return dto ? toQuotationRequest(dto) : null;
  },
  assign: async (id, assigneeId) => {
    const dto = await httpClient.put<AdminQuotationDto>(
      `/v1/admin/quotation-requests/${enc(id)}/assignee`,
      { assigneeId },
      { auth: true },
    );
    return toQuotationRequest(dto);
  },
  setStatus: async (id, status, internalNote) => {
    const dto = await httpClient.put<AdminQuotationDto>(
      `/v1/admin/quotation-requests/${enc(id)}/status`,
      { status, internalNote },
      { auth: true },
    );
    return toQuotationRequest(dto);
  },
  deleteRequest: async (id) => {
    await httpClient.delete<void>(`/v1/admin/quotation-requests/${enc(id)}`, { auth: true });
  },
  countNew: async () =>
    (await httpClient.get<{ count: number }>("/v1/admin/quotation-requests/new-count", { auth: true })).count,
};
