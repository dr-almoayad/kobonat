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
import StoreIntelligenceCard from '@/components/StoreIntelligenceCard/StoreIntelligenceCard';
import StoreOfferStacks from '@/components/StoreOfferStacks/StoreOfferStacks';
import { getCategoryData } from '@/lib/storeCategories';
import { getStoreData } from '@/lib/stores';
import { getStoreRelatedPosts } from '@/app/admin/_lib/queries';
import { generateEnhancedStoreMetadata } from '@/lib/seo/generateStoreMetadata';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import { generateStorePageTitle } from '@/lib/seo/dynamicStoreTitle';
import PromoCodesFAQ from '@/components/PromoCodesFAQ/PromoCodesFAQ';
import HelpBox from '@/components/help/HelpBox';
import ExpiredVouchersList from '@/components/ExpiredVouchersList/ExpiredVouchersList';
import ExpiredOtherPromosList from '@/components/ExpiredOtherPromosList/ExpiredOtherPromosList';
import './store-page.css';

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Static params ─────────────────────────────────────────────────────────────
// ✅ NEW: Pre-renders every active store at build time so Arabic Googlebot
//    receives a fully populated HTML response rather than hitting a cold server.
//    Eliminates crawl-budget waste and ensures maxSavings/title accuracy on
//    first crawl.
export async function generateStaticParams() {
  try {
    const translations = await prisma.storeTranslation.findMany({
      where:  { store: { isActive: true } },
      select: { slug: true, locale: true },
    });

    const localeMap = { ar: 'ar-SA', en: 'en-SA' };
    const params    = [];

    for (const t of translations) {
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

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const isArabic = language === 'ar';
    const now      = new Date();

    // If slug belongs to a category, redirect — metadata not needed
    const isCategory = await getCategoryData(slug, language, countryCode);
    if (isCategory) return {};

    const store = await getStoreData(slug, language, countryCode);
    if (!store) return {};

    const storeTranslation = store.translations[0];
    const storeName        = storeTranslation?.name || slug;

    const otherLocale = language === 'ar' ? 'en' : 'ar';
    const otherTranslation = await prisma.storeTranslation.findFirst({
      where:  { storeId: store.id, locale: otherLocale },
      select: { slug: true },
    });

    const arSlug = language === 'ar' ? slug : (otherTranslation?.slug || null);
    const enSlug = language === 'en' ? slug : (otherTranslation?.slug || null);

    const hreflangLanguages = {};
    if (arSlug) hreflangLanguages['ar-SA'] = `${BASE_URL}/ar-SA/stores/${arSlug}`;
    if (enSlug) hreflangLanguages['en-SA'] = `${BASE_URL}/en-SA/stores/${enSlug}`;
    // ✅ Always include x-default — even when arSlug is null, fall back to the
    //    current slug so Google never sees x-default pointing nowhere.
    hreflangLanguages['x-default'] = `${BASE_URL}/ar-SA/stores/${arSlug || enSlug || slug}`;

    // ── If admin has set a custom SEO title/description, use it verbatim ──
    if (storeTranslation?.seoTitle || storeTranslation?.seoDescription) {
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

    // ── Dynamic metadata ────────────────────────────────────────────────────
    // ✅ FIX: The original code had two `OR` keys in the savings query.
    //    JavaScript silently drops the first key when two keys share the same
    //    name, so expired vouchers were being included in maxSavings.
    //    The fix: separate the expiry filter and the discount filter using AND.
    const [voucherCount, savingsAgg] = await Promise.all([
      prisma.voucher.count({
        where: {
          storeId:   store.id,
          countries: { some: { country: { code: countryCode } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        },
      }),
      prisma.voucher.findMany({
        where: {
          storeId:   store.id,
          countries: { some: { country: { code: countryCode } } },
          // Expiry filter
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
          // Discount filter — use AND to avoid JS key collision
          AND: [
            {
              OR: [
                { verifiedAvgPercent: { not: null, gt: 0 } },
                { discountPercent:    { not: null, gt: 0 } },
              ],
            },
          ],
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
      codeCount:  voucherCount,
      maxSavings,
    });

    const description = storeTranslation?.description || autoDescription;
    const ogImage     = store.coverImage || store.logo || `${BASE_URL}/logo-512x512.png`;

    return {
      metadataBase: new URL(BASE_URL),
      icons: {
        icon:  [
          { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
        ],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
      },
      title,
      description,
      alternates: {
        canonical: `${BASE_URL}/${locale}/stores/${slug}`,
        languages: hreflangLanguages,
      },
      openGraph: {
        siteName:    isArabic ? 'كوبونات' : 'Cobonat',
        title,
        description,
        type:        'website',
        locale,
        url:         `${BASE_URL}/${locale}/stores/${slug}`,
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: {
        card:        'summary_large_image',
        site:        '@cobonat',
        title,
        description,
        images: [ogImage],
      },
      robots: {
        index:  true,
        follow: true,
        googleBot: {
          index:  true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet':       -1,
        },
      },
    };
  } catch (error) {
    console.error('[stores/[slug] generateMetadata]', error);
    return {};
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StorePage({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const currentWeek = getCurrentWeekIdentifier();
    const now         = new Date();

    // Category redirect
    const category = await getCategoryData(slug, language, countryCode);
    if (category) permanentRedirect(`/${locale}/categories/${slug}`);

    // Fetch store
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
      allVouchers,
      paymentMethodsData,
      faqs,
      relatedStores,
      storeProducts,
      relatedPostsRaw,
      allOtherPromos,
      curatedOffers,
      offerStacks,
    ] = await Promise.all([
      prisma.voucher.findMany({
        where: {
          storeId:   store.id,
          countries: { some: { country: { code: countryCode } } },
        },
        include: {
          translations: { where: { locale: language } },
          _count:       { select: { clicks: true } },
          store:        { include: { translations: { where: { locale: language } } } },
        },
        orderBy: [
          { expiryDate:      'desc' },
          { isExclusive:     'desc' },
          { isVerified:      'desc' },
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
          id:       { not: store.id },
          isActive: true,
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
                  OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
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
        },
        include: {
          translations:  { where: { locale: language } },
          bank:          { include: { translations: { where: { locale: language } } } },
          paymentMethod: { include: { translations: { where: { locale: language } } } },
          card:          true,
        },
        orderBy: { order: 'asc' },
      }),
      prisma.curatedOffer.findMany({
        where: {
          storeId:  store.id,
          isActive: true,
          countries: { some: { country: { code: countryCode } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
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

    // Split vouchers
    const activeVouchers  = allVouchers.filter(v => !v.expiryDate || v.expiryDate >= now);
    const expiredVouchers = allVouchers.filter(v => v.expiryDate && v.expiryDate < now).slice(0, 10);

    // Split other promos
    const activeOtherPromos  = allOtherPromos.filter(p => !p.expiryDate || p.expiryDate >= now);
    const expiredOtherPromos = allOtherPromos.filter(p => p.expiryDate && p.expiryDate < now).slice(0, 10);

    // Transform active vouchers
    const transformedVouchers = activeVouchers.map(v => ({
      ...v,
      title:       v.translations[0]?.title       || '',
      description: v.translations[0]?.description || null,
      store:       transformedStore,
    }));

    // Payment methods
    const allPaymentMethods   = paymentMethodsData.map(spm => ({
      ...spm.paymentMethod,
      name:        spm.paymentMethod.translations[0]?.name        || '',
      description: spm.paymentMethod.translations[0]?.description || null,
    }));
    const bnplMethods         = allPaymentMethods.filter(pm => pm.isBnpl);
    const otherPaymentMethods = allPaymentMethods.filter(pm => !pm.isBnpl);
    const mostTrackedVoucher  = transformedVouchers[0] || null;

    // Related stores
    const transformedRelatedStores = relatedStores.map(s => ({
      ...s,
      name: s.translations[0]?.name || '',
      slug: s.translations[0]?.slug || '',
    }));

    // Products
    const transformedProducts = storeProducts.map(p => ({
      id:            p.id,
      image:         p.image,
      title:         p.translations[0]?.title || '',
      productUrl:    p.productUrl,
      discountValue: p.discountValue,
      discountType:  p.discountType,
    }));

    // Related blog posts
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

    // Active other promos
    const transformedOtherPromos = activeOtherPromos.map(p => ({
      id:                 p.id,
      type:               p.type,
      image:              p.image,
      url:                p.url,
      startDate:          p.startDate,
      expiryDate:         p.expiryDate,
      discountPercent:    p.discountPercent    ?? null,
      verifiedAvgPercent: p.verifiedAvgPercent ?? null,
      title:              p.translations[0]?.title       || '',
      description:        p.translations[0]?.description || null,
      terms:              p.translations[0]?.terms       || null,
      bank: p.bank ? {
        name: p.bank.translations[0]?.name || '',
        logo: p.bank.logo,
      } : null,
      paymentMethod: p.paymentMethod ? {
        name:   p.paymentMethod.translations[0]?.name || '',
        logo:   p.paymentMethod.logo,
        type:   p.paymentMethod.type,
        isBnpl: p.paymentMethod.isBnpl,
      } : null,
      card:        p.card,
      voucherCode: p.voucherCode,
    }));

    // Curated offers
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

    // Offer stacks
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

    // Categorised vouchers
    const codeVouchers     = transformedVouchers.filter(v => v.type === 'CODE');
    const dealVouchers     = transformedVouchers.filter(v => v.type === 'DEAL');
    const shippingVouchers = transformedVouchers.filter(v => v.type === 'FREE_SHIPPING');
    const countryName      = country.translations[0]?.name || country.code;

    // ── Compute page H1 — same function as generateMetadata uses ──────────
    // ✅ FIX: The page component now derives its own H1 from generateStorePageTitle
    //    so the visible <h1> matches the <title> tag exactly. Previously the
    //    H1 was whatever StoreHeader rendered (just store.name), creating a
    //    keyword mismatch that hurt Arabic relevance signals.
    //
    //    ⚠️  ACTION REQUIRED: In StoreHeader.jsx, change the existing H1 tag
    //    that renders store.name to use the `pageH1` prop passed through
    //    headerProps. If StoreHeader renders its own H1 independently, change
    //    it to an H2 or remove it to avoid duplicate H1s on the page.
    const maxSavingsForTitle = Math.max(
      ...transformedVouchers.map(v => v.verifiedAvgPercent ?? v.discountPercent ?? 0),
      ...transformedOtherPromos.map(p => p.verifiedAvgPercent ?? p.discountPercent ?? 0),
      0
    );

    const { h1: pageH1, title: pageTitle, description: autoDescription } = generateStorePageTitle({
      storeName:  transformedStore.name,
      locale,
      codeCount:  transformedVouchers.length,
      maxSavings: maxSavingsForTitle,
    });

    const pageDescription = storeTranslation?.seoDescription || transformedStore.description || autoDescription;

    // Breadcrumbs (absolute URLs)
    const breadcrumbs = [
      { name: language === 'ar' ? 'الرئيسية' : 'Home',   url: `${BASE_URL}/${locale}` },
      { name: language === 'ar' ? 'المتاجر'  : 'Stores', url: `${BASE_URL}/${locale}/stores` },
      { name: transformedStore.name, url: `${BASE_URL}/${locale}/stores/${slug}` },
    ];

    // Props for StorePageShell → StoreHeader
    // pageH1 is included so StoreHeader can render the correct heading text
    const headerProps = {
      store:            transformedStore,
      mostTrackedVoucher,
      paymentMethods:   otherPaymentMethods,
      bnplMethods,
      locale,
      country,
      voucherCount:     transformedVouchers.length,
      maxSavings:       maxSavingsForTitle,
      // ✅ NEW: Pass computed H1 string through to StoreHeader so the visible
      //    heading matches the <title> tag. StoreHeader should render this as
      //    its <h1> instead of building its own from store.name alone.
      pageH1,
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
          maxSavings={maxSavingsForTitle}
          updatedAt={store.updatedAt}
          faqs={faqs}
          breadcrumbs={breadcrumbs}
        />

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
                  storeLogo={transformedStore.logo}
                />

                {transformedProducts.length > 0 && (
                  <FeaturedProductsCarousel
                    storeSlug={transformedStore.slug}
                    storeName={transformedStore.name}
                    storeLogo={transformedStore.logo}
                    products={transformedProducts}
                  />
                )}

                {faqs.length > 0 && (
                  <StoreFAQ
                    faqs={faqs}
                    locale={locale}
                    storeName={transformedStore.name}
                    countryName={countryName}
                  />
                )}

                {expiredVouchers.length > 0 && (
                  <ExpiredVouchersList vouchers={expiredVouchers} />
                )}

                {expiredOtherPromos.length > 0 && (
                  <ExpiredOtherPromosList
                    promos={expiredOtherPromos}
                    storeName={transformedStore.name}
                    storeLogo={transformedStore.logo}
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

              <aside className="store-content-sidebar">
                {relatedPosts.length > 0 && (
                  <RelatedPostsSidebar posts={relatedPosts} locale={locale} />
                )}
              </aside>
            </div>
          </div>

          <PromoCodesFAQ />
          <HelpBox locale={locale} />
        </div>
      </>
    );

  } catch (error) {
    console.error('[StorePage] error:', error);
    return notFound();
  }
}
