// components/FeaturedStoresCarousel/FeaturedStoresCarousel.jsx
'use client';

import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import StoreCard from '@/components/StoreCard/StoreCard';
import './FeaturedStoresCarousel.css';

export default function FeaturedStoresCarousel({ title, stores = [], locale = 'en-SA' }) {
  if (!stores || stores.length === 0) {
    return null;
  }

  const isAr = locale?.startsWith('ar') ?? false;

  // Group stores into slides of 2 cards each
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

        <EmblaCarousel locale={locale} slideWidth="300px" slideGap="1rem" className="fsc-embla">
          {slides.map((slideStores, idx) => (
            <div key={idx} className="fsc-slide-column">
              {slideStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ))}
        </EmblaCarousel>
      </div>
    </section>
  );
}
