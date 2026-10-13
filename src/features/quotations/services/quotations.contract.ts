import type { Paginated } from "@/types";

import type { QuotationListQuery, QuotationRequest, QuotationStatus } from "../types";

export interface QuotationsAdminService {
  listRequests(query?: QuotationListQuery): Promise<Paginated<QuotationRequest>>;
  getRequest(id: string): Promise<QuotationRequest | null>;
  assign(id: string, assigneeId: string | null): Promise<QuotationRequest>;
  setStatus(id: string, status: QuotationStatus, internalNote?: string): Promise<QuotationRequest>;
  /** For spam and duplicates. A request that went nowhere is marked `lost`, which keeps it on record. */
  deleteRequest(id: string): Promise<void>;
  countNew(): Promise<number>;
}
