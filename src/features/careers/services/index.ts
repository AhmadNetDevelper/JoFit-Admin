import { resolveService } from "@/services";

import type { CareersAdminService } from "./careers.contract";
import { httpCareersAdminService } from "./careers.http";
import { mockCareersAdminService } from "./careers.mock";

export const careersAdminService = resolveService<CareersAdminService>("careers", {
  mock: mockCareersAdminService,
  http: httpCareersAdminService,
});

export type { CareersAdminService } from "./careers.contract";
