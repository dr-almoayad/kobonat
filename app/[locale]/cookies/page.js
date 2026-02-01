// app/[locale]/cookies/page.js
import "../../../app/[locale]/static-pages.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isArabic = locale.startsWith("ar");

  return {
    title: isArabic ? "سياسة الكوكيز - كوبونات" : "Cookies Policy - Cobonat",
    description: isArabic
      ? "اعرف كيف يستخدم كوبونات الكوكيز وكيف يمكنك التحكم بها."
      : "Learn how Cobonat uses cookies and how you can control them.",
    alternates: { canonical: `/${locale}/cookies` },
    robots: { index: true, follow: true },
  };
}

export default async function CookiesPage({ params }) {
  const { locale } = await params;
  const ar = locale.startsWith("ar");

  return (
    <div className="static-page-wrapper">
      {/* Hero */}
      <div className="static-page-hero">
        <div className="hero-icon">
          <span className="material-symbols-sharp">cookie</span>
        </div>
        <h1>{ar ? "سياسة الكوكيز" : "Cookies Policy"}</h1>
        <p>
          {ar
            ? "نستخدم الكوكيز لتحسين تجربتك على الموقع. اعرف المزيد عن استخدامها."
            : "We use cookies to improve your experience on our site. Learn more about how we use them."}
        </p>
      </div>

      {/* Body */}
      <div className="static-page-content">
        <div className="last-updated">
          <span className="material-symbols-sharp">schedule</span>
          {ar ? "آخر تحديث: يناير 2025" : "Last updated: January 2025"}
        </div>

        {/* 1. What Are Cookies */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">help</span>
            {ar ? "ما هي الكوكيز؟" : "What Are Cookies?"}
          </h2>
          <p>
            {ar
              ? "الكوكيز هي ملفات نصية صغيرة يتم حفظها على جهازك عند زيارة موقع إلكتروني. تُستخدم لحفظ المعلومات وتحسين تجربة التصفح وتخصيص المحتوى."
              : "Cookies are small text files stored on your device when you visit a website. They are used to save information, improve the browsing experience, and personalise content."}
          </p>
        </div>

        {/* 2. How We Use */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">settings</span>
            {ar ? "كيف نستخدم الكوكيز؟" : "How Do We Use Cookies?"}
          </h2>
          <p>
            {ar
              ? "نستخدم الكوكيز لأغراض متعددة، بما فيها تحسين أدائ الموقع، وحفظ تفضيلات المستخدم، وتحليل حركة المرور."
              : "We use cookies for multiple purposes, including improving site performance, saving user preferences, and analysing traffic patterns."}
          </p>
        </div>

        {/* 3. Cookie Types */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">category</span>
            {ar ? "أنواع الكوكيز التي نستخدمها" : "Types of Cookies We Use"}
          </h2>

          {/* Essential */}
          <h3>{ar ? "🔒 الكوكيز الأساسية" : "🔒 Essential Cookies"}</h3>
          <p>
            {ar
              ? "هذه الكوكيز ضروري لعمل الموقع بشكل صحيح. تشمل كوكيز الجلسة والكوكيز المتعلقة بالتحقق من الهوية والأمان. لا يمكن تعطيلها."
              : "These cookies are necessary for the website to function correctly. They include session cookies and authentication/security cookies. They cannot be disabled."}
          </p>

          {/* Preference */}
          <h3>{ar ? "⚙️ كوكيز التفضيلات" : "⚙️ Preference Cookies"}</h3>
          <p>
            {ar
              ? "تحفظ إعدادات المستخدم مثل اللغة والمنطقة والدولة المختارة حتى يتسنى لك العودة دون إعادة الإدخال كل مرة."
              : "These save your settings such as selected language, region, and country so you don't have to re-enter them on every visit."}
          </p>

          {/* Analytics */}
          <h3>{ar ? "📊 كوكيز التحليل" : "📊 Analytics Cookies"}</h3>
          <p>
            {ar
              ? "تساعدنا على فهم كيف يتفاعل المستخدمون مع الموقع. البيانات المجمعة مجهولة الهوية ولا تحتوي على معلومات شخصية قابلة للتعرف."
              : "These help us understand how users interact with the site. Collected data is anonymised and does not contain personally identifiable information."}
          </p>

          {/* Marketing */}
          <h3>{ar ? "📣 كوكيز التسويق" : "📣 Marketing Cookies"}</h3>
          <p>
            {ar
              ? "قد تستخدم هذه الكوكيز لعرض إعلانات ذات صلة أو لقياس فعالية الحملات التسويقية. نستخدمها فقط بموافقة مسبقة منك."
              : "These cookies may be used to display relevant ads or measure marketing campaign effectiveness. We use them only with your prior consent."}
          </p>
        </div>

        {/* 4. Third-Party */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">public</span>
            {ar ? "كوكيز الأطراف الثالثة" : "Third-Party Cookies"}
          </h2>
          <p>
            {ar
              ? "قد يضع بعض الخدمات الخارجية التي نعتمد عليها كوكيزها الخاصة، مثل خدمات التحليل والإعلانات. تخضع هذه الكوكيز لسياسات الخصوصية الخاصة بكل خدمة على حدة."
              : "Some third-party services we rely on may place their own cookies, such as analytics and advertising services. These cookies are governed by the privacy policies of each respective service."}
          </p>
        </div>

        {/* 5. Managing Cookies */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">tune</span>
            {ar ? "إدارة الكوكيز" : "Managing Cookies"}
          </h2>
          <p>
            {ar
              ? "يمكنك التحكم في الكوكيز من خلال إعدادات متصفحك. معظم المتصفحات تتيح لك حذف الكوكيز الموجودة وحجب وصول المواقع إلى وضع كوكيز جديدة. راجع وثائق متصفحك للمزيد من التفاصيل."
              : "You can control cookies through your browser settings. Most browsers allow you to delete existing cookies and block websites from setting new ones. Refer to your browser's documentation for more details."}
          </p>
          <p>
            {ar
              ? "تجدر الإشارة إلى أن حجب بعض الكوكيز قد يؤثر على أداء الموقع وتجربة المستخدم."
              : "Please note that blocking some cookies may affect the performance of the site and user experience."}
          </p>
        </div>

        {/* 6. Changes */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">update</span>
            {ar ? "التعديلات" : "Changes"}
          </h2>
          <p>
            {ar
              ? "قد نحدّث هذه السياسة في أي وقت. سيتم نشر أي تغيرات على هذه الصفحة. استمرارك في استخدام الموقع يعني موافقتك على السياسة المحدّثة."
              : "We may update this policy at any time. Any changes will be published on this page. Your continued use of the site means you agree to the updated policy."}
          </p>
        </div>
      </div>
    </div>
  );
}
