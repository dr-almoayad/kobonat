// app/[locale]/stacks/page.jsx
// ─────────────────────────────────────────────────────────────
// Paginated listing of all active OfferStacks.
// Server Component — ISR 5 min.
// ─────────────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { allLocaleCodes } from '@/i18n/locales';
import OfferStackBox from '@/components/OfferStackBox/OfferStackBox';
import './stacks-page.css';

export const revalidate = 300;

const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const PER_PAGE   = 12;
const ORB_BADGES = ['70%', '30%', '25%', '50%', '15%', '40%'];

// ── Metadata ─────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }) {
  const { locale }   = await params;
  const { page = 1 } = await searchParams;
  const [language]   = locale.split('-');
  const isAr         = language === 'ar';
  const pageNum      = Math.max(1, parseInt(page));

  const canonical = pageNum === 1
    ? `${BASE_URL}/${locale}/stacks`
    : `${BASE_URL}/${locale}/stacks?page=${pageNum}`;

  const title = isAr
    ? pageNum === 1
      ? 'اجمع العروض ووفّر أكثر | كوبونات مدمجة حصرية — كوبونات'
      : `اجمع العروض ووفّر أكثر — صفحة ${pageNum} | كوبونات`
    : pageNum === 1
      ? 'Stack Deals & Save More | Exclusive Combined Offers — Cobonat'
      : `Stack Deals & Save More — Page ${pageNum} | Cobonat`;

  const description = isAr
    ? 'اكتشف أفضل طرق تجميع كوبونات الخصم مع العروض البنكية لأعلى توفير. ادمج كود الخصم مع الكاشباك ووفّر أكثر من أي وقت!'
    : 'Discover how to stack promo codes with bank offers and auto-deals for maximum savings. Combine coupons, cashback, and discounts like a pro!';

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'ar-SA':     pageNum === 1 ? `${BASE_URL}/ar-SA/stacks` : `${BASE_URL}/ar-SA/stacks?page=${pageNum}`,
        'en-SA':     pageNum === 1 ? `${BASE_URL}/en-SA/stacks` : `${BASE_URL}/en-SA/stacks?page=${pageNum}`,
        'x-default': `${BASE_URL}/ar-SA/stacks`,
      },
    },
    openGraph: {
      type:        'website',
      locale,
      url:         canonical,
      siteName:    isAr ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [{
        url:    `${BASE_URL}/logo-512x512.png`,
        width:  512,
        height: 512,
        alt:    isAr ? 'كوبونات — اجمع ووفّر' : 'Cobonat — Stack & Save',
      }],
    },
    twitter: {
      card:        'summary_large_image',
      site:        '@cobonat',
      title,
      description,
      images:      [`${BASE_URL}/logo-512x512.png`],
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:               true,
        follow:              true,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
  };
}

export async function generateStaticParams() {
  return allLocaleCodes.map(locale => ({ locale }));
}

// ── Data fetching ─────────────────────────────────────────────

