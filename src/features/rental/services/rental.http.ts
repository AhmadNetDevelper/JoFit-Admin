import { adminListParams, httpClient, orNull } from "@/services";
import type { LocalizedText, Location, Media, MediaImage, Money, Paginated } from "@/types";

import type {
  RentalBooking,
  RentalBookingStatus,
  RentalCategory,
  RentalCategoryDraft,
  RentalDepot,
  RentalDepotDraft,
  RentalItem,
  RentalItemDraft,
  RentalRate,
} from "../types";
import type { RentalAdminService } from "./rental.contract";

const enc = encodeURIComponent;

/* ---- live DTO shapes (docs/api-live/admin.json) ---------------------------- */

interface AdminAuditDto {
  readonly createdAt: string;
  readonly createdBy?: number | null;
  readonly updatedAt?: string | null;
  readonly updatedBy?: number | null;
}

function toAuditInfo(dto: AdminAuditDto) {
  /* Ids are int64 server-side everywhere (API-INTEGRATION-STATUS.md §1); stringified
     here rather than resolved to a staff name. */
  return {
    createdAt: dto.createdAt,
    createdBy: dto.createdBy != null ? String(dto.createdBy) : "",
    updatedAt: dto.updatedAt ?? dto.createdAt,
    updatedBy: dto.updatedBy != null ? String(dto.updatedBy) : "",
  };
}

interface RentalRateDto {
  readonly unit: string;
  readonly price: Money;
  readonly minUnits: number;
  readonly maxUnits?: number | null;
}

function toRentalRate(dto: RentalRateDto): RentalRate {
  return {
    unit: dto.unit as RentalRate["unit"],
    price: dto.price,
    minUnits: dto.minUnits,
    ...(dto.maxUnits != null ? { maxUnits: dto.maxUnits } : {}),
  };
}

interface MediaImageDto {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly kind?: string | null;
}

function toMediaImage(dto: MediaImageDto): MediaImage {
  return {
    kind: "image",
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    width: dto.width ?? undefined,
    height: dto.height ?? undefined,
  };
}

/* `undefined` (no image) is sent as an explicit `null` — never by omitting the
   key. Confirmed live: `PUT /rental-categories/{id}` is a full replace, so a
   body missing the `image` key clears whatever image is already stored rather
   than keeping it. */
function imageRequestBody(image: MediaImage | null | undefined): MediaImageDto | null {
  return image ? { id: image.id, url: image.url, alt: image.alt } : null;
}

interface AdminRentalItemDto {
  readonly id: number;
  readonly slug: string;
  readonly status: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText | null;
  readonly condition: string;
  readonly depotId: number;
  readonly categoryIds: readonly number[];
  readonly totalUnits: number;
  readonly unitsOutOfService: number;
  readonly deposit: Money | null;
  readonly rates: readonly RentalRateDto[];
  readonly media: readonly MediaImageDto[];
  readonly publishedAt: string | null;
  readonly audit: AdminAuditDto;
}

function toRentalItem(dto: AdminRentalItemDto): RentalItem {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    summary: dto.summary,
    description: dto.description ?? undefined,
    media: dto.media.map(toMediaImage) as readonly Media[],
    status: dto.status as RentalItem["status"],
    categoryIds: dto.categoryIds.map(String),
    /* No live source at all — see RentalItem's own doc comment. */
    sportIds: undefined,
    rates: dto.rates.map(toRentalRate),
    deposit: dto.deposit ?? undefined,
    /* No live source at all (only `depotId`) — see RentalItem's own doc comment;
       not joined against `listDepots()` here to keep list/get reads single-request. */
    location: undefined,
    condition: dto.condition as RentalItem["condition"],
    totalUnits: dto.totalUnits,
    unitsOutOfService: dto.unitsOutOfService,
    /* No live source at all — see RentalItem's own doc comment. */
    rating: undefined,
    audit: toAuditInfo(dto.audit),
  };
}

interface RentalCategoryDto {
  readonly id: number;
  readonly slug: string | null;
  readonly name: LocalizedText;
  readonly description: LocalizedText | null;
  readonly image: MediaImageDto | null;
  readonly parentId: number | null;
}

function toRentalCategory(dto: RentalCategoryDto, itemCount?: number): RentalCategory {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    description: dto.description ?? undefined,
    parentId: dto.parentId != null ? String(dto.parentId) : null,
    /* No live source at all — see RentalCategory's own doc comment. */
    sportIds: undefined,
    /* No live source at all — defaults to 0 when the caller doesn't supply a count. */
    itemCount: itemCount ?? 0,
    image: dto.image ? toMediaImage(dto.image) : undefined,
  };
}

interface RentalDepotDto {
  readonly id: number;
  readonly name: LocalizedText;
  readonly city: LocalizedText;
  readonly countryCode: string;
}

