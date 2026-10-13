import type {
  CommunityComment,
  CommunityModerationStatus,
  CommunityPost,
  CommunityPostKind,
  CommunityTopic,
} from "@/features/community";

import { mockPeople, personById, personByPublicName } from "../people";
import { atTime } from "../runtime";
import { websiteSnapshot } from "../website/snapshot";

/**
 * The community: the storefront's two seed threads, plus the traffic a live
 * community would have — including the posts members have reported, which is
 * the queue this screen exists to clear.
 *
 * Every author is a customer on file (`mocks/people`). Whether community
 * identity really is the commerce account is an OPEN BUSINESS DECISION; the
 * fixtures take the simplest answer so the customer screen can show it.
 */

/* The storefront's two topics, plus the ones a sports community grows into. */
const EXTRA_TOPICS = [
  { id: "topic-recovery", slug: "recovery", name: { en: "Injury & recovery", ar: "الإصابات والتعافي" } },
  { id: "topic-events", slug: "events", name: { en: "Events & races", ar: "الفعاليات والسباقات" } },
] as const;

interface PostSpec {
  readonly id: string;
  readonly customerId: string;
  readonly kind: CommunityPostKind;
  readonly topicIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly title: string;
  readonly body: string;
  readonly daysAgo: number;
  readonly likeCount: number;
  readonly reportCount?: number;
  readonly status?: CommunityModerationStatus;
  readonly note?: string;
  readonly comments?: readonly {
    readonly customerId: string;
    readonly body: string;
    readonly reportCount?: number;
    readonly status?: CommunityModerationStatus;
  }[];
}

const written: readonly PostSpec[] = [
  {
    id: "post-dead-sea-half", customerId: "cust-19", kind: "question", topicIds: ["topic-events"], sportIds: ["sport-running"],
    title: "هل يستحق نصف ماراثون البحر الميت التجربة؟",
    body: "أفكر بالمشاركة هذا الموسم لأول مرة. كيف الحرارة في الصباح؟ وهل يوجد ماء كافٍ على المسار؟",
    daysAgo: 2, likeCount: 14,
    comments: [
      { customerId: "cust-21", body: "شاركت السنة الماضية، الانطلاق مبكر جداً والحرارة معقولة حتى الكيلو ١٥ تقريباً." },
      { customerId: "cust-13", body: "خذ معك أملاح، المحطات موجودة لكن متباعدة في النصف الثاني." },
    ],
  },
  {
    id: "post-acl-return", customerId: "cust-8", kind: "discussion", topicIds: ["topic-recovery"], sportIds: ["sport-football"],
    title: "Nine months post-ACL — what actually helped",
    body: "Posting this for anyone at the start. Boring strength work beat every gadget. Happy to answer questions.",
    daysAgo: 5, likeCount: 31,
    comments: [
      { customerId: "cust-11", body: "This is really useful, thank you. How many days a week were you lifting?" },
      { customerId: "cust-8", body: "Three, never more than an hour. Consistency over intensity." },
    ],
  },
  {
    id: "post-cheap-supplements", customerId: "cust-26", kind: "discussion", topicIds: ["topic-gear"], sportIds: ["sport-gym"],
    title: "Best prices on supplements — DM me",
    body: "I sell imported pre-workout at half the shop price, message me on WhatsApp for the list.",
    daysAgo: 1, likeCount: 0, reportCount: 6,
  },
  {
    id: "post-court-booking", customerId: "cust-24", kind: "question", topicIds: ["topic-training"], sportIds: ["sport-basketball"],
    title: "Anyone want to share an indoor court on Fridays?",
    body: "Looking for 6–8 people for a regular Friday morning run at the Amman court. Split the hourly rate.",
    daysAgo: 3, likeCount: 9,
    comments: [
      { customerId: "cust-17", body: "أنا معكم، الساعة كم؟" },
      { customerId: "cust-6", body: "Count me in from next month." },
      { customerId: "cust-26", body: "Join my paid league instead, link in bio", reportCount: 3 },
    ],
  },
  {
    id: "post-rude-thread", customerId: "cust-12", kind: "discussion", topicIds: ["topic-training"], sportIds: ["sport-basketball"],
    title: "Coaches here don't know anything",
    body: "Every coach on this site is a scam and anyone who books them is an idiot.",
    daysAgo: 8, likeCount: 1, reportCount: 4, status: "hidden",
    note: "Personal attacks on other members and coaches — community rule 2.",
  },
  {
    id: "post-kayak-aqaba", customerId: "cust-3", kind: "discussion", topicIds: ["topic-gear"], sportIds: ["sport-water-sports"],
    title: "Sea kayak hire in Aqaba — worth it",
    body: "Hired two kayaks for the weekend. Wind picks up after midday, go early.",
    daysAgo: 11, likeCount: 12,
  },
  {
    id: "post-club-announcement", customerId: "cust-22", kind: "announcement", topicIds: ["topic-events"], sportIds: ["sport-fitness"],
    title: "Free open session for CPT graduates",
    body: "The academy is running an open floor session for this year's CPT graduates. Bring a client.",
    daysAgo: 6, likeCount: 22, reportCount: 1,
  },
];

