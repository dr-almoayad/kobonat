// app/[locale]/stores/[slug]/page.jsx
import { prisma } from '@/lib/prisma';
import { notFound, permanentRedirect } from 'next/navigation'; 
import { getTranslations } from 'next-intl/server';
import StorePageShell from '@/components/headers/StorePageShell';
import VouchersGrid from '@/components/VouchersGrid/VouchersGrid';
import StoreFAQ from '@/components/StoreFAQ/StoreFAQ';
import StoreCard from '@/components/StoreCard/StoreCard';
import FeaturedProductsCarousel from '@/components/FeaturedProductsCarousel/FeaturedProductsCarousel';
import OtherPromosSection from '@/components/OtherPromosSection/OtherPromosSection';
import { StoreStructuredSchemas } from '@/lib/seo/storeSchemas';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import RelatedPostsSidebar from '@/components/blog/RelatedPostsSidebar';
import StoreOfferStacks from '@/components/StoreOfferStacks/StoreOfferStacks';
import StoreIntelligenceCard from '@/components/StoreIntelligenceCard/StoreIntelligenceCard';
import { getCategoryData } from '@/lib/storeCategories';
import { getStoreData } from '@/lib/stores';
import { getStoreRelatedPosts } from '@/app/admin/_lib/queries';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import { generateStorePageTitle } from '@/lib/seo/dynamicStoreTitle';
import PromoCodesFAQ from '@/components/PromoCodesFAQ/PromoCodesFAQ';
import HelpBox from '@/components/help/HelpBox';
import ExpiredVouchersList from '@/components/ExpiredVouchersList/ExpiredVouchersList';
import ExpiredOtherPromosList from '@/components/ExpiredOtherPromosList/ExpiredOtherPromosList';
import { getGeneralFaqSchemaEntities } from '@/components/PromoCodesFAQ/PromoCodesFAQSchema';
import './store-page.css';

export const revalidate = 3600;
export const dynamicParams = true; // Forces on‑demand rendering for any missing static param

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// Optimised Static Params (only featured stores, limit 24)
export async function generateStaticParams() {
  try {
    const featuredStoreTranslations = await prisma.storeTranslation.findMany({
      where: {
        store: {
          isActive: true,
          isFeatured: true,
        },
      },
      select: { slug: true, locale: true },
      take: 24,
    });

    const localeMap = { ar: 'ar-SA', en: 'en-SA' }; 
    const params = [];

    for (const t of featuredStoreTranslations) {
      const fullLocale = localeMap[t.locale];
      if (fullLocale && t.slug) {
        params.push({ locale: fullLocale, slug: t.slug });
      }
    }
    return params;
  } catch {
    return [];
  }
}

/**
 * Helper: fallback for old Arabic slugs (or any mismatched slug)
 * Searches for a store translation by name (partial match) in the requested locale.
 * Returns the correct (English) slug if found, otherwise null.
 */
