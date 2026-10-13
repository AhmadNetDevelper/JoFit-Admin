import type { ListQuery } from "@/types";

export const CONVERSATION_STATUSES = ["open", "closed"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

/**
 * A support chat a visitor started on the storefront. A signed-in customer's
 * carries their `customerId`; a guest's only the name and email they gave.
 */
export interface Conversation {
  readonly id: string;
  readonly reference: string;
  readonly accountId?: string;
  readonly customerId?: string;
  readonly name: string;
  readonly email: string;
  readonly status: ConversationStatus;
  readonly createdAt: string;
  readonly lastMessageAt: string;
  readonly visitorReadAt?: string;
  /** When staff last opened it; visitor messages after this are unread. */
  readonly staffReadAt?: string;
  readonly assigneeId?: string | null;
}

export interface SupportMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly author: "visitor" | "staff";
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
}

/** A row in the inbox. */
export interface ConversationSummary extends Conversation {
  readonly lastMessage: string;
  readonly unread: number;
}

export interface ConversationThread {
  readonly conversation: ConversationSummary;
  readonly messages: readonly SupportMessage[];
}

/**
 * The inbox, one page at a time. `search` matches the visitor's name, email
 * or the conversation's reference; newest activity first.
 */
export interface ConversationListQuery extends ListQuery {
  readonly status?: ConversationStatus;
}
