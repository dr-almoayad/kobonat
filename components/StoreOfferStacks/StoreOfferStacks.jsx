// components/StoreOfferStacks/StoreOfferStacks.jsx
// React Server Component — fetches offer stacks for one store
// and renders them in the main column of the store page.

import { buildOfferStacks } from '@/lib/offerStacks';
import OfferStackBox from '@/components/OfferStackBox/OfferStackBox';
import './StoreOfferStacks.css';

export default async function StoreOfferStacks({ storeId, locale, countryCode = 'SA' }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  let stacks = [];
  try {
    stacks = await buildOfferStacks({
      storeId,
      countryCode,
      language: lang,
      limit:    4, // at most 4 stacks per store
    });
  } catch (err) {
    console.error('[StoreOfferStacks] build error:', err?.message);
    return null;
  }

  if (!stacks.length) return null;

  return (
    <section className="store-offer-stacks-section vouchers-section">
      <h2 className="store-offer-stacks-title section-title">
        <span className="material-symbols-sharp">layers</span>
        {isAr ? 'عروض قابلة للجمع' : 'Stackable Offers'}
      </h2>

      <div className="store-offer-stacks-grid">
        {stacks.map((stack) => (
          <OfferStackBox
            key={`${stack.storeId}-stack`}
            stack={stack}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
