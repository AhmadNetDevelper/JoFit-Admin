/**
 * Strings for the catalogue screens' add / edit / delete work. Kept in its own file
 * so each domain's screens own their words; merged into `en.ts` and `ar.ts`.
 * Every key needs both languages — `catalogueAr` is checked against `catalogueEn`.
 */
export const catalogueEn = {
  "products.noun": "product",
  "products.brandPlaceholder": "Choose a brand",
  "products.categoriesHint": "At least one. The storefront files the product under each.",
  "products.sportsHint": "Optional. Lets shoppers find it from each sport's page.",
  "products.firstVariant": "First variant",
  "products.firstVariantHint":
    "What goes on sale first: its SKU, price and opening stock.",
  "products.priceHint": "In {currency}, e.g. 24.500",
  "products.openingStock": "Opening stock",
  "products.openingStockHint": "Units on hand today. Later changes are stock adjustments.",
  "products.images": "Images",
  "products.imagesDescription": "The photos shoppers see on the product's page and in the shop's lists.",
  "products.photos": "Product photos",
  "products.photosHint": "The cover is the picture on the shop's product cards and at the top of the product page.",
  "products.imageColumn": "Image",

  "categories.noun": "category",
  "categories.description":
    "How the shop's products are grouped. A category with products or sub-categories under it cannot be deleted.",
  "categories.parentHint": "Leave as none for a top-level category.",
  "categories.image": "Image",
  "categories.imageHint": "Optional. A wide picture that stands for the category.",

  "brands.noun": "brand",
  "brands.description": "The makers the shop sells. A brand still carried by products cannot be deleted.",
  "brands.nameHint": "A proper noun, written the same in both languages.",
  "brands.logo": "Logo",
  "brands.logoHint": "Optional. A square logo on a transparent or plain background works best.",
} as const;

export const catalogueAr: Readonly<Record<keyof typeof catalogueEn, string>> = {
  "products.noun": "منتج",
  "products.brandPlaceholder": "اختر العلامة التجارية",
  "products.categoriesHint": "فئة واحدة على الأقل. يُعرض المنتج في المتجر ضمن كل فئة تختارها.",
  "products.sportsHint": "اختياري. يساعد المتسوقين على الوصول إليه من صفحة كل رياضة.",
  "products.firstVariant": "الخيار الأول",
  "products.firstVariantHint":
    "ما يُعرض للبيع أولاً: رمز المنتج وسعره والمخزون الافتتاحي.",
  "products.priceHint": "بعملة {currency}، مثلاً 24.500",
  "products.openingStock": "المخزون الافتتاحي",
  "products.openingStockHint": "عدد القطع المتوفرة اليوم. أي تغيير لاحق يتم عبر تعديل المخزون.",
  "products.images": "الصور",
  "products.imagesDescription": "الصور التي يراها المتسوقون في صفحة المنتج وفي قوائم المتجر.",
  "products.photos": "صور المنتج",
  "products.photosHint": "صورة الغلاف هي التي تظهر على بطاقة المنتج في المتجر وأعلى صفحته.",
  "products.imageColumn": "الصورة",

  "categories.noun": "فئة",
  "categories.description":
    "طريقة تجميع منتجات المتجر. لا يمكن حذف فئة تندرج تحتها منتجات أو فئات فرعية.",
  "categories.parentHint": "اترك الخيار «لا يوجد» لتكون فئة رئيسية.",
  "categories.image": "الصورة",
  "categories.imageHint": "اختياري. صورة عريضة تعبّر عن الفئة.",

  "brands.noun": "علامة تجارية",
  "brands.description": "الجهات المصنّعة التي يبيع المتجر منتجاتها. لا يمكن حذف علامة تجارية ما زالت لها منتجات.",
  "brands.nameHint": "اسم علم يُكتب بالطريقة نفسها في اللغتين.",
  "brands.logo": "الشعار",
  "brands.logoHint": "اختياري. يُفضَّل شعار مربّع بخلفية شفافة أو بلون واحد.",
};
