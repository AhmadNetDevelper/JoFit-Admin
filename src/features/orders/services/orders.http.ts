import { DEFAULT_LOCALE } from "@/i18n/locales";
import { localize } from "@/lib";
import { adminListParams, httpClient, orNull } from "@/services";
import type { LocalizedText, Money, Paginated } from "@/types";

import type { Order, OrderLine, OrderLineKind, OrderStatus } from "../types";
import type { OrdersService } from "./orders.contract";

/** What `GET/PUT /v1/admin/orders*` actually answers — `AdminOrderDto` in docs/api-live/admin.json. */
interface AdminOrderLineDto {
  readonly id: number;
  readonly kind: string;
  readonly title: LocalizedText;
  readonly sku?: string | null;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
  readonly deposit?: Money | null;
  readonly productId?: number | null;
  readonly variantId?: number | null;
  readonly rentalItemId?: number | null;
  readonly rentalBookingId?: number | null;
}

interface AdminOrderAddressDto {
  readonly recipient: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2?: string | null;
  readonly city: string;
}

interface AdminOrderTotalsDto {
  readonly itemsSubtotal: Money;
  readonly shipping: Money;
  readonly tax: Money;
  readonly depositsTotal: Money;
  readonly grandTotal: Money;
}

interface AdminAuditDto {
  readonly createdAt: string;
  readonly createdBy?: number | null;
  readonly updatedAt?: string | null;
  readonly updatedBy?: number | null;
}

interface AdminOrderDto {
  readonly id: number;
  readonly reference: string;
  readonly customerId: number;
  readonly customerName: string | null;
  readonly customerEmail: string | null;
  readonly status: string;
  readonly nextStatuses: readonly string[];
  readonly fulfilment: string;
  readonly address: AdminOrderAddressDto | null;
  readonly notes: string | null;
  readonly lines: readonly AdminOrderLineDto[];
  readonly totals: AdminOrderTotalsDto;
  readonly placedAt: string;
  readonly audit: AdminAuditDto;
}

function toAuditInfo(dto: AdminAuditDto) {
  /* Live `createdBy`/`updatedBy` are nullable int64 ids; the admin type wants a
     display-ready string. Ids are int64 server-side everywhere (see
     API-INTEGRATION-STATUS.md §1) — stringified here, not resolved to a name. */
  return {
    createdAt: dto.createdAt,
    createdBy: dto.createdBy != null ? String(dto.createdBy) : "",
    updatedAt: dto.updatedAt ?? dto.createdAt,
    updatedBy: dto.updatedBy != null ? String(dto.updatedBy) : "",
  };
}

function toOrderLine(dto: AdminOrderLineDto): OrderLine {
  return {
    id: String(dto.id),
    /* `kind` is a free string live; the admin type narrows it to "shop" | "rental". */
    kind: dto.kind as OrderLineKind,
    /* `AdminOrderLineDto.title` is a LocalizedText live; the admin's line only ever
       shows one string (it is a denormalised snapshot at sale time, by design —
       see OrderLine's own doc comment), so it is flattened here. */
    title: localize(dto.title, DEFAULT_LOCALE),
    quantity: dto.quantity,
    unitPrice: dto.unitPrice,
    total: dto.lineTotal,
    productId: dto.productId != null ? String(dto.productId) : undefined,
    variantId: dto.variantId != null ? String(dto.variantId) : undefined,
    rentalItemId: dto.rentalItemId != null ? String(dto.rentalItemId) : undefined,
    rentalBookingId: dto.rentalBookingId != null ? String(dto.rentalBookingId) : undefined,
  };
}

function toOrder(dto: AdminOrderDto): Order {
  return {
    id: String(dto.id),
    reference: dto.reference,
    status: dto.status as OrderStatus,
    placedAt: dto.placedAt,
    customer: {
      id: String(dto.customerId),
      name: dto.customerName ?? "",
      email: dto.customerEmail ?? "",
    },
    lines: dto.lines.map(toOrderLine),
    itemsSubtotal: dto.totals.itemsSubtotal,
    depositsTotal: dto.totals.depositsTotal,
    shippingTotal: dto.totals.shipping,
    taxTotal: dto.totals.tax,
    grandTotal: dto.totals.grandTotal,
    /* `AdminOrderAddressDto` has no `id`/`countryCode` at all — not enough to build
       the admin's `Address` (both required). Documented gap: shipping address is
       left unset rather than guessed at; `address` is otherwise discarded here. */
    shippingAddress: undefined,
    audit: toAuditInfo(dto.audit),
    nextStatuses: dto.nextStatuses as readonly OrderStatus[],
    fulfilment: dto.fulfilment,
    notes: dto.notes ?? undefined,
  };
}

/** Orders over `/v1/admin/orders`. The API re-checks every status move against the graph. */
export const httpOrdersService: OrdersService = {
  listOrders: async (query = {}) => {
    const page = await httpClient.get<Paginated<AdminOrderDto>>("/v1/admin/orders", {
      query: {
        ...adminListParams(query),
        statuses: query.statuses,
        customerId: query.customerId,
        /* `placedBetween.from`/`.to`: the live endpoint's own summary text names this
           filter, but it does not appear in the documented `parameters` array at all
           (checked docs/api-live/admin.json). Sent as-is on the chance the dotted
           names bind through a complex query-object the OpenAPI generator didn't
           flatten into the visible parameter list — unverified against the explicit
           live spec. */
        "placedBetween.from": query.placedBetween?.from,
        "placedBetween.to": query.placedBetween?.to,
      },
      auth: true,
    });
    return { items: page.items.map(toOrder), meta: page.meta };
  },
  getOrder: async (id) => {
    const dto = await orNull(
      httpClient.get<AdminOrderDto>(`/v1/admin/orders/${encodeURIComponent(id)}`, { auth: true }),
    );
    return dto ? toOrder(dto) : null;
  },
  setOrderStatus: async (id, status) => {
    const dto = await httpClient.put<AdminOrderDto>(
      `/v1/admin/orders/${encodeURIComponent(id)}/status`,
      { status },
      { auth: true },
    );
    return toOrder(dto);
  },
};
