import { resolveService } from "@/services";

import type { RentalAdminService } from "./rental.contract";
import { httpRentalAdminService } from "./rental.http";
import { mockRentalAdminService } from "./rental.mock";

export const rentalAdminService = resolveService<RentalAdminService>("rental", {
  mock: mockRentalAdminService,
  http: httpRentalAdminService,
});

export type { RentalAdminService } from "./rental.contract";