function toRentalDepot(dto: RentalDepotDto, stock?: { itemCount: number; totalUnits: number }): RentalDepot {
  const location: Location = {
    id: String(dto.id),
    name: dto.name,
    city: dto.city,
    countryCode: dto.countryCode,
  };
  return {
    ...location,
    /* No live source at all — defaults to 0 when the caller doesn't supply a count. */
    itemCount: stock?.itemCount ?? 0,
    totalUnits: stock?.totalUnits ?? 0,
  };
}

interface AdminRentalBookingDto {
  readonly id: number;
  readonly reference: string;
  readonly itemId: number;
  readonly itemTitle: string;
  readonly customerId: number | null;
  readonly customerName: string | null;
  readonly orderId: number | null;
  readonly from: string;
  readonly to: string;
  readonly unit: string;
  readonly quantity: number;
  readonly units: number;
  readonly unitPrice: Money;
  readonly subtotal: Money;
  readonly deposit?: Money | null;
  readonly depositReleased: boolean;
  readonly status: string;
  readonly audit: AdminAuditDto;
}

function toRentalBooking(dto: AdminRentalBookingDto): RentalBooking {
  return {
    id: String(dto.id),
    reference: dto.reference,
    itemId: String(dto.itemId),
    /* Live `itemTitle` is a plain string, not localized — wrapped with the same
       value in both languages; the live API doesn't actually localize this field. */
    itemTitle: { en: dto.itemTitle, ar: dto.itemTitle },
    customerId: dto.customerId != null ? String(dto.customerId) : "",
    customerName: dto.customerName ?? "",
    /* No live source at all — see RentalBooking's own doc comment. */
    customerEmail: undefined,
    period: { from: dto.from, to: dto.to },
    unit: dto.unit as RentalBooking["unit"],
    quantity: dto.quantity,
    units: dto.units,
    status: dto.status as RentalBookingStatus,
    /* `subtotal` is the actual line total; `unitPrice` kept only as extra context. */
    total: dto.subtotal,
    unitPrice: dto.unitPrice,
    deposit: dto.deposit ?? undefined,
    /* Live only has a boolean, no release timestamp — see the field's own doc comment. */
    depositReleasedAt: undefined,
    depositReleased: dto.depositReleased,
    orderId: dto.orderId != null ? String(dto.orderId) : "",
    /* No live source at all (only `orderId`) — see RentalBooking's own doc comment. */
    orderReference: undefined,
    audit: toAuditInfo(dto.audit),
  };
}

/* ---- request bodies --------------------------------------------------------- */

function toCategoryBody(draft: RentalCategoryDraft) {
  /* `sportIds` has no live counterpart on `RentalCategoryDraftRequest` — dropped.
     `image` must always be sent (never omitted) — see `imageRequestBody`'s own
     comment: a real bug fixed here, confirmed live. */
  return {
    slug: draft.slug,
    name: draft.name,
    description: draft.description,
    image: imageRequestBody(draft.image),
    parentId: draft.parentId != null ? Number(draft.parentId) : null,
  };
}

function toDepotBody(draft: RentalDepotDraft) {
  return { name: draft.name, city: draft.city, countryCode: draft.countryCode };
}

function toItemBody(draft: RentalItemDraft) {
  /* `sportIds` has no live counterpart on `RentalItemDraftRequest` — dropped. */
  return {
    slug: draft.slug,
    status: draft.status,
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
    condition: draft.condition,
    depotId: Number(draft.depotId),
    categoryIds: draft.categoryIds.map(Number),
    totalUnits: draft.totalUnits,
    deposit: draft.deposit,
    rates: draft.rates,
    media: draft.media,
  };
}

