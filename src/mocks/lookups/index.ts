import type { LookupEntry, LookupKind } from "@/features/lookups";

/**
 * Seed data for the eight reference tables, independent of each other and of
 * every other fixture — nothing in the rest of the mock catalogue references
 * these ids yet, since the careers forms that eventually will are a separate
 * follow-up.
 */
function entry(id: string, nameEn: string, nameAr: string, extra: Partial<LookupEntry> = {}): LookupEntry {
  return { id, nameEn, nameAr, isActive: true, ...extra };
}

export const mockCountries: LookupEntry[] = [
  entry("country-1", "Jordan", "الأردن"),
  entry("country-2", "Saudi Arabia", "السعودية"),
  entry("country-3", "United Arab Emirates", "الإمارات العربية المتحدة"),
  entry("country-4", "Egypt", "مصر"),
  entry("country-5", "Qatar", "قطر", { isActive: false }),
];

export const mockCities: LookupEntry[] = [
  entry("city-1", "Amman", "عمّان", { countryId: "country-1" }),
  entry("city-2", "Irbid", "إربد", { countryId: "country-1" }),
  entry("city-3", "Aqaba", "العقبة", { countryId: "country-1" }),
  entry("city-4", "Riyadh", "الرياض", { countryId: "country-2" }),
  entry("city-5", "Jeddah", "جدة", { countryId: "country-2" }),
  entry("city-6", "Dubai", "دبي", { countryId: "country-3" }),
  entry("city-7", "Cairo", "القاهرة", { countryId: "country-4" }),
];

export const mockAcademicDegrees: LookupEntry[] = [
  entry("degree-1", "High school", "الثانوية العامة"),
  entry("degree-2", "Diploma", "دبلوم"),
  entry("degree-3", "Bachelor's", "بكالوريوس"),
  entry("degree-4", "Master's", "ماجستير"),
  entry("degree-5", "Doctorate", "دكتوراه", { isActive: false }),
];

export const mockJobStatuses: LookupEntry[] = [
  entry("job-status-1", "Open", "مفتوحة"),
  entry("job-status-2", "On hold", "معلّقة"),
  entry("job-status-3", "Closed", "مغلقة"),
];

export const mockJobTypes: LookupEntry[] = [
  entry("job-type-1", "Full-time", "دوام كامل"),
  entry("job-type-2", "Part-time", "دوام جزئي"),
  entry("job-type-3", "Contract", "عقد محدد المدة"),
  entry("job-type-4", "Freelance", "عمل حر"),
  entry("job-type-5", "Internship", "تدريب عملي", { isActive: false }),
];

export const mockCourses: LookupEntry[] = [
  entry("course-1", "Personal training", "التدريب الشخصي"),
  entry("course-2", "Group fitness instruction", "تدريب اللياقة الجماعي"),
  entry("course-3", "Sports nutrition", "التغذية الرياضية"),
  entry("course-4", "First aid & CPR", "الإسعافات الأولية والإنعاش"),
];

export const mockUniversityMajors: LookupEntry[] = [
  entry("major-1", "Sports science", "العلوم الرياضية"),
  entry("major-2", "Physiotherapy", "العلاج الطبيعي"),
  entry("major-3", "Nutrition", "التغذية"),
  entry("major-4", "Business administration", "إدارة الأعمال"),
];

export const mockUserJobTypes: LookupEntry[] = [
  entry("user-job-type-1", "Coach", "مدرّب", { isNormalUser: false }),
  entry("user-job-type-2", "Front desk staff", "موظف استقبال", { isNormalUser: true }),
  entry("user-job-type-3", "Manager", "مدير", { isNormalUser: false }),
];

/** Every kind's table, keyed the same way the screen's tabs are. */
export const mockLookups: Readonly<Record<LookupKind, LookupEntry[]>> = {
  "academic-degree": mockAcademicDegrees,
  city: mockCities,
  country: mockCountries,
  course: mockCourses,
  "job-status": mockJobStatuses,
  "job-type": mockJobTypes,
  "university-major": mockUniversityMajors,
  "user-job-type": mockUserJobTypes,
};
