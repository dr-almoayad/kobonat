// app/[locale]/categories/page.jsx
// Lists all categories available in the current country.
// Fully server-rendered — no client JS required.

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allLocaleCodes } from '@/i18n/locales';
import HelpBox from '@/components/help/HelpBox';
import './page.css';

export const revalidate = 3600; // Rebuild at most once per hour

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// Default icon per common category keys (fallback when icon field is missing)
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

// Pastel/vivid palette for cards that have no color set
const FALLBACK_COLORS = [
  '#470ae2', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#0284c7', '#b45309',
];

function getCategoryColor(color, index) {
  if (color && color !== '#470ae2' && color.startsWith('#')) return color;
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split('-');
  const isAr = language === 'ar';

  const title = isAr
    ? 'كل فئات التسوق | كوبونات وعروض حصرية بالسعودية'
    : 'All Shopping Categories | Coupons & Exclusive Deals in Saudi Arabia';

  const description = isAr
    ? 'تصفح جميع فئات الكوبونات والعروض في المملكة العربية السعودية. من الإلكترونيات والأزياء إلى السفر والمطاعم، وفر أكثر مع أحدث أكواد الخصم المحققة.'
    : 'Browse all coupon and deal categories in Saudi Arabia. From electronics and fashion to travel and food, save more with the latest verified promo codes.';

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/categories`,
      languages: {
        'ar-SA':    `${BASE_URL}/ar-SA/categories`,
        'en-SA':    `${BASE_URL}/en-SA/categories`,
        'x-default': `${BASE_URL}/ar-SA/categories`,
      },
    },
    openGraph: {
      siteName:    isAr ? 'كوبونات' : 'Cobonat',
      title,
      description,
      url:         `${BASE_URL}/${locale}/categories`,
      type:        'website',
      locale,
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512 }],
    },
    robots: { index: true, follow: true },
  };
}

// ── Data fetch ───────────────────────────────────────────────────────────────

async function getCategories(language, countryCode) {
  const now = new Date();

  const categories = await prisma.category.findMany({
    include: {
      translations: { where: { locale: language } },
      stores: {
        where: {
          store: {
            isActive: true,
            countries: { some: { country: { code: countryCode } } },
          },
        },
        select: {
          storeId: true,
          store: {
            select: {
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
          },
        },
      },
    },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });

  return categories
    .map(cat => {
      const translation = cat.translations[0];
      if (!translation?.name || !translation?.slug) return null;

      const storeCount   = cat.stores.length;
      const voucherCount = cat.stores.reduce((sum, sc) => sum + (sc.store._count?.vouchers ?? 0), 0);

      return {
        id:          cat.id,
        name:        translation.name,
        slug:        translation.slug,
        description: translation.description || null,
        icon:        cat.icon,
        color:       cat.color,
        storeCount,
        voucherCount,
      };
    })
    .filter(Boolean)
    .filter(cat => cat.storeCount > 0);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoriesPage({ params }) {
  const { locale } = await params;

  if (!allLocaleCodes.includes(locale)) notFound();

  const [language, countryCode] = locale.split('-');
  const isAr = language === 'ar';

  const categories = await getCategories(language, countryCode || 'SA');

  const totalStores   = [...new Set(categories.flatMap(c => c.storeCount))].reduce((a, b) => a + b, 0);
  const totalVouchers = categories.reduce((sum, c) => sum + c.voucherCount, 0);

  // Structured data — ItemList for Google rich results
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:       isAr ? 'فئات التسوق' : 'Shopping Categories',
    numberOfItems: categories.length,
    itemListElement: categories.map((cat, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      name:       cat.name,
      url:        `${BASE_URL}/${locale}/categories/${cat.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="categories-page" dir={isAr ? 'rtl' : 'ltr'}>

        {/* ── Header ── */}
        <header className="categories-header">
          <div className="categories-header-inner">
            <p className="categories-eyebrow">
              <span className="material-symbols-sharp">grid_view</span>
              {isAr ? 'تصفح حسب الفئة' : 'Browse by Category'}
            </p>

            <h1 className="categories-h1">
              {isAr
                ? 'كل فئات الكوبونات والعروض'
                : 'All Coupon & Deal Categories'}
            </h1>

            <p className="categories-intro">
              {isAr
                ? `اختر الفئة التي تريدها واحصل على أحدث أكواد الخصم المحققة من ${categories.length} فئة متاحة في المملكة العربية السعودية. عروض يومية من أشهر المتاجر مع توفير حقيقي مضمون.`
                : `Choose your category and find the latest verified promo codes across ${categories.length} shopping categories in Saudi Arabia. Daily deals from top stores with guaranteed real savings.`}
            </p>

            <div className="categories-stats">
              <span className="cat-stat">
                <span className="material-symbols-sharp">category</span>
                <strong>{categories.length}</strong>
                {isAr ? ' فئة' : ' categories'}
              </span>
              <span className="cat-stat-sep" />
              <span className="cat-stat">
                <span className="material-symbols-sharp">storefront</span>
                <strong>{totalStores}</strong>
                {isAr ? ' متجر' : ' stores'}
              </span>
              <span className="cat-stat-sep" />
              <span className="cat-stat">
                <span className="material-symbols-sharp">local_offer</span>
                <strong>{totalVouchers}</strong>
                {isAr ? ' كوبون فعال' : ' active coupons'}
              </span>
            </div>
          </div>
        </header>

        {/* ── Grid ── */}
        <section className="categories-grid-section">
          {categories.length === 0 ? (
            <div className="categories-empty">
              <span className="material-symbols-sharp">category</span>
              <p>{isAr ? 'لا توجد فئات متاحة حالياً' : 'No categories available yet'}</p>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map((cat, index) => {
                const color = getCategoryColor(cat.color, index);
                const icon  = getCategoryIcon(cat.icon, cat.slug);

                return (
                  <Link
                    key={cat.id}
                    href={`/${locale}/categories/${cat.slug}`}
                    className="cat-card"
                    aria-label={`${cat.name} — ${cat.storeCount} ${isAr ? 'متجر' : 'stores'}`}
                  >
                    {/* Top colour band */}
                    <div
                      className="cat-card-band"
                      style={{ background: color }}
                    />

                    {/* Icon */}
                    <div className="cat-card-icon-wrap">
                      <div
                        className="cat-card-icon-bg"
                        style={{ background: color }}
                      >
                        <span className="material-symbols-sharp">{icon}</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="cat-card-body">
                      <h2 className="cat-card-name">{cat.name}</h2>

                      {cat.description && (
                        <p className="cat-card-desc">{cat.description}</p>
                      )}

                      <div className="cat-card-counts">
                        <span className="cat-count-pill">
                          <span className="material-symbols-sharp">storefront</span>
                          {cat.storeCount} {isAr ? 'متجر' : 'stores'}
                        </span>
                        {cat.voucherCount > 0 && (
                          <span className="cat-count-pill">
                            <span className="material-symbols-sharp">local_offer</span>
                            {cat.voucherCount} {isAr ? 'كوبون' : 'deals'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow hint (desktop hover) */}
                    <div className="cat-card-arrow">
                      {isAr ? 'تصفح العروض' : 'Browse Deals'}
                      <span className="material-symbols-sharp">
                        {isAr ? 'arrow_back' : 'arrow_forward'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <HelpBox locale={locale} />
      </div>
    </>
  );
}
