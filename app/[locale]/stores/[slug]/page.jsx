// app/[locale]/stores/[slug]/page.jsx
// FIXES APPLIED:
//
// FIX 1 — Category hreflang broken (primary indexing blocker for category pages)
//   Before: both 'ar-SA' and 'en-SA' alternates used the current locale's slug,
//   e.g. Arabic category "إلكترونيات" produced `/en-SA/stores/إلكترونيات` → 404.
//   Google drops the entire hreflang set when any alternate 404s, causing the
//   page to be treated as uncanonicalised and often not indexed.
//   After: we look up the other-locale CategoryTranslation slug explicitly and
//   pass arSlug/enSlug to generateEnhancedCategoryMetadata.
//
// FIX 2 — Store hreflang for stores missing one language translation
//   Before: `otherTranslation?.slug || slug` fell back to the current slug when
//   the other-language translation was absent, producing a broken alternate URL.
//   After: if the other-language translation is absent we omit that alternate
//   entirely rather than pointing to a broken URL.
//
// FIX 3 — /api/og route that didn't exist is no longer referenced.
//   generateEnhancedStoreMetadata in generateStoreMetadata.js now uses
//   coverImage > logo > static fallback instead of the nonexistent /api/og.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import StorePageShell from "@/components/headers/StorePageShell";
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import StoreFAQ from "@/components/StoreFAQ/StoreFAQ";
import StoreCard from "@/components/StoreCard/StoreCard";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel/FeaturedProductsCarousel";
import OtherPromosSection from "@/components/OtherPromosSection/OtherPromosSection";
import FAQStructuredData from "@/components/StructuredData/FAQStructuredData";
import StoreStructuredData from "@/components/StructuredData/StoreStructuredData";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import PromoCodesFAQ from "@/components/PromoCodesFAQ/PromoCodesFAQ";
import StoreLeaderboardSidebar from "@/components/leaderboard/StoreLeaderboardSidebar";
import RelatedPostsSidebar from "@/components/blog/RelatedPostsSidebar";
import StoreIntelligenceCard from "@/components/StoreIntelligenceCard/StoreIntelligenceCard";
import StoreOfferStacks from '@/components/StoreOfferStacks/StoreOfferStacks';
import { getCategoryData } from "@/lib/storeCategories";
import { getStoresData, getStoreData } from "@/lib/stores";
import { getStoreRelatedPosts } from "@/app/admin/_lib/queries";
import { generateEnhancedStoreMetadata, generateEnhancedCategoryMetadata } from "@/lib/seo/generateStoreMetadata";
import { getCurrentWeekIdentifier } from "@/lib/leaderboard/calculateStoreSavings";
import HelpBox from "@/components/help/HelpBox";
import "./store-page.css";
import "./stores-page.css";

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// =============================================================================
// Metadata
// =============================================================================

