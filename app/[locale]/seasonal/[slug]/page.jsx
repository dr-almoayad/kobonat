// app/[locale]/seasonal/[slug]/page.jsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import VouchersGrid from '@/components/VouchersGrid/VouchersGrid';
import StoreCard from '@/components/StoreCard/StoreCard';
import BlogCard from '@/components/blog/BlogCard';
import CuratedOfferCard from '@/components/CuratedOfferCard/CuratedOfferCard';
import HelpBox from '@/components/help/HelpBox';
import './seasonal.css';

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSeasonLive(page) {
  if (!page.startMonth || !page.endMonth) return false;
  const now        = new Date();
  const month      = now.getMonth() + 1;
  const day        = now.getDate();
  const startNum   = page.startMonth * 100 + (page.startDay || 1);
  const endNum     = page.endMonth   * 100 + (page.endDay   || 28);
  const currentNum = month           * 100 + day;
  return startNum <= endNum
    ? currentNum >= startNum && currentNum <= endNum
    : currentNum >= startNum || currentNum <= endNum;
}

function daysUntilSeason(page) {
  if (!page.startMonth || isSeasonLive(page)) return null;
  const now   = new Date();
  const year  = now.getFullYear();
  let target  = new Date(year, page.startMonth - 1, page.startDay || 1);
  if (target <= now) target = new Date(year + 1, page.startMonth - 1, page.startDay || 1);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const lang = locale.split('-')[0];

  const page = await prisma.seasonalPage.findUnique({
    where:   { slug, isActive: true },
    include: { translations: { where: { locale: lang } } },
  });

  if (!page) return { title: 'Not Found' };

  const live = isSeasonLive(page);
  const t    = page.translations[0] || {};

  const seoTitle = live
    ? (t.seoTitle       || t.title               || slug)
    : (t.offSeasonSeoTitle || t.offSeasonTitle || t.seoTitle || t.title || slug);

  const seoDesc = live
    ? (t.seoDescription       || t.description               || '')
    : (t.offSeasonSeoDescription || t.offSeasonDescription || t.seoDescription || t.description || '');

  const isAr = lang === 'ar';

  return {
    metadataBase: new URL(BASE_URL),
    title:       seoTitle,
    description: seoDesc,
    alternates: {
      canonical: `${BASE_URL}/${locale}/seasonal/${slug}`,
      languages: {
        'ar-SA':    `${BASE_URL}/ar-SA/seasonal/${slug}`,
        'en-SA':    `${BASE_URL}/en-SA/seasonal/${slug}`,
        'x-default': `${BASE_URL}/ar-SA/seasonal/${slug}`,
      },
    },
    openGraph: {
      siteName:    isAr ? 'كوبونات' : 'Cobonat',
      title:       seoTitle,
      description: seoDesc,
      url:         `${BASE_URL}/${locale}/seasonal/${slug}`,
      images:      page.heroImage ? [{ url: page.heroImage, width: 1200, height: 630 }] : [],
      type:        'website',
    },
    robots: { index: true, follow: true },
  };
}

// ── Data fetch ────────────────────────────────────────────────────────────────

