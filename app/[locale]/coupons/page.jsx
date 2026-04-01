// app/[locale]/coupons/page.jsx
import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import HelpBox from "@/components/help/HelpBox";
import CouponsStructuredData from "@/components/StructuredData/CouponsStructuredData";
import "./coupons-page.css";

export const revalidate = 60;

const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const PAGE_LIMIT = 60; // sensible cap — prevents Googlebot from timing out on
                       // a single enormous HTML response with 300+ vouchers.

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

  // FIX: og-coupons.png doesn't exist on disk yet — fall back to the logo so
  // Googlebot never encounters a 404 OG-image crawl error on this page.
  // When you create a proper 1200×630 OG image, replace this line.
  const ogImage = `${BASE_URL}/logo-512x512.png`;

  return {
    metadataBase: new URL(BASE_URL),
    applicationName: isAr ? 'كوبونات' : 'Cobonat',
    title,
    description,
    keywords: isAr
      ? 'كوبونات, أكواد خصم, عروض السعودية, خصومات, توفير, كود خصم, ديل'
      : 'coupons, promo codes, Saudi Arabia deals, discount codes, savings, verified coupons',

    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:  true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet':       -1,
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
      locale,
      images: [
        {
          url:    ogImage,
          width:  512,
          height: 512,
          alt:    title,
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
// FIX: added searchParams so we can paginate.
// Fetching ALL vouchers in a single query caused Googlebot to time out on
// large country catalogues and produced a thin/duplicate-content signal
// (a "coupon dump") that suppressed indexing. We now serve PAGE_LIMIT vouchers
// per page and emit proper rel="next" / rel="prev" links so Google can crawl
// the full catalogue incrementally.
// =============================================================================
const CouponsPage = async ({ params, searchParams: rawSearchParams }) => {
  const { locale = 'ar-SA' } = await params;

  // Next.js 15 searchParams is a Promise in server components
  const searchParams = await rawSearchParams;
  const page = Math.max(1, parseInt(searchParams?.page || '1'));

  const t   = await getTranslations('CouponsPage');
  const now = new Date();

  const [language, countryCode] = locale.includes('-')
    ? locale.split('-')
    : [locale, locale.toUpperCase()];

  const normalizedCountryCode = countryCode?.toUpperCase() || 'SA';

  // ── Shared where clause ───────────────────────────────────────────────────
  const where = {
    store: { isActive: true },
    countries: { some: { country: { code: normalizedCountryCode } } },
    OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
  };

  // ── Parallel: fetch page + total count ────────────────────────────────────
  const [vouchers, totalCount] = await Promise.all([
    prisma.voucher.findMany({
      where,
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
        { isExclusive:    'desc' },
        { popularityScore: 'desc' },
        { createdAt:       'desc' },
      ],
      take: PAGE_LIMIT,
      skip: (page - 1) * PAGE_LIMIT,
    }),
    prisma.voucher.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_LIMIT);

  // ── Transform ─────────────────────────────────────────────────────────────
  const transformVoucher = (voucher) => {
    const vt = voucher.translations?.[0] || {};
    const st = voucher.store?.translations?.[0] || {};
    return {
      ...voucher,
      title:       vt.title       || 'Special Offer',
      description: vt.description || null,
      store: voucher.store
        ? { ...voucher.store, name: st.name || '', slug: st.slug || '', translations: undefined }
        : null,
      translations: undefined,
    };
  };

  const transformedVouchers = vouchers.map(transformVoucher);
  const activeVouchers      = totalCount;
  const exclusiveVouchers   = transformedVouchers.filter(v => v.isExclusive).length;
  const verifiedVouchers    = transformedVouchers.filter(v => v.isVerified).length;

  // ── Pagination helpers ────────────────────────────────────────────────────
  const buildPageUrl = (p) =>
    `/${locale}/coupons${p > 1 ? `?page=${p}` : ''}`;

  const isAr = language === 'ar';

  return (
    <>
      <CouponsStructuredData
        vouchers={transformedVouchers}
        locale={locale}
        baseUrl={BASE_URL}
      />

      {/* rel="next" / rel="prev" — helps Google understand paginated series */}
      {page > 1 && (
        <link rel="prev" href={`${BASE_URL}${buildPageUrl(page - 1)}`} />
      )}
      {page < totalPages && (
        <link rel="next" href={`${BASE_URL}${buildPageUrl(page + 1)}`} />
      )}

      <main className="coupons_page">
        <div className="coupons_page_header_container">
          <div className="coupons_page_content">
            <div className="coupons_title_section">
              <div className="title_left">
                <h1>{t('pageTitle')}</h1>
                <p className="subtitle">
                  {isAr
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
                      {isAr ? 'كوبون نشط' : 'Active'}
                    </span>
                  </div>
                </div>

                {exclusiveVouchers > 0 && (
                  <div className="stat_badge exclusive">
                    <span className="material-symbols-sharp">star</span>
                    <div>
                      <span className="stat_number">{exclusiveVouchers}</span>
                      <span className="stat_label">
                        {isAr ? 'حصري' : 'Exclusive'}
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
                        {isAr ? 'موثق' : 'Verified'}
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
              isAr
                ? `لا توجد كوبونات متاحة حالياً في ${normalizedCountryCode}`
                : `No coupons available at the moment in ${normalizedCountryCode}`
            }
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="coupons_pagination" style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '1rem',
            padding:        '2rem 1.5rem',
          }}>
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                style={{
                  display:      'inline-flex',
                  padding:      '0.6rem 1.5rem',
                  background:   '#fff',
                  border:       '1.5px solid #e0dcf5',
                  borderRadius: '10px',
                  color:        '#470ae2',
                  fontWeight:   600,
                  fontSize:     '0.875rem',
                  textDecoration: 'none',
                }}
              >
                {isAr ? '→ السابق' : '← Previous'}
              </Link>
            )}

            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
              {isAr
                ? `صفحة ${page} من ${totalPages}`
                : `Page ${page} of ${totalPages}`}
            </span>

            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                style={{
                  display:      'inline-flex',
                  padding:      '0.6rem 1.5rem',
                  background:   '#fff',
                  border:       '1.5px solid #e0dcf5',
                  borderRadius: '10px',
                  color:        '#470ae2',
                  fontWeight:   600,
                  fontSize:     '0.875rem',
                  textDecoration: 'none',
                }}
              >
                {isAr ? '← التالي' : 'Next →'}
              </Link>
            )}
          </div>
        )}

        <HelpBox locale={locale} />
      </main>
    </>
  );
};

export default CouponsPage;
