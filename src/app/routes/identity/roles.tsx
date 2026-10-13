import { useState } from "react";

import { ReferenceEditor } from "@/components/crud";
import { identityService, type Role } from "@/features/identity";
import { useTranslation } from "@/i18n";

import { RecordLink } from "../../components/record-parts";

interface RoleFormDraft {
  readonly name: string;
  /** `""` for a role that starts with no permissions. */
  readonly cloneFromRoleId: string;
}

const EMPTY: RoleFormDraft = { name: "", cloneFromRoleId: "" };

/**
 * The platform's roles: add, rename, delete. What a role may do is ticked on
 * its own page (the name links there), since a role carries dozens of
 * permissions and the dialog is for its name.
 */
export function RolesRoute() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<readonly Role[]>([]);

  return (
    <ReferenceEditor<Role, RoleFormDraft>
      title={t("identity.roles.title")}
      description={t("identity.roles.description")}
      noun={t("identity.roles.noun")}
      load={async () => {
        const list = await identityService.listRoles();
        setRoles(list);
        return list;
      }}
      nameOf={(role) => role.name}
      canWrite
      columns={[
        {
          key: "name",
          header: t("identity.roles.name"),
          render: (role) => <RecordLink to={`/access/roles/${role.id}`}>{role.name}</RecordLink>,
        },
        {
          key: "permissions",
          header: t("identity.roles.manage"),
          align: "end",
          render: (role) => <RecordLink to={`/access/roles/${role.id}`}>{t("identity.roles.manage")}</RecordLink>,
        },
      ]}
      fields={(editing) => [
        { kind: "text", key: "name", label: t("identity.roles.name"), required: true },
        ...(editing
          ? []
          : [
              {
                kind: "select" as const,
                key: "cloneFromRoleId" as const,
                label: t("identity.roles.cloneFrom"),
                hint: t("identity.roles.cloneHint"),
                options: [
                  { value: "", label: t("identity.roles.cloneNone") },
                  ...roles.map((role) => ({ value: role.id, label: role.name })),
                ],
              },
            ]),
      ]}
      empty={EMPTY}
      toDraft={(role) => ({ name: role.name, cloneFromRoleId: "" })}
      create={(draft) =>
        identityService.createRole({
          name: draft.name,
          ...(draft.cloneFromRoleId ? { cloneFromRoleId: draft.cloneFromRoleId } : {}),
        })
      }
      update={(id, draft) => identityService.renameRole(id, draft.name)}
      remove={(id) => identityService.deleteRole(id)}
    />
  );
}
