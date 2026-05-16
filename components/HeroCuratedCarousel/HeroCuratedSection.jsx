// components/HeroCuratedCarousel/HeroCuratedSection.jsx
import { prisma } from '@/lib/prisma';
import HeroCuratedCarousel from './HeroCuratedCarousel';

function getLocalizedImageUrl(originalUrl, isArabic) {
  if (!isArabic || !originalUrl) return originalUrl;
  if (originalUrl.match(/AR\.\w+$/i)) return originalUrl;
  const lastDot = originalUrl.lastIndexOf('.');
  if (lastDot === -1) return originalUrl;
  const base = originalUrl.slice(0, lastDot);
  const ext = originalUrl.slice(lastDot);
  return `${base}AR${ext}`;
}

async function getHeroSlides(language, countryCode) {
  const now = new Date();
  const offers = await prisma.curatedOffer.findMany({
    where: {
      isFeatured: true,
      isActive: true,
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

  const isArabic = language === 'ar';
  return offers.map(offer => ({
    id: offer.id,
    offerImage: getLocalizedImageUrl(offer.offerImage, isArabic),
    offerImageFallback: offer.offerImage, // original English image
    ctaUrl: offer.ctaUrl || '#',
    title: offer.translations?.[0]?.title || '',
    ctaText: offer.translations?.[0]?.ctaText || '',
    storeName: offer.store?.translations?.[0]?.name || '',
    storeLogo: offer.store?.bigLogo || null,
    storeSlug: offer.store?.translations?.[0]?.slug || '',
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
