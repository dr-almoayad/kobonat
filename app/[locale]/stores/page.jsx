// app/[locale]/stores/page.jsx
import { getTranslations } from 'next-intl/server';
import { prisma } from "@/lib/prisma";
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel"; 
import { getCountryCategories } from "@/lib/storeCategories";
import { getStoresData } from "@/lib/stores";
import { isValidLocale } from "@/i18n/locales";
import { notFound } from "next/navigation";
import PromoCodesFAQ from '@/components/PromoCodesFAQ/PromoCodesFAQ';
import HelpBox from "@/components/help/HelpBox";
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import "./stores-page.css";

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [lang, region] = locale.split('-');

  if (!isValidLocale(lang, region)) return {};

  const isAr = lang === 'ar';
  const now = new Date();

  // Lightweight count queries
  const [storeCount, voucherCount] = await Promise.all([
    prisma.store.count({
      where: {
        isActive: true,
        countries: { some: { country: { code: region } } },
      },
    }),
    prisma.voucher.count({
      where: {
        store: { isActive: true },
        countries: { some: { country: { code: region } } },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
    }),
  ]);

  const title = isAr
    ? `أكواد خصم وعروض ${storeCount}+ متجر في السعودية | كوبونات`
    : `Coupons & Deals at ${storeCount}+ Stores in Saudi Arabia | Cobonat`;

  const description = isAr
    ? `تصفح ${storeCount} متجراً في السعودية واحصل على أحدث ${voucherCount}+ كوبون وكود خصم فعال ومجرّب. عروض حصرية يومية من أشهر المتاجر العالمية والمحلية.`
    : `Browse ${storeCount} stores in Saudi Arabia with ${voucherCount}+ active, verified coupon codes and deals. Exclusive daily offers from top local and global brands.`;

  const ogImage = `${BASE_URL}/logo-512x512.png`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    icons: {
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    },
    applicationName: isAr ? 'كوبونات' : 'Cobonat',
    openGraph: {
      siteName: isAr ? 'كوبونات' : 'Cobonat',
      title,
      description,
      url: `${BASE_URL}/${locale}/stores`,
      type: 'website',
      locale,
      images: [{ url: ogImage, width: 512, height: 512, alt: isAr ? 'كوبونات — جميع المتاجر' : 'Cobonat — All Stores' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      creator: '@cobonat',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/stores`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/stores`,
        'en-SA': `${BASE_URL}/en-SA/stores`,
        'x-default': `${BASE_URL}/ar-SA/stores`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AllStoresPage({ params }) {
  const { locale } = await params;
  const [language, countryCode] = locale.split('-');

  if (!isValidLocale(language, countryCode)) notFound();

  const isAr = language === 'ar';
  const t = await getTranslations('StoresPage');
  const now = new Date();

  const [featuredStoresWithCovers, stores, categories] = await Promise.all([
    // Hero carousel — featured stores that have a cover image
    prisma.store.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        coverImage: { not: null },
        countries: { some: { country: { code: countryCode } } },
      },
      include: {
        translations: {
          where: { locale: language },
          select: { name: true, slug: true },
        },
      },
      take: 8,
    }),
    getStoresData({ language, countryCode }),
    getCountryCategories(language, countryCode),
  ]);

  const carouselStores = featuredStoresWithCovers.map(store => ({
    id: store.id,
    image: store.coverImage,
    name: store.translations?.[0]?.name || '',
    logo: store.logo,
  }));

  const totalVouchers = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);
  const featuredStores = stores.filter(s => s.isFeatured);
  const regularStores = stores.filter(s => !s.isFeatured);

  if (stores.length === 0) {
    return (
      <div className="stores_page">
        <div className="stores_page_header">
          <div className="stores_page_header_container">
            <div className="error-container">
              <span className="material-symbols-sharp" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '1rem' }}>
                store_off
              </span>
              <h1>{isAr ? 'لا توجد متاجر متاحة' : 'No Stores Available'}</h1>
              <p>{isAr ? 'لا توجد متاجر متاحة حالياً في منطقتك.' : 'No stores available at the moment in your region.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { name: isAr ? 'الرئيسية' : 'Home', url: `/${locale}` },
    { name: isAr ? 'جميع المتاجر' : 'All Stores', url: `/${locale}/stores` },
  ];

  // Structured data: ItemList for stores (up to 20)
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isAr ? 'جميع المتاجر — كوبونات السعودية' : 'All Stores — Saudi Arabia Coupons',
    description: isAr
      ? `تصفح ${stores.length} متجراً وأحصل على أفضل أكواد الخصم في السعودية`
      : `Browse ${stores.length} stores and find the best coupon codes in Saudi Arabia`,
    numberOfItems: stores.length,
    itemListElement: stores.slice(0, 20).map((store, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: store.name,
      url: `${BASE_URL}/${locale}/stores/${store.slug}`,
    })),
  };

  // SEO H1 (hardcoded keyword‑rich)
  const pageH1 = isAr
    ? `كوبونات وعروض ${stores.length}+ متجر في السعودية`
    : `Coupons & Deals at ${stores.length}+ Stores in Saudi Arabia`;

  const pageSubtitle = isAr
    ? `${totalVouchers}+ كوبون فعال ومجرّب — محدّث يومياً`
    : `${totalVouchers}+ active verified coupons — updated daily`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <div className="stores_page">
        {/* Breadcrumbs - visible + schema */}
        <div style={{ maxWidth: '1312px', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
          <Breadcrumbs items={breadcrumbItems} locale={locale} />
        </div>

        {carouselStores.length > 0 && (
          <div className="stores-hero-section">
            <HeroCarousel images={carouselStores} locale={locale} height="350px" autoplayDelay={3500} />
          </div>
        )}

        <div className="stores_page_header">
          <div className="stores_page_header_container">
            <div className="stores_page_title_section">
              <div className="stores_page_icon">
                <span className="material-symbols-sharp">storefront</span>
              </div>
              <div className="stores_info">
                <h1>{pageH1}</h1>
                <p className="stores_stats">
                  <span className="stat_item">
                    <span className="material-symbols-sharp">store</span>
                    <strong>{stores.length}</strong>
                    {isAr ? ' متجر' : ' stores'}
                  </span>
                  <span className="stat_separator">•</span>
                  <span className="stat_item">
                    <span className="material-symbols-sharp">local_offer</span>
                    <strong>{totalVouchers}</strong>
                    {isAr ? ' كوبون فعال' : ' active coupons'}
                  </span>
                </p>
                <p className="stores_subtitle">{pageSubtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {featuredStores.length > 0 && (
          <section className="featured_stores_section">
            <div className="section_header">
              <h2>
                <span className="material-symbols-sharp">star</span>
                {t('featuredStores')}
              </h2>
              <span className="section_count">{t('count', { count: featuredStores.length })}</span>
            </div>
            <StoresGrid stores={featuredStores} locale={locale} />
          </section>
        )}

        <section className="all_stores_section">
          <div className="section_header">
            <h2>{featuredStores.length > 0 ? t('otherStores') : t('allStores')}</h2>
            <span className="section_count">{t('count', { count: regularStores.length })}</span>
          </div>
          <StoresGrid stores={featuredStores.length > 0 ? regularStores : stores} locale={locale} />
        </section>

        <PromoCodesFAQ includeStructuredData={true} />
        <HelpBox locale={locale} />
      </div>
    </>
  );
}
