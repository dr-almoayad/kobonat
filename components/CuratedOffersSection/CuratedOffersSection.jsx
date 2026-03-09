// components/CuratedOffersSection/CuratedOffersSection.jsx
import { prisma } from '@/lib/prisma';
import CuratedOfferCard from '../CuratedOfferCard/CuratedOfferCard';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './CuratedOffersSection.css';

// ── Data fetcher ──────────────────────────────────────────────────────────────
async function getCuratedOffers(locale, countryCode) {
  const lang = locale.split('-')[0];
  const now  = new Date();

  return prisma.curatedOffer.findMany({
    where: {
      isActive: true,
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: now } }
      ],
      AND: countryCode ? [
        {
          OR: [
            { countries: { none: {} } },
            { countries: { some: { country: { code: countryCode } } } }
          ]
        }
      ] : undefined
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
    take: 12,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default async function CuratedOffersSection({ locale, countryCode, title, subtitle }) {
  const lang   = locale.split('-')[0];
  const offers = await getCuratedOffers(locale, countryCode);

  if (!offers.length) return null;

  const sectionTitle    = title    || (lang === 'ar' ? 'العروض المميزة'               : 'Curated Offers');
  const sectionSubtitle = subtitle || (lang === 'ar' ? 'أفضل الصفقات المختارة بعناية لك' : 'Hand-picked deals, just for you');

  return (
    <section className="co-section" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="co-section-inner">

        {/* ── Header ── */}
        <header className="co-header">
          <div className="co-header-content">
            <h2 className="co-title">
              <span className="material-symbols-sharp co-title-icon" aria-hidden="true">verified</span>
              {sectionTitle}
            </h2>
            {sectionSubtitle && <p className="co-subtitle">{sectionSubtitle}</p>}
          </div>
          <div className="co-badge-count">
            {offers.length} {lang === 'ar' ? 'عروض' : 'offers'}
          </div>
        </header>

        {/* ── Carousel (replaces co-grid) ── */}
        <EmblaCarousel locale={locale} slideWidth="300px" slideGap="1.25rem">
          {offers.map((offer) => (
            <CuratedOfferCard key={offer.id} offer={offer} />
          ))}
        </EmblaCarousel>

      </div>
    </section>
  );
}
