/*
 * GENERATED — do not edit by hand.
 *
 * Written by `node scripts/sync-website-mocks.cjs` from the storefront's
 * fixtures in ../website/src/mocks. Change the storefront's data, then re-run
 * the script. See `./types.ts` for why this file exists.
 */
import type { WebsiteSnapshot } from "./types";

export const websiteSnapshot: WebsiteSnapshot = {
  "takenAt": "2026-09-30",
  "sports": [
    {
      "id": "sport-football",
      "slug": "football",
      "name": {
        "en": "Football",
        "ar": "كرة القدم"
      },
      "isFeatured": true
    },
    {
      "id": "sport-basketball",
      "slug": "basketball",
      "name": {
        "en": "Basketball",
        "ar": "كرة السلة"
      },
      "isFeatured": true
    },
    {
      "id": "sport-tennis",
      "slug": "tennis",
      "name": {
        "en": "Tennis",
        "ar": "التنس"
      },
      "isFeatured": true
    },
    {
      "id": "sport-swimming",
      "slug": "swimming",
      "name": {
        "en": "Swimming",
        "ar": "السباحة"
      },
      "isFeatured": false
    },
    {
      "id": "sport-running",
      "slug": "running",
      "name": {
        "en": "Running",
        "ar": "الجري"
      },
      "isFeatured": true
    },
    {
      "id": "sport-fitness",
      "slug": "fitness",
      "name": {
        "en": "Fitness",
        "ar": "اللياقة البدنية"
      },
      "isFeatured": true
    },
    {
      "id": "sport-gym",
      "slug": "gym",
      "name": {
        "en": "Gym",
        "ar": "الصالة الرياضية"
      },
      "isFeatured": false
    },
    {
      "id": "sport-martial-arts",
      "slug": "martial-arts",
      "name": {
        "en": "Martial Arts",
        "ar": "الفنون القتالية"
      },
      "isFeatured": false
    },
    {
      "id": "sport-cycling",
      "slug": "cycling",
      "name": {
        "en": "Cycling",
        "ar": "ركوب الدراجات"
      },
      "isFeatured": false
    },
    {
      "id": "sport-outdoor",
      "slug": "outdoor",
      "name": {
        "en": "Outdoor",
        "ar": "الأنشطة الخارجية"
      },
      "isFeatured": false
    },
    {
      "id": "sport-water-sports",
      "slug": "water-sports",
      "name": {
        "en": "Water Sports",
        "ar": "الرياضات المائية"
      },
      "isFeatured": false
    }
  ],
  "brands": [
    {
      "id": "brand-apex",
      "slug": "apex",
      "name": "Apex",
      "description": {
        "en": "Team sports equipment.",
        "ar": "معدات الرياضات الجماعية."
      }
    },
    {
      "id": "brand-northline",
      "slug": "northline",
      "name": "Northline",
      "description": {
        "en": "Outdoor and endurance gear.",
        "ar": "معدات الأنشطة الخارجية والتحمّل."
      }
    },
    {
      "id": "brand-corefit",
      "slug": "corefit",
      "name": "CoreFit",
      "description": {
        "en": "Strength and conditioning.",
        "ar": "القوة واللياقة."
      }
    }
  ],
  "productCategories": [
    {
      "id": "cat-equipment",
      "slug": "equipment",
      "name": {
        "en": "Equipment",
        "ar": "المعدات"
      },
      "description": {
        "en": "Balls, racquets and training hardware.",
        "ar": "كرات ومضارب وأدوات تدريب."
      },
      "parentId": null,
      "sportIds": [
        "sport-football",
        "sport-basketball",
        "sport-tennis"
      ]
    },
    {
      "id": "cat-apparel",
      "slug": "apparel",
      "name": {
        "en": "Apparel",
        "ar": "الملابس"
      },
      "description": {
        "en": "Training and match-day clothing.",
        "ar": "ملابس التدريب والمباريات."
      },
      "parentId": null,
      "sportIds": [
        "sport-football",
        "sport-running",
        "sport-fitness"
      ]
    },
    {
      "id": "cat-footwear",
      "slug": "footwear",
      "name": {
        "en": "Footwear",
        "ar": "الأحذية"
      },
      "description": {
        "en": "Court, pitch and road footwear.",
        "ar": "أحذية الملاعب والطرق."
      },
      "parentId": "cat-apparel",
      "sportIds": [
        "sport-running",
        "sport-basketball"
      ]
    },
    {
      "id": "cat-strength",
      "slug": "strength",
      "name": {
        "en": "Strength & Conditioning",
        "ar": "القوة والتأهيل"
      },
      "description": {
        "en": "Weights, bands and recovery tools.",
        "ar": "أثقال وأحزمة وأدوات استشفاء."
      },
      "parentId": null,
      "sportIds": [
        "sport-fitness",
        "sport-gym"
      ]
    }
  ],
  "products": [
    {
      "id": "prod-match-football",
      "slug": "apex-match-football",
      "title": {
        "en": "Apex Match Football",
        "ar": "كرة قدم أبكس للمباريات"
      },
      "summary": {
        "en": "FIFA-quality match ball for competitive play.",
        "ar": "كرة مباريات بمعايير الاتحاد الدولي للمنافسات."
      },
      "description": {
        "en": "A thermally bonded match ball with a textured casing for consistent flight in wet and dry conditions.",
        "ar": "كرة ملحومة حرارياً بغلاف محبّب لمسار ثابت في الأجواء الجافة والرطبة."
      },
      "brandId": "brand-apex",
      "categoryIds": [
        "cat-equipment"
      ],
      "sportIds": [
        "sport-football"
      ],
      "options": [
        {
          "key": "Size",
          "name": {
            "en": "Size",
            "ar": "المقاس"
          },
          "values": [
            "4",
            "5"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-match-football-4",
          "sku": "APX-FB-04",
          "title": "Size 4",
          "selections": {
            "Size": "4"
          },
          "price": {
            "amount": 28000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-match-football-5",
          "sku": "APX-FB-05",
          "title": "Size 5",
          "selections": {
            "Size": "5"
          },
          "price": {
            "amount": 32000,
            "currency": "JOD"
          },
          "compareAt": {
            "amount": 38000,
            "currency": "JOD"
          },
          "stockStatus": "low-stock"
        }
      ],
      "rating": {
        "average": 4.6,
        "count": 38
      },
      "publishedAt": "2026-02-11",
      "media": []
    },
    {
      "id": "prod-indoor-basketball",
      "slug": "apex-indoor-basketball",
      "title": {
        "en": "Apex Indoor Basketball",
        "ar": "كرة سلة أبكس للصالات"
      },
      "summary": {
        "en": "Composite leather ball tuned for indoor courts.",
        "ar": "كرة جلد مركّب مخصصة للملاعب المغلقة."
      },
      "description": {
        "en": "Deep-channel composite construction with a tacky finish that holds grip through long training blocks.",
        "ar": "بناء مركّب بقنوات عميقة وسطح ماسك يحافظ على القبضة خلال التدريبات الطويلة."
      },
      "brandId": "brand-apex",
      "categoryIds": [
        "cat-equipment"
      ],
      "sportIds": [
        "sport-basketball"
      ],
      "options": [
        {
          "key": "Size",
          "name": {
            "en": "Size",
            "ar": "المقاس"
          },
          "values": [
            "6",
            "7"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-indoor-basketball-6",
          "sku": "APX-BB-06",
          "title": "Size 6",
          "selections": {
            "Size": "6"
          },
          "price": {
            "amount": 34000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-indoor-basketball-7",
          "sku": "APX-BB-07",
          "title": "Size 7",
          "selections": {
            "Size": "7"
          },
          "price": {
            "amount": 36500,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        }
      ],
      "rating": {
        "average": 4.4,
        "count": 21
      },
      "publishedAt": "2026-03-02",
      "media": []
    },
    {
      "id": "prod-trail-runner",
      "slug": "northline-trail-runner",
      "title": {
        "en": "Northline Trail Runner",
        "ar": "حذاء نورث لاين للجري الجبلي"
      },
      "summary": {
        "en": "Grip-first trail shoe for mixed terrain.",
        "ar": "حذاء جري جبلي يركّز على الثبات في التضاريس المختلطة."
      },
      "description": {
        "en": "A 6 mm-drop trail shoe with a rock plate and aggressive lugs for loose and rocky ground.",
        "ar": "حذاء بفارق ارتفاع 6 مم مع صفيحة حماية ونتوءات قوية للأرض الصخرية وغير الثابتة."
      },
      "brandId": "brand-northline",
      "categoryIds": [
        "cat-footwear",
        "cat-apparel"
      ],
      "sportIds": [
        "sport-running",
        "sport-outdoor"
      ],
      "options": [
        {
          "key": "Size",
          "name": {
            "en": "Size",
            "ar": "المقاس"
          },
          "values": [
            "41",
            "42",
            "43"
          ]
        },
        {
          "key": "Colour",
          "name": {
            "en": "Colour",
            "ar": "اللون"
          },
          "values": [
            "Slate"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-trail-runner-41",
          "sku": "NL-TR-41",
          "title": "41 / Slate",
          "selections": {
            "Size": "41",
            "Colour": "Slate"
          },
          "price": {
            "amount": 89000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-trail-runner-42",
          "sku": "NL-TR-42",
          "title": "42 / Slate",
          "selections": {
            "Size": "42",
            "Colour": "Slate"
          },
          "price": {
            "amount": 89000,
            "currency": "JOD"
          },
          "stockStatus": "low-stock"
        },
        {
          "id": "var-trail-runner-43",
          "sku": "NL-TR-43",
          "title": "43 / Slate",
          "selections": {
            "Size": "43",
            "Colour": "Slate"
          },
          "price": {
            "amount": 89000,
            "currency": "JOD"
          },
          "stockStatus": "out-of-stock"
        }
      ],
      "rating": {
        "average": 4.8,
        "count": 64
      },
      "publishedAt": "2026-01-20",
      "media": []
    },
    {
      "id": "prod-adjustable-dumbbell",
      "slug": "corefit-adjustable-dumbbell",
      "title": {
        "en": "CoreFit Adjustable Dumbbell",
        "ar": "دمبل كورفت قابل للتعديل"
      },
      "summary": {
        "en": "2–24 kg dial-adjustable dumbbell, sold singly.",
        "ar": "دمبل قابل للتعديل من 2 إلى 24 كغم، يُباع بالقطعة."
      },
      "description": {
        "en": "Replaces a full rack for home training. Dial selection in 2 kg increments with a locking cradle.",
        "ar": "يغني عن رفّ أثقال كامل للتدريب المنزلي، بتدرّج 2 كغم وقاعدة تثبيت."
      },
      "brandId": "brand-corefit",
      "categoryIds": [
        "cat-strength"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-gym"
      ],
      "options": [],
      "variants": [
        {
          "id": "var-adjustable-dumbbell-default",
          "sku": "CF-AD-24",
          "title": "2–24 kg",
          "selections": {},
          "price": {
            "amount": 145000,
            "currency": "JOD"
          },
          "compareAt": {
            "amount": 169000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        }
      ],
      "rating": {
        "average": 4.5,
        "count": 52
      },
      "publishedAt": "2026-04-08",
      "media": []
    },
    {
      "id": "prod-training-tee",
      "slug": "corefit-training-tee",
      "title": {
        "en": "CoreFit Training Tee",
        "ar": "قميص تدريب كورفت"
      },
      "summary": {
        "en": "Breathable training top for gym and field sessions.",
        "ar": "قميص تدريب يسمح بالتهوية للصالة والملعب."
      },
      "description": {
        "en": "Moisture-wicking knit with flatlock seams to limit chafing during long sessions.",
        "ar": "نسيج طارد للعرق بخياطة مسطحة تقلّل الاحتكاك في التدريبات الطويلة."
      },
      "brandId": "brand-corefit",
      "categoryIds": [
        "cat-apparel"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-running",
        "sport-football"
      ],
      "options": [
        {
          "key": "Size",
          "name": {
            "en": "Size",
            "ar": "المقاس"
          },
          "values": [
            "S",
            "M",
            "L"
          ]
        },
        {
          "key": "Colour",
          "name": {
            "en": "Colour",
            "ar": "اللون"
          },
          "values": [
            "Black",
            "Sand"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-training-tee-m-black",
          "sku": "CF-TT-M-BK",
          "title": "M / Black",
          "selections": {
            "Size": "M",
            "Colour": "Black"
          },
          "price": {
            "amount": 19500,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-training-tee-l-black",
          "sku": "CF-TT-L-BK",
          "title": "L / Black",
          "selections": {
            "Size": "L",
            "Colour": "Black"
          },
          "price": {
            "amount": 19500,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-training-tee-m-sand",
          "sku": "CF-TT-M-SD",
          "title": "M / Sand",
          "selections": {
            "Size": "M",
            "Colour": "Sand"
          },
          "price": {
            "amount": 21000,
            "currency": "JOD"
          },
          "stockStatus": "pre-order"
        }
      ],
      "rating": {
        "average": 4.1,
        "count": 17
      },
      "publishedAt": "2026-05-14",
      "media": []
    },
    {
      "id": "prod-tennis-racquet",
      "slug": "apex-control-tennis-racquet",
      "title": {
        "en": "Apex Control Tennis Racquet",
        "ar": "مضرب تنس أبكس كنترول"
      },
      "summary": {
        "en": "Control-oriented frame for intermediate players.",
        "ar": "إطار يركّز على التحكم للاعبين المتوسطين."
      },
      "description": {
        "en": "A 300 g unstrung frame with a dense string pattern, favouring placement over raw power.",
        "ar": "إطار بوزن 300 غم بدون أوتار ونمط تشبيك كثيف يفضّل الدقة على القوة."
      },
      "brandId": "brand-apex",
      "categoryIds": [
        "cat-equipment"
      ],
      "sportIds": [
        "sport-tennis"
      ],
      "options": [
        {
          "key": "Grip",
          "name": {
            "en": "Grip",
            "ar": "المقبض"
          },
          "values": [
            "2",
            "3"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-tennis-racquet-g2",
          "sku": "APX-TR-G2",
          "title": "Grip 2",
          "selections": {
            "Grip": "2"
          },
          "price": {
            "amount": 112000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-tennis-racquet-g3",
          "sku": "APX-TR-G3",
          "title": "Grip 3",
          "selections": {
            "Grip": "3"
          },
          "price": {
            "amount": 112000,
            "currency": "JOD"
          },
          "stockStatus": "low-stock"
        }
      ],
      "rating": {
        "average": 4.2,
        "count": 11
      },
      "publishedAt": "2026-06-01",
      "media": []
    },
    {
      "id": "prod-swim-goggles",
      "slug": "northline-open-water-goggles",
      "title": {
        "en": "Northline Open-Water Goggles",
        "ar": "نظّارة نورثلاين للمياه المفتوحة"
      },
      "summary": {
        "en": "Wide-lens goggles for lane swimming and open water.",
        "ar": "نظّارة بعدسة واسعة للسباحة في الممرات والمياه المفتوحة."
      },
      "description": {
        "en": "An anti-fog coating on a wide curved lens, with a split strap that holds through a tumble turn.",
        "ar": "طبقة مانعة للضباب على عدسة منحنية واسعة، مع شريط مزدوج يثبت عند الدوران."
      },
      "brandId": "brand-northline",
      "categoryIds": [
        "cat-equipment"
      ],
      "sportIds": [
        "sport-swimming",
        "sport-water-sports"
      ],
      "options": [
        {
          "key": "Tint",
          "name": {
            "en": "Tint",
            "ar": "العدسة"
          },
          "values": [
            "Clear",
            "Smoke"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-goggles-clear",
          "sku": "NL-GG-CL",
          "title": "Clear",
          "selections": {
            "Tint": "Clear"
          },
          "price": {
            "amount": 19000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-goggles-smoke",
          "sku": "NL-GG-SM",
          "title": "Smoke",
          "selections": {
            "Tint": "Smoke"
          },
          "price": {
            "amount": 21000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        }
      ],
      "rating": {
        "average": 4.5,
        "count": 26
      },
      "publishedAt": "2026-07-14",
      "media": []
    },
    {
      "id": "prod-competition-barbell",
      "slug": "corefit-competition-barbell",
      "title": {
        "en": "CoreFit Competition Barbell",
        "ar": "بار كورفت للمنافسات"
      },
      "summary": {
        "en": "A 20 kg calibrated bar with needle bearings.",
        "ar": "بار معاير زنة 20 كغ بمحامل إبرية."
      },
      "description": {
        "en": "A calibrated 20 kg bar on a 28 mm shaft with needle bearings, knurled to the marks used for the clean and jerk.",
        "ar": "بار معاير زنة 20 كغ بقطر 28 مم ومحامل إبرية، محزّز بالعلامات المعتمدة لرفعة النتر والدفع."
      },
      "brandId": "brand-corefit",
      "categoryIds": [
        "cat-strength"
      ],
      "sportIds": [
        "sport-gym",
        "sport-fitness"
      ],
      "options": [],
      "variants": [
        {
          "id": "var-barbell-20",
          "sku": "CF-BB-20",
          "title": "20 kg",
          "selections": {},
          "price": {
            "amount": 285000,
            "currency": "JOD"
          },
          "stockStatus": "out-of-stock"
        }
      ],
      "rating": {
        "average": 4.9,
        "count": 14
      },
      "publishedAt": "2026-03-02",
      "media": []
    },
    {
      "id": "prod-recovery-boots",
      "slug": "corefit-recovery-boots",
      "title": {
        "en": "CoreFit Recovery Boots",
        "ar": "جزمة كورفت للاستشفاء"
      },
      "summary": {
        "en": "Compression recovery for the legs, across four pressure zones.",
        "ar": "استشفاء بالضغط للساقين عبر أربع مناطق."
      },
      "description": {
        "en": "Sequential compression from ankle to hip across four independent chambers, on a twenty-minute programme.",
        "ar": "ضغط متتابع من الكاحل إلى الورك عبر أربع حجرات مستقلة، ضمن برنامج مدته عشرون دقيقة."
      },
      "brandId": "brand-corefit",
      "categoryIds": [
        "cat-strength"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-running"
      ],
      "options": [
        {
          "key": "Size",
          "name": {
            "en": "Size",
            "ar": "المقاس"
          },
          "values": [
            "M",
            "L"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-boots-m",
          "sku": "CF-RB-M",
          "title": "M",
          "selections": {
            "Size": "M"
          },
          "price": {
            "amount": 420000,
            "currency": "JOD"
          },
          "stockStatus": "pre-order"
        },
        {
          "id": "var-boots-l",
          "sku": "CF-RB-L",
          "title": "L",
          "selections": {
            "Size": "L"
          },
          "price": {
            "amount": 420000,
            "currency": "JOD"
          },
          "stockStatus": "pre-order"
        }
      ],
      "rating": {
        "average": 0,
        "count": 0
      },
      "publishedAt": "2026-09-08",
      "media": []
    },
    {
      "id": "prod-training-shorts",
      "slug": "corefit-training-shorts",
      "title": {
        "en": "CoreFit Training Shorts",
        "ar": "شورت كورفت للتدريب"
      },
      "summary": {
        "en": "Four-way stretch shorts with a zipped pocket.",
        "ar": "شورت مطّاط بأربعة اتجاهات مع جيب بسحّاب."
      },
      "description": {
        "en": "A woven four-way stretch with a flat waistband, a zipped back pocket and a seven-inch inseam.",
        "ar": "نسيج مطّاط بأربعة اتجاهات مع حزام مستوٍ وجيب خلفي بسحّاب."
      },
      "brandId": "brand-corefit",
      "categoryIds": [
        "cat-apparel"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-gym",
        "sport-running"
      ],
      "options": [
        {
          "key": "Size",
          "name": {
            "en": "Size",
            "ar": "المقاس"
          },
          "values": [
            "S",
            "M",
            "L",
            "XL"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-shorts-s",
          "sku": "CF-SH-S",
          "title": "S",
          "selections": {
            "Size": "S"
          },
          "price": {
            "amount": 16000,
            "currency": "JOD"
          },
          "compareAt": {
            "amount": 24000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-shorts-m",
          "sku": "CF-SH-M",
          "title": "M",
          "selections": {
            "Size": "M"
          },
          "price": {
            "amount": 16000,
            "currency": "JOD"
          },
          "compareAt": {
            "amount": 24000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-shorts-l",
          "sku": "CF-SH-L",
          "title": "L",
          "selections": {
            "Size": "L"
          },
          "price": {
            "amount": 16000,
            "currency": "JOD"
          },
          "compareAt": {
            "amount": 24000,
            "currency": "JOD"
          },
          "stockStatus": "low-stock"
        },
        {
          "id": "var-shorts-xl",
          "sku": "CF-SH-XL",
          "title": "XL",
          "selections": {
            "Size": "XL"
          },
          "price": {
            "amount": 16000,
            "currency": "JOD"
          },
          "compareAt": {
            "amount": 24000,
            "currency": "JOD"
          },
          "stockStatus": "out-of-stock"
        }
      ],
      "rating": {
        "average": 4.3,
        "count": 52
      },
      "publishedAt": "2026-05-20",
      "media": []
    },
    {
      "id": "prod-club-bib-set",
      "slug": "apex-club-training-bibs",
      "title": {
        "en": "Apex Club Training Bibs",
        "ar": "صدريات تدريب أبكس للأندية"
      },
      "summary": {
        "en": "A set of ten mesh bibs in a carry bag.",
        "ar": "طقم من عشر صدريات شبكية مع حقيبة."
      },
      "description": {
        "en": "Ten numbered mesh bibs worn over a training kit, sized for senior and youth squads.",
        "ar": "عشر صدريات شبكية مرقّمة تُلبس فوق طقم التدريب، بمقاسات للفئات العمرية والفرق الأولى."
      },
      "brandId": "brand-apex",
      "categoryIds": [
        "cat-apparel",
        "cat-equipment"
      ],
      "sportIds": [
        "sport-football",
        "sport-basketball"
      ],
      "options": [
        {
          "key": "Age group",
          "name": {
            "en": "Age group",
            "ar": "الفئة"
          },
          "values": [
            "Youth",
            "Senior"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-bibs-youth",
          "sku": "APX-BIB-Y",
          "title": "Youth",
          "selections": {
            "Age group": "Youth"
          },
          "price": {
            "amount": 45000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-bibs-senior",
          "sku": "APX-BIB-S",
          "title": "Senior",
          "selections": {
            "Age group": "Senior"
          },
          "price": {
            "amount": 52000,
            "currency": "JOD"
          },
          "stockStatus": "low-stock"
        }
      ],
      "rating": {
        "average": 4.1,
        "count": 9
      },
      "publishedAt": "2026-04-18",
      "media": []
    },
    {
      "id": "prod-court-shoe",
      "slug": "apex-court-shoe",
      "title": {
        "en": "Apex Court Shoe",
        "ar": "حذاء أبكس للملاعب المغلقة"
      },
      "summary": {
        "en": "An indoor court shoe on a gum outsole.",
        "ar": "حذاء للملاعب المغلقة بنعل مطّاطي."
      },
      "description": {
        "en": "A low-profile indoor shoe on a non-marking gum outsole, with a reinforced lateral cage for cutting.",
        "ar": "حذاء منخفض للملاعب المغلقة بنعل مطّاطي لا يترك أثراً، وهيكل جانبي مقوّى للتغيير السريع."
      },
      "brandId": "brand-apex",
      "categoryIds": [
        "cat-footwear",
        "cat-apparel"
      ],
      "sportIds": [
        "sport-basketball",
        "sport-tennis"
      ],
      "options": [
        {
          "key": "Size",
          "name": {
            "en": "Size",
            "ar": "المقاس"
          },
          "values": [
            "41",
            "42",
            "43",
            "44"
          ]
        }
      ],
      "variants": [
        {
          "id": "var-court-41",
          "sku": "APX-CS-41",
          "title": "41",
          "selections": {
            "Size": "41"
          },
          "price": {
            "amount": 68000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-court-42",
          "sku": "APX-CS-42",
          "title": "42",
          "selections": {
            "Size": "42"
          },
          "price": {
            "amount": 68000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        },
        {
          "id": "var-court-43",
          "sku": "APX-CS-43",
          "title": "43",
          "selections": {
            "Size": "43"
          },
          "price": {
            "amount": 68000,
            "currency": "JOD"
          },
          "stockStatus": "out-of-stock"
        },
        {
          "id": "var-court-44",
          "sku": "APX-CS-44",
          "title": "44",
          "selections": {
            "Size": "44"
          },
          "price": {
            "amount": 68000,
            "currency": "JOD"
          },
          "stockStatus": "in-stock"
        }
      ],
      "rating": {
        "average": 4.4,
        "count": 31
      },
      "publishedAt": "2026-08-05",
      "media": []
    }
  ],
  "rentalLocations": [
    {
      "id": "loc-amman",
      "name": {
        "en": "Amman Hub",
        "ar": "مركز عمّان"
      },
      "city": {
        "en": "Amman",
        "ar": "عمّان"
      },
      "countryCode": "JO"
    },
    {
      "id": "loc-irbid",
      "name": {
        "en": "Irbid Centre",
        "ar": "مركز إربد"
      },
      "city": {
        "en": "Irbid",
        "ar": "إربد"
      },
      "countryCode": "JO"
    },
    {
      "id": "loc-aqaba",
      "name": {
        "en": "Aqaba Waterfront",
        "ar": "واجهة العقبة البحرية"
      },
      "city": {
        "en": "Aqaba",
        "ar": "العقبة"
      },
      "countryCode": "JO"
    }
  ],
  "rentalCategories": [
    {
      "id": "rcat-water",
      "slug": "water-sports",
      "name": {
        "en": "Water Sports",
        "ar": "الرياضات المائية"
      },
      "description": {
        "en": "Paddle boards, kayaks and open-water gear.",
        "ar": "ألواح تجديف وقوارب كاياك ومعدات المياه المفتوحة."
      },
      "parentId": null,
      "sportIds": [
        "sport-water-sports",
        "sport-swimming"
      ]
    },
    {
      "id": "rcat-cycling",
      "slug": "cycling",
      "name": {
        "en": "Cycling",
        "ar": "ركوب الدراجات"
      },
      "description": {
        "en": "Road, gravel and trail bikes.",
        "ar": "دراجات الطرق والحصى والمسارات الجبلية."
      },
      "parentId": null,
      "sportIds": [
        "sport-cycling"
      ]
    },
    {
      "id": "rcat-cycling-road",
      "slug": "road-and-gravel",
      "name": {
        "en": "Road & Gravel",
        "ar": "الطرق والحصى"
      },
      "description": {
        "en": "Drop-bar bikes for sealed roads and hardpack.",
        "ar": "دراجات بمقود منحنٍ للطرق المعبّدة والدروب الصلبة."
      },
      "parentId": "rcat-cycling",
      "sportIds": [
        "sport-cycling"
      ]
    },
    {
      "id": "rcat-cycling-trail",
      "slug": "mountain-and-trail",
      "name": {
        "en": "Mountain & Trail",
        "ar": "الجبال والمسارات"
      },
      "description": {
        "en": "Suspension bikes for rocky ground and descents.",
        "ar": "دراجات بمساعدات للأرض الوعرة والمنحدرات."
      },
      "parentId": "rcat-cycling",
      "sportIds": [
        "sport-cycling",
        "sport-outdoor"
      ]
    },
    {
      "id": "rcat-camping",
      "slug": "camping",
      "name": {
        "en": "Camping & Outdoor",
        "ar": "التخييم والأنشطة الخارجية"
      },
      "description": {
        "en": "Tents, packs and expedition equipment.",
        "ar": "خيام وحقائب ومعدات الرحلات."
      },
      "parentId": null,
      "sportIds": [
        "sport-outdoor"
      ]
    },
    {
      "id": "rcat-facility",
      "slug": "facilities",
      "name": {
        "en": "Facilities",
        "ar": "المرافق"
      },
      "description": {
        "en": "Courts, pitches and training halls by the hour.",
        "ar": "ملاعب وصالات تدريب بالساعة."
      },
      "parentId": null,
      "sportIds": [
        "sport-football",
        "sport-basketball",
        "sport-tennis"
      ]
    }
  ],
  "rentalItems": [
    {
      "id": "rent-paddleboard",
      "slug": "inflatable-paddleboard",
      "title": {
        "en": "Inflatable Paddleboard",
        "ar": "لوح تجديف قابل للنفخ"
      },
      "summary": {
        "en": "10'6\" all-round board with pump, paddle and leash.",
        "ar": "لوح متعدد الاستخدامات 10'6 مع منفاخ ومجداف وحبل أمان."
      },
      "categoryIds": [
        "rcat-water"
      ],
      "sportIds": [
        "sport-water-sports"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 18000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 14
        },
        {
          "unit": "week",
          "price": {
            "amount": 95000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 4
        }
      ],
      "deposit": {
        "amount": 100000,
        "currency": "JOD"
      },
      "locationId": "loc-aqaba",
      "condition": "excellent",
      "totalUnits": 6,
      "rating": {
        "average": 4.7,
        "count": 29
      },
      "publishedAt": "2026-03-26",
      "media": []
    },
    {
      "id": "rent-sea-kayak",
      "slug": "sea-kayak",
      "title": {
        "en": "Sea Kayak",
        "ar": "قارب كاياك بحري"
      },
      "summary": {
        "en": "Sit-on-top single with paddle, pump and buoyancy aid.",
        "ar": "كاياك مفتوح لشخص واحد مع مجداف ومضخة وسترة نجاة."
      },
      "categoryIds": [
        "rcat-water"
      ],
      "sportIds": [
        "sport-water-sports"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 22000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 10
        },
        {
          "unit": "week",
          "price": {
            "amount": 110000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 3
        }
      ],
      "deposit": {
        "amount": 120000,
        "currency": "JOD"
      },
      "locationId": "loc-aqaba",
      "condition": "good",
      "totalUnits": 4,
      "rating": {
        "average": 4.6,
        "count": 18
      },
      "publishedAt": "2026-06-26",
      "media": []
    },
    {
      "id": "rent-wetsuit",
      "slug": "shorty-wetsuit",
      "title": {
        "en": "Shorty Wetsuit (3/2 mm)",
        "ar": "بدلة غطس قصيرة (3/2 مم)"
      },
      "summary": {
        "en": "Warm-water shorty, sizes S to XL.",
        "ar": "بدلة قصيرة للمياه الدافئة، مقاسات S إلى XL."
      },
      "categoryIds": [
        "rcat-water"
      ],
      "sportIds": [
        "sport-water-sports",
        "sport-swimming"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 8000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 14
        },
        {
          "unit": "week",
          "price": {
            "amount": 40000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 4
        }
      ],
      "locationId": "loc-aqaba",
      "condition": "fair",
      "totalUnits": 10,
      "rating": {
        "average": 4.1,
        "count": 6
      },
      "publishedAt": "2026-08-20",
      "media": []
    },
    {
      "id": "rent-gravel-bike",
      "slug": "gravel-bike",
      "title": {
        "en": "Gravel Bike",
        "ar": "دراجة طرق وعرة"
      },
      "summary": {
        "en": "Carbon-fork gravel bike with 40 mm tyres.",
        "ar": "دراجة بشوكة كربون وإطارات 40 مم."
      },
      "categoryIds": [
        "rcat-cycling-road",
        "rcat-cycling"
      ],
      "sportIds": [
        "sport-cycling",
        "sport-outdoor"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 25000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 21
        },
        {
          "unit": "week",
          "price": {
            "amount": 130000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 6
        }
      ],
      "deposit": {
        "amount": 200000,
        "currency": "JOD"
      },
      "locationId": "loc-amman",
      "condition": "good",
      "totalUnits": 4,
      "rating": {
        "average": 4.5,
        "count": 41
      },
      "publishedAt": "2026-02-10",
      "media": []
    },
    {
      "id": "rent-road-bike",
      "slug": "endurance-road-bike",
      "title": {
        "en": "Endurance Road Bike",
        "ar": "دراجة طريق للمسافات"
      },
      "summary": {
        "en": "Long-distance geometry with a compact chainset.",
        "ar": "هندسة مريحة للمسافات الطويلة مع طقم تروس مدمج."
      },
      "categoryIds": [
        "rcat-cycling-road",
        "rcat-cycling"
      ],
      "sportIds": [
        "sport-cycling"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 28000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 21
        },
        {
          "unit": "week",
          "price": {
            "amount": 145000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 6
        }
      ],
      "deposit": {
        "amount": 220000,
        "currency": "JOD"
      },
      "locationId": "loc-amman",
      "condition": "excellent",
      "totalUnits": 3,
      "rating": {
        "average": 4.8,
        "count": 33
      },
      "publishedAt": "2026-07-28",
      "media": []
    },
    {
      "id": "rent-trail-bike",
      "slug": "trail-mountain-bike",
      "title": {
        "en": "Trail Mountain Bike",
        "ar": "دراجة جبلية للمسارات"
      },
      "summary": {
        "en": "120 mm full suspension on 29\" wheels.",
        "ar": "مساعدات كاملة 120 مم بعجلات 29 إنش."
      },
      "categoryIds": [
        "rcat-cycling-trail",
        "rcat-cycling"
      ],
      "sportIds": [
        "sport-cycling",
        "sport-outdoor"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 26000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 14
        },
        {
          "unit": "week",
          "price": {
            "amount": 135000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 4
        }
      ],
      "deposit": {
        "amount": 200000,
        "currency": "JOD"
      },
      "locationId": "loc-irbid",
      "condition": "good",
      "totalUnits": 5,
      "rating": {
        "average": 4.4,
        "count": 22
      },
      "publishedAt": "2026-06-02",
      "media": []
    },
    {
      "id": "rent-ebike-trail",
      "slug": "electric-trail-bike",
      "title": {
        "en": "Electric Trail Bike",
        "ar": "دراجة كهربائية للمسارات"
      },
      "summary": {
        "en": "Mid-drive e-bike with a spare battery.",
        "ar": "دراجة كهربائية بمحرّك أوسط مع بطارية احتياطية."
      },
      "categoryIds": [
        "rcat-cycling-trail",
        "rcat-cycling"
      ],
      "sportIds": [
        "sport-cycling",
        "sport-outdoor"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 45000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 7
        },
        {
          "unit": "week",
          "price": {
            "amount": 240000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 2
        }
      ],
      "deposit": {
        "amount": 350000,
        "currency": "JOD"
      },
      "locationId": "loc-amman",
      "condition": "new",
      "totalUnits": 2,
      "rating": {
        "average": 4.9,
        "count": 11
      },
      "publishedAt": "2026-09-13",
      "media": []
    },
    {
      "id": "rent-expedition-tent",
      "slug": "expedition-tent-3p",
      "title": {
        "en": "Expedition Tent (3 person)",
        "ar": "خيمة رحلات (3 أشخاص)"
      },
      "summary": {
        "en": "Four-season tent rated for exposed camps.",
        "ar": "خيمة لأربعة فصول مناسبة للمخيمات المكشوفة."
      },
      "categoryIds": [
        "rcat-camping"
      ],
      "sportIds": [
        "sport-outdoor"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 15000,
            "currency": "JOD"
          },
          "minUnits": 2,
          "maxUnits": 30
        }
      ],
      "deposit": {
        "amount": 80000,
        "currency": "JOD"
      },
      "locationId": "loc-amman",
      "condition": "good",
      "totalUnits": 3,
      "rating": {
        "average": 4.3,
        "count": 12
      },
      "publishedAt": "2026-01-17",
      "media": []
    },
    {
      "id": "rent-trekking-pack",
      "slug": "trekking-pack-65l",
      "title": {
        "en": "Trekking Pack (65 L)",
        "ar": "حقيبة رحلات (65 لتر)"
      },
      "summary": {
        "en": "Adjustable-back pack with a rain cover.",
        "ar": "حقيبة بظهر قابل للتعديل مع غطاء مطر."
      },
      "categoryIds": [
        "rcat-camping"
      ],
      "sportIds": [
        "sport-outdoor",
        "sport-running"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 7000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 21
        },
        {
          "unit": "week",
          "price": {
            "amount": 35000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 4
        }
      ],
      "locationId": "loc-irbid",
      "condition": "fair",
      "totalUnits": 8,
      "rating": {
        "average": 4,
        "count": 9
      },
      "publishedAt": "2026-07-18",
      "media": []
    },
    {
      "id": "rent-camp-stove",
      "slug": "expedition-stove-set",
      "title": {
        "en": "Expedition Stove Set",
        "ar": "طقم موقد رحلات"
      },
      "summary": {
        "en": "Windproof burner, pot set and a gas adaptor.",
        "ar": "موقد مقاوم للرياح مع طقم قدور ووصلة غاز."
      },
      "categoryIds": [
        "rcat-camping"
      ],
      "sportIds": [
        "sport-outdoor"
      ],
      "rates": [
        {
          "unit": "day",
          "price": {
            "amount": 5000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 21
        }
      ],
      "deposit": {
        "amount": 25000,
        "currency": "JOD"
      },
      "locationId": "loc-amman",
      "condition": "new",
      "totalUnits": 12,
      "rating": {
        "average": 0,
        "count": 0
      },
      "publishedAt": "2026-09-21",
      "media": []
    },
    {
      "id": "rent-indoor-court",
      "slug": "indoor-basketball-court",
      "title": {
        "en": "Indoor Basketball Court",
        "ar": "ملعب كرة سلة مغلق"
      },
      "summary": {
        "en": "Full-size indoor court, booked by the hour.",
        "ar": "ملعب مغلق بحجم كامل، يُحجز بالساعة."
      },
      "categoryIds": [
        "rcat-facility"
      ],
      "sportIds": [
        "sport-basketball"
      ],
      "rates": [
        {
          "unit": "hour",
          "price": {
            "amount": 30000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 8
        }
      ],
      "locationId": "loc-amman",
      "condition": "excellent",
      "totalUnits": 2,
      "rating": {
        "average": 4.8,
        "count": 57
      },
      "publishedAt": "2026-05-01",
      "media": []
    },
    {
      "id": "rent-five-a-side",
      "slug": "five-a-side-pitch",
      "title": {
        "en": "Five-a-side Pitch",
        "ar": "ملعب خماسي"
      },
      "summary": {
        "en": "Floodlit artificial pitch with covered benches.",
        "ar": "ملعب صناعي مضاء مع مقاعد مظلّلة."
      },
      "categoryIds": [
        "rcat-facility"
      ],
      "sportIds": [
        "sport-football"
      ],
      "rates": [
        {
          "unit": "hour",
          "price": {
            "amount": 22000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 6
        }
      ],
      "locationId": "loc-irbid",
      "condition": "good",
      "totalUnits": 3,
      "rating": {
        "average": 4.6,
        "count": 34
      },
      "publishedAt": "2026-07-09",
      "media": []
    },
    {
      "id": "rent-training-hall",
      "slug": "training-hall",
      "title": {
        "en": "Training Hall",
        "ar": "صالة تدريب"
      },
      "summary": {
        "en": "Matted hall for classes and martial arts.",
        "ar": "صالة مفروشة بالحصائر للحصص وفنون القتال."
      },
      "categoryIds": [
        "rcat-facility"
      ],
      "sportIds": [
        "sport-martial-arts",
        "sport-fitness"
      ],
      "rates": [
        {
          "unit": "hour",
          "price": {
            "amount": 18000,
            "currency": "JOD"
          },
          "minUnits": 1,
          "maxUnits": 5
        }
      ],
      "locationId": "loc-amman",
      "condition": "good",
      "totalUnits": 1,
      "rating": {
        "average": 4.2,
        "count": 5
      },
      "publishedAt": "2026-08-31",
      "media": []
    }
  ],
  "specialisations": [
    {
      "id": "spec-strength",
      "name": {
        "en": "Strength & conditioning",
        "ar": "القوة واللياقة"
      }
    },
    {
      "id": "spec-hypertrophy",
      "name": {
        "en": "Muscle building",
        "ar": "بناء العضلات"
      }
    },
    {
      "id": "spec-powerlifting",
      "name": {
        "en": "Powerlifting",
        "ar": "رفع الأثقال"
      }
    },
    {
      "id": "spec-endurance",
      "name": {
        "en": "Endurance",
        "ar": "التحمّل"
      }
    },
    {
      "id": "spec-rehab",
      "name": {
        "en": "Rehabilitation",
        "ar": "إعادة التأهيل"
      }
    },
    {
      "id": "spec-mobility",
      "name": {
        "en": "Mobility",
        "ar": "المرونة والحركة"
      }
    },
    {
      "id": "spec-technique",
      "name": {
        "en": "Technique",
        "ar": "التكنيك"
      }
    },
    {
      "id": "spec-youth",
      "name": {
        "en": "Youth coaching",
        "ar": "تدريب الناشئين"
      }
    },
    {
      "id": "spec-beginner",
      "name": {
        "en": "Beginners",
        "ar": "المبتدئون"
      }
    },
    {
      "id": "spec-nutrition",
      "name": {
        "en": "Nutrition",
        "ar": "التغذية"
      }
    }
  ],
  "coaches": [
    {
      "id": "coach-layla",
      "slug": "layla-haddad",
      "name": {
        "en": "Layla Haddad",
        "ar": "ليلى حداد"
      },
      "headline": {
        "en": "Strength & conditioning for field sports",
        "ar": "القوة واللياقة لرياضات الملاعب"
      },
      "sportIds": [
        "sport-football",
        "sport-fitness"
      ],
      "specializations": [
        "spec-strength",
        "spec-rehab"
      ],
      "certifications": [
        {
          "id": "cert-layla-1",
          "name": "Certified Strength and Conditioning Specialist",
          "issuedBy": "NSCA",
          "issuedAt": "2021-06-01"
        },
        {
          "id": "cert-layla-2",
          "name": "Sports First Aid",
          "issuedBy": "Jordan Red Crescent",
          "issuedAt": "2024-02-10"
        }
      ],
      "yearsOfExperience": 9,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-amman",
        "name": {
          "en": "Amman Hub",
          "ar": "مركز عمّان"
        },
        "city": {
          "en": "Amman",
          "ar": "عمّان"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": true,
      "sessionRate": {
        "amount": 35000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 60,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 35000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 60,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 224000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 280000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-online",
          "name": {
            "en": "Online review",
            "ar": "مراجعة عن بُعد"
          },
          "durationMinutes": 45,
          "sessionCount": 1,
          "mode": "online",
          "price": {
            "amount": 20000,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 640,
      "responseTimeHours": 2,
      "rating": {
        "average": 4.9,
        "count": 47
      },
      "publishedAt": "2026-01-15",
      "avatar": {
        "kind": "image",
        "id": "img-coach-layla",
        "url": "/images/coaches/coach-layla.jpg",
        "alt": "Layla Haddad coaching a session",
        "width": 700,
        "height": 600
      },
      "gallery": []
    },
    {
      "id": "coach-omar",
      "slug": "omar-nasser",
      "name": {
        "en": "Omar Nasser",
        "ar": "عمر ناصر"
      },
      "headline": {
        "en": "Basketball skills and shooting mechanics",
        "ar": "مهارات كرة السلة وميكانيكا التصويب"
      },
      "sportIds": [
        "sport-basketball"
      ],
      "specializations": [
        "spec-technique",
        "spec-youth"
      ],
      "certifications": [
        {
          "id": "cert-omar-1",
          "name": "Level 2 Basketball Coach",
          "issuedBy": "FIBA",
          "issuedAt": "2020-09-12"
        }
      ],
      "yearsOfExperience": 6,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-amman",
        "name": {
          "en": "Amman Hub",
          "ar": "مركز عمّان"
        },
        "city": {
          "en": "Amman",
          "ar": "عمّان"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": false,
      "sessionRate": {
        "amount": 28000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 75,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 28000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 75,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 179000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 223752,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 310,
      "responseTimeHours": 6,
      "rating": {
        "average": 4.6,
        "count": 23
      },
      "publishedAt": "2026-02-20",
      "avatar": {
        "kind": "image",
        "id": "img-coach-omar",
        "url": "/images/coaches/coach-omar.jpg",
        "alt": "Omar Nasser coaching a session",
        "width": 500,
        "height": 350
      },
      "gallery": []
    },
    {
      "id": "coach-rania",
      "slug": "rania-suleiman",
      "name": {
        "en": "Rania Suleiman",
        "ar": "رانيا سليمان"
      },
      "headline": {
        "en": "Endurance running and race preparation",
        "ar": "جري التحمّل والتحضير للسباقات"
      },
      "sportIds": [
        "sport-running",
        "sport-outdoor"
      ],
      "specializations": [
        "spec-endurance",
        "spec-technique"
      ],
      "certifications": [
        {
          "id": "cert-rania-1",
          "name": "Endurance Coach Level 3",
          "issuedBy": "World Athletics",
          "issuedAt": "2019-03-05"
        }
      ],
      "yearsOfExperience": 12,
      "languages": [
        "ar",
        "en",
        "fr"
      ],
      "location": {
        "id": "loc-irbid",
        "name": {
          "en": "Irbid Centre",
          "ar": "مركز إربد"
        },
        "city": {
          "en": "Irbid",
          "ar": "إربد"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": true,
      "sessionRate": {
        "amount": 30000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-online",
          "name": {
            "en": "Online review",
            "ar": "مراجعة عن بُعد"
          },
          "durationMinutes": 50,
          "sessionCount": 1,
          "mode": "online",
          "price": {
            "amount": 18000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 60,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 30000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 60,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 192000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 240000,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 980,
      "responseTimeHours": 3,
      "rating": {
        "average": 4.8,
        "count": 61
      },
      "publishedAt": "2026-03-30",
      "avatar": {
        "kind": "image",
        "id": "img-coach-rania",
        "url": "/images/coaches/coach-rania.jpg",
        "alt": "Rania Suleiman coaching a session",
        "width": 435,
        "height": 465
      },
      "gallery": []
    },
    {
      "id": "coach-karim",
      "slug": "karim-dabbas",
      "name": {
        "en": "Karim Dabbas",
        "ar": "كريم دبّاس"
      },
      "headline": {
        "en": "Powerlifting and barbell technique",
        "ar": "رفع الأثقال وتكنيك البار"
      },
      "sportIds": [
        "sport-gym",
        "sport-fitness"
      ],
      "specializations": [
        "spec-powerlifting",
        "spec-technique"
      ],
      "certifications": [
        {
          "id": "cert-karim-1",
          "name": "International Powerlifting Coach",
          "issuedBy": "IPF",
          "issuedAt": "2022-04-18"
        }
      ],
      "yearsOfExperience": 8,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-amman",
        "name": {
          "en": "Amman Hub",
          "ar": "مركز عمّان"
        },
        "city": {
          "en": "Amman",
          "ar": "عمّان"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": true,
      "sessionRate": {
        "amount": 32000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 60,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 32000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 60,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 205000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 256248,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-online",
          "name": {
            "en": "Online review",
            "ar": "مراجعة عن بُعد"
          },
          "durationMinutes": 45,
          "sessionCount": 1,
          "mode": "online",
          "price": {
            "amount": 19000,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 520,
      "responseTimeHours": 1,
      "rating": {
        "average": 4.9,
        "count": 38
      },
      "publishedAt": "2026-04-02",
      "avatar": {
        "kind": "image",
        "id": "img-coach-karim",
        "url": "/images/coaches/coach-karim.jpg",
        "alt": "Karim Dabbas at the gym",
        "width": 950,
        "height": 700
      },
      "gallery": []
    },
    {
      "id": "coach-noor",
      "slug": "noor-abu-ghazaleh",
      "name": {
        "en": "Noor Abu Ghazaleh",
        "ar": "نور أبو غزالة"
      },
      "headline": {
        "en": "Postnatal training and safe return to lifting",
        "ar": "تدريب ما بعد الولادة والعودة الآمنة للرفع"
      },
      "sportIds": [
        "sport-fitness",
        "sport-gym"
      ],
      "specializations": [
        "spec-rehab",
        "spec-mobility"
      ],
      "certifications": [
        {
          "id": "cert-noor-1",
          "name": "Pre & Postnatal Coaching Certification",
          "issuedBy": "GGS",
          "issuedAt": "2023-01-22"
        },
        {
          "id": "cert-noor-2",
          "name": "Corrective Exercise Specialist",
          "issuedBy": "NASM",
          "issuedAt": "2021-11-04"
        }
      ],
      "yearsOfExperience": 7,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-amman",
        "name": {
          "en": "Amman Hub",
          "ar": "مركز عمّان"
        },
        "city": {
          "en": "Amman",
          "ar": "عمّان"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": true,
      "sessionRate": {
        "amount": 30000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 60,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 30000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 60,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 192000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 240000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-online",
          "name": {
            "en": "Online review",
            "ar": "مراجعة عن بُعد"
          },
          "durationMinutes": 45,
          "sessionCount": 1,
          "mode": "online",
          "price": {
            "amount": 17000,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 415,
      "responseTimeHours": 4,
      "rating": {
        "average": 5,
        "count": 29
      },
      "publishedAt": "2026-04-28",
      "avatar": {
        "kind": "image",
        "id": "img-coach-noor",
        "url": "/images/coaches/coach-noor.jpg",
        "alt": "Noor Abu Ghazaleh training",
        "width": 500,
        "height": 350
      },
      "gallery": []
    },
    {
      "id": "coach-tareq",
      "slug": "tareq-al-masri",
      "name": {
        "en": "Tareq Al-Masri",
        "ar": "طارق المصري"
      },
      "headline": {
        "en": "Boxing and combat conditioning",
        "ar": "الملاكمة ولياقة رياضات القتال"
      },
      "sportIds": [
        "sport-martial-arts",
        "sport-fitness"
      ],
      "specializations": [
        "spec-strength",
        "spec-beginner"
      ],
      "certifications": [
        {
          "id": "cert-tareq-1",
          "name": "Amateur Boxing Coach Level 2",
          "issuedBy": "AIBA",
          "issuedAt": "2021-07-30"
        }
      ],
      "yearsOfExperience": 11,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-zarqa",
        "name": {
          "en": "Zarqa Club",
          "ar": "نادي الزرقاء"
        },
        "city": {
          "en": "Zarqa",
          "ar": "الزرقاء"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": false,
      "sessionRate": {
        "amount": 25000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 60,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 25000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 60,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 160000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 200000,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 720,
      "responseTimeHours": 8,
      "rating": {
        "average": 4.7,
        "count": 34
      },
      "publishedAt": "2026-05-11",
      "avatar": {
        "kind": "image",
        "id": "img-coach-tareq",
        "url": "/images/coaches/coach-tareq.jpg",
        "alt": "Tareq Al-Masri coaching",
        "width": 500,
        "height": 300
      },
      "gallery": []
    },
    {
      "id": "coach-dina",
      "slug": "dina-khoury",
      "name": {
        "en": "Dina Khoury",
        "ar": "دينا خوري"
      },
      "headline": {
        "en": "Mobility, flexibility and desk-job backs",
        "ar": "المرونة والحركة وآلام الظهر لأصحاب المكاتب"
      },
      "sportIds": [
        "sport-fitness"
      ],
      "specializations": [
        "spec-mobility",
        "spec-rehab"
      ],
      "certifications": [
        {
          "id": "cert-dina-1",
          "name": "Functional Range Conditioning",
          "issuedBy": "FRC",
          "issuedAt": "2022-09-15"
        }
      ],
      "yearsOfExperience": 5,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-amman",
        "name": {
          "en": "Amman Hub",
          "ar": "مركز عمّان"
        },
        "city": {
          "en": "Amman",
          "ar": "عمّان"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": true,
      "sessionRate": {
        "amount": 22000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-online",
          "name": {
            "en": "Online review",
            "ar": "مراجعة عن بُعد"
          },
          "durationMinutes": 40,
          "sessionCount": 1,
          "mode": "online",
          "price": {
            "amount": 14000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 45,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 22000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 45,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 141000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 176248,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 290,
      "responseTimeHours": 2,
      "rating": {
        "average": 4.8,
        "count": 52
      },
      "publishedAt": "2026-05-26",
      "avatar": {
        "kind": "image",
        "id": "img-coach-dina",
        "url": "/images/coaches/coach-dina.jpg",
        "alt": "Dina Khoury leading a mobility session",
        "width": 500,
        "height": 430
      },
      "gallery": []
    },
    {
      "id": "coach-yousef",
      "slug": "yousef-barakat",
      "name": {
        "en": "Yousef Barakat",
        "ar": "يوسف بركات"
      },
      "headline": {
        "en": "Hypertrophy and body-composition coaching",
        "ar": "تضخيم العضلات وإعادة تكوين الجسم"
      },
      "sportIds": [
        "sport-gym",
        "sport-fitness"
      ],
      "specializations": [
        "spec-hypertrophy",
        "spec-nutrition"
      ],
      "certifications": [
        {
          "id": "cert-yousef-1",
          "name": "Certified Personal Trainer",
          "issuedBy": "ACE",
          "issuedAt": "2020-03-08"
        },
        {
          "id": "cert-yousef-2",
          "name": "Precision Nutrition Level 1",
          "issuedBy": "PN",
          "issuedAt": "2023-06-19"
        }
      ],
      "yearsOfExperience": 10,
      "languages": [
        "ar",
        "en",
        "tr"
      ],
      "location": {
        "id": "loc-amman",
        "name": {
          "en": "Amman Hub",
          "ar": "مركز عمّان"
        },
        "city": {
          "en": "Amman",
          "ar": "عمّان"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": true,
      "sessionRate": {
        "amount": 33000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 60,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 33000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 60,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 211000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 263752,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-online",
          "name": {
            "en": "Online review",
            "ar": "مراجعة عن بُعد"
          },
          "durationMinutes": 50,
          "sessionCount": 1,
          "mode": "online",
          "price": {
            "amount": 21000,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 860,
      "responseTimeHours": 3,
      "rating": {
        "average": 4.7,
        "count": 71
      },
      "publishedAt": "2026-06-08",
      "avatar": {
        "kind": "image",
        "id": "img-coach-yousef",
        "url": "/images/coaches/coach-yousef.jpg",
        "alt": "Yousef Barakat at the gym",
        "width": 950,
        "height": 700
      },
      "gallery": []
    },
    {
      "id": "coach-hala",
      "slug": "hala-zoubi",
      "name": {
        "en": "Hala Zoubi",
        "ar": "هالة الزعبي"
      },
      "headline": {
        "en": "Swimming technique for adults who never learned",
        "ar": "تقنية السباحة للكبار الذين لم يتعلّموها"
      },
      "sportIds": [
        "sport-swimming",
        "sport-water-sports"
      ],
      "specializations": [
        "spec-technique",
        "spec-beginner"
      ],
      "certifications": [
        {
          "id": "cert-hala-1",
          "name": "Swimming Teacher Level 2",
          "issuedBy": "Swim England",
          "issuedAt": "2022-02-14"
        }
      ],
      "yearsOfExperience": 6,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-irbid",
        "name": {
          "en": "Irbid Centre",
          "ar": "مركز إربد"
        },
        "city": {
          "en": "Irbid",
          "ar": "إربد"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": false,
      "sessionRate": {
        "amount": 27000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 45,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 27000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 45,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 173000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 216248,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 380,
      "responseTimeHours": 12,
      "rating": {
        "average": 4.9,
        "count": 44
      },
      "publishedAt": "2026-06-21",
      "avatar": {
        "kind": "image",
        "id": "img-coach-hala",
        "url": "/images/coaches/coach-hala.jpg",
        "alt": "Hala Zoubi coaching",
        "width": 500,
        "height": 350
      },
      "gallery": []
    },
    {
      "id": "coach-sami",
      "slug": "sami-tarawneh",
      "name": {
        "en": "Sami Tarawneh",
        "ar": "سامي الطراونة"
      },
      "headline": {
        "en": "Cycling power and long-ride pacing",
        "ar": "قوة الدرّاجة وتوزيع الجهد في الرحلات الطويلة"
      },
      "sportIds": [
        "sport-cycling",
        "sport-outdoor"
      ],
      "specializations": [
        "spec-endurance",
        "spec-strength"
      ],
      "certifications": [
        {
          "id": "cert-sami-1",
          "name": "Cycling Coach Level 2",
          "issuedBy": "UCI",
          "issuedAt": "2021-05-09"
        }
      ],
      "yearsOfExperience": 14,
      "languages": [
        "ar",
        "en"
      ],
      "location": {
        "id": "loc-aqaba",
        "name": {
          "en": "Aqaba Marina",
          "ar": "مرسى العقبة"
        },
        "city": {
          "en": "Aqaba",
          "ar": "العقبة"
        },
        "countryCode": "JO"
      },
      "isRemoteAvailable": true,
      "sessionRate": {
        "amount": 29000,
        "currency": "JOD"
      },
      "packages": [
        {
          "id": "pkg-online",
          "name": {
            "en": "Online review",
            "ar": "مراجعة عن بُعد"
          },
          "durationMinutes": 45,
          "sessionCount": 1,
          "mode": "online",
          "price": {
            "amount": 16000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-single",
          "name": {
            "en": "Single session",
            "ar": "جلسة واحدة"
          },
          "durationMinutes": 90,
          "sessionCount": 1,
          "mode": "in-person",
          "price": {
            "amount": 29000,
            "currency": "JOD"
          }
        },
        {
          "id": "pkg-block",
          "name": {
            "en": "Block of 8 sessions",
            "ar": "باقة 8 جلسات"
          },
          "durationMinutes": 90,
          "sessionCount": 8,
          "mode": "in-person",
          "price": {
            "amount": 186000,
            "currency": "JOD"
          },
          "compareAtPrice": {
            "amount": 232504,
            "currency": "JOD"
          }
        }
      ],
      "completedSessions": 540,
      "responseTimeHours": 5,
      "rating": {
        "average": 4.6,
        "count": 27
      },
      "publishedAt": "2026-07-03",
      "avatar": {
        "kind": "image",
        "id": "img-coach-sami",
        "url": "/images/coaches/coach-sami.jpg",
        "alt": "Sami Tarawneh coaching",
        "width": 500,
        "height": 300
      },
      "gallery": []
    }
  ],
  "courseCategories": [
    {
      "id": "ccat-certifications",
      "slug": "certifications",
      "name": {
        "en": "NCSF certifications",
        "ar": "الاعتمادات الدولية"
      },
      "description": {
        "en": "The council's international professional certifications, delivered in Jordan by JoFit.",
        "ar": "اعتمادات المجلس المهنية الدولية، تقدّمها جوفِت في الأردن."
      },
      "parentId": null,
      "sportIds": []
    },
    {
      "id": "ccat-specialised",
      "slug": "specialised",
      "name": {
        "en": "Specialised courses",
        "ar": "الدورات التخصصية"
      },
      "description": {
        "en": "Focused qualifications that sit alongside the certifications.",
        "ar": "مؤهلات متخصصة تسير جنبًا إلى جنب مع الاعتمادات الدولية."
      },
      "parentId": null,
      "sportIds": []
    },
    {
      "id": "ccat-cpd",
      "slug": "cpd",
      "name": {
        "en": "CPD workshops",
        "ar": "ورش التطوير المهني"
      },
      "description": {
        "en": "Short workshops carrying continuing education units, for professionals already qualified.",
        "ar": "ورش قصيرة تمنح وحدات تعليم مستمر لمن يحمل مؤهّلًا بالفعل."
      },
      "parentId": null,
      "sportIds": []
    }
  ],
  "courses": [
    {
      "id": "course-ncsf-cpt",
      "slug": "certified-personal-trainer",
      "title": {
        "en": "Certified Personal Trainer (NCSF-CPT)",
        "ar": "المدرب الشخصي المعتمد"
      },
      "summary": {
        "en": "A complete programme that brings together exercise science, assessment, programme design and hands-on practice, to qualify you to work in personal training.",
        "ar": "برنامج متكامل يجمع بين علوم التدريب، التقييم، تصميم البرامج، والتطبيق العملي لتأهيلك للعمل في مجال التدريب الشخصي."
      },
      "categoryIds": [
        "ccat-certifications"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-gym"
      ],
      "format": "hybrid",
      "level": "beginner",
      "durationHours": 120,
      "price": {
        "amount": 650000,
        "currency": "JOD"
      },
      "compareAt": {
        "amount": 790000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-layla",
        "coach-karim"
      ],
      "moduleCount": 4,
      "certification": {
        "name": {
          "en": "NCSF Certified Personal Trainer",
          "ar": "شهادة المدرب الشخصي المعتمد من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar",
        "en"
      ],
      "venue": {
        "en": "JoFit Academy, Amman",
        "ar": "أكاديمية جوفِت، عمّان"
      },
      "intake": {
        "startsInDays": 14,
        "seatsTotal": 16
      },
      "rating": {
        "average": 4.8,
        "count": 64
      },
      "status": "published",
      "publishedDaysAgo": 420,
      "media": [
        {
          "kind": "image",
          "id": "img-course-personal-trainer-1",
          "url": "/images/courses/personal-trainer-1.jpg",
          "alt": "",
          "width": 736,
          "height": 736
        },
        {
          "kind": "image",
          "id": "img-course-personal-trainer-2",
          "url": "/images/courses/personal-trainer-2.jpg",
          "alt": "",
          "width": 736,
          "height": 736
        }
      ]
    },
    {
      "id": "course-ncsf-strength-conditioning",
      "slug": "strength-and-conditioning-specialist",
      "title": {
        "en": "Strength & Conditioning",
        "ar": "القوة والإعداد البدني"
      },
      "summary": {
        "en": "A programme focused on developing the components of physical performance, such as strength, speed, endurance and power, and on building training programmes around the athlete's goals.",
        "ar": "برنامج يركّز على تطوير عناصر الأداء البدني، مثل القوة والسرعة والتحمل والقدرة، وبناء برامج تدريبية وفق أهداف الرياضي."
      },
      "categoryIds": [
        "ccat-certifications"
      ],
      "sportIds": [
        "sport-football",
        "sport-basketball",
        "sport-gym"
      ],
      "format": "in-person",
      "level": "advanced",
      "durationHours": 90,
      "price": {
        "amount": 720000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-omar",
        "coach-tareq"
      ],
      "moduleCount": 4,
      "certification": {
        "name": {
          "en": "NCSF Strength & Conditioning Specialist",
          "ar": "شهادة أخصائي الإعداد البدني من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar",
        "en"
      ],
      "venue": {
        "en": "JoFit Academy, Amman",
        "ar": "أكاديمية جوفِت، عمّان"
      },
      "intake": {
        "startsInDays": 38,
        "seatsTotal": 14
      },
      "rating": {
        "average": 4.9,
        "count": 38
      },
      "status": "published",
      "publishedDaysAgo": 310,
      "media": [
        {
          "kind": "image",
          "id": "img-course-strength-conditioning-1",
          "url": "/images/courses/strength-conditioning-1.jpg",
          "alt": "",
          "width": 736,
          "height": 736
        }
      ]
    },
    {
      "id": "course-ncsf-sports-nutrition",
      "slug": "sports-nutrition-specialist",
      "title": {
        "en": "Sports Nutrition",
        "ar": "التغذية الرياضية"
      },
      "summary": {
        "en": "A programme that connects nutrition with athletic performance and body composition, and gives you a practical foundation for understanding your clients' needs and supporting their goals.",
        "ar": "برنامج يربط بين التغذية والأداء الرياضي وتكوين الجسم، ويمنحك أساسًا عمليًا لفهم احتياجات المتدربين ودعم أهدافهم."
      },
      "categoryIds": [
        "ccat-certifications"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-running",
        "sport-gym"
      ],
      "format": "online",
      "level": "intermediate",
      "durationHours": 60,
      "price": {
        "amount": 480000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-noor"
      ],
      "moduleCount": 4,
      "certification": {
        "name": {
          "en": "NCSF Sports Nutrition Specialist",
          "ar": "شهادة أخصائي التغذية الرياضية من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar",
        "en"
      ],
      "intake": {
        "startsInDays": 7,
        "seatsTotal": 12
      },
      "rating": {
        "average": 4.7,
        "count": 45
      },
      "status": "published",
      "publishedDaysAgo": 240,
      "media": [
        {
          "kind": "image",
          "id": "img-course-sports-nutrition-1",
          "url": "/images/courses/sports-nutrition-1.jpg",
          "alt": "",
          "width": 736,
          "height": 676
        },
        {
          "kind": "image",
          "id": "img-course-sports-nutrition-2",
          "url": "/images/courses/sports-nutrition-2.jpg",
          "alt": "",
          "width": 736,
          "height": 736
        }
      ]
    },
    {
      "id": "course-injury-rehabilitation",
      "slug": "sports-injury-prevention-and-rehabilitation",
      "title": {
        "en": "Sports Injuries",
        "ar": "الإصابات الرياضية"
      },
      "summary": {
        "en": "Specialised training in understanding sports injuries: how they happen, how to deal with them, and the principles of rehabilitation and returning to training.",
        "ar": "تدريب متخصص لفهم الإصابات الرياضية، آليات حدوثها، طرق التعامل معها، ومبادئ التأهيل والعودة إلى التدريب."
      },
      "categoryIds": [
        "ccat-specialised"
      ],
      "sportIds": [
        "sport-football",
        "sport-basketball",
        "sport-martial-arts"
      ],
      "format": "in-person",
      "level": "advanced",
      "durationHours": 72,
      "price": {
        "amount": 560000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-rania",
        "coach-hala"
      ],
      "moduleCount": 4,
      "certification": {
        "name": {
          "en": "NCSF Sports Injury Prevention & Rehabilitation",
          "ar": "شهادة الوقاية وإعادة التأهيل من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar",
        "en"
      ],
      "venue": {
        "en": "JoFit Academy, Amman",
        "ar": "أكاديمية جوفِت، عمّان"
      },
      "intake": {
        "startsInDays": 19,
        "seatsTotal": 16
      },
      "rating": {
        "average": 4.8,
        "count": 27
      },
      "status": "published",
      "publishedDaysAgo": 180,
      "media": [
        {
          "kind": "image",
          "id": "img-course-sports-injuries-1",
          "url": "/images/courses/sports-injuries-1.jpg",
          "alt": "",
          "width": 735,
          "height": 490
        },
        {
          "kind": "image",
          "id": "img-course-sports-injuries-2",
          "url": "/images/courses/sports-injuries-2.jpg",
          "alt": "",
          "width": 736,
          "height": 414
        }
      ]
    },
    {
      "id": "course-pilates-instructor",
      "slug": "professional-pilates-instructor",
      "title": {
        "en": "Reformer Pilates",
        "ar": "بيلاتس ريفورمر"
      },
      "summary": {
        "en": "A programme that combines knowledge with hands-on practice to develop your skills on the Reformer, and your understanding of movement, alignment, posture and the core.",
        "ar": "برنامج يجمع بين المعرفة والتطبيق العملي لتطوير مهارات استخدام الـReformer، وفهم الحركة، الـAlignment، الـPosture، والـCore."
      },
      "categoryIds": [
        "ccat-specialised"
      ],
      "sportIds": [
        "sport-fitness"
      ],
      "format": "in-person",
      "level": "intermediate",
      "durationHours": 80,
      "price": {
        "amount": 540000,
        "currency": "JOD"
      },
      "compareAt": {
        "amount": 600000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-dina"
      ],
      "moduleCount": 4,
      "certification": {
        "name": {
          "en": "NCSF Professional Pilates Instructor",
          "ar": "شهادة مدرّب البيلاتس المحترف من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar",
        "en"
      ],
      "venue": {
        "en": "JoFit Academy studio, Amman",
        "ar": "استوديو أكاديمية جوفِت، عمّان"
      },
      "intake": {
        "startsInDays": 22,
        "seatsTotal": 12
      },
      "rating": {
        "average": 4.6,
        "count": 31
      },
      "status": "published",
      "publishedDaysAgo": 150,
      "media": [
        {
          "kind": "image",
          "id": "img-course-reformer-pilates-1",
          "url": "/images/courses/reformer-pilates-1.jpg",
          "alt": "",
          "width": 736,
          "height": 851
        },
        {
          "kind": "image",
          "id": "img-course-reformer-pilates-2",
          "url": "/images/courses/reformer-pilates-2.jpg",
          "alt": "",
          "width": 736,
          "height": 736
        },
        {
          "kind": "image",
          "id": "img-course-reformer-pilates-3",
          "url": "/images/courses/reformer-pilates-3.jpg",
          "alt": "",
          "width": 736,
          "height": 736
        }
      ]
    },
    {
      "id": "course-olympic-weightlifting",
      "slug": "olympic-weightlifting",
      "title": {
        "en": "Olympic Weightlifting",
        "ar": "رفع الأثقال الأولمبية"
      },
      "summary": {
        "en": "A practical training programme focused on correct technique, developing strength and power, and mastering the snatch and the clean and jerk, with applications that help improve performance and build a strong foundation in Olympic weightlifting.",
        "ar": "برنامج تدريبي عملي يركز على التكنيك الصحيح، تطوير القوة والقدرة، وإتقان حركتي الخطف والكلين آند جيرك، مع تطبيقات تساعد على تحسين الأداء وبناء أساس قوي في رياضة رفع الأثقال الأولمبية."
      },
      "categoryIds": [
        "ccat-specialised"
      ],
      "sportIds": [
        "sport-gym",
        "sport-fitness"
      ],
      "format": "in-person",
      "level": "intermediate",
      "durationHours": 40,
      "price": {
        "amount": 450000,
        "currency": "JOD"
      },
      "instructorIds": [],
      "moduleCount": 4,
      "languages": [],
      "intake": {
        "startsInDays": 63,
        "seatsTotal": 14
      },
      "rating": {
        "average": 0,
        "count": 0
      },
      "status": "published",
      "publishedDaysAgo": 1,
      "media": [
        {
          "kind": "image",
          "id": "img-course-olympic-weightlifting-1",
          "url": "/images/courses/olympic-weightlifting-1.jpg",
          "alt": "",
          "width": 736,
          "height": 920
        },
        {
          "kind": "image",
          "id": "img-course-olympic-weightlifting-2",
          "url": "/images/courses/olympic-weightlifting-2.jpg",
          "alt": "",
          "width": 666,
          "height": 600
        },
        {
          "kind": "image",
          "id": "img-course-olympic-weightlifting-3",
          "url": "/images/courses/olympic-weightlifting-3.jpg",
          "alt": "",
          "width": 666,
          "height": 600
        }
      ]
    },
    {
      "id": "course-cpd-programme-design",
      "slug": "cpd-programme-design-clinic",
      "title": {
        "en": "CPD: Programme design clinic",
        "ar": "ورشة: عيادة تصميم البرامج"
      },
      "summary": {
        "en": "One weekend rebuilding your own clients' programmes against the council's framework, with your plans reviewed in the room.",
        "ar": "عطلة أسبوع واحدة لإعادة بناء برامج مشتركيك وفق إطار المجلس، مع مراجعة خططك داخل القاعة."
      },
      "categoryIds": [
        "ccat-cpd"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-gym"
      ],
      "format": "online",
      "level": "intermediate",
      "durationHours": 12,
      "price": {
        "amount": 95000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-layla"
      ],
      "moduleCount": 2,
      "certification": {
        "name": {
          "en": "NCSF continuing education units (CEUs)",
          "ar": "وحدات التعليم المستمر من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar",
        "en"
      ],
      "intake": {
        "startsInDays": 23,
        "seatsTotal": 14
      },
      "rating": {
        "average": 4.5,
        "count": 22
      },
      "status": "published",
      "publishedDaysAgo": 95,
      "media": []
    },
    {
      "id": "course-cpd-coaching-communication",
      "slug": "cpd-coaching-communication",
      "title": {
        "en": "CPD: Coaching communication",
        "ar": "ورشة: التواصل التدريبي"
      },
      "summary": {
        "en": "Cueing, correcting and keeping a client who is not enjoying it — the part of the job no certification examines.",
        "ar": "التوجيه والتصحيح والاحتفاظ بمشترك لا يستمتع بالتدريب — الجانب الذي لا يمتحنه أي اعتماد."
      },
      "categoryIds": [
        "ccat-cpd"
      ],
      "sportIds": [
        "sport-fitness"
      ],
      "format": "online",
      "level": "beginner",
      "durationHours": 8,
      "price": {
        "amount": 75000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-yousef"
      ],
      "moduleCount": 2,
      "certification": {
        "name": {
          "en": "NCSF continuing education units (CEUs)",
          "ar": "وحدات التعليم المستمر من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar"
      ],
      "intake": {
        "startsInDays": 31,
        "seatsTotal": 20
      },
      "rating": {
        "average": 0,
        "count": 0
      },
      "status": "published",
      "publishedDaysAgo": 40,
      "media": []
    },
    {
      "id": "course-cpd-youth-development",
      "slug": "cpd-youth-athlete-development",
      "title": {
        "en": "CPD: Youth athlete development",
        "ar": "ورشة: تطوير الرياضي الناشئ"
      },
      "summary": {
        "en": "Age-appropriate training for 8–16s, session design under real constraints, and safeguarding basics.",
        "ar": "تدريب مناسب لأعمار 8–16 سنة، وتصميم الحصص ضمن قيود واقعية، وأساسيات حماية الناشئين."
      },
      "categoryIds": [
        "ccat-cpd"
      ],
      "sportIds": [
        "sport-football",
        "sport-basketball",
        "sport-swimming"
      ],
      "format": "hybrid",
      "level": "intermediate",
      "durationHours": 16,
      "price": {
        "amount": 120000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-omar",
        "coach-sami"
      ],
      "moduleCount": 3,
      "certification": {
        "name": {
          "en": "NCSF continuing education units (CEUs)",
          "ar": "وحدات التعليم المستمر من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar"
      ],
      "venue": {
        "en": "JoFit Academy, Amman",
        "ar": "أكاديمية جوفِت، عمّان"
      },
      "intake": {
        "startsInDays": 35,
        "seatsTotal": 18
      },
      "rating": {
        "average": 4.4,
        "count": 18
      },
      "status": "published",
      "publishedDaysAgo": 65,
      "media": []
    },
    {
      "id": "course-cpd-sideline-first-aid",
      "slug": "cpd-sideline-first-aid",
      "title": {
        "en": "CPD: Sideline first aid",
        "ar": "ورشة: الإسعافات الأولية في الملعب"
      },
      "summary": {
        "en": "One day on pitch-side emergency response: primary survey, concussion recognition, bleeding control and safe removal from play.",
        "ar": "يوم واحد حول الاستجابة للطوارئ في الملعب: الفحص الأولي، وكشف الارتجاج، والسيطرة على النزيف، والإخراج الآمن من الملعب."
      },
      "categoryIds": [
        "ccat-cpd"
      ],
      "sportIds": [
        "sport-football",
        "sport-basketball",
        "sport-martial-arts"
      ],
      "format": "in-person",
      "level": "beginner",
      "durationHours": 8,
      "price": {
        "amount": 60000,
        "currency": "JOD"
      },
      "instructorIds": [
        "coach-rania"
      ],
      "moduleCount": 2,
      "certification": {
        "name": {
          "en": "NCSF continuing education units (CEUs)",
          "ar": "وحدات التعليم المستمر من NCSF"
        },
        "issuedBy": {
          "en": "National Council on Strength & Fitness (NCSF)",
          "ar": "المجلس الوطني للقوة واللياقة البدنية (NCSF)"
        }
      },
      "languages": [
        "ar",
        "en"
      ],
      "venue": {
        "en": "JoFit Academy pitch, Amman",
        "ar": "ملعب أكاديمية جوفِت، عمّان"
      },
      "intake": {
        "startsInDays": 49,
        "seatsTotal": 16
      },
      "rating": {
        "average": 4.9,
        "count": 12
      },
      "status": "published",
      "publishedDaysAgo": 20,
      "media": []
    }
  ],
  "authors": [
    {
      "id": "author-nadia",
      "slug": "nadia-khoury",
      "name": "Nadia Khoury",
      "bio": {
        "en": "Sports science writer.",
        "ar": "كاتبة في علوم الرياضة."
      }
    },
    {
      "id": "author-basel",
      "slug": "basel-odeh",
      "name": "Basel Odeh",
      "bio": {
        "en": "Equipment reviewer and former club coach.",
        "ar": "مراجع معدات ومدرّب نادٍ سابق."
      }
    }
  ],
  "articleCategories": [
    {
      "id": "acat-training",
      "slug": "training",
      "name": {
        "en": "Training",
        "ar": "التدريب"
      },
      "description": {
        "en": "Programming, recovery and performance.",
        "ar": "بناء البرامج والاستشفاء والأداء."
      },
      "parentId": null,
      "sportIds": []
    },
    {
      "id": "acat-gear",
      "slug": "gear",
      "name": {
        "en": "Gear",
        "ar": "المعدات"
      },
      "description": {
        "en": "Equipment guides and reviews.",
        "ar": "أدلة ومراجعات المعدات."
      },
      "parentId": null,
      "sportIds": []
    }
  ],
  "articles": [
    {
      "id": "article-first-10k",
      "slug": "building-up-to-your-first-10k",
      "title": {
        "en": "Building up to your first 10K",
        "ar": "التحضير لأول سباق 10 كم"
      },
      "excerpt": {
        "en": "A twelve-week approach that prioritises consistency over weekly mileage jumps.",
        "ar": "خطة من اثني عشر أسبوعاً تركّز على الانتظام بدل زيادة المسافات فجأة."
      },
      "body": {
        "en": "Most first-time 10K plans fail on week four, not week one...",
        "ar": "معظم خطط أول 10 كم تفشل في الأسبوع الرابع، لا الأول..."
      },
      "authorId": "author-nadia",
      "categoryIds": [
        "acat-training"
      ],
      "sportIds": [
        "sport-running"
      ],
      "readingMinutes": 7,
      "status": "published",
      "publishedAt": "2026-08-12"
    },
    {
      "id": "article-choosing-a-football",
      "slug": "choosing-a-match-football",
      "title": {
        "en": "Choosing a match football",
        "ar": "كيف تختار كرة المباريات"
      },
      "excerpt": {
        "en": "What thermal bonding, panel count and surface texture actually change on the pitch.",
        "ar": "ما الذي يغيّره اللحام الحراري وعدد القطع وملمس السطح فعلياً في الملعب."
      },
      "body": {
        "en": "Ball specifications read like marketing until you know which numbers move...",
        "ar": "تبدو مواصفات الكرة دعائية حتى تعرف أي الأرقام يهم فعلاً..."
      },
      "authorId": "author-basel",
      "categoryIds": [
        "acat-gear"
      ],
      "sportIds": [
        "sport-football"
      ],
      "readingMinutes": 5,
      "status": "published",
      "publishedAt": "2026-07-03"
    },
    {
      "id": "article-recovery-basics",
      "slug": "recovery-basics-for-amateur-athletes",
      "title": {
        "en": "Recovery basics for amateur athletes",
        "ar": "أساسيات الاستشفاء للرياضيين الهواة"
      },
      "excerpt": {
        "en": "Sleep, protein and load management do more than any recovery gadget.",
        "ar": "النوم والبروتين وإدارة الحِمل أهم من أي جهاز استشفاء."
      },
      "body": {
        "en": "The recovery market is large and mostly optional...",
        "ar": "سوق الاستشفاء واسع ومعظمه اختياري..."
      },
      "authorId": "author-nadia",
      "categoryIds": [
        "acat-training"
      ],
      "sportIds": [
        "sport-fitness",
        "sport-running"
      ],
      "readingMinutes": 6,
      "status": "published",
      "publishedAt": "2026-06-19"
    }
  ],
  "topics": [
    {
      "id": "topic-training",
      "slug": "training",
      "name": {
        "en": "Training",
        "ar": "التدريب"
      }
    },
    {
      "id": "topic-gear",
      "slug": "gear",
      "name": {
        "en": "Gear",
        "ar": "المعدات"
      }
    }
  ],
  "posts": [
    {
      "id": "post-marathon-block",
      "slug": "how-do-you-structure-a-marathon-block",
      "title": "How do you structure a marathon block?",
      "excerpt": "Sixteen weeks, four runs a week — where should the long run sit?",
      "body": "I have sixteen weeks and can run four days a week...",
      "kind": "question",
      "topicIds": [
        "topic-training"
      ],
      "sportIds": [
        "sport-running"
      ],
      "authorName": "Yousef",
      "createdAt": "2026-09-01",
      "likeCount": 6
    },
    {
      "id": "post-court-shoes",
      "slug": "indoor-court-shoes-that-last",
      "title": "Indoor court shoes that last",
      "excerpt": "Two seasons in and looking for something more durable.",
      "body": "My last two pairs wore through the forefoot by mid-season...",
      "kind": "discussion",
      "topicIds": [
        "topic-gear"
      ],
      "sportIds": [
        "sport-basketball"
      ],
      "authorName": "Hala",
      "createdAt": "2026-08-19",
      "likeCount": 3
    }
  ],
  "comments": [
    {
      "id": "comment-1",
      "postId": "post-marathon-block",
      "parentId": null,
      "authorName": "Rami",
      "body": "Long run on Saturday, quality on Tuesday, easy the rest. Keep it boring.",
      "createdAt": "2026-09-02",
      "likeCount": 4
    },
    {
      "id": "comment-2",
      "postId": "post-marathon-block",
      "parentId": "comment-1",
      "authorName": "Yousef",
      "body": "That matches what my club coach suggested — thanks.",
      "createdAt": "2026-09-02",
      "likeCount": 1
    },
    {
      "id": "comment-3",
      "postId": "post-court-shoes",
      "parentId": null,
      "authorName": "Marwan",
      "body": "Rotate two pairs. Doubles the life of both.",
      "createdAt": "2026-08-20",
      "likeCount": 2
    }
  ],
  "reviews": [
    {
      "id": "rev-1",
      "targetType": "product",
      "targetId": "prod-match-football",
      "authorName": "Hussein A.",
      "rating": 5,
      "title": "Holds up on astroturf",
      "body": "Two seasons of weekly matches and the seams are still perfect.",
      "createdAt": "2026-07-02",
      "isVerified": true,
      "helpfulCount": 12
    },
    {
      "id": "rev-2",
      "targetType": "product",
      "targetId": "prod-match-football",
      "authorName": "Noor K.",
      "rating": 4,
      "body": "Good ball, though it needs topping up more often than I expected.",
      "createdAt": "2026-06-18",
      "isVerified": true,
      "helpfulCount": 3
    },
    {
      "id": "rev-3",
      "targetType": "product",
      "targetId": "prod-trail-runner",
      "authorName": "Sami T.",
      "rating": 5,
      "title": "Grip is excellent",
      "body": "Confident on loose rock. Sizing runs slightly small.",
      "createdAt": "2026-08-01",
      "isVerified": true,
      "helpfulCount": 20
    },
    {
      "id": "rev-4",
      "targetType": "rental-item",
      "targetId": "rent-paddleboard",
      "authorName": "Dana R.",
      "rating": 5,
      "body": "Board was clean and fully kitted. Collection took five minutes.",
      "createdAt": "2026-07-22",
      "isVerified": true,
      "helpfulCount": 7
    },
    {
      "id": "rev-5",
      "targetType": "rental-item",
      "targetId": "rent-gravel-bike",
      "authorName": "Yazan M.",
      "rating": 4,
      "body": "Drivetrain was a little worn but shifted fine all weekend.",
      "createdAt": "2026-06-09",
      "isVerified": true,
      "helpfulCount": 2
    },
    {
      "id": "rev-6",
      "targetType": "coach",
      "targetId": "coach-layla",
      "authorName": "Farah S.",
      "rating": 5,
      "title": "Rebuilt my confidence after injury",
      "body": "Clear progressions and honest about timelines. Back playing after eleven weeks.",
      "createdAt": "2026-08-14",
      "helpfulCount": 15
    },
    {
      "id": "rev-7",
      "targetType": "coach",
      "targetId": "coach-omar",
      "authorName": "Tareq B.",
      "rating": 4,
      "body": "My son's shooting form improved noticeably within a month.",
      "createdAt": "2026-05-30",
      "helpfulCount": 5
    },
    {
      "id": "rev-9",
      "targetType": "coach",
      "targetId": "coach-layla",
      "authorName": "رزان ع.",
      "rating": 5,
      "title": "أول مرة أفهم ليش أتمرن هيك",
      "body": "كل تمرين له سبب وبتشرحه. رجعت ألعب مع النادي بعد شهرين ونص بدون أي ألم.",
      "createdAt": "2026-08-02",
      "helpfulCount": 11
    },
    {
      "id": "rev-10",
      "targetType": "coach",
      "targetId": "coach-layla",
      "authorName": "Mohammad D.",
      "rating": 4,
      "body": "Sessions start on the minute and the programming is genuinely individual. Parking at the hub is the only hassle.",
      "createdAt": "2026-07-19",
      "helpfulCount": 4
    },
    {
      "id": "rev-11",
      "targetType": "coach",
      "targetId": "coach-omar",
      "authorName": "ليث ج.",
      "rating": 5,
      "body": "تصوير الجلسة فكرة ممتازة. ابني صار يشوف غلطه بنفسه قبل ما يقول له عمر.",
      "createdAt": "2026-06-11",
      "helpfulCount": 8
    },
    {
      "id": "rev-12",
      "targetType": "coach",
      "targetId": "coach-rania",
      "authorName": "هبة ن.",
      "rating": 5,
      "title": "خطة مكتوبة على مقاس دوامي",
      "body": "قلت لها عندي ثلاث أيام بالأسبوع بس، وبنت الخطة على هالأساس مش على خطة جاهزة. أول نص ماراثون خلصته بوقت أحسن من المتوقع.",
      "createdAt": "2026-08-21",
      "helpfulCount": 19
    },
    {
      "id": "rev-13",
      "targetType": "coach",
      "targetId": "coach-rania",
      "authorName": "Sara W.",
      "rating": 4,
      "body": "The remote plan reviews are worth it on their own. Replies to questions the same evening.",
      "createdAt": "2026-05-14",
      "helpfulCount": 6
    },
    {
      "id": "rev-14",
      "targetType": "coach",
      "targetId": "coach-karim",
      "authorName": "أحمد ص.",
      "rating": 5,
      "title": "أرقام الأسبوع الجاي مكتوبة قبل ما أطلع",
      "body": "ما عدت أوصل الجيم وأنا محتار شو أحمّل. السكوات زاد ٢٥ كيلو بستة أشهر بدون أي إصابة.",
      "createdAt": "2026-09-01",
      "helpfulCount": 22
    },
    {
      "id": "rev-15",
      "targetType": "coach",
      "targetId": "coach-noor",
      "authorName": "دعاء م.",
      "rating": 5,
      "title": "ما استعجلت علي ولا مرة",
      "body": "بعد الولادة كنت خايفة أرجع أرفع. نور بدأت من قاع الحوض والتنفّس، وبعد أربع شهور رجعت للبار عادي.",
      "createdAt": "2026-07-30",
      "helpfulCount": 27
    },
    {
      "id": "rev-16",
      "targetType": "coach",
      "targetId": "coach-tareq",
      "authorName": "زيد ح.",
      "rating": 5,
      "body": "شهر كامل وقفة وتنفّس قبل أي ضربة قوية. بعدين فهمت ليش.",
      "createdAt": "2026-06-25",
      "helpfulCount": 9
    },
    {
      "id": "rev-17",
      "targetType": "coach",
      "targetId": "coach-dina",
      "authorName": "نادين ق.",
      "rating": 5,
      "title": "ظهري بعد تسع ساعات كرسي",
      "body": "التمارين كلها بقدر أعيدها بالبيت، وهاد المهم. آلام أسفل الظهر اختفت خلال ثلاث أسابيع.",
      "createdAt": "2026-08-17",
      "helpfulCount": 14
    },
    {
      "id": "rev-18",
      "targetType": "coach",
      "targetId": "coach-yousef",
      "authorName": "عبد الله ر.",
      "rating": 4,
      "body": "المتابعة كل أسبوعين على القياسات مش على الميزان غيّرت طريقة تفكيري كلها.",
      "createdAt": "2026-09-05",
      "helpfulCount": 13
    },
    {
      "id": "rev-19",
      "targetType": "coach",
      "targetId": "coach-hala",
      "authorName": "منى ط.",
      "rating": 5,
      "title": "تعلمت السباحة وعمري ٣٨",
      "body": "أول حصة ما طلبت مني أنزل وجهي بالماء، وهاد الشي لحاله خلاني أرجع للحصة الثانية.",
      "createdAt": "2026-07-08",
      "helpfulCount": 31
    },
    {
      "id": "rev-20",
      "targetType": "coach",
      "targetId": "coach-sami",
      "authorName": "باسل خ.",
      "rating": 4,
      "body": "صعود العقبة قبل وبعد. الفرق بالأرقام مش بالإحساس، وهاد اللي كنت بدوّر عليه.",
      "createdAt": "2026-08-28",
      "helpfulCount": 7
    },
    {
      "id": "rev-8",
      "targetType": "course",
      "targetId": "course-pt-foundation",
      "authorName": "Lina H.",
      "rating": 5,
      "body": "The practical assessment week was the most useful part by far.",
      "createdAt": "2026-08-25",
      "helpfulCount": 9
    }
  ],
  "theme": {
    "id": "jofit-green",
    "name": "JoFit Green",
    "colors": {
      "primary": "#008050",
      "primaryHover": "#00693f",
      "primaryDark": "#005030",
      "accent": "#d4b36a",
      "secondary": "#232323",
      "onPrimary": "#ffffff",
      "onSecondary": "#ffffff",
      "title": "#222222",
      "body": "#575757",
      "surface": "#ffffff",
      "surfaceMuted": "#f6f7f5",
      "border": "#e9e9e9"
    },
    "typography": {
      "fontFamily": "Poppins, Tajawal, system-ui, sans-serif",
      "scale": "1",
      "titleWeight": "700"
    },
    "shape": {
      "skew": "-15deg",
      "radius": "0px",
      "buttonRadius": "0px"
    },
    "layout": {
      "maxWidth": "1200px",
      "sectionSpacing": "6.25rem",
      "headerMode": "fixed"
    }
  },
  "careers": {
    "cities": {
      "amman": {
        "en": "Amman",
        "ar": "عمّان"
      },
      "irbid": {
        "en": "Irbid",
        "ar": "إربد"
      },
      "zarqa": {
        "en": "Zarqa",
        "ar": "الزرقاء"
      },
      "aqaba": {
        "en": "Aqaba",
        "ar": "العقبة"
      },
      "salt": {
        "en": "Salt",
        "ar": "السلط"
      },
      "madaba": {
        "en": "Madaba",
        "ar": "مادبا"
      },
      "jerash": {
        "en": "Jerash",
        "ar": "جرش"
      },
      "ajloun": {
        "en": "Ajloun",
        "ar": "عجلون"
      },
      "karak": {
        "en": "Karak",
        "ar": "الكرك"
      },
      "mafraq": {
        "en": "Mafraq",
        "ar": "المفرق"
      },
      "maan": {
        "en": "Ma'an",
        "ar": "معان"
      },
      "tafilah": {
        "en": "Tafilah",
        "ar": "الطفيلة"
      }
    },
    "employers": [
      {
        "id": "emp-summit",
        "slug": "summit-performance-gym",
        "name": "Summit Performance Gym",
        "kind": "gym",
        "cityId": "amman",
        "about": "A strength and conditioning gym in Khalda with a free-weights floor, two turf lanes and a small-group studio. We coach members from their first session to their first competition, and we hire coaches who want to keep learning.",
        "website": "https://summit-gym.example",
        "size": "11-50",
        "email": "hr@summit-gym.test",
        "phone": "+962 6 500 1100",
        "contactName": "Rana Haddad",
        "verificationStatus": "verified",
        "createdAt": "2026-06-02T07:00:00.000Z",
        "updatedAt": "2026-09-10T07:00:00.000Z"
      },
      {
        "id": "emp-ofoq",
        "slug": "al-ofoq-sports-club",
        "name": "نادي الأفق الرياضي",
        "kind": "club",
        "cityId": "irbid",
        "about": "نادٍ رياضي عائلي في إربد يضم ملاعب كرة قدم وكرة سلة وصالة لياقة ومسبحاً داخلياً. نبحث دائماً عن مدرّبين يحبّون العمل مع الأطفال والناشئين، ونوفّر لهم التدريب والتطوير المستمر.",
        "size": "51-200",
        "email": "jobs@ofoq-club.test",
        "phone": "+962 2 720 3300",
        "contactName": "خالد العمري",
        "verificationStatus": "verified",
        "createdAt": "2026-03-14T07:00:00.000Z",
        "updatedAt": "2026-08-31T07:00:00.000Z"
      },
      {
        "id": "emp-aqaba-aquatics",
        "slug": "aqaba-aquatic-centre",
        "name": "Aqaba Aquatic Centre",
        "kind": "sports-centre",
        "cityId": "aqaba",
        "about": "A 25-metre indoor pool, a learn-to-swim programme for children and adults, and open-water sessions on the Red Sea coast. Lifeguards and swim instructors work in rotating shifts.",
        "website": "https://aqaba-aquatics.example",
        "size": "11-50",
        "email": "careers@aqaba-aquatics.test",
        "phone": "+962 3 201 4400",
        "contactName": "Mazen Qasem",
        "verificationStatus": "verified",
        "createdAt": "2026-07-02T07:00:00.000Z",
        "updatedAt": "2026-09-18T07:00:00.000Z"
      },
      {
        "id": "emp-coremotion",
        "slug": "coremotion-physio-clinic",
        "name": "CoreMotion Physio Clinic",
        "kind": "clinic",
        "cityId": "amman",
        "about": "Sports physiotherapy and return-to-play rehabilitation in Abdoun. We work alongside coaches and gyms across Amman, and every therapist here keeps a caseload of athletes.",
        "website": "https://coremotion.example",
        "size": "1-10",
        "email": "hr@coremotion.test",
        "phone": "+962 6 592 7700",
        "contactName": "Dr. Lina Saadeh",
        "verificationStatus": "verified",
        "createdAt": "2026-05-03T07:00:00.000Z",
        "updatedAt": "2026-08-21T07:00:00.000Z"
      },
      {
        "id": "emp-levant",
        "slug": "levant-sportswear",
        "name": "Levant Sportswear Co.",
        "kind": "sports-company",
        "cityId": "amman",
        "about": "We design and distribute training apparel and team kits for clubs and schools in Jordan. Our team runs design, sourcing, retail and B2B sales from one office.",
        "size": "51-200",
        "email": "talent@levant-sportswear.test",
        "phone": "+962 6 400 8800",
        "contactName": "Sara Nimri",
        "verificationStatus": "verified",
        "createdAt": "2025-12-04T07:00:00.000Z",
        "updatedAt": "2026-09-22T07:00:00.000Z"
      },
      {
        "id": "emp-young-stars",
        "slug": "young-stars-football-academy",
        "name": "أكاديمية النجوم الصاعدة لكرة القدم",
        "kind": "academy",
        "cityId": "madaba",
        "about": "أكاديمية لكرة القدم للفئات العمرية من ٦ إلى ١٦ سنة، بتدريبات بعد المدرسة وفي عطل نهاية الأسبوع. نؤمن بأن المدرّب الجيد يصنع لاعباً جيداً وإنساناً أفضل.",
        "size": "11-50",
        "email": "coach@youngstars.test",
        "phone": "+962 5 324 1200",
        "contactName": "محمد الشوابكة",
        "verificationStatus": "verified",
        "createdAt": "2026-08-01T07:00:00.000Z",
        "updatedAt": "2026-09-15T07:00:00.000Z"
      },
      {
        "id": "emp-zarqa-strength",
        "slug": "zarqa-strength-house",
        "name": "بيت القوة - الزرقاء",
        "kind": "gym",
        "cityId": "zarqa",
        "about": "صالة رياضية جديدة للقوة ورفع الأثقال في الزرقاء الجديدة، تفتح أبوابها الشهر القادم.",
        "size": "1-10",
        "email": "info@zarqa-strength.test",
        "phone": "+962 5 390 5500",
        "contactName": "أحمد الزعبي",
        "verificationStatus": "pending",
        "createdAt": "2026-09-28T07:00:00.000Z",
        "updatedAt": "2026-09-28T07:00:00.000Z"
      }
    ],
    "jobCategories": [
      {
        "id": "jc-personal-training",
        "slug": "personal-training",
        "name": {
          "en": "Personal training",
          "ar": "التدريب الشخصي"
        }
      },
      {
        "id": "jc-group-fitness",
        "slug": "group-fitness",
        "name": {
          "en": "Group fitness",
          "ar": "اللياقة الجماعية"
        }
      },
      {
        "id": "jc-sports-coaching",
        "slug": "sports-coaching",
        "name": {
          "en": "Sports coaching",
          "ar": "التدريب الرياضي"
        }
      },
      {
        "id": "jc-physiotherapy",
        "slug": "physiotherapy",
        "name": {
          "en": "Physiotherapy & rehab",
          "ar": "العلاج الطبيعي والتأهيل"
        }
      },
      {
        "id": "jc-nutrition",
        "slug": "nutrition",
        "name": {
          "en": "Nutrition",
          "ar": "التغذية"
        }
      },
      {
        "id": "jc-aquatics",
        "slug": "aquatics",
        "name": {
          "en": "Aquatics & lifeguarding",
          "ar": "السباحة والإنقاذ"
        }
      },
      {
        "id": "jc-front-desk",
        "slug": "front-desk",
        "name": {
          "en": "Front desk & membership",
          "ar": "الاستقبال والعضويات"
        }
      },
      {
        "id": "jc-management",
        "slug": "management",
        "name": {
          "en": "Management & operations",
          "ar": "الإدارة والتشغيل"
        }
      },
      {
        "id": "jc-sales-marketing",
        "slug": "sales-marketing",
        "name": {
          "en": "Sales & marketing",
          "ar": "المبيعات والتسويق"
        }
      },
      {
        "id": "jc-facilities",
        "slug": "facilities",
        "name": {
          "en": "Facilities & maintenance",
          "ar": "المرافق والصيانة"
        }
      }
    ],
    "jobs": [
      {
        "id": "job-summit-pt",
        "slug": "personal-trainer-summit-performance-gym",
        "reference": "JB-10001",
        "employerId": "emp-summit",
        "title": "Personal Trainer — strength & conditioning",
        "categoryId": "jc-personal-training",
        "sportIds": [
          "sport-gym",
          "sport-fitness"
        ],
        "cityId": "amman",
        "workMode": "on-site",
        "employmentType": "full-time",
        "experienceLevel": "mid",
        "salary": {
          "min": {
            "amount": 550000,
            "currency": "JOD"
          },
          "max": {
            "amount": 800000,
            "currency": "JOD"
          },
          "period": "month"
        },
        "showSalary": true,
        "description": "You will run one-to-one and small-group sessions on our strength floor, write programmes for members with goals from general fitness to powerlifting meets, and keep their progress on record. Shifts are split between mornings and evenings, five days a week.",
        "requirements": [
          "A recognised personal-training certification (NCSF, NASM, ACE or equivalent)",
          "Two years or more coaching adults on a gym floor",
          "Confident teaching the squat, hinge, press and pull patterns",
          "Arabic and conversational English"
        ],
        "benefits": [
          "Commission on personal-training packages",
          "Paid CPD course every year",
          "Free membership for a family member"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 2,
        "closesOn": "2026-10-24",
        "status": "open",
        "featured": true,
        "postedAt": "2026-09-27T07:00:00.000Z",
        "createdAt": "2026-09-26T07:00:00.000Z",
        "updatedAt": "2026-09-27T07:00:00.000Z"
      },
      {
        "id": "job-summit-front",
        "slug": "front-desk-membership-summit-performance-gym",
        "reference": "JB-10002",
        "employerId": "emp-summit",
        "title": "Front Desk & Membership Advisor",
        "categoryId": "jc-front-desk",
        "sportIds": [],
        "cityId": "amman",
        "workMode": "on-site",
        "employmentType": "part-time",
        "experienceLevel": "entry",
        "showSalary": false,
        "description": "The first person every member meets. You will check members in, sell and renew memberships, book assessments with the coaches and keep the reception tidy. Evening and weekend shifts.",
        "requirements": [
          "Friendly and organised",
          "Basic computer skills",
          "Available at least three evenings a week"
        ],
        "benefits": [
          "Free membership",
          "Sales bonus"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 1,
        "status": "open",
        "featured": false,
        "postedAt": "2026-09-21T07:00:00.000Z",
        "createdAt": "2026-09-20T07:00:00.000Z",
        "updatedAt": "2026-09-21T07:00:00.000Z"
      },
      {
        "id": "job-summit-coach-draft",
        "slug": "group-coach-summit-performance-gym",
        "reference": "JB-10003",
        "employerId": "emp-summit",
        "title": "Group Class Coach (HIIT & conditioning)",
        "categoryId": "jc-group-fitness",
        "sportIds": [
          "sport-fitness"
        ],
        "cityId": "amman",
        "workMode": "on-site",
        "employmentType": "freelance",
        "experienceLevel": "mid",
        "showSalary": false,
        "description": "Lead four to six group conditioning classes a week in our studio.",
        "requirements": [
          "Group fitness certification",
          "A music-driven class you can show us"
        ],
        "benefits": [],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 1,
        "status": "draft",
        "featured": false,
        "createdAt": "2026-09-28T07:00:00.000Z",
        "updatedAt": "2026-09-29T07:00:00.000Z"
      },
      {
        "id": "job-ofoq-football",
        "slug": "youth-football-coach-al-ofoq",
        "reference": "JB-10004",
        "employerId": "emp-ofoq",
        "title": "مدرّب كرة قدم للناشئين (تحت ١٢ سنة)",
        "categoryId": "jc-sports-coaching",
        "sportIds": [
          "sport-football"
        ],
        "cityId": "irbid",
        "workMode": "on-site",
        "employmentType": "part-time",
        "experienceLevel": "mid",
        "salary": {
          "min": {
            "amount": 8000,
            "currency": "JOD"
          },
          "max": {
            "amount": 12000,
            "currency": "JOD"
          },
          "period": "hour"
        },
        "showSalary": true,
        "description": "تدريب فريقين من الناشئين تحت ١٢ سنة، ثلاث حصص أسبوعياً بعد الظهر ومباراة يوم الجمعة. ستعمل مع مدير الفئات العمرية على خطة موسمية وتقييم دوري لكل لاعب.",
        "requirements": [
          "رخصة تدريب من الاتحاد الأردني لكرة القدم (C أو أعلى)",
          "خبرة لا تقل عن سنتين مع الأطفال",
          "شهادة إسعافات أولية سارية"
        ],
        "benefits": [
          "تأمين صحي",
          "دورات تطوير مدفوعة",
          "زي رياضي كامل"
        ],
        "languages": [
          "ar"
        ],
        "positions": 2,
        "closesOn": "2026-10-12",
        "status": "open",
        "featured": true,
        "postedAt": "2026-09-25T07:00:00.000Z",
        "createdAt": "2026-09-24T07:00:00.000Z",
        "updatedAt": "2026-09-25T07:00:00.000Z"
      },
      {
        "id": "job-ofoq-lifeguard",
        "slug": "lifeguard-al-ofoq",
        "reference": "JB-10005",
        "employerId": "emp-ofoq",
        "title": "منقذ سباحة — المسبح الداخلي",
        "categoryId": "jc-aquatics",
        "sportIds": [
          "sport-swimming"
        ],
        "cityId": "irbid",
        "workMode": "on-site",
        "employmentType": "full-time",
        "experienceLevel": "entry",
        "salary": {
          "min": {
            "amount": 380000,
            "currency": "JOD"
          },
          "max": {
            "amount": 450000,
            "currency": "JOD"
          },
          "period": "month"
        },
        "showSalary": true,
        "description": "مراقبة المسبح الداخلي خلال ساعات العمل، وتطبيق قواعد السلامة، والمساعدة في حصص تعليم السباحة.",
        "requirements": [
          "شهادة منقذ سباحة معتمدة",
          "لياقة بدنية عالية",
          "الاستعداد للعمل بنظام الورديات"
        ],
        "benefits": [
          "تأمين صحي",
          "وجبة يومية"
        ],
        "languages": [
          "ar"
        ],
        "positions": 1,
        "status": "open",
        "featured": false,
        "postedAt": "2026-09-16T07:00:00.000Z",
        "createdAt": "2026-09-15T07:00:00.000Z",
        "updatedAt": "2026-09-16T07:00:00.000Z"
      },
      {
        "id": "job-aqaba-swim",
        "slug": "swim-instructor-aqaba-aquatic-centre",
        "reference": "JB-10006",
        "employerId": "emp-aqaba-aquatics",
        "title": "Swim Instructor — children & adults",
        "categoryId": "jc-aquatics",
        "sportIds": [
          "sport-swimming",
          "sport-water-sports"
        ],
        "cityId": "aqaba",
        "workMode": "on-site",
        "employmentType": "full-time",
        "experienceLevel": "mid",
        "showSalary": false,
        "description": "Teach our learn-to-swim levels from first splash to stroke correction, run two adult technique classes a week, and assist with open-water sessions in season.",
        "requirements": [
          "Swim teaching qualification",
          "Lifeguard certificate",
          "At least one year teaching children"
        ],
        "benefits": [
          "Housing allowance for candidates relocating to Aqaba",
          "Transport to open-water sessions"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 3,
        "closesOn": "2026-10-30",
        "status": "open",
        "featured": false,
        "postedAt": "2026-09-23T07:00:00.000Z",
        "createdAt": "2026-09-22T07:00:00.000Z",
        "updatedAt": "2026-09-23T07:00:00.000Z"
      },
      {
        "id": "job-coremotion-physio",
        "slug": "sports-physiotherapist-coremotion",
        "reference": "JB-10007",
        "employerId": "emp-coremotion",
        "title": "Sports Physiotherapist",
        "categoryId": "jc-physiotherapy",
        "sportIds": [
          "sport-running",
          "sport-football",
          "sport-basketball"
        ],
        "cityId": "amman",
        "workMode": "on-site",
        "employmentType": "full-time",
        "experienceLevel": "senior",
        "showSalary": false,
        "description": "Assess and treat athletes from injury to return-to-play, write rehabilitation plans with their coaches, and cover pitch-side at two partner clubs on match days.",
        "requirements": [
          "Bachelor's in physiotherapy and a valid Jordanian practising licence",
          "Four years or more in musculoskeletal or sports physiotherapy",
          "Experience writing return-to-play criteria"
        ],
        "benefits": [
          "Competitive salary",
          "Conference budget",
          "Flexible schedule on non-match days"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 1,
        "status": "open",
        "featured": true,
        "postedAt": "2026-09-28T07:00:00.000Z",
        "createdAt": "2026-09-27T07:00:00.000Z",
        "updatedAt": "2026-09-28T07:00:00.000Z"
      },
      {
        "id": "job-coremotion-nutrition",
        "slug": "sports-nutritionist-coremotion",
        "reference": "JB-10008",
        "employerId": "emp-coremotion",
        "title": "Sports Nutritionist (part-time)",
        "categoryId": "jc-nutrition",
        "sportIds": [],
        "cityId": "amman",
        "workMode": "hybrid",
        "employmentType": "part-time",
        "experienceLevel": "mid",
        "showSalary": false,
        "description": "Two clinic days a week plus remote follow-ups: nutrition plans for athletes in rehab and for our partner teams.",
        "requirements": [
          "Degree in nutrition or dietetics",
          "Experience with athletes"
        ],
        "benefits": [
          "Work from home three days a week"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 1,
        "status": "closed",
        "featured": false,
        "postedAt": "2026-08-16T07:00:00.000Z",
        "createdAt": "2026-08-15T07:00:00.000Z",
        "updatedAt": "2026-08-16T07:00:00.000Z"
      },
      {
        "id": "job-levant-sales",
        "slug": "b2b-sales-executive-levant-sportswear",
        "reference": "JB-10009",
        "employerId": "emp-levant",
        "title": "B2B Sales Executive — team kits",
        "categoryId": "jc-sales-marketing",
        "sportIds": [
          "sport-football",
          "sport-basketball"
        ],
        "cityId": "amman",
        "workMode": "hybrid",
        "employmentType": "full-time",
        "experienceLevel": "mid",
        "salary": {
          "min": {
            "amount": 600000,
            "currency": "JOD"
          },
          "max": {
            "amount": 900000,
            "currency": "JOD"
          },
          "period": "month"
        },
        "showSalary": true,
        "description": "Own relationships with clubs, schools and academies across Jordan: quote team kits, follow orders through production, and grow the account book. Half the week is on the road.",
        "requirements": [
          "Two years in B2B sales",
          "A driving licence",
          "Arabic and English"
        ],
        "benefits": [
          "Company car",
          "Quarterly commission",
          "Staff discount"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 1,
        "closesOn": "2026-10-18",
        "status": "open",
        "featured": false,
        "postedAt": "2026-09-26T07:00:00.000Z",
        "createdAt": "2026-09-25T07:00:00.000Z",
        "updatedAt": "2026-09-26T07:00:00.000Z"
      },
      {
        "id": "job-levant-marketing",
        "slug": "social-media-coordinator-levant-sportswear",
        "reference": "JB-10010",
        "employerId": "emp-levant",
        "title": "Social Media Coordinator",
        "categoryId": "jc-sales-marketing",
        "sportIds": [],
        "cityId": "amman",
        "workMode": "remote",
        "employmentType": "contract",
        "experienceLevel": "entry",
        "showSalary": false,
        "description": "A six-month contract to plan and publish our social content in Arabic and English, working with the design team.",
        "requirements": [
          "A portfolio of social accounts you have run",
          "Excellent written Arabic and English"
        ],
        "benefits": [
          "Fully remote"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 1,
        "status": "rejected",
        "moderationNote": "Please state the contract length and the working hours in the description, then submit again.",
        "featured": false,
        "createdAt": "2026-09-23T07:00:00.000Z",
        "updatedAt": "2026-09-24T07:00:00.000Z"
      },
      {
        "id": "job-young-stars-coach",
        "slug": "football-coach-young-stars-academy",
        "reference": "JB-10011",
        "employerId": "emp-young-stars",
        "title": "مدرّب كرة قدم — الفئات العمرية ١٢–١٦",
        "categoryId": "jc-sports-coaching",
        "sportIds": [
          "sport-football"
        ],
        "cityId": "madaba",
        "workMode": "on-site",
        "employmentType": "part-time",
        "experienceLevel": "mid",
        "showSalary": false,
        "description": "قيادة التدريبات الفنية والبدنية للفئة ١٢–١٦ سنة، أربع حصص أسبوعياً، والمشاركة في بطولات الأكاديميات. نفضّل من لديه خبرة لعب سابقة.",
        "requirements": [
          "رخصة تدريب C على الأقل",
          "خبرة سنة مع الناشئين"
        ],
        "benefits": [
          "مكافأة عن كل بطولة",
          "تطوير مهني"
        ],
        "languages": [
          "ar"
        ],
        "positions": 1,
        "closesOn": "2026-10-20",
        "status": "open",
        "featured": false,
        "postedAt": "2026-09-29T07:00:00.000Z",
        "createdAt": "2026-09-28T07:00:00.000Z",
        "updatedAt": "2026-09-29T07:00:00.000Z"
      },
      {
        "id": "job-young-stars-intern",
        "slug": "assistant-coach-internship-young-stars",
        "reference": "JB-10012",
        "employerId": "emp-young-stars",
        "title": "تدريب صيفي: مساعد مدرّب",
        "categoryId": "jc-sports-coaching",
        "sportIds": [
          "sport-football"
        ],
        "cityId": "madaba",
        "workMode": "on-site",
        "employmentType": "internship",
        "experienceLevel": "entry",
        "showSalary": false,
        "description": "فرصة لطلاب علوم الرياضة للتدريب العملي مع مدرّبي الأكاديمية لمدة شهرين.",
        "requirements": [
          "طالب في علوم الرياضة أو تخصص قريب"
        ],
        "benefits": [
          "شهادة خبرة",
          "إمكانية التعيين بعد التدريب"
        ],
        "languages": [
          "ar"
        ],
        "positions": 1,
        "status": "pending",
        "featured": false,
        "createdAt": "2026-09-29T07:00:00.000Z",
        "updatedAt": "2026-09-30T07:00:00.000Z"
      },
      {
        "id": "job-zarqa-coach",
        "slug": "strength-coach-zarqa-strength-house",
        "reference": "JB-10013",
        "employerId": "emp-zarqa-strength",
        "title": "مدرّب قوة ورفع أثقال",
        "categoryId": "jc-personal-training",
        "sportIds": [
          "sport-gym"
        ],
        "cityId": "zarqa",
        "workMode": "on-site",
        "employmentType": "full-time",
        "experienceLevel": "mid",
        "showSalary": false,
        "description": "تدريب الأعضاء على رفع الأثقال الأولمبي والقوة البدنية، وإعداد البرامج الفردية.",
        "requirements": [
          "شهادة مدرّب شخصي معتمدة",
          "خبرة في رفع الأثقال"
        ],
        "benefits": [],
        "languages": [
          "ar"
        ],
        "positions": 1,
        "status": "pending",
        "featured": false,
        "createdAt": "2026-09-28T07:00:00.000Z",
        "updatedAt": "2026-09-29T07:00:00.000Z"
      },
      {
        "id": "job-aqaba-facilities",
        "slug": "pool-technician-aqaba-aquatic-centre",
        "reference": "JB-10014",
        "employerId": "emp-aqaba-aquatics",
        "title": "Pool Plant Technician",
        "categoryId": "jc-facilities",
        "sportIds": [],
        "cityId": "aqaba",
        "workMode": "on-site",
        "employmentType": "full-time",
        "experienceLevel": "mid",
        "showSalary": false,
        "description": "Run and maintain the pool's filtration, dosing and heating plant, and log water tests three times a day.",
        "requirements": [
          "Vocational certificate in mechanics or electrics",
          "Pool plant experience preferred"
        ],
        "benefits": [
          "Overtime paid",
          "Housing allowance"
        ],
        "languages": [
          "ar",
          "en"
        ],
        "positions": 1,
        "status": "open",
        "featured": false,
        "postedAt": "2026-09-19T07:00:00.000Z",
        "createdAt": "2026-09-18T07:00:00.000Z",
        "updatedAt": "2026-09-19T07:00:00.000Z"
      }
    ],
    "jobApplications": [
      {
        "id": "ja-1",
        "reference": "JA-20001",
        "jobId": "job-summit-pt",
        "employerId": "emp-summit",
        "customerId": "cust-1",
        "candidate": {
          "name": "Hussein Ayoub",
          "email": "hussein@example.test",
          "phone": "+962790000001"
        },
        "cv": {
          "id": "cv-hussein",
          "fileName": "Hussein-Ayoub-CV.pdf",
          "mimeType": "application/pdf",
          "bytes": 791
        },
        "coverLetter": "I have coached strength and conditioning for three years and hold the NCSF personal trainer certification. I would love to build programmes for your members and grow with a team that keeps learning.",
        "yearsExperience": 3,
        "certifications": "NCSF-CPT, First Aid",
        "availableFrom": "2026-10-14",
        "expectedSalary": {
          "amount": 700000,
          "currency": "JOD"
        },
        "status": "shortlisted",
        "submittedAt": "2026-09-28T08:00:00.000Z",
        "updatedAt": "2026-09-29T09:00:00.000Z",
        "history": [
          {
            "status": "submitted",
            "at": "2026-09-28T09:00:00.000Z",
            "by": "candidate"
          },
          {
            "status": "reviewing",
            "at": "2026-09-29T09:00:00.000Z",
            "by": "employer"
          },
          {
            "status": "shortlisted",
            "at": "2026-09-29T09:00:00.000Z",
            "by": "employer"
          }
        ],
        "seenByEmployerAt": "2026-09-29T06:00:00.000Z"
      },
      {
        "id": "ja-2",
        "reference": "JA-20002",
        "jobId": "job-aqaba-swim",
        "employerId": "emp-aqaba-aquatics",
        "customerId": "cust-2",
        "candidate": {
          "name": "Noor Khalil",
          "email": "noor@example.test",
          "phone": "+962790000002"
        },
        "cv": {
          "id": "cv-noor",
          "fileName": "Noor-Khalil-CV.pdf",
          "mimeType": "application/pdf",
          "bytes": 775
        },
        "coverLetter": "I teach children's swimming levels one to four and hold a current lifeguard certificate. I am ready to relocate to Aqaba for the season and beyond.",
        "yearsExperience": 2,
        "certifications": "Lifeguard, Swim Teacher Level 2",
        "status": "submitted",
        "submittedAt": "2026-09-29T13:00:00.000Z",
        "updatedAt": "2026-09-29T13:00:00.000Z",
        "history": [
          {
            "status": "submitted",
            "at": "2026-09-29T09:00:00.000Z",
            "by": "candidate"
          }
        ]
      },
      {
        "id": "ja-3",
        "reference": "JA-20003",
        "jobId": "job-ofoq-football",
        "employerId": "emp-ofoq",
        "customerId": "cust-4",
        "candidate": {
          "name": "Yazan Mousa",
          "email": "yazan@example.test",
          "phone": "+962790000004"
        },
        "cv": {
          "id": "cv-yazan",
          "fileName": "Yazan-Mousa-CV.pdf",
          "mimeType": "application/pdf",
          "bytes": 769
        },
        "coverLetter": "لعبت كرة القدم في نادٍ محلي ثماني سنوات وأحمل رخصة تدريب C، وأعمل حالياً مع فريق مدرسي للناشئين.",
        "yearsExperience": 2,
        "certifications": "رخصة تدريب C",
        "status": "interview",
        "statusNote": "المقابلة يوم الأحد الساعة الرابعة عصراً في النادي.",
        "submittedAt": "2026-09-26T07:00:00.000Z",
        "updatedAt": "2026-09-28T10:00:00.000Z",
        "history": [
          {
            "status": "submitted",
            "at": "2026-09-26T09:00:00.000Z",
            "by": "candidate"
          },
          {
            "status": "reviewing",
            "at": "2026-09-27T09:00:00.000Z",
            "by": "employer"
          },
          {
            "status": "shortlisted",
            "at": "2026-09-27T09:00:00.000Z",
            "by": "employer"
          },
          {
            "status": "interview",
            "at": "2026-09-28T09:00:00.000Z",
            "by": "employer"
          }
        ],
        "seenByEmployerAt": "2026-09-27T06:00:00.000Z"
      },
      {
        "id": "ja-4",
        "reference": "JA-20004",
        "jobId": "job-coremotion-nutrition",
        "employerId": "emp-coremotion",
        "customerId": "cust-1",
        "candidate": {
          "name": "Hussein Ayoub",
          "email": "hussein@example.test",
          "phone": "+962790000001"
        },
        "cv": {
          "id": "cv-hussein",
          "fileName": "Hussein-Ayoub-CV.pdf",
          "mimeType": "application/pdf",
          "bytes": 791
        },
        "coverLetter": "I completed a sports nutrition course last year and support my clients' meal planning today.",
        "yearsExperience": 1,
        "status": "rejected",
        "statusNote": "Thank you — we needed a registered dietitian for this role.",
        "submittedAt": "2026-08-21T07:00:00.000Z",
        "updatedAt": "2026-08-26T07:00:00.000Z",
        "history": [
          {
            "status": "submitted",
            "at": "2026-08-21T09:00:00.000Z",
            "by": "candidate"
          },
          {
            "status": "reviewing",
            "at": "2026-08-23T09:00:00.000Z",
            "by": "employer"
          },
          {
            "status": "rejected",
            "at": "2026-08-26T09:00:00.000Z",
            "by": "employer"
          }
        ],
        "seenByEmployerAt": "2026-08-23T06:00:00.000Z"
      }
    ]
  }
};
