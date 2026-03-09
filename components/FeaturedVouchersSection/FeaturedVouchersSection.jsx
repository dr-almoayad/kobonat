// components/FeaturedVouchersSection/FeaturedVouchersSection.jsx
// RSC — fetches isExclusive vouchers and renders them in an Embla carousel.

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import VoucherCard from '@/components/VoucherCard/VoucherCard';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './FeaturedVouchersSection.css';

async function getFeaturedVouchers(language, countryCode) {
  const vouchers = await prisma.voucher.findMany({
    where: {
      isExclusive: true,
      expiryDate:  { gte: new Date() },
      store:       { isActive: true },
      countries:   { some: { country: { code: countryCode } } },
    },
    include: {
      translations: {
        where:  { locale: language },
        select: { title: true, description: true },
      },
      store: {
        include: {
          translations: {
            where:  { locale: language },
            select: { name: true, slug: true },
          },
        },
      },
    },
    orderBy: [{ isVerified: 'desc' }, { popularityScore: 'desc' }],
    take: 8,
  });

  return vouchers.map(v => {
    const vt = v.translations?.[0]        || {};
    const st = v.store?.translations?.[0] || {};
    return {
      ...v,
      title:       vt.title       || 'Special Offer',
      description: vt.description || null,
      store: v.store
        ? { ...v.store, name: st.name || '', slug: st.slug || '', translations: undefined }
        : null,
      translations: undefined,
    };
  });
}

export default async function FeaturedVouchersSection({ locale, countryCode = 'SA' }) {
  const [language] = locale.split('-');
  const isAr = language === 'ar';

  let vouchers = [];
  try {
    vouchers = await getFeaturedVouchers(language, countryCode);
  } catch (err) {
    console.error('[FeaturedVouchersSection]', err?.message);
    return null;
  }

  if (!vouchers.length) return null;

  return (
    <section className="fvs-section home-section" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="section-header">
        <div className="header-content">
          <h2>
            <span className="material-symbols-sharp">local_fire_department</span>
            {isAr ? 'أبرز العروض' : 'Trending Deals'}
          </h2>
          <p>{isAr ? 'أكواد موثقة توفّر لك المال اليوم' : 'Verified codes saving you money today'}</p>
        </div>
      </div>

      <EmblaCarousel locale={locale} slideWidth="340px" slideGap="1.25rem">
        {vouchers.map(v => <VoucherCard key={v.id} voucher={v} />)}
      </EmblaCarousel>

      <Link href={`/${locale}/stores`} className="btn-view-all">
        {isAr ? 'عرض الكل' : 'View All'}
        <span className="material-symbols-sharp">
          {isAr ? 'arrow_back' : 'arrow_forward'}
        </span>
      </Link>
    </section>
  );
}
