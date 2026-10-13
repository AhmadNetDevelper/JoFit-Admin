import type { Locale } from "@/i18n/locales";
import { adminListParams, httpClient, orNull } from "@/services";
import type { Paginated } from "@/types";

import type { Customer } from "../types";
import type { CustomersService } from "./customers.contract";

/**
 * The wire shape of `GET /v1/admin/customers` and `GET /v1/admin/customers/{id}`
 * (`AdminCustomerDto` in the live spec): ids are numeric, `locale`/`marketingOptIn`
 * sit flat on the record rather than nested under `preferences`, and there is no
 * `addresses` field at all.
 */
interface AdminCustomerActivityDto {
  readonly orders: number;
  readonly rentalBookings: number;
  readonly coachBookings: number;
  readonly enrolments: number;
  readonly reviews: number;
  readonly communityPosts: number;
}

interface AdminCustomerDto {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly locale: string;
  readonly marketingOptIn: boolean;
  readonly city: string | null;
  readonly orderCount: number;
  readonly lifetimeValue: { readonly amount: number; readonly currency?: string };
  readonly lastOrderAt: string | null;
  readonly lastActiveAt: string | null;
  readonly activity: AdminCustomerActivityDto;
  readonly createdAt: string;
}

/** The live pagination envelope: flat fields plus a `meta` that mirrors `PageMeta` 1:1. */
interface AdminPagedResult<TDto> {
  readonly items: readonly TDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
  readonly meta?: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
}

function toPaginated<TDto, TDomain>(
  raw: AdminPagedResult<TDto>,
  mapItem: (dto: TDto) => TDomain,
): Paginated<TDomain> {
  return {
    items: raw.items.map(mapItem),
    meta:
      raw.meta ??
      /* Defensive fallback: `meta` isn't in the live schema's `required` list,
         even though every paged admin response declares it alongside the
         flat fields it mirrors. */
      {
        page: raw.page,
        pageSize: raw.pageSize,
        totalItems: raw.totalCount,
        totalPages: raw.totalPages,
        hasNextPage: raw.hasNextPage,
        hasPreviousPage: raw.hasPreviousPage,
      },
  };
}

/** `en`/`ar` are the only storefront locales; a live value outside that is treated as the default. */
function toLocale(value: string): Locale {
  return value === "ar" ? "ar" : "en";
}

function toCustomer(dto: AdminCustomerDto): Customer {
  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email,
    phone: dto.phone ?? undefined,
    city: dto.city ?? "",
    /* Live `AdminCustomerDto` has no `addresses` field at all — nothing to read. */
    addresses: undefined,
    preferences: {
      locale: toLocale(dto.locale),
      marketingOptIn: dto.marketingOptIn,
      /* No live source for a customer's favourite sports on this endpoint — always empty today. */
      favouriteSportIds: [],
    },
    activity: dto.activity,
    orderCount: dto.orderCount,
    lifetimeValue: { amount: dto.lifetimeValue.amount, currency: (dto.lifetimeValue.currency as Customer["lifetimeValue"]["currency"]) ?? "JOD" },
    lastOrderAt: dto.lastOrderAt ?? undefined,
    lastActiveAt: dto.lastActiveAt ?? undefined,
    /* Live `AdminCustomerDto` carries only `createdAt` — no `createdBy`/`updatedAt`/`updatedBy`
       at all. `updatedAt` falls back to `createdAt`; the actor fields have nothing to read. */
    audit: { createdAt: dto.createdAt, createdBy: "", updatedAt: dto.createdAt, updatedBy: "" },
  };
}

/** Customers over `/v1/admin/customers`, read-only. Lifetime value and counts are computed by the API. */
export const httpCustomersService: CustomersService = {
  listCustomers: async (query = {}) => {
    const raw = await httpClient.get<AdminPagedResult<AdminCustomerDto>>("/v1/admin/customers", {
      query: { ...adminListParams(query), marketingOptInOnly: query.marketingOptInOnly },
      auth: true,
    });
    return toPaginated(raw, toCustomer);
  },
  getCustomer: async (id) => {
    const dto = await orNull(
      httpClient.get<AdminCustomerDto>(`/v1/admin/customers/${encodeURIComponent(id)}`, { auth: true }),
    );
    return dto ? toCustomer(dto) : null;
  },
  updateCustomer: async (id, draft) => {
    /* `CustomerDraftRequest` already matches field-for-field: name, email, phone, locale, marketingOptIn. */
    const dto = await httpClient.put<AdminCustomerDto>(`/v1/admin/customers/${encodeURIComponent(id)}`, draft, {
      auth: true,
    });
    return toCustomer(dto);
  },
};
