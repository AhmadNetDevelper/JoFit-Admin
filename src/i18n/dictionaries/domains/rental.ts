/**
 * Strings for the rental screens' add / edit / delete work. Kept in its own file
 * so each domain's screens own their words; merged into `en.ts` and `ar.ts`.
 * Every key needs both languages — `rentalAr` is checked against `rentalEn`.
 */
export const rentalEn = {
  /* Nouns for "Add {noun}", "New {noun} added." — lower case. */
  "rental.itemNoun": "rental item",
  "rental.categoryNoun": "category",
  "rental.depotNoun": "depot",

  /* Categories & depots. */
  "rental.categoriesDescription": "How the storefront groups its hire items. A category still holding items or sub-categories cannot be deleted.",
  "rental.depotsDescription": "Where units are collected from and returned to. A depot with items stocked there cannot be deleted.",
  "rental.parentHint": "Leave as none for a top-level category.",
  "rental.underParent": "under {parent}",
  "rental.categorySportsHint": "The sports whose pages list this category.",
  "rental.countryCode": "Country code",
  "rental.countryCodeHint": "Two capital letters, e.g. JO.",
  "rental.searchCategories": "Search categories",
  "rental.searchDepots": "Search depots",

  /* The items list. */
  "rental.imageColumn": "Image",

  /* The item page. */
  "rental.sectionImages": "Images",
  "rental.sectionImagesHint": "Shown on the storefront: the first is the cover on the item's card, and all of them appear on its page.",
  "rental.photos": "Photos",
  "rental.sectionUnitsCondition": "Units and condition",
  "rental.sectionUnitsConditionHint": "How many units you own, and the state they are in.",
  "rental.organisationHint": "The depot that holds it, and the sports it is listed under.",
  /* Its own word: in Arabic the shared "rental.condition" and "field.status" are both "الحالة". */
  "rental.conditionLabel": "Condition",
  /* Keys are the raw condition values. */
  "rental.conditionValue.new": "New",
  "rental.conditionValue.excellent": "Excellent",
  "rental.conditionValue.good": "Good",
  "rental.conditionValue.fair": "Fair",
  "rental.depot": "Depot",
  "rental.depotHint": "Where this item's units are collected from and returned to.",
  "rental.chooseDepot": "Choose a depot",
  "rental.categoriesHint": "At least one. Sub-categories sit under their parent.",
  "rental.sportsHint": "The sports this item is listed under on the storefront.",
  "rental.totalUnits": "Units owned",
  "rental.totalUnitsHint": "Every physical unit, including any out of service.",
  "rental.rates": "Rates",
  "rental.ratesHint": "Tick each way this item can be hired. Prices are per unit, in JOD with three decimals (18.000). Leave the maximum empty for no limit.",
  "rental.rateBy.hour": "By the hour",
  "rental.rateBy.day": "By the day",
  "rental.rateBy.week": "By the week",
  "rental.ratePrice": "Price (JOD)",
  "rental.minUnits": "Minimum",
  "rental.maxUnits": "Maximum",
  "rental.depositJod": "Deposit per unit (JOD)",
  "rental.depositHint": "Refunded when the unit comes back. Leave empty for no deposit.",
  "rental.viewBookings": "See this item's bookings",
  "rental.outOfServiceHint": "Units withdrawn from hire — damaged, or in for servicing.",
  "rental.availableOf": "{available} of {total} available to hire",
  "rental.outOfServiceUpdate": "Update",
  "rental.outOfServiceSaved": "Units out of service updated.",
} as const;

export const rentalAr: Readonly<Record<keyof typeof rentalEn, string>> = {
  "rental.itemNoun": "معدّة تأجير",
  "rental.categoryNoun": "فئة",
  "rental.depotNoun": "مستودع",

  "rental.categoriesDescription": "طريقة تجميع المتجر لمعدات التأجير. لا يمكن حذف فئة ما زالت تضم معدات أو فئات فرعية.",
  "rental.depotsDescription": "أماكن استلام الوحدات وإرجاعها. لا يمكن حذف مستودع فيه معدات.",
  "rental.parentHint": "اتركها «لا يوجد» لتكون فئة رئيسية.",
  "rental.underParent": "ضمن {parent}",
  "rental.categorySportsHint": "الرياضات التي تعرض صفحاتها هذه الفئة.",
  "rental.countryCode": "رمز الدولة",
  "rental.countryCodeHint": "حرفان إنجليزيان كبيران، مثل JO.",
  "rental.searchCategories": "ابحث في الفئات",
  "rental.searchDepots": "ابحث في المستودعات",

  "rental.imageColumn": "الصورة",


  "rental.sectionImages": "الصور",
  "rental.sectionImagesHint": "تظهر في المتجر: الأولى غلافٌ لبطاقة المعدّة، وتظهر جميعها في صفحتها.",
  "rental.photos": "صور المعدّة",
  "rental.sectionUnitsCondition": "الوحدات والحالة",
  "rental.sectionUnitsConditionHint": "عدد الوحدات التي تملكها، والحالة التي هي عليها.",
  "rental.organisationHint": "المستودع الذي تُحفظ فيه، والرياضات التي تُعرض ضمنها.",
  "rental.conditionLabel": "حالة المعدّة",
  "rental.conditionValue.new": "جديدة",
  "rental.conditionValue.excellent": "ممتازة",
  "rental.conditionValue.good": "جيدة",
  "rental.conditionValue.fair": "مقبولة",
  "rental.depot": "المستودع",
  "rental.depotHint": "المكان الذي تُستلم منه وحدات هذه المعدّة وتُعاد إليه.",
  "rental.chooseDepot": "اختر مستودعًا",
  "rental.categoriesHint": "فئة واحدة على الأقل. تظهر الفئات الفرعية تحت الفئة الأم.",
  "rental.sportsHint": "الرياضات التي تظهر هذه المعدّة ضمنها في المتجر.",
  "rental.totalUnits": "عدد الوحدات المملوكة",
  "rental.totalUnitsHint": "كل الوحدات الفعلية، بما فيها الخارجة عن الخدمة.",
  "rental.rates": "الأسعار",
  "rental.ratesHint": "اختر كل طريقة يمكن تأجير المعدّة بها. الأسعار لكل وحدة بالدينار الأردني بثلاث خانات عشرية (18.000). اترك الحد الأقصى فارغًا إن لم يكن هناك حد.",
  "rental.rateBy.hour": "بالساعة",
  "rental.rateBy.day": "باليوم",
  "rental.rateBy.week": "بالأسبوع",
  "rental.ratePrice": "السعر (د.أ)",
  "rental.minUnits": "الحد الأدنى",
  "rental.maxUnits": "الحد الأقصى",
  "rental.depositJod": "التأمين لكل وحدة (د.أ)",
  "rental.depositHint": "يُعاد عند إرجاع الوحدة. اتركه فارغًا إن لم يكن هناك تأمين.",
  "rental.viewBookings": "عرض حجوزات هذه المعدّة",
  "rental.outOfServiceHint": "وحدات مسحوبة من التأجير — تالفة أو قيد الصيانة.",
  "rental.availableOf": "{available} من {total} متاحة للتأجير",
  "rental.outOfServiceUpdate": "تحديث",
  "rental.outOfServiceSaved": "تم تحديث الوحدات خارج الخدمة.",
};
