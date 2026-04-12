// components/FeaturedStoresSection/FeaturedStoresSection.jsx
// Desktop  (≥768px): static 4×2 grid, max-width 1312px, no carousel.
// Mobile  (<768px): 2-row horizontal CSS scroll-snap, no arrows.
// Max 8 stores. No Embla dependency for this section.

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import StoreCard from '@/components/StoreCard/StoreCard';
import './FeaturedStoresSection.css';

async function getFeaturedStores(language) {
  const stores = await prisma.store.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      translations: {
        where:  { locale: language },
        select: { name: true, slug: true, showOffer: true },
      },
      _count: {
        select: { vouchers: { where: { expiryDate: { gte: new Date() } } } },
      },
    },
    take: 8,
  });

  return stores.map(s => {
    const t = s.translations?.[0] || {};
    return {
      ...s,
      name:         t.name      || '',
      slug:         t.slug      || '',
      showOffer:    t.showOffer || '',
      translations: undefined,
    };
  });
}

export default async function FeaturedStoresSection({ locale }) {
  const [language] = locale.split('-');
  const isAr = language === 'ar';

  let stores = [];
  try {
    stores = await getFeaturedStores(language);
  } catch (err) {
    console.error('[FeaturedStoresSection]', err?.message);
    return null;
  }

  if (!stores.length) return null;

  return (
    <section className="fss-section" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fss-inner">

        {/* ── Header ── */}
        <div className="fss-header">
          <h2 className="fss-title">
            <span className="material-symbols-sharp" aria-hidden="true">storefront</span>
            {isAr ? 'متاجر مميزة' : 'Featured Stores'}
          </h2>
          <Link href={`/${locale}/stores`} className="fss-view-all">
            {isAr ? 'عرض الكل' : 'View all'}
            <span className="material-symbols-sharp" aria-hidden="true">
              {isAr ? 'arrow_back' : 'arrow_forward'}
            </span>
          </Link>
        </div>

        {/* ── Grid / Carousel ── */}
        <div className="fss-grid" role="list">
          {stores.map(s => (
            <div key={s.id} className="fss-cell" role="listitem">
              <StoreCard store={s} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
