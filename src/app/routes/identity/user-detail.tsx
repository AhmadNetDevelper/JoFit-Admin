import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { FormError } from "@/components/form";
import { Badge, Button, NativeSelect, NativeSelectOption, PageHeader } from "@/components/ui";
import {
  identityService,
  type AccessPermission,
  type PermissionOverride,
  type PlatformUser,
  type UserPermission,
} from "@/features/identity";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { entryLabel, loadIdentityOptions, type IdentityOptions } from "./identity-options";
import { UserFormDialog } from "./user-form-dialog";

/**
 * ONE ACCOUNT: its details, and what it may do.
 *
 * The permissions table puts the role's answer beside any setting made on
 * this account alone, and the result of the two — a direct grant or denial
 * always wins. Saving sends the whole list of direct settings, which is how
 * the API stores them.
 */
export function UserDetailRoute() {
  const { userId = "" } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notice = useNotice();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const state = useAsyncData(async () => {
    const [user, options] = await Promise.all([identityService.getUser(userId), loadIdentityOptions()]);
    return user ? { user, options } : null;
  }, [userId]);

  return (
    <>
      <BackLink to="/access/users" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={6}>
        {(data) => {
          if (!data) return <StateMessage tone="error" title={t("error.not-found")} />;
          const { user, options } = data;
          return (
            <>
              <PageHeader
                title={user.fullName || user.userName}
                /* Isolated so a Latin handle and address keep their order inside Arabic text. */
                description={`⁦@${user.userName}⁩ · ⁦${user.email}⁩`}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    {user.isActive ? <Badge>{t("identity.active")}</Badge> : <Badge variant="outline">{t("identity.inactive")}</Badge>}
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil aria-hidden="true" /> {t("identity.user.editDetails")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleting(true)}>
                      <Trash2 aria-hidden="true" /> {t("identity.user.delete")}
                    </Button>
                  </div>
                }
              />
              <ProfileSection user={user} options={options} />
              <UserPermissionsSection key={user.id} userId={user.id} />
              <UserFormDialog
                mode={{ kind: "edit", user }}
                open={editing}
                onOpenChange={setEditing}
                onSaved={() => state.refetch()}
              />
              <ConfirmDialog
                open={deleting}
                onOpenChange={setDeleting}
                title={t("crud.deleteTitle", { name: user.fullName || user.userName })}
                description={t("identity.user.deleteBody")}
                onConfirm={async () => {
                  await identityService.deleteUser(user.id);
                  notice.success(t("crud.deleted", { name: user.fullName || user.userName }));
                  navigate("/access/users", { replace: true });
                }}
              />
            </>
          );
        }}
      </AsyncBoundary>
    </>
  );
}

function ProfileSection({ user, options }: { user: PlatformUser; options: IdentityOptions }) {
  const { t } = useTranslation();
  const { date, text } = useFormatters();
  const nameIn = (list: IdentityOptions["countries"], id?: string) => {
    const entry = id ? list.find((candidate) => candidate.id === id) : undefined;
    return entry ? text(entryLabel(entry)) : "—";
  };

  return (
    <Section id="profile" title={t("identity.user.profile")}>
      <Facts
        columns={3}
        facts={[
          { label: t("identity.field.userName"), value: <span dir="ltr">{user.userName}</span> },
          { label: t("field.email"), value: <span dir="ltr">{user.email}</span> },
          { label: t("field.phone"), value: <span dir="ltr">{user.phoneNumber ?? "—"}</span> },
          { label: t("identity.field.gender"), value: user.genderId ? t(`identity.gender.${user.genderId}`) : "—" },
          { label: t("identity.field.birthDate"), value: user.birthDate ? date(user.birthDate) : "—" },
          {
            label: t("identity.field.role"),
            value: user.roleId ? (
              <RecordLink to={`/access/roles/${user.roleId}`}>{user.roleName ?? user.roleId}</RecordLink>
            ) : (
              t("identity.user.noRole")
            ),
          },
          { label: t("identity.field.country"), value: nameIn(options.countries, user.countryId) },
          { label: t("identity.field.city"), value: nameIn(options.cities, user.cityId) },
          { label: t("identity.field.jobStatus"), value: nameIn(options.jobStatuses, user.jobStatusId) },
        ]}
      />
    </Section>
  );
}

type Choice = "role" | "grant" | "deny";

interface PermissionRow {
  readonly permission: AccessPermission;
  readonly fromRole: boolean;
}

function choicesOf(direct: readonly UserPermission[]): Readonly<Record<string, Choice>> {
  return Object.fromEntries(direct.map((entry) => [entry.permissionId, entry.isGranted ? "grant" : "deny"]));
}

