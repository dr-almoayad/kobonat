// components/FeaturedStoresCarousel/FeaturedStoresCarousel.jsx
'use client';

import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import StoreDiscountCard from '../StoreDiscountCard/StoreDiscountCard';
import './FeaturedStoresCarousel.css';

export default function FeaturedStoresCarousel({ title, stores = [], locale = 'en-SA' }) {
  // Return nothing if there are no stores
  if (!stores || stores.length === 0) {
    return null;
  }

  const isAr = locale?.startsWith('ar') ?? false;

  // Group stores into slides of 2 cards each (desktop: two cards per slide, mobile: one column per slide)
  const slides = [];
  for (let i = 0; i < stores.length; i += 2) {
    slides.push(stores.slice(i, i + 2));
  }

  return (
    <section className="fsc" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fsc-inner">
        <div className="fsc-header">
          <h2 className="fsc-title">{title}</h2>
        </div>

        <EmblaCarousel
          locale={locale}
          slideWidth="300px"
          slideGap="1rem"
          className="fsc-embla"
        >
          {slides.map((slideStores, idx) => (
            <div key={idx} className="fsc-slide-column">
              {slideStores.map((store) => (
                <StoreDiscountCard key={store.id} store={store} locale={locale} />
              ))}
            </div>
          ))}
        </EmblaCarousel>
      </div>
    </section>
  );
}
