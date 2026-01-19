// prisma/faqSeed.js - Country-specific FAQ data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Country-specific FAQ templates
const FAQ_TEMPLATES_BY_COUNTRY = {
  // Saudi Arabia (SA)
  SA: {
    freeShipping: {
      question_ar: 'ما هو الحد الأدنى للشحن المجاني في السعودية؟',
      question_en: 'What is the minimum order for free shipping in Saudi Arabia?',
      answer_ar: 'الشحن مجاني للطلبات فوق 200 ريال سعودي داخل المدن الرئيسية (الرياض، جدة، الدمام). قد يستغرق التوصيل 2-5 أيام عمل.',
      answer_en: 'Free shipping for orders above 200 SAR in major cities (Riyadh, Jeddah, Dammam). Delivery takes 2-5 business days.',
      order: 2
    },
    payment: {
      question_ar: 'ما هي طرق الدفع المتاحة في السعودية؟',
      question_en: 'What payment methods are available in Saudi Arabia?',
      answer_ar: 'نقبل: مدى، فيزا، ماستركارد، Apple Pay، الدفع عند الاستلام (متاح في معظم المدن)، وTabby للتقسيط بدون فوائد.',
      answer_en: 'We accept: Mada, Visa, Mastercard, Apple Pay, Cash on Delivery (available in most cities), and Tabby for interest-free installments.',
      order: 7
    }
  },

  // UAE (AE)
  AE: {
    freeShipping: {
      question_ar: 'ما هو الحد الأدنى للشحن المجاني في الإمارات؟',
      question_en: 'What is the minimum order for free shipping in UAE?',
      answer_ar: 'الشحن مجاني للطلبات فوق 100 درهم إماراتي في دبي وأبوظبي والشارقة. التوصيل خلال 1-3 أيام عمل.',
      answer_en: 'Free shipping for orders above 100 AED in Dubai, Abu Dhabi, and Sharjah. Delivery within 1-3 business days.',
      order: 2
    },
    payment: {
      question_ar: 'ما هي طرق الدفع المتاحة في الإمارات؟',
      question_en: 'What payment methods are available in UAE?',
      answer_ar: 'نقبل: فيزا، ماستركارد، Apple Pay، الدفع عند الاستلام، Tabby، Tamara للتقسيط.',
      answer_en: 'We accept: Visa, Mastercard, Apple Pay, Cash on Delivery, Tabby, Tamara for installments.',
      order: 7
    }
  },

  // Egypt (EG)
  EG: {
    freeShipping: {
      question_ar: 'ما هو الحد الأدنى للشحن المجاني في مصر؟',
      question_en: 'What is the minimum order for free shipping in Egypt?',
      answer_ar: 'الشحن مجاني للطلبات فوق 500 جنيه مصري في القاهرة والإسكندرية. التوصيل خلال 3-7 أيام عمل.',
      answer_en: 'Free shipping for orders above 500 EGP in Cairo and Alexandria. Delivery within 3-7 business days.',
      order: 2
    },
    payment: {
      question_ar: 'ما هي طرق الدفع المتاحة في مصر؟',
      question_en: 'What payment methods are available in Egypt?',
      answer_ar: 'نقبل: فيزا، ماستركارد، الدفع عند الاستلام، فوري، Paymob للتقسيط.',
      answer_en: 'We accept: Visa, Mastercard, Cash on Delivery, Fawry, Paymob for installments.',
      order: 7
    }
  },

  // Qatar (QA)
  QA: {
    freeShipping: {
      question_ar: 'ما هو الحد الأدنى للشحن المجاني في قطر؟',
      question_en: 'What is the minimum order for free shipping in Qatar?',
      answer_ar: 'الشحن مجاني للطلبات فوق 150 ريال قطري في الدوحة. التوصيل خلال 1-2 يوم عمل.',
      answer_en: 'Free shipping for orders above 150 QAR in Doha. Delivery within 1-2 business days.',
      order: 2
    },
    payment: {
      question_ar: 'ما هي طرق الدفع المتاحة في قطر؟',
      question_en: 'What payment methods are available in Qatar?',
      answer_ar: 'نقبل: فيزا، ماستركارد، Apple Pay، الدفع عند الاستلام في معظم المناطق.',
      answer_en: 'We accept: Visa, Mastercard, Apple Pay, Cash on Delivery in most areas.',
      order: 7
    }
  },

  // Kuwait (KW)
  KW: {
    freeShipping: {
      question_ar: 'ما هو الحد الأدنى للشحن المجاني في الكويت؟',
      question_en: 'What is the minimum order for free shipping in Kuwait?',
      answer_ar: 'الشحن مجاني للطلبات فوق 10 دينار كويتي. التوصيل خلال 1-3 أيام عمل.',
      answer_en: 'Free shipping for orders above 10 KWD. Delivery within 1-3 business days.',
      order: 2
    },
    payment: {
      question_ar: 'ما هي طرق الدفع المتاحة في الكويت؟',
      question_en: 'What payment methods are available in Kuwait?',
      answer_ar: 'نقبل: K-Net، فيزا، ماستركارد، Apple Pay، الدفع عند الاستلام.',
      answer_en: 'We accept: K-Net, Visa, Mastercard, Apple Pay, Cash on Delivery.',
      order: 7
    }
  },

  // Oman (OM)
  OM: {
    freeShipping: {
      question_ar: 'ما هو الحد الأدنى للشحن المجاني في عمان؟',
      question_en: 'What is the minimum order for free shipping in Oman?',
      answer_ar: 'الشحن مجاني للطلبات فوق 15 ريال عماني في مسقط. التوصيل خلال 2-4 أيام عمل.',
      answer_en: 'Free shipping for orders above 15 OMR in Muscat. Delivery within 2-4 business days.',
      order: 2
    },
    payment: {
      question_ar: 'ما هي طرق الدفع المتاحة في عمان؟',
      question_en: 'What payment methods are available in Oman?',
      answer_ar: 'نقبل: فيزا، ماستركارد، Apple Pay، الدفع عند الاستلام.',
      answer_en: 'We accept: Visa, Mastercard, Apple Pay, Cash on Delivery.',
      order: 7
    }
  }
};

