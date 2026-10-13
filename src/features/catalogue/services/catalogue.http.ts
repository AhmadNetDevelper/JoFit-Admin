import { adminListParams, httpClient, orNull } from "@/services";
import type { AuditInfo, Media, MediaImage, Paginated } from "@/types";

import type {
  AdminProduct,
  AdminProductVariant,
  Brand,
  BrandDraft,
  ProductCategory,
  ProductCategoryDraft,
  ProductDraft,
} from "../types";
import type { CatalogueService } from "./catalogue.contract";

const enc = encodeURIComponent;

/* ------------------------------------------------------------- wire types */
/*
 * The live API's shapes (`AdminProductDto`/`AdminVariantDto`/`ProductCategoryDto`/
 * `BrandDto`, from docs/api-live/admin.json) differ from the admin's own domain
 * types in several ways that recur throughout this file:
 *  - every id is `int64` live, `string` in the frontend;
 *  - `title`/`name` are bilingual `LocalizedText` live even where the admin's
 *    model deliberately keeps a plain string (a variant's `title`, a brand's
 *    `name` — both "proper noun, not localized" by design);
 *  - several fields the admin's UI was built against simply don't exist on
 *    the live DTO at all (no `selections`, no `options`, no `rating`, no
 *    `seo`, no `sportIds` on a category, no `audit` on a category or a brand).
 * Only `AdminProductDto.audit` has a direct live source; everything else
 * marked below is a genuine, documented gap — not something invented here.
 */
interface WireLocalizedText {
  readonly en: string;
  readonly ar: string;
}

interface WireMediaImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

interface WireMoney {
  readonly amount: number;
  readonly currency?: string;
}

interface WireAudit {
  readonly createdAt: string;
  readonly createdBy: number | null;
  readonly updatedAt: string | null;
  readonly updatedBy: number | null;
}

interface AdminVariantDto {
  readonly id: number;
  readonly sku: string;
  readonly title: WireLocalizedText;
  readonly price: WireMoney;
  readonly stockOnHand: number;
  readonly lowStockThreshold: number;
  readonly isActive: boolean;
}

interface AdminProductDto {
  readonly id: number;
  readonly slug: string;
  readonly title: WireLocalizedText;
  readonly summary: WireLocalizedText;
  readonly description: WireLocalizedText | null;
  readonly status: string;
  readonly brandId: number;
  readonly categoryIds: readonly number[];
  readonly sportIds: readonly number[];
  readonly variants: readonly AdminVariantDto[];
  readonly media: readonly WireMediaImage[];
  readonly totalStock: number;
  readonly publishedAt: string | null;
  readonly audit: WireAudit;
}

interface ProductCategoryDto {
  readonly id: number;
  readonly slug: string | null;
  readonly name: WireLocalizedText;
  readonly description: WireLocalizedText | null;
  readonly image: WireMediaImage | null;
  readonly parentId: number | null;
}

interface BrandDto {
  readonly id: number;
  readonly slug: string;
  readonly name: WireLocalizedText;
  readonly logo: WireMediaImage | null;
  readonly productCount: number;
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
    /* Defensive fallback: `meta` isn't in the live schema's `required` list,
       even though every paged admin response declares it alongside the flat
       fields it mirrors. */
    meta:
      raw.meta ?? {
        page: raw.page,
        pageSize: raw.pageSize,
        totalItems: raw.totalCount,
        totalPages: raw.totalPages,
        hasNextPage: raw.hasNextPage,
        hasPreviousPage: raw.hasPreviousPage,
      },
  };
}

/* -------------------------------------------------------- response mapping */

function toMediaImage(dto: WireMediaImage): MediaImage {
  return {
    kind: "image",
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    width: dto.width ?? undefined,
    height: dto.height ?? undefined,
  };
}

/** Real data: `AdminProductDto.audit` has a direct live source, just nullable actor ids to stringify. */
function toAuditInfo(dto: WireAudit): AuditInfo {
  return {
    createdAt: dto.createdAt,
    createdBy: dto.createdBy != null ? String(dto.createdBy) : "",
    updatedAt: dto.updatedAt ?? dto.createdAt,
    updatedBy: dto.updatedBy != null ? String(dto.updatedBy) : "",
  };
}

/** No live source at all (`ProductCategoryDto`/`BrandDto` carry no timestamps or actor whatsoever). */
const NO_LIVE_AUDIT: AuditInfo = {
  createdAt: "1970-01-01T00:00:00.000Z",
  createdBy: "",
  updatedAt: "1970-01-01T00:00:00.000Z",
  updatedBy: "",
};

