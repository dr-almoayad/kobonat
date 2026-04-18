// app/[locale]/stores/[slug]/page.jsx
// CHANGE vs previous version:
//  - Category branch now 301-redirects to /categories/[slug]
//  - All store handling is unchanged
//  - Removes the dual-purpose routing that confused Google

import { prisma } from '@/lib/prisma';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import StorePageShell from '@/components/headers/StorePageShell';
import VouchersGrid from '@/components/VouchersGrid/VouchersGrid';
import StoreFAQ from '@/components/StoreFAQ/StoreFAQ';
import StoreCard from '@/components/StoreCard/StoreCard';
import FeaturedProductsCarousel from '@/components/FeaturedProductsCarousel/FeaturedProductsCarousel';
import OtherPromosSection from '@/components/OtherPromosSection/OtherPromosSection';
import FAQStructuredData from '@/components/StructuredData/FAQStructuredData';
import StoreStructuredData from '@/components/StructuredData/StoreStructuredData';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import RelatedPostsSidebar from '@/components/blog/RelatedPostsSidebar';
import StoreIntelligenceCard from '@/components/StoreIntelligenceCard/StoreIntelligenceCard';
import StoreOfferStacks from '@/components/StoreOfferStacks/StoreOfferStacks';
import { getCategoryData } from '@/lib/storeCategories';
import { getStoreData } from '@/lib/stores';
import { getStoreRelatedPosts } from '@/app/admin/_lib/queries';
import { generateEnhancedStoreMetadata } from '@/lib/seo/generateStoreMetadata';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';

import PromoCodesFAQ from '@/components/PromoCodesFAQ/PromoCodesFAQ';
import HelpBox from '@/components/help/HelpBox';
import './store-page.css';

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const isArabic = language === 'ar';

    // If it's a category slug, metadata is handled by /categories/[slug]/page.jsx
    // Return empty here — the redirect in the Page component will handle it.
    const isCategory = await getCategoryData(slug, language, countryCode);
    if (isCategory) return {};

    const country = await prisma.country.findUnique({
      where:   { code: countryCode, isActive: true },
      include: { translations: { where: { locale: language } } },
    });

    const store = await getStoreData(slug, language, countryCode);
    if (!store) return {};

    const storeTranslation = store.translations[0];

    // Look up the other-locale slug for hreflang
    const otherLocale      = language === 'ar' ? 'en' : 'ar';
    const otherTranslation = await prisma.storeTranslation.findFirst({
      where:  { storeId: store.id, locale: otherLocale },
      select: { slug: true },
    });

    const arSlug = language === 'ar' ? slug : (otherTranslation?.slug || null);
    const enSlug = language === 'en' ? slug : (otherTranslation?.slug || null);

    // Build hreflang only for locales with a real translation
    const hreflangLanguages = {};
    if (arSlug) hreflangLanguages['ar-SA'] = `${BASE_URL}/ar-SA/stores/${arSlug}`;
    if (enSlug) hreflangLanguages['en-SA'] = `${BASE_URL}/en-SA/stores/${enSlug}`;
    hreflangLanguages['x-default'] = `${BASE_URL}/ar-SA/stores/${arSlug || slug}`;

    // Fast-exit: use explicit SEO fields when set in the admin
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
        description: storeTranslation.seoDescription || storeTranslation?.description || '',
        alternates: {
          canonical: `${BASE_URL}/${locale}/stores/${slug}`,
          languages: hreflangLanguages,
        },
        openGraph: {
          siteName:    isArabic ? 'كوبونات' : 'Cobonat',
          title:       storeTranslation.seoTitle || storeName,
          description: storeTranslation.seoDescription || storeTranslation?.description || '',
          type:        'website',
          locale,
          url:         `${BASE_URL}/${locale}/stores/${slug}`,
          images: store.coverImage
            ? [{ url: store.coverImage, width: 1200, height: 630 }]
            : [],
        },
      };
    }

    return generateEnhancedStoreMetadata({
      store,
      locale,
      arSlug: arSlug || undefined,
      enSlug: enSlug || undefined,
      country: country ? { name: country.translations[0]?.name || country.code } : null,
    });
  } catch (error) {
    console.error('[stores/[slug] generateMetadata]', error);
    return {};
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StorePage({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const currentWeek = getCurrentWeekIdentifier();

    // ── CATEGORY REDIRECT ────────────────────────────────────────────────────
    // If the slug matches a category, permanently redirect to /categories/[slug].
    // This consolidates the canonical URL at /categories/* and passes any link
    // equity from old /stores/* category URLs to the new canonical location.
    const category = await getCategoryData(slug, language, countryCode);
    if (category) {
      permanentRedirect(`/${locale}/categories/${slug}`);
    }

    // ── STORE PAGE ───────────────────────────────────────────────────────────
    const store = await getStoreData(slug, language, countryCode);
    if (!store) return notFound();

    const tStore = await getTranslations('StorePage');

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

    // Parallel data fetch
    const [
      vouchers,
      paymentMethodsData,
      faqs,
      relatedStores,
      storeProducts,
      relatedPostsRaw,
      otherPromos,
      curatedOffers,
      offerStacks,
    ] = await Promise.all([

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
          _count: { select: { clicks: true } },
        },
        orderBy: [
          { isExclusive:    'desc' },
          { isVerified:     'desc' },
          { popularityScore: 'desc' },
        ],
      }),

      prisma.storePaymentMethod.findMany({
        where:   { storeId: store.id, countryId: country.id },
        include: {
          paymentMethod: { include: { translations: { where: { locale: language } } } },
        },
      }),

      prisma.storeFAQ.findMany({
        where:   { storeId: store.id, countryId: country.id, isActive: true },
        include: { translations: { where: { locale: language } } },
        orderBy: { order: 'asc' },
      }),

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

      getStoreRelatedPosts(store.id, language, 6),

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

    // Transform
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

        <div className="store-page-layout">
          <Breadcrumbs items={breadcrumbs} locale={locale} />
          <StorePageShell {...headerProps} />

          <div className="store-main-content">
            <div className="store-content-grid">

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

                <StoreOfferStacks
                  storeId={store.id}
                  locale={locale}
                  countryCode={countryCode || 'SA'}
                />

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

                {/*<StoreIntelligenceCard
                  storeId={store.id}
                  locale={locale}
                  countryCode={countryCode}
                  variant="full"
                />*/}

                {faqs.length > 0 && (
                  <StoreFAQ
                    faqs={faqs}
                    locale={locale}
                    storeName={transformedStore.name}
                    countryName={countryName}
                  />
                )}

              </main>

              <aside className="store-content-sidebar">
                {relatedPosts.length > 0 && (
                  <RelatedPostsSidebar posts={relatedPosts} locale={locale} />
                )}
              </aside>

            </div>
          </div>
          
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
          
          <PromoCodesFAQ/>
          <HelpBox locale={locale} />
        </div>
      </>
    );

  } catch (error) {
    console.error('[StorePage] error:', error);
    return notFound();
  }
}
