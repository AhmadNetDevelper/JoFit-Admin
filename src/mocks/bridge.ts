import type { CoachBooking } from "@/features/coaches";
import type { Enrolment } from "@/features/education";
import type { Order, OrderLine } from "@/features/orders";
import type { QuotationRequest } from "@/features/quotations";
import type { RentalBooking } from "@/features/rental";
import type { Menu, MenuPage } from "@/features/menus";
import type { StaffNotification } from "@/features/notifications";
import type { AdminReview, ReviewableType } from "@/features/reviews";
import type { Conversation, SupportMessage } from "@/features/support";
import { appConfig } from "@/config";
import { AppError } from "@/lib";
import type { Address, AuditInfo, DateRange, LocalizedText, Money } from "@/types";

import { mockEmployers, mockJobApplications, mockJobCategories, mockJobs, withAbsoluteLogo } from "./careers";
import { mockProducts } from "./catalogue";
import { mockCoachBookings, mockCoaches } from "./coaches";
import { mockCourses, mockEnrolments } from "./education";
import { mockMenuPages, mockMenus } from "./menus";
import { mockStaffNotifications } from "./notifications";
import { mockOrders } from "./orders";
import { mockPeople, type MockPerson } from "./people";
import { mockQuotationRequests } from "./quotations";
import { mockRentalBookings, mockRentalItems } from "./rental";
import { mockReviews } from "./reviews";
import { mockConversations, mockSupportMessages } from "./support";
import type { WebEmployer, WebJob, WebJobApplication, WebJobCategory } from "./website/types";

/**
 * THE ADMIN'S HALF OF THE DEVELOPMENT BRIDGE.
 *
 * With the storefront's dev server running, the admin stops trusting its own
 * generated history and mirrors the storefront's account store instead — the
 * one place a customer's checkout, a booked session, a reserved seat or a quote
 * request actually lands. On start-up (`hydrateFromStorefront`, awaited before
 * the app renders) and every few seconds after, it re-reads the store when its
 * version has moved and REPLACES THE CONTENTS of the module arrays every mock
 * adapter already reads. Nothing above the mocks changes: screens, services and
 * contracts are exactly as they were.
 *
 * Every status change staff make is then written back (`pushToStorefront`), so
 * a coach session confirmed here shows as confirmed on the customer's account.
 *
 * When the storefront is not running, nothing happens and the admin keeps its
 * own fixtures — so the admin still works on its own.
 *
 * Deleted with the rest of `src/mocks` when both apps read one backend.
 */
const BASE = appConfig.storefrontUrl.replace(/\/+$/, "");
const ENDPOINT = `${BASE}/api/dev/store`;
const POLL_MS = 5_000;

let version = -1;
let live = false;
const listeners = new Set<() => void>();

/** Whether the admin is currently mirroring the storefront. */
export function isBridgeLive(): boolean {
  return live;
}

/** Called after each re-read that changed the data, so open screens can refetch. */
export function onBridgeChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------ raw shapes */

interface RawCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  locale: "en" | "ar";
  marketingOptIn: boolean;
  favouriteSportIds: string[];
  joinedDaysAgo: number;
  addresses: Address[];
}
interface RawOrder {
  id: string;
  reference: string;
  status: Order["status"];
  placedAt: string;
  customerId: string;
  lines: (Omit<OrderLine, "rentalBookingId">)[];
  itemsSubtotal: Money;
  depositsTotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  grandTotal: Money;
  shippingAddress?: Address;
}
interface RawRental {
  id: string;
  reference: string;
  itemId: string;
  itemTitle: LocalizedText;
  customerId: string;
  period: DateRange;
  unit: RentalBooking["unit"];
  quantity: number;
  status: RentalBooking["status"];
  total: Money;
  deposit?: Money;
  depositReleasedAt?: string;
  orderId: string;
  createdAt: string;
}
interface RawSession extends Omit<CoachBooking, "coachName" | "audit"> {
  createdAt: string;
}
interface RawEnrolment extends Omit<Enrolment, "courseTitle" | "customerEmail" | "audit"> {}
interface RawReview {
  id: string;
  targetType: ReviewableType;
  targetId: string;
  customerId: string;
  authorName: string;
  rating: AdminReview["rating"];
  title?: string;
  body: string;
  submittedAt: string;
  moderationStatus: AdminReview["moderationStatus"];
  moderationNote?: string;
  isVerifiedPurchase?: boolean;
}
type RawQuotation = Omit<QuotationRequest, "audit">;