async function getStacks({ language, page, perPage }) {
  const skip = (page - 1) * perPage;

  const voucherSelect = {
    id:                 true,
    code:               true,
    discount:           true,
    discountPercent:    true,
    verifiedAvgPercent: true,
    landingUrl:         true,
    translations: {
      where:  { locale: language },
      select: { title: true },
    },
  };

  const promoSelect = {
    id:                 true,
    type:               true,
    url:                true,
    image:              true,
    discountPercent:    true,
    verifiedAvgPercent: true,
    translations: {
      where:  { locale: language },
      select: { title: true },
    },
    bank: {
      select: {
        logo: true,
        translations: {
          where:  { locale: language },
          select: { name: true },
        },
      },
    },
  };

  const [total, rows] = await Promise.all([
    prisma.offerStack.count({ where: { isActive: true } }),
    prisma.offerStack.findMany({
      where:   { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      skip,
      take:    perPage,
      include: {
        store: {
          select: {
            id:   true,
            logo: true,
            translations: {
              where:  { locale: language },
              select: { name: true, slug: true },
            },
          },
        },
        codeVoucher: { select: voucherSelect },
        dealVoucher: { select: voucherSelect },
        promo:       { select: promoSelect },
      },
    }),
  ]);

  return { total, rows };
}

/** Converts a raw OfferStack row into the shape <OfferStackBox> expects. */
function toStackShape(ds, isAr) {
  const items = [];

  if (ds.codeVoucher) {
    const t = ds.codeVoucher.translations?.[0] || {};
    items.push({
      id:              ds.codeVoucher.id,
      itemType:        'CODE',
      title:           t.title || ds.codeVoucher.discount || (isAr ? 'كود خصم' : 'Coupon Code'),
      discount:        ds.codeVoucher.discount    || null,
      discountPercent: ds.codeVoucher.verifiedAvgPercent ?? ds.codeVoucher.discountPercent ?? null,
      code:            ds.codeVoucher.code        || null,
      landingUrl:      ds.codeVoucher.landingUrl  || null,
    });
  }

  if (ds.dealVoucher) {
    const t = ds.dealVoucher.translations?.[0] || {};
    items.push({
      id:              ds.dealVoucher.id,
      itemType:        'DEAL',
      title:           t.title || ds.dealVoucher.discount || (isAr ? 'عرض' : 'Deal'),
      discount:        ds.dealVoucher.discount    || null,
      discountPercent: ds.dealVoucher.verifiedAvgPercent ?? ds.dealVoucher.discountPercent ?? null,
      code:            null,
      landingUrl:      ds.dealVoucher.landingUrl  || null,
    });
  }

  if (ds.promo) {
    const t = ds.promo.translations?.[0] || {};
    items.push({
      id:              ds.promo.id,
      itemType:        'BANK_OFFER',
      title:           t.title || ds.promo.bank?.translations?.[0]?.name || (isAr ? 'عرض بنكي' : 'Bank Offer'),
      discount:        null,
      discountPercent: ds.promo.verifiedAvgPercent ?? ds.promo.discountPercent ?? null,
      code:            null,
      landingUrl:      ds.promo.url  || null,
      bankName:        ds.promo.bank?.translations?.[0]?.name || null,
      bankLogo:        ds.promo.bank?.logo || ds.promo.image  || null,
    });
  }

  if (items.length < 2) return null;

  const percents = items.map(i => (i.discountPercent || 0) / 100).filter(p => p > 0);
  const combinedSavingsPercent = percents.length >= 2
    ? Math.round((1 - percents.reduce((acc, p) => acc * (1 - p), 1)) * 100)
    : null;

  const t = ds.store?.translations?.[0] || {};
  return {
    storeId: ds.store?.id,
    store: {
      id:   ds.store?.id,
      name: t.name || '',
      slug: t.slug || '',
      logo: ds.store?.logo || null,
    },
    items,
    combinedSavingsPercent,
  };
}

// ── Sub-components ────────────────────────────────────────────

function Banner({ isAr, totalStacks }) {
  return (
    <header className="sp-banner">
      <div className="sp-orbs" aria-hidden="true">
        {ORB_BADGES.map((badge, i) => (
          <div key={i} className={`sp-orb sp-orb-${i + 1}`}>{badge}</div>
        ))}
      </div>

      <div className="sp-banner-inner">
        <div className="sp-banner-copy">
          <div className="sp-eyebrow">
            <span className="sp-eyebrow-dot" />
            {isAr ? 'حصري على كوبونات' : 'Exclusive to Cobonat'}
          </div>

          <h1 className="sp-headline" dir={isAr ? 'rtl' : 'ltr'}>
            {isAr ? (
              <>اجمع<br /><span className="sp-headline-accent">ووفّر</span><br />أكثر</>
            ) : (
              <>Stack.<br /><span className="sp-headline-accent">Save.</span><br />Win.</>
            )}
          </h1>

          <p className="sp-sub">
            {isAr
              ? 'ادمج كود الخصم + العرض البنكي + الخصم التلقائي في خطوة واحدة. التوفير الحقيقي يبدأ بالتجميع الذكي.'
              : 'Layer a promo code on top of a bank offer on top of an auto-deal — all in one click. Real savings start here.'}
          </p>
        </div>

        <div className="sp-stats-panel">
          <div className="sp-stat-card">
            <span className="sp-stat-number">{totalStacks}</span>
            <span className="sp-stat-label">{isAr ? 'تجميعة نشطة' : 'Active Stacks'}</span>
          </div>
          <div className="sp-stat-card">
            <span className="sp-stat-number">3×</span>
            <span className="sp-stat-label">{isAr ? 'أقصى توفير' : 'Max Savings'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Pagination({ currentPage, totalPages, locale, isAr }) {
  const base     = `/${locale}/stacks`;
  const pageHref = (p) => (p === 1 ? base : `${base}?page=${p}`);

  function pageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const nums = [1];
    if (currentPage > 3) nums.push('…');
    const lo = Math.max(2, currentPage - 1);
    const hi = Math.min(totalPages - 1, currentPage + 1);
    for (let i = lo; i <= hi; i++) nums.push(i);
    if (currentPage < totalPages - 2) nums.push('…');
    nums.push(totalPages);
    return nums;
  }

  return (
    <nav className="sp-pagination" aria-label={isAr ? 'تصفح الصفحات' : 'Page navigation'}>
      {currentPage > 1 ? (
        <Link href={pageHref(currentPage - 1)} className="sp-page-btn arrow"
          aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}>
          {isAr ? '›' : '‹'}
        </Link>
      ) : (
        <span className="sp-page-btn arrow disabled">{isAr ? '›' : '‹'}</span>
      )}

      {pageNumbers().map((p, idx) =>
        p === '…' ? (
          <span key={`e${idx}`} className="sp-page-ellipsis">…</span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className={`sp-page-btn${p === currentPage ? ' active' : ''}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link href={pageHref(currentPage + 1)} className="sp-page-btn arrow"
          aria-label={isAr ? 'الصفحة التالية' : 'Next page'}>
          {isAr ? '‹' : '›'}
        </Link>
      ) : (
        <span className="sp-page-btn arrow disabled">{isAr ? '‹' : '›'}</span>
      )}
    </nav>
  );
}

function StructuredData({ stacks, locale, currentPage }) {
  const [language] = locale.split('-');
  const isAr       = language === 'ar';
  const pageUrl    = currentPage === 1
    ? `${BASE_URL}/${locale}/stacks`
    : `${BASE_URL}/${locale}/stacks?page=${currentPage}`;

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1,
          name: isAr ? 'الرئيسية' : 'Home', item: `${BASE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2,
          name: isAr ? 'العروض المجمّعة' : 'Stacked Deals',
          item: `${BASE_URL}/${locale}/stacks` },
        ...(currentPage > 1 ? [{
          '@type': 'ListItem', position: 3,
          name: `Page ${currentPage}`, item: pageUrl,
        }] : []),
      ],
    },
    {
      '@context':    'https://schema.org',
      '@type':       'ItemList',
      name:          isAr ? 'العروض المجمّعة' : 'Stacked Deals',
      description:   isAr
        ? 'مجموعة من العروض المدمجة لأعلى توفير'
        : 'Combined offer stacks for maximum savings',
      url:           pageUrl,
      numberOfItems: stacks.length,
      itemListElement: stacks.map((s, i) => ({
        '@type':    'ListItem',
        position:   (currentPage - 1) * PER_PAGE + i + 1,
        name:       `${s.store.name} — ${isAr ? 'عروض مجمّعة' : 'Stacked Offers'}`,
        url:        `${BASE_URL}/${locale}/stores/${s.store.slug}`,
      })),
    },
    {
      '@context':   'https://schema.org',
      '@type':      'WebPage',
      '@id':        pageUrl,
      url:          pageUrl,
      name:         isAr ? 'العروض المجمّعة — كوبونات' : 'Stacked Deals — Cobonat',
      isPartOf:     { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
      publisher:    { '@type': 'Organization', '@id': `${BASE_URL}/#organization`,
                      name: isAr ? 'كوبونات' : 'Cobonat' },
    },
  ];

  return schemas.map((s, i) => (
    <script key={i} type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
  ));
}

// ── Page ─────────────────────────────────────────────────────

export default async function StacksPage({ params, searchParams }) {
  const { locale }     = await params;
  const resolvedSearch = await searchParams;
  const [language]     = locale.split('-');
  const isAr           = language === 'ar';

  if (!allLocaleCodes.includes(locale)) return notFound();

  const currentPage = Math.max(1, parseInt(resolvedSearch?.page || '1'));
  const { total, rows } = await getStacks({ language, page: currentPage, perPage: PER_PAGE });
  const totalPages      = Math.max(1, Math.ceil(total / PER_PAGE));

  if (currentPage > totalPages && totalPages > 0) return notFound();

  const stacks = rows.map(ds => toStackShape(ds, isAr)).filter(Boolean);

  const start = (currentPage - 1) * PER_PAGE + 1;
  const end   = Math.min(currentPage * PER_PAGE, total);

  return (
    <div className="stacks-page" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Structured data */}
      <StructuredData stacks={stacks} locale={locale} currentPage={currentPage} />

      {/* Pagination link hints for crawlers */}
      {currentPage > 1 && (
        <link rel="prev" href={
          currentPage === 2
            ? `${BASE_URL}/${locale}/stacks`
            : `${BASE_URL}/${locale}/stacks?page=${currentPage - 1}`
        } />
      )}
      {currentPage < totalPages && (
        <link rel="next" href={`${BASE_URL}/${locale}/stacks?page=${currentPage + 1}`} />
      )}

      {/* ── Banner ── */}
      <Banner isAr={isAr} totalStacks={total} />

      {/* ── Main content ── */}
      <main className="sp-content" id="stacks-list">

        <div className="sp-filter-bar">
          <p className="sp-results-count">
            {isAr
              ? <><strong>{start}–{end}</strong> من <strong>{total}</strong> تجميعة نشطة</>
              : <>Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> active stacks</>
            }
          </p>
          {totalPages > 1 && (
            <p className="sp-results-count">
              {isAr ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </p>
          )}
        </div>

        {stacks.length > 0 ? (
          <div className="sp-grid" aria-label={isAr ? 'قائمة العروض المجمّعة' : 'Stacked deals list'}>
            {stacks.map((stack) => (
              <OfferStackBox
                key={`${stack.storeId}-${stack.items.map(i => i.id).join('-')}`}
                stack={stack}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className="sp-empty">
            <div className="sp-empty-icon">🔍</div>
            <p>{isAr ? 'لا توجد عروض مجمّعة حالياً.' : 'No stacked deals available right now.'}</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            locale={locale}
            isAr={isAr}
          />
        )}
      </main>
    </div>
  );
}
