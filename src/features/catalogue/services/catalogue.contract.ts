import type { ListQuery, Paginated } from "@/types";

import type {
  AdminProduct,
  Brand,
  BrandDraft,
  NewProductDraft,
  ProductCategory,
  ProductCategoryDraft,
  ProductDraft,
  ProductListQuery,
  StockAdjustment,
} from "../types";

/**
 * Reads and commands in one contract, with commands named for what they *do*
 * rather than as generic CRUD.
 *
 * `setProductStatus` and `adjustStock` are separate from `updateProduct` because
 * they are different decisions with different permissions and different audit
 * meaning — collapsing them into one `update` would lose that, and would make a
 * stock correction indistinguishable from an edit.
 */
export interface CatalogueService {
  listProducts(query?: ProductListQuery): Promise<Paginated<AdminProduct>>;
  getProduct(id: string): Promise<AdminProduct | null>;
  /**
   * 422 when a title is missing in either language, there is no category or
   * brand, the SKU is taken, the price is not above zero, or `media` holds
   * more than 12 items or one that is not a stored image (`fieldErrors.media`).
   */
  createProduct(draft: NewProductDraft): Promise<AdminProduct>;
  /** The same rules as a create, bar the first variant. A body without `media` keeps the gallery. */
  updateProduct(id: string, draft: ProductDraft): Promise<AdminProduct>;
  setProductStatus(id: string, status: AdminProduct["status"]): Promise<AdminProduct>;
  adjustStock(adjustment: StockAdjustment): Promise<AdminProduct>;
  /** 409 once the product is on any order: orders are history, so archive it instead. */
  deleteProduct(id: string): Promise<void>;

  /**
   * Every category, for pickers (the product editor, the parent select):
   * `GET /v1/admin/product-categories/options`. A bounded taxonomy, so it is
   * not paged. Tables use `listCategoriesPage`.
   */
  listCategories(): Promise<readonly ProductCategory[]>;
  /**
   * One page of categories for the table: `GET /v1/admin/product-categories`.
   * `search` matches either language's name and the slug; sorted by name in
   * the requested locale unless `sort` says otherwise.
   */
  listCategoriesPage(query?: ListQuery): Promise<Paginated<ProductCategory>>;
  /**
   * 422 when a name is missing in either language, the slug is malformed or
   * taken, the parent would loop, or `image` is not a stored image.
   */
  createCategory(draft: ProductCategoryDraft): Promise<ProductCategory>;
  updateCategory(id: string, draft: ProductCategoryDraft): Promise<ProductCategory>;
  /** 409 while products are filed under it or it has sub-categories. */
  deleteCategory(id: string): Promise<void>;

  /** Every brand, for pickers: `GET /v1/admin/brands/options`. Tables use `listBrandsPage`. */
  listBrands(): Promise<readonly Brand[]>;
  /** One page of brands for the table: `GET /v1/admin/brands`. `search` matches the name and the slug. */
  listBrandsPage(query?: ListQuery): Promise<Paginated<Brand>>;
  /** 422 when the name is missing, the slug is malformed or taken, or `logo` is not a stored image. */
  createBrand(draft: BrandDraft): Promise<Brand>;
  updateBrand(id: string, draft: BrandDraft): Promise<Brand>;
  /** 409 while any product carries the brand. */
  deleteBrand(id: string): Promise<void>;
}
