import { notFound, paginate, validationFailed } from "@/lib";
import { pushToStorefront } from "@/mocks/bridge";
import { buildCustomers } from "@/mocks/customers";
import { mockPeople } from "@/mocks/people";
import { matchesText, simulateLatency, sortRows } from "@/mocks/runtime";

import type { Customer, CustomerDraft, CustomerSortField } from "../types";
import type { CustomersService } from "./customers.contract";

function selectSortValue(customer: Customer, field: CustomerSortField): unknown {
  switch (field) {
    case "name":
      return customer.name;
    case "orderCount":
      return customer.orderCount;
    case "lifetimeValue":
      return customer.lifetimeValue.amount;
    case "lastOrderAt":
      return customer.lastOrderAt ?? "";
    case "createdAt":
      return customer.audit.createdAt;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(draft: CustomerDraft, id: string): CustomerDraft {
  const clean = {
    name: draft.name.trim().replace(/\s+/g, " "),
    email: draft.email.trim().toLowerCase(),
    phone: draft.phone?.trim() || undefined,
    locale: draft.locale,
    marketingOptIn: draft.marketingOptIn,
  };
  const errors: Record<string, string> = {};
  if (clean.name.length < 3) errors.name = "Their first and last name.";
  if (!EMAIL.test(clean.email)) errors.email = "A valid email address.";
  else if (mockPeople.some((person) => person.email.toLowerCase() === clean.email && person.id !== id)) {
    errors.email = "Another customer already uses this email.";
  }
  if (clean.phone && !/^\+?[\d\s]{8,}$/.test(clean.phone)) errors.phone = "Digits only, at least eight.";
  if (clean.locale !== "en" && clean.locale !== "ar") errors.locale = "English or Arabic.";
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  return clean;
}

export const mockCustomersService: CustomersService = {
  async listCustomers(query = {}) {
    await simulateLatency();
    const filtered = buildCustomers().filter((customer) => {
      if (!matchesText([customer.name, customer.email, customer.phone, customer.city], query.search)) {
        return false;
      }
      if (query.marketingOptInOnly && !customer.preferences.marketingOptIn) return false;
      return true;
    });
    const sorted = query.sort
      ? sortRows(filtered, (c) => selectSortValue(c, query.sort!.field), query.sort.direction)
      : filtered;
    return paginate(sorted, query);
  },

  async getCustomer(id) {
    await simulateLatency();
    return buildCustomers().find((customer) => customer.id === id) ?? null;
  },

  async updateCustomer(id, draft) {
    await simulateLatency();
    const index = mockPeople.findIndex((person) => person.id === id);
    if (index < 0) throw notFound(`Customer "${id}"`);
    const clean = validate(draft, id);
    mockPeople[index] = { ...mockPeople[index]!, ...clean };
    /* The storefront holds the account the customer signs in with. */
    pushToStorefront("customer", id, { ...clean });
    return buildCustomers().find((customer) => customer.id === id)!;
  },
};
