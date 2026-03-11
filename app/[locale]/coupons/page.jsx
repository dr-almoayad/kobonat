// app/[locale]/coupons/page.jsx
import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import HelpBox from "@/components/help/HelpBox";
import CouponsStructuredData from "@/components/StructuredData/CouponsStructuredData";
import "./coupons-page.css";

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// =============================================================================
// Metadata
// =============================================================================
export async function generateMetadata({ params }) {
  const { locale = 'ar-SA' } = await params;
  const [language] = locale.split('-');
  const isAr = language === 'ar';

  const title = isAr
    ? 'كل أكواد خصم وكوبونات السعودية | وفر أكثر مع كوبونات'
    : 'All Promo Codes & Coupons in Saudi Arabia | Save more with Cobonat';

  const description = isAr
    ? 'منصتك الأولى لأكواد الخصم والعروض في السعودية 🇸🇦. وفر فلوسك مع كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية. مقاضيك، لبسك، وسفرياتك صارت أوفر!'
    : 'Your #1 source for verified discount codes in Saudi 🇸🇦. Save more on fashion, electronics, and groceries with verified and active coupons for top local and global stores.';

  // ── OG image: 1200×630 is required for summary_large_image ────────────────
  // If you have a dedicated coupons hero image, use it here instead of the logo.
  const ogImage = `${BASE_URL}/og-coupons.png`;   // create a 1200×630 version
  const ogImageFallback = `${BASE_URL}/logo-512x512.png`;

  return {
    metadataBase: new URL(BASE_URL),
    applicationName: isAr ? 'كوبونات' : 'Cobonat',
    title,
    description,
    keywords: isAr
      ? 'كوبونات, أكواد خصم, عروض السعودية, خصومات, توفير, كود خصم, ديل'
      : 'coupons, promo codes, Saudi Arabia deals, discount codes, savings, verified coupons',

    // ── Explicit robots — must re-declare the full googleBot block at page level
    // because Next.js page metadata fully replaces (not merges) the layout's
    // robots object. Without this, max-snippet and max-image-preview are lost.
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:  true,
        follow: true,
        'max-video-preview':  -1,
        'max-image-preview':  'large',
        'max-snippet':        -1,
      },
    },

    icons: {
      icon:  [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    },

    alternates: {
      canonical: `${BASE_URL}/${locale}/coupons`,
      languages: {
        'ar-SA':    `${BASE_URL}/ar-SA/coupons`,
        'en-SA':    `${BASE_URL}/en-SA/coupons`,
        'x-default': `${BASE_URL}/ar-SA/coupons`,
      },
    },

    openGraph: {
      siteName:    isAr ? 'كوبونات' : 'Cobonat',
      title,
      description,
      url:         `${BASE_URL}/${locale}/coupons`,
      type:        'website',
      // Next.js converts locale 'ar-SA' → 'ar_SA' automatically (OG requires underscore)
      locale,
      images: [
        {
          // Prefer a proper 1200×630 OG image; fall back to logo
          url:    ogImage,
          width:  1200,
          height: 630,
          alt:    title,
        },
        {
          url:    ogImageFallback,
          width:  512,
          height: 512,
          alt:    'Cobonat Logo',
        },
      ],
    },

    twitter: {
      card:        'summary_large_image',
      site:        '@cobonat',
      creator:     '@cobonat',
      title,
      description,
      images: [ogImage],
    },
  };
}

// =============================================================================
// Page
// =============================================================================
const CouponsPage = async ({ params }) => {
  const { locale = 'ar-SA' } = await params;
  const t = await getTranslations('CouponsPage');
  const now = new Date();

  const [language, countryCode] = locale.includes('-')
    ? locale.split('-')
    : [locale, locale.toUpperCase()];

  const normalizedCountryCode = countryCode?.toUpperCase() || 'SA';

  const vouchers = await prisma.voucher.findMany({
    where: {
      store: { isActive: true },
      countries: { some: { country: { code: normalizedCountryCode } } },
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
    include: {
      translations: {
        where:  { locale: language },
        select: { title: true, description: true },
      },
      store: {
        include: {
          translations: {
            where:  { locale: language },
            select: { name: true, slug: true },
          },
        },
      },
      _count: { select: { clicks: true } },
    },
    orderBy: [
      { isExclusive: 'desc' },
      { popularityScore: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const transformVoucher = (voucher) => {
    const vt = voucher.translations?.[0] || {};
    const st = voucher.store?.translations?.[0] || {};
    return {
      ...voucher,
      title:       vt.title       || 'Special Offer',
      description: vt.description || null,
      store: voucher.store ? {
        ...voucher.store,
        name:         st.name || '',
        slug:         st.slug || '',
        translations: undefined,
      } : null,
      translations: undefined,
    };
  };

  const transformedVouchers = vouchers.map(transformVoucher);
  const activeVouchers    = transformedVouchers.length;
  const exclusiveVouchers = transformedVouchers.filter(v => v.isExclusive).length;
  const verifiedVouchers  = transformedVouchers.filter(v => v.isVerified).length;

  return (
    <>
      <CouponsStructuredData
        vouchers={transformedVouchers}
        locale={locale}
        baseUrl={BASE_URL}
      />

      <main className="coupons_page">
        <div className="coupons_page_header_container">
          <div className="coupons_page_content">
            <div className="coupons_title_section">
              <div className="title_left">
                <h1>{t('pageTitle')}</h1>
                <p className="subtitle">
                  {language === 'ar'
                    ? `${activeVouchers} كوبون نشط متاح في ${normalizedCountryCode}`
                    : `${activeVouchers} active coupons available in ${normalizedCountryCode}`}
                </p>
              </div>

              <div className="coupons_stats_row">
                <div className="stat_badge">
                  <span className="material-symbols-sharp">local_offer</span>
                  <div>
                    <span className="stat_number">{activeVouchers}</span>
                    <span className="stat_label">
                      {language === 'ar' ? 'كوبون نشط' : 'Active'}
                    </span>
                  </div>
                </div>

                {exclusiveVouchers > 0 && (
                  <div className="stat_badge exclusive">
                    <span className="material-symbols-sharp">star</span>
                    <div>
                      <span className="stat_number">{exclusiveVouchers}</span>
                      <span className="stat_label">
                        {language === 'ar' ? 'حصري' : 'Exclusive'}
                      </span>
                    </div>
                  </div>
                )}

                {verifiedVouchers > 0 && (
                  <div className="stat_badge verified">
                    <span className="material-symbols-sharp">verified</span>
                    <div>
                      <span className="stat_number">{verifiedVouchers}</span>
                      <span className="stat_label">
                        {language === 'ar' ? 'موثق' : 'Verified'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="coupons_container">
          <VouchersGrid
            vouchers={transformedVouchers}
            emptyMessage={
              language === 'ar'
                ? `لا توجد كوبونات متاحة حالياً في ${normalizedCountryCode}`
                : `No coupons available at the moment in ${normalizedCountryCode}`
            }
          />
        </div>

        <HelpBox locale={locale} />
      </main>
    </>
  );
};

export default CouponsPage;
