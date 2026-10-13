import { resolveService } from "@/services";

import type { OrdersService } from "./orders.contract";
import { httpOrdersService } from "./orders.http";
import { mockOrdersService } from "./orders.mock";

export const ordersService = resolveService<OrdersService>("orders", {
  mock: mockOrdersService,
  http: httpOrdersService,
});

export type { OrdersService } from "./orders.contract";
