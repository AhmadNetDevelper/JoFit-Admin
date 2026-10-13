import { createBrowserRouter } from "react-router-dom";

import { PendingState } from "@/components/feedback";
import { RequireAuth } from "@/features/auth";

import { AdminLayout } from "./components/admin-layout";
import { screen } from "./lazy-screen";
import { NotFoundRoute } from "./routes/not-found";
import { SignInRoute } from "./routes/sign-in";
import { catalogueCrudRoutes } from "./routes/catalogue/crud-routes";
import { rentalCrudRoutes } from "./routes/rental/crud-routes";
import { peopleCrudRoutes } from "./routes/people/crud-routes";
import { contentCrudRoutes } from "./routes/content/crud-routes";
import { coreCrudRoutes } from "./routes/core/crud-routes";
import { careersCrudRoutes } from "./routes/careers/crud-routes";
import { identityRoutes } from "./routes/identity/crud-routes";

/**
 * One route table, declared as data.
 *
 * `/sign-in` sits outside the guarded tree so it has no admin chrome; everything
 * else is nested under `RequireAuth` → `AdminLayout`, which is why no screen
 * checks for a session itself.
 *
 * Every screen is a `screen(...)` — its own file, downloaded the first time
 * it is opened (`lazy-screen.ts`). What stays in the first download is what
 * every visit needs: sign-in, the guard, the shell and "not found". Moving
 * between screens keeps the current one on view with a bar under the top bar
 * (`NavigationProgress`); opening a link to a screen directly shows the shell
 * with a loading block where the screen goes, from the screens group below.
 */
export const router = createBrowserRouter([
  { path: "/sign-in", element: <SignInRoute /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            /* The screens. Pathless, so it adds no URL — it is here for the
               fallback: a deep link's screen downloads inside the shell. */
            hydrateFallbackElement: <PendingState rows={3} />,
            children: [
              { index: true, ...screen(() => import("./routes/dashboard"), "DashboardRoute") },

              { path: "catalogue/products", ...screen(() => import("./routes/catalogue/products"), "ProductsRoute") },
              { path: "catalogue/products/:productId", ...screen(() => import("./routes/catalogue/product-detail"), "ProductDetailRoute") },
              { path: "catalogue/categories", ...screen(() => import("./routes/catalogue/categories"), "CategoriesRoute") },
              { path: "catalogue/brands", ...screen(() => import("./routes/catalogue/brands"), "BrandsRoute") },

              { path: "orders", ...screen(() => import("./routes/orders/orders"), "OrdersRoute") },
              { path: "orders/:orderId", ...screen(() => import("./routes/orders/order-detail"), "OrderDetailRoute") },
              { path: "customers", ...screen(() => import("./routes/customers/customers"), "CustomersRoute") },
              { path: "customers/:customerId", ...screen(() => import("./routes/customers/customer-detail"), "CustomerDetailRoute") },

              { path: "rental/items", ...screen(() => import("./routes/rental/rental-items"), "RentalItemsRoute") },
              { path: "rental/bookings", ...screen(() => import("./routes/rental/bookings"), "BookingsRoute") },
              { path: "rental/setup", ...screen(() => import("./routes/rental/rental-setup"), "RentalSetupRoute") },

              { path: "coaches", ...screen(() => import("./routes/coaches/coaches"), "CoachesRoute") },
              { path: "coaches/bookings", ...screen(() => import("./routes/coaches/coach-bookings"), "CoachBookingsRoute") },
              { path: "coaches/bookings/:bookingId", ...screen(() => import("./routes/coaches/coach-booking-detail"), "CoachBookingDetailRoute") },
              { path: "coaches/:coachId", ...screen(() => import("./routes/coaches/coach-detail"), "CoachDetailRoute") },
              { path: "education/courses", ...screen(() => import("./routes/education/courses"), "CoursesRoute") },
              { path: "education/courses/:courseId", ...screen(() => import("./routes/education/course-detail"), "CourseDetailRoute") },
              { path: "education/enrolments", ...screen(() => import("./routes/education/enrolments"), "EnrolmentsRoute") },

              { path: "content/articles", ...screen(() => import("./routes/content/articles"), "ArticlesRoute") },
              { path: "content/articles/:articleId", ...screen(() => import("./routes/content/article-detail"), "ArticleDetailRoute") },
              { path: "content/menu", ...screen(() => import("./routes/content/courses-menu"), "CoursesMenuRoute") },
              { path: "content/menu/pages/:pageId", ...screen(() => import("./routes/content/menu-page"), "MenuPageRoute") },
              { path: "support", ...screen(() => import("./routes/support/support"), "SupportRoute") },
              { path: "support/:conversationId", ...screen(() => import("./routes/support/support"), "SupportRoute") },
              { path: "reviews", ...screen(() => import("./routes/reviews/reviews"), "ReviewsRoute") },
              { path: "community", ...screen(() => import("./routes/community/community"), "CommunityRoute") },
              { path: "community/:postId", ...screen(() => import("./routes/community/community-post"), "CommunityPostRoute") },

              { path: "quotations", ...screen(() => import("./routes/quotations/quotations"), "QuotationsRoute") },
              { path: "quotations/:quotationId", ...screen(() => import("./routes/quotations/quotation-detail"), "QuotationDetailRoute") },
              { path: "sports", ...screen(() => import("./routes/sports"), "SportsRoute") },
              { path: "lookups", ...screen(() => import("./routes/lookups"), "LookupsRoute") },
              { path: "settings", ...screen(() => import("./routes/settings/settings"), "SettingsRoute") },

              /* Add / edit / delete screens, one file per domain. */
              ...catalogueCrudRoutes,
              ...rentalCrudRoutes,
              ...peopleCrudRoutes,
              ...contentCrudRoutes,
              ...coreCrudRoutes,
              ...careersCrudRoutes,
              ...identityRoutes,
            ],
          },

          { path: "*", element: <NotFoundRoute /> },
        ],
      },
    ],
  },
]);
