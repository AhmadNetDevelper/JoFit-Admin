/**
 * Strings for the Reference data screen: the tab strip's eight labels, their
 * singular nouns for "Add {noun}" / "Edit {noun}", and the handful of words
 * every tab's table and dialog share. Merged into `en.ts` and `ar.ts`;
 * `lookupsAr` is checked against `lookupsEn`, so a missing Arabic string is a
 * compile error.
 */
export const lookupsEn = {
  "nav.lookups": "Reference data",
  "lookups.title": "Reference data",
  "lookups.description":
    "The shared lists behind the careers board and candidate forms — countries, cities, job types and the rest. Each tab is its own table, added and edited the same way.",
  "lookups.country": "Country",
  "lookups.countryHint": "Which country this city belongs to.",
  "lookups.active": "Active",
  "lookups.inactive": "Inactive",
  "lookups.activeHint": "An inactive record is kept, not offered, wherever this list is used.",

  "lookups.kind.academic-degree": "Academic degrees",
  "lookups.kind.city": "Cities",
  "lookups.kind.country": "Countries",
  "lookups.kind.course": "Courses",
  "lookups.kind.job-status": "Job statuses",
  "lookups.kind.job-type": "Job types",
  "lookups.kind.university-major": "University majors",
  "lookups.kind.user-job-type": "User job types",

  "lookups.noun.academic-degree": "academic degree",
  "lookups.noun.city": "city",
  "lookups.noun.country": "country",
  "lookups.noun.course": "course",
  "lookups.noun.job-status": "job status",
  "lookups.noun.job-type": "job type",
  "lookups.noun.university-major": "university major",
  "lookups.noun.user-job-type": "user job type",
} as const;

export const lookupsAr: Readonly<Record<keyof typeof lookupsEn, string>> = {
  "nav.lookups": "البيانات المرجعية",
  "lookups.title": "البيانات المرجعية",
  "lookups.description":
    "القوائم المشتركة خلف لوحة الوظائف ونماذج المرشّحين — الدول والمدن وأنواع الوظائف وغيرها. كل تبويب جدول مستقل، يُضاف ويُعدَّل بالطريقة نفسها.",
  "lookups.country": "الدولة",
  "lookups.countryHint": "الدولة التي تتبع لها هذه المدينة.",
  "lookups.active": "فعّال",
  "lookups.inactive": "غير فعّال",
  "lookups.activeHint": "السجل غير الفعّال يبقى محفوظاً، ولا يُعرض أينما استُخدمت هذه القائمة.",

  "lookups.kind.academic-degree": "الدرجات العلمية",
  "lookups.kind.city": "المدن",
  "lookups.kind.country": "الدول",
  "lookups.kind.course": "الدورات",
  "lookups.kind.job-status": "حالات الوظيفة",
  "lookups.kind.job-type": "أنواع الوظائف",
  "lookups.kind.university-major": "التخصصات الجامعية",
  "lookups.kind.user-job-type": "أنواع وظائف المستخدمين",

  "lookups.noun.academic-degree": "درجة علمية",
  "lookups.noun.city": "مدينة",
  "lookups.noun.country": "دولة",
  "lookups.noun.course": "دورة",
  "lookups.noun.job-status": "حالة وظيفة",
  "lookups.noun.job-type": "نوع وظيفة",
  "lookups.noun.university-major": "تخصص جامعي",
  "lookups.noun.user-job-type": "نوع وظيفة مستخدم",
};
