// app/[locale]/categories/[slug]/page.jsx
// Individual category page — fully server-rendered.
// Sections:
//   1. Tagged Vouchers        → CuratedOfferCard carousel (max 3, most recent)
//   2. Tagged Products        → StoreProductCard carousel (max 6, most recent)
//   3. Featured Offer Stacks  → OfferStackBox carousel
//   4. Bank & Card Highlights → promo cards
//   5. Stores grid

import { prisma }        from '@/lib/prisma';
import { notFound }       from 'next/navigation';
import Link               from 'next/link';
import StoreCard          from '@/components/StoreCard/StoreCard';
import HelpBox            from '@/components/help/HelpBox';
import OfferStackBox      from '@/components/OfferStackBox/OfferStackBox';
import StoreProductCard   from '@/components/StoreProductCard/StoreProductCard';
import EmblaCarousel      from '@/components/EmblaCarousel/EmblaCarousel';
import CuratedOfferCard   from './CuratedOfferCard';
import { serializeStack } from '@/lib/offerStacks';
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

// ── Data helpers ──────────────────────────────────────────────────────────────

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

/**
 * Tagged vouchers only — max 3, sorted by updatedAt desc (most recent first).
 * Active only, available in requested country.
 */
async function getTaggedVouchers(categoryId, language, countryCode) {
  const rows = await prisma.voucherCategory.findMany({
    where: { categoryId },
    include: {
      voucher: {
        include: {
          translations: { where: { locale: language } },
          store: {
            include: { translations: { where: { locale: language } } },
          },
          countries: { select: { country: { select: { code: true } } } },
          _count: { select: { clicks: true } },
        },
      },
    },
  });

  const now = new Date();

  return rows
    .filter(r =>
      r.voucher &&
      (!r.voucher.expiryDate || r.voucher.expiryDate >= now) &&
      r.voucher.countries.some(vc => vc.country.code === countryCode)
    )
    .map(r => ({
      ...r.voucher,
      title:       r.voucher.translations?.[0]?.title       || '',
      description: r.voucher.translations?.[0]?.description || null,
      store: r.voucher.store
        ? {
            ...r.voucher.store,
            name: r.voucher.store.translations?.[0]?.name || '',
            slug: r.voucher.store.translations?.[0]?.slug || '',
          }
        : null,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);
}

/**
 * Tagged products only — max 6, sorted by updatedAt desc (most recent first).
 */
async function getTaggedProducts(categoryId, language) {
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
  });

  return rows
    .filter(r => r.product)
    .map(r => ({
      ...r.product,
      title:     r.product.translations?.[0]?.title     || '',
      storeName: r.product.store?.translations?.[0]?.name || '',
      storeLogo: r.product.store?.logo || null,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);
}

async function getTaggedStacks(categoryId, language, countryCode) {
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

  const valid = [];
  for (const row of rows) {
    const s = row.stack;
    if (!s || !s.isActive) continue;
    const codeOk  = !s.codeVoucher || s.codeVoucher.countries.some(vc => vc.country.code === countryCode);
    const dealOk  = !s.dealVoucher || s.dealVoucher.countries.some(vc => vc.country.code === countryCode);
    const promoOk = !s.promo       || s.promo.country?.code === countryCode;
    if (codeOk && dealOk && promoOk) {
      const serialized = serializeStack({ store: s.store, codeVoucher: s.codeVoucher, dealVoucher: s.dealVoucher, promo: s.promo, language });
      if (serialized) valid.push(serialized);
    }
  }
  return valid;
}

async function getTaggedPromos(categoryId, language, countryCode) {
  const rows = await prisma.otherPromoCategory.findMany({
    where: { categoryId },
    include: {
      promo: {
        include: {
          translations: { where: { locale: language } },
          store: { include: { translations: { where: { locale: language } } } },
          bank:  { include: { translations: { where: { locale: language } } } },
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

export default async function CategoryDetailPage({ params }) {
  const { locale, slug } = await params;
  const [language, countryCode] = locale.split('-');
  const isAr = language === 'ar';
  const cc   = countryCode || 'SA';

  const catTranslation = await getCategoryBySlug(slug, language);
  if (!catTranslation) return notFound();

  const category      = catTranslation.category;
  const categoryName  = catTranslation.name;
  const categoryDesc  = catTranslation.description || null;
  const categoryIcon  = getCategoryIcon(category.icon, slug);
  const categoryColor = category.color || '#470ae2';

  const [
    stores,
    country,
    taggedVouchers,
    taggedProducts,
    taggedStacks,
    taggedPromos,
  ] = await Promise.all([
    getCategoryStores(category.id, language, cc),
    prisma.country.findUnique({
      where:   { code: cc },
      include: { translations: { where: { locale: language } } },
    }),
    getTaggedVouchers(category.id, language, cc),
    getTaggedProducts(category.id, language),
    getTaggedStacks(category.id, language, cc),
    getTaggedPromos(category.id, language, cc),
  ]);

  const hasContent =
    stores.length > 0 ||
    taggedVouchers.length > 0 ||
    taggedProducts.length > 0 ||
    taggedStacks.length > 0;

  if (!hasContent) return notFound();

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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home',       item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'الفئات'   : 'Categories', item: `${BASE_URL}/${locale}/categories` },
      { '@type': 'ListItem', position: 3, name: categoryName,                      item: `${BASE_URL}/${locale}/categories/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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
              {categoryDesc && <p className="cd-hero-intro">{categoryDesc}</p>}
              <div className="cd-stats">
                {taggedVouchers.length > 0 && (
                  <span className="cd-stat-pill cd-stat-pill--accent">
                    <span className="material-symbols-sharp">local_offer</span>
                    {taggedVouchers.length} {isAr ? 'كوبون مميز' : 'featured coupons'}
                  </span>
                )}
                {taggedProducts.length > 0 && (
                  <span className="cd-stat-pill cd-stat-pill--accent">
                    <span className="material-symbols-sharp">inventory_2</span>
                    {taggedProducts.length} {isAr ? 'منتج مميز' : 'featured products'}
                  </span>
                )}
                <span className="cd-stat-pill">
                  <span className="material-symbols-sharp">storefront</span>
                  {stores.length} {isAr ? 'متجر' : 'stores'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="cd-main">

          {/* ── 1. TAGGED VOUCHERS CAROUSEL — max 3, most recent ── */}
          {taggedVouchers.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">local_offer</span>
                  {isAr ? `عروض ${categoryName} المميزة` : `Featured ${categoryName} Deals`}
                </h2>
                <span className="cd-section-count">
                  {taggedVouchers.length} {isAr ? 'عرض' : taggedVouchers.length === 1 ? 'offer' : 'offers'}
                </span>
              </div>
              <EmblaCarousel locale={locale} slideWidth="360px" slideGap="1.25rem">
                {taggedVouchers.map(v => (
                  <CuratedOfferCard key={v.id} offer={v} />
                ))}
              </EmblaCarousel>
            </section>
          )}

          {/* ── 2. TAGGED PRODUCTS CAROUSEL — max 6, most recent ── */}
          {taggedProducts.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">inventory_2</span>
                  {isAr ? `منتجات ${categoryName} المميزة` : `Featured ${categoryName} Products`}
                </h2>
                <span className="cd-section-count">
                  {taggedProducts.length} {isAr ? 'منتج' : taggedProducts.length === 1 ? 'product' : 'products'}
                </span>
              </div>
              <EmblaCarousel locale={locale} slideWidth="180px" slideGap="1rem">
                {taggedProducts.map(product => (
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

          {/* ── 3. OFFER STACKS CAROUSEL ── */}
          {taggedStacks.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">bolt</span>
                  {isAr ? 'ادمج ووفّر أكثر' : 'Stack & Save More'}
                </h2>
                <span className="cd-section-count">
                  {taggedStacks.length} {isAr ? 'عرض مدمج' : taggedStacks.length === 1 ? 'stacked offer' : 'stacked offers'}
                </span>
              </div>
              <EmblaCarousel locale={locale} slideWidth="300px" slideGap="1.25rem">
                {taggedStacks.map((stack, i) => (
                  <OfferStackBox key={`${stack.storeId}-${i}`} stack={stack} locale={locale} />
                ))}
              </EmblaCarousel>
            </section>
          )}

          {/* ── 4. BANK & CARD OFFERS ── */}
          {taggedPromos.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">account_balance</span>
                  {isAr ? 'عروض البنوك والبطاقات' : 'Bank & Card Offers'}
                </h2>
                <span className="cd-section-count">
                  {taggedPromos.length} {isAr ? 'عرض' : taggedPromos.length === 1 ? 'offer' : 'offers'}
                </span>
              </div>
              <div className="cd-promos-grid">
                {taggedPromos.map(promo => (
                  <div key={promo.id} className="cd-promo-card">
                    {(promo.storeLogo || promo.bankLogo) && (
                      <div className="cd-promo-logos">
                        {promo.storeLogo && (
                          <img src={promo.storeLogo} alt={promo.storeName} className="cd-promo-logo" />
                        )}
                        {promo.bankLogo && (
                          <img src={promo.bankLogo} alt={promo.bankName} className="cd-promo-logo" />
                        )}
                      </div>
                    )}
                    <div className="cd-promo-body">
                      <div className="cd-promo-title">{promo.title}</div>
                      {promo.description && (
                        <div className="cd-promo-desc">{promo.description}</div>
                      )}
                      <div className="cd-promo-tags">
                        {promo.bankName && (
                          <span className="cd-promo-tag cd-promo-tag--bank">🏦 {promo.bankName}</span>
                        )}
                        {promo.storeName && (
                          <span className="cd-promo-tag">{promo.storeName}</span>
                        )}
                        {promo.expiryDate && (() => {
                          const diff = Math.ceil((new Date(promo.expiryDate) - Date.now()) / 86_400_000);
                          return diff > 0 && diff <= 7 ? (
                            <span className="cd-promo-tag cd-promo-tag--urgent">
                              {isAr ? `ينتهي خلال ${diff} يوم` : `Expires in ${diff}d`}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    {promo.url && (
                      <a href={promo.url} target="_blank" rel="noopener noreferrer" className="cd-promo-cta">
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

          {/* ── 5. FEATURED STORES ── */}
          {featuredStores.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">star</span>
                  {isAr ? 'المتاجر المميزة' : 'Featured Stores'}
                </h2>
                <span className="cd-section-count">
                  {featuredStores.length} {isAr ? 'متجر' : featuredStores.length === 1 ? 'store' : 'stores'}
                </span>
              </div>
              <div className="cd-stores-grid">
                {featuredStores.map(transformStore).map(s => <StoreCard key={s.id} store={s} />)}
              </div>
            </section>
          )}

          {/* ── 6. ALL STORES ── */}
          {regularStores.length > 0 && (
            <section className="cd-section">
              <div className="cd-section-header">
                <h2 className="cd-section-title">
                  <span className="material-symbols-sharp">storefront</span>
                  {featuredStores.length > 0
                    ? (isAr ? 'متاجر أخرى' : 'More Stores')
                    : (isAr ? `كل متاجر ${categoryName}` : `All ${categoryName} Stores`)}
                </h2>
                <span className="cd-section-count">
                  {regularStores.length} {isAr ? 'متجر' : regularStores.length === 1 ? 'store' : 'stores'}
                </span>
              </div>
              <div className="cd-stores-grid">
                {regularStores.map(transformStore).map(s => <StoreCard key={s.id} store={s} />)}
              </div>
            </section>
          )}

          {/* ── 7. EDITORIAL ── */}
          <section className="cd-section">
            <div className="cd-editorial">
              <h2>
                <span className="material-symbols-sharp">tips_and_updates</span>
                {isAr ? `كيف توفر في تسوق ${categoryName}؟` : `How to save on ${categoryName} shopping?`}
              </h2>
              <p>
                {isAr
                  ? `تحقق دائماً من صلاحية الكود قبل إتمام الشراء. بعض عروض ${categoryName} تكون حصرية للمستخدمين الجدد. يمكنك أيضاً دمج كود الخصم مع عروض البنوك للحصول على أعلى نسبة توفير.`
                  : `Always verify code validity before checkout. Some ${categoryName} offers are exclusive to new users. You can also stack discount codes with bank offers to reach the maximum possible savings.`}
              </p>
              <Link href={`/${locale}/stores`} className="cd-view-all">
                {isAr ? 'تصفح كل المتاجر' : 'Browse all stores'}
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
