// components/FeaturedStoresCarousel/FeaturedStoresCarousel.jsx
'use client';

import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import StoreCard from '@/components/StoreCard/StoreCard';
import './FeaturedStoresCarousel.css';

export default function FeaturedStoresCarousel({ title, stores = [], locale = 'en-SA' }) {
  if (!stores || stores.length === 0) return null;

  const isAr = locale?.startsWith('ar') ?? false;

  // Limit to max 12 stores
  const limitedStores = stores.slice(0, 12);

  return (
    <section className="fsc" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fsc-inner">
        <div className="fsc-header">
          <h2 className="fsc-title">{title}</h2>
          <div className="fsc-title-underline" />
        </div>

        <EmblaCarousel
          locale={locale}
          slideWidth="144px"
          slideGap="1px"
          className="fsc-embla"
          // freeScroll={true}  ← remove or set to false
        >
          {limitedStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </EmblaCarousel>
      </div>
    </section>
  );
}
