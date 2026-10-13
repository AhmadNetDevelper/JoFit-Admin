import type { Paginated } from "@/types";

import type {
  RentalBooking,
  RentalBookingListQuery,
  RentalBookingStatus,
  RentalCategory,
  RentalCategoryDraft,
  RentalCategoryListQuery,
  RentalDepot,
  RentalDepotDraft,
  RentalDepotListQuery,
  RentalItem,
  RentalItemDraft,
  RentalItemListQuery,
} from "../types";

export interface RentalAdminService {
  listItems(query?: RentalItemListQuery): Promise<Paginated<RentalItem>>;
  getItem(id: string): Promise<RentalItem | null>;
  /**
   * 422 with field errors (`title.en`, `slug`, `rates.day.price`, `depotId`…) when the draft is incomplete.
   * `media` is refused (key `media`) past 12 entries, or when an entry is not an uploaded image or video.
   */
  createItem(draft: RentalItemDraft): Promise<RentalItem>;
  /** Same rules as `createItem`; also refuses fewer units than are out of service. */
  updateItem(id: string, draft: RentalItemDraft): Promise<RentalItem>;
  /** 409 while any pending, confirmed or collected booking still needs the item. */
  deleteItem(id: string): Promise<void>;
  /** Adjusts how many physical units are available to hire. */
  setUnitsOutOfService(id: string, unitsOutOfService: number): Promise<RentalItem>;

  listBookings(query?: RentalBookingListQuery): Promise<Paginated<RentalBooking>>;
  getBooking(id: string): Promise<RentalBooking | null>;
  setBookingStatus(id: string, status: RentalBookingStatus): Promise<RentalBooking>;
  releaseDeposit(id: string): Promise<RentalBooking>;

  /** Every category, for pickers (the item's categories, a category's parent). */
  listCategories(): Promise<readonly RentalCategory[]>;
  /** One page of categories for the setup table; `search` matches either name and the slug. */
  listCategoriesPage(query?: RentalCategoryListQuery): Promise<Paginated<RentalCategory>>;
  /** 422 when a name or the slug is missing, the slug is taken, or the parent would make a loop. */
  createCategory(draft: RentalCategoryDraft): Promise<RentalCategory>;
  updateCategory(id: string, draft: RentalCategoryDraft): Promise<RentalCategory>;
  /** 409 while items or sub-categories are filed under it. */
  deleteCategory(id: string): Promise<void>;

  /** Every depot, for the item's depot picker. */
  listDepots(): Promise<readonly RentalDepot[]>;
  /** One page of depots for the setup table; `search` matches either name and either city. */
  listDepotsPage(query?: RentalDepotListQuery): Promise<Paginated<RentalDepot>>;
  /** 422 when a name, the city or the country code is missing. */
  createDepot(draft: RentalDepotDraft): Promise<RentalDepot>;
  updateDepot(id: string, draft: RentalDepotDraft): Promise<RentalDepot>;
  /** 409 while any item is stocked there. */
  deleteDepot(id: string): Promise<void>;
}
