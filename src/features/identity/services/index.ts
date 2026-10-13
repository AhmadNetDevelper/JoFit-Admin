import { resolveService } from "@/services";

import type { IdentityService } from "./identity.contract";
import { httpIdentityService } from "./identity.http";
import { mockIdentityService } from "./identity.mock";

export const identityService = resolveService<IdentityService>("identity", {
  mock: mockIdentityService,
  http: httpIdentityService,
});

export type { IdentityService } from "./identity.contract";
