import type { Paginated } from "@/types";

import type {
  ConversationListQuery,
  ConversationStatus,
  ConversationSummary,
  ConversationThread,
  SupportMessage,
} from "../types";

export interface SupportAdminService {
  /** One page of the inbox, newest activity first — `GET /v1/admin/support/conversations`. */
  listConversations(query?: ConversationListQuery): Promise<Paginated<ConversationSummary>>;
  /** The thread, and marks it read for staff. */
  getConversation(id: string): Promise<ConversationThread | null>;
  reply(id: string, body: string): Promise<SupportMessage>;
  setStatus(id: string, status: ConversationStatus): Promise<ConversationSummary>;
  /** Conversations with a visitor message staff have not opened yet. */
  countUnread(): Promise<number>;
}
