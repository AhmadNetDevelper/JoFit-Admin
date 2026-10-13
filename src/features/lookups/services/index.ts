import { resolveService } from "@/services";

import type { LookupsService } from "./lookups.contract";
import { httpLookupsService } from "./lookups.http";
import { mockLookupsService } from "./lookups.mock";

export const lookupsService = resolveService<LookupsService>("lookups", {
  mock: mockLookupsService,
  http: httpLookupsService,
});

export type { LookupsService } from "./lookups.contract";
