import type { ListQuery, Paginated, PublishStatus } from "@/types";

import type {
  AdminCourse,
  CourseCategory,
  CourseCategoryDraft,
  CourseDraft,
  CourseListQuery,
  Enrolment,
  EnrolmentListQuery,
  EnrolmentStatus,
} from "../types";

export interface EducationAdminService {
  /** Searched by either title, the summary or the slug; sorted by title when no sort is given. */
  listCourses(query?: CourseListQuery): Promise<Paginated<AdminCourse>>;
  getCourse(id: string): Promise<AdminCourse | null>;
  /**
   * 422 with field errors. A new course starts as a draft, off the site. Its
   * pictures (`media`) are uploaded first and saved here as values: uploaded
   * images, at most 12.
   */
  createCourse(draft: CourseDraft): Promise<AdminCourse>;
  /** A published course must keep its title and summary in every language. */
  updateCourse(id: string, draft: CourseDraft): Promise<AdminCourse>;
  /** 409 while anyone holds a pending or active place on it. */
  deleteCourse(id: string): Promise<void>;
  /** Publishing needs the title and summary in every language. */
  setCourseStatus(id: string, status: PublishStatus): Promise<AdminCourse>;

  /** Every category, for the course form's checkboxes (`/options`). */
  listCategories(): Promise<readonly CourseCategory[]>;
  /** One page for the categories screen; searched by either name or the slug, sorted by name. */
  listCategoriesPage(query: ListQuery): Promise<Paginated<CourseCategory>>;
  /** 422 when a name or the slug is missing, or the slug is taken. */
  createCategory(draft: CourseCategoryDraft): Promise<CourseCategory>;
  updateCategory(id: string, draft: CourseCategoryDraft): Promise<CourseCategory>;
  /** 409 while any course is filed under it. */
  deleteCategory(id: string): Promise<void>;

  /**
   * `courseId` narrows to one course, and `cohortStartsOn` / `excludeCohortStartsOn`
   * to its next cohort or the others — the course page reads its places this way.
   */
  listEnrolments(query?: EnrolmentListQuery): Promise<Paginated<Enrolment>>;
  /** Rejects transitions the graph does not allow; cancelling needs a note. */
  setEnrolmentStatus(id: string, status: EnrolmentStatus, note?: string): Promise<Enrolment>;
}