async function getSeasonalPageData(slug, lang, countryCode) {
  const now = new Date();

  const page = await prisma.seasonalPage.findUnique({
    where: { slug, isActive: true },
    include: {
      translations: { where: { locale: lang } },
      countries:    { include: { country: true } },
      pinnedStores: {
        orderBy: { order: 'asc' },
        include: {
          store: {
            include: {
              translations: { where: { locale: lang } },
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
      heroVouchers: {
        orderBy: { order: 'asc' },
        include: {
          voucher: {
            include: {
              translations: { where: { locale: lang } },
              store: { include: { translations: { where: { locale: lang } } } },
              _count: { select: { clicks: true } },
            },
          },
        },
      },
      curatedOffers: {
        orderBy: { order: 'asc' },
        include: {
          offer: {
            include: {
              translations: { where: { locale: lang } },
              store: { include: { translations: { where: { locale: lang } } } },
            },
          },
        },
      },
      blogPosts: {
        orderBy: { order: 'asc' },
        include: {
          post: {
            include: {
              translations: { where: { locale: lang } },
              author:   true,
              category: { include: { translations: { where: { locale: lang } } } },
            },
          },
        },
      },
    },
  });

  if (!page) return null;

  // Country gate
  const allowedInCountry = page.countries.some(pc => pc.country.code === countryCode);
  if (!allowedInCountry) return null;

  // Auto stores (StorePeakSeason)
  const pinnedStoreIds = page.pinnedStores.map(ps => ps.store.id);
  let autoStores = [];
  if (page.useStorePeakSeasonData) {
    autoStores = await prisma.store.findMany({
      where: {
        isActive:    true,
        id:          { notIn: pinnedStoreIds.length ? pinnedStoreIds : [0] },
        peakSeasons: { some: { seasonKey: page.seasonKey } },
        countries:   { some: { country: { code: countryCode } } },
      },
      include: {
        translations: { where: { locale: lang } },
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
      orderBy: { isFeatured: 'desc' },
    });
  }

  const transformStore = s => ({
    id:    s.id, logo: s.logo, bigLogo: s.bigLogo, color: s.color,
    isFeatured: s.isFeatured,
    translations: s.translations,
    _count: s._count,
    name:  s.translations[0]?.name || '',
    slug:  s.translations[0]?.slug || '',
    activeVouchersCount: s._count?.vouchers || 0,
  });

  const allStores = [
    ...page.pinnedStores.map(ps => transformStore(ps.store)),
    ...autoStores.map(transformStore),
  ];

  const allStoreIds = allStores.map(s => s.id);
  const vouchers = allStoreIds.length > 0
    ? await prisma.voucher.findMany({
        where: {
          storeId:   { in: allStoreIds },
          OR:        [{ expiryDate: null }, { expiryDate: { gte: now } }],
          countries: { some: { country: { code: countryCode } } },
        },
        include: {
          translations: { where: { locale: lang } },
          store: { include: { translations: { where: { locale: lang } } } },
          _count: { select: { clicks: true } },
        },
        orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { popularityScore: 'desc' }],
        take: 100,
      })
    : [];

  const transformVoucher = v => ({
    ...v,
    title:       v.translations[0]?.title       || '',
    description: v.translations[0]?.description || null,
    store: v.store ? {
      id: v.store.id,
      name: v.store.translations[0]?.name || '',
      slug: v.store.translations[0]?.slug || '',
      logo: v.store.logo,
    } : null,
  });

  return {
    page,
    allStores,
    vouchers:     vouchers.map(transformVoucher),
    heroVouchers: page.heroVouchers.filter(pv => pv.voucher).map(pv => transformVoucher(pv.voucher)),
    curatedOffers: page.curatedOffers.filter(pc => pc.offer).map(pc => pc.offer),
    blogPosts: page.blogPosts
      .filter(pb => pb.post?.status === 'PUBLISHED')
      .map(pb => {
        const p = pb.post;
        const t = p.translations[0] || {};
        return {
          id: p.id, slug: p.slug, featuredImage: p.featuredImage,
          publishedAt: p.publishedAt, isFeatured: p.isFeatured,
          title: t.title || '', excerpt: t.excerpt || '',
          author: p.author ? {
            name:   lang === 'ar' ? (p.author.nameAr || p.author.name) : p.author.name,
            avatar: p.author.avatar,
          } : null,
          category: p.category ? {
            slug:  p.category.slug,
            name:  p.category.translations[0]?.name || '',
            color: p.category.color,
          } : null,
          tags: [],
        };
      }),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SeasonalPageRoute({ params }) {
  const { slug, locale } = await params;
  const [lang, countryCode] = locale.split('-');
  const isAr = lang === 'ar';

  const data = await getSeasonalPageData(slug, lang, countryCode || 'SA');
  if (!data) return notFound();

  const { page, allStores, vouchers, heroVouchers, curatedOffers, blogPosts } = data;
  const t    = page.translations[0] || {};
  const live = isSeasonLive(page);
  const days = daysUntilSeason(page);

  // Pick copy based on live status
  const displayTitle = live
    ? (t.title       || t.offSeasonTitle       || '')
    : (t.offSeasonTitle       || t.title       || '');
  const displayDesc  = live
    ? (t.description || t.offSeasonDescription || '')
    : (t.offSeasonDescription || t.description || '');

  // Countdown label
  const countdownLabel = (() => {
    if (live) return isAr ? '🔴 الموسم الآن' : '🔴 Season is Live';
    if (!days) return null;
    return isAr ? `⏳ يبدأ خلال ${days} يوم` : `⏳ Starts in ${days} days`;
  })();

  const codeVouchers     = vouchers.filter(v => v.type === 'CODE');
  const dealVouchers     = vouchers.filter(v => v.type === 'DEAL');
  const shippingVouchers = vouchers.filter(v => v.type === 'FREE_SHIPPING');

  return (
    <main className="sp-page" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Hero ── */}
      <section
        className="sp-hero"
        style={page.heroImage ? { backgroundImage: `url(${page.heroImage})` } : {}}
      >
        <div className="sp-hero__overlay" />
        <div className="sp-hero__content">
          {countdownLabel && (
            <div className={`sp-status-badge ${live ? 'sp-status-badge--live' : 'sp-status-badge--upcoming'}`}>
              {countdownLabel}
            </div>
          )}
          <h1 className="sp-hero__title">{displayTitle}</h1>
          {displayDesc && <p className="sp-hero__desc">{displayDesc}</p>}
          <div className="sp-hero__stats">
            {allStores.length > 0 && (
              <span className="sp-hero__stat">
                <span className="material-symbols-sharp">storefront</span>
                {allStores.length} {isAr ? 'متجر' : 'stores'}
              </span>
            )}
            {vouchers.length > 0 && (
              <span className="sp-hero__stat">
                <span className="material-symbols-sharp">local_offer</span>
                {vouchers.length} {isAr ? 'عرض نشط' : 'active offers'}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="sp-body">

        {/* ── Hero vouchers ── */}
        {heroVouchers.length > 0 && (
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">
                <span className="material-symbols-sharp">star</span>
                {isAr ? 'أفضل العروض' : 'Top Picks'}
              </h2>
            </div>
            <VouchersGrid vouchers={heroVouchers} />
          </section>
        )}

        {/* ── Stores ── */}
        {allStores.length > 0 && (
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">
                <span className="material-symbols-sharp">storefront</span>
                {isAr ? 'المتاجر المشاركة' : 'Participating Stores'}
              </h2>
              <span className="sp-section-count">{allStores.length}</span>
            </div>
            <div className="sp-stores-grid">
              {allStores.map(store => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        )}

        {/* ── Coupon codes ── */}
        {codeVouchers.length > 0 && (
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">
                <span className="material-symbols-sharp">confirmation_number</span>
                {isAr ? 'أكواد الخصم' : 'Coupon Codes'}
              </h2>
              <span className="sp-section-count">{codeVouchers.length}</span>
            </div>
            <VouchersGrid vouchers={codeVouchers} />
          </section>
        )}

        {/* ── Deals ── */}
        {dealVouchers.length > 0 && (
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">
                <span className="material-symbols-sharp">bolt</span>
                {isAr ? 'العروض والصفقات' : 'Deals'}
              </h2>
              <span className="sp-section-count">{dealVouchers.length}</span>
            </div>
            <VouchersGrid vouchers={dealVouchers} />
          </section>
        )}

        {/* ── Free shipping ── */}
        {shippingVouchers.length > 0 && (
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">
                <span className="material-symbols-sharp">local_shipping</span>
                {isAr ? 'الشحن المجاني' : 'Free Shipping'}
              </h2>
              <span className="sp-section-count">{shippingVouchers.length}</span>
            </div>
            <VouchersGrid vouchers={shippingVouchers} />
          </section>
        )}

        {/* ── Curated offers ── */}
        {curatedOffers.length > 0 && (
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">
                <span className="material-symbols-sharp">verified</span>
                {isAr ? 'عروض مختارة' : 'Curated Offers'}
              </h2>
            </div>
            <div className="sp-curated-grid">
              {curatedOffers.map(offer => (
                <CuratedOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {/* ── Blog posts ── */}
        {blogPosts.length > 0 && (
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">
                <span className="material-symbols-sharp">article</span>
                {isAr ? 'مقالات ذات صلة' : 'Related Articles'}
              </h2>
              <Link href={`/${locale}/blog`} className="sp-section-link">
                {isAr ? 'كل المقالات' : 'All articles'}
                <span className="material-symbols-sharp">chevron_right</span>
              </Link>
            </div>
            <div className="sp-blog-grid">
              {blogPosts.map(post => (
                <BlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {allStores.length === 0 && vouchers.length === 0 && (
          <div className="sp-empty">
            <span className="material-symbols-sharp">event_upcoming</span>
            <h2>
              {isAr
                ? live ? 'العروض قيد التحضير' : 'ترقب العروض قريباً'
                : live ? 'Deals coming soon'  : 'Offers dropping soon'}
            </h2>
            <p>
              {isAr
                ? 'سيتم تحديث الصفحة بأحدث العروض عند انطلاق الموسم.'
                : 'This page will be updated with the latest deals when the season launches.'}
            </p>
            <Link href={`/${locale}/coupons`} className="sp-empty-btn">
              {isAr ? 'تصفح كل العروض' : 'Browse all deals'}
            </Link>
          </div>
        )}

      </div>

      <HelpBox locale={locale} />
    </main>
  );
}
