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

// Generates cohesive, clean light background color palettes if not supplied by the DB
function getFallbackPalette(index) {
  const palettes = [
    { bgColor: '#f4ebe1', textColor: '#1c1917', badgeBg: 'rgba(255, 255, 255, 0.75)', badgeColor: '#44403c', btnBg: 'rgba(0, 0, 0, 0.06)', btnColor: '#1c1917' }, // Light Terracotta/Orange tone
    { bgColor: '#f3e8ee', textColor: '#1f1d24', badgeBg: 'rgba(255, 255, 255, 0.75)', badgeColor: '#4c4556', btnBg: 'rgba(0, 0, 0, 0.06)', btnColor: '#1f1d24' }, // Muted Rose/Pink tone
    { bgColor: '#eaf2f8', textColor: '#1a2530', badgeBg: 'rgba(255, 255, 255, 0.75)', badgeColor: '#34495e', btnBg: 'rgba(0, 0, 0, 0.06)', btnColor: '#1a2530' }, // Soft Blue tone
    { bgColor: '#eaf5ed', textColor: '#19281e', badgeBg: 'rgba(255, 255, 255, 0.75)', badgeColor: '#2d4a36', btnBg: 'rgba(0, 0, 0, 0.06)', btnColor: '#19281e' }, // Soft Mint tone
  ];
  return palettes[index % palettes.length];
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

  return offers.map((offer, index) => {
    const translation = offer.translations?.[0] || {};
    const storeTranslation = offer.store?.translations?.[0] || {};
    const fallbackColors = getFallbackPalette(index);

    // Determine context-based system badges
    let defaultBadge = isArabic ? 'متاح الآن' : 'Available now';
    if (offer.expiryDate) {
      defaultBadge = isArabic ? 'لفترة محدودة' : 'Limited time';
    } else if (offer.isComingSoon) { // Assuming an optional column helper
      defaultBadge = isArabic ? 'قريباً' : 'Coming soon';
    }

    return {
      id: offer.id,
      mainImage: getLocalizedImageUrl(offer.offerImage, isArabic),
      mainImageFallback: offer.offerImage,
      ctaUrl: offer.ctaUrl || '#',
      title: translation.title || '',
      subtitle: translation.subtitle || (isArabic ? 'اكتشف العروض الحصرية اليوم' : 'Discover exclusive deals today'),
      
      // App Meta fields mapped into your layout
      appIcon: offer.store?.bigLogo || offer.store?.logo || null,
      appName: storeTranslation.name || '',
      developer: offer.developerName || storeTranslation.name || '',
      rating: offer.ratingAgeText || (isArabic ? 'مقوّم لـ +3' : 'Rated for 3+'),
      
      // CTA Button Translations
      ctaText: translation.ctaText || (isArabic ? 'تثبيت' : 'Install'),
      ctaSubtext: translation.ctaSubtext || (isArabic ? 'عمليات الشراء داخل التطبيق' : 'In-app purchases'),
      badgeText: translation.badgeText || defaultBadge,

      // Flexible design theme hooks (prioritizes DB mappings if they exist)
      bgColor: offer.bgColor || fallbackColors.bgColor,
      textColor: offer.textColor || fallbackColors.textColor,
      badgeBg: offer.badgeBg || fallbackColors.badgeBg,
      badgeColor: offer.badgeColor || fallbackColors.badgeColor,
      btnBg: offer.btnBg || fallbackColors.btnBg,
      btnColor: offer.btnColor || fallbackColors.btnColor
    };
  });
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
