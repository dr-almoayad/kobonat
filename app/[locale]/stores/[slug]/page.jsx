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
import HelpBox from '@/components/help/HelpBox';
import ExpiredVouchersList from '@/components/ExpiredVouchersList/ExpiredVouchersList';
import ExpiredOtherPromosList from '@/components/ExpiredOtherPromosList/ExpiredOtherPromosList';
import StoreHowToGuide from '@/components/StoreHowToGuide/StoreHowToGuide';
import './store-page.css';

export const revalidate = 3600;
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateStaticParams() {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: {
        translations: {
          where: { locale: { in: ['ar', 'en'] } },
          select: { slug: true, locale: true },
        },
      },
    });

    const params = [];
    for (const store of stores) {
      for (const t of store.translations) {
        if (t.slug) {
          const locale = t.locale === 'ar' ? 'ar-SA' : 'en-SA';
          params.push({ locale, slug: t.slug });
        }
      }
    }
    return params;
  } catch (error) {
    console.error('[generateStaticParams] error:', error);
    return [];
  }
}

// ── Helper: Strict 301 redirect using the redirect table ──
async function handleSlugRedirect(slug, language) {
  const redirect = await prisma.storeSlugRedirect.findUnique({
    where: { oldSlug: slug }
  });
  if (redirect && redirect.locale === language) {
    return redirect.newSlug;
  }
  return null;
}

// ── Helper: get a valid logo URL ──
function getStoreLogoUrl(store) {
  if (!store?.logo) return null;
  if (store.logo.startsWith('http')) return store.logo;
  if (store.logo.startsWith('/')) return `${BASE_URL}${store.logo}`;
  return `${BASE_URL}/stores/${store.logo.toLowerCase().replace(/\s+/g, '-')}.webp`;
}

// ── Helper: get a valid cover image URL ─────────────────────────────────────
// ✅ FIX: the previous inline expression built a URL even when store.coverImage
// was null/undefined — `${store.coverImage?.startsWith('/') ? '' : '/'}` evaluates
// to '/' when coverImage is nullish (undefined is falsy), so the result was
// `${BASE_URL}/` (e.g. "https://cobonat.me/") instead of an empty string. That
// truthy-but-wrong value then survived `storeCoverUrl || null` unchanged, so
// every store WITHOUT a cover image rendered a banner pointing at the bare
// domain root instead of falling back to the placeholder background.
function getStoreCoverUrl(store) {
  if (!store?.coverImage) return null;
  if (store.coverImage.startsWith('http')) return store.coverImage;
  return `${BASE_URL}${store.coverImage.startsWith('/') ? '' : '/'}${store.coverImage}`;
}

