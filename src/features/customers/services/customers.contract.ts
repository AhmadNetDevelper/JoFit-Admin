import type { Paginated } from "@/types";

import type { Customer, CustomerDraft, CustomerListQuery } from "../types";

export interface CustomersService {
  listCustomers(query?: CustomerListQuery): Promise<Paginated<Customer>>;
  getCustomer(id: string): Promise<Customer | null>;
  /** 422 for a missing name, a bad or taken email, or a malformed phone. */
  updateCustomer(id: string, draft: CustomerDraft): Promise<Customer>;
}
