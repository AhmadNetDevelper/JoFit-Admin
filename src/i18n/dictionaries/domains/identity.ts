/**
 * Strings for the platform's accounts, roles and permissions screens. Merged
 * into `en.ts` and `ar.ts`; `identityAr` is checked against `identityEn`, so a
 * missing Arabic string is a compile error.
 */
export const identityEn = {
  "nav.users": "Platform users",
  "nav.roles": "Roles & permissions",

  "identity.active": "Active",
  "identity.inactive": "Inactive",
  "identity.none": "None",
  "identity.choose": "Choose…",
  "identity.gender.1": "Male",
  "identity.gender.2": "Female",

  "identity.field.userName": "Username",
  "identity.field.fullName": "Full name",
  "identity.field.password": "Temporary password",
  "identity.field.passwordHint": "At least 6 characters. Give it to the account holder; they can change it after signing in.",
  "identity.field.gender": "Gender",
  "identity.field.birthDate": "Date of birth",
  "identity.field.country": "Country",
  "identity.field.city": "City",
  "identity.field.jobStatus": "Job status",
  "identity.field.role": "Role",
  "identity.field.activeHint": "An inactive account cannot sign in. Nothing it owns is removed.",

  "identity.users.title": "Platform users",
  "identity.users.description":
    "Every account on the platform — customers, coaches, employers and staff — with the role each holds. Open one to correct its details or fine-tune what it may do.",
  "identity.users.new": "New user",
  "identity.users.newTitle": "New user",
  "identity.users.newHint": "Creates an account with the platform's plain User role.",
  "identity.users.created": "Account created.",
  "identity.users.filterStatus": "Filter by status",
  "identity.users.allStatuses": "All statuses",
  "identity.users.filterRole": "Filter by role",
  "identity.users.allRoles": "All roles",
  "identity.users.empty": "No accounts match.",

  "identity.user.editDetails": "Edit details",
  "identity.user.editTitle": "Edit account",
  "identity.user.editHint": "The role is not changed here: the API has no way to move an account to another role.",
  "identity.user.delete": "Delete account",
  "identity.user.deleteBody": "The account is removed and can no longer sign in. This cannot be undone.",
  "identity.user.profile": "Account",
  "identity.user.noRole": "No role",

  "identity.permissions.title": "Permissions",
  "identity.permissions.description":
    "What the role grants, and any grant or denial set on this account alone. A direct setting wins over the role.",
  "identity.permissions.permission": "Permission",
  "identity.permissions.fromRole": "From role",
  "identity.permissions.override": "On this account",
  "identity.permissions.effective": "Result",
  "identity.permissions.followRole": "Follow role",
  "identity.permissions.grant": "Grant",
  "identity.permissions.deny": "Deny",
  "identity.permissions.granted": "Granted",
  "identity.permissions.notGranted": "Not granted",
  "identity.permissions.allowed": "Allowed",
  "identity.permissions.denied": "Not allowed",
  "identity.permissions.save": "Save permissions",
  "identity.permissions.discard": "Discard changes",
  "identity.permissions.saved": "Permissions saved.",
  "identity.permissions.count": "{granted} of {total} permissions",
  "identity.permissions.none": "The API reports no permissions yet.",

  "identity.roles.title": "Roles & permissions",
  "identity.roles.description":
    "The roles accounts hold on the platform and what each may do. Open a role to tick its permissions; a new role can start as a copy of an existing one.",
  "identity.roles.noun": "role",
  "identity.roles.name": "Name",
  "identity.roles.cloneFrom": "Start from",
  "identity.roles.cloneHint": "The new role begins with that role's permissions. You can change them afterwards.",
  "identity.roles.cloneNone": "No permissions",
  "identity.roles.manage": "Permissions",

  "identity.role.description":
    "Tick what this role may do. Saving replaces the role's permissions with exactly the ticked set, for every account that holds it.",
  "identity.role.selectAll": "Select all",
  "identity.role.clearAll": "Clear",
} as const;