function toPost(spec: PostSpec, commentCount: number): CommunityPost {
  const person = personById(spec.customerId);
  const createdAt = atTime(-spec.daysAgo, 18, 40);
  const reportCount = spec.reportCount ?? 0;
  return {
    id: spec.id,
    slug: spec.id.replace(/^post-/, ""),
    title: spec.title,
    excerpt: spec.body.length > 90 ? `${spec.body.slice(0, 90)}…` : spec.body,
    body: spec.body,
    kind: spec.kind,
    topicIds: spec.topicIds,
    sportIds: spec.sportIds,
    customerId: person.id,
    authorName: person.publicName,
    createdAt,
    commentCount,
    likeCount: spec.likeCount,
    reportCount,
    moderationStatus: spec.status ?? (reportCount > 0 ? "flagged" : "visible"),
    moderationNote: spec.note,
    audit: { createdAt, createdBy: "system", updatedAt: createdAt, updatedBy: "system" },
  };
}

/* The storefront's seed threads, matched to customers by display name. */
const seededComments: CommunityComment[] = websiteSnapshot.comments.map((comment) => {
  const person = personByPublicName(comment.authorName) ?? mockPeople[0]!;
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    customerId: person.id,
    authorName: comment.authorName,
    body: comment.body,
    createdAt: `${comment.createdAt}T20:00:00+03:00`,
    likeCount: comment.likeCount,
    reportCount: 0,
    moderationStatus: "visible",
  };
});

const seededPosts: CommunityPost[] = websiteSnapshot.posts.map((post) => {
  const person = personByPublicName(post.authorName) ?? mockPeople[0]!;
  const createdAt = `${post.createdAt}T19:00:00+03:00`;
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    kind: post.kind,
    topicIds: post.topicIds,
    sportIds: post.sportIds,
    customerId: person.id,
    authorName: post.authorName,
    createdAt,
    commentCount: seededComments.filter((comment) => comment.postId === post.id).length,
    likeCount: post.likeCount,
    reportCount: 0,
    moderationStatus: "visible",
    audit: { createdAt, createdBy: "system", updatedAt: createdAt, updatedBy: "system" },
  };
});

const writtenComments: CommunityComment[] = written.flatMap((spec) =>
  (spec.comments ?? []).map((comment, index) => {
    const person = personById(comment.customerId);
    const reportCount = comment.reportCount ?? 0;
    return {
      id: `${spec.id}-c${index + 1}`,
      postId: spec.id,
      parentId: null,
      customerId: person.id,
      authorName: person.publicName,
      body: comment.body,
      createdAt: atTime(-spec.daysAgo, 20 + index, 10),
      likeCount: index === 0 ? 3 : 1,
      reportCount,
      moderationStatus: comment.status ?? (reportCount > 0 ? "flagged" : "visible"),
    };
  }),
);

export const mockCommunityComments: CommunityComment[] = [...seededComments, ...writtenComments];

export const mockCommunityPosts: CommunityPost[] = [
  ...written.map((spec) => toPost(spec, spec.comments?.length ?? 0)),
  ...seededPosts,
];

export const mockCommunityTopics: readonly CommunityTopic[] = [
  ...websiteSnapshot.topics,
  ...EXTRA_TOPICS,
].map((topic) => ({
  id: topic.id,
  slug: topic.slug,
  name: topic.name,
  postCount: mockCommunityPosts.filter((post) => post.topicIds.includes(topic.id)).length,
}));
