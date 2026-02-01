// app/[locale]/terms/page.js
import "../../../app/[locale]/static-pages.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isArabic = locale.startsWith("ar");

  return {
    title: isArabic ? "شروط الخدمة - كوبونات" : "Terms of Service - Cobonat",
    description: isArabic
      ? "اقرأ شروط الخدمة الخاصة بـ كوبونات قبل استخدام الموقع والخدمات."
      : "Read Cobonat's terms of service before using our website and services.",
    alternates: { canonical: `/${locale}/terms` },
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({ params }) {
  const { locale } = await params;
  const ar = locale.startsWith("ar");

  return (
    <div className="static-page-wrapper">
      {/* Hero */}
      <div className="static-page-hero">
        <div className="hero-icon">
          <span className="material-symbols-sharp">gavel</span>
        </div>
        <h1>{ar ? "شروط الخدمة" : "Terms of Service"}</h1>
        <p>
          {ar
            ? "يجب أن تقرأ وتوافق على هذه الشروط قبل استخدام خدماتنا."
            : "Please read and agree to these terms before using our services."}
        </p>
      </div>

      {/* Body */}
      <div className="static-page-content">
        <div className="last-updated">
          <span className="material-symbols-sharp">schedule</span>
          {ar ? "آخر تحديث: يناير 2025" : "Last updated: January 2025"}
        </div>

        {/* 1. Acceptance */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">check_circle</span>
            {ar ? "القبول بالشروط" : "Acceptance of Terms"}
          </h2>
          <p>
            {ar
              ? "بوصولك إلى موقع كوبونات أو استخدامه بأي طريقة، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي جزء منها، فلا يجوز لك استخدام الخدمة."
              : "By accessing or using the Cobonat website in any way, you agree to be bound by these terms. If you do not agree to any part of them, you may not use the service."}
          </p>
        </div>

        {/* 2. Service Description */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">description</span>
            {ar ? "وصف الخدمة" : "Service Description"}
          </h2>
          <p>
            {ar
              ? "كوبونات هي منصة إلكترونية تتيح للمستخدمين البحث والوصول إلى الكوبونات والعروض والخصومات من متاجر متعددة. نحن وسيط بين المستخدم والمتجر ولا نضمن صلاحية كوبون بعينه في أي وقت."
              : "Cobonat is an online platform that allows users to search for and access coupons, offers, and discounts from multiple stores. We act as an intermediary between the user and the store and do not guarantee the validity of any specific coupon at any given time."}
          </p>
        </div>

        {/* 3. User Accounts */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">person</span>
            {ar ? "حسابات المستخدمين" : "User Accounts"}
          </h2>
          <p>
            {ar
              ? "قد يطلب من بعض المستخدمين إنشاء حساب للوصول إلى ميزات إضافية. أنت مسؤول عن سرية كلمة المرور والحفاظ على أمان حسابك. لا يجوز لك مشاركة حسابك أو كلمة مرورك مع أي شخص آخر."
              : "Some users may be asked to create an account to access additional features. You are responsible for the confidentiality of your password and the security of your account. You must not share your account or password with anyone else."}
          </p>
          <p>
            {ar
              ? "نحتفظ بحق إلغاء أي حساب في حال انتهاك هذه الشروط دون إخطار مسبق."
              : "We reserve the right to terminate any account in case of a violation of these terms without prior notice."}
          </p>
        </div>

        {/* 4. Intellectual Property */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">copyright</span>
            {ar ? "الملكية الفكرية" : "Intellectual Property"}
          </h2>
          <p>
            {ar
              ? "جميع المحتوى الذي ينشره كوبونات — بما فيه النصوص والصور والشعارات والأصول الرسومية — هو ملكية فكرية للشركة أو موجود بموجب ترخيص. لا يجوز نسخه أو توزيعه أو استخدامه بأي طريقة دون إذن صريح."
              : "All content published by Cobonat — including text, images, logos, and graphic assets — is intellectual property of the company or exists under licence. It may not be copied, distributed, or used in any way without explicit permission."}
          </p>
        </div>

        {/* 5. Disclaimer */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">warning</span>
            {ar ? "إخلاء المسؤولية" : "Disclaimer"}
          </h2>
          <p>
            {ar
              ? "نقدّم الخدمة كما هي دون ضمانات من أي نوع، صريحة كانت أم ضمنية. لا نضمن أن الخدمة ستكون متاحة دائمًا دون انقطاع أو أخطاء."
              : "The service is provided \"as is\" without any warranties of any kind, express or implied. We do not guarantee that the service will always be available without interruption or errors."}
          </p>
          <p>
            {ar
              ? "كوبونات ليست طرفًا في أي صفقة تجرى بين المستخدم والمتجر. أي نزاعات ناجمة عن هذه الصفقات تُحسم مباشرة مع المتجر المعني."
              : "Cobonat is not a party to any transaction between the user and a store. Any disputes arising from such transactions are resolved directly with the relevant store."}
          </p>
        </div>

        {/* 6. Limitation of Liability */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">balance</span>
            {ar ? "حدود المسؤولية" : "Limitation of Liability"}
          </h2>
          <p>
            {ar
              ? "في حدود القانون المنطبق، لا تكون كوبونات مسؤولة عن أي خسائر غير مباشرة، خاصة، أو عقابية تنجم عن استخدامك للخدمة أو عدم قدرتك على استخدامها، بما فيها فقدان البيانات أو الأرباح."
              : "To the extent permitted by applicable law, Cobonat shall not be liable for any indirect, special, or punitive damages arising from your use of or inability to use the service, including loss of data or profits."}
          </p>
        </div>

        {/* 7. Governing Law */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">language</span>
            {ar ? "القانون المحكم" : "Governing Law"}
          </h2>
          <p>
            {ar
              ? "تخضع هذه الشروط للقانون السعودي دون الأخذ بعين الاعتبار قواعد تعارض القوانين."
              : "These terms shall be governed by Saudi Arabian law without regard to its conflict-of-laws rules."}
          </p>
        </div>

        {/* 8. Contact */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">mail</span>
            {ar ? "التواصل بشأن الشروط" : "Questions About These Terms"}
          </h2>
          <p>
            {ar
              ? "إذا كان لديك أي أسئلة حول هذه الشروط، تواصل معنا على: contact@cobonat.me"
              : "If you have any questions about these terms, please contact us at: contact@cobonat.me"}
          </p>
        </div>
      </div>
    </div>
  );
}
