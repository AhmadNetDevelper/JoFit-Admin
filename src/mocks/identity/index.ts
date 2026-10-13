import type { AccessPermission, PermissionOverride, PlatformUser } from "@/features/identity";

const RESOURCES = ["Users", "Roles", "Products", "Orders", "Coaches", "Courses", "Articles", "Jobs"] as const;
const ACTIONS = ["Read", "Create", "Update", "Delete"] as const;

export const mockPermissions: AccessPermission[] = RESOURCES.flatMap((resource, r) =>
  ACTIONS.map((action, a) => ({
    id: `permission-${r * ACTIONS.length + a + 1}`,
    name: `${resource}.${action}`,
    resource,
    action,
  })),
);

const idsOf = (predicate: (permission: AccessPermission) => boolean) =>
  mockPermissions.filter(predicate).map((permission) => permission.id);

export interface MockRole {
  id: string;
  name: string;
  permissionIds: string[];
}

export const mockRoles: MockRole[] = [
  { id: "role-1", name: "Admin", permissionIds: idsOf(() => true) },
  {
    id: "role-2",
    name: "Coach",
    permissionIds: idsOf((p) => (p.resource === "Coaches" && p.action !== "Delete") || p.name === "Courses.Read"),
  },
  {
    id: "role-3",
    name: "User",
    permissionIds: idsOf((p) => p.action === "Read" && ["Products", "Courses", "Articles", "Jobs"].includes(p.resource)),
  },
  { id: "role-4", name: "Employer", permissionIds: idsOf((p) => p.resource === "Jobs") },
];

function user(
  id: number,
  fullName: string,
  userName: string,
  role: MockRole,
  extra: Partial<PlatformUser> = {},
): PlatformUser {
  return {
    id: `user-${id}`,
    userName,
    email: `${userName}@example.com`,
    fullName,
    isActive: true,
    genderId: 1,
    countryId: "country-1",
    cityId: "city-1",
    roleId: role.id,
    roleName: role.name,
    ...extra,
  };
}

const [admin, coach, member, employer] = mockRoles as [MockRole, MockRole, MockRole, MockRole];

export const mockUsers: PlatformUser[] = [
  user(1, "Lina Haddad", "lina.haddad", admin, { genderId: 2, phoneNumber: "+962790000001", birthDate: "1990-04-12T00:00:00Z" }),
  user(2, "Omar Khalil", "omar.khalil", coach, { phoneNumber: "+962790000002", jobStatusId: "job-status-1" }),
  user(3, "Sara Mansour", "sara.mansour", coach, { genderId: 2, cityId: "city-2", phoneNumber: "+962790000003" }),
  user(4, "Yazan Odeh", "yazan.odeh", member, { phoneNumber: "+962790000004", birthDate: "1998-09-30T00:00:00Z" }),
  user(5, "Rania Saleh", "rania.saleh", member, { genderId: 2, countryId: "country-2", cityId: "city-4" }),
  user(6, "Khaled Nasser", "khaled.nasser", member, { isActive: false, phoneNumber: "+962790000006" }),
  user(7, "Dana Abu-Zaid", "dana.abuzaid", member, { genderId: 2, cityId: "city-3" }),
  user(8, "Ahmad Jaber", "ahmad.jaber", employer, { phoneNumber: "+962790000008", jobStatusId: "job-status-2" }),
  user(9, "Hiba Qasem", "hiba.qasem", employer, { genderId: 2, countryId: "country-3", cityId: "city-6" }),
  user(10, "Tariq Saadeh", "tariq.saadeh", member, { phoneNumber: "+962790000010" }),
  user(11, "Noor Hamdan", "noor.hamdan", coach, { genderId: 2, isActive: false }),
  user(12, "Faris Azzam", "faris.azzam", member, { countryId: "country-4", cityId: "city-7" }),
];

/** Direct grants and denials, by user id. */
export const mockDirectPermissions: Record<string, PermissionOverride[]> = {
  "user-2": [{ permissionId: idsOf((p) => p.name === "Courses.Update")[0] ?? "", isGranted: true }],
  "user-4": [{ permissionId: idsOf((p) => p.name === "Jobs.Read")[0] ?? "", isGranted: false }],
};