interface Snapshot {
  version: number;
  unchanged?: boolean;
  customers: RawCustomer[];
  orders: RawOrder[];
  rentalBookings: RawRental[];
  coachBookings: RawSession[];
  enrolments: RawEnrolment[];
  reviews: RawReview[];
  quotations: RawQuotation[];
  /* Absent from a storefront older than the menu and chat features. */
  menus?: Menu[];
  menuPages?: MenuPage[];
  notifications?: StaffNotification[];
  conversations?: Conversation[];
  supportMessages?: SupportMessage[];
  /* Absent from a storefront older than the careers marketplace. Applications
     carry their CV's metadata only; the bytes come from `fetchStorefrontCv`. */
  employers?: WebEmployer[];
  jobCategories?: WebJobCategory[];
  jobs?: WebJob[];
  jobApplications?: WebJobApplication[];
}

/* ---------------------------------------------------------------- mapping */

const audit = (at: string): AuditInfo => ({ createdAt: at, createdBy: "system", updatedAt: at, updatedBy: "system" });

function replace<T>(target: T[], next: readonly T[]): void {
  target.splice(0, target.length, ...next);
}

function publicName(name: string): string {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : (first ?? name);
}

function toPerson(raw: RawCustomer, existing: MockPerson | undefined): MockPerson {
  const address = raw.addresses[0];
  return {
    id: raw.id,
    name: raw.name,
    publicName: existing?.publicName ?? publicName(raw.name),
    email: raw.email,
    phone: raw.phone,
    locale: raw.locale,
    marketingOptIn: raw.marketingOptIn,
    favouriteSportIds: raw.favouriteSportIds,
    city: (address?.city as MockPerson["city"] | undefined) ?? existing?.city ?? "Amman",
    street: address?.line1 ?? existing?.street,
    joinedDaysAgo: raw.joinedDaysAgo,
  };
}

function targetTitle(type: ReviewableType, id: string): string {
  switch (type) {
    case "product":
      return mockProducts.find((entry) => entry.id === id)?.title.en ?? id;
    case "rental-item":
      return mockRentalItems.find((entry) => entry.id === id)?.title.en ?? id;
    case "coach":
      return mockCoaches.find((entry) => entry.id === id)?.name.en ?? id;
    case "course":
      return mockCourses.find((entry) => entry.id === id)?.title.en ?? id;
  }
}

function apply(snapshot: Snapshot): void {
  const people = snapshot.customers.map((raw) =>
    toPerson(raw, mockPeople.find((entry) => entry.id === raw.id)),
  );
  replace(mockPeople, people);
  const person = (id: string) => people.find((entry) => entry.id === id);
  const ref = (id: string) => {
    const found = person(id);
    return { id, name: found?.name ?? id, email: found?.email ?? "" };
  };

  replace(
    mockOrders,
    snapshot.orders.map((raw): Order => ({
      ...raw,
      customer: ref(raw.customerId),
      lines: raw.lines.map((line) => ({
        ...line,
        rentalBookingId:
          line.kind === "rental"
            ? snapshot.rentalBookings.find(
                (booking) => booking.orderId === raw.id && booking.itemId === line.rentalItemId,
              )?.id
            : undefined,
      })),
      audit: audit(raw.placedAt),
    })),
  );

  replace(
    mockRentalBookings,
    snapshot.rentalBookings.map((raw): RentalBooking => ({
      id: raw.id,
      reference: raw.reference,
      itemId: raw.itemId,
      itemTitle: raw.itemTitle,
      customerId: raw.customerId,
      customerName: ref(raw.customerId).name,
      customerEmail: ref(raw.customerId).email,
      period: raw.period,
      unit: raw.unit,
      quantity: raw.quantity,
      status: raw.status,
      total: raw.total,
      deposit: raw.deposit,
      depositReleasedAt: raw.depositReleasedAt,
      orderId: raw.orderId,
      orderReference: snapshot.orders.find((order) => order.id === raw.orderId)?.reference ?? raw.orderId,
      audit: audit(raw.createdAt),
    })),
  );

  replace(
    mockCoachBookings,
    snapshot.coachBookings.map(({ createdAt, ...raw }): CoachBooking => ({
      ...raw,
      coachName: mockCoaches.find((coach) => coach.id === raw.coachId)?.name ?? { en: raw.coachId, ar: raw.coachId },
      audit: audit(createdAt),
    })),
  );

  replace(
    mockEnrolments,
    snapshot.enrolments.map((raw): Enrolment => {
      const course = mockCourses.find((entry) => entry.id === raw.courseId);
      return {
        ...raw,
        courseTitle: course?.title ?? { en: raw.courseId, ar: raw.courseId },
        customerEmail: ref(raw.customerId).email,
        audit: audit(raw.enrolledAt),
      };
    }),
  );

  replace(
    mockReviews,
    snapshot.reviews.map((raw): AdminReview => ({
      id: raw.id,
      target: { type: raw.targetType, id: raw.targetId, title: targetTitle(raw.targetType, raw.targetId) },
      customerId: raw.customerId,
      authorName: raw.authorName,
      authorEmail: ref(raw.customerId).email,
      rating: raw.rating,
      title: raw.title,
      body: raw.body,
      submittedAt: raw.submittedAt,
      moderationStatus: raw.moderationStatus,
      moderationNote: raw.moderationNote,
      isVerifiedPurchase: raw.isVerifiedPurchase,
      helpfulCount: mockReviews.find((review) => review.id === raw.id)?.helpfulCount ?? 0,
      audit: audit(raw.submittedAt),
    })),
  );

  replace(
    mockQuotationRequests,
    snapshot.quotations.map((raw): QuotationRequest => ({ ...raw, audit: audit(raw.submittedAt) })),
  );

  /* Content and messaging: the storefront holds the one copy. */
  if (snapshot.menus) replace(mockMenus, snapshot.menus);
  if (snapshot.menuPages) replace(mockMenuPages, snapshot.menuPages);
  if (snapshot.notifications) replace(mockStaffNotifications, snapshot.notifications);
  if (snapshot.conversations) replace(mockConversations, snapshot.conversations);
  if (snapshot.supportMessages) replace(mockSupportMessages, snapshot.supportMessages);

  /* Careers: employers register, post and hire on the storefront; staff decide here. */
  if (snapshot.employers) replace(mockEmployers, snapshot.employers.map(withAbsoluteLogo));
  if (snapshot.jobCategories) replace(mockJobCategories, snapshot.jobCategories);
  if (snapshot.jobs) replace(mockJobs, snapshot.jobs);
  if (snapshot.jobApplications) replace(mockJobApplications, snapshot.jobApplications);
}

