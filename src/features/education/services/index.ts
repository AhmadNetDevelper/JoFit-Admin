import { resolveService } from "@/services";

import type { EducationAdminService } from "./education.contract";
import { httpEducationAdminService } from "./education.http";
import { mockEducationAdminService } from "./education.mock";

export const educationAdminService = resolveService<EducationAdminService>("education", {
  mock: mockEducationAdminService,
  http: httpEducationAdminService,
});

export type { EducationAdminService } from "./education.contract";