async function handleLegacySlugFallback(slug, language) {
  const hasArabic = /[\u0600-\u06FF]/.test(slug);
  if (!hasArabic) return null;

  const normalized = slug.replace(/-/g, ' ');
  const fallback = await prisma.storeTranslation.findFirst({
    where: {
      locale: language,
      name: { contains: normalized, mode: 'insensitive' },
      store: { isActive: true },
    },
    select: { slug: true },
  });
  return fallback?.slug || null;
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  try {
    const { slug: rawSlug, locale } = await params;
    let slug = decodeURIComponent(rawSlug);
    const [language, countryCode] = locale.split('-');
    const isArabic = language === 'ar';
    const now = new Date();

    // Category redirect check
    const isCategory = await getCategoryData(slug, language, countryCode);
    if (isCategory) {
      return {
        robots: { index: false, follow: true },
        alternates: { canonical: `${BASE_URL}/${locale}/categories/${slug}` },
      };
    }

    let store = await getStoreData(slug, language, countryCode);

    // Fallback: try to redirect from old Arabic slug
    if (!store) {
      const newSlug = await handleLegacySlugFallback(slug, language);
      if (newSlug) {
        // In metadata we return a noindex + canonical pointing to the new URL
        return {
          robots: { index: false, follow: true },
          alternates: { canonical: `${BASE_URL}/${locale}/stores/${newSlug}` },
        };
      }
      return {};
    }

    const storeTranslation = store.translations[0];
    const storeName = storeTranslation?.name || slug;

    // ✅ REMOVED the old noindex block for English – both locales are now indexable

    const otherLocale = language === 'ar' ? 'en' : 'ar';
    const otherTranslation = await prisma.storeTranslation.findFirst({
      where: { storeId: store.id, locale: otherLocale },
      select: { slug: true },
    });

    const arSlug = language === 'ar' ? slug : (otherTranslation?.slug || null);
    const enSlug = language === 'en' ? slug : (otherTranslation?.slug || null);

    const hreflangLanguages = {};
    if (arSlug) hreflangLanguages['ar-SA'] = `${BASE_URL}/ar-SA/stores/${arSlug}`;
    if (enSlug) hreflangLanguages['en-SA'] = `${BASE_URL}/en-SA/stores/${enSlug}`;
    hreflangLanguages['x-default'] = `${BASE_URL}/ar-SA/stores/${arSlug || enSlug || slug}`;

    // Custom SEO if set by admin
    if (storeTranslation?.seoTitle || storeTranslation?.seoDescription) {
      return {
        metadataBase: new URL(BASE_URL),
        title: storeTranslation.seoTitle || storeName,
        description: storeTranslation.seoDescription || storeTranslation?.description || '',
        alternates: { canonical: `${BASE_URL}/${locale}/stores/${slug}`, languages: hreflangLanguages },
        robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 } },
      };
    }

    // Dynamic metadata
    const [voucherCount, savingsAgg] = await Promise.all([
      prisma.voucher.count({
        where: {
          storeId: store.id,
          countries: { some: { country: { code: countryCode } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        },
      }),
      prisma.voucher.findMany({
        where: {
          storeId: store.id,
          countries: { some: { country: { code: countryCode } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
          AND: [{ OR: [{ verifiedAvgPercent: { gt: 0 } }, { discountPercent: { gt: 0 } }] }],
        },
        select: { discountPercent: true, verifiedAvgPercent: true },
      }),
    ]);

    const maxSavings = savingsAgg.reduce((max, v) => {
      const pct = v.verifiedAvgPercent ?? v.discountPercent ?? 0;
      return pct > max ? pct : max;
    }, 0);

    const { title, description: autoDescription } = generateStorePageTitle({
      storeName,
      locale,
      codeCount: voucherCount,
      maxSavings,
    });

    const description = storeTranslation?.description || autoDescription;
    const ogImage = store.coverImage || store.logo || `${BASE_URL}/logo-512x512.png`;

    return {
      metadataBase: new URL(BASE_URL),
      title,
      description,
      alternates: { canonical: `${BASE_URL}/${locale}/stores/${slug}`, languages: hreflangLanguages },
      openGraph: {
        siteName: isArabic ? 'كوبونات' : 'Cobonat',
        title,
        description,
        type: 'website',
        locale,
        url: `${BASE_URL}/${locale}/stores/${slug}`,
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@cobonat',
        title,
        description,
        images: [ogImage],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
      },
    };
  } catch (error) {
    console.error('[stores/[slug] generateMetadata]', error);
    return {};
  }
}

// ── Page Component ─────────────────────────────────────────────────────────────
export default async function StorePage({ params }) {
  try {
    const { slug: rawSlug, locale } = await params;
    let slug = decodeURIComponent(rawSlug);
    const [language, countryCode] = locale.split('-');
    const now = new Date();

    // Category redirect (only once)
    const category = await getCategoryData(slug, language, countryCode);
    if (category) permanentRedirect(`/${locale}/categories/${slug}`);

    let store = await getStoreData(slug, language, countryCode);

    // Fallback redirect from old Arabic slug
    if (!store) {
      const newSlug = await handleLegacySlugFallback(slug, language);
      if (newSlug) {
        return permanentRedirect(`/${locale}/stores/${newSlug}`);
      }
      return notFound();
    }

    const tStore = await getTranslations('StorePage');
    const country = await prisma.country.findUnique({
      where: { code: countryCode, isActive: true },
      include: { translations: { where: { locale: language } } },
    });
    if (!country) return notFound();

    const storeTranslation = store.translations[0];
    const transformedStore = {
      ...store,
      name: storeTranslation?.name || slug,
      slug: storeTranslation?.slug || slug,
      description: storeTranslation?.description || null,
      coverImage: store.coverImage,
      categories: store.categories.map(sc => ({
        id: sc.category.id,
        name: sc.category.translations[0]?.name || '',
        slug: sc.category.translations[0]?.slug || '',
        icon: sc.category.icon,
        color: sc.category.color,
      })),
    };

    const generalFaqEntities = await getGeneralFaqSchemaEntities(locale);

    // Parallel data fetch (reduced complexity)
    const [
      allVouchers,
      paymentMethodsData,
      faqs,
      relatedStores,
      storeProducts,
      relatedPostsRaw,
      expiredOtherPromos,
    ] = await Promise.all([
      prisma.voucher.findMany({
        where: { storeId: store.id, countries: { some: { country: { code: countryCode } } } },
        include: {
          translations: { where: { locale: language } },
          _count: { select: { clicks: true } },
          store: { include: { translations: { where: { locale: language } } } },
        },
        orderBy: [{ expiryDate: 'desc' }, { isExclusive: 'desc' }, { isVerified: 'desc' }, { popularityScore: 'desc' }],
        take: 50,
      }),
      prisma.storePaymentMethod.findMany({
        where: { storeId: store.id, countryId: country.id },
        include: { paymentMethod: { include: { translations: { where: { locale: language } } } } },
      }),
      prisma.storeFAQ.findMany({
        where: { storeId: store.id, countryId: country.id, isActive: true },
        include: { translations: { where: { locale: language } } },
        orderBy: { order: 'asc' },
      }),
      prisma.store.findMany({
        where: {
          id: { not: store.id },
          isActive: true,
          countries: { some: { country: { code: countryCode } } },
          categories: { some: { categoryId: { in: store.categories.map(sc => sc.categoryId) } } },
        },
        include: {
          translations: { where: { locale: language } },
          _count: { select: { vouchers: { where: { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] } } } },
        },
        take: 6,
        orderBy: { isFeatured: 'desc' },
      }),
      prisma.storeProduct.findMany({
        where: { storeId: store.id },
        select: {
          id: true,
          image: true,
          productUrl: true,
          originalPrice: true,
          currentPrice: true,
          discountValue: true,
          discountType: true,
          translations: { where: { locale: language }, select: { title: true } },
          linkedVoucher: {
            select: {
              id: true,
              code: true,
              type: true,
              discount: true,
              discountPercent: true,
              verifiedAvgPercent: true,
              translations: { where: { locale: language }, select: { title: true } },
            },
          },
          linkedPromo: {
            select: {
              id: true,
              type: true,
              url: true,
              discountPercent: true,
              verifiedAvgPercent: true,
              installmentMonths: true,
              translations: { where: { locale: language }, select: { title: true } },
              bank: { select: { logo: true, translations: { where: { locale: language }, select: { name: true } } } },
              paymentMethod: { select: { logo: true, isBnpl: true, translations: { where: { locale: language }, select: { name: true } } } },
              card: { select: { maxInstallmentMonths: true } },
            },
          },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        take: 24,
      }),
      getStoreRelatedPosts(store.id, language, 6),
      prisma.otherPromo.findMany({
        where: {
          storeId: store.id,
          countryId: country.id,
          isActive: true,
          expiryDate: { lt: now },
        },
        include: {
          translations: { where: { locale: language } },
          bank: { include: { translations: { where: { locale: language } } } },
          paymentMethod: { include: { translations: { where: { locale: language } } } },
          card: true,
        },
        orderBy: { order: 'asc' },
        take: 10,
      }),
    ]);

    const activeVouchers = allVouchers.filter(v => !v.expiryDate || v.expiryDate >= now);
    const expiredVouchers = allVouchers.filter(v => v.expiryDate && v.expiryDate < now).slice(0, 10);

    const transformedVouchers = activeVouchers.map(v => ({
      ...v,
      title: v.translations[0]?.title || '',
      description: v.translations[0]?.description || null,
      store: transformedStore,
    }));

    let latestVoucherDate = null;
    if (activeVouchers.length > 0) {
      const latestVoucher = activeVouchers.reduce((latest, v) => {
        const vDate = v.updatedAt ? new Date(v.updatedAt) : new Date(0);
        const latestDate = latest?.updatedAt ? new Date(latest.updatedAt) : new Date(0);
        return vDate > latestDate ? v : latest;
      }, null);
      latestVoucherDate = latestVoucher?.updatedAt ? new Date(latestVoucher.updatedAt).toISOString() : null;
    }
    if (!latestVoucherDate && store.updatedAt) latestVoucherDate = new Date(store.updatedAt).toISOString();

    const maxSavings = Math.max(...transformedVouchers.map(v => v.verifiedAvgPercent ?? v.discountPercent ?? 0), 0);
    const heroSubtitle = (() => {
      const codes = transformedVouchers.length;
      const savings = maxSavings;
      if (codes === 0) return language === 'ar' ? 'لا توجد أكواد نشطة حالياً' : 'No active codes currently';
      if (savings > 0) return language === 'ar' ? `${codes} كود نشط • وفر حتى ${savings}%` : `${codes} active codes • Save up to ${savings}%`;
      return language === 'ar' ? `${codes} كود نشط` : `${codes} active codes`;
    })();

    const transformedExpiredOtherPromos = expiredOtherPromos.map(p => ({
      id: p.id,
      type: p.type,
      image: p.image,
      url: p.url,
      startDate: p.startDate,
      expiryDate: p.expiryDate,
      discountPercent: p.discountPercent ?? null,
      verifiedAvgPercent: p.verifiedAvgPercent ?? null,
      title: p.translations[0]?.title || '',
      description: p.translations[0]?.description || null,
      terms: p.translations[0]?.terms || null,
      bank: p.bank ? { name: p.bank.translations[0]?.name || '', logo: p.bank.logo } : null,
      paymentMethod: p.paymentMethod
        ? {
            name: p.paymentMethod.translations[0]?.name || '',
            logo: p.paymentMethod.logo,
            type: p.paymentMethod.type,
            isBnpl: p.paymentMethod.isBnpl,
          }
        : null,
      card: p.card,
      voucherCode: p.voucherCode,
    }));

    const allPaymentMethods = paymentMethodsData.map(spm => ({
      ...spm.paymentMethod,
      name: spm.paymentMethod.translations[0]?.name || '',
      description: spm.paymentMethod.translations[0]?.description || null,
    }));
    const bnplMethods = allPaymentMethods.filter(pm => pm.isBnpl);
    const otherPaymentMethods = allPaymentMethods.filter(pm => !pm.isBnpl);
    const mostTrackedVoucher = transformedVouchers[0] || null;

    const transformedRelatedStores = relatedStores.map(s => ({
      ...s,
      name: s.translations[0]?.name || '',
      slug: s.translations[0]?.slug || '',
    }));

    const transformedProducts = storeProducts.map(p => ({
      id: p.id,
      image: p.image,
      title: p.translations[0]?.title || '',
      productUrl: p.productUrl,
      originalPrice: p.originalPrice,
      currentPrice: p.currentPrice,
      discountValue: p.discountValue,
      discountType: p.discountType,
      voucher: p.linkedVoucher,
      otherPromo: p.linkedPromo,
      storeName: transformedStore.name,
      storeLogo: transformedStore.logo,
    }));

    const relatedPosts = relatedPostsRaw.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.translations?.[0]?.title || '',
      excerpt: post.translations?.[0]?.excerpt || null,
      featuredImage: post.featuredImage || null,
      publishedAt: post.publishedAt,
      category: post.category
        ? {
            name: post.category.translations?.[0]?.name || '',
            color: post.category.color || '#470ae2',
          }
        : null,
    }));

    const codeVouchers = transformedVouchers.filter(v => v.type === 'CODE');
    const dealVouchers = transformedVouchers.filter(v => v.type === 'DEAL');
    const shippingVouchers = transformedVouchers.filter(v => v.type === 'FREE_SHIPPING');
    const countryName = country.translations[0]?.name || country.code;

    const { h1: pageH1, title: pageTitle, description: autoDescription } = generateStorePageTitle({
      storeName: transformedStore.name,
      locale,
      codeCount: transformedVouchers.length,
      maxSavings,
    });
    const pageDescription = storeTranslation?.seoDescription || transformedStore.description || autoDescription;

    const breadcrumbItems = [
      { name: language === 'ar' ? 'الرئيسية' : 'Home', url: `${BASE_URL}/${locale}` },
      { name: language === 'ar' ? 'المتاجر' : 'Stores', url: `${BASE_URL}/${locale}/stores` },
      { name: transformedStore.name, url: `${BASE_URL}/${locale}/stores/${slug}` },
    ];

    const headerProps = {
      store: transformedStore,
      mostTrackedVoucher,
      paymentMethods: otherPaymentMethods,
      bnplMethods,
      locale,
      country,
      voucherCount: transformedVouchers.length,
      maxSavings,
      pageH1,
      heroSubtitle,
      latestVoucherDate,
    };

    return (
      <>
        <StoreStructuredSchemas
          storeName={transformedStore.name}
          storeSlug={transformedStore.slug}
          title={storeTranslation?.seoTitle || pageTitle}
          description={pageDescription}
          locale={locale}
          voucherCount={transformedVouchers.length}
          maxSavings={maxSavings}
          updatedAt={store.updatedAt}
          faqs={faqs}
          generalFaqs={generalFaqEntities}
          breadcrumbs={breadcrumbItems}
        />

        <div className="store-page-layout">
          <Breadcrumbs items={breadcrumbItems} locale={locale} />
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
                    <VouchersGrid vouchers={codeVouchers} hideStoreBranding />
                  </section>
                )}

                {dealVouchers.length > 0 && (
                  <section className="vouchers-section">
                    <h2 className="section-title">
                      <span className="material-symbols-sharp">shopping_bag</span>
                      {tStore('deals')}
                    </h2>
                    <VouchersGrid vouchers={dealVouchers} hideStoreBranding />
                  </section>
                )}

                {shippingVouchers.length > 0 && (
                  <section className="vouchers-section">
                    <h2 className="section-title">
                      <span className="material-symbols-sharp">local_shipping</span>
                      {tStore('freeShipping')}
                    </h2>
                    <VouchersGrid vouchers={shippingVouchers} hideStoreBranding />
                  </section>
                )}

                <StoreOfferStacks storeId={store.id} locale={locale} countryCode={countryCode || 'SA'} />
                <OtherPromosSection storeSlug={transformedStore.slug} storeName={transformedStore.name} storeLogo={transformedStore.logo} />

                {transformedProducts.length > 0 && (
                  <FeaturedProductsCarousel
                    storeSlug={transformedStore.slug}
                    storeName={transformedStore.name}
                    storeLogo={transformedStore.logo}
                    products={transformedProducts}
                  />
                )}

                <StoreIntelligenceCard storeId={store.id} locale={locale} countryCode={countryCode || 'SA'} />

                {faqs.length > 0 && <StoreFAQ faqs={faqs} locale={locale} storeName={transformedStore.name} countryName={countryName} />}

                {expiredVouchers.length > 0 && <ExpiredVouchersList vouchers={expiredVouchers} />}

                {transformedExpiredOtherPromos.length > 0 && (
                  <ExpiredOtherPromosList promos={transformedExpiredOtherPromos} storeName={transformedStore.name} storeLogo={transformedStore.logo} />
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

              <aside className="store-content-sidebar">
                {relatedPosts.length > 0 && <RelatedPostsSidebar posts={relatedPosts} locale={locale} />}
              </aside>
            </div>
          </div>

          <PromoCodesFAQ includeStructuredData={false} />
          <HelpBox locale={locale} />
        </div>
      </>
    );
  } catch (error) {
    console.error('[StorePage] error:', error);
    return notFound();
  }
                                  }
