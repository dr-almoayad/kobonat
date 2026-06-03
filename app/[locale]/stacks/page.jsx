// app/[locale]/stacks/page.jsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { allLocaleCodes } from '@/i18n/locales'; 
import OfferStackBox from '@/components/OfferStackBox/OfferStackBox';
import StacksInfiniteGrid from './StacksInfiniteGrid';
import './stacks-page.css';

export const revalidate = 1800;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const PER_PAGE = 12;
const ORB_BADGES = ['70%', '30%', '25%', '50%', '15%', '40%'];

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split('-');
  const isAr = language === 'ar';

  const title = isAr
    ? 'اجمع العروض ووفّر أكثر | كوبونات مدمجة حصرية — كوبونات'
    : 'Stack Deals & Save More | Exclusive Combined Offers — Cobonat';

  const description = isAr
    ? 'اكتشف أفضل طرق تجميع كوبونات الخصم مع العروض البنكية لأعلى توفير. ادمج كود الخصم مع الكاشباك ووفّر أكثر من أي وقت!'
    : 'Discover how to stack promo codes with bank offers and auto-deals for maximum savings. Combine coupons, cashback, and discounts like a pro!';

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/stacks`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA/stacks`,
        'en-SA': `${BASE_URL}/en-SA/stacks`,
        'x-default': `${BASE_URL}/ar-SA/stacks`,
      },
    },
    openGraph: {
      type: 'website',
      locale,
      url: `${BASE_URL}/${locale}/stacks`,
      siteName: isAr ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [{
        url: `${BASE_URL}/logo-512x512.png`,
        width: 512,
        height: 512,
        alt: isAr ? 'كوبونات — اجمع ووفّر' : 'Cobonat — Stack & Save',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      title,
      description,
      images: [`${BASE_URL}/logo-512x512.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export async function generateStaticParams() {
  return allLocaleCodes.map(locale => ({ locale }));
}

// ── Shared selects (mirrors /api/stacks/route.js) ────────────────────────────

const buildVoucherSelect = (language) => ({
  id: true,
  code: true,
  discount: true,
  discountPercent: true,
  verifiedAvgPercent: true,
  landingUrl: true,
  expiryDate: true,
  translations: {
    where: { locale: language },
    select: { title: true },
  },
});

const buildPromoSelect = (language) => ({
  id: true,
  type: true,
  url: true,
  image: true,
  discountPercent: true,
  verifiedAvgPercent: true,
  expiryDate: true,
  translations: {
    where: { locale: language },
    select: { title: true },
  },
  bank: {
    select: {
      logo: true,
      translations: {
        where: { locale: language },
        select: { name: true },
      },
    },
  },
});

function toStackShape(ds, isAr, now) {
  const items = [];

  if (ds.codeVoucher) {
    const isExpired = !!ds.codeVoucher.expiryDate && new Date(ds.codeVoucher.expiryDate) < now;
    const t = ds.codeVoucher.translations?.[0] || {};
    items.push({
      id: ds.codeVoucher.id,
      itemType: 'CODE',
      title: t.title || ds.codeVoucher.discount || (isAr ? 'كود خصم' : 'Coupon Code'),
      discount: ds.codeVoucher.discount || null,
      discountPercent: ds.codeVoucher.verifiedAvgPercent ?? ds.codeVoucher.discountPercent ?? null,
      code: ds.codeVoucher.code || null,
      landingUrl: ds.codeVoucher.landingUrl || null,
      isExpired,
    });
  }

  if (ds.dealVoucher) {
    const isExpired = !!ds.dealVoucher.expiryDate && new Date(ds.dealVoucher.expiryDate) < now;
    const t = ds.dealVoucher.translations?.[0] || {};
    items.push({
      id: ds.dealVoucher.id,
      itemType: 'DEAL',
      title: t.title || ds.dealVoucher.discount || (isAr ? 'عرض' : 'Deal'),
      discount: ds.dealVoucher.discount || null,
      discountPercent: ds.dealVoucher.verifiedAvgPercent ?? ds.dealVoucher.discountPercent ?? null,
      code: null,
      landingUrl: ds.dealVoucher.landingUrl || null,
      isExpired,
    });
  }

  if (ds.promo) {
    const isExpired = !!ds.promo.expiryDate && new Date(ds.promo.expiryDate) < now;
    const t = ds.promo.translations?.[0] || {};
    items.push({
      id: ds.promo.id,
      itemType: 'BANK_OFFER',
      title: t.title || ds.promo.bank?.translations?.[0]?.name || (isAr ? 'عرض بنكي' : 'Bank Offer'),
      discount: null,
      discountPercent: ds.promo.verifiedAvgPercent ?? ds.promo.discountPercent ?? null,
      code: null,
      landingUrl: ds.promo.url || null,
      bankName: ds.promo.bank?.translations?.[0]?.name || null,
      bankLogo: ds.promo.bank?.logo || ds.promo.image || null,
      isExpired,
    });
  }

  if (items.length < 2) return null;

  const activePercents = items
    .filter(i => !i.isExpired)
    .map(i => (i.discountPercent || 0) / 100)
    .filter(p => p > 0);

  const combinedSavingsPercent =
    activePercents.length >= 2
      ? Math.round((1 - activePercents.reduce((acc, p) => acc * (1 - p), 1)) * 100)
      : activePercents.length === 1
      ? Math.round(activePercents[0] * 100)
      : null;

  const isExpired = items.some(i => i.isExpired);

  const st = ds.store?.translations?.[0] || {};
  return {
    storeId: ds.store?.id,
    store: { id: ds.store?.id, name: st.name || '', slug: st.slug || '', logo: ds.store?.logo || null },
    items,
    combinedSavingsPercent,
    isExpired,
  };
}

// ── Data fetch (SSR — first page only) ───────────────────────────────────────

async function getInitialStacks({ language, isAr }) {
  const now = new Date();

  const rows = await prisma.offerStack.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: 500,
    include: {
      store: {
        select: {
          id: true,
          logo: true,
          translations: {
            where: { locale: language },
            select: { name: true, slug: true },
          },
        },
      },
      codeVoucher: { select: buildVoucherSelect(language) },
      dealVoucher: { select: buildVoucherSelect(language) },
      promo: { select: buildPromoSelect(language) },
    },
  });

  const all = rows
    .map(ds => toStackShape(ds, isAr, now))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isExpired === b.isExpired) return 0;
      return a.isExpired ? 1 : -1;
    });

  return {
    stacks: all.slice(0, PER_PAGE),
    total: all.length,
    hasMore: all.length > PER_PAGE,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function StructuredData({ stacks, locale }) {
  const [language] = locale.split('-');
  const isAr = language === 'ar';
  const pageUrl = `${BASE_URL}/${locale}/stacks`;

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home', item: `${BASE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: isAr ? 'العروض المجمّعة' : 'Stacked Deals', item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: isAr ? 'العروض المجمّعة' : 'Stacked Deals',
      url: pageUrl,
      numberOfItems: stacks.length,
      itemListElement: stacks
        .filter(s => !s.isExpired)
        .map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${s.store.name} — ${isAr ? 'عروض مجمّعة' : 'Stacked Offers'}`,
          url: `${BASE_URL}/${locale}/stores/${s.store.slug}`,
        })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
      name: isAr ? 'العروض المجمّعة — كوبونات' : 'Stacked Deals — Cobonat',
      isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
      publisher: { '@type': 'Organization', '@id': `${BASE_URL}/#organization`, name: isAr ? 'كوبونات' : 'Cobonat' },
    },
  ];

  return schemas.map((s, i) => (
    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
  ));
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StacksPage({ params }) {
  const { locale } = await params;

  if (!allLocaleCodes.includes(locale)) return notFound();

  const [language] = locale.split('-');
  const isAr = language === 'ar';

  const { stacks: initialStacks, total, hasMore } = await getInitialStacks({ language, isAr });

  const activeCount = initialStacks.filter(s => !s.isExpired).length;

  return (
    <div className="stacks-page" dir={isAr ? 'rtl' : 'ltr'}>
      <StructuredData stacks={initialStacks} locale={locale} />

      <Banner isAr={isAr} totalStacks={total} />

      <main className="sp-content" id="stacks-list">
        <div className="sp-filter-bar">
          <p className="sp-results-count">
            {isAr
              ? <><strong>{total}</strong> تجميعة متاحة</>
              : <><strong>{total}</strong> stacks available</>}
          </p>
        </div>

        {initialStacks.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">🔍</div>
            <p>{isAr ? 'لا توجد عروض مجمّعة حالياً.' : 'No stacked deals available right now.'}</p>
          </div>
        ) : (
          <StacksInfiniteGrid
            initialStacks={initialStacks}
            initialHasMore={hasMore}
            initialTotal={total}
            locale={locale}
            isAr={isAr}
          />
        )}
      </main>
    </div>
  );
}
