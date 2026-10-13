import { Loader2, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ListEmpty, PaginationControls } from "@/components/data-table";
import { AsyncBoundary, StateMessage } from "@/components/feedback";
import { FormError } from "@/components/form";
import {
  Badge,
  Button,
  Card,
  Label,
  NativeSelect,
  NativeSelectOption,
  PageHeader,
  SearchInput,
  Textarea,
} from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  supportAdminService,
  type ConversationStatus,
  type ConversationSummary,
  type ConversationThread,
} from "@/features/support";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

/** How often an open inbox looks for new messages. */
const POLL_MS = 5_000;

/** Re-runs `refetch` on an interval while the tab is visible. */
function usePolling(refetch: () => void) {
  useEffect(() => {
    const timer = window.setInterval(() => document.visibilityState === "visible" && refetch(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [refetch]);
}

function ConversationList({
  conversations,
  activeId,
  searching,
}: {
  conversations: readonly ConversationSummary[];
  activeId?: string;
  /** A search that matches nothing says so, rather than "no conversations yet". */
  searching: boolean;
}) {
  const { t } = useTranslation();
  const { dateTime, number } = useFormatters();

  if (conversations.length === 0) {
    return <ListEmpty label={searching ? undefined : t("support.empty")} />;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <Link
            to={`/support/${conversation.id}`}
            aria-current={conversation.id === activeId ? "page" : undefined}
            className="block rounded-lg px-3 py-2.5 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted"
          >
            <div className="flex items-center justify-between gap-2">
              <p dir="auto" className={`truncate text-sm ${conversation.unread > 0 ? "font-semibold" : "font-medium"}`}>
                {conversation.name}
              </p>
              {conversation.unread > 0 ? (
                <Badge aria-label={t("support.unread", { count: number(conversation.unread) })}>
                  {number(conversation.unread)}
                </Badge>
              ) : conversation.status === "closed" ? (
                <Badge variant="secondary">{t("support.filterClosed")}</Badge>
              ) : null}
            </div>
            {/* Visitors write in either language inside an admin shown in the
                other, so every piece of their text sets its own direction. */}
            <p dir="auto" className="mt-0.5 truncate text-start text-xs text-muted-foreground">
              {conversation.lastMessage}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              <span dir="ltr">{conversation.reference}</span> · {dateTime(conversation.lastMessageAt)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Thread({ thread, onChanged }: { thread: ConversationThread; onChanged: () => void }) {
  const { t } = useTranslation();
  const { dateTime } = useFormatters();
  const canReply = usePermission("support:reply");
  const [body, setBody] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const { conversation, messages } = thread;

  const reply = useAsyncAction((text: string) => supportAdminService.reply(conversation.id, text), {
    onSuccess: () => {
      setBody("");
      onChanged();
    },
  });
  const setStatus = useAsyncAction(
    (status: ConversationStatus) => supportAdminService.setStatus(conversation.id, status),
    { onSuccess: onChanged },
  );

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <Card className="min-h-128 gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <p dir="auto" className="font-semibold">
            {conversation.name}
          </p>
          <p className="text-xs text-muted-foreground">
            <span dir="ltr">{conversation.email}</span> · <span dir="ltr">{conversation.reference}</span> ·{" "}
            {conversation.customerId ? (
              <Link to={`/customers/${conversation.customerId}`} className="underline-offset-4 hover:underline">
                {t("support.customerRecord")}
              </Link>
            ) : (
              t("support.guest")
            )}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canReply || setStatus.isPending}
          onClick={() => void setStatus.run(conversation.status === "open" ? "closed" : "open")}
        >
          {conversation.status === "open" ? t("support.close") : t("support.reopen")}
        </Button>
      </div>

      <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((message) => {
          const staff = message.author === "staff";
          return (
            <div key={message.id} className={`flex ${staff ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  staff ? "rounded-ee-md bg-primary text-primary-foreground" : "rounded-es-md bg-muted"
                }`}
              >
                <p className="text-[11px] font-medium opacity-75">
                  <bdi>{message.authorName}</bdi> · {dateTime(message.createdAt)}
                </p>
                <p dir="auto" className="mt-0.5 whitespace-pre-wrap">
                  {message.body}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>

      {/* A chat composer: the box grows with the reply up to a limit, and Send
          stays level with its last line. */}
      <form
        className="border-t bg-muted/30 px-5 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (body.trim()) void reply.run(body);
        }}
      >
        <FormError error={reply.error ?? setStatus.error} />
        <Label htmlFor="support-reply" className="sr-only">
          {t("support.replyLabel")}
        </Label>
        <div className="flex items-end gap-2">
          <Textarea
            id="support-reply"
            rows={1}
            dir="auto"
            value={body}
            /* The live API accepts 1–2000 characters per reply (`POST .../messages`
               summary in the OpenAPI doc); enforced here too so staff hit the limit
               while typing, not as a 422 after Send. */
            maxLength={2000}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) event.currentTarget.form?.requestSubmit();
            }}
            placeholder={t("support.replyPlaceholder")}
            disabled={!canReply}
            aria-describedby="support-reply-hint"
            className="max-h-48 min-h-10 flex-1 resize-none bg-background py-2.5"
          />
          <Button type="submit" className="h-10 px-4" disabled={!canReply || reply.isPending || !body.trim()}>
            {reply.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizontal className="rtl:-scale-x-100" aria-hidden="true" />
            )}
            {reply.isPending ? t("support.sending") : t("support.send")}
          </Button>
        </div>
        <p id="support-reply-hint" className="mt-1.5 text-xs text-muted-foreground">
          {t("support.sendHint")}
        </p>
      </form>
    </Card>
  );
}

function ThreadPane({ conversationId, onChanged }: { conversationId: string; onChanged: () => void }) {
  const { t } = useTranslation();
  const state = useAsyncData(() => supportAdminService.getConversation(conversationId), [conversationId]);
  usePolling(state.refetch);

  return (
    <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
      {(thread) =>
        thread ? (
          <Thread
            thread={thread}
            onChanged={() => {
              state.refetch();
              onChanged();
            }}
          />
        ) : (
          <StateMessage title={t("state.unavailableTitle")} description={t("state.unavailableBody")} />
        )
      }
    </AsyncBoundary>
  );
}

const FILTERS = [
  { value: "open", key: "support.filterOpen" },
  { value: "closed", key: "support.filterClosed" },
  { value: "all", key: "support.filterAll" },
] as const;

/**
 * BUSINESS → SUPPORT.
 *
 * The inbox for the storefront's chat bubble. Conversations on the start side,
 * the open one beside them; both refresh every few seconds, so a visitor's
 * message appears without a reload and a reply reaches their chat within
 * seconds.
 *
 * The inbox is paged by the API, newest activity first. Its page, filter and
 * search are kept here rather than in the URL: opening a conversation changes
 * the path, and the inbox must stay where it was. The thread itself is a chat
 * and is read whole.
 */
export function SupportRoute() {
  const { conversationId } = useParams();
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("open");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useAsyncData(
    () =>
      supportAdminService.listConversations({
        status: filter === "all" ? undefined : filter,
        search,
        page,
        locale,
      }),
    [filter, search, page, locale],
  );
  /* Polling re-reads the page on screen, so page 2 stays page 2. */
  usePolling(list.refetch);

  return (
    <RequirePermission permission="support:reply">
      <PageHeader title={t("support.title")} description={t("support.description")} />
      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="gap-0 py-0">
          {/* The inbox's own header: which conversations, then a search across them. */}
          <div className="flex flex-col gap-3 border-b p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="ps-1 text-sm font-semibold">{t("support.conversations")}</h2>
              <NativeSelect
                aria-label={t("field.status")}
                size="sm"
                wrapperClassName="w-28 shrink-0"
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value as (typeof FILTERS)[number]["value"]);
                  setPage(1);
                }}
              >
                {FILTERS.map((entry) => (
                  <NativeSelectOption key={entry.value} value={entry.value}>
                    {t(entry.key)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <SearchInput
              label={t("support.searchPlaceholder")}
              value={search}
              onChange={(term) => {
                setSearch(term);
                setPage(1);
              }}
            />
          </div>
          <AsyncBoundary state={list} pendingLabel={t("state.loading")} pendingRows={4}>
            {(result) => (
              <div>
                <div className="p-2">
                  <ConversationList conversations={result.items} activeId={conversationId} searching={Boolean(search)} />
                </div>
                <div className="border-t px-3 py-3">
                  <PaginationControls meta={result.meta} onPageChange={setPage} />
                </div>
              </div>
            )}
          </AsyncBoundary>
        </Card>

        {conversationId ? (
          <ThreadPane key={conversationId} conversationId={conversationId} onChanged={list.refetch} />
        ) : (
          <StateMessage title={t("support.title")} description={t("support.select")} />
        )}
      </div>
    </RequirePermission>
  );
}
