/**
 * Strings for the content screens' add / edit / delete work — articles, their
 * categories and authors — and for deleting reviews, community posts and
 * quotation requests. Kept in its own file so each domain's screens own their
 * words; merged into `en.ts` and `ar.ts`. Every key needs both languages —
 * `contentAr` is checked against `contentEn`.
 */
export const contentEn = {
  "content.articleCount": "Articles",

  "articleCategories.title": "Article categories",
  "articleCategories.description": "How the blog groups its articles. A category that still has articles cannot be deleted.",
  "articleCategories.noun": "category",

  "authors.title": "Authors",
  "authors.description": "The people articles are credited to. Someone with articles to their name cannot be deleted.",
  "authors.noun": "author",
  "authors.nameHint": "A person's name, written the same in both languages.",
  "authors.role": "Role",
  "authors.roleHint": "Printed under the byline, e.g. “Head running coach”. Optional.",
  "authors.bio": "Biography",
  "authors.bioHint": "A line or two about them. Write it in both languages, or leave both empty.",
  "authors.slugHint": "Lower-case letters, numbers and hyphens, e.g. nadia-khoury. Optional.",
  "authors.avatar": "Photo",
  "authors.avatarHint": "A square portrait, shown with their name. Optional.",

  "articles.noun": "article",
  "articles.chooseAuthor": "Choose an author",
  "articles.categoriesHint": "Choose at least one.",
  "articles.startsAsDraft": "A new article starts as a draft. Publish it from its page once both languages are written.",
  "articles.cover": "Cover image",
  "articles.coverHint": "A wide 16:9 picture. The storefront shows it when the article is shared, as the link preview.",
  "articles.coverColumn": "Cover",

  "reviews.deleteTitle": "Delete this review by {name}?",
  "reviews.deleteBody": "Only for spam. To keep a review off the site but on record, reject it instead. This cannot be undone.",
  "reviews.deleted": "Review deleted.",

  "community.deletePost": "Delete post",
  "community.deletePostBody": "Its comments are deleted with it. To take it down but keep it on record, hide it instead. This cannot be undone.",
  "community.deleteCommentTitle": "Delete this comment by {name}?",
  "community.deleteCommentBody": "Replies to it are deleted too. To take it down but keep it on record, hide it instead. This cannot be undone.",
  "community.commentDeleted": "Comment deleted.",

  "quotations.deleteBody": "Only for spam and duplicates. A request that went nowhere should be marked “Lost” instead, so it stays on record. This cannot be undone.",
  "quotations.internalNoteHint": "For the team only. Saved when you change the status.",
  "quotations.moveTo": "Move to",

  "menus.headingTitle": "Menu heading",
  "menus.headingHint": "The name shown in the storefront header, and the page it opens when clicked.",
  "menus.columnsHint": "Each column is a heading in the dropdown with its links under it. The order here is the order on the site.",
  "menus.noColumns": "No columns yet. Add one to start building the menu.",
  "menus.noLinks": "No links in this column yet.",
  "menus.linkCount": "Links: {count}",
  "menus.visibleHint": "A hidden link stays in the menu for later but is not shown on the site.",
  "menus.removeTitle": "Remove “{name}”?",
  "menus.removeLinkBody": "The link comes out of this column. Nothing changes on the site until you save the menu.",
  "menus.removeColumnBody": "The column comes out of the menu with its links ({count}). Nothing changes on the site until you save the menu.",

  "pages.sectionsHint": "The body of the page, in the order shown. Each section has a heading and its text.",
  "pages.noSections": "No sections yet.",
  "pages.removeSectionBody": "The section and its text come out of the page. Nothing changes on the site until you save the page.",
  "pages.ctaTitle": "Closing button",
  "pages.ctaHint": "An optional button at the foot of the page, for example to the contact form.",
  "pages.publishedHint": "When off, the page stays a draft: saved here, but not on the site.",

  "support.sendHint": "Ctrl + Enter to send",
  "support.conversations": "Conversations",
} as const;