/* ---------------------------------------------------------------- traffic */

/**
 * Re-reads the storefront's store if it changed since the last read. Resolves
 * `true` when the admin is mirroring the storefront, `false` when the
 * storefront is not there (and the admin carries on with its own fixtures).
 */
export async function hydrateFromStorefront(timeoutMs = 1_500): Promise<boolean> {
  try {
    const response = await fetch(`${ENDPOINT}?since=${version}`, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(String(response.status));
    const snapshot = (await response.json()) as Snapshot;
    live = true;
    /* Pictures saved while the storefront was out of reach go now. */
    flushCatalogueImages();
    if (snapshot.unchanged) return true;
    apply(snapshot);
    version = snapshot.version;
    listeners.forEach((listener) => listener());
    return true;
  } catch {
    live = false;
    return false;
  }
}

/** Keeps the mirror fresh while the admin is open. */
export function startBridgePolling(): () => void {
  const timer = window.setInterval(() => void hydrateFromStorefront(), POLL_MS);
  return () => window.clearInterval(timer);
}

export type BridgeKind =
  | "customer"
  | "order"
  | "rental"
  | "session"
  | "enrolment"
  | "review"
  | "quotation"
  | "conversation"
  | "notification"
  | "menu"
  | "menu-page"
  | "support-message"
  | "catalogue-image"
  | "employer"
  | "job"
  | "job-category";

/** `patch` changes fields; `put` replaces a whole document; `delete` removes it; `create` appends one. */
export type BridgeOp = "patch" | "put" | "delete" | "create";

/** The catalogue records whose pictures reach the storefront — see `pushCatalogueImages`. */
export type CatalogueImageRecord =
  | "product"
  | "product-category"
  | "brand"
  | "sport"
  | "rental-item"
  | "coach"
  | "course"
  | "article"
  | "author";

/**
 * Sends one staff change to the storefront. Fire-and-forget from the adapter's
 * point of view: the local array has already changed, and if the storefront is
 * down the admin simply keeps working on its own copy.
 */
export function pushToStorefront(
  kind: BridgeKind,
  id: string,
  changes: Record<string, unknown>,
  op: BridgeOp = "patch",
): void {
  if (!live) return;
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, kind, id, changes }),
  })
    .then((response) => response.json() as Promise<{ ok: boolean; version?: number }>)
    .then((result) => {
      /* Our own write moved the version by one; skip re-reading what we already
         have. Anything more means someone else wrote too, so leave it for the
         next poll to pick up. */
      if (result.ok && result.version === version + 1) version = result.version;
    })
    .catch(() => {
      live = false;
    });
}