/** The hire fleet and its bookings over `/v1/admin/rental-*`. */
export const httpRentalAdminService: RentalAdminService = {
  listItems: async (query = {}) => {
    const page = await httpClient.get<Paginated<AdminRentalItemDto>>("/v1/admin/rental-items", {
      query: {
        ...adminListParams(query),
        statuses: query.statuses,
        categoryIds: query.categoryIds,
        depotIds: query.depotIds,
      },
      auth: true,
    });
    return { items: page.items.map(toRentalItem), meta: page.meta };
  },
  getItem: async (id) => {
    const dto = await orNull(
      httpClient.get<AdminRentalItemDto>(`/v1/admin/rental-items/${enc(id)}`, { auth: true }),
    );
    return dto ? toRentalItem(dto) : null;
  },
  createItem: async (draft) => {
    const dto = await httpClient.post<AdminRentalItemDto>("/v1/admin/rental-items", toItemBody(draft), {
      auth: true,
    });
    return toRentalItem(dto);
  },
  updateItem: async (id, draft) => {
    /* `RentalItemDraft` deliberately excludes `unitsOutOfService` — it has its
       own command, `setUnitsOutOfService` (see the type's own doc comment).
       But `RentalItemDraftRequest` has no partial-update semantics: confirmed
       live, a PUT that omits the field resets it to 0, so an ordinary edit
       (even just a title change) would silently wipe any out-of-service count
       set earlier. The current value is re-sent here so an edit never does that. */
    const current = await httpClient.get<AdminRentalItemDto>(`/v1/admin/rental-items/${enc(id)}`, {
      auth: true,
    });
    const dto = await httpClient.put<AdminRentalItemDto>(
      `/v1/admin/rental-items/${enc(id)}`,
      { ...toItemBody(draft), unitsOutOfService: current.unitsOutOfService },
      { auth: true },
    );
    return toRentalItem(dto);
  },
  deleteItem: async (id) => {
    await httpClient.delete<void>(`/v1/admin/rental-items/${enc(id)}`, { auth: true });
  },
  setUnitsOutOfService: async (id, unitsOutOfService) => {
    const dto = await httpClient.put<AdminRentalItemDto>(
      `/v1/admin/rental-items/${enc(id)}/out-of-service`,
      { unitsOutOfService },
      { auth: true },
    );
    return toRentalItem(dto);
  },
  listBookings: async (query = {}) => {
    const page = await httpClient.get<Paginated<AdminRentalBookingDto>>("/v1/admin/rental-bookings", {
      query: {
        ...adminListParams(query),
        statuses: query.statuses,
        /* Real bug fixed: live wants the plural `ItemIds` array, not a singular
           `itemId`. */
        itemIds: query.itemId ? [query.itemId] : undefined,
        customerId: query.customerId,
        /* `orderId`/`OrderIds` has no backing parameter on the live GET at all
           (checked docs/api-live/admin.json) — dropped rather than sent as a
           silent no-op. */
      },
      auth: true,
    });
    return { items: page.items.map(toRentalBooking), meta: page.meta };
  },
  getBooking: async (id) => {
    const dto = await orNull(
      httpClient.get<AdminRentalBookingDto>(`/v1/admin/rental-bookings/${enc(id)}`, { auth: true }),
    );
    return dto ? toRentalBooking(dto) : null;
  },
  setBookingStatus: async (id, status) => {
    const dto = await httpClient.put<AdminRentalBookingDto>(
      `/v1/admin/rental-bookings/${enc(id)}/status`,
      { status },
      { auth: true },
    );
    return toRentalBooking(dto);
  },
  releaseDeposit: async (id) => {
    const dto = await httpClient.post<AdminRentalBookingDto>(
      `/v1/admin/rental-bookings/${enc(id)}/release-deposit`,
      undefined,
      { auth: true },
    );
    return toRentalBooking(dto);
  },
  /* The pickers read the whole taxonomy from `/options`; the setup table reads it a page at a time. */
  listCategories: async () => {
    const dtos = await httpClient.get<readonly RentalCategoryDto[]>("/v1/admin/rental-categories/options", {
      auth: true,
    });
    return dtos.map((dto) => toRentalCategory(dto));
  },
  listCategoriesPage: async (query = {}) => {
    const page = await httpClient.get<Paginated<RentalCategoryDto>>("/v1/admin/rental-categories", {
      query: adminListParams(query),
      auth: true,
    });
    return { items: page.items.map((dto) => toRentalCategory(dto)), meta: page.meta };
  },
  createCategory: async (draft) => {
    const dto = await httpClient.post<RentalCategoryDto>(
      "/v1/admin/rental-categories",
      toCategoryBody(draft),
      { auth: true },
    );
    return toRentalCategory(dto);
  },
  updateCategory: async (id, draft) => {
    const dto = await httpClient.put<RentalCategoryDto>(
      `/v1/admin/rental-categories/${enc(id)}`,
      toCategoryBody(draft),
      { auth: true },
    );
    return toRentalCategory(dto);
  },
  deleteCategory: async (id) => {
    await httpClient.delete<void>(`/v1/admin/rental-categories/${enc(id)}`, { auth: true });
  },
  listDepots: async () => {
    const dtos = await httpClient.get<readonly RentalDepotDto[]>("/v1/admin/rental-depots/options", {
      auth: true,
    });
    return dtos.map((dto) => toRentalDepot(dto));
  },
  listDepotsPage: async (query = {}) => {
    const page = await httpClient.get<Paginated<RentalDepotDto>>("/v1/admin/rental-depots", {
      query: adminListParams(query),
      auth: true,
    });
    return { items: page.items.map((dto) => toRentalDepot(dto)), meta: page.meta };
  },
  createDepot: async (draft) => {
    const dto = await httpClient.post<RentalDepotDto>("/v1/admin/rental-depots", toDepotBody(draft), {
      auth: true,
    });
    return toRentalDepot(dto);
  },
  updateDepot: async (id, draft) => {
    const dto = await httpClient.put<RentalDepotDto>(
      `/v1/admin/rental-depots/${enc(id)}`,
      toDepotBody(draft),
      { auth: true },
    );
    return toRentalDepot(dto);
  },
  deleteDepot: async (id) => {
    await httpClient.delete<void>(`/v1/admin/rental-depots/${enc(id)}`, { auth: true });
  },
};
