// components/OfferStacksSection/OfferStacksSection.jsx
// React Server Component — fetches top offer stacks across all stores
// and renders them in an Embla carousel on the homepage.

import { buildOfferStacks } from '@/lib/offerStacks';
import OfferStackBox from '@/components/OfferStackBox/OfferStackBox';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './OfferStacksSection.css';

export default async function OfferStacksSection({ locale, countryCode = 'SA' }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  let stacks = [];
  try {
    stacks = await buildOfferStacks({
      countryCode,
      language: lang,
      limit:    10,
      homepageOnly: true,
    });
  } catch (err) {
    console.error('[OfferStacksSection] build error:', err?.message);
    return null;
  }

  if (!stacks.length) return null;

  return (
    <section className="offer-stacks-section" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="offer-stacks-inner">

        {/* ── Header ── */}
        <div className="offer-stacks-header">
          <div className="offer-stacks-header-content">
            <h2>
              <span className="material-symbols-sharp">layers</span>
              {isAr ? 'عروض قابلة للجمع' : 'Stackable Offers'}
            </h2>
            <p>
              {isAr
                ? 'ادمج أكواد الخصم مع العروض البنكية لأعلى توفير ممكن'
                : 'Combine coupon codes with bank deals for maximum savings'}
            </p>
          </div>
        </div>

        {/* ── Carousel (replaces offer-stacks-scroll) ── */}
        <EmblaCarousel locale={locale} slideWidth="340px" slideGap="1.25rem">
          {stacks.map((stack) => (
            <OfferStackBox key={stack.storeId} stack={stack} locale={locale} />
          ))}
        </EmblaCarousel>

      </div>
    </section>
  );
}