/**
 * A candidate's CV, from the storefront — `GET /api/dev/cv/<applicationId>`.
 *
 * The snapshot carries each application's CV METADATA only; the bytes are the
 * candidate's and stay on the storefront until a member of staff asks for
 * them, one file at a time. Without the storefront running there is nothing
 * to download, and the admin says so instead of pretending.
 */
export async function fetchStorefrontCv(applicationId: string): Promise<{ blob: Blob; fileName: string }> {
  let response: Response;
  try {
    response = await fetch(`${BASE}/api/dev/cv/${encodeURIComponent(applicationId)}`, { cache: "no-store" });
  } catch (cause) {
    throw new AppError("unavailable", "CVs are kept by the storefront. Start its dev server to open them.", { cause });
  }
  if (response.status === 404) throw new AppError("not-found", "That CV is no longer on file.", { status: 404 });
  if (!response.ok) throw new AppError("unavailable", `The storefront answered ${response.status}.`, { status: response.status });
  const disposition = response.headers.get("content-disposition") ?? "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const fileName = encoded ? decodeURIComponent(encoded) : `${applicationId}-cv`;
  return { blob: await response.blob(), fileName };
}

/* ---------------------------------------------------------- catalogue images */

/** Key order must not make two equal images look different. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, entry: unknown) =>
    entry && typeof entry === "object" && !Array.isArray(entry)
      ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b)))
      : entry,
  );
}

/** No picture: absent, `null`, or an empty gallery. */
const nothing = (value: unknown) =>
  value === undefined || value === null || (Array.isArray(value) && value.length === 0);

/**
 * Sends the image fields of a catalogue record staff just saved — ONLY the
 * ones that changed — to the storefront, one `catalogue-image` patch each:
 *
 *   { op: "patch", kind: "catalogue-image", id,
 *     changes: { record, field, value: MediaImage | Media[] | null } }
 *
 * The rest of the catalogue is not bridged (the admin edits its own copy of a
 * snapshot); pictures are, so a logo uploaded here is on the site's next page
 * view. The storefront ignores ids it does not have, so a record created here
 * sends its pictures harmlessly — only existing records sync.
 *
 * Why only what changed: the snapshot made the storefront's own fixture photos
 * absolute (`website/assets.ts`), so re-sending a picture nobody touched would
 * hand the storefront back its own file under a new address. What IS sent is
 * sent exactly as saved — an upload's `data:` URL, or the API's media URL.
 *
 * `before` is the record as it was (undefined on create), `after` as saved.
 */
export function pushCatalogueImages(
  record: CatalogueImageRecord,
  id: string,
  fields: readonly string[],
  before: object | undefined,
  after: object,
): void {
  for (const field of fields) {
    const next = (after as Record<string, unknown>)[field];
    const previous = before ? (before as Record<string, unknown>)[field] : undefined;
    if (nothing(next) && nothing(previous)) continue;
    if (!nothing(next) && !nothing(previous) && canonical(next) === canonical(previous)) continue;
    /* Last write wins: a newer save of the same field replaces one still waiting. */
    pendingImages.set(`${record}:${id}:${field}`, {
      id,
      changes: { record, field, value: nothing(next) ? null : next },
      attempts: 0,
    });
  }
  flushCatalogueImages();
}

/*
 * THE PICTURES STILL TO SEND. Unlike a status patch, a picture that misses the
 * storefront stays wrong there until somebody saves it again — so it is not
 * dropped when the bridge is momentarily down (the poll's short timeout marks
 * it down whenever the storefront's dev server is busy compiling). It waits,
 * newest value per field, and goes on the next successful poll. A refusal
 * (4xx) is final; anything else is retried a couple of times, then given up.
 */
const pendingImages = new Map<string, { id: string; changes: Record<string, unknown>; attempts: number }>();
const IMAGE_ATTEMPTS = 3;

function flushCatalogueImages(): void {
  if (!live) return;
  for (const [key, entry] of [...pendingImages]) {
    pendingImages.delete(key);
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "patch", kind: "catalogue-image", id: entry.id, changes: entry.changes }),
    })
      .then((response) => {
        if (response.status >= 500) throw new Error(String(response.status));
      })
      .catch(() => {
        live = false;
        const attempts = entry.attempts + 1;
        if (attempts < IMAGE_ATTEMPTS && !pendingImages.has(key)) pendingImages.set(key, { ...entry, attempts });
      });
  }
}
