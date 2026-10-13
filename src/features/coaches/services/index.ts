import { resolveService } from "@/services";

import type { CoachesAdminService } from "./coaches.contract";
import { httpCoachesAdminService } from "./coaches.http";
import { mockCoachesAdminService } from "./coaches.mock";

export const coachesAdminService = resolveService<CoachesAdminService>("coaches", {
  mock: mockCoachesAdminService,
  http: httpCoachesAdminService,
});

export type { CoachesAdminService } from "./coaches.contract";
