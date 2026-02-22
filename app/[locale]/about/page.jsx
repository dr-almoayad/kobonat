// app/[locale]/about/page.js
import "../../../app/[locale]/static-pages.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isArabic = locale.startsWith("ar");

  return {
    title: isArabic ? "عن كوبونات" : "About Cobonat",
    description: isArabic
      ? "تعرّف على كوبونات — المنصة الرائدة للكوبونات والعروض في منطقة الخليج والشرق الأوسط."
      : "Learn about Cobonat — the leading coupon and deals platform across the Gulf and Middle East.",
    alternates: { 
      // ✅ FIX 1: Use absolute URL
      canonical: `${BASE_URL}/${locale}/about`,
      // ✅ FIX 2: Add hreflang to prevent "Duplicate" errors
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/about`,
        'en-SA': `${BASE_URL}/en-SA/about`,
        'x-default': `${BASE_URL}/ar-SA/about`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function AboutPage({ params }) {
  const { locale } = await params;
  const ar = locale.startsWith("ar");

  /* ── inline SVG icons for social links ── */
  const FacebookIcon = (
    <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
  const TelegramIcon = (
    <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161l-1.97 9.289c-.145.658-.527.822-1.084.512l-2.996-2.203-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.053-.333-.373-.12l-6.871 4.326-2.962-.925c-.643-.204-.657-.643.136-.874l11.6-4.466c.537-.194 1.006.131-.833.874z"/>
    </svg>
  );
  const WhatsAppIcon = (
    <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.296-.152-1.759-.867-2.031-.966-.274-.098-.474-.147-.674.147-.199.298-.771.966-.945 1.165-.174.199-.357.224-.66.069-1.759-.873-2.911-1.531-4.087-3.478-.309-.532.327-.826.896-1.966.098-.199.049-.369-.025-.518-.074-.149-.669-1.709-.917-2.309-.242-.608-.49-.526-.673-.536-.174-.009-.374-.012-.574-.012-.199 0-.524.074-.799.369-1.274 1.426-2.049 2.944-2.049 5.169 0 3.046 1.916 5.913 4.739 7.377.388.217.761.367 1.119.489-.477 1.312-1.554 2.379-2.94 2.795.494.24 1.049.365 1.633.365 3.909 0 7.086-3.177 7.086-7.086 0-.376-.039-.743-.108-1.099.374-.271.71-.577 1.001-.933.152-.183.287-.377.4-.583zM12 0C5.373 0 0 5.373 0 12c0 2.127.555 4.128 1.613 5.9L.789 20.489 4.133 19.7C5.898 20.74 7.886 21.3 12 21.3c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
  const TikTokIcon = (
    <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.27 6.27 0 0 0-6.27 6.27 6.27 6.27 0 0 0 6.27 6.27 6.27 6.27 0 0 0 6.27-6.27V8.38a8.14 8.14 0 0 0 3.84.96V6.01a4.83 4.83 0 0 1-3.77.68z"/>
    </svg>
  );

  return (
    <div className="static-page-wrapper">
      {/* Hero */}
      <div className="static-page-hero">
        <div className="hero-icon">
          <span className="material-symbols-sharp">info</span>
        </div>
        <h1>{ar ? "عن كوبونات" : "About Cobonat"}</h1>
        <p>
          {ar
            ? "منصة كوبونات والعروض الأولى في المنطقة."
            : "The leading coupons and deals platform in the region."}
        </p>
      </div>

      {/* Body */}
      <div className="static-page-content">

        {/* Mission */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">target</span>
            {ar ? "رسالتنا" : "Our Mission"}
          </h2>
          <p>
            {ar
              ? "رسالتنا هي أن نجعل التسوق الذكي أسهل وأكثر توفيرًا لكل شخص في المنطقة. نسعى إلى ربط المستخدمين بأفضل الكوبونات والعروض من متاجرهم المفضلة، فيوفّرون فعلًا وينعمون بتجربة تسوق ممتازة."
              : "Our mission is to make smart shopping easier and more rewarding for everyone in the region. We connect users with the best coupons and deals from their favourite stores so they save more and enjoy a better shopping experience."}
          </p>
        </div>

        {/* Vision */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">visibility</span>
            {ar ? "رؤيتنا" : "Our Vision"}
          </h2>
          <p>
            {ar
              ? "نطلب أن نكون المنصة الأكثر موثوقية والاستخدامًا في كوبونات والعروض عبر الخليج والشرق الأوسط. نريد أن يصبح كوبونات الوجهة الأولى التي يزورها كل متسوق قبل أن يُنفق دينارًا واحدًا."
              : "We aim to become the most trusted and widely used coupons and deals platform across the Gulf and Middle East. We want Cobonat to be the first place every shopper visits before spending a single dinar."}
          </p>
        </div>

        {/* What We Offer */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">gift</span>
            {ar ? "ما نقدمه" : "What We Offer"}
          </h2>
          <ul>
            <li>{ar ? "آلاف الكوبونات والعروض المحدّثة يوميًا من متاجر شهيرة محلية ودولية" : "Thousands of coupons and deals updated daily from popular local and international stores"}</li>
            <li>{ar ? "بحث سريع وسهل بحيث تجد العروض الأفضل في ثوانٍ" : "Fast and easy search so you find the best deals in seconds"}</li>
            <li>{ar ? "تصفية العروض حسب الفئة والمنطقة والدولة" : "Filter offers by category, region, and country"}</li>
            <li>{ar ? "كوبونات حصرية ومحدّثة والتحقق من صلاحيتها" : "Exclusive and verified coupons with validity checks"}</li>
            <li>{ar ? "تجربة سلسة في العربية والإنجليزية مع دعم كامل للنص من اليمين إلى اليسار" : "Seamless experience in Arabic and English with full RTL support"}</li>
            <li>{ar ? "دعم متعدد الدول والعمليات في المنطقة" : "Multi-country and multi-currency support across the region"}</li>
          </ul>
        </div>

        {/* Values */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">favorite</span>
            {ar ? "قيمنا" : "Our Values"}
          </h2>
          <h3>{ar ? "🤝 الشفافية" : "🤝 Transparency"}</h3>
          <p>
            {ar
              ? "نكون صادقين مع مستخدمينا في كل شيء — من طريقة عمل الكوبونات إلى كيفية استخدامنا لبياناتهم."
              : "We are honest with our users about everything — from how coupons work to how we use their data."}
          </p>
          <h3>{ar ? "🛡️ الأمان" : "🛡️ Security"}</h3>
          <p>
            {ar
              ? "حماية بيانات المستخدم هي أولويتنا. نطبّق أعلى معايير الأمان لضمان سلامة المعلومات."
              : "Protecting user data is our top priority. We apply the highest security standards to ensure information safety."}
          </p>
          <h3>{ar ? "⭐ الجودة" : "⭐ Quality"}</h3>
          <p>
            {ar
              ? "نلتزم بتقديم كوبونات حقيقية وعروض متحقق منها لأن وقت المستخدم ثمين."
              : "We commit to providing genuine coupons and verified deals because our users' time is valuable."}
          </p>
        </div>

        {/* Follow Us */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">people</span>
            {ar ? "تابعنا" : "Follow Us"}
          </h2>
          <p>
            {ar
              ? "كن على تواصل مع كوبونات وأول من يعرف عن العروض والأخبار الجديدة."
              : "Stay connected with Cobonat and be the first to know about new deals and news."}
          </p>
          <div className="social-links-row">
            <a href="https://www.facebook.com/cobonatme" target="_blank" rel="noopener noreferrer" className="social-link" data-brand="facebook">
              {FacebookIcon}
              Facebook
            </a>
            <a href="https://t.me/cobonatme" target="_blank" rel="noopener noreferrer" className="social-link" data-brand="telegram">
              {TelegramIcon}
              Telegram
            </a>
            <a href="https://whatsapp.com/channel/0029Vb6u01OCMY0D92yvm72i" target="_blank" rel="noopener noreferrer" className="social-link" data-brand="whatsapp">
              {WhatsAppIcon}
              WhatsApp
            </a>
            <a href="https://www.tiktok.com/@cobonatme" target="_blank" rel="noopener noreferrer" className="social-link" data-brand="tiktok">
              {TikTokIcon}
              TikTok
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
