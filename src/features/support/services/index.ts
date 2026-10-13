import { resolveService } from "@/services";

import type { SupportAdminService } from "./support.contract";
import { httpSupportAdminService } from "./support.http";
import { mockSupportAdminService } from "./support.mock";

export const supportAdminService = resolveService<SupportAdminService>("support", {
  mock: mockSupportAdminService,
  http: httpSupportAdminService,
});

export type { SupportAdminService } from "./support.contract";
