import type { Conversation, SupportMessage } from "@/features/support";

/**
 * Support conversations, mirrored from the storefront (where visitors write
 * them) by the dev bridge. Empty on its own: nobody has asked anything yet.
 */
export const mockConversations: Conversation[] = [];
export const mockSupportMessages: SupportMessage[] = [];
