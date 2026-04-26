// app/[locale]/categories/[slug]/page.jsx
// Individual category page — fully server-rendered.
// Enhanced with four new sections sourced from direct item-category associations:
//   1. Featured Offer Stacks  → OfferStackBox carousel
//   2. Featured Vouchers      → VoucherCard CAROUSEL (directly-tagged, prioritised)
//   3. Featured Products      → StoreProductCard CAROUSEL
//   4. Bank & Card Highlights → inline promo cards

import { prisma }           from '@/lib/prisma';
import { notFound }          from 'next/navigation';
import Link                  from 'next/link';
import StoreCard             from '@/components/StoreCard/StoreCard';
import VoucherCard           from '@/components/VoucherCard/VoucherCard';
import HelpBox               from '@/components/help/HelpBox';
import OfferStackBox         from '@/components/OfferStackBox/OfferStackBox';
import StoreProductCard      from '@/components/StoreProductCard/StoreProductCard';
import EmblaCarousel         from '@/components/EmblaCarousel/EmblaCarousel';
import CuratedOfferCard      from './CuratedOfferCard';
import { serializeStack }    from '@/lib/offerStacks';
import './category-page.css';

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

const FALLBACK_ICONS = {
  electronics: 'devices',  fashion: 'checkroom',  food: 'restaurant',
  travel: 'flight',        beauty: 'face',         home: 'home',
  sports: 'fitness_center', kids: 'child_care',   automotive: 'directions_car',
  health: 'health_and_safety', gaming: 'sports_esports', groceries: 'local_grocery_store',
  books: 'menu_book',      jewelry: 'diamond',    default: 'category',
};

function getCategoryIcon(icon, slug) {
  if (icon) return icon;
  const key = Object.keys(FALLBACK_ICONS).find(k => slug?.toLowerCase().includes(k));
  return FALLBACK_ICONS[key] || FALLBACK_ICONS.default;
}

// ── Data helpers ─────────────────────────────────────────────────────────────

async function getCategoryBySlug(slug, language) {
  return prisma.categoryTranslation.findFirst({
    where: { slug, locale: language },
    include: { category: { include: { translations: true } } },
  });
}

async function getCategoryStores(categoryId, language, countryCode) {
  const now = new Date();
  return prisma.store.findMany({
    where: {
      isActive: true,
      categories: { some: { categoryId } },
      countries:  { some: { country: { code: countryCode } } },
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
    orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
  });
}

async function getCategoryVouchers(categoryId, language, countryCode) {
  return prisma.voucher.findMany({
    where: {
      expiryDate: { gte: new Date() },
      store:      { isActive: true, categories: { some: { categoryId } } },
      countries:  { some: { country: { code: countryCode } } },
    },
    include: {
      translations: { where: { locale: language } },
      store: { include: { translations: { where: { locale: language } } } },
      _count: { select: { clicks: true } },
    },
    orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { popularityScore: 'desc' }],
    take: 24,
  });
}

// ── Directly-tagged item fetchers ─────────────────────────────────────────────

