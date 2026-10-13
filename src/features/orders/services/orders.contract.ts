import type { Paginated } from "@/types";

import type { Order, OrderListQuery, OrderStatus } from "../types";

export interface OrdersService {
  listOrders(query?: OrderListQuery): Promise<Paginated<Order>>;
  getOrder(id: string): Promise<Order | null>;
  /** Rejects transitions the status graph does not allow. */
  setOrderStatus(id: string, status: OrderStatus): Promise<Order>;
}