// ── Helper: consistent thin-content signal, safe with or without a resolved
// country row. Used by generateMetadata so both the happy path and the
// country-lookup-failed fallback apply the exact same rule (previously the
// fallback branch only checked voucherCount + description and silently
// ignored productCount, which could noindex a store with real product
// content in that edge case). ──────────────────────────────────────────────
async function getStoreContentSignal({ storeId, countryId, countryCode, now }) {
  const [voucherCount, faqCount, promoCount, productCount] = await Promise.all([
    prisma.voucher.count({
      where: {
        storeId,
        countries: { some: { country: { code: countryCode } } },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
    }),
    countryId
      ? prisma.storeFAQ.count({ where: { storeId, countryId, isActive: true } })
      : Promise.resolve(0),
    countryId
      ? prisma.otherPromo.count({ where: { storeId, countryId, isActive: true } })
      : Promise.resolve(0),
    prisma.storeProduct.count({ where: { storeId } }),
  ]);

  return { voucherCount, faqCount, promoCount, productCount };
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  try {
    const { slug: rawSlug, locale } = await params;
    const slug = decodeURIComponent(rawSlug);
    const [language, countryCode] = locale.split('-');
    const isArabic = language === 'ar';
    const now = new Date();
    const currentYear = now.getFullYear();

    // ── 1. Fetch store ──────────────────────────────────────────────────────
    const store = await getStoreData(slug, language, countryCode);

    // Redirect if slug exists in redirect table
    if (!store) {
      const newSlug = await handleSlugRedirect(slug, language);
      if (newSlug) {
        // Return minimal metadata – page component will handle the actual redirect
        return {
          robots: { index: false, follow: true },
          alternates: { canonical: `${BASE_URL}/${locale}/stores/${newSlug}` },
        };
      }
      return {};
    }

    const storeTranslation = store.translations[0] || {};
    const storeName = storeTranslation.name || slug;
    const hasDescription = !!(storeTranslation.description && storeTranslation.description.trim().length > 0);

    // ── 2. Fetch country (needed for faq/promo counts) ─────────────────────
    const country = await prisma.country.findUnique({
      where: { code: countryCode, isActive: true },
    });

    // ✅ FIX: content-signal computation is now shared between the happy path
    // and the country-lookup-failed fallback, so both apply identical rules
    // (previously the fallback ignored productCount entirely).
    const { voucherCount, faqCount, promoCount, productCount } = await getStoreContentSignal({
      storeId: store.id,
      countryId: country?.id ?? null,
      countryCode,
      now,
    });

    const hasSubstantialContent = voucherCount > 0 || faqCount > 0 || promoCount > 0 || productCount > 0 || hasDescription;
    const isThinContent = !hasSubstantialContent;
    const shouldIndex = !isThinContent;

    const canonicalUrl = `${BASE_URL}/${locale}/stores/${slug}`;
    const ogImage = store.coverImage || store.logo || `${BASE_URL}/logo-512x512.png`;
    const finalOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

    if (!country) {
      // No active country row for this locale — the page itself will 404,
      // so metadata just needs to be safe and noindexed, not fully SEO'd.
      return {
        metadataBase: new URL(BASE_URL),
        title: isArabic ? `كود خصم ${storeName} السعودية ${currentYear}` : `Verified ${storeName} Promo Codes KSA - ${currentYear}`,
        description: isArabic ? `أكواد خصم ${storeName} مجربة وفعالة في السعودية` : `Verified ${storeName} promo codes and KSA offers.`,
        alternates: { canonical: canonicalUrl },
        robots: { index: false, follow: true },
        openGraph: {
          siteName: isArabic ? 'كوبونات' : 'Cobonat',
          type: 'website',
          locale,
          url: canonicalUrl,
          images: [{ url: finalOgImage, width: 1200, height: 630, alt: storeName }],
        },
      };
    }

    // ── 3. SEO title/description ──────────────────────────────────────────────
    const generatedTitle = isArabic
      ? `كود خصم ${storeName} السعودية ${currentYear} - كوبونات وعروض مجربة`
      : `Verified ${storeName} Promo Codes KSA - ${currentYear} Offers & Deals`;

    const finalTitle = storeTranslation.seoTitle || generatedTitle;

    const generatedDescription = isArabic
      ? `تسوق بذكاء ووفر أكثر! اكتشف أقوى أكواد خصم وعروض ${storeName} الفعالة والمجربة في السعودية. انسخ الكود واستمتع بخصم فوري على مشترياتك الآن.`
      : `Shop smarter with verified ${storeName} promo codes and exclusive KSA offers. Apply our tested coupons at checkout for instant savings on your next order.`;

    const finalDescription = storeTranslation.seoDescription || storeTranslation.description || generatedDescription;

    // ── 4. Hreflang ─────────────────────────────────────────────────────────────
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

    return {
      metadataBase: new URL(BASE_URL),
      title: finalTitle,
      description: finalDescription,
      alternates: {
        canonical: canonicalUrl,
        languages: hreflangLanguages,
      },
      openGraph: {
        siteName: isArabic ? 'كوبونات' : 'Cobonat',
        title: finalTitle,
        description: finalDescription,
        type: 'website',
        locale,
        url: `${BASE_URL}/${locale}/stores/${slug}`,
        images: [{ url: finalOgImage, width: 1200, height: 630, alt: storeName }],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@cobonat',
        title: finalTitle,
        description: finalDescription,
        images: [finalOgImage],
      },
      robots: {
        index: shouldIndex,
        follow: true,
        googleBot: {
          index: shouldIndex,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('[stores/[slug] generateMetadata]', error);
    // Return minimal metadata to avoid crashing the page
    return {
      title: 'Store',
      robots: { index: false, follow: true },
    };
  }
}

// ── Page Component ─────────────────────────────────────────────────────────────
export default async function StorePage({ params }) {
  const { slug: rawSlug, locale } = await params;
  const slug = decodeURIComponent(rawSlug);
  const [language, countryCode] = locale.split('-');
  const now = new Date();

  const store = await getStoreData(slug, language, countryCode);

  // ── Strict 301 redirect for old slugs ──
  if (!store) {
    const newSlug = await handleSlugRedirect(slug, language);
    if (newSlug) {
      return permanentRedirect(`/${locale}/stores/${newSlug}`);
    }
    return notFound();
  }

  const country = await prisma.country.findUnique({
    where: { code: countryCode, isActive: true },
    include: { translations: { where: { locale: language } } },
  });
  if (!country) return notFound();

  const tStore = await getTranslations('StorePage');
  const storeTranslation = store.translations[0];

  const storeLogoUrl = getStoreLogoUrl(store);
  // ✅ FIX: use the null-safe helper instead of the inline expression that
  // produced "${BASE_URL}/" for stores with no coverImage.
  const storeCoverUrl = getStoreCoverUrl(store);

  const transformedStore = {
    ...store,
    updatedAt: store.updatedAt?.toISOString() ?? null,
    createdAt: store.createdAt?.toISOString() ?? null,
    name: storeTranslation?.name || slug,
    slug: storeTranslation?.slug || slug,
    description: storeTranslation?.description || null,
    coverImage: storeCoverUrl,
    logo: storeLogoUrl,
    categories: store.categories.map(sc => ({
      id: sc.category.id,
      name: sc.category.translations[0]?.name || '',
      slug: sc.category.translations[0]?.slug || '',
      icon: sc.category.icon,
      color: sc.category.color,
    })),
  };

  // ── Fetch guide steps ──────────────────────────────────────────────────────
  const guideSteps = await prisma.storeGuideStep.findMany({
    where: { storeId: store.id, locale: language },
    orderBy: [{ type: 'asc' }, { order: 'asc' }],
  });
  const stepsByType = guideSteps.reduce((acc, step) => {
    const type = step.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(step);
    return acc;
  }, {});

  const [
    allVouchers,
    paymentMethodsData,
    faqs,
    relatedStores,
    storeProducts,
    relatedPostsRaw,
    expiredOtherPromos,
    activeOtherPromos,
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
    prisma.otherPromo.findMany({
      where: {
        storeId: store.id,
        countryId: country.id,
        isActive: true,
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      include: {
        translations: { where: { locale: language } },
        bank: { include: { translations: { where: { locale: language } } } },
        paymentMethod: { include: { translations: { where: { locale: language } } } },
        card: true,
      },
      orderBy: [{ order: 'asc' }, { discountPercent: 'desc' }, { verifiedAvgPercent: 'desc' }],
      take: 20,
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

  const transformedActiveOtherPromos = activeOtherPromos.map(p => ({
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
    isActive: true,
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
    logo: getStoreLogoUrl(s),
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

  const hasStoreFaqs = faqs.length > 0;

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

              <StoreIntelligenceCard storeId={store.id} locale={locale} countryCode={countryCode} />

              {Object.keys(stepsByType).length > 0 && (
                <StoreHowToGuide stepsByType={stepsByType} locale={locale} />
              )}

              <OtherPromosSection
                storeSlug={transformedStore.slug}
                storeName={transformedStore.name}
                storeLogo={transformedStore.logo}
                offers={transformedActiveOtherPromos}
              />

              {transformedProducts.length > 0 && (
                <FeaturedProductsCarousel
                  storeSlug={transformedStore.slug}
                  storeName={transformedStore.name}
                  storeLogo={transformedStore.logo}
                  products={transformedProducts}
                />
              )}

              {hasStoreFaqs && <StoreFAQ faqs={faqs} locale={locale} storeName={transformedStore.name} countryName={countryName} />}

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

        <HelpBox locale={locale} />
      </div>
    </>
  );
}
