// app/[locale]/privacy/page.js
import "../static-pages.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isArabic = locale.startsWith("ar");

  return {
    title: isArabic ? "سياسة الخصوصية - كوبونات" : "Privacy Policy - Cobonat",
    description: isArabic
      ? "اقرأ سياسة الخصوصية الخاصة بـ كوبونات لفهم كيف نجمع ونستخدم بياناتك."
      : "Read Cobonat's privacy policy to understand how we collect, use, and protect your data.",
    alternates: { 
      canonical: `${BASE_URL}/${locale}/privacy`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/privacy`,
        'en-SA': `${BASE_URL}/en-SA/privacy`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage({ params }) {
  const { locale } = await params;
  const isArabic = locale.startsWith("ar");
  const ar = isArabic;

  return (
    <div className="static-page-wrapper">
      {/* Hero */}
      <div className="static-page-hero">
        <div className="hero-icon">
          <span className="material-symbols-sharp">shield_locked</span>
        </div>
        <h1>{ar ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
        <p>
          {ar
            ? "نلتزم بحماية خصوصيتك. تعرّف على كيفية جمع واستخدم بياناتك."
            : "We are committed to protecting your privacy. Learn how we collect and use your data."}
        </p>
      </div>

      {/* Body */}
      <div className="static-page-content">
        <div className="last-updated">
          <span className="material-symbols-sharp">schedule</span>
          {ar ? "آخر تحديث: يناير 2025" : "Last updated: January 2025"}
        </div>

        {/* 1. Introduction */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">info</span>
            {ar ? "المقدمة" : "Introduction"}
          </h2>
          <p>
            {ar
              ? "شركة كوبونات (\"نحن\", \"الشركة\") تحترم خصوصيتك وتلتزم بحمايتها. تحكم هذه السياسة كيفية جمعنا واستخدامنا وحفظنا للمعلومات الشخصية التي تزودنا بها عند استخدامك لموقعنا وتطبيقاتنا."
              : "Cobonat (\"we\", \"the company\") respects your privacy and is committed to protecting it. This policy governs how we collect, use, and store personal information you provide when using our website and applications."}
          </p>
        </div>

        {/* 2. Data We Collect */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">database</span>
            {ar ? "البيانات التي نجمعها" : "Data We Collect"}
          </h2>
          <p>
            {ar
              ? "قد نجمع أنواعًا مختلفة من البيانات الشخصية، بما في ذلك:"
              : "We may collect various types of personal data, including:"}
          </p>
          <ul>
            <li>{ar ? "عنوان البريد الإلكتروني وكلمة المرور عند إنشاء حساب" : "Email address and password when creating an account"}</li>
            <li>{ar ? "اسم المستخدم وصورة الملف الشخصي (إن كانت)" : "Username and profile picture (if provided)"}</li>
            <li>{ar ? "بيانات الاستخدام مثل الصفحات المزورة والكوبونات التي تم نسخها" : "Usage data such as pages visited and coupons copied"}</li>
            <li>{ar ? "عنوان IP والموقع الجغرافي العام للجهاز" : "IP address and general geolocation of your device"}</li>
            <li>{ar ? "نوع الجهاز والمتصفح والنظام" : "Device type, browser, and operating system"}</li>
            <li>{ar ? "إعداد اللغة والمنطقة المختار" : "Selected language and region settings"}</li>
          </ul>
        </div>

        {/* 3. How We Use */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">settings</span>
            {ar ? "كيف نستخدم البيانات" : "How We Use Your Data"}
          </h2>
          <p>
            {ar
              ? "نستخدم البيانات التي نجمعها للأغراض التالية:"
              : "We use the data we collect for the following purposes:"}
          </p>
          <ul>
            <li>{ar ? "تقديم خدمات الموقع والكوبونات والعروض" : "Providing website services, coupons, and deals"}</li>
            <li>{ar ? "تخصيص تجربة المستخدم وعرض العروض ذات الصلة" : "Personalising the user experience and showing relevant offers"}</li>
            <li>{ar ? "تحليل الأنماط لتحسين الخدمة" : "Analysing patterns to improve the service"}</li>
            <li>{ar ? "إرسال إشعارات مهمة مرتبطة بالخدمة (إذا وافقت)" : "Sending important service-related notifications (if you opt in)"}</li>
            <li>{ar ? "الامتثال للالتزامات القانونية والتنظيمية" : "Complying with legal and regulatory obligations"}</li>
          </ul>
        </div>

        {/* 4. Storage & Security */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">lock</span>
            {ar ? "الحفظ والأمان" : "Storage & Security"}
          </h2>
          <p>
            {ar
              ? "نحفظ بياناتك على خوادم آمنة ومحمية بالتشفير (SSL/TLS). نطبّق ممارسات أمنية متعارف عليها في الصناعة مثل تشفير كلمات المرور وحماية الوصول إلى قواعد البيانات."
              : "We store your data on secure servers protected by encryption (SSL/TLS). We apply industry-standard security practices including password hashing and database access controls."}
          </p>
          <p>
            {ar
              ? "لا يمكننا ضمان أمان كامل للنقل عبر الإنترنت. لذلك نوصيك بعدم مشاركة كلمات المرور الحساسة مع أي طرف آخر."
              : "We cannot guarantee complete security of data transmission over the internet. Therefore, we advise you not to share sensitive passwords with any third party."}
          </p>
        </div>

        {/* 5. Third Parties */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">public</span>
            {ar ? "الأطراف الثالثة" : "Third Parties"}
          </h2>
          <p>
            {ar
              ? "قد نشارك بياناتك مع أطراف ثالثة في الحالات التالية فقط:"
              : "We may share your data with third parties only in the following cases:"}
          </p>
          <ul>
            <li>{ar ? "مزودي الخدمات الذين يساعدون في تشغيل الموقع (مثل البنية التحتية السحابية)" : "Service providers who help operate the website (e.g., cloud infrastructure)"}</li>
            <li>{ar ? "شركاء التحليل للأغراض المجهولة والإجمالية فقط" : "Analytics partners for anonymous and aggregated purposes only"}</li>
            <li>{ar ? "عند كان ذلك مطلوبًا بموجب القانون" : "When required by law"}</li>
          </ul>
          <p>
            {ar
              ? "لا نبيع بياناتك الشخصية لأطراف ثالثة لأغراض تجارية."
              : "We do not sell your personal data to third parties for commercial purposes."}
          </p>
        </div>

        {/* 6. Your Rights */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">verified_user</span>
            {ar ? "حقوقك" : "Your Rights"}
          </h2>
          <p>
            {ar
              ? "لديك الحق في:"
              : "You have the right to:"}
          </p>
          <ul>
            <li>{ar ? "الوصول إلى البيانات الشخصية التي نحتفظ بها عنك" : "Access the personal data we hold about you"}</li>
            <li>{ar ? "تصحيح أي بيانات غير دقيقة" : "Correct any inaccurate data"}</li>
            <li>{ar ? "طلب حذف بياناتك الشخصية (مع مراعاة الالتزامات القانونية)" : "Request deletion of your personal data (subject to legal obligations)"}</li>
            <li>{ar ? "إلغاء الاشتراك من الإشعارات التسويقية في أي وقت" : "Unsubscribe from marketing notifications at any time"}</li>
          </ul>
          <p>
            {ar
              ? "للممارسة أيٍّ من هذه الحقوق، تواصل معنا عبر البريد الإلكتروني: contact@cobonat.me"
              : "To exercise any of these rights, contact us via email: contact@cobonat.me"}
          </p>
        </div>

        {/* 7. Changes */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">update</span>
            {ar ? "التعديلات على السياسة" : "Changes to This Policy"}
          </h2>
          <p>
            {ar
              ? "قد نحدّث هذه السياسة من وقت لآخر. سيتم نشر أي تغيرات مهمة على هذه الصفحة. استمرارك في استخدام الموقع بعد نشر التعديلات يعني قبولك لها."
              : "We may update this policy from time to time. Any significant changes will be published on this page. Your continued use of the site after changes are posted constitutes acceptance of them."}
          </p>
        </div>
      </div>
    </div>
  );
}
