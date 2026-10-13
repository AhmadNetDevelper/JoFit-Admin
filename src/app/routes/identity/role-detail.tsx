import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { CheckboxGroupField, FormError } from "@/components/form";
import { Button, PageHeader } from "@/components/ui";
import { identityService, type AccessPermission, type RoleWithPermissions } from "@/features/identity";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, Section } from "../../components/record-parts";

/**
 * ONE ROLE, EVERYTHING IT MAY DO. Permissions are grouped by the resource
 * they act on; saving replaces the role's set with exactly what is ticked.
 */
export function RoleDetailRoute() {
  const { roleId = "" } = useParams();
  const { t } = useTranslation();

  const state = useAsyncData(async () => {
    const [role, permissions] = await Promise.all([identityService.getRole(roleId), identityService.listPermissions()]);
    return role ? { role, permissions } : null;
  }, [roleId]);

  return (
    <>
      <BackLink to="/access/roles" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={6}>
        {(data) =>
          data ? (
            <RolePermissions key={data.role.id} role={data.role} permissions={data.permissions} onSaved={state.refetch} />
          ) : (
            <StateMessage tone="error" title={t("error.not-found")} />
          )
        }
      </AsyncBoundary>
    </>
  );
}

function RolePermissions({
  role,
  permissions,
  onSaved,
}: {
  role: RoleWithPermissions;
  permissions: readonly AccessPermission[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { number } = useFormatters();
  const notice = useNotice();
  const saved = useMemo(() => role.permissions.map((permission) => permission.id), [role]);
  const [checked, setChecked] = useState<readonly string[]>(saved);

  const groups = useMemo(() => {
    const byResource = new Map<string, AccessPermission[]>();
    for (const permission of permissions) {
      byResource.set(permission.resource, [...(byResource.get(permission.resource) ?? []), permission]);
    }
    return [...byResource.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const dirty = checked.length !== saved.length || checked.some((id) => !saved.includes(id));
  const save = useAsyncAction((ids: readonly string[]) => identityService.setRolePermissions(role.id, ids), {
    onSuccess: () => {
      notice.success(t("identity.permissions.saved"));
      onSaved();
    },
  });

  const setGroup = (ids: readonly string[], on: boolean) =>
    setChecked((current) => (on ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id))));

  return (
    <>
      <PageHeader
        title={role.name}
        description={t("identity.permissions.count", { granted: number(checked.length), total: number(permissions.length) })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={!dirty || save.isPending} onClick={() => setChecked(saved)}>
              {t("identity.permissions.discard")}
            </Button>
            <Button disabled={!dirty || save.isPending} onClick={() => void save.run(checked)}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {save.isPending ? t("action.saving") : t("identity.permissions.save")}
            </Button>
          </div>
        }
      />
      <FormError error={save.error} labels={{}} summary={false} />
      <Section id="role-permissions" title={t("identity.permissions.title")} description={t("identity.role.description")}>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("identity.permissions.none")}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {groups.map(([resource, entries]) => {
              const ids = entries.map((entry) => entry.id);
              const all = ids.every((id) => checked.includes(id));
              return (
                <div key={resource} className="relative rounded-lg border p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute inset-e-2 top-2"
                    aria-label={`${all ? t("identity.role.clearAll") : t("identity.role.selectAll")}: ${resource}`}
                    onClick={() => setGroup(ids, !all)}
                  >
                    {all ? t("identity.role.clearAll") : t("identity.role.selectAll")}
                  </Button>
                  <CheckboxGroupField
                    name={`resource-${resource}`}
                    legend={resource}
                    columns={2}
                    options={entries.map((entry) => ({ value: entry.id, label: entry.action, note: entry.name }))}
                    value={checked.filter((id) => ids.includes(id))}
                    onChange={(next) =>
                      setChecked((current) => [...current.filter((id) => !ids.includes(id)), ...next])
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
