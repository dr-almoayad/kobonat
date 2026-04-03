// app/[locale]/categories/[slug]/page.jsx
// Individual category page — fully server-rendered.
// Fixes:
//  - Has a real <h1> and intro paragraph (was missing in stores/[slug] category branch)
//  - Correct hreflang per locale using per-locale slugs
//  - Proper BreadcrumbList + ItemList structured data
//  - Clean canonical URL at /categories/[slug] (not /stores/[slug])

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StoreCard from '@/components/StoreCard/StoreCard';
import VouchersGrid from '@/components/VouchersGrid/VouchersGrid';
import HelpBox from '@/components/help/HelpBox';
import './category-page.css';

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// Icon → Material Symbol map (same as categories listing)
const FALLBACK_ICONS = {
  electronics:    'devices',
  fashion:        'checkroom',
  food:           'restaurant',
  travel:         'flight',
  beauty:         'face',
  home:           'home',
  sports:         'fitness_center',
  kids:           'child_care',
  automotive:     'directions_car',
  health:         'health_and_safety',
  gaming:         'sports_esports',
  groceries:      'local_grocery_store',
  books:          'menu_book',
  jewelry:        'diamond',
  default:        'category',
};

function getCategoryIcon(icon, slug) {
  if (icon) return icon;
  const key = Object.keys(FALLBACK_ICONS).find(k => slug?.toLowerCase().includes(k));
  return FALLBACK_ICONS[key] || FALLBACK_ICONS.default;
}

// ── Data fetch ───────────────────────────────────────────────────────────────

async function getCategoryBySlug(slug, language) {
  return prisma.categoryTranslation.findFirst({
    where: { slug, locale: language },
    include: {
      category: {
        include: {
          translations: true, // all locales for hreflang
        },
      },
    },
  });
}

async function getCategoryStores(categoryId, language, countryCode) {
  const now = new Date();
  return prisma.store.findMany({
    where: {
      isActive:   true,
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
      store: {
        isActive:   true,
        categories: { some: { categoryId } },
      },
      countries: { some: { country: { code: countryCode } } },
    },
    include: {
      translations: { where: { locale: language } },
      store: {
        include: {
          translations: { where: { locale: language } },
        },
      },
      _count: { select: { clicks: true } },
    },
    orderBy: [
      { isExclusive:    'desc' },
      { isVerified:     'desc' },
      { popularityScore: 'desc' },
    ],
    take: 24,
  });
}

// ── Generate static params (for static generation at build time) ─────────────

export async function generateStaticParams() {
  try {
    const translations = await prisma.categoryTranslation.findMany({
      select: { slug: true, locale: true },
    });

    const locales = ['ar-SA', 'en-SA'];
    const params  = [];

    for (const loc of locales) {
      const [lang] = loc.split('-');
      for (const t of translations.filter(t => t.locale === lang)) {
        params.push({ locale: loc, slug: t.slug });
      }
    }

    return params;
  } catch {
    return [];
  }
}

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  try {
    const { locale, slug } = await params;
    const [language, countryCode] = locale.split('-');
    const isAr = language === 'ar';

    const catTranslation = await getCategoryBySlug(slug, language);
    if (!catTranslation) return {};

    const category     = catTranslation.category;
    const categoryName = catTranslation.name;
    const year         = new Date().getFullYear();

    // Find other-locale slug for hreflang
    const otherLang        = language === 'ar' ? 'en' : 'ar';
    const otherTranslation = category.translations.find(t => t.locale === otherLang);

    const arSlug = language === 'ar' ? slug : (otherTranslation?.slug || null);
    const enSlug = language === 'en' ? slug : (otherTranslation?.slug || null);

    const hreflangLanguages = {};
    if (arSlug) hreflangLanguages['ar-SA'] = `${BASE_URL}/ar-SA/categories/${arSlug}`;
    if (enSlug) hreflangLanguages['en-SA'] = `${BASE_URL}/en-SA/categories/${enSlug}`;
    hreflangLanguages['x-default'] = `${BASE_URL}/ar-SA/categories/${arSlug || slug}`;

    // Count stores for description
    const storeCount = await prisma.storeCategory.count({
      where: {
        categoryId: category.id,
        store: {
          isActive:  true,
          countries: { some: { country: { code: countryCode } } },
        },
      },
    });

    const title = isAr
      ? `كوبونات ${categoryName} ${year} | ${storeCount}+ متجر في السعودية`
      : `${categoryName} Coupons & Deals ${year} | ${storeCount}+ Stores in Saudi Arabia`;

    const description = isAr
      ? `تصفح أفضل كوبونات وأكواد خصم ${categoryName} في المملكة العربية السعودية. ${storeCount}+ متجر موثوق مع عروض حصرية محدثة يومياً. وفر على مشترياتك مع كوبونات مجربة ومحققة.`
      : `Browse the best ${categoryName} coupons and promo codes in Saudi Arabia. ${storeCount}+ trusted stores with exclusive deals updated daily. Save on every purchase with verified discount codes.`;

    return {
      metadataBase: new URL(BASE_URL),
      title,
      description,
      alternates: {
        canonical: `${BASE_URL}/${locale}/categories/${slug}`,
        languages: hreflangLanguages,
      },
      openGraph: {
        siteName:    isAr ? 'كوبونات' : 'Cobonat',
        title,
        description,
        url:         `${BASE_URL}/${locale}/categories/${slug}`,
        type:        'website',
        locale,
        images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512 }],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {};
  }
}

