// app/[locale]/bank-and-payment-offers/page.jsx
// Public-facing page listing all active bank/payment OtherPromo records
// for the current country, with type + entity tab filtering.

import { prisma }          from '@/lib/prisma';
import { notFound }         from 'next/navigation';
import { allLocaleCodes }   from '@/i18n/locales';
import HelpBox              from '@/components/help/HelpBox';
import BankOffersClient     from './BankOffersClient';
import './page.css';

export const revalidate = 600; // 10-minute ISR

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split('-');
  const isAr = language === 'ar';

  const title = isAr
    ? 'عروض البنوك ووسائل الدفع | خصومات حصرية في السعودية'
    : 'Bank & Payment Offers | Exclusive Discounts in Saudi Arabia';

  const description = isAr
    ? 'احصل على أفضل خصومات البنوك والبطاقات الائتمانية ووسائل الدفع في المملكة العربية السعودية. عروض مدى، Apple Pay، فيزا، ماستركارد وأكثر — محدثة باستمرار.'
    : 'Find the best bank card, credit card, and payment method discounts in Saudi Arabia. Mada, Apple Pay, Visa, Mastercard offers and more — updated regularly.';

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/bank-offers`,
      languages: {
        'ar-SA':     `${BASE_URL}/ar-SA/bank-offers`,
        'en-SA':     `${BASE_URL}/en-SA/bank-offers`,
        'x-default': `${BASE_URL}/ar-SA/bank-offers`,
      },
    },
    openGraph: {
      siteName:    isAr ? 'كوبونات' : 'Cobonat',
      title,
      description,
      url:         `${BASE_URL}/${locale}/bank-offers`,
      type:        'website',
      locale,
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512 }],
    },
    robots: { index: true, follow: true },
  };
}

// ── Data helpers ─────────────────────────────────────────────────────────────

async function getPageData(language, countryCode) {
  const now = new Date();

  const [promoRows, bankRows, pmRows] = await Promise.all([

    // ── Offers ──────────────────────────────────────────────────────────────
    prisma.otherPromo.findMany({
      where: {
        isActive:  true,
        country:   { code: countryCode },
        type:      { in: ['BANK_OFFER', 'CARD_OFFER', 'PAYMENT_OFFER', 'SEASONAL', 'OTHER'] },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      include: {
        translations:  { where: { locale: language } },
        store:         { include: { translations: { where: { locale: language } } } },
        bank:          { include: { translations: { where: { locale: language } } } },
        card:          { include: { translations: { where: { locale: language } } } },
        paymentMethod: { include: { translations: { where: { locale: language } } } },
      },
      orderBy: [
        { discountPercent:    'desc' },
        { verifiedAvgPercent: 'desc' },
        { order:              'asc'  },
        { createdAt:          'desc' },
      ],
    }),

    // ── Banks (for entity chips) ─────────────────────────────────────────────
    prisma.bank.findMany({
      where:   { isActive: true },
      include: { translations: { where: { locale: language } } },
      orderBy: { id: 'asc' },
    }),

    // ── Payment methods (for entity chips) ───────────────────────────────────
    prisma.paymentMethod.findMany({
      include: { translations: { where: { locale: language } } },
      orderBy: { id: 'asc' },
    }),
  ]);

  return { promoRows, bankRows, pmRows };
}

// ── Transform raw Prisma rows ─────────────────────────────────────────────────

function transformOffers(promoRows, language) {
  return promoRows.map(p => {
    const t   = p.translations[0] || {};
    const st  = p.store?.translations[0] || {};
    const bt  = p.bank?.translations[0] || {};
    const ct  = p.card?.translations[0] || {};
    const pmt = p.paymentMethod?.translations[0] || {};

    return {
      id:                p.id,
      type:              p.type,
      url:               p.url,
      image:             p.image,
      voucherCode:       p.voucherCode || null,
      expiryDate:        p.expiryDate?.toISOString() || null,
      startDate:         p.startDate?.toISOString()  || null,
      discountPercent:   p.discountPercent   || null,
      verifiedAvgPercent: p.verifiedAvgPercent || null,

      // Translated
      title:       t.title       || '',
      description: t.description || null,
      terms:       t.terms       || null,

      // Store
      storeId:   p.storeId || null,
      storeName: st.name   || null,
      storeLogo: p.store?.logo || null,

      // Bank
      bankId:   p.bankId || null,
      bankName: bt.name  || null,
      bankLogo: p.bank?.logo || null,

      // Card
      cardId:   p.cardId || null,
      cardName: ct.name  || p.cardNetwork || null,

      // Payment method
      paymentMethodId:   p.paymentMethodId || null,
      paymentMethodName: pmt.name          || null,
      paymentMethodLogo: p.paymentMethod?.logo || null,
    };
  });
}

function transformBanks(bankRows, language) {
  return bankRows.map(b => ({
    id:    b.id,
    name:  b.translations[0]?.name || b.slug,
    logo:  b.logo,
    color: b.color,
  }));
}

function transformPMs(pmRows, language) {
  return pmRows.map(pm => ({
    id:   pm.id,
    name: pm.translations[0]?.name || pm.slug,
    logo: pm.logo,
  }));
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BankOffersPage({ params }) {
  const { locale } = await params;

  if (!allLocaleCodes.includes(locale)) notFound();

  const [language, countryCode] = locale.split('-');
  const isAr = language === 'ar';
  const cc   = countryCode || 'SA';

  const { promoRows, bankRows, pmRows } = await getPageData(language, cc);

  const offers         = transformOffers(promoRows, language);
  const banks          = transformBanks(bankRows, language);
  const paymentMethods = transformPMs(pmRows, language);

  // Stats
  const uniqueBankCount = new Set(offers.map(o => o.bankId).filter(Boolean)).size;
  const uniquePMCount   = new Set(offers.map(o => o.paymentMethodId).filter(Boolean)).size;

  // Structured data — ItemList for SEO
  const itemListSchema = {
    '@context':    'https://schema.org',
    '@type':       'ItemList',
    name:          isAr ? 'عروض البنوك ووسائل الدفع' : 'Bank & Payment Offers',
    numberOfItems: offers.length,
    itemListElement: offers.slice(0, 10).map((o, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      name:       o.title,
      url:        o.url || `${BASE_URL}/${locale}/bank-offers`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="bo-page" dir={isAr ? 'rtl' : 'ltr'}>

        {/* ── Header ── */}
        <header className="bo-header">
          <div className="bo-header-inner">
            <p className="bo-eyebrow">
              <span className="material-symbols-sharp">account_balance</span>
              {isAr ? 'عروض حصرية' : 'Exclusive Offers'}
            </p>

            <h1 className="bo-h1">
              {isAr
                ? 'عروض البنوك والبطاقات ووسائل الدفع'
                : 'Bank, Card & Payment Offers'}
            </h1>

            <p className="bo-intro">
              {isAr
                ? `اكتشف أفضل عروض البنوك والبطاقات الائتمانية ووسائل الدفع في ${cc === 'SA' ? 'السعودية' : cc}. خصومات حقيقية موثقة تساعدك على توفير أكثر عند كل عملية شراء.`
                : `Discover the best bank, credit card and payment method offers available in Saudi Arabia. Verified discounts to help you save more on every purchase.`}
            </p>

            <div className="bo-stats">
              <span className="bo-stat">
                <span className="material-symbols-sharp">local_offer</span>
                <strong>{offers.length}</strong>
                {isAr ? ' عرض فعال' : ' active offers'}
              </span>

              {uniqueBankCount > 0 && (
                <>
                  <span className="bo-stat-sep" />
                  <span className="bo-stat">
                    <span className="material-symbols-sharp">account_balance</span>
                    <strong>{uniqueBankCount}</strong>
                    {isAr ? ' بنك' : ' banks'}
                  </span>
                </>
              )}

              {uniquePMCount > 0 && (
                <>
                  <span className="bo-stat-sep" />
                  <span className="bo-stat">
                    <span className="material-symbols-sharp">payments</span>
                    <strong>{uniquePMCount}</strong>
                    {isAr ? ' وسيلة دفع' : ' payment methods'}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Interactive client section (tabs + grid) ── */}
        <BankOffersClient
          offers={offers}
          banks={banks}
          paymentMethods={paymentMethods}
          isAr={isAr}
        />

        <div style={{ maxWidth: '1312px', margin: '0 auto', padding: '0 1.5rem' }}>
          <HelpBox locale={locale} />
        </div>
      </div>
    </>
  );
}
