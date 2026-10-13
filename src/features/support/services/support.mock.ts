import { authService } from "@/features/auth";
import { notFound, nowIso, paginate, validationFailed } from "@/lib";
import { pushToStorefront } from "@/mocks/bridge";
import { matchesText, simulateLatency } from "@/mocks/runtime";
import { mockConversations, mockSupportMessages } from "@/mocks/support";

import type { Conversation, ConversationSummary, SupportMessage } from "../types";
import type { SupportAdminService } from "./support.contract";

function summarise(conversation: Conversation): ConversationSummary {
  const messages = mockSupportMessages.filter((message) => message.conversationId === conversation.id);
  const seen = conversation.staffReadAt ?? "";
  return {
    ...conversation,
    lastMessage: messages.at(-1)?.body ?? "",
    unread: messages.filter((message) => message.author === "visitor" && message.createdAt > seen).length,
  };
}

function update(id: string, changes: Partial<Conversation>): Conversation {
  const index = mockConversations.findIndex((entry) => entry.id === id);
  if (index < 0) throw notFound(`Conversation "${id}"`);
  const next = { ...mockConversations[index]!, ...changes };
  mockConversations[index] = next;
  pushToStorefront("conversation", id, changes);
  return next;
}

export const mockSupportAdminService: SupportAdminService = {
  async listConversations(query = {}) {
    await simulateLatency();
    const rows = mockConversations
      .filter((entry) => !query.status || entry.status === query.status)
      .filter((entry) => matchesText([entry.name, entry.email, entry.reference], query.search))
      .map(summarise)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    /* A page past the end answers the last one, as the API does — `paginate` sees to it. */
    return paginate(rows, query);
  },

  async getConversation(id) {
    await simulateLatency();
    const conversation = mockConversations.find((entry) => entry.id === id);
    if (!conversation) return null;
    const read = update(id, { staffReadAt: nowIso() });
    return {
      conversation: summarise(read),
      messages: mockSupportMessages
        .filter((message) => message.conversationId === id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  },

  async reply(id, body) {
    await simulateLatency();
    const text = body.trim();
    if (text.length < 1) throw validationFailed({ body: "Write a reply first." });
    if (text.length > 2000) throw validationFailed({ body: "Keep it under 2,000 characters." });
    const conversation = mockConversations.find((entry) => entry.id === id);
    if (!conversation) throw notFound(`Conversation "${id}"`);
    const session = await authService.getSession();
    const message: SupportMessage = {
      id: `msg-s${Date.now().toString(36)}`,
      conversationId: id,
      author: "staff",
      authorName: session?.user.name ?? "JoFit",
      body: text,
      createdAt: nowIso(),
    };
    mockSupportMessages.push(message);
    const index = mockConversations.indexOf(conversation);
    mockConversations[index] = { ...conversation, lastMessageAt: message.createdAt, staffReadAt: message.createdAt };
    pushToStorefront("support-message", message.id, { ...message }, "create");
    return message;
  },

  async setStatus(id, status) {
    await simulateLatency();
    return summarise(update(id, { status }));
  },

  async countUnread() {
    await simulateLatency();
    return mockConversations.map(summarise).filter((entry) => entry.unread > 0).length;
  },
};
