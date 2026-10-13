# JoFit — Admin

Staff console for the JoFit sports platform. **English and Arabic, with full RTL.**

> **Status (2026-09-30):** built on mock data. Every feature has an HTTP adapter
> against the `/v1/admin` contract (`docs/BACKEND-BRIEF.md`, reference server in
> `mock-api/`); there is no real backend yet. Sections below that say "no backend",
> "HTTP client unused" or "read-only" predate that work. Since then the admin has
> gained: Careers (jobs, employers, applications, job categories), a Team page
> (staff CRUD, `settings:write`), support inbox, notifications, menus and the
> Courses-menu page editor, course categories, specialisations, article
> categories and authors, rental setup, customer editing, sports CRUD with image
> upload, and a dashboard with revenue cards and a 3/6/12-month chart.
>
> Setup notes: the storefront URL is `VITE_STOREFRONT_URL` (default
> `http://localhost:3001`), `VITE_STOREFRONT_ASSETS_URL` overrides where fixture
> images load from, and in mock mode the website dev server must be running (the
> dev bridge talks to its `/api/dev/store`). The sign-in page has a password box
> (not checked yet in mock mode).

---

## 1. Purpose

The admin is where staff run the platform: catalogue and stock, orders, rental
bookings, coach verification, editorial content, review moderation and quotation
requests.

