// app/[locale]/contact/page.js
import "../../../app/[locale]/static-pages.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isArabic = locale.startsWith("ar");

  return {
    title: isArabic ? "التواصل معنا - كوبونات" : "Contact Us - Cobonat",
    description: isArabic
      ? "تواصل مع فريق كوبونات عبر البريد الإلكتروني أو وسائل التواصل الاجتماعي."
      : "Get in touch with the Cobonat team via email or social media.",
    alternates: { canonical: `/${locale}/contact` },
    robots: { index: true, follow: true },
  };
}

export default async function ContactPage({ params }) {
  const { locale } = await params;
  const ar = locale.startsWith("ar");

  /* ── inline SVG icons ── */
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
          <span className="material-symbols-sharp">mail</span>
        </div>
        <h1>{ar ? "التواصل معنا" : "Contact Us"}</h1>
        <p>
          {ar
            ? "نحن هنا لمساعدتك. لا تتردد في التواصل معنا."
            : "We are here to help. Don't hesitate to reach out to us."}
        </p>
      </div>

      {/* Body */}
      <div className="static-page-content">

        {/* Intro */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">support_agent</span>
            {ar ? "كيف يمكنك التواصل معنا؟" : "How Can You Reach Us?"}
          </h2>
          <p>
            {ar
              ? "يسعدنا الإجابة على أسئلتك وحل أي مشاكل تواجهها. اختر القناة الأسهل لك من القنوات أدناه."
              : "We'd be happy to answer your questions and resolve any issues you may encounter. Choose the easiest channel for you below."}
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="contact-cards">
          {/* Email */}
          <div className="contact-card">
            <div className="card-icon">
              <span className="material-symbols-sharp">email</span>
            </div>
            <h3>{ar ? "البريد الإلكتروني" : "Email"}</h3>
            <a href="mailto:contact@cobonat.me">contact@cobonat.me</a>
          </div>

          {/* Facebook */}
          <div className="contact-card">
            <div className="card-icon" style={{ color: "#1877f2", background: "#eef4fd" }}>
              {FacebookIcon}
            </div>
            <h3>Facebook</h3>
            <a href="https://www.facebook.com/cobonatme" target="_blank" rel="noopener noreferrer">
              @cobonatme
            </a>
          </div>

          {/* Telegram */}
          <div className="contact-card">
            <div className="card-icon" style={{ color: "#0088cc", background: "#eef7fd" }}>
              {TelegramIcon}
            </div>
            <h3>Telegram</h3>
            <a href="https://t.me/cobonatme" target="_blank" rel="noopener noreferrer">
              t.me/cobonatme
            </a>
          </div>

          {/* WhatsApp */}
          <div className="contact-card">
            <div className="card-icon" style={{ color: "#25d366", background: "#eefcf2" }}>
              {WhatsAppIcon}
            </div>
            <h3>WhatsApp</h3>
            <a href="https://whatsapp.com/channel/0029Vb6u01OCMY0D92yvm72i" target="_blank" rel="noopener noreferrer">
              {ar ? "قناة كوبونات" : "Cobonat Channel"}
            </a>
          </div>

          {/* TikTok */}
          <div className="contact-card">
            <div className="card-icon" style={{ color: "#010101", background: "#f2f2f2" }}>
              {TikTokIcon}
            </div>
            <h3>TikTok</h3>
            <a href="https://www.tiktok.com/@cobonatme" target="_blank" rel="noopener noreferrer">
              @cobonatme
            </a>
          </div>
        </div>

        {/* Response Time */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">schedule</span>
            {ar ? "وقت الرد" : "Response Time"}
          </h2>
          <p>
            {ar
              ? "نحاول الرد على جميع الرسائل خلال 24 ساعة من استلامها. في حالات الطوارئ أو الإبلاغ عن مشاكل حرجة، يُنصح بالتواصل عبر البريد الإلكتروني للحصول على أسرع استجابة."
              : "We aim to reply to all messages within 24 hours of receiving them. In urgent cases or when reporting critical issues, we recommend reaching out via email for the fastest response."}
          </p>
        </div>

        {/* FAQ */}
        <div className="static-section">
          <h2>
            <span className="material-symbols-sharp">help_circle</span>
            {ar ? "الأسئلة المتكررة" : "Frequently Asked Questions"}
          </h2>

          <div className="faq-item">
            <h4>{ar ? "كيف أستخدم كوبون؟" : "How do I use a coupon?"}</h4>
            <p>
              {ar
                ? "انقر على زر \"نسخ الكود\" في أي كوبون، ثم الصق الكود في صفحة الدفع على موقع المتجر المعني. إذا كان العرض عبارة عن صفقة فعّلها مباشرة، فانقر على \"خذ العرض\" وستُنقل إلى صفحة العرض."
                : "Click the \"Copy Code\" button on any coupon, then paste the code at checkout on the relevant store's website. If the offer is an auto-applied deal, click \"Get Deal\" and you'll be redirected to the offer page."}
            </p>
          </div>

          <div className="faq-item">
            <h4>{ar ? "ماذا أفعل إذا كان الكوبون لا يعمل؟" : "What if a coupon doesn't work?"}</h4>
            <p>
              {ar
                ? "أحيانًا يكون الكوبون قد انتهت صلاحيته أو لا ينطبق على منتجات بعينها. تواصل معنا عبر البريد الإلكتروني contact@cobonat.me وأخبرنا بالكوبون والمتجر وسنحقق في الأمر."
                : "Sometimes a coupon may have expired or may not apply to certain products. Contact us via email at contact@cobonat.me, let us know the coupon and store, and we'll look into it."}
            </p>
          </div>

          <div className="faq-item">
            <h4>{ar ? "كيف أقترح متجرًا جديدًا؟" : "How do I suggest a new store?"}</h4>
            <p>
              {ar
                ? "أرسل لنا اسم المتجر ورابطه عبر البريد الإلكتروني أو أيٍّ من قنوات التواصل أعلاه، وسنسعى لإضافته."
                : "Send us the store name and link via email or any of the contact channels above, and we'll work on adding it."}
            </p>
          </div>

          <div className="faq-item">
            <h4>{ar ? "كيف أحذف حساباتي؟" : "How do I delete my account?"}</h4>
            <p>
              {ar
                ? "تواصل معنا عبر البريد الإلكتروني contact@cobonat.me وأخبرنا بطلب الحذف. سنعالجه خلال 48 ساعة."
                : "Contact us via email at contact@cobonat.me and let us know about your deletion request. We'll process it within 48 hours."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
