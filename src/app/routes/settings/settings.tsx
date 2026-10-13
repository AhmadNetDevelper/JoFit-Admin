import { useState } from "react";
import { Link } from "react-router-dom";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import {
  Badge,
  Button,
  PageHeader,
  SearchInput,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  ADMIN_ROLES,
  RequirePermission,
  authService,
  rolePermissions,
  useSession,
  type AdminUser,
} from "@/features/auth";
import { settingsService } from "@/features/settings";
import { useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import { PERMISSIONS } from "@/types";

import { Section } from "../../components/record-parts";
import { ThemeEditor } from "./theme-editor";

/**
 * The staff accounts, one page at a time from the API (`listStaffPage`). The
 * page and the search live in this component rather than the URL: the table is
 * one tab of the settings screen, not a screen of its own — the Team screen is.
 */
function StaffTable() {
  const { t, locale } = useTranslation();
  const { number } = useFormatters();
  const { session } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const state = useAsyncData(
    () => authService.listStaffPage({ page, search, locale }),
    [page, search, locale],
  );

  const columns: readonly DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: t("field.name"),
      render: (user) => (
        <span className="font-medium">
          {user.name}
          {session?.user.id === user.id ? (
            <Badge variant="secondary" className="ms-2">
              {t("settings.you")}
            </Badge>
          ) : null}
        </span>
      ),
    },
    { key: "email", header: t("field.email"), render: (user) => <span dir="ltr">{user.email}</span> },
    { key: "role", header: t("settings.role"), render: (user) => t(`team.role.${user.role}`) },
    {
      key: "permissions",
      header: t("settings.permissions"),
      align: "end",
      render: (user) => (
        <span data-figure>{`${number(rolePermissions[user.role].length)} / ${number(PERMISSIONS.length)}`}</span>
      ),
    },
  ];

  return (
    <Section
      id="staff"
      title={t("settings.staff")}
      description={t("settings.staffHintTeam")}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            label={t("action.search")}
            value={search}
            onChange={(term) => {
              setSearch(term);
              setPage(1);
            }}
          />
          <Button asChild variant="outline" size="sm">
            <Link to="/team">{t("settings.manageTeam")}</Link>
          </Button>
        </div>
      }
      flush
    >
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={4}>
        {(result) => (
          <div>
            <DataTable
              caption={t("settings.staff")}
              columns={columns}
              rows={result.items}
              getRowKey={(user) => user.id}
              emptyLabel={search ? undefined : t("state.empty")}
            />
            <div className="border-t px-4 py-3">
              <PaginationControls meta={result.meta} onPageChange={setPage} />
            </div>
          </div>
        )}
      </AsyncBoundary>
    </Section>
  );
}

/**
 * Platform settings: the storefront's theme, and who works in this console.
 *
 * Staff accounts are listed here read-only, one page at a time; they are
 * added, edited and removed on the Team screen. Whether an identity provider
 * later takes that over remains an OPEN BUSINESS DECISION.
 */
export function SettingsRoute() {
  const { t } = useTranslation();

  const state = useAsyncData(() => settingsService.getTheme(), []);

  return (
    <RequirePermission permission="settings:write">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={6}>
        {(theme) => (
          <Tabs defaultValue="theme" className="gap-4">
            <TabsList>
              <TabsTrigger value="theme">{t("settings.tabTheme")}</TabsTrigger>
              <TabsTrigger value="staff">{t("settings.tabStaff")}</TabsTrigger>
            </TabsList>

            <TabsContent value="theme">
              <ThemeEditor theme={theme} onSaved={state.refetch} />
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <StaffTable />

              {/* The whole policy at once: which role may do what. Read from the
                  same table the sidebar and every button consult, so it cannot
                  describe a policy the UI does not enforce. */}
              <Section id="matrix" title={t("settings.matrix")} description={t("settings.matrixHint")} flush>
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption className="sr-only">{t("settings.matrix")}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("settings.permission")}</TableHead>
                        {ADMIN_ROLES.map((role) => (
                          <TableHead key={role} className="text-center">
                            {t(`team.role.${role}`)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PERMISSIONS.map((permission) => (
                        <TableRow key={permission}>
                          <TableCell className="font-mono text-xs" dir="ltr">
                            {permission}
                          </TableCell>
                          {ADMIN_ROLES.map((role) => {
                            const allowed = rolePermissions[role].includes(permission);
                            return (
                              <TableCell key={role} className="text-center">
                                <span aria-label={allowed ? t("state.yes") : t("state.no")}>
                                  {allowed ? "●" : "·"}
                                </span>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Section>
            </TabsContent>
          </Tabs>
        )}
      </AsyncBoundary>
    </RequirePermission>
  );
}
