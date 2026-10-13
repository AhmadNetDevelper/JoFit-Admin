import { AppError, notFound, nowIso, paginate } from "@/lib";
import { pushToStorefront } from "@/mocks/bridge";
import { mockOrders } from "@/mocks/orders";
import { matchesText, simulateLatency, sortRows } from "@/mocks/runtime";

import { allowedTransitions, type Order, type OrderListQuery, type OrderSortField } from "../types";
import type { OrdersService } from "./orders.contract";

function selectSortValue(order: Order, field: OrderSortField): unknown {
  switch (field) {
    case "reference":
      return order.reference;
    case "placedAt":
      return order.placedAt;
    case "status":
      return order.status;
    case "grandTotal":
      return order.grandTotal.amount;
  }
}

function applyFilters(query: OrderListQuery): Order[] {
  return mockOrders.filter((order) => {
    if (!matchesText([order.reference, order.customer.name, order.customer.email], query.search)) {
      return false;
    }
    if (query.statuses?.length && !query.statuses.includes(order.status)) return false;
    if (query.customerId && order.customer.id !== query.customerId) return false;
    if (query.placedBetween) {
      const day = order.placedAt.slice(0, 10);
      if (day < query.placedBetween.from || day > query.placedBetween.to) return false;
    }
    return true;
  });
}

export const mockOrdersService: OrdersService = {
  async listOrders(query = {}) {
    await simulateLatency();
    const filtered = applyFilters(query);
    const sorted = query.sort
      ? sortRows(filtered, (order) => selectSortValue(order, query.sort!.field), query.sort.direction)
      : sortRows(filtered, (order) => order.placedAt, "desc");
    return paginate(sorted, query);
  },

  async getOrder(id) {
    await simulateLatency();
    return mockOrders.find((order) => order.id === id) ?? null;
  },

  async setOrderStatus(id, status) {
    await simulateLatency();
    const index = mockOrders.findIndex((order) => order.id === id);
    const order = mockOrders[index];
    if (!order) throw notFound(`Order "${id}"`);

    if (!allowedTransitions(order.status).includes(status)) {
      throw new AppError(
        "conflict",
        `An order that is "${order.status}" cannot move to "${status}".`,
      );
    }

    const updated: Order = {
      ...order,
      status,
      audit: { ...order.audit, updatedAt: nowIso(), updatedBy: "admin-5" },
    };
    mockOrders[index] = updated;
    pushToStorefront("order", id, { status });
    return updated;
  },
};
