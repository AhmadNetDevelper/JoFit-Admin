import { notFound, nowIso, paginate, validationFailed } from "@/lib";
import { pushToStorefront } from "@/mocks/bridge";
import { mockQuotationRequests } from "@/mocks/quotations";
import { matchesText, simulateLatency, sortRows } from "@/mocks/runtime";

import type { QuotationRequest, QuotationSortField } from "../types";
import type { QuotationsAdminService } from "./quotations.contract";

function requireRequest(id: string): { request: QuotationRequest; index: number } {
  const index = mockQuotationRequests.findIndex((entry) => entry.id === id);
  const request = mockQuotationRequests[index];
  if (!request) throw notFound(`Quotation request "${id}"`);
  return { request, index };
}

function selectSortValue(request: QuotationRequest, field: QuotationSortField): unknown {
  switch (field) {
    case "reference":
      return request.reference;
    case "submittedAt":
      return request.submittedAt;
    case "status":
      return request.status;
    case "organisationName":
      return request.organisationName;
  }
}

export const mockQuotationsAdminService: QuotationsAdminService = {
  async listRequests(query = {}) {
    await simulateLatency();
    const filtered = mockQuotationRequests.filter((request) => {
      if (!matchesText([request.reference, request.organisationName, request.contactName, request.email], query.search)) {
        return false;
      }
      if (query.statuses?.length && !query.statuses.includes(request.status)) return false;
      if (query.subjectKinds?.length && !query.subjectKinds.includes(request.subjectKind)) return false;
      if (query.unassignedOnly && request.assigneeId !== null) return false;
      if (query.assigneeId && request.assigneeId !== query.assigneeId) return false;
      return true;
    });
    const sorted = query.sort
      ? sortRows(filtered, (r) => selectSortValue(r, query.sort!.field), query.sort.direction)
      : sortRows(filtered, (r) => r.submittedAt, "desc");
    return paginate(sorted, query);
  },

  async getRequest(id) {
    await simulateLatency();
    return mockQuotationRequests.find((request) => request.id === id) ?? null;
  },

  async assign(id, assigneeId) {
    await simulateLatency();
    const { request, index } = requireRequest(id);
    const updated: QuotationRequest = {
      ...request,
      assigneeId,
      // Picking a request up moves it out of the new queue.
      status: assigneeId && request.status === "new" ? "in-review" : request.status,
      /* `audit` is optional only because the live HTTP adapter has no source for
         it; every mock fixture always has one. */
      audit: { ...request.audit!, updatedAt: nowIso(), updatedBy: "admin-5" },
    };
    mockQuotationRequests[index] = updated;
    pushToStorefront("quotation", id, { assigneeId, status: updated.status });
    return updated;
  },

  async setStatus(id, status, internalNote) {
    await simulateLatency();
    if (status === "lost" && !internalNote?.trim()) {
      throw validationFailed({ internalNote: "Record why this was lost." });
    }
    const { request, index } = requireRequest(id);
    const updated: QuotationRequest = {
      ...request,
      status,
      internalNote: internalNote?.trim() || request.internalNote,
      audit: { ...request.audit!, updatedAt: nowIso(), updatedBy: "admin-5" },
    };
    mockQuotationRequests[index] = updated;
    pushToStorefront("quotation", id, { status, internalNote: updated.internalNote });
    return updated;
  },

  async deleteRequest(id) {
    await simulateLatency();
    const { index } = requireRequest(id);
    mockQuotationRequests.splice(index, 1);
    /* The storefront holds the copy the dev bridge mirrors; without this the
       request would come back on the next poll. */
    pushToStorefront("quotation", id, {}, "delete");
  },

  async countNew() {
    await simulateLatency();
    return mockQuotationRequests.filter((request) => request.status === "new").length;
  },
};