export const contentAr: Readonly<Record<keyof typeof contentEn, string>> = {
  "content.articleCount": "المقالات",

  "articleCategories.title": "تصنيفات المقالات",
  "articleCategories.description": "طريقة تجميع مقالات المدونة. لا يمكن حذف تصنيف ما زالت فيه مقالات.",
  "articleCategories.noun": "تصنيف",

  "authors.title": "الكتّاب",
  "authors.description": "الأشخاص الذين تُنسب إليهم المقالات. لا يمكن حذف اسمٍ ما دامت هناك مقالات منسوبة إليه.",
  "authors.noun": "كاتب",
  "authors.nameHint": "اسم الشخص، ويُكتب كما هو في اللغتين.",
  "authors.role": "الصفة",
  "authors.roleHint": "تظهر تحت الاسم في المقال، مثل «مدرّب الجري الرئيسي». اختيارية.",
  "authors.bio": "نبذة تعريفية",
  "authors.bioHint": "سطر أو سطران عنه. اكتبها باللغتين، أو اترك الخانتين فارغتين.",
  "authors.slugHint": "أحرف إنجليزية صغيرة وأرقام وشرطات، مثل nadia-khoury. اختياري.",
  "authors.avatar": "الصورة",
  "authors.avatarHint": "صورة شخصية مربّعة تظهر مع اسمه. اختيارية.",

  "articles.noun": "مقال",
  "articles.chooseAuthor": "اختر الكاتب",
  "articles.categoriesHint": "اختر تصنيفاً واحداً على الأقل.",
  "articles.startsAsDraft": "يبدأ المقال الجديد مسودةً. انشره من صفحته بعد كتابته باللغتين.",
  "articles.cover": "صورة الغلاف",
  "articles.coverHint": "صورة عريضة بنسبة 16:9، يعرضها المتجر عند مشاركة المقال كصورة معاينة للرابط.",
  "articles.coverColumn": "الغلاف",

  "reviews.deleteTitle": "حذف تقييم {name}؟",
  "reviews.deleteBody": "للرسائل المزعجة فقط. لإبعاد التقييم عن الموقع مع الاحتفاظ بسجلّه، ارفضه بدلاً من حذفه. لا يمكن التراجع عن هذا.",
  "reviews.deleted": "تم حذف التقييم.",

  "community.deletePost": "حذف المنشور",
  "community.deletePostBody": "تُحذف تعليقاته معه. لإزالته من الموقع مع الاحتفاظ بسجلّه، أخفِه بدلاً من حذفه. لا يمكن التراجع عن هذا.",
  "community.deleteCommentTitle": "حذف تعليق {name}؟",
  "community.deleteCommentBody": "تُحذف الردود عليه أيضاً. لإزالته مع الاحتفاظ بسجلّه، أخفِه بدلاً من حذفه. لا يمكن التراجع عن هذا.",
  "community.commentDeleted": "تم حذف التعليق.",

  "quotations.deleteBody": "للرسائل المزعجة والطلبات المكرّرة فقط. الطلب الذي لم يُثمر تُغيَّر حالته إلى «خسرناه» ليبقى في السجل. لا يمكن التراجع عن هذا.",
  "quotations.internalNoteHint": "للفريق فقط. تُحفظ عند تغيير الحالة.",
  "quotations.moveTo": "نقل إلى",

  "menus.headingTitle": "عنوان القائمة",
  "menus.headingHint": "الاسم الظاهر في رأس المتجر، والصفحة التي يفتحها عند النقر عليه.",
  "menus.columnsHint": "كل عمود عنوانٌ في القائمة المنسدلة تندرج تحته روابطه. الترتيب هنا هو ترتيب الظهور في الموقع.",
  "menus.noColumns": "لا أعمدة بعد. أضف عموداً لتبدأ ببناء القائمة.",
  "menus.noLinks": "لا روابط في هذا العمود بعد.",
  "menus.linkCount": "عدد الروابط: {count}",
  "menus.visibleHint": "يبقى الرابط المخفي في القائمة لوقت لاحق، لكنه لا يظهر في الموقع.",
  "menus.removeTitle": "حذف «{name}»؟",
  "menus.removeLinkBody": "يُحذف الرابط من هذا العمود. لن يتغيّر شيء في الموقع حتى تحفظ القائمة.",
  "menus.removeColumnBody": "يُحذف العمود من القائمة مع روابطه ({count}). لن يتغيّر شيء في الموقع حتى تحفظ القائمة.",

  "pages.sectionsHint": "متن الصفحة بالترتيب الظاهر هنا. لكل قسم عنوان ونصّ.",
  "pages.noSections": "لا أقسام بعد.",
  "pages.removeSectionBody": "يُحذف القسم ونصّه من الصفحة. لن يتغيّر شيء في الموقع حتى تحفظ الصفحة.",
  "pages.ctaTitle": "زرّ الختام",
  "pages.ctaHint": "زرّ اختياري في أسفل الصفحة، مثل رابط إلى نموذج التواصل.",
  "pages.publishedHint": "عند إيقافه تبقى الصفحة مسودة: محفوظة هنا، لكنها لا تظهر في الموقع.",

  "support.sendHint": "Ctrl + Enter للإرسال",
  "support.conversations": "المحادثات",
};
