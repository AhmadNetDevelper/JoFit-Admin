import { resolveService } from "@/services";

import type { QuotationsAdminService } from "./quotations.contract";
import { httpQuotationsAdminService } from "./quotations.http";
import { mockQuotationsAdminService } from "./quotations.mock";

export const quotationsAdminService = resolveService<QuotationsAdminService>("quotations", {
  mock: mockQuotationsAdminService,
  http: httpQuotationsAdminService,
});

export type { QuotationsAdminService } from "./quotations.contract";