function toVariant(dto: AdminVariantDto): AdminProductVariant {
  return {
    id: String(dto.id),
    sku: dto.sku,
    /* `AdminVariantDto.title` is bilingual live; the admin's variant title is
       deliberately a plain string ("built from option values, so it needs no
       translation" — see types.ts). The live API disagrees with that design;
       the English value is picked here rather than resolving this silently. */
    title: dto.title.en,
    /* No live source for the option-key→value map the size/colour picker
       keys on — the variant-options UI has nothing to bind to until the
       backend adds one. */
    selections: undefined,
    price: { amount: dto.price.amount, currency: (dto.price.currency as AdminProductVariant["price"]["currency"]) ?? "JOD" },
    /* No live source for either price — never leaves the admin anyway. */
    compareAtPrice: undefined,
    costPrice: undefined,
    stockOnHand: dto.stockOnHand,
    lowStockThreshold: dto.lowStockThreshold,
    isActive: dto.isActive,
  };
}

function toAdminProduct(dto: AdminProductDto): AdminProduct {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    summary: dto.summary,
    description: dto.description ?? { en: "", ar: "" },
    status: dto.status as AdminProduct["status"],
    brandId: String(dto.brandId),
    categoryIds: dto.categoryIds.map(String),
    sportIds: dto.sportIds.map(String),
    media: dto.media.map(toMediaImage) as readonly Media[],
    /* `AdminProductDto` has no `options` field at all — same documented gap
       as a variant's `selections`, one level up. */
    options: [],
    variants: dto.variants.map(toVariant),
    /* No live source: ratings are produced by customers, but this endpoint
       doesn't expose them to the admin at all. */
    rating: { average: 0, count: 0 },
    /* No `seo` field exists anywhere in the live spec — never persisted via this API. */
    seo: undefined,
    audit: toAuditInfo(dto.audit),
  };
}

function toProductCategory(dto: ProductCategoryDto): ProductCategory {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    description: dto.description ?? undefined,
    parentId: dto.parentId != null ? String(dto.parentId) : null,
    /* Live `ProductCategoryDto` has no `sportIds` field at all. */
    sportIds: undefined,
    image: dto.image ? toMediaImage(dto.image) : undefined,
    /* Live `ProductCategoryDto` has no `productCount` field either — raise with
       the backend team; until then this always reads as 0. */
    productCount: 0,
    audit: NO_LIVE_AUDIT,
  };
}

function toBrand(dto: BrandDto): Brand {
  return {
    id: String(dto.id),
    slug: dto.slug,
    /* `BrandDto.name` is bilingual live; the admin's `Brand.name` is
       deliberately a plain string ("a proper noun — deliberately not
       localized" — see types.ts). Genuine design-vs-live-API conflict, worth
       raising with the backend/product team; picking the English value here
       rather than pretending it's solved. */
    name: dto.name.en,
    /* Live `BrandDto` has no `description` field at all. */
    description: undefined,
    logo: dto.logo ? toMediaImage(dto.logo) : undefined,
    productCount: dto.productCount,
    audit: NO_LIVE_AUDIT,
  };
}

/* --------------------------------------------------------- request bodies */

/** Only images travel over the wire today — the shared media service never uploads a video. */
function mediaRequestBody(media: readonly Media[]): readonly WireMediaImage[] {
  return media
    .filter((item): item is MediaImage => item.kind === "image")
    .map((item) => ({ id: item.id, url: item.url, alt: item.alt }));
}

function imageRequestBody(image: MediaImage | null | undefined): WireMediaImage | null {
  return image ? { id: image.id, url: image.url, alt: image.alt } : null;
}

/** `NewProductDraftRequest`/`ProductDraftRequest`: no `seo`, ids are numeric. */
function productBody(draft: ProductDraft) {
  return {
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
    brandId: Number(draft.brandId),
    categoryIds: draft.categoryIds.map(Number),
    sportIds: draft.sportIds.map(Number),
    status: draft.status,
    /* A body without the key keeps the gallery; `[]` empties it. */
    media: mediaRequestBody(draft.media),
    /* `seo` is dropped: no `seo` field exists anywhere in the live spec, so
       there is nowhere for it to be persisted — sending it would just be
       silently ignored by the server. */
  };
}

/* A removed picture is `undefined` in the draft, which JSON would drop — and a
   body without the key keeps the current one. `null` says "clear it". */
function categoryBody(draft: ProductCategoryDraft) {
  return {
    slug: draft.slug,
    name: draft.name,
    description: draft.description,
    image: imageRequestBody(draft.image),
    parentId: draft.parentId != null ? Number(draft.parentId) : null,
    /* `sportIds` is dropped: `ProductCategoryDraftRequest` has no such field —
       the API has nothing to write it to. */
  };
}