The audience is the **owner and staff**, never the public: the point is that the
business can see how the platform is doing and change what the storefront shows
without asking a developer. Two limits of today's build are worth stating plainly,
because the domain table in [§5](#5-domains) reads as if they were covered:

- **The dashboard is a worklist, not analytics.** It shows one actionable count
  per domain (open orders, pending reviews, new quotations, coaches awaiting
  verification, low stock) and links to the screen that clears it. There is no
  revenue, no trend, no best sellers, no rental utilisation, no traffic and no
  chart — and no `analytics` feature. Those are aggregations and belong on the
  server; today's low-stock tile counts in the browser, which is fine against
  fixtures and wrong against a real catalogue.
- **`content` is editorial articles, not the site's own content.** Every *record*
  the storefront renders is editable here. The storefront itself is not: home
  page, banners, navigation, footer, static pages and UI copy live in code and
  dictionaries, so changing one is a deployment. That needs a separate
  `site-content` domain and the CMS decision below.

Both are deliberate boundaries for this phase, not oversights.

It is a **separate application from the storefront**, not a section of it:

| | Storefront (`../website`) | Admin (this app) |
| --- | --- | --- |
| Audience | Public, unauthenticated | Staff, behind a login |
| SEO | Critical | Must never be indexed |
| Rendering | Server Components, streamed HTML | Client SPA |
| Shape of data | A public projection | The write model, with costs, stock and audit |
| Framework | Next.js App Router | Vite + React Router |

Rendering a private, interaction-heavy tool through a server framework buys
nothing — nobody is waiting on first paint behind a login, and there is no
crawler to serve. A plain SPA is the honest choice.

---

## 2. Tech stack

| Choice | Why |
| --- | --- |
| Vite + React 19 + TypeScript (strict) | Fast SPA toolchain; types are the real deliverable of this phase |
| React Router 7 | Routing is the only genuinely missing primitive in an SPA |
| Tailwind CSS 4 | Utility layer; the JoFit palette (action green, gold accent, a deep-green rail in both themes) is the token block in `src/styles/globals.css` |
| Motion (motion.dev) | Entrances only, loaded lazily: `app/motion-provider.tsx` (`LazyMotion`, `m.*` components) and `lib/reveal.ts` (the 2KB WAAPI `motion/mini`). One entrance per screen, then stillness |
| oxlint | Vite's default linter; also enforces the architecture boundaries |

**The UI kit is vendored.** `src/components/ui/` is copied unchanged from
[next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard)
(MIT), which brings Radix UI, `class-variance-authority`, Lucide and Recharts.
See `src/components/ui/README.md` before touching anything in there.

Beyond those and React Router there is still **no state library, no data-fetching
library, no form library and no i18n library**. Each was considered; the
reasoning is in [§6](#6-state-and-data), [§7](#7-forms) and
[§8](#8-internationalisation).

```bash
npm install
npm run dev        # http://localhost:5174
npm run lint       # oxlint, including the boundary rules
npm run typecheck  # tsc -b
npm run build
npm run validate   # all three, in order
```

Copy `.env.example` to `.env.local` to change defaults. **No secret may ever be
added** — anything prefixed `VITE_` is compiled into the browser bundle.

**Development sign-in:** any listed account at `/sign-in` (`superadmin@jofit.com`,
`manager@jofit.test`, `catalogue@jofit.test`, `content@jofit.test`,
`support@jofit.test`, `viewer@jofit.test`). Passwords are not checked because
there is nothing to check them against. Each account has a different role, so you
can see how the sidebar and actions change.

**Deployment note:** this is a client-side-routed SPA. The host must rewrite
unknown paths to `index.html`, or deep links like `/orders/order-1` will 404.

---

## 3. Architecture

Four layers, dependencies pointing one way:

```text
  app/            Router, shell, screens (composes features; owns no business logic)
      ↓
  features/       Business domains: models, services, domain components
      ↓
  services/       Shared data-access infrastructure (HTTP client, adapter resolver)
  lib/ types/     Pure utilities and cross-domain primitives
  i18n/           Locales, dictionaries, formatters
  components/     Domain-agnostic UI (data table, feedback, form, layout)
  config/         App, API, feature flags, navigation
```

Two rules, **enforced by oxlint** rather than by convention:

1. **Shared infrastructure never imports a business domain.** `components/`,
   `lib/`, `services/`, `hooks/`, `config/`, `types/` and `i18n/` cannot import
   `@/features/*`.
2. **A feature is used through its public barrel.** `@/features/orders` is
   allowed; `@/features/orders/services/orders.mock` is not.

### Feature graph

```text
  catalogue → sports        orders    → (nothing)
  rental    → sports        customers → (nothing)
  coaches   → sports        reviews   → (nothing)
  content   → sports        auth      → (nothing)
  education → sports        quotations→ sports
```

No feature imports another core feature, and `reviews` imports nothing at all —
a review points at a *typed target* (`{ type, id, title }`), not at a product.
That is what keeps the graph acyclic.

---

## 4. Admin models are not storefront models

The single most important modelling decision here.

`AdminProduct` is **not** the storefront's `Product`. It carries exact stock
counts, cost prices, an editorial status and audit fields — none of which the
public may ever see — and its prose is `LocalizedText` rather than a resolved
string. Sharing one type would force the storefront to either receive
commercially sensitive data or make half its fields optional.

The same split runs through the codebase: `AdminCoach` has a verification
status, `AdminReview` has a moderation status, `RentalItem` has
`unitsOutOfService`. These are write-side concerns that do not exist publicly.

**Edits use a `Draft` type, never the whole entity.** `ProductDraft` is the
editable subset, so a save can never silently overwrite stock, ratings or audit
fields that the form does not show.

**Commands are named for what they do.** `setProductStatus`, `adjustStock` and
`updateProduct` are separate methods because they are separate decisions with
different permissions and different audit meaning. A generic `update` would make
a stock correction indistinguishable from a copy edit.

---

## 5. Domains

| Domain | What the admin does | Notes |
| --- | --- | --- |
| **Catalogue** | Products, variants, stock, categories, brands | Stock is adjusted by signed *delta* with a reason, never set absolutely — two staff adjusting at once must add up |
| **Orders** | List, inspect, advance status | Transitions come from `ORDER_TRANSITIONS`, so impossible moves are never offered |
| **Rental** | Items, bookings, deposits, categories and depots | `pending → confirmed → collected → returned`; deposit release requires `returned`. Every booking is derived from the order line that paid for it |
| **Coaches** | Verify profiles and certifications; packages; coaching sessions | Only `approved` coaches are on the site. Sessions follow `pending → confirmed → completed`; cancelling requires a reason |
| **Education** | Courses, cohorts, enrolments | Not an LMS. A cohort's seat count is the live count of pending and active enrolments — the storefront's open / closing / full signal |
| **Reviews** | Moderation queue | Rendered as prose, not a table — you cannot judge a review from a table row |
| **Content** | Editorial articles | Publishing requires every language (see §8) |
| **Quotations** | Inbox: read, assign, record outcome | An inbox, not a workflow engine — the workflow is undecided |
| **Customers** | Read-only lookup, one record per person | Every other domain carries a `customerId`; the customer screen composes them. Value and counts are derived, never stored |
| **Sports** | Shared taxonomy | Shows both language names at once |
| **Community** | Reactive moderation of posts and comments | Posts are live when written; reported ones are `flagged`; hiding requires a reason |
| **Settings** | Storefront theme; staff and roles | The theme is the storefront's contract field for field, contrast-checked. Staff are read-only until an identity provider is chosen |

---

## 6. State and data

| Kind | Where it lives |
| --- | --- |
| **Server state** | `useAsyncData` per screen |
| **URL state** | Search, sort, page, filters — `useListQuery` |
| **Application state** | Session and locale — two small Context providers |
| **Local UI state** | `useState` in the leaf |

List state lives in the **URL**, so a filtered view is shareable ("here is the
exact screen I am looking at" is a daily need for support staff) and survives a
refresh.

### Why no TanStack Query

`useAsyncData` is request state — loading, error, data, refetch — in about 60
lines. It is deliberately **not** a cache: a half-built cache with invalidation
bugs is worse than none. It aborts in-flight requests when its deps change, so a
fast second request can never be overwritten by a slow first one.

Adopt TanStack Query the moment you need shared caching across screens,
background refetching or optimistic list updates. It slots in behind the same
hook signature; screens do not change.

`useAsyncAction` is the write-side counterpart: it tracks pending state and
surfaces `AppError.fieldErrors` so forms can render per-field messages without
knowing what an `AppError` is.

---

## 7. Forms

No form library. The hard part of forms in practice is accessible labelling and
error association, and `components/form/Field` solves that once: it owns the
`id`, wires `aria-describedby` and `aria-invalid`, and renders the error in a
`role="alert"`.

Validation lives in the **service**, not the form, because the real backend will
own those rules and the UI must render whatever it returns.

Reach for React Hook Form when you hit multi-step wizards, field arrays or forms
large enough that per-keystroke re-renders are measurable.

---

## 8. Internationalisation

The admin is bilingual end to end. Language is a first-class concept, not a
string-replacement layer.

### Type-safe dictionaries

`dictionaries/en.ts` is the source of truth for the key set; `TranslationKey` is
derived from it and `ar.ts` is typed as `Dictionary`. **A missing or misspelled
Arabic key is a compile error**, never a silent English fallback in production.

```ts
const { t } = useTranslation();
t("orders.title");                    // typed; unknown keys do not compile
t("greeting", { name: user.name });   // {name} placeholders keep sentences whole
```

Interpolation exists because word order differs between English and Arabic —
sentences must stay whole and reorderable, never concatenated from fragments.

### Direction

`I18nProvider` sets `lang` and `dir` on the document element. There is **no RTL
stylesheet and no mirrored overrides**: components use logical properties
(`ms-*`, `pe-*`, `start-*`, `text-start`), which Tailwind resolves against
`dir`, so the whole layout mirrors automatically.

### Numbers, dates and money

Bound to the locale in `useFormatters()`, so formatting is decided once. Arabic
is pinned to `ar-JO-u-nu-latn`: Latin digits (1234), which is what Jordanian
commerce uses. Dropping that subtag in `i18n/locales.ts` switches to
Arabic-Indic digits (١٢٣٤) — a one-line change.

### What is and is not translated

**Localized** (`LocalizedText`) — content the platform authors: product titles
and descriptions, category names, article bodies, sport names.

**Not localized** — real-world data in whatever language it was written:
customer names, review bodies, quotation messages, SKUs, order references. Brand
names are proper nouns ("Apex" is "Apex"), and option values are not prose ("42"
is "42"). Customer-written text is rendered with `dir="auto"` so an Arabic review
and an English one can sit correctly in the same queue.

### Editing both languages

`LocalizedField` shows every language side by side — you cannot translate what
you cannot see next to the original — each input with its own `lang` and `dir`,
so the Arabic box is right-to-left even while the admin is displayed in English.

Service validation returns errors keyed `field.locale` (e.g. `title.ar`), and
`LocalizedField` places each on the right box.

### The publishing rule

**A draft needs only the default language; publishing requires every language.**
That is what stops a half-translated product or article reaching the public
Arabic storefront. Article and product lists show a translation column, so gaps
are visible before someone tries to publish.

> **OPEN BUSINESS DECISION:** whether Arabic is authoritative for the Jordanian
> market, who signs off translations, and whether coach-authored profiles must be
> supplied in both languages.

---

## 9. Permissions — and why they are not security

`features/auth/permissions.ts` maps roles to permissions, and `usePermission()` /
`<RequirePermission>` hide what a user cannot do.

> **Everything in that file runs in the browser and can be edited by anyone with
> dev tools.** It decides what the UI *offers*, nothing more. Every permission
> must be enforced again on the server, against the session, on every request. A
> screen hidden here is still reachable by calling the API directly.

The HTTP client has **no token handling** on purpose: when auth exists, the
session belongs in an httpOnly cookie the browser sends and JavaScript cannot
read. That is why `credentials: "include"` is set and no bearer token is stored.

---

## 10. Mock data and the future API

```text
Component → Screen → Service → Mock fixtures
Component → Screen → Service → HTTP client → Backend
```

The swap point is `services/resolve-service.ts`:

```ts
export const ordersService = resolveService<OrdersService>("orders", {
  mock: mockOrdersService,
  // http: httpOrdersService,   ← add this line
});
```

Per domain: write `<domain>.http.ts` against the same `<domain>.contract.ts`
interface, register it, set `VITE_DATA_SOURCE=http` and `VITE_API_BASE_URL`, then
delete `src/mocks/<domain>/`. If the wire format differs from the domain model,
**map it inside the adapter** — the domain model is the contract with the UI.

### One catalogue, one customer list

The catalogue is not typed twice. `node scripts/sync-website-mocks.cjs` reads the
storefront fixtures in `../website/src/mocks` and writes
`src/mocks/website/snapshot.ts`; each domain maps that snapshot into its admin
model and adds what only staff see (exact stock derived from the public stock
signal, cost, verification, audit). Re-run it after changing storefront data.

Transactional fixtures all point at one registry, `src/mocks/people`: orders,
rental bookings (derived from the orders' rental lines), coaching sessions,
enrolments, reviews and community posts. Generated dates are relative to today,
and every generator is seeded.

Two storefront fixture problems the sync surfaced, not fixed here:

- A storefront review targets `course-pt-foundation`, which is not in the
  storefront catalogue, so it can never render. The admin files it against
  `course-ncsf-cpt`.
- `loc-aqaba` is "Aqaba Waterfront" in the rental fixtures and "Aqaba Marina"
  in the coach fixtures.

The mock adapters **mutate module-level arrays**, so edits survive navigation and
are lost on reload. That is deliberate: it exercises the write path, the
validation path and the refetch path end to end without pretending anything is
persisted.

`services/http/client.ts` exists and is intentionally unused — it is the seam the
HTTP adapters plug into. It declares no endpoints.

---

## 11. Adding a screen

1. Add the domain model to `features/<name>/types.ts` (localize platform-authored
   prose; leave real-world data plain).
2. Define `services/<name>.contract.ts`, implement `<name>.mock.ts` against
   fixtures in `src/mocks/<name>/`, register it with `resolveService`.
3. Export the public surface from `features/<name>/index.ts`.
4. Build the screen in `app/routes/`, using `useListQuery` + `AsyncBoundary` +
   `DataTable`.
5. Add both translations to `dictionaries/en.ts` and `ar.ts` — the build fails
   until Arabic is present.
6. Add a `NavItem` to `config/navigation.ts` with its permission and feature flag.
7. Add the route to `app/router.tsx`.
8. `npm run lint` — the boundary rules will tell you if you crossed a line.

---

## 12. Open business decisions

Marked in the code and left undecided on purpose:

**Rental** — deposit amounts and release timing; late returns; cancellation.
**Orders** — who may cancel; refund windows; tax and shipping calculation.
**Coaches** — commission; no-show policy; whether profiles need both languages.
**Education** — enrolment eligibility; refunds; certification requirements.
**Reviews** — who may review; edit windows; what counts as a verified purchase.
**Quotations** — the entire workflow: routing, SLAs, approvals, conversion to an
order.
**Customers** — what staff may edit; who sees full contact details; retention and
deletion requests.
**Analytics** — which numbers the owner decides with and over what period;
whether reporting reads the operational database or a separate store; whether
storefront traffic is measured in-house or by a third-party provider.
**Site content** — how much of the storefront the owner may change without a
deployment; whether those edits are versioned and previewable; who approves a
change that goes public the moment it is saved.
**Platform** — identity provider and SSO; session lifetime; MFA; the CMS, and
therefore the rich-text editing surface.

---

## 13. Sharing code with the storefront

The two apps duplicate a handful of primitives (`Money`, `Paginated`, `Address`).
That is a deliberate trade, not an oversight: they ship independently, and their
models genuinely diverge (see §4).

If a third consumer appears — a mobile app, a partner portal — extract the
shared primitives into an npm workspace package (`packages/domain`) and have both
apps depend on it. Nothing in either codebase's structure has to change to allow
that; only the import paths do.
