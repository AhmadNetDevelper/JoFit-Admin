import { resolveService } from "@/services";

import type { SportsService } from "./sports.contract";
import { httpSportsService } from "./sports.http";
import { mockSportsService } from "./sports.mock";

export const sportsService = resolveService<SportsService>("sports", {
  mock: mockSportsService,
  http: httpSportsService,
});

export type { SportsService } from "./sports.contract";
