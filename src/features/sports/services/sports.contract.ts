import type { ListQuery, Paginated } from "@/types";

import type { Sport, SportDraft } from "../types";

export interface SportsService {
  /**
   * Every sport, for the pickers other domains show (`GET /v1/admin/sports/options`).
   * A bounded taxonomy, so it is the whole list.
   */
  list(): Promise<readonly Sport[]>;
  /**
   * One page for the Sports screen (`GET /v1/admin/sports`). `search` matches
   * either language's name or the slug; sorted by name in `locale`.
   */
  listPage(query?: ListQuery): Promise<Paginated<Sport>>;
  getManyByIds(ids: readonly string[]): Promise<readonly Sport[]>;
  setFeatured(id: string, isFeatured: boolean): Promise<Sport>;
  /**
   * 422 with field errors when the name or slug is missing, the slug is taken,
   * or the image is malformed (`image`).
   */
  create(draft: SportDraft): Promise<Sport>;
  update(id: string, draft: SportDraft): Promise<Sport>;
  /** 409 while any product, rental item, coach or course is filed under it. */
  remove(id: string): Promise<void>;
}
