import { resolveService } from "@/services";

import type { CatalogueService } from "./catalogue.contract";
import { httpCatalogueService } from "./catalogue.http";
import { mockCatalogueService } from "./catalogue.mock";

export const catalogueService = resolveService<CatalogueService>("catalogue", {
  mock: mockCatalogueService,
  http: httpCatalogueService,
});

export type { CatalogueService } from "./catalogue.contract";
