import type { RouteObject } from "react-router-dom";

import { screen } from "../../lazy-screen";

/**
 * The people screens added for add / edit / delete. Spread into the admin router.
 *
 * `coaches/new` and `coaches/specialisations` sit beside the router's
 * `coaches/:coachId`; React Router ranks a static segment above a dynamic one,
 * so neither is read as a coach id. The same holds for `education/courses/new`.
 */
export const peopleCrudRoutes: RouteObject[] = [
  { path: "coaches/new", ...screen(() => import("../coaches/coach-detail"), "CoachDetailRoute") },
  { path: "coaches/specialisations", ...screen(() => import("../coaches/specialisations"), "SpecialisationsRoute") },
  { path: "education/courses/new", ...screen(() => import("../education/course-detail"), "CourseDetailRoute") },
  { path: "education/categories", ...screen(() => import("../education/course-categories"), "CourseCategoriesRoute") },
];
