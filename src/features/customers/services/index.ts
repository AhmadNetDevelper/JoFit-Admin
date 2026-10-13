import { resolveService } from "@/services";

import type { CustomersService } from "./customers.contract";
import { httpCustomersService } from "./customers.http";
import { mockCustomersService } from "./customers.mock";

export const customersService = resolveService<CustomersService>("customers", {
  mock: mockCustomersService,
  http: httpCustomersService,
});

export type { CustomersService } from "./customers.contract";
