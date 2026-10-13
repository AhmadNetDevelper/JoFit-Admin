import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { Badge, Button, ListCard, NativeSelect, NativeSelectOption, PageHeader, SearchInput } from "@/components/ui";
import { identityService, type PlatformUser } from "@/features/identity";
import { useAsyncData, useListQuery } from "@/hooks";
import { useTranslation } from "@/i18n";

import { RecordLink } from "../../components/record-parts";
import { UserFormDialog } from "./user-form-dialog";

type StatusFilter = "active" | "inactive";

const isStatus = (value: string | null): value is StatusFilter => value === "active" || value === "inactive";

/**
 * Every account on the platform, paged and searched by the API. Status and
 * role filters live in the URL beside the page and search, so a filtered view
 * can be shared like any other list.
 */
export function UsersRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const { query, setSearch, setPage } = useListQuery();

  const statusParam = params.get("status");
  const status = isStatus(statusParam) ? statusParam : undefined;
  const roleName = params.get("role") ?? undefined;

  const setFilter = (key: "status" | "role", value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next, { replace: true });
  };

  const state = useAsyncData(
    () =>
      identityService.listUsers({
        ...query,
        ...(status ? { isActive: status === "active" } : {}),
        ...(roleName ? { roleName } : {}),
      }),
    [query, status, roleName],
  );
  const roles = useAsyncData(() => identityService.listRoles(), []);

  const columns: readonly DataTableColumn<PlatformUser>[] = [
    {
      key: "name",
      header: t("identity.field.fullName"),
      render: (user) => (
        <div className="flex flex-col">
          <RecordLink to={`/access/users/${user.id}`}>
            <span dir="auto">{user.fullName || user.userName}</span>
          </RecordLink>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {`@${user.userName}`}
          </span>
        </div>
      ),
    },
    { key: "email", header: t("field.email"), render: (user) => <span dir="ltr">{user.email}</span> },
    { key: "phone", header: t("field.phone"), render: (user) => <span dir="ltr">{user.phoneNumber ?? "—"}</span> },
    {
      key: "role",
      header: t("identity.field.role"),
      render: (user) =>
        user.roleName ? <Badge variant="secondary">{user.roleName}</Badge> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "status",
      header: t("field.status"),
      render: (user) =>
        user.isActive ? <Badge>{t("identity.active")}</Badge> : <Badge variant="outline">{t("identity.inactive")}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title={t("identity.users.title")}
        description={t("identity.users.description")}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" /> {t("identity.users.new")}
          </Button>
        }
      />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(page) => (
          <ListCard
            toolbar={
              <>
                <SearchInput label={t("action.search")} value={query.search ?? ""} onChange={setSearch} />
                <NativeSelect
                  aria-label={t("identity.users.filterStatus")}
                  wrapperClassName="w-44"
                  value={status ?? ""}
                  onChange={(event) => setFilter("status", event.target.value)}
                >
                  <NativeSelectOption value="">{t("identity.users.allStatuses")}</NativeSelectOption>
                  <NativeSelectOption value="active">{t("identity.active")}</NativeSelectOption>
                  <NativeSelectOption value="inactive">{t("identity.inactive")}</NativeSelectOption>
                </NativeSelect>
                <NativeSelect
                  aria-label={t("identity.users.filterRole")}
                  wrapperClassName="w-44"
                  value={roleName ?? ""}
                  onChange={(event) => setFilter("role", event.target.value)}
                >
                  <NativeSelectOption value="">{t("identity.users.allRoles")}</NativeSelectOption>
                  {(roles.data ?? []).map((role) => (
                    <NativeSelectOption key={role.id} value={role.name}>
                      {role.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("identity.users.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(user) => user.id}
              emptyLabel={t("identity.users.empty")}
            />
          </ListCard>
        )}
      </AsyncBoundary>
      <UserFormDialog
        mode={{ kind: "create" }}
        open={creating}
        onOpenChange={setCreating}
        onSaved={(user) => navigate(`/access/users/${user.id}`)}
      />
    </>
  );
}
