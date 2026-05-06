// app/[locale]/stores/[slug]/page.jsx
import { prisma } from '@/lib/prisma';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { unstable_cache } from 'next/cache';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import StorePageShell from '@/components/headers/StorePageShell';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { getCategoryData } from '@/lib/storeCategories';
import { getStoreData } from '@/lib/stores';
import { getStoreRelatedPosts } from '@/app/admin/_lib/queries';
import { generateEnhancedStoreMetadata } from '@/lib/seo/generateStoreMetadata';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import { generateStorePageTitle } from '@/lib/seo/dynamicStoreTitle';
import { StoreStructuredSchemas } from '@/lib/seo/storeSchemas';

// Lazy load heavy components that appear below the fold
const VouchersGrid = dynamic(() => import('@/components/VouchersGrid/VouchersGrid'), {
  loading: () => <div className="vouchers-grid-skeleton" />,
  ssr: false,
});
const StoreFAQ = dynamic(() => import('@/components/StoreFAQ/StoreFAQ'), { ssr: false });
const StoreCard = dynamic(() => import('@/components/StoreCard/StoreCard'), { ssr: false });
const FeaturedProductsCarousel = dynamic(() => import('@/components/FeaturedProductsCarousel/FeaturedProductsCarousel'), { ssr: false });
const OtherPromosSection = dynamic(() => import('@/components/OtherPromosSection/OtherPromosSection'), { ssr: false });
const StoreOfferStacks = dynamic(() => import('@/components/StoreOfferStacks/StoreOfferStacks'), { ssr: false });
const RelatedPostsSidebar = dynamic(() => import('@/components/blog/RelatedPostsSidebar'), { ssr: false });
const ExpiredVouchersList = dynamic(() => import('@/components/ExpiredVouchersList/ExpiredVouchersList'), { ssr: false });
const ExpiredOtherPromosList = dynamic(() => import('@/components/ExpiredOtherPromosList/ExpiredOtherPromosList'), { ssr: false });
const PromoCodesFAQ = dynamic(() => import('@/components/PromoCodesFAQ/PromoCodesFAQ'), { ssr: false });
const HelpBox = dynamic(() => import('@/components/help/HelpBox'), { ssr: false });

