// components/FeaturedStoresSection/FeaturedStoresSection.jsx
// RSC — fetches isFeatured stores and renders them in an Embla carousel.

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import StoreCard from '@/components/StoreCard/StoreCard';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './FeaturedStoresSection.css';

async function getFeaturedStores(language) {
  const stores = await prisma.store.findMany({
    where:   { isActive: true, isFeatured: true },
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
      name:      t.name      || '',
      slug:      t.slug      || '',
      showOffer: t.showOffer || '',
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
    <section className="fss-section home-section alt-bg" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="section-header">
        <div className="header-content">
          <h2>
            <span className="material-symbols-sharp">storefront</span>
            {isAr ? 'متاجر مميزة' : 'Featured Stores'}
          </h2>
        </div>
      </div>

      <EmblaCarousel locale={locale} slideWidth="260px" slideGap="1.25rem">
        {stores.map(s => <StoreCard key={s.id} store={s} />)}
      </EmblaCarousel>

      <Link href={`/${locale}/stores`} className="btn-view-all">
        {isAr ? 'تصفح المتاجر' : 'Browse Stores'}
        <span className="material-symbols-sharp">
          {isAr ? 'arrow_back' : 'arrow_forward'}
        </span>
      </Link>
    </section>
  );
}