export async function generateMetadata({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const isArabic = language === 'ar';

    const country = await prisma.country.findUnique({
      where:   { code: countryCode, isActive: true },
      include: { translations: { where: { locale: language } } },
    });

    // ── Try as category ────────────────────────────────────────────────────
    const category = await getCategoryData(slug, language, countryCode);
    if (category) {
      const categoryTranslation = category.translations[0];

      // ── FIX 1: look up the other-locale slug so hreflang alternates are correct
      const otherLanguage        = language === 'ar' ? 'en' : 'ar';
      const otherCatTranslation  = category.translations.find(t => t.locale === otherLanguage)
        // getCategoryData may not include the other locale — fetch it separately
        || await prisma.categoryTranslation.findFirst({
            where: { categoryId: category.id, locale: otherLanguage },
            select: { slug: true, name: true },
          });

      const arCatSlug = language === 'ar' ? slug : (otherCatTranslation?.slug || null);
      const enCatSlug = language === 'en' ? slug : (otherCatTranslation?.slug || null);

      // Build alternates only for languages where we have a real slug
      const hreflangLanguages = {};
      if (arCatSlug) hreflangLanguages['ar-SA'] = `${BASE_URL}/ar-SA/stores/${arCatSlug}`;
      if (enCatSlug) hreflangLanguages['en-SA'] = `${BASE_URL}/en-SA/stores/${enCatSlug}`;
      // x-default always points to the Arabic version (primary market)
      hreflangLanguages['x-default'] = `${BASE_URL}/ar-SA/stores/${arCatSlug || slug}`;

      // Fast-exit branch: category has explicit SEO fields
      if (categoryTranslation?.seoTitle || categoryTranslation?.seoDescription) {
        const categoryName = categoryTranslation?.name || 'Category';
        return {
          metadataBase: new URL(BASE_URL),
          icons: {
            icon:  [
              { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
              { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
            ],
            apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
          },
          title:       categoryTranslation.seoTitle || categoryName,
          description: categoryTranslation.seoDescription || categoryTranslation?.description || '',
          alternates: {
            canonical: `${BASE_URL}/${locale}/stores/${slug}`,
            languages: hreflangLanguages,
          },
          openGraph: {
            siteName:    isArabic ? 'كوبونات' : 'Cobonat',
            title:       categoryTranslation.seoTitle || categoryName,
            description: categoryTranslation.seoDescription || '',
            type:        'website',
            locale,
            url:         `${BASE_URL}/${locale}/stores/${slug}`,
          },
        };
      }

      // Standard metadata via generator
      const stores         = await getStoresData({ language, countryCode, categoryId: category.id });
      const voucherCount   = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);
      return generateEnhancedCategoryMetadata({
        category: {
          ...category,
          name:        categoryTranslation?.name        || 'Category',
          description: categoryTranslation?.description || '',
          slug,
        },
        locale,
        storeCount:  stores.length,
        voucherCount,
        country: country ? { name: country.translations[0]?.name || country.code } : null,
        arSlug: arCatSlug, // ← FIX 1: pass resolved slugs
        enSlug: enCatSlug, // ← FIX 1
      });
    }

    // ── Try as store ───────────────────────────────────────────────────────
    const store = await getStoreData(slug, language, countryCode);
    if (store) {
      const storeTranslation = store.translations[0];

      // ── FIX 2: look up the other-locale slug
      const otherLocale      = language === 'ar' ? 'en' : 'ar';
      const otherTranslation = await prisma.storeTranslation.findFirst({
        where:  { storeId: store.id, locale: otherLocale },
        select: { slug: true },
      });

      // ── FIX 2: only include the other-language alternate when we have a real slug.
      // Using `|| slug` as a fallback would create a hreflang pointing to a 404
      // for stores that only exist in one language (e.g. Arabic-only stores).
      const arSlug = language === 'ar' ? slug : (otherTranslation?.slug || null);
      const enSlug = language === 'en' ? slug : (otherTranslation?.slug || null);

      const hreflangLanguages = {};
      if (arSlug) hreflangLanguages['ar-SA'] = `${BASE_URL}/ar-SA/stores/${arSlug}`;
      if (enSlug) hreflangLanguages['en-SA'] = `${BASE_URL}/en-SA/stores/${enSlug}`;
      hreflangLanguages['x-default'] = `${BASE_URL}/ar-SA/stores/${arSlug || slug}`;

      // Fast-exit branch: store has explicit SEO fields
      if (storeTranslation?.seoTitle || storeTranslation?.seoDescription) {
        const storeName = storeTranslation?.name || slug;
        return {
          metadataBase: new URL(BASE_URL),
          icons: {
            icon:  [
              { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
              { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
            ],
            apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
          },
          title:       storeTranslation.seoTitle || storeName,
          description:
            storeTranslation.seoDescription ||
            storeTranslation?.description   ||
            `Find the best coupons and deals for ${storeName}`,
          alternates: {
            canonical: `${BASE_URL}/${locale}/stores/${slug}`,
            languages: hreflangLanguages, // ← FIX 2
          },
          openGraph: {
            siteName:    isArabic ? 'كوبونات' : 'Cobonat',
            title:       storeTranslation.seoTitle || storeName,
            description: storeTranslation.seoDescription || storeTranslation?.description || '',
            type:        'website',
            locale,
            url:         `${BASE_URL}/${locale}/stores/${slug}`,
            images: [
              ...(store.coverImage
                ? [{ url: store.coverImage, width: 1200, height: 630 }]
                : []),
            ],
          },
        };
      }

      // Fallback: standard metadata via generator.
      // Pass arSlug / enSlug — if either is null the generator will omit that
      // alternate (see generateStoreMetadata.js). This is safe because the page
      // itself only exists in the locales for which a translation exists.
      return generateEnhancedStoreMetadata({
        store,
        locale,
        arSlug: arSlug || undefined, // ← FIX 2: null → undefined so generator skips it
        enSlug: enSlug || undefined,
        country: country ? { name: country.translations[0]?.name || country.code } : null,
      });
    }

    return {};
  } catch (error) {
    console.error('[generateMetadata] error:', error);
    return {};
  }
}

// =============================================================================
// Page
// =============================================================================

export default async function StorePage({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const tStore      = await getTranslations('StorePage');
    const t           = await getTranslations('StoresPage');
    const currentWeek = getCurrentWeekIdentifier();

    // ── Try as category ────────────────────────────────────────────────────
    const category = await getCategoryData(slug, language, countryCode);
    if (category) {
      const translation    = category.translations[0];
      const stores         = await getStoresData({ language, countryCode, categoryId: category.id });
      const totalVouchers  = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);
      const featuredStores = stores.filter(s => s.isFeatured);
      const regularStores  = stores.filter(s => !s.isFeatured);

      const carouselStores = stores
        .filter(s => s.coverImage)
        .slice(0, 8)
        .map(s => ({ id: s.id, image: s.coverImage, name: s.name, logo: s.logo }));

      return (
        <div className="stores-page-wrapper">
          {carouselStores.length > 0 && <HeroCarousel stores={carouselStores} locale={locale} />}

          <main className="stores-page-content">
            <h1 className="stores-page-title">
              {language === 'ar'
                ? `متاجر ${translation?.name || ''}`
                : `${translation?.name || ''} Stores`}
            </h1>

            <div className="stores-page-stats">
              <span>{t('count', { count: stores.length })}</span>
              <span>{t('voucherCount', { count: totalVouchers })}</span>
            </div>

            {featuredStores.length > 0 && (
              <section className="featured-stores-section">
                <h2>{t('featuredStores')}</h2>
                <StoresGrid stores={featuredStores} locale={locale} />
              </section>
            )}

            <section className="all-stores-section">
              <div className="section-header">
                <h2>{featuredStores.length > 0 ? t('otherStores') : t('allStores')}</h2>
                <span className="section_count">{t('count', { count: regularStores.length })}</span>
              </div>
              <StoresGrid stores={featuredStores.length > 0 ? regularStores : stores} locale={locale} />
            </section>

            <section className="promo-faq-section">
              <PromoCodesFAQ />
            </section>
          </main>

          <HelpBox locale={locale} />
        </div>
      );
    }

    // ── Try as store ───────────────────────────────────────────────────────
    const store = await getStoreData(slug, language, countryCode);

    if (store) {
      const country = await prisma.country.findUnique({
        where:   { code: countryCode, isActive: true },
        include: { translations: { where: { locale: language } } },
      });
      if (!country) return notFound();

      const storeTranslation = store.translations[0];
      const transformedStore = {
        ...store,
        name:        storeTranslation?.name        || slug,
        slug:        storeTranslation?.slug        || slug,
        description: storeTranslation?.description || null,
        coverImage:  store.coverImage,
        categories:  store.categories.map(sc => ({
          id:    sc.category.id,
          name:  sc.category.translations[0]?.name || '',
          slug:  sc.category.translations[0]?.slug || '',
          icon:  sc.category.icon,
          color: sc.category.color,
        })),
      };

      // ── Parallel data fetch ──────────────────────────────────────────────
      const [
        vouchers,
        paymentMethodsData,
        faqs,
        relatedStores,
        storeProducts,
        leaderboardSnapshots,
        relatedPostsRaw,
        otherPromos,
        curatedOffers,
        offerStacks,
      ] = await Promise.all([

        // 1. Vouchers
        prisma.voucher.findMany({
          where: {
            storeId: store.id,
            AND: [
              { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
              { countries: { some: { country: { code: countryCode } } } },
            ],
          },
          include: {
            translations: { where: { locale: language } },
            _count:        { select: { clicks: true } },
          },
          orderBy: [
            { isExclusive:    'desc' },
            { isVerified:     'desc' },
            { popularityScore: 'desc' },
          ],
        }),

        // 2. Payment methods
        prisma.storePaymentMethod.findMany({
          where:   { storeId: store.id, countryId: country.id },
          include: {
            paymentMethod: { include: { translations: { where: { locale: language } } } },
          },
        }),

        // 3. FAQs
        prisma.storeFAQ.findMany({
          where:   { storeId: store.id, countryId: country.id, isActive: true },
          include: { translations: { where: { locale: language } } },
          orderBy: { order: 'asc' },
        }),

        // 4. Related stores (same categories, same country)
        prisma.store.findMany({
          where: {
            id:        { not: store.id },
            isActive:  true,
            countries: { some: { country: { code: countryCode } } },
            categories: {
              some: { categoryId: { in: store.categories.map(sc => sc.categoryId) } },
            },
          },
          include: {
            translations: { where: { locale: language } },
            _count: {
              select: {
                vouchers: {
                  where: {
                    OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
                    countries: { some: { country: { code: countryCode } } },
                  },
                },
              },
            },
          },
          take:    6,
          orderBy: { isFeatured: 'desc' },
        }),

        // 5. Featured products
        prisma.storeProduct.findMany({
          where: {
            storeId:    store.id,
            isFeatured: true,
            countries:  { some: { country: { code: countryCode } } },
          },
          include: { translations: { where: { locale: language } } },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
          take:    12,
        }),

        // 6. Leaderboard snapshots for sidebar
        prisma.storeSavingsSnapshot.findMany({
          where: { storeId: store.id, weekIdentifier: currentWeek },
          take:  1,
        }),

        // 7. Blog posts related to this store
        getStoreRelatedPosts(store.id, language, 6),

        // 8. Other promos (bank/card offers)
        prisma.otherPromo.findMany({
          where: {
            storeId:   store.id,
            countryId: country.id,
            isActive:  true,
            OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
          },
          include: { translations: { where: { locale: language } } },
          orderBy: { order: 'asc' },
        }),

        // 9. Curated offers
        prisma.curatedOffer.findMany({
          where: {
            storeId:  store.id,
            isActive: true,
            countries: { some: { country: { code: countryCode } } },
            OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
          },
          include: { translations: { where: { locale: language } } },
          orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
        }),

        // 10. Offer stacks
        prisma.offerStack.findMany({
          where:   { storeId: store.id, isActive: true },
          include: {
            codeVoucher: { include: { translations: { where: { locale: language } } } },
            dealVoucher: { include: { translations: { where: { locale: language } } } },
            promo: {
              include: {
                translations: { where: { locale: language } },
                bank: { include: { translations: { where: { locale: language } } } },
              },
            },
          },
          orderBy: { order: 'asc' },
        }),
      ]);

      // ── Transform data ─────────────────────────────────────────────────────
      const transformedVouchers = vouchers.map(v => ({
        ...v,
        title:       v.translations[0]?.title       || '',
        description: v.translations[0]?.description || null,
        store:       transformedStore,
      }));

      const allPaymentMethods   = paymentMethodsData.map(spm => ({
        ...spm.paymentMethod,
        name:        spm.paymentMethod.translations[0]?.name        || '',
        description: spm.paymentMethod.translations[0]?.description || null,
      }));
      const bnplMethods         = allPaymentMethods.filter(pm => pm.isBnpl);
      const otherPaymentMethods = allPaymentMethods.filter(pm => !pm.isBnpl);
      const mostTrackedVoucher  = transformedVouchers[0] || null;

      const transformedRelatedStores = relatedStores.map(s => ({
        ...s,
        name: s.translations[0]?.name || '',
        slug: s.translations[0]?.slug || '',
      }));

      const transformedProducts = storeProducts.map(p => ({
        id:            p.id,
        image:         p.image,
        title:         p.translations[0]?.title || '',
        productUrl:    p.productUrl,
        discountValue: p.discountValue,
        discountType:  p.discountType,
      }));

      const relatedPosts = relatedPostsRaw.map(post => ({
        id:            post.id,
        slug:          post.slug,
        title:         post.translations?.[0]?.title   || '',
        excerpt:       post.translations?.[0]?.excerpt  || null,
        featuredImage: post.featuredImage               || null,
        publishedAt:   post.publishedAt,
        category: post.category ? {
          name:  post.category.translations?.[0]?.name || '',
          color: post.category.color                    || '#470ae2',
        } : null,
      }));

      const transformedOtherPromos = otherPromos.map(p => ({
        id:          p.id,
        type:        p.type,
        image:       p.image,
        url:         p.url,
        startDate:   p.startDate,
        expiryDate:  p.expiryDate,
        title:       p.translations[0]?.title       || '',
        description: p.translations[0]?.description || null,
        terms:       p.translations[0]?.terms       || null,
      }));

      const transformedCuratedOffers = curatedOffers.map(o => ({
        id:          o.id,
        type:        o.type,
        offerImage:  o.offerImage,
        code:        o.code,
        ctaUrl:      o.ctaUrl,
        startDate:   o.startDate,
        expiryDate:  o.expiryDate,
        title:       o.translations[0]?.title       || '',
        description: o.translations[0]?.description || null,
        ctaText:     o.translations[0]?.ctaText     || null,
      }));

      const transformedOfferStacks = offerStacks.map(s => ({
        id:    s.id,
        label: s.label,
        codeVoucher: s.codeVoucher ? {
          id:              s.codeVoucher.id,
          code:            s.codeVoucher.code,
          discountPercent: s.codeVoucher.verifiedAvgPercent ?? s.codeVoucher.discountPercent,
          title:           s.codeVoucher.translations[0]?.title || s.codeVoucher.discount || '',
        } : null,
        dealVoucher: s.dealVoucher ? {
          id:              s.dealVoucher.id,
          discountPercent: s.dealVoucher.verifiedAvgPercent ?? s.dealVoucher.discountPercent,
          title:           s.dealVoucher.translations[0]?.title || s.dealVoucher.discount || '',
        } : null,
        promo: s.promo ? {
          id:              s.promo.id,
          discountPercent: s.promo.verifiedAvgPercent ?? s.promo.discountPercent,
          title:           s.promo.translations[0]?.title || s.promo.bank?.translations[0]?.name || '',
          bankName:        s.promo.bank?.translations[0]?.name || null,
        } : null,
      }));

      const codeVouchers     = transformedVouchers.filter(v => v.type === 'CODE');
      const dealVouchers     = transformedVouchers.filter(v => v.type === 'DEAL');
      const shippingVouchers = transformedVouchers.filter(v => v.type === 'FREE_SHIPPING');
      const countryName      = country.translations[0]?.name || country.code;

      const breadcrumbs = [
        { name: language === 'ar' ? 'الرئيسية' : 'Home',   url: `${BASE_URL}/${locale}` },
        { name: language === 'ar' ? 'المتاجر'  : 'Stores', url: `${BASE_URL}/${locale}/stores` },
        { name: transformedStore.name, url: `${BASE_URL}/${locale}/stores/${slug}` },
      ];

      const headerProps = {
        store:          transformedStore,
        mostTrackedVoucher,
        paymentMethods: otherPaymentMethods,
        bnplMethods,
        locale,
        country,
      };

      return (
        <>
          {/* ── Structured data ── */}
          <StoreStructuredData
            store={transformedStore}
            vouchers={transformedVouchers}
            otherPromos={transformedOtherPromos}
            storeProducts={transformedProducts}
            curatedOffers={transformedCuratedOffers}
            offerStacks={transformedOfferStacks}
            locale={locale}
            country={country}
            breadcrumbs={breadcrumbs}
          />
          <FAQStructuredData faqs={faqs} locale={locale} />

          {/* ── Page layout ── */}
          <div className="store-page-layout">
            <Breadcrumbs items={breadcrumbs} locale={locale} />
            <StorePageShell {...headerProps} />

            <div className="store-main-content">
              <div className="store-content-grid">

                {/* ════ MAIN COLUMN ════ */}
                <main className="store-content-main">

                  {codeVouchers.length > 0 && (
                    <section className="vouchers-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">local_offer</span>
                        {tStore('couponCodes')}
                      </h2>
                      <VouchersGrid vouchers={codeVouchers} hideStoreBranding={true} />
                    </section>
                  )}

                  {dealVouchers.length > 0 && (
                    <section className="vouchers-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">shopping_bag</span>
                        {tStore('deals')}
                      </h2>
                      <VouchersGrid vouchers={dealVouchers} hideStoreBranding={true} />
                    </section>
                  )}

                  {shippingVouchers.length > 0 && (
                    <section className="vouchers-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">local_shipping</span>
                        {tStore('freeShipping')}
                      </h2>
                      <VouchersGrid vouchers={shippingVouchers} hideStoreBranding={true} />
                    </section>
                  )}

                  {/* Offer stacks — interactive UI */}
                  <StoreOfferStacks
                    storeId={store.id}
                    locale={locale}
                    countryCode={countryCode || 'SA'}
                  />

                  {/* Other promos — interactive UI */}
                  <OtherPromosSection
                    storeSlug={transformedStore.slug}
                    storeName={transformedStore.name}
                  />

                  {transformedProducts.length > 0 && (
                    <FeaturedProductsCarousel
                      storeSlug={transformedStore.slug}
                      storeName={transformedStore.name}
                      storeLogo={transformedStore.logo}
                      products={transformedProducts}
                    />
                  )}

                  {/* Intelligence card */}
                  <StoreIntelligenceCard
                    storeId={store.id}
                    locale={locale}
                    countryCode={countryCode}
                    variant="full"
                  />

                  {faqs.length > 0 && (
                    <StoreFAQ
                      faqs={faqs}
                      locale={locale}
                      storeName={transformedStore.name}
                      countryName={countryName}
                    />
                  )}

                  {transformedRelatedStores.length > 0 && (
                    <section className="related-stores-section">
                      <h2 className="section-title">
                        <span className="material-symbols-sharp">storefront</span>
                        {tStore('similarStores')}
                      </h2>
                      <div className="related-stores-grid">
                        {transformedRelatedStores.map(s => (
                          <StoreCard key={s.id} store={s} />
                        ))}
                      </div>
                    </section>
                  )}

                </main>

                {/* ════ SIDEBAR ════ */}
                <aside className="store-content-sidebar">

                  {relatedPosts.length > 0 && (
                    <RelatedPostsSidebar
                      posts={relatedPosts}
                      locale={locale}
                    />
                  )}

                  {/* Leaderboard sidebar — uncomment when ready
                  <StoreLeaderboardSidebar
                    storeId={store.id}
                    locale={locale}
                    countryCode={countryCode}
                    snapshots={leaderboardSnapshots}
                  /> */}

                </aside>

              </div>
            </div>

            <HelpBox locale={locale} />
          </div>
        </>
      );
    }

    // Neither category nor store matched
    return notFound();

  } catch (error) {
    console.error('[StorePage] error:', error);
    return notFound();
  }
}
