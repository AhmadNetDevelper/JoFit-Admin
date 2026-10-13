import type { RouteObject } from "react-router-dom";

import { screen } from "../../lazy-screen";

/**
 * The careers screens. Spread into the admin router.
 *
 * `/careers/jobs/:jobId` and `/careers/employers/:employerId` are where the
 * storefront's staff notifications (`job-submitted`, `employer-registered`)
 * send the bell, so those two paths are part of the contract.
 */
export const careersCrudRoutes: RouteObject[] = [
  { path: "careers", ...screen(() => import("./jobs"), "JobsRoute") },
  { path: "careers/jobs", ...screen(() => import("./jobs"), "JobsRoute") },
  { path: "careers/jobs/:jobId", ...screen(() => import("./job-detail"), "JobDetailRoute") },
  { path: "careers/employers", ...screen(() => import("./employers"), "EmployersRoute") },
  { path: "careers/employers/:employerId", ...screen(() => import("./employer-detail"), "EmployerDetailRoute") },
  { path: "careers/applications", ...screen(() => import("./applications"), "ApplicationsRoute") },
  { path: "careers/applications/:applicationId", ...screen(() => import("./application-detail"), "ApplicationDetailRoute") },
  { path: "careers/categories", ...screen(() => import("./categories"), "JobCategoriesRoute") },
];