function UserPermissionsSection({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const state = useAsyncData(async () => {
    const [permissions, fromRole, direct] = await Promise.all([
      identityService.listPermissions(),
      identityService.listRolePermissionsOfUser(userId),
      identityService.listDirectPermissions(userId),
    ]);
    return { permissions, fromRole, direct };
  }, [userId]);

  return (
    <Section id="permissions" title={t("identity.permissions.title")} description={t("identity.permissions.description")} flush>
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={4}>
        {(data) => (
          <PermissionsEditor
            userId={userId}
            permissions={data.permissions}
            fromRole={data.fromRole}
            direct={data.direct}
            onSaved={state.refetch}
          />
        )}
      </AsyncBoundary>
    </Section>
  );
}

function PermissionsEditor({
  userId,
  permissions,
  fromRole,
  direct,
  onSaved,
}: {
  userId: string;
  permissions: readonly AccessPermission[];
  fromRole: readonly UserPermission[];
  direct: readonly UserPermission[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { number } = useFormatters();
  const notice = useNotice();
  const saved = useMemo(() => choicesOf(direct), [direct]);
  const [choices, setChoices] = useState<Readonly<Record<string, Choice>>>(saved);

  const rows = useMemo<readonly PermissionRow[]>(() => {
    const granted = new Set(fromRole.filter((entry) => entry.isGranted).map((entry) => entry.permissionId));
    return [...permissions]
      .sort((a, b) => a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action))
      .map((permission) => ({ permission, fromRole: granted.has(permission.id) }));
  }, [permissions, fromRole]);

  const choiceOf = (id: string): Choice => choices[id] ?? "role";
  const allowed = (row: PermissionRow) => {
    const choice = choiceOf(row.permission.id);
    return choice === "role" ? row.fromRole : choice === "grant";
  };
  const dirty = rows.some((row) => choiceOf(row.permission.id) !== (saved[row.permission.id] ?? "role"));

  const save = useAsyncAction(
    () => {
      const overrides: PermissionOverride[] = rows.flatMap((row) => {
        const choice = choiceOf(row.permission.id);
        return choice === "role" ? [] : [{ permissionId: row.permission.id, isGranted: choice === "grant" }];
      });
      return identityService.setDirectPermissions(userId, overrides);
    },
    {
      onSuccess: () => {
        notice.success(t("identity.permissions.saved"));
        onSaved();
      },
    },
  );

  const columns: readonly DataTableColumn<PermissionRow>[] = [
    {
      key: "permission",
      header: t("identity.permissions.permission"),
      render: (row) => (
        <div className="flex flex-col">
          <span dir="ltr" className="font-medium">
            {row.permission.name}
          </span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {`${row.permission.resource} · ${row.permission.action}`}
          </span>
        </div>
      ),
    },
    {
      key: "fromRole",
      header: t("identity.permissions.fromRole"),
      render: (row) =>
        row.fromRole ? (
          <Badge variant="secondary">{t("identity.permissions.granted")}</Badge>
        ) : (
          <span className="text-muted-foreground">{t("identity.permissions.notGranted")}</span>
        ),
    },
    {
      key: "override",
      header: t("identity.permissions.override"),
      render: (row) => (
        <NativeSelect
          aria-label={`${t("identity.permissions.override")}: ${row.permission.name}`}
          wrapperClassName="w-36"
          value={choiceOf(row.permission.id)}
          onChange={(event) =>
            setChoices((current) => ({ ...current, [row.permission.id]: event.target.value as Choice }))
          }
        >
          <NativeSelectOption value="role">{t("identity.permissions.followRole")}</NativeSelectOption>
          <NativeSelectOption value="grant">{t("identity.permissions.grant")}</NativeSelectOption>
          <NativeSelectOption value="deny">{t("identity.permissions.deny")}</NativeSelectOption>
        </NativeSelect>
      ),
    },
    {
      key: "effective",
      header: t("identity.permissions.effective"),
      align: "end",
      render: (row) =>
        allowed(row) ? (
          <Badge>{t("identity.permissions.allowed")}</Badge>
        ) : (
          <Badge variant="outline">{t("identity.permissions.denied")}</Badge>
        ),
    },
  ];

  if (rows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">{t("identity.permissions.none")}</p>;
  }

  return (
    <div>
      <DataTable
        caption={t("identity.permissions.title")}
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.permission.id}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
        <p className="text-sm text-muted-foreground">
          {t("identity.permissions.count", {
            granted: number(rows.filter(allowed).length),
            total: number(rows.length),
          })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <FormError error={save.error} labels={{}} summary={false} />
          <Button variant="outline" disabled={!dirty || save.isPending} onClick={() => setChoices(saved)}>
            {t("identity.permissions.discard")}
          </Button>
          <Button disabled={!dirty || save.isPending} onClick={() => void save.run(undefined)}>
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {save.isPending ? t("action.saving") : t("identity.permissions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