export const identityAr: Readonly<Record<keyof typeof identityEn, string>> = {
  "nav.users": "مستخدمو المنصة",
  "nav.roles": "الأدوار والصلاحيات",

  "identity.active": "فعّال",
  "identity.inactive": "غير فعّال",
  "identity.none": "لا شيء",
  "identity.choose": "اختر…",
  "identity.gender.1": "ذكر",
  "identity.gender.2": "أنثى",

  "identity.field.userName": "اسم المستخدم",
  "identity.field.fullName": "الاسم الكامل",
  "identity.field.password": "كلمة مرور مؤقتة",
  "identity.field.passwordHint": "ستة أحرف على الأقل. سلّمها لصاحب الحساب، ويستطيع تغييرها بعد تسجيل الدخول.",
  "identity.field.gender": "الجنس",
  "identity.field.birthDate": "تاريخ الميلاد",
  "identity.field.country": "الدولة",
  "identity.field.city": "المدينة",
  "identity.field.jobStatus": "الحالة الوظيفية",
  "identity.field.role": "الدور",
  "identity.field.activeHint": "الحساب غير الفعّال لا يستطيع تسجيل الدخول، ولا يُحذف شيء مما يملكه.",

  "identity.users.title": "مستخدمو المنصة",
  "identity.users.description":
    "كل حساب على المنصة — العملاء والمدربون وأصحاب العمل والموظفون — مع الدور الذي يحمله كلٌّ منهم. افتح أي حساب لتصحيح بياناته أو ضبط ما يُسمح له به.",
  "identity.users.new": "مستخدم جديد",
  "identity.users.newTitle": "مستخدم جديد",
  "identity.users.newHint": "ينشئ حساباً بدور «مستخدم» العادي على المنصة.",
  "identity.users.created": "تم إنشاء الحساب.",
  "identity.users.filterStatus": "تصفية حسب الحالة",
  "identity.users.allStatuses": "كل الحالات",
  "identity.users.filterRole": "تصفية حسب الدور",
  "identity.users.allRoles": "كل الأدوار",
  "identity.users.empty": "لا توجد حسابات مطابقة.",

  "identity.user.editDetails": "تعديل البيانات",
  "identity.user.editTitle": "تعديل الحساب",
  "identity.user.editHint": "لا يُغيَّر الدور من هنا: لا توفّر الواجهة البرمجية طريقة لنقل حساب إلى دور آخر.",
  "identity.user.delete": "حذف الحساب",
  "identity.user.deleteBody": "يُحذف الحساب ولن يتمكن من تسجيل الدخول بعد ذلك. لا يمكن التراجع عن هذا.",
  "identity.user.profile": "الحساب",
  "identity.user.noRole": "بلا دور",

  "identity.permissions.title": "الصلاحيات",
  "identity.permissions.description":
    "ما يمنحه الدور، وأي منح أو منع مضبوط على هذا الحساب وحده. الإعداد المباشر يتقدّم على الدور.",
  "identity.permissions.permission": "الصلاحية",
  "identity.permissions.fromRole": "من الدور",
  "identity.permissions.override": "على هذا الحساب",
  "identity.permissions.effective": "النتيجة",
  "identity.permissions.followRole": "حسب الدور",
  "identity.permissions.grant": "منح",
  "identity.permissions.deny": "منع",
  "identity.permissions.granted": "ممنوحة",
  "identity.permissions.notGranted": "غير ممنوحة",
  "identity.permissions.allowed": "مسموح",
  "identity.permissions.denied": "غير مسموح",
  "identity.permissions.save": "حفظ الصلاحيات",
  "identity.permissions.discard": "تجاهل التغييرات",
  "identity.permissions.saved": "تم حفظ الصلاحيات.",
  "identity.permissions.count": "{granted} من {total} صلاحية",
  "identity.permissions.none": "لا تُبلغ الواجهة البرمجية عن أي صلاحيات بعد.",

  "identity.roles.title": "الأدوار والصلاحيات",
  "identity.roles.description":
    "الأدوار التي تحملها الحسابات على المنصة وما يُسمح لكلٍّ منها به. افتح دوراً لتحديد صلاحياته؛ ويمكن أن يبدأ الدور الجديد نسخةً من دور قائم.",
  "identity.roles.noun": "دور",
  "identity.roles.name": "الاسم",
  "identity.roles.cloneFrom": "ابدأ من",
  "identity.roles.cloneHint": "يبدأ الدور الجديد بصلاحيات ذلك الدور، ويمكنك تعديلها بعد ذلك.",
  "identity.roles.cloneNone": "بلا صلاحيات",
  "identity.roles.manage": "الصلاحيات",

  "identity.role.description":
    "حدّد ما يُسمح لهذا الدور به. الحفظ يستبدل صلاحيات الدور بالمحدَّد تماماً، لكل حساب يحمله.",
  "identity.role.selectAll": "تحديد الكل",
  "identity.role.clearAll": "مسح",
};
