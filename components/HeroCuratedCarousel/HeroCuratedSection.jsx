// components/HeroCuratedCarousel/HeroCuratedSection.jsx
// RSC — fetches isFeatured curated offers, serialises to plain data,
// and passes to the <HeroCuratedCarousel> client component.

import { prisma } from '@/lib/prisma';
import HeroCuratedCarousel from './HeroCuratedCarousel';

async function getHeroSlides(language, countryCode) {
  const now = new Date();

  const offers = await prisma.curatedOffer.findMany({
    where: {
      isFeatured: true,
      isActive:   true,
      OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      AND: countryCode ? [{
        OR: [
          { countries: { none: {} } },
          { countries: { some: { country: { code: countryCode } } } },
        ],
      }] : undefined,
    },
    include: {
      translations: { where: { locale: language } },
      store: {
        include: {
          translations: { where: { locale: language } },
        },
      },
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: 8,
  });

  // Serialise to plain objects — no Prisma types, no Date objects
  return offers.map(offer => ({
    id:         offer.id,
    offerImage: offer.offerImage,
    ctaUrl:     offer.ctaUrl     || '#',
    title:      offer.translations?.[0]?.title   || '',
    ctaText:    offer.translations?.[0]?.ctaText || '',
    storeName:  offer.store?.translations?.[0]?.name || '',
    storeLogo:  offer.store?.bigLogo || null,
    storeSlug:  offer.store?.translations?.[0]?.slug || '',
  }));
}

export default async function HeroCuratedSection({ locale, countryCode = 'SA' }) {
  const [language] = locale.split('-');

  let slides = [];
  try {
    slides = await getHeroSlides(language, countryCode);
  } catch (err) {
    console.error('[HeroCuratedSection]', err?.message);
    return null;
  }

  if (!slides.length) return null;

  return <HeroCuratedCarousel slides={slides} locale={locale} />;
}