function brandBody(draft: BrandDraft) {
  return {
    slug: draft.slug,
    /* `BrandDraftRequest.name` wants bilingual `LocalizedTextRequest`; the
       admin only collects one string for a brand's (unlocalized) name, so the
       same value is sent for both languages. Flag for backend/product: this
       is a mismatch being worked around, not a feature. */
    name: { en: draft.name, ar: draft.name },
    logo: imageRequestBody(draft.logo),
    /* `description` is dropped: `BrandDraftRequest` has no such field either. */
  };
}

/** Products, stock, categories and brands over `/v1/admin/products` and friends. */
export const httpCatalogueService: CatalogueService = {
  listProducts: async (query = {}) => {
    const raw = await httpClient.get<AdminPagedResult<AdminProductDto>>("/v1/admin/products", {
      query: {
        ...adminListParams(query),
        statuses: query.statuses,
        categoryIds: query.categoryIds,
        brandIds: query.brandIds,
        sportIds: query.sportIds,
        lowStockOnly: query.lowStockOnly,
      },
      auth: true,
    });
    return toPaginated(raw, toAdminProduct);
  },
  getProduct: async (id) => {
    const dto = await orNull(httpClient.get<AdminProductDto>(`/v1/admin/products/${enc(id)}`, { auth: true }));
    return dto ? toAdminProduct(dto) : null;
  },
  createProduct: async (draft) => {
    const dto = await httpClient.post<AdminProductDto>(
      "/v1/admin/products",
      { ...productBody(draft), variant: draft.variant },
      { auth: true },
    );
    return toAdminProduct(dto);
  },
  updateProduct: async (id, draft) => {
    const dto = await httpClient.put<AdminProductDto>(`/v1/admin/products/${enc(id)}`, productBody(draft), {
      auth: true,
    });
    return toAdminProduct(dto);
  },
  setProductStatus: async (id, status) => {
    const dto = await httpClient.put<AdminProductDto>(
      `/v1/admin/products/${enc(id)}/status`,
      { status },
      { auth: true },
    );
    return toAdminProduct(dto);
  },
  /* A signed delta, never an absolute count: two staff adjusting at once must add up. */
  adjustStock: async ({ productId, variantId, delta, reason }) => {
    const dto = await httpClient.post<AdminProductDto>(
      `/v1/admin/products/${enc(productId)}/stock-adjustments`,
      { variantId: Number(variantId), delta, reason },
      { auth: true },
    );
    return toAdminProduct(dto);
  },
  deleteProduct: async (id) => {
    await httpClient.delete<void>(`/v1/admin/products/${enc(id)}`, { auth: true });
  },

  /* Pickers read the whole taxonomy; the table reads it a page at a time. */
  listCategories: async () => {
    const dtos = await httpClient.get<readonly ProductCategoryDto[]>("/v1/admin/product-categories/options", {
      auth: true,
    });
    return dtos.map(toProductCategory);
  },
  listCategoriesPage: async (query = {}) => {
    const raw = await httpClient.get<AdminPagedResult<ProductCategoryDto>>("/v1/admin/product-categories", {
      query: adminListParams(query),
      auth: true,
    });
    return toPaginated(raw, toProductCategory);
  },
  createCategory: async (draft) => {
    const dto = await httpClient.post<ProductCategoryDto>("/v1/admin/product-categories", categoryBody(draft), {
      auth: true,
    });
    return toProductCategory(dto);
  },
  updateCategory: async (id, draft) => {
    const dto = await httpClient.put<ProductCategoryDto>(
      `/v1/admin/product-categories/${enc(id)}`,
      categoryBody(draft),
      { auth: true },
    );
    return toProductCategory(dto);
  },
  deleteCategory: async (id) => {
    await httpClient.delete<void>(`/v1/admin/product-categories/${enc(id)}`, { auth: true });
  },

  listBrands: async () => {
    const dtos = await httpClient.get<readonly BrandDto[]>("/v1/admin/brands/options", { auth: true });
    return dtos.map(toBrand);
  },
  listBrandsPage: async (query = {}) => {
    const raw = await httpClient.get<AdminPagedResult<BrandDto>>("/v1/admin/brands", {
      query: adminListParams(query),
      auth: true,
    });
    return toPaginated(raw, toBrand);
  },
  createBrand: async (draft) => {
    const dto = await httpClient.post<BrandDto>("/v1/admin/brands", brandBody(draft), { auth: true });
    return toBrand(dto);
  },
  updateBrand: async (id, draft) => {
    const dto = await httpClient.put<BrandDto>(`/v1/admin/brands/${enc(id)}`, brandBody(draft), { auth: true });
    return toBrand(dto);
  },
  deleteBrand: async (id) => {
    await httpClient.delete<void>(`/v1/admin/brands/${enc(id)}`, { auth: true });
  },
};
