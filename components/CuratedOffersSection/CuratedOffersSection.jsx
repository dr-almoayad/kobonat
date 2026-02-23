// components/CuratedOffersSection/CuratedOffersSection.jsx
// Server Component — fetches 3 active curated offers for the current locale/country

import { prisma } from '@/lib/prisma';
import CuratedOfferCard from '../CuratedOfferCard/CuratedOfferCard';
import './CuratedOffersSection.css';

// ── Data fetcher ──────────────────────────────────────────────────────────────
async function getCuratedOffers(locale, countryCode) {
  const lang = locale.split('-')[0]; // 'ar' | 'en'
  const now  = new Date();

  const offers = await prisma.curatedOffer.findMany({
    where: {
      isActive: true,
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: now } }
      ],
      // Filter by country if a country code was passed
      ...(countryCode && {
        OR: [
          { countries: { none: {} } },           // no country restrictions = global
          { countries: { some: { country: { code: countryCode } } } }
        ]
      })
    },
    include: {
      translations: { where: { locale: lang } },
      store: {
        include: {
          translations: { where: { locale: lang } }
        }
      }
    },
    orderBy: [
      { isFeatured: 'desc' },
      { order: 'asc' },
      { createdAt: 'desc' }
    ],
    take: 3   // ← Hard limit: always exactly 3
  });

  return offers;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default async function CuratedOffersSection({
  locale,
  countryCode,
  title,    // Optional override — falls back to locale-aware default
  subtitle, // Optional
}) {
  const lang   = locale.split('-')[0];
  const offers = await getCuratedOffers(locale, countryCode);

  // Don't render the section if there are no active offers
  if (!offers.length) return null;

  const sectionTitle   = title   || (lang === 'ar' ? 'العروض المميزة'    : 'Curated Offers');
  const sectionSubtitle = subtitle || (lang === 'ar' ? 'أفضل الصفقات المختارة بعناية لك' : 'Hand-picked deals, just for you');

  return (
    <section className="co-section" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="co-section-inner">
        {/* Header */}
        <div className="co-section-header">
          <div className="co-section-text">
            <h2 className="co-section-title">
              <span className="material-symbols-sharp co-section-icon">verified</span>
              {sectionTitle}
            </h2>
            {sectionSubtitle && (
              <p className="co-section-subtitle">{sectionSubtitle}</p>
            )}
          </div>
          {/* Count pill */}
          <span className="co-section-pill">
            {offers.length} {lang === 'ar' ? 'عروض' : 'offers'}
          </span>
        </div>

        {/* Grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="co-grid" data-count={offers.length}>
          {offers.map((offer) => (
            <CuratedOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </div>
    </section>
  );
}
