import { resolveService } from "@/services";

import type { CommunityAdminService } from "./community.contract";
import { httpCommunityAdminService } from "./community.http";
import { mockCommunityAdminService } from "./community.mock";

export const communityAdminService = resolveService<CommunityAdminService>("community", {
  mock: mockCommunityAdminService,
  http: httpCommunityAdminService,
});

export type { CommunityAdminService } from "./community.contract";