// ── Intro paragraph generator ────────────────────────────────────────────────
// Returns a 2–3 sentence editorial paragraph — gives the page real content
// that differentiates it from a programmatic "thin" page.

function buildIntro(categoryName, storeCount, voucherCount, countryName, isAr) {
  if (isAr) {
    return `تجمع منصة كوبونات أفضل أكواد الخصم وعروض ${categoryName} من ${storeCount} متجر موثوق في ${countryName}. ` +
      `نضمن لك ${voucherCount}+ كوبون فعال ومُحقق، يتم تحديثه يومياً لضمان حصولك على أعلى خصم ممكن. ` +
      `سواء كنت تبحث عن كوبون لأول طلب أو شحن مجاني أو خصومات موسمية، ستجد هنا كل ما تحتاجه.`;
  }
  return `Cobonat aggregates the best ${categoryName} discount codes and offers from ${storeCount} trusted stores in ${countryName}. ` +
    `We guarantee ${voucherCount}+ active, verified coupons updated daily so you always get the maximum possible saving. ` +
    `Whether you're looking for a first-order discount, free shipping, or seasonal deals, you'll find everything here.`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryDetailPage({ params }) {
  const { locale, slug } = await params;
  const [language, countryCode] = locale.split('-');
  const isAr = language === 'ar';

  const catTranslation = await getCategoryBySlug(slug, language);
  if (!catTranslation) return notFound();

  const category     = catTranslation.category;
  const categoryName = catTranslation.name;
  const categoryDesc = catTranslation.description || null;
  const categoryIcon = getCategoryIcon(category.icon, slug);
  const categoryColor= category.color || '#470ae2';

  // Parallel data fetch
  const [stores, vouchers, country] = await Promise.all([
    getCategoryStores(category.id, language, countryCode || 'SA'),
    getCategoryVouchers(category.id, language, countryCode || 'SA'),
    prisma.country.findUnique({
      where:   { code: countryCode || 'SA' },
      include: { translations: { where: { locale: language } } },
    }),
  ]);

  if (stores.length === 0) return notFound();

  const countryName    = country?.translations[0]?.name || (isAr ? 'السعودية' : 'Saudi Arabia');
  const featuredStores = stores.filter(s => s.isFeatured);
  const regularStores  = stores.filter(s => !s.isFeatured);

  // Transform stores for StoreCard
  const transformStore = (s) => ({
    ...s,
    name:        s.translations[0]?.name || '',
    slug:        s.translations[0]?.slug || '',
    description: s.translations[0]?.description || null,
    showOffer:   s.translations[0]?.showOffer || '',
  });

  const transformedFeatured = featuredStores.map(transformStore);
  const transformedRegular  = regularStores.map(transformStore);

  // Transform vouchers for VouchersGrid
  const transformedVouchers = vouchers.map(v => ({
    ...v,
    title:       v.translations[0]?.title       || '',
    description: v.translations[0]?.description || null,
    store: v.store ? {
      ...v.store,
      name: v.store.translations[0]?.name || '',
      slug: v.store.translations[0]?.slug || '',
    } : null,
  }));

  const totalVouchers = stores.reduce((sum, s) => sum + (s._count?.vouchers ?? 0), 0);
  const introText     = buildIntro(categoryName, stores.length, totalVouchers, countryName, isAr);

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
      '@type':    'ListItem',
      position:   i + 1,
      name:       s.translations[0]?.name || '',
      url:        `${BASE_URL}/${locale}/stores/${s.translations[0]?.slug || s.id}`,
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

              {/* ← This paragraph is the editorial content Google was missing */}
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
                {featuredStores.length > 0 && (
                  <span className="cd-stat-pill">
                    <span className="material-symbols-sharp">star</span>
                    {featuredStores.length} {isAr ? 'متجر مميز' : 'featured'}
                  </span>
                )}
              </div>
            </div>

          </div>
        </header>

        {/* ── Main content ── */}
        <main className="cd-main">

          {/* Top vouchers */}
          {transformedVouchers.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">local_offer</span>
                  {isAr ? `أفضل عروض ${categoryName}` : `Top ${categoryName} Deals`}
                </h2>
                <span className="cd-section-count">
                  {transformedVouchers.length} {isAr ? 'عرض' : 'offers'}
                </span>
              </div>
              <VouchersGrid vouchers={transformedVouchers} />
            </section>
          )}

          {/* Featured stores */}
          {transformedFeatured.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">star</span>
                  {isAr ? 'المتاجر المميزة' : 'Featured Stores'}
                </h2>
                <span className="cd-section-count">
                  {transformedFeatured.length} {isAr ? 'متجر' : 'stores'}
                </span>
              </div>
              <div className="cd-stores-grid">
                {transformedFeatured.map(store => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </section>
          )}

          {/* All stores */}
          {transformedRegular.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">storefront</span>
                  {transformedFeatured.length > 0
                    ? (isAr ? 'متاجر أخرى' : 'More Stores')
                    : (isAr ? `كل متاجر ${categoryName}` : `All ${categoryName} Stores`)}
                </h2>
                <span className="cd-section-count">
                  {transformedRegular.length} {isAr ? 'متجر' : 'stores'}
                </span>
              </div>
              <div className="cd-stores-grid">
                {transformedRegular.map(store => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </section>
          )}

          {/* Editorial content block — what to expect from this category */}
          <section className="cd-section">
            <div className="cd-editorial">
              <h2>
                <span className="material-symbols-sharp">tips_and_updates</span>
                {isAr
                  ? `كيف توفر في تسوق ${categoryName}؟`
                  : `How to save on ${categoryName} shopping?`}
              </h2>

              {categoryDesc && <p>{categoryDesc}</p>}

              <p>
                {isAr
                  ? `تحقق دائماً من صلاحية الكود قبل إتمام الشراء، وتأكد من أن قيمة سلة التسوق تستوفي الحد الأدنى المطلوب. بعض عروض ${categoryName} تكون حصرية للمستخدمين الجدد أو لأول طلب فقط، لذا اقرأ الشروط جيداً قبل الاستخدام.`
                  : `Always check code validity before checkout and ensure your cart meets any minimum spend requirement. Some ${categoryName} offers are exclusive to new users or first orders, so read the terms carefully before applying.`}
              </p>

              <p>
                {isAr
                  ? `يمكنك أيضاً دمج كود الخصم مع عروض البنوك أو بطاقات الائتمان للحصول على أعلى نسبة توفير. تابع صفحة كل متجر على كوبونات للاطلاع على أحدث العروض المتاحة.`
                  : `You can also stack discount codes with bank or credit card offers to reach the highest possible savings. Follow each store's page on Cobonat for the latest available deals.`}
              </p>

              <Link
                href={`/${locale}/coupons`}
                className="cd-view-all"
              >
                {isAr ? 'تصفح كل الكوبونات' : 'Browse all coupons'}
                <span className="material-symbols-sharp">
                  {isAr ? 'arrow_back' : 'arrow_forward'}
                </span>
              </Link>
            </div>
          </section>

        </main>

        <HelpBox locale={locale} />
      </div>
    </>
  );
}