export const revalidate = 300;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ------------------------------------------------------------------
// Cached database queries (reduce server load)
// ------------------------------------------------------------------
const getCachedStoreData = unstable_cache(
  async (storeId, language, countryCode) => {
    const now = new Date();
    const [activeVouchers, relatedStores, storeProducts] = await Promise.all([
      prisma.voucher.findMany({
        where: {
          storeId,
          countries: { some: { country: { code: countryCode } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        },
        select: {
          id: true,
          code: true,
          type: true,
          discount: true,
          discountPercent: true,
          verifiedAvgPercent: true,
          landingUrl: true,
          isExclusive: true,
          isVerified: true,
          popularityScore: true,
          expiryDate: true,
          startDate: true,
          updatedAt: true,
          translations: {
            where: { locale: language },
            select: { title: true, description: true },
          },
          store: {
            select: {
              id: true,
              logo: true,
              translations: { where: { locale: language }, select: { name: true, slug: true } },
            },
          },
          _count: { select: { clicks: true } },
        },
        orderBy: [
          { expiryDate: 'desc' },
          { isExclusive: 'desc' },
          { isVerified: 'desc' },
          { popularityScore: 'desc' },
        ],
      }),
      prisma.store.findMany({
        where: {
          id: { not: storeId },
          isActive: true,
          countries: { some: { country: { code: countryCode } } },
          categories: { some: { categoryId: { in: [] } } }, // fetched later, but we keep minimal
        },
        select: {
          id: true,
          logo: true,
          isFeatured: true,
          translations: { where: { locale: language }, select: { name: true, slug: true } },
          _count: { select: { vouchers: { where: { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] } } } },
        },
        take: 6,
        orderBy: { isFeatured: 'desc' },
      }),
      prisma.storeProduct.findMany({
        where: { storeId, isFeatured: true, countries: { some: { country: { code: countryCode } } } },
        select: {
          id: true,
          image: true,
          productUrl: true,
          discountValue: true,
          discountType: true,
          translations: { where: { locale: language }, select: { title: true } },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        take: 12,
      }),
    ]);
    return { activeVouchers, relatedStores, storeProducts };
  },
  ['store-page-data'],
  { revalidate: 300 }
);

// ------------------------------------------------------------------
// Metadata (unchanged, already good)
// ------------------------------------------------------------------
export async function generateMetadata({ params }) { /* ... keep as is ... */ }

// ------------------------------------------------------------------
// Static Params (unchanged)
// ------------------------------------------------------------------
export async function generateStaticParams() { /* ... keep as is ... */ }

// ------------------------------------------------------------------
// Main Page Component
// ------------------------------------------------------------------
export default async function StorePage({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const now = new Date();

    // Category redirect
    const category = await getCategoryData(slug, language, countryCode);
    if (category) permanentRedirect(`/${locale}/categories/${slug}`);

    const store = await getStoreData(slug, language, countryCode);
    if (!store) return notFound();

    const tStore = await getTranslations('StorePage');

    const country = await prisma.country.findUnique({
      where: { code: countryCode, isActive: true },
      select: { id: true, translations: { where: { locale: language }, select: { name: true } } },
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

    // Fetch all needed data in one go (parallel)
    const [
      paymentMethodsData,
      faqs,
      relatedPostsRaw,
      allOtherPromos,
      curatedOffers,
      offerStacks,
      cached,
    ] = await Promise.all([
      prisma.storePaymentMethod.findMany({
        where: { storeId: store.id, countryId: country.id },
        select: {
          paymentMethod: {
            select: {
              id: true,
              logo: true,
              type: true,
              isBnpl: true,
              translations: { where: { locale: language }, select: { name: true, description: true } },
            },
          },
        },
      }),
      prisma.storeFAQ.findMany({
        where: { storeId: store.id, countryId: country.id, isActive: true },
        select: { id: true, order: true, translations: { where: { locale: language }, select: { question: true, answer: true } } },
        orderBy: { order: 'asc' },
      }),
      getStoreRelatedPosts(store.id, language, 6),
      prisma.otherPromo.findMany({
        where: { storeId: store.id, countryId: country.id, isActive: true },
        select: {
          id: true, type: true, image: true, url: true, startDate: true, expiryDate: true,
          discountPercent: true, verifiedAvgPercent: true, voucherCode: true,
          translations: { where: { locale: language }, select: { title: true, description: true, terms: true } },
          bank: { select: { logo: true, translations: { where: { locale: language }, select: { name: true } } } },
          paymentMethod: { select: { logo: true, type: true, isBnpl: true, translations: { where: { locale: language }, select: { name: true } } } },
          card: true,
        },
        orderBy: { order: 'asc' },
      }),
      prisma.curatedOffer.findMany({
        where: {
          storeId: store.id,
          isActive: true,
          countries: { some: { country: { code: countryCode } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        },
        select: {
          id: true, type: true, offerImage: true, code: true, ctaUrl: true,
          startDate: true, expiryDate: true,
          translations: { where: { locale: language }, select: { title: true, description: true, ctaText: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
      }),
      prisma.offerStack.findMany({
        where: { storeId: store.id, isActive: true },
        select: {
          id: true, label: true, order: true,
          codeVoucher: { select: { id: true, code: true, discountPercent: true, verifiedAvgPercent: true,
            translations: { where: { locale: language }, select: { title: true } } } },
          dealVoucher: { select: { id: true, discountPercent: true, verifiedAvgPercent: true,
            translations: { where: { locale: language }, select: { title: true } } } },
          promo: { select: { id: true, discountPercent: true, verifiedAvgPercent: true,
            translations: { where: { locale: language }, select: { title: true } },
            bank: { select: { translations: { where: { locale: language }, select: { name: true } } } } } },
        },
        orderBy: { order: 'asc' },
      }),
      getCachedStoreData(store.id, language, countryCode),
    ]);

    const { activeVouchers, relatedStores, storeProducts } = cached;
    const activeOtherPromos = allOtherPromos.filter(p => !p.expiryDate || p.expiryDate >= now);
    const expiredOtherPromos = allOtherPromos.filter(p => p.expiryDate && p.expiryDate < now).slice(0, 10);
    const expiredVouchers = activeVouchers.filter(v => v.expiryDate && v.expiryDate < now).slice(0, 10);

    // Transform data (keeping same shape as before)
    const transformedVouchers = activeVouchers.map(v => ({
      ...v,
      title: v.translations[0]?.title || '',
      description: v.translations[0]?.description || null,
      store: transformedStore,
    }));

    const allPaymentMethods = paymentMethodsData.map(spm => spm.paymentMethod).filter(Boolean);
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
      discountValue: p.discountValue,
      discountType: p.discountType,
    }));

    const relatedPosts = relatedPostsRaw.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.translations?.[0]?.title || '',
      excerpt: post.translations?.[0]?.excerpt || null,
      featuredImage: post.featuredImage || null,
      publishedAt: post.publishedAt,
      category: post.category ? {
        name: post.category.translations?.[0]?.name || '',
        color: post.category.color || '#470ae2',
      } : null,
    }));

    const transformedOtherPromos = activeOtherPromos.map(p => ({ ...p,
      title: p.translations[0]?.title || '',
      description: p.translations[0]?.description || null,
      terms: p.translations[0]?.terms || null,
      bank: p.bank ? { name: p.bank.translations[0]?.name || '', logo: p.bank.logo } : null,
      paymentMethod: p.paymentMethod ? {
        name: p.paymentMethod.translations[0]?.name || '',
        logo: p.paymentMethod.logo,
        type: p.paymentMethod.type,
        isBnpl: p.paymentMethod.isBnpl,
      } : null,
    }));

    const transformedCuratedOffers = curatedOffers.map(o => ({
      ...o,
      title: o.translations[0]?.title || '',
      description: o.translations[0]?.description || null,
      ctaText: o.translations[0]?.ctaText || null,
    }));

    const transformedOfferStacks = offerStacks.map(s => ({
      id: s.id,
      label: s.label,
      codeVoucher: s.codeVoucher ? {
        id: s.codeVoucher.id,
        code: s.codeVoucher.code,
        discountPercent: s.codeVoucher.verifiedAvgPercent ?? s.codeVoucher.discountPercent,
        title: s.codeVoucher.translations[0]?.title || '',
      } : null,
      dealVoucher: s.dealVoucher ? {
        id: s.dealVoucher.id,
        discountPercent: s.dealVoucher.verifiedAvgPercent ?? s.dealVoucher.discountPercent,
        title: s.dealVoucher.translations[0]?.title || '',
      } : null,
      promo: s.promo ? {
        id: s.promo.id,
        discountPercent: s.promo.verifiedAvgPercent ?? s.promo.discountPercent,
        title: s.promo.translations[0]?.title || s.promo.bank?.translations[0]?.name || '',
        bankName: s.promo.bank?.translations[0]?.name || null,
      } : null,
    }));

    const codeVouchers = transformedVouchers.filter(v => v.type === 'CODE');
    const dealVouchers = transformedVouchers.filter(v => v.type === 'DEAL');
    const shippingVouchers = transformedVouchers.filter(v => v.type === 'FREE_SHIPPING');
    const countryName = country.translations[0]?.name || countryCode;

    const maxSavingsForTitle = Math.max(
      ...transformedVouchers.map(v => v.verifiedAvgPercent ?? v.discountPercent ?? 0),
      ...transformedOtherPromos.map(p => p.verifiedAvgPercent ?? p.discountPercent ?? 0),
      0
    );

    const { h1: pageH1, title: pageTitle, description: autoDescription } = generateStorePageTitle({
      storeName: transformedStore.name,
      locale,
      codeCount: transformedVouchers.length,
      maxSavings: maxSavingsForTitle,
    });

    const breadcrumbs = [
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
      maxSavings: maxSavingsForTitle,
      pageH1,
    };

    return (
      <>
        <StoreStructuredSchemas
          storeName={transformedStore.name}
          storeSlug={transformedStore.slug}
          title={storeTranslation?.seoTitle || pageTitle}
          description={storeTranslation?.seoDescription || transformedStore.description || autoDescription}
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
                {/* ONLY render the vouchers after the initial paint (lazy) */}
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

                {/* All sections below are lazy-loaded (dynamic imports) */}
                <StoreOfferStacks storeId={store.id} locale={locale} countryCode={countryCode} />
                <OtherPromosSection storeSlug={transformedStore.slug} storeName={transformedStore.name} storeLogo={transformedStore.logo} />
                {transformedProducts.length > 0 && (
                  <FeaturedProductsCarousel
                    storeSlug={transformedStore.slug}
                    storeName={transformedStore.name}
                    storeLogo={transformedStore.logo}
                    products={transformedProducts}
                  />
                )}
                {faqs.length > 0 && <StoreFAQ faqs={faqs} locale={locale} storeName={transformedStore.name} countryName={countryName} />}
                {expiredVouchers.length > 0 && <ExpiredVouchersList vouchers={expiredVouchers} />}
                {expiredOtherPromos.length > 0 && <ExpiredOtherPromosList promos={expiredOtherPromos} storeName={transformedStore.name} storeLogo={transformedStore.logo} />}
                {transformedRelatedStores.length > 0 && (
                  <section className="related-stores-section">
                    <h2 className="section-title">
                      <span className="material-symbols-sharp">storefront</span>
                      {tStore('similarStores')}
                    </h2>
                    <div className="related-stores-grid">
                      {transformedRelatedStores.map(s => <StoreCard key={s.id} store={s} />)}
                    </div>
                  </section>
                )}
              </main>

              <aside className="store-content-sidebar">
                {relatedPosts.length > 0 && <RelatedPostsSidebar posts={relatedPosts} locale={locale} />}
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