// Generic FAQs (same across all countries)
const GENERIC_FAQS = {
  howToUse: {
    question_ar: 'كيف أستخدم كود الخصم؟',
    question_en: 'How do I use the discount code?',
    answer_ar: 'انسخ كود الخصم، ثم اضغط على "تفعيل الكود" للانتقال إلى المتجر. أضف المنتجات لسلة التسوق، وألصق الكود في خانة "كود الخصم" عند الدفع.',
    answer_en: 'Copy the discount code, then click "Activate Code" to visit the store. Add products to your cart, and paste the code in the "Discount Code" field at checkout.',
    order: 1
  },
  returns: {
    question_ar: 'ما هي سياسة الاسترجاع؟',
    question_en: 'What is the return policy?',
    answer_ar: 'معظم المتاجر تقدم إرجاع مجاني خلال 14-30 يوم من الاستلام. يجب أن تكون المنتجات في حالتها الأصلية مع الفاتورة.',
    answer_en: 'Most stores offer free returns within 14-30 days of receipt. Products must be in original condition with receipt.',
    order: 3
  },
  codeValidity: {
    question_ar: 'هل الأكواد صالحة دائماً؟',
    question_en: 'Are the codes always valid?',
    answer_ar: 'نحدّث الأكواد باستمرار، لكن قد تنتهي صلاحية بعضها مبكراً. تحقق من تاريخ الانتهاء قبل التطبيق.',
    answer_en: 'We update codes regularly, but some may expire early. Check the expiry date before applying.',
    order: 4
  },
  appVsWebsite: {
    question_ar: 'هل يمكن استخدام الكود في التطبيق؟',
    question_en: 'Can I use the code in the app?',
    answer_ar: 'معظم الأكواد تعمل على الموقع والتطبيق. إذا لم يعمل الكود في التطبيق، جرب استخدامه عبر المتصفح.',
    answer_en: 'Most codes work on both website and app. If a code doesn\'t work in the app, try using it through the browser.',
    order: 5
  },
  multipleCodes: {
    question_ar: 'هل يمكن استخدام أكثر من كود في نفس الطلب؟',
    question_en: 'Can I use multiple codes on the same order?',
    answer_ar: 'عادةً لا يمكن الجمع بين أكثر من كود خصم في طلب واحد. استخدم الكود الذي يوفر لك أكبر خصم.',
    answer_en: 'Usually you cannot combine multiple discount codes in one order. Use the code that gives you the biggest discount.',
    order: 6
  },
  support: {
    question_ar: 'كيف أتواصل مع خدمة العملاء؟',
    question_en: 'How do I contact customer service?',
    answer_ar: 'يمكنك التواصل عبر الدردشة المباشرة على الموقع أو البريد الإلكتروني. أوقات العمل عادةً من 9 صباحاً حتى 9 مساءً.',
    answer_en: 'You can contact via live chat on the website or email. Business hours are typically 9 AM to 9 PM.',
    order: 8
  }
};

async function seedStoreFAQs() {
  console.log('🌱 Seeding Country-Specific Store FAQs...\n');

  // Get all countries
  const countries = await prisma.country.findMany({
    where: { isActive: true }
  });

  if (countries.length === 0) {
    console.log('❌ No countries found. Please seed countries first.');
    return;
  }

  console.log(`📍 Found ${countries.length} countries\n`);

  let totalFAQs = 0;

  for (const country of countries) {
    console.log(`\n🏳️ Processing ${country.name_en} (${country.code})...`);

    // Get stores available in this country
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        countries: {
          some: {
            countryId: country.id
          }
        }
      },
      select: { id: true, name: true, slug: true }
    });

    console.log(`   Found ${stores.length} stores in ${country.name_en}`);

    for (const store of stores) {
      // Combine country-specific and generic FAQs
      const countryFAQs = FAQ_TEMPLATES_BY_COUNTRY[country.code] || {};
      const allFAQs = { ...GENERIC_FAQS, ...countryFAQs };

      // Select 5-7 FAQs for this store in this country
      const numFAQs = Math.floor(Math.random() * 3) + 5;
      const faqKeys = Object.keys(allFAQs);
      const selectedKeys = faqKeys
        .sort(() => 0.5 - Math.random())
        .slice(0, numFAQs);

      const storeFAQs = selectedKeys.map((key, index) => {
        const template = allFAQs[key];
        return {
          storeId: store.id,
          countryId: country.id,
          question_ar: template.question_ar,
          question_en: template.question_en,
          answer_ar: template.answer_ar,
          answer_en: template.answer_en,
          order: index + 1,
          isActive: true
        };
      });

      await prisma.storeFAQ.createMany({
        data: storeFAQs,
        skipDuplicates: true
      });

      totalFAQs += storeFAQs.length;
      console.log(`   ✓ ${store.name}: ${storeFAQs.length} FAQs`);
    }
  }

  console.log(`\n✅ Created ${totalFAQs} country-specific FAQs\n`);
}

// Run seed
seedStoreFAQs()
  .catch((e) => {
    console.error('❌ FAQ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });