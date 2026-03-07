// components/OfferStacksSection/OfferStacksSection.jsx
// React Server Component — fetches top offer stacks across all stores
// and renders them in a responsive grid on the homepage.

import { buildOfferStacks } from '@/lib/offerStacks';
import OfferStackBox from '@/components/OfferStackBox/OfferStackBox';
import './OfferStacksSection.css';

export default async function OfferStacksSection({ locale, countryCode = 'SA' }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  let stacks = [];
  try {
    stacks = await buildOfferStacks({
      countryCode,
      language: lang,
      limit:    8,
      homepageOnly: true,
    });
  } catch (err) {
    // Silently skip — this section is non-critical
    console.error('[OfferStacksSection] build error:', err?.message);
    return null;
  }

  if (!stacks.length) return null;

  return (
    <section className="offer-stacks-section home-section">
      <div className="offer-stacks-header section-header">
        <div className="offer-stacks-header-content header-content">
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

      <div className="offer-stacks-scroll">
        {stacks.map((stack) => (
          <OfferStackBox
            key={stack.storeId}
            stack={stack}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
