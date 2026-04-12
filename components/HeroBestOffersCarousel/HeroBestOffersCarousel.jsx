// components/HeroBestOffersCarousel/HeroBestOffersCarousel.jsx
//
// RSC — no client JS needed.
// Shows top 3 curated offers where displayOrder > 10, most recently added first.
// Desktop: static 3-column grid. Mobile: horizontal scroll-snap carousel.

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import './HeroBestOffersCarousel.css';

async function getBestOffers(language) {
  const offers = await prisma.curatedOffer.findMany({
    where:   { displayOrder: { gt: 10 } },
    orderBy: { createdAt: 'desc' },
    take:    3,
    include: {
      voucher: {
        include: {
          translations: {
            where:  { locale: language },
            select: { title: true },
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
      },
    },
  });
  return offers;
}

export default async function HeroBestOffersCarousel({ locale = 'ar-SA', heading }) {
  const [language] = locale.split('-');
  const isAr = language === 'ar';

  let offers = [];
  try {
    offers = await getBestOffers(language);
  } catch (err) {
    console.error('[HeroBestOffersCarousel]', err?.message);
    return null;
  }

  if (!offers.length) return null;

  const defaultHeading = isAr
    ? 'أفضل الكوبونات والعروض الحصرية'
    : 'The Best Coupons, Promo Codes & Cash Back Offers';

  return (
    <div className="hbo-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="hbo-inner">

        <h2 className="hbo-heading">{heading || defaultHeading}</h2>

        {/* scroll wrapper — overflow on mobile, visible on desktop */}
        <div className="hbo-scroll">
          <div className="hbo-track">
            {offers.map((offer, idx) => {
              const v    = offer.voucher;
              const t    = v.translations?.[0]  || {};
              const st   = v.store?.translations?.[0] || {};
              const name = st.name  || v.store?.name || '';
              const slug = st.slug  || '';
              const logo = v.store?.logo || null;
              const img  = offer.featuredImage  || null;
              const title = t.title || '';
              const href  = v.landingUrl || `/${locale}/store/${slug}`;

              return (
                <div key={offer.id} className="hbo-slide">
                  <Link
                    href={href}
                    className={`hbo-card${img ? '' : ' hbo-card--no-image'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${name} — ${title}`}
                  >
                    {/* ── Content side ── */}
                    <div className="hbo-content">
                      <div className="hbo-logo-wrap">
                        {logo ? (
                          <img
                            src={logo}
                            alt={name}
                            className="hbo-logo"
                            loading={idx === 0 ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <span className="hbo-store-name">{name}</span>
                        )}
                      </div>

                      <p className="hbo-title">{title}</p>

                      <span className="hbo-cta" aria-hidden="true">
                        {isAr ? 'تسوق الآن' : 'Shop Now'}
                      </span>
                    </div>

                    {/* ── Featured image side ── */}
                    {img && (
                      <div className="hbo-image-wrap" aria-hidden="true">
                        <img
                          src={img}
                          alt=""
                          className="hbo-image"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
