export interface PageRequest {
  readonly page: number;
  readonly pageSize: number;
}

export interface PageMeta extends PageRequest {
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface Paginated<TItem> {
  readonly items: readonly TItem[];
  readonly meta: PageMeta;
}
