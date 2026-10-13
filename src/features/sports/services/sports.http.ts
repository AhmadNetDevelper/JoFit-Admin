import { adminListParams, httpClient } from "@/services";
import type { LocalizedText, MediaImage, Paginated } from "@/types";

import type { Sport, SportDraft } from "../types";
import type { SportsService } from "./sports.contract";

const enc = encodeURIComponent;

interface MediaImageDto {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

function toMediaImage(dto: MediaImageDto | null | undefined): MediaImage | undefined {
  if (!dto) return undefined;
  return { kind: "image", id: dto.id, url: dto.url, alt: dto.alt, width: dto.width ?? undefined, height: dto.height ?? undefined };
}

/** What `GET/PUT /v1/admin/sports*` actually answers — `SportDto`. */
interface SportDto {
  readonly id: number;
  readonly slug: string | null;
  readonly name: LocalizedText;
  readonly description: LocalizedText | null;
  readonly image: MediaImageDto | null;
  readonly isFeatured: boolean;
}

function toSport(dto: SportDto): Sport {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    isFeatured: dto.isFeatured,
    image: toMediaImage(dto.image),
    /* Live supports this fully — see Sport's own doc comment; just carried through. */
    description: dto.description ?? undefined,
  };
}

const hasText = (text: LocalizedText | undefined) => Boolean(text && (text.en.trim() || text.ar.trim()));

/**
 * A removed image goes up as `null`, which clears it; a missing key would read as "unchanged" to some APIs.
 * A description left blank in both languages goes up as `null` too, so the sport has none rather than two empty strings.
 */
const body = (draft: SportDraft) => ({
  ...draft,
  description: hasText(draft.description) ? draft.description : null,
  image: draft.image ?? null,
});

/**
 * The shared sports taxonomy over `/v1/admin/sports`: one page for the Sports
 * screen, and `/options` (the whole list) for every picker.
 */
export const httpSportsService: SportsService = {
  list: async () => {
    const dtos = await httpClient.get<readonly SportDto[]>("/v1/admin/sports/options", { auth: true });
    return dtos.map(toSport);
  },
  listPage: async (query = {}) => {
    const page = await httpClient.get<Paginated<SportDto>>("/v1/admin/sports", {
      query: adminListParams(query),
      auth: true,
    });
    return { items: page.items.map(toSport), meta: page.meta };
  },
  getManyByIds: async (ids) => {
    if (ids.length === 0) return [];
    const dtos = await httpClient.get<readonly SportDto[]>("/v1/admin/sports/options", {
      query: { ids },
      auth: true,
    });
    return dtos.map(toSport);
  },
  setFeatured: async (id, isFeatured) => {
    const dto = await httpClient.put<SportDto>(`/v1/admin/sports/${enc(id)}/featured`, { isFeatured }, { auth: true });
    return toSport(dto);
  },
  create: async (draft) => {
    const dto = await httpClient.post<SportDto>("/v1/admin/sports", body(draft), { auth: true });
    return toSport(dto);
  },
  update: async (id, draft) => {
    const dto = await httpClient.put<SportDto>(`/v1/admin/sports/${enc(id)}`, body(draft), { auth: true });
    return toSport(dto);
  },
  remove: async (id) => {
    await httpClient.delete<void>(`/v1/admin/sports/${enc(id)}`, { auth: true });
  },
};
