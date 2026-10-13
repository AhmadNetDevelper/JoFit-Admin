import { resolveService } from "@/services";

import type { ContentAdminService } from "./content.contract";
import { httpContentAdminService } from "./content.http";
import { mockContentAdminService } from "./content.mock";

export const contentAdminService = resolveService<ContentAdminService>("content", {
  mock: mockContentAdminService,
  http: httpContentAdminService,
});

export type { ContentAdminService } from "./content.contract";
