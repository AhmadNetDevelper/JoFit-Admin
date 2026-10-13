import { ReferenceEditor } from "@/components/crud";
import { TableThumbnail } from "@/components/data-table";
import { RequirePermission, usePermission } from "@/features/auth";
import { contentAdminService, type Author, type AuthorDraft } from "@/features/content";
import { useFormatters, useTranslation } from "@/i18n";

const EMPTY: AuthorDraft = { name: "" };

/* A removed photo is sent as `null`: left out, the API keeps the one on file. */
const withAvatarChoice = (draft: AuthorDraft): AuthorDraft => ({ ...draft, avatar: draft.avatar ?? null });

/**
 * Content → Authors. A name is a person's and is never translated; the role
 * and biography are printed on the Arabic blog too, so each is written in both
 * languages or left out. Someone with articles to their name cannot be deleted
 * until those articles are given to another author.
 */
export function AuthorsRoute() {
  const { t } = useTranslation();
  const { text, number } = useFormatters();
  const canWrite = usePermission("content:write");

  return (
    <RequirePermission permission="content:read">
      <ReferenceEditor<Author, AuthorDraft>
        title={t("authors.title")}
        description={t("authors.description")}
        noun={t("authors.noun")}
        load={(query) => contentAdminService.listAuthorsPage(query)}
        nameOf={(author) => author.name}
        canWrite={canWrite}
        columns={[
          { key: "avatar", header: t("authors.avatar"), render: (author) => <TableThumbnail image={author.avatar} /> },
          { key: "name", header: t("field.name"), render: (author) => <span dir="auto">{author.name}</span> },
          { key: "role", header: t("authors.role"), render: (author) => (author.role ? text(author.role) : "—") },
          {
            key: "articles",
            header: t("content.articleCount"),
            align: "end",
            render: (author) => <span data-figure>{number(author.articleCount ?? 0)}</span>,
          },
        ]}
        fields={[
          { kind: "text", key: "name", label: t("field.name"), hint: t("authors.nameHint"), required: true },
          { kind: "slug", key: "slug", label: t("field.slug"), hint: t("authors.slugHint"), from: "name" },
          {
            kind: "image",
            key: "avatar",
            label: t("authors.avatar"),
            hint: t("authors.avatarHint"),
            purpose: "author-avatar",
            aspect: "square",
          },
          { kind: "localized", key: "role", label: t("authors.role"), hint: t("authors.roleHint") },
          { kind: "localizedMultiline", key: "bio", label: t("authors.bio"), hint: t("authors.bioHint") },
        ]}
        empty={EMPTY}
        toDraft={({ id: _id, articleCount: _count, ...draft }) => draft}
        create={(draft) => contentAdminService.createAuthor(withAvatarChoice(draft))}
        update={(id, draft) => contentAdminService.updateAuthor(id, withAvatarChoice(draft))}
        remove={(id) => contentAdminService.deleteAuthor(id)}
      />
    </RequirePermission>
  );
}
