// app/[locale]/help/page.js
import "../../../app/[locale]/static-pages.css";
import HelpAccordion from "@/components/help/HelpAccordion";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isArabic = locale.startsWith("ar");

  return {
    title: isArabic ? "مركز المساعدة - كوبونات" : "Help Center - Cobonat",
    description: isArabic
      ? "اعثر على إجابات لأسئلتك حول الكوبونات والعروض والمشاكل الشائعة."
      : "Find answers to your questions about coupons, deals, and common issues.",
    alternates: { 
      canonical: `${BASE_URL}/${locale}/help`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/help`,
        'en-SA': `${BASE_URL}/en-SA/help`,
        'x-default': `${BASE_URL}/ar-SA/help`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function HelpPage({ params }) {
  const { locale } = await params;
  const ar = locale.startsWith("ar");

  // ─────────────────────────────────────────────────────────
  // All topic & item data lives here so the server renders
  // everything in one shot — zero client fetches needed.
  // ─────────────────────────────────────────────────────────
  const topics = [
    /* ━━━ 1. Coupon Codes ━━━ */
    {
      id: "codes",
      label: ar ? "كوبونات" : "Coupon Codes",
      allLabel: ar ? "الكل" : "All",
      icon: "confirmation_number",
      items: [
        {
          id: "codes-how",
          question: ar ? "كيف أستخدم كود الخصم من Cobonat؟" : "How do I use a coupon code from Cobonat?",
          answer: ar
            ? "انقر على زر \"نسخ الكود\" الذي يظهر على كل كوبون. وسيتم نسخ الكود تلقائيًا. بعد ذلك، انتقل إلى المتجر وأدخل الكود في المكان المخصص عند اتمام عملية الدفع. تأكد من أن قيمة سلة التسوق تلبي الحد الأدنى للكوبون -ان وجد- حسب شروط المتجر."
            : "Click the \"Copy Code\" button shown on the coupon card. The code will automatically be copied to your clipboard. Go to the store's website, add items to your cart, and paste the code into the discount or promo-code field at checkout. Make sure your cart meets any minimum spend the coupon requires."
        },
        {
          id: "codes-not-working",
          question: ar ? "كود الخصم لا يعمل، ماذا أفعل؟" : "The coupon code isn't working — what should I do?",
          answer: ar
            ? "هناك عدة أسباب محتملة: (1) انتهت صلاحية الكوبون — تحقق من تاريخ الانتهاء. (2) الكوبون مخصص لمنتجات أو فئات بعينها فقط. (3) لم يتم تحقيق الحد الأدنى للإنفاق. (4) يجوز أن يكون الكوبون حصريًا لمستخدم واحد فقط. إذا استمر الخطأ، تواصل معنا عبر contact@cobonat.me وسنحقق في الأمر."
            : "There are several possible reasons: (1) The coupon has expired — check the expiry date shown on the card. (2) The coupon is valid only for specific products or categories. (3) The minimum spend requirement hasn't been met. (4) The coupon may be a one-time or single-use code that has already been redeemed. If the issue persists, let us know at contact@cobonat.me and we'll look into it."
        },
        {
          id: "codes-one-time",
          question: ar ? "هل يمكنني استخدام كوبون أكثر من مرة؟" : "Can I use a coupon more than once?",
          answer: ar
            ? "يعتمد ذلك على المتجر والكوبون نفسه. بعض الكوبونات مخصصة للاستخدام مرة واحدة فقط، والبعض الآخر يمكن استخدامه عدة مرات حتى انتهاء صلاحيته. قد يوجد نص صغير على البطاقة يوضح ذلك. وإن كان غير واضح، تحقق من شروط المتجر الأصلي."
            : "It depends on the store and the specific coupon. Some coupons are single-use only, while others can be used multiple times until they expire. There may be a small note on the coupon card clarifying this. If it's unclear, check the terms on the store's own website."
        },
        {
          id: "codes-exclusive",
          question: ar ? "ما معنى كوبون \"حصري\"؟" : "What does an \"Exclusive\" coupon mean?",
          answer: ar
            ? "الكوبونات الحصرية هي عروض لا تجدها في أي مكان آخر غير كوبونات. قد تكون صالحة لفترة محدودة أو مخصصة لعدد محدود من المستخدمين، لذا يُنصح باستخدامها في أقرب وقت ممكن."
            : "Exclusive coupons are offers you won't find anywhere else besides Cobonat. They may be available for a limited time or for a limited number of users, so we recommend using them as soon as possible."
        }
      ]
    },

    /* ━━━ 2. Deals & Offers ━━━ */
    {
      id: "deals",
      label: ar ? "العروض والصفقات" : "Deals & Offers",
      allLabel: ar ? "الكل" : "All",
      icon: "local_offer",
      items: [
        {
          id: "deals-difference",
          question: ar ? "ما الفرق بين الكوبون والصفقة؟" : "What's the difference between a coupon and a deal?",
          answer: ar
            ? "الكوبون هو كود نصي يجب إدخاله يدويًا في حقل الخصم عند الدفع. أما الصفقة فهي عرض يُطبَّق تلقائيًا عند فتح الرابط. كلاهما يوفر لك خصومات وعروض حقيقية على متاجر فعلية."
            : "A coupon is a text code you type manually into the discount field at checkout. A deal is an offer that is applied automatically when you click the link — no code needed. Both give you real discounts on real stores."
        },
        {
          id: "deals-activate",
          question: ar ? "كيف أفعّل صفقة أو عرض؟" : "How do I activate a deal or offer?",
          answer: ar
            ? "انقر على زر \"تفعيل العرض\" الذي يظهر على البطاقة. سيُفتح موقع المتجر في نافذة جديدة مع تطبيق العرض تلقائيًا. تأكد من إتمام عملية الشراء في نفس الجلسة لأن بعض العروض مرتبطة بالجلسة فقط."
            : "Click the \"Get Deal\" button shown on the card. The store's website will open in a new tab with the offer already applied. Make sure to complete your purchase in the same session, as some deals are session-based only."
        },
        {
          id: "deals-free-shipping",
          question: ar ? "كيف أستفيد من عروض التوصيل المجاني؟" : "How do I take advantage of free-shipping offers?",
          answer: ar
            ? "عروض التوصيل المجاني تعمل بنفس طريقة الصفقات: انقر على زر \"تفعيل العرض\". في بعض الحالات، قد يكون هناك حد أدنى للقيمة الإجمالية للطلب للحصول على التوصيل المجاني، وهذا الحد يحدده المتجر نفسه."
            : "Free-shipping offers work the same way as deals: click \"Get Deal\". In some cases there may be a minimum order value to qualify for free shipping — this minimum is set by the store itself."
        },
        {
          id: "deals-expired",
          question: ar ? "ماذا أفعل إذا كان العرض منتهيًا؟" : "What if the deal has already expired?",
          answer: ar
            ? "الصفقات المنتهية تظل معروضة أحيانًا لأسباب إحصائية. نحن نحدّث قوائمنا باستمرار، لكن يمكنك إبلاغنا عن أي صفقة منتهية عبر contact@cobonat.me."
            : "Expired deals sometimes remain visible for statistical reasons. If you try to open a deal and get an error or the discount isn't applied, it means it has expired. We update our listings regularly, but you can report any expired deal to us at contact@cobonat.me."
        }
      ]
    },

    /* ━━━ 3. Stores ━━━ */
    {
      id: "stores",
      label: ar ? "المتاجر" : "Stores",
      allLabel: ar ? "الكل" : "All",
      icon: "storefront",
      items: [
        {
          id: "stores-find",
          question: ar ? "كيف أبحث عن متجر بعينه؟" : "How do I find a specific store?",
          answer: ar
            ? "استخدم شريط البحث في أعلى الصفحة وأدخل اسم المتجر. ستظهر نتائج فورية تشمل المتاجر والكوبونات والصفقات المرتبطة. يمكنك أيضًا تصفح المتاجر بحسب الفئة من خلال شريط الفئات أعلى الصفحة أو عبر صفحة المتاجر."
            : "Use the search bar at the top of the page and type the store name. Instant results will appear showing matching stores, coupons, and deals. You can also browse stores by category using the tabs on top of the page or the stores page."
        },
        {
          id: "stores-missing",
          question: ar ? "المتجر الذي أبحث عنه غير موجود، كيف أقترحه؟" : "The store I'm looking for isn't listed — how do I suggest it?",
          answer: ar
            ? "نسعى باستمرار لإضافة متاجر جديدة. أرسل لنا اسم المتجر ورابطه الرسمي عبر البريد الإلكتروني contact@cobonat.me وسنسعى لإضافته في أقرب وقت."
            : "We continuously work on adding new stores. Send us the store name and its official URL via email at contact@cobonat.me and we'll work on adding it as soon as possible."
        },
        {
          id: "stores-country",
          question: ar ? "لماذا لا أرى كوبونات لمتجر في منطقتي؟" : "Why don't I see coupons for a store in my region?",
          answer: ar
            ? "بعض المتاجر والكوبونات مخصصة لدول أو مناطق بعينها فقط. كوبونات يصنّف المحتوى حسب البلد والعملة التي اخترتها. تأكد من أن إعدادات البلد الصحيحة مختارة في أعلى يمين الصفحة. إذا كانت العروض غائبة، تواصل معنا لإبلاغنا."
            : "Some stores and coupons are exclusive to specific countries or regions. Cobonat filters content based on the country and currency you've selected. Make sure the correct country setting is chosen in the top-right corner. If many offers seem to be missing, reach out to us so we can look into it."
        }
      ]
    },

    /* ━━━ 4. Accounts ━━━ */
    {
      id: "accounts",
      label: ar ? "الحسابات" : "Accounts",
      allLabel: ar ? "الكل" : "All",
      icon: "person",
      items: [
        {
          id: "accounts-create",
          question: ar ? "كيف أنشئ حسابًا؟" : "How do I create an account?",
          answer: ar
            ? "في الوقت الحالي يمكنك استخدام كوبونات دون إنشاء حساب. إذا كانت ميزات إضافية كالحفظ والإشعارات متاحة، فسيظهر زر \"تسجيل الدخول\" في الرأس. اتبع الخطوات المعروضة وأدخل بريدك الإلكتروني وكلمة المرور."
            : "Currently you can use Cobonat without creating an account. If additional features like saving and notifications become available, a \"Sign In\" button will appear in the header. Follow the steps shown and enter your email and password."
        },
        {
          id: "accounts-password",
          question: ar ? "نسيت كلمة المرور، كيف أستعيدها؟" : "I forgot my password — how do I reset it?",
          answer: ar
            ? "انقر على \"تسجيل الدخول\" ثم اختر \"نسيت كلمة المرور\". أدخل البريد الإلكتروني المرتبط بحسابك وستصل رسالة بإعادة تعيين كلمة المرور. إذا لم تصل الرسالة خلال دقائق، تحقق من مجلد البريد غير الهام أو تواصل معنا."
            : "Click \"Sign In\" then select \"Forgot Password\". Enter the email linked to your account and you'll receive a password-reset email. If the email doesn't arrive within a few minutes, check your spam folder or contact us."
        },
        {
          id: "accounts-delete",
          question: ar ? "كيف أحذف حساباتي بشكل كامل؟" : "How do I permanently delete my account?",
          answer: ar
            ? "تواصل معنا عبر البريد الإلكتروني contact@cobonat.me وأخبرنا أنك تريد حذف حسابك. سنعالج الطلب خلال 48 ساعة بعد التحقق من هويتك."
            : "Contact us via email at contact@cobonat.me and let us know you'd like to delete your account. We'll process the request within 48 hours after verifying your identity."
        }
      ]
    },

    /* ━━━ 5. Region & Currency ━━━ */
    {
      id: "region",
      label: ar ? "المنطقة والعملة" : "Region & Currency",
      allLabel: ar ? "الكل" : "All",
      icon: "public",
      items: [
        {
          id: "region-change",
          question: ar ? "كيف أغيّر البلد والعملة؟" : "How do I change my country and currency?",
          answer: ar
            ? "انقر على زر اللغة والمنطقة في أعلى يمين الصفحة (أو أعلى يسار إذا كانت اللغة العربية). ستظهر قائمة بالبلدان المتاحة والعملات، اختر الخيار الذي يناسبك."
            : "Click the language and region button in the top-right corner of the page (or top-left if the language is Arabic). A list of available countries and currencies will appear — choose the one that suits you."
        },
        {
          id: "region-language",
          question: ar ? "كيف أغيّر اللغة؟" : "How do I switch the language?",
          answer: ar
            ? "في نفس القائمة المذكورة أعلاه (زر المنطقة), ستجد قسمًا للغات المتاحة. اختر العربية أو الإنجليزية وسيتحوّل الموقع بالكامل فورًا."
            : "In the same region menu mentioned above, you'll find a section for available languages. Choose Arabic or English and the entire site will switch immediately."
        },
        {
          id: "region-why-missing",
          question: ar ? "لماذا بعض المتاجر والكوبونات غير متاحة في بلدي؟" : "Why are some stores and coupons unavailable in my country?",
          answer: ar
            ? "المتاجر والكوبونات مرتبطة بدول وعملات بعينها بسبب قيود المتاجر نفسها أو شروط التوزيع. كوبونات يعرض فقط الكوبونات التي تنطبق فعلًا على منطقتك."
            : "Stores and coupons are tied to specific countries and currencies due to restrictions imposed by the stores themselves or distribution terms. Cobonat only shows coupons that genuinely apply to your region."
        }
      ]
    },

    /* ━━━ 6. Technical Issues ━━━ */
    {
      id: "technical",
      label: ar ? "مشاكل تقنية" : "Technical Issues",
      allLabel: ar ? "الكل" : "All",
      icon: "settings",
      items: [
        {
          id: "tech-slow",
          question: ar ? "الموقع بطيء أو لا يعمل بسرعة كافية" : "The site is slow or not loading fast enough",
          answer: ar
            ? "حاول تحديث الصفحة، وإذا استمر البطء فحاول مسح ذاكرة التخزين المؤقت للمتصفح (Cache). يمكنك أيضًا محاولة فتح الموقع بمتصفح آخر أو وضع التصفح الخاص. إذا استمر الخطأ، أخبرنا عبر contact@cobonat.me."
            : "Try refreshing the page. If it's still slow, clear your browser cache and cookies. You can also try opening the site in a different browser or in private/incognito mode. If the problem persists, let us know at contact@cobonat.me."
        },
        {
          id: "tech-display",
          question: ar ? "المحتوى لا يعمل أو يظهر بشكل غير صحيح" : "Content isn't loading or is displaying incorrectly",
          answer: ar
            ? "قد يكون هذا بسبب متصفح قديم. حاول تحديث متصفحك إلى الإصدار الأخير. كما يُنصح بالتأكد من أن اتصالك بالإنترنت مستقر. إذا كان المشكلة متكررة على جهاز بعينه فقط، حاول فتح الموقع على جهاز آخر للتأكد."
            : "This may be caused by an outdated browser. Try updating your browser to the latest version. Also make sure your internet connection is stable. If the issue only happens on one device, try opening the site on another device to confirm."
        },
        {
          id: "tech-mobile",
          question: ar ? "الموقع لا يعمل بشكل صحيح على هاتفي" : "The site doesn't work correctly on my phone",
          answer: ar
            ? "كوبونات مُصمَّم ليعمل بسلاسة على الأجهزة المحمولة. إذا كان هناك تحديد في الأداء، حاول تحديث متصفح الهاتف. كما يمكنك تجربة استخدام متصفح آخر مثل Chrome أو Safari. أخبرنا عن أي مشاكل محددة وسنحقق فيها."
            : "Cobonat is designed to work smoothly on mobile devices. If there's an issue, try updating your phone's browser. You can also try using a different browser like Chrome or Safari. Let us know about any specific problems and we'll investigate."
        },
        {
          id: "tech-report",
          question: ar ? "كيف أبلّغ عن خطأ تقني؟" : "How do I report a technical bug?",
          answer: ar
            ? "أرسل لنا بريدًا إلكترونيًا على contact@cobonat.me ضمّنه: (1) وصف المشكلة بدقة، (2) اسم المتصفح والجهاز الذي استخدمته، (3) صورة شاشة إن أمكن. سيساعدنا ذلك على حل المشكلة بسرعة أكبر."
            : "Send us an email at contact@cobonat.me and include: (1) a clear description of the issue, (2) the name of your browser and device, (3) a screenshot if possible. This will help us resolve the problem faster."
        }
      ]
    }
  ];

  return (
    <div className="static-page-wrapper">
      {/* Hero */}
      <div className="static-page-hero">
        <div className="hero-icon">
          <span className="material-symbols-sharp">help</span>
        </div>
        <h1>{ar ? "مركز المساعدة" : "Help Center"}</h1>
        <p>
          {ar
            ? " اعثر على إجابات لأسئلتك الأكثر شيوعًا حول الكوبونات والعروض على Cobonat."
            : "Find answers to your most common questions about coupons and deals on Cobonat."}
        </p>
      </div>

      {/* Body */}
      <div className="static-page-content">
        {/* Client accordion — receives all data, renders tabs + expand/collapse */}
        <HelpAccordion topics={topics} />

        {/* Still stuck? */}
        <div className="help-still-stuck">
          <div className="stuck-icon">
            <span className="material-symbols-sharp">support_agent</span>
          </div>
          <h3>{ar ? "لم تجد إجابة؟" : "Still can't find an answer?"}</h3>
          <p>
            {ar
              ? "لا تقلق، فريقنا مستعد لمساعدتك. تواصل معنا مباشرة."
              : "Don't worry — our team is ready to help. Reach out to us directly."}
          </p>
          <a href={`/${locale}/contact`}>
            <span className="material-symbols-sharp">mail</span>
            {ar ? "تواصل معنا" : "Contact Us"}
          </a>
        </div>
      </div>
    </div>
  );
}