async function getDirectVouchers(categoryId, language, countryCode) {
  const rows = await prisma.voucherCategory.findMany({
    where: { categoryId },
    include: {
      voucher: {
        include: {
          translations: { where: { locale: language } },
          store: { include: { translations: { where: { locale: language } } } },
          countries: { select: { country: { select: { code: true } } } },
          _count: { select: { clicks: true } },
        },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
  });
  const now = new Date();
  return rows
    .filter(r =>
      r.voucher &&
      (!r.voucher.expiryDate || r.voucher.expiryDate >= now) &&
      r.voucher.countries.some(vc => vc.country.code === countryCode)
    )
    .map(r => r.voucher);
}

async function getDirectStacks(categoryId, language, countryCode) {
  const rows = await prisma.offerStackCategory.findMany({
    where: { categoryId },
    include: {
      stack: {
        include: {
          store: { include: { translations: { where: { locale: language } } } },
          codeVoucher: {
            include: {
              translations: { where: { locale: language } },
              countries: { select: { country: { select: { code: true } } } },
            },
          },
          dealVoucher: {
            include: {
              translations: { where: { locale: language } },
              countries: { select: { country: { select: { code: true } } } },
            },
          },
          promo: {
            include: {
              translations: { where: { locale: language } },
              country: { select: { code: true } },
              bank: { include: { translations: { where: { locale: language } } } },
            },
          },
        },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
  });

  const validStacks = [];
  for (const row of rows) {
    const stack = row.stack;
    if (!stack || !stack.isActive) continue;
    const codeOk  = !stack.codeVoucher || stack.codeVoucher.countries.some(vc => vc.country.code === countryCode);
    const dealOk  = !stack.dealVoucher || stack.dealVoucher.countries.some(vc => vc.country.code === countryCode);
    const promoOk = !stack.promo || stack.promo.country?.code === countryCode;
    if (codeOk && dealOk && promoOk) {
      validStacks.push(serializeStack({
        store:       stack.store,
        codeVoucher: stack.codeVoucher,
        dealVoucher: stack.dealVoucher,
        promo:       stack.promo,
        language,
      }));
    }
  }
  return validStacks.filter(Boolean);
}

async function getDirectProducts(categoryId, language) {
  const rows = await prisma.storeProductCategory.findMany({
    where: { categoryId },
    include: {
      product: {
        include: {
          translations: { where: { locale: language } },
          store: { include: { translations: { where: { locale: language } } } },
        },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
  });
  return rows.filter(r => r.product).map(r => ({
    ...r.product,
    title:     r.product.translations?.[0]?.title     || '',
    storeName: r.product.store?.translations?.[0]?.name || '',
    storeLogo: r.product.store?.logo || null,
  }));
}

async function getDirectPromos(categoryId, language, countryCode) {
  const rows = await prisma.otherPromoCategory.findMany({
    where: { categoryId },
    include: {
      promo: {
        include: {
          translations: { where: { locale: language } },
          store: { include: { translations: { where: { locale: language } } } },
          bank:  { include: { translations: { where: { locale: language } } } },
          paymentMethod: { include: { translations: { where: { locale: language } } } },
        },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
  });
  const now = new Date();
  return rows
    .filter(r =>
      r.promo &&
      r.promo.isActive &&
      r.promo.country?.code === countryCode &&
      (!r.promo.expiryDate || r.promo.expiryDate >= now)
    )
    .map(r => ({
      ...r.promo,
      title:       r.promo.translations?.[0]?.title       || '',
      description: r.promo.translations?.[0]?.description || '',
      storeName:   r.promo.store?.translations?.[0]?.name || '',
      storeLogo:   r.promo.store?.logo || null,
      bankName:    r.promo.bank?.translations?.[0]?.name  || '',
      bankLogo:    r.promo.bank?.logo || null,
    }));
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const translations = await prisma.categoryTranslation.findMany({ select: { slug: true, locale: true } });
    const params = [];
    for (const loc of ['ar-SA', 'en-SA']) {
      const [lang] = loc.split('-');
      for (const t of translations.filter(t => t.locale === lang)) {
        params.push({ locale: loc, slug: t.slug });
      }
    }
    return params;
  } catch { return []; }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  try {
    const { locale, slug } = await params;
    const [language, countryCode] = locale.split('-');
    const isAr = language === 'ar';
    const catTranslation = await getCategoryBySlug(slug, language);
    if (!catTranslation) return {};
    const cat  = catTranslation.category;
    const name = catTranslation.name;
    const year = new Date().getFullYear();
    const otherLang = language === 'ar' ? 'en' : 'ar';
    const otherSlug = cat.translations.find(t => t.locale === otherLang)?.slug || null;
    const arSlug    = language === 'ar' ? slug : otherSlug;
    const enSlug    = language === 'en' ? slug : otherSlug;
    const storeCount = await prisma.storeCategory.count({
      where: { categoryId: cat.id, store: { isActive: true, countries: { some: { country: { code: countryCode } } } } },
    });
    const title = isAr
      ? `كوبونات ${name} ${year} | ${storeCount}+ متجر في السعودية`
      : `${name} Coupons & Deals ${year} | ${storeCount}+ Stores in Saudi Arabia`;
    const description = isAr
      ? `تصفح أفضل كوبونات وأكواد خصم ${name} في المملكة العربية السعودية. ${storeCount}+ متجر موثوق. عروض حصرية محدثة يومياً.`
      : `Browse the best ${name} coupons and promo codes in Saudi Arabia. ${storeCount}+ trusted stores with exclusive verified deals.`;
    const langMap = {};
    if (arSlug) langMap['ar-SA'] = `${BASE_URL}/ar-SA/categories/${arSlug}`;
    if (enSlug) langMap['en-SA'] = `${BASE_URL}/en-SA/categories/${enSlug}`;
    langMap['x-default'] = `${BASE_URL}/ar-SA/categories/${arSlug || slug}`;
    return {
      metadataBase: new URL(BASE_URL),
      title, description,
      alternates: { canonical: `${BASE_URL}/${locale}/categories/${slug}`, languages: langMap },
      openGraph: {
        siteName: isAr ? 'كوبونات' : 'Cobonat',
        title, description, url: `${BASE_URL}/${locale}/categories/${slug}`, type: 'website', locale,
        images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512 }],
      },
      robots: { index: true, follow: true },
    };
  } catch { return {}; }
}

// ── Page ──────────────────────────────────────────────────────────────────────

function buildIntro(categoryName, storeCount, voucherCount, countryName, isAr) {
  if (isAr) {
    return `تجمع منصة كوبونات أفضل أكواد الخصم وعروض ${categoryName} من ${storeCount} متجر موثوق في ${countryName}. ` +
      `نضمن لك ${voucherCount}+ كوبون فعال ومُحقق، يتم تحديثه يومياً. ` +
      `سواء كنت تبحث عن كوبون لأول طلب أو شحن مجاني أو خصومات موسمية، ستجد هنا كل ما تحتاجه.`;
  }
  return `Cobonat aggregates the best ${categoryName} discount codes and offers from ${storeCount} trusted stores in ${countryName}. ` +
    `We guarantee ${voucherCount}+ active, verified coupons updated daily. ` +
    `Whether you're looking for a first-order discount, free shipping, or seasonal deals, you'll find everything here.`;
}

// ── Carousel section header ───────────────────────────────────────────────────

function SectionHeader({ icon, title, count, countLabel, viewAllHref, viewAllLabel }) {
  return (
    <div className="cd-section-header">
      <h2 className="cd-section-title">
        <span className="material-symbols-sharp">{icon}</span>
        {title}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="cd-section-count">
          {count} {countLabel}
        </span>
        {viewAllHref && (
          <Link href={viewAllHref} className="cd-carousel-view-all">
            {viewAllLabel}
            <span className="material-symbols-sharp">arrow_forward</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function CategoryDetailPage({ params }) {
  const { locale, slug } = await params;
  const [language, countryCode] = locale.split('-');
  const isAr = language === 'ar';

  const catTranslation = await getCategoryBySlug(slug, language);
  if (!catTranslation) return notFound();

  const category      = catTranslation.category;
  const categoryName  = catTranslation.name;
  const categoryDesc  = catTranslation.description || null;
  const categoryIcon  = getCategoryIcon(category.icon, slug);
  const categoryColor = category.color || '#470ae2';
  const cc            = countryCode || 'SA';

  // Parallel fetch — all data at once
  const [
    stores, vouchers, country,
    directVouchers, directStacks, directProducts, directPromos,
  ] = await Promise.all([
    getCategoryStores(category.id, language, cc),
    getCategoryVouchers(category.id, language, cc),
    prisma.country.findUnique({
      where:   { code: cc },
      include: { translations: { where: { locale: language } } },
    }),
    getDirectVouchers(category.id, language, cc),
    getDirectStacks(category.id, language, cc),
    getDirectProducts(category.id, language),
    getDirectPromos(category.id, language, cc),
  ]);

  if (stores.length === 0 && directVouchers.length === 0 && directStacks.length === 0) {
    return notFound();
  }

  const countryName    = country?.translations[0]?.name || (isAr ? 'السعودية' : 'Saudi Arabia');
  const featuredStores = stores.filter(s => s.isFeatured);
  const regularStores  = stores.filter(s => !s.isFeatured);

  const transformStore = (s) => ({
    ...s,
    name:        s.translations[0]?.name        || '',
    slug:        s.translations[0]?.slug        || '',
    description: s.translations[0]?.description || null,
    showOffer:   s.translations[0]?.showOffer   || '',
  });

  // Merge: directly-tagged vouchers first, then store-linked (deduplicated by id)
  const directVoucherIds = new Set(directVouchers.map(v => v.id));
  const mergedVouchers   = [
    ...directVouchers,
    ...vouchers.filter(v => !directVoucherIds.has(v.id)),
  ].map(v => ({
    ...v,
    title:       v.translations?.[0]?.title       || '',
    description: v.translations?.[0]?.description || null,
    store: v.store ? {
      ...v.store,
      name: v.store.translations?.[0]?.name || '',
      slug: v.store.translations?.[0]?.slug || '',
    } : null,
  }));

  const totalVouchers = stores.reduce((s, st) => s + (st._count?.vouchers ?? 0), 0)
                      + directVouchers.length;

  const introText = buildIntro(categoryName, stores.length, totalVouchers, countryName, isAr);

  // Structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'الفئات' : 'Categories', item: `${BASE_URL}/${locale}/categories` },
      { '@type': 'ListItem', position: 3, name: categoryName, item: `${BASE_URL}/${locale}/categories/${slug}` },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:       isAr ? `متاجر ${categoryName}` : `${categoryName} Stores`,
    numberOfItems: stores.length,
    itemListElement: stores.slice(0, 10).map((s, i) => ({
      '@type': 'ListItem', position: i + 1,
      name: s.translations[0]?.name || '',
      url:  `${BASE_URL}/${locale}/stores/${s.translations[0]?.slug || s.id}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <div className="category-detail-page" dir={isAr ? 'rtl' : 'ltr'}>

        {/* ── Breadcrumb ── */}
        <nav className="cd-breadcrumb" aria-label="breadcrumb">
          <Link href={`/${locale}`}>{isAr ? 'الرئيسية' : 'Home'}</Link>
          <span className="cd-breadcrumb-sep">/</span>
          <Link href={`/${locale}/categories`}>{isAr ? 'الفئات' : 'Categories'}</Link>
          <span className="cd-breadcrumb-sep">/</span>
          <span className="cd-breadcrumb-current">{categoryName}</span>
        </nav>

        {/* ── Hero ── */}
        <header className="cd-hero">
          <div className="cd-hero-stripe" style={{ background: categoryColor }} />
          <div className="cd-hero-inner">
            <div className="cd-hero-icon" style={{ background: categoryColor }}>
              <span className="material-symbols-sharp">{categoryIcon}</span>
            </div>
            <div className="cd-hero-text">
              <h1 className="cd-hero-h1">
                {isAr
                  ? `كوبونات ${categoryName} في ${countryName}`
                  : `${categoryName} Coupons & Deals in ${countryName}`}
              </h1>
              <p className="cd-hero-intro">{introText}</p>
              <div className="cd-stats">
                <span className="cd-stat-pill cd-stat-pill--accent">
                  <span className="material-symbols-sharp">local_offer</span>
                  {totalVouchers} {isAr ? 'كوبون فعال' : 'active coupons'}
                </span>
                <span className="cd-stat-pill">
                  <span className="material-symbols-sharp">storefront</span>
                  {stores.length} {isAr ? 'متجر' : 'stores'}
                </span>
                {directStacks.length > 0 && (
                  <span className="cd-stat-pill">
                    <span className="material-symbols-sharp">bolt</span>
                    {directStacks.length} {isAr ? 'عرض مدمج' : 'stacked offers'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="cd-main">

          {/* ── FEATURED OFFER STACKS ── */}
          {directStacks.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">bolt</span>
                  {isAr ? 'ادمج ووفّر أكثر' : 'Stack & Save More'}
                </h2>
                <span className="cd-section-count">
                  {directStacks.length} {isAr ? 'عرض مدمج' : 'stacked offer'}
                  {directStacks.length !== 1 ? (isAr ? '' : 's') : ''}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
                {isAr
                  ? 'ادمج كوبون الخصم مع العرض التلقائي أو عرض بنكي للحصول على أعلى توفير ممكن.'
                  : 'Combine a coupon code with an auto-deal or bank offer for the maximum possible saving.'}
              </p>
              <EmblaCarousel locale={locale} slideWidth="300px" slideGap="1.25rem">
                {directStacks.map((stack, i) => (
                  <OfferStackBox key={`${stack.storeId}-${i}`} stack={stack} locale={locale} />
                ))}
              </EmblaCarousel>
            </section>
          )}

          {/* ── VOUCHERS CAROUSEL (direct-tagged first, then store-linked) ── */}
          {mergedVouchers.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">local_offer</span>
                  {isAr ? `أفضل عروض ${categoryName}` : `Top ${categoryName} Deals`}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="cd-section-count">
                    {mergedVouchers.length} {isAr ? 'عرض' : 'offer'}
                    {mergedVouchers.length !== 1 ? (isAr ? '' : 's') : ''}
                  </span>
                  <Link
                    href={`/${locale}/coupons`}
                    className="cd-carousel-view-all"
                  >
                    {isAr ? 'كل العروض' : 'View all'}
                    <span className="material-symbols-sharp">
                      {isAr ? 'arrow_back' : 'arrow_forward'}
                    </span>
                  </Link>
                </div>
              </div>
              {/* Carousel — each slide is a VoucherCard */}
              <EmblaCarousel locale={locale} slideWidth="400px" slideGap="1.25rem">
                {mergedVouchers.map(v => (
                  <CuratedOfferCard
                    key={voucher.id}
                    offer={voucher}               // pass the whole voucher object
                    featured={voucher.isFeatured}
                    bestDeal={voucher.bestDeal}
                    expired={false}
                  />
                ))}
              </EmblaCarousel>
            </section>
          )}

          {/* ── FEATURED PRODUCTS CAROUSEL ── */}
          {directProducts.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">inventory_2</span>
                  {isAr ? `منتجات ${categoryName} المميزة` : `Featured ${categoryName} Products`}
                </h2>
                <span className="cd-section-count">
                  {directProducts.length} {isAr ? 'منتج' : 'product'}
                  {directProducts.length !== 1 ? (isAr ? '' : 's') : ''}
                </span>
              </div>
              {/* Carousel — each slide is a StoreProductCard */}
              <EmblaCarousel locale={locale} slideWidth="180px" slideGap="1rem">
                {directProducts.map(product => (
                  <StoreProductCard
                    key={product.id}
                    product={product}
                    storeName={product.storeName}
                    storeLogo={product.storeLogo}
                  />
                ))}
              </EmblaCarousel>
            </section>
          )}

          {/* ── BANK & CARD HIGHLIGHTS ── */}
          {directPromos.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">account_balance</span>
                  {isAr ? 'عروض البنوك والبطاقات' : 'Bank & Card Offers'}
                </h2>
                <span className="cd-section-count">
                  {directPromos.length} {isAr ? 'عرض' : 'offer'}
                  {directPromos.length !== 1 ? (isAr ? '' : 's') : ''}
                </span>
              </div>
              <div className="cd-promos-grid">
                {directPromos.map(promo => (
                  <div
                    key={promo.id}
                    style={{
                      background: '#fff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 14,
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      gap: '0.875rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Logos */}
                    {(promo.storeLogo || promo.bankLogo) && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                        {promo.storeLogo && (
                          <img src={promo.storeLogo} alt={promo.storeName} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
                        )}
                        {promo.bankLogo && (
                          <img src={promo.bankLogo} alt={promo.bankName} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
                        )}
                      </div>
                    )}
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: 3 }}>
                        {promo.title}
                      </div>
                      {promo.description && (
                        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, marginBottom: 6 }}>
                          {promo.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {promo.bankName && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8' }}>
                            🏦 {promo.bankName}
                          </span>
                        )}
                        {promo.storeName && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{promo.storeName}</span>
                        )}
                        {promo.expiryDate && (() => {
                          const diff = Math.ceil((new Date(promo.expiryDate) - Date.now()) / 86_400_000);
                          return diff > 0 && diff <= 7 ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#fee2e2', color: '#b91c1c' }}>
                              {isAr ? `ينتهي خلال ${diff} يوم` : `Expires in ${diff}d`}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    {/* CTA */}
                    {promo.url && (
                      <a
                        href={promo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                          padding: '0.45rem 0.9rem', borderRadius: 8,
                          background: '#470ae2', color: '#fff',
                          fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isAr ? 'تفعيل' : 'Activate'}
                        <span className="material-symbols-sharp" style={{ fontSize: '0.9rem' }}>
                          {isAr ? 'arrow_back' : 'arrow_forward'}
                        </span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Featured stores ── */}
          {featuredStores.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">star</span>
                  {isAr ? 'المتاجر المميزة' : 'Featured Stores'}
                </h2>
                <span className="cd-section-count">{featuredStores.length} {isAr ? 'متجر' : 'stores'}</span>
              </div>
              <div className="cd-stores-grid">
                {featuredStores.map(transformStore).map(s => <StoreCard key={s.id} store={s} />)}
              </div>
            </section>
          )}

          {/* ── All stores ── */}
          {regularStores.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">storefront</span>
                  {featuredStores.length > 0
                    ? (isAr ? 'متاجر أخرى' : 'More Stores')
                    : (isAr ? `كل متاجر ${categoryName}` : `All ${categoryName} Stores`)}
                </h2>
                <span className="cd-section-count">{regularStores.length} {isAr ? 'متجر' : 'stores'}</span>
              </div>
              <div className="cd-stores-grid">
                {regularStores.map(transformStore).map(s => <StoreCard key={s.id} store={s} />)}
              </div>
            </section>
          )}

          {/* ── Editorial ── */}
          <section className="cd-section">
            <div className="cd-editorial">
              <h2>
                <span className="material-symbols-sharp">tips_and_updates</span>
                {isAr ? `كيف توفر في تسوق ${categoryName}؟` : `How to save on ${categoryName} shopping?`}
              </h2>
              {categoryDesc && <p>{categoryDesc}</p>}
              <p>
                {isAr
                  ? `تحقق دائماً من صلاحية الكود قبل إتمام الشراء. بعض عروض ${categoryName} تكون حصرية للمستخدمين الجدد. يمكنك أيضاً دمج كود الخصم مع عروض البنوك للحصول على أعلى نسبة توفير.`
                  : `Always verify code validity before checkout. Some ${categoryName} offers are exclusive to new users. You can also stack discount codes with bank offers to reach the maximum possible savings.`}
              </p>
              <Link href={`/${locale}/coupons`} className="cd-view-all">
                {isAr ? 'تصفح كل الكوبونات' : 'Browse all coupons'}
                <span className="material-symbols-sharp">{isAr ? 'arrow_back' : 'arrow_forward'}</span>
              </Link>
            </div>
          </section>

        </main>

        <HelpBox locale={locale} />
      </div>
    </>
  );
}
