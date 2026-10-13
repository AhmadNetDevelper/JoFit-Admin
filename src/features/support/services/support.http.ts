import { adminListParams, httpClient, orNull } from "@/services";
import type { Paginated } from "@/types";

import type { ConversationStatus, ConversationSummary, ConversationThread, SupportMessage } from "../types";
import type { SupportAdminService } from "./support.contract";

const enc = encodeURIComponent;

/** What `GET /v1/admin/support/conversations*` actually answers — `ConversationSummaryDto`. */
interface ConversationSummaryDto {
  readonly id: number;
  readonly reference: string;
  readonly status: string;
  readonly name: string;
  readonly email: string;
  readonly customerId?: number | null;
  readonly accountId?: number | null;
  readonly assigneeId?: number | null;
  readonly lastMessage: string | null;
  readonly lastMessageAt: string;
  readonly unread: number;
  readonly createdAt: string;
}

function toConversationSummary(dto: ConversationSummaryDto): ConversationSummary {
  return {
    id: String(dto.id),
    reference: dto.reference,
    status: dto.status as ConversationStatus,
    name: dto.name,
    email: dto.email,
    customerId: dto.customerId != null ? String(dto.customerId) : undefined,
    accountId: dto.accountId != null ? String(dto.accountId) : undefined,
    assigneeId: dto.assigneeId != null ? String(dto.assigneeId) : null,
    createdAt: dto.createdAt,
    lastMessageAt: dto.lastMessageAt,
    /* Live has no `visitorReadAt`/`staffReadAt` at all — see Conversation's own doc comment. */
    visitorReadAt: undefined,
    staffReadAt: undefined,
    lastMessage: dto.lastMessage ?? "",
    unread: dto.unread,
  };
}

/** What `POST /v1/admin/support/conversations/{id}/messages` answers — `SupportMessageDto`. */
interface SupportMessageDto {
  readonly id: number;
  readonly sender: string;
  readonly authorName: string;
  readonly body: string;
  readonly sentAt: string;
}

/**
 * Live uses `sender`/`sentAt`; the admin type's `author`/`createdAt`. Live also
 * has no `conversationId` at all — filled in from the enclosing request's id,
 * since the caller already knows which conversation it fetched/replied to.
 */
function toSupportMessage(dto: SupportMessageDto, conversationId: string): SupportMessage {
  return {
    id: String(dto.id),
    conversationId,
    author: dto.sender as SupportMessage["author"],
    authorName: dto.authorName,
    body: dto.body,
    createdAt: dto.sentAt,
  };
}

interface SupportThreadDto {
  readonly conversation: ConversationSummaryDto;
  readonly messages: readonly SupportMessageDto[];
  readonly unread: number;
}

/** The support inbox over `/v1/admin/support/conversations`. */
export const httpSupportAdminService: SupportAdminService = {
  listConversations: async (query = {}) => {
    const page = await httpClient.get<Paginated<ConversationSummaryDto>>(
      "/v1/admin/support/conversations",
      {
        /* `adminListParams` also sends `sortField`/`sortDir`/`locale`, but the live
           `GET /admin/support/conversations` only defines `Page,PageSize,Status,
           Search` (checked docs/api-live/admin.json) — sorting and localizing the
           inbox isn't actually possible server-side today. Harmless extras, left
           in since `adminListParams` is shared and not worth a one-off here. */
        query: { ...adminListParams(query), status: query.status },
        auth: true,
      },
    );
    return { items: page.items.map(toConversationSummary), meta: page.meta };
  },
  getConversation: async (id) => {
    const dto = await orNull(
      httpClient.get<SupportThreadDto>(`/v1/admin/support/conversations/${enc(id)}`, { auth: true }),
    );
    if (!dto) return null;
    const thread: ConversationThread = {
      conversation: toConversationSummary(dto.conversation),
      messages: dto.messages.map((message) => toSupportMessage(message, id)),
    };
    return thread;
  },
  reply: async (id, body) => {
    const dto = await httpClient.post<SupportMessageDto>(
      `/v1/admin/support/conversations/${enc(id)}/messages`,
      { body },
      { auth: true },
    );
    return toSupportMessage(dto, id);
  },
  setStatus: async (id, status) => {
    const dto = await httpClient.put<ConversationSummaryDto>(
      `/v1/admin/support/conversations/${enc(id)}/status`,
      { status },
      { auth: true },
    );
    return toConversationSummary(dto);
  },
  countUnread: async () =>
    (await httpClient.get<{ count: number }>("/v1/admin/support/unread-count", { auth: true })).count,
};
