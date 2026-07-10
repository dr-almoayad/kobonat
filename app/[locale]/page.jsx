// app/[locale]/page.jsx
// FULLY CORRECTED VERSION
// - Pre‑fetches all data for sections: HeroCurated, OfferStacks, Blog
// - Passes data as props to child components
// - Retains all existing metadata and structured data
// - ✅ Affiliate network verification tags are now scoped strictly to the homepage

import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import "./page.css";
import { notFound } from "next/navigation"; 
import { allLocaleCodes } from "@/i18n/locales";
import BrandsCarousel from "@/components/BrandsCarousel/BrandsCarousel";
import CuratedOffersSection from '@/components/CuratedOffersSection/CuratedOffersSection';
import HomeFeaturedProductsSection from '@/components/HomeFeaturedProducts/HomeFeaturedProductsSection';
import HomepageBlogSection from '@/components/blog/HomepageBlogSection';
import HelpBox from "@/components/help/HelpBox";
import HomepageHeroSection from '@/components/HomepageHeroSection/HomepageHeroSection';
import OfferStacksSection from '@/components/OfferStacksSection/OfferStacksSection';
import FeaturedVouchersSection from '@/components/FeaturedVouchersSection/FeaturedVouchersSection';
import FeaturedStoresSection from '@/components/FeaturedStoresSection/FeaturedStoresSection';
import FeaturedStoresCarousel from '@/components/FeaturedStoresCarousel/FeaturedStoresCarousel';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import HeroCuratedSection from '@/components/HeroCuratedCarousel/HeroCuratedSection';
import PromoCodesFAQ from '@/components/PromoCodesFAQ/PromoCodesFAQ';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import { buildOfferStacks } from '@/lib/offerStacks';

export const revalidate = 1800;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [language] = locale.split('-');
  const isArabic = language === 'ar';

  const title = isArabic
    ? 'كوبونات وأكواد خصم السعودية | Cobonat'
    : 'Verified Saudi Arabia Coupon Codes & Deals | Cobonat';

  const description = isArabic
    ? 'منصتك الأولى لأكواد الخصم والعروض في السعودية. كوبونات فعالة وموثقة لأشهر المتاجر العالمية والمحلية — مقاضيك، لبسك، وسفرياتك صارت أوفر!'
    : "Your #1 source for verified discount codes in Saudi 🇸🇦. Active coupons for top local and global stores — fashion, electronics, groceries and more.";

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    lastModified: new Date().toISOString(),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar-SA': `${BASE_URL}/ar-SA`,
        'en-SA': `${BASE_URL}/en-SA`,
        'x-default': `${BASE_URL}/ar-SA`,
      },
    },
    openGraph: {
      siteName: isArabic ? 'كوبونات' : 'Cobonat',
      title,
      description,
      images: [{ url: `${BASE_URL}/logo-512x512.png`, width: 512, height: 512, alt: 'Cobonat Logo' }],
      url: `${BASE_URL}/${locale}`,
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cobonat',
      creator: '@cobonat',
      title,
      description,
      images: [`${BASE_URL}/logo-512x512.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // ✅ FIX: Affiliate verification tags added here so they only render on the root page
    other: {
      "Takeads-verification": "ac9f8039-eeff-43ac-8757-df8d658ef91b",
      "tradetracker-site-verification": "813f3ae64e317d77ca412f3741e5d24b3c977369",
      "verify-admitad": "95d170f413",
    },
  };
}

// ── Helper: get localized image URL for curated offers ──
function getLocalizedImageUrl(originalUrl, isArabic) {
  if (!isArabic || !originalUrl) return originalUrl;
  if (originalUrl.match(/AR\.\w+$/i)) return originalUrl;
  const lastDot = originalUrl.lastIndexOf('.');
  if (lastDot === -1) return originalUrl;
  const base = originalUrl.slice(0, lastDot);
  const ext = originalUrl.slice(lastDot);
  return `${base}AR${ext}`;
}

// ── Helper: get fallback colour palettes ──
function getFallbackPalette(index) {
  const palettes = [
    { bgColor: '#f4ebe1', textColor: '#1c1917', badgeBg: 'rgba(255,255,255,0.75)', badgeColor: '#44403c', btnBg: 'rgba(0,0,0,0.06)', btnColor: '#1c1917' },
    { bgColor: '#f3e8ee', textColor: '#1f1d24', badgeBg: 'rgba(255,255,255,0.75)', badgeColor: '#4c4556', btnBg: 'rgba(0,0,0,0.06)', btnColor: '#1f1d24' },
    { bgColor: '#eaf2f8', textColor: '#1a2530', badgeBg: 'rgba(255,255,255,0.75)', badgeColor: '#34495e', btnBg: 'rgba(0,0,0,0.06)', btnColor: '#1a2530' },
    { bgColor: '#eaf5ed', textColor: '#19281e', badgeBg: 'rgba(255,255,255,0.75)', badgeColor: '#2d4a36', btnBg: 'rgba(0,0,0,0.06)', btnColor: '#19281e' },
  ];
  return palettes[index % palettes.length];
}

// ── Helper: fetch curated slides (mirrors HeroCuratedSection) ──
async function getCuratedSlides(language, countryCode) {
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
      store: { include: { translations: { where: { locale: language } } } },
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: 8,
  });

  const isArabic = language === 'ar';

  return offers.map((offer, index) => {
    const translation = offer.translations?.[0] || {};
    const storeTranslation = offer.store?.translations?.[0] || {};
    const fallbackColors = getFallbackPalette(index);
    const defaultBadge = isArabic ? 'متاح الآن' : 'Available now';
    return {
      id: offer.id,
      mainImage: getLocalizedImageUrl(offer.offerImage, isArabic),
      mainImageFallback: offer.offerImage,
      ctaUrl: offer.ctaUrl || '#',
      title: translation.title || '',
      subtitle: translation.subtitle || (isArabic ? 'اكتشف العروض الحصرية اليوم' : 'Discover exclusive deals today'),
      appIcon: offer.store?.bigLogo || offer.store?.logo || null,
      appName: storeTranslation.name || '',
      developer: offer.developerName || storeTranslation.name || '',
      rating: offer.ratingAgeText || (isArabic ? 'مقوّم لـ +3' : 'Rated for 3+'),
      ctaText: translation.ctaText || (isArabic ? 'تثبيت' : 'Install'),
      ctaSubtext: translation.ctaSubtext || (isArabic ? 'عمليات الشراء داخل التطبيق' : 'In-app purchases'),
      badgeText: translation.badgeText || defaultBadge,
      bgColor: offer.bgColor || fallbackColors.bgColor,
      textColor: offer.textColor || fallbackColors.textColor,
      badgeBg: offer.badgeBg || fallbackColors.badgeBg,
      badgeColor: offer.badgeColor || fallbackColors.badgeColor,
      btnBg: offer.btnBg || fallbackColors.btnBg,
      btnColor: offer.btnColor || fallbackColors.btnColor,
    };
  });
}

// ── Helper: fetch blog posts (mirrors HomepageBlogSection) ──
async function getFeaturedBlogPosts(lang, count = 3) {
  try {
    const baseWhere = { status: 'PUBLISHED' };
    const include = {
      translations: { where: { locale: lang } },
      author: true,
      category: { include: { translations: { where: { locale: lang } } } },
      tags: { include: { tag: { include: { translations: { where: { locale: lang } } } } } },
    };

    // Step 1: featured posts first
    const featured = await prisma.blogPost.findMany({
      where: { ...baseWhere, isFeatured: true },
      include,
      orderBy: { publishedAt: 'desc' },
      take: count,
    });

    if (featured.length >= count) return featured;

    // Step 2: fill remaining with latest non‑featured
    const featuredIds = featured.map(p => p.id);
    const latest = await prisma.blogPost.findMany({
      where: { ...baseWhere, id: { notIn: featuredIds.length ? featuredIds : [-1] } },
      include,
      orderBy: { publishedAt: 'desc' },
      take: count - featured.length,
    });

    return [...featured, ...latest];
  } catch (error) {
    console.error('[HomepageBlogSection] fetch error:', error.message);
    return [];
  }
}

// ── Helper: transform blog post for BlogCard ──
function transformBlogPost(post, lang) {
  const t = post.translations?.[0] || {};
  return {
    id: post.id,
    slug: post.slug,
    featuredImage: post.featuredImage,
    isFeatured: post.isFeatured,
    publishedAt: post.publishedAt,
    title: t.title || '',
    excerpt: t.excerpt || '',
    author: post.author ? {
      name: lang === 'ar' ? (post.author.nameAr || post.author.name) : post.author.name,
      avatar: post.author.avatar,
    } : null,
    category: post.category ? {
      slug: post.category.slug,
      name: post.category.translations?.[0]?.name || post.category.slug,
      color: post.category.color,
    } : null,
    tags: (post.tags || []).map(pt => ({
      slug: pt.tag.slug,
      name: pt.tag.translations?.[0]?.name || pt.tag.slug,
    })),
  };
}

export default async function Home({ params }) {
  const { locale } = await params;

  if (!allLocaleCodes.includes(locale)) notFound();

  const [language, countryCode] = locale.split('-');
  const country = countryCode || 'SA';
  const currentWeek = getCurrentWeekIdentifier();
  const isArabic = language === 'ar';

  const pageH1 = isArabic
    ? 'كوبونات وأكواد خصم السعودية'
    : 'Verified Saudi Arabia Coupon Codes & Deals';

  const pageSubtitle = isArabic
    ? 'وفر أكثر مع كوبونات فعالة ومجربة من أشهر المتاجر العالمية والمحلية'
    : 'Save more with verified, tested coupons from top local and international stores';

  // ── Fetch all data in one parallel batch ──────────────────────────────
  const [
    featuredStoresWithCovers,
    allActiveBrands,
    leaderboardSnapshots,
    rawTopStores,
    curatedSlides,        // ✅ New: pre‑fetch HeroCuratedSection data
    offerStacks,          // ✅ New: pre‑fetch OfferStacksSection data
    blogPostsRaw,         // ✅ New: pre‑fetch HomepageBlogSection data
  ] = await Promise.all([
    // 1. Hero stores (color slots 1–5)
    prisma.store.findMany({
      where: {
        isActive: true,
        color: { in: ['1', '2', '3', '4', '5'] },
        coverImage: { not: null },
        countries: { some: { country: { code: country } } },
      },
      select: {
        id: true,
        logo: true,
        bigLogo: true,
        coverImage: true,
        color: true,
        translations: {
          where: { locale: language },
          select: { name: true, slug: true, showOffer: true, seoTitle: true, description: true },
        },
      },
      orderBy: { color: 'asc' },
      take: 5,
    }),

    // 2. Brands carousel
    prisma.store.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: country } } },
      },
      include: {
        translations: {
          where: { locale: language },
          select: { name: true, slug: true },
        },
        _count: {
          select: { vouchers: { where: { expiryDate: { gte: new Date() } } } },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
      take: 20,
    }),

    // 3. Leaderboard (unused in UI, kept for potential future use)
    prisma.storeSavingsSnapshot.findMany({
      where: { weekIdentifier: currentWeek, categoryId: null },
      orderBy: { rank: 'asc' },
      take: 10,
      select: {
        id: true,
        rank: true,
        previousRank: true,
        movement: true,
        calculatedMaxSavingsPercent: true,
        savingsOverridePercent: true,
        store: {
          select: {
            id: true,
            logo: true,
            bigLogo: true,
            translations: {
              where: { locale: language },
              select: { name: true, slug: true },
            },
          },
        },
      },
    }),

    // 4. Featured stores for carousel
    prisma.store.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: country } } },
      },
      select: {
        id: true,
        logo: true,
        bigLogo: true,
        translations: {
          where: { locale: language },
          select: { name: true, slug: true, showOffer: true },
        },
        vouchers: {
          where: {
            OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
            discountPercent: { not: null },
          },
          orderBy: { discountPercent: 'desc' },
          take: 1,
          select: { discountPercent: true },
        },
        _count: {
          select: {
            vouchers: {
              where: {
                OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
      take: 27,
    }),

    // 5. ✅ HeroCuratedSection slides
    getCuratedSlides(language, country),

    // 6. ✅ OfferStacksSection stacks
    buildOfferStacks({
      countryCode: country,
      language: language,
      limit: 10,
    }),

    // 7. ✅ HomepageBlogSection posts
    getFeaturedBlogPosts(language, 3),
  ]);

  // ── Transform data ──────────────────────────────────────────────────────

  // Transform featured stores for carousel
  const topStores = rawTopStores.map(store => {
    const translation = store.translations?.[0] || {};
    const topDiscount = store.vouchers?.[0]?.discountPercent;
    const discountText = translation.showOffer
      || (topDiscount
          ? (isArabic ? `خصم يصل إلى ${Math.round(topDiscount)}%` : `Up to ${Math.round(topDiscount)}% off`)
          : (isArabic ? 'عروض متاحة' : 'Deals available'));

    return {
      id: store.id,
      name: translation.name || '',
      slug: translation.slug || '',
      logo: store.logo,
      bigLogo: store.bigLogo,
      discount: discountText,
      showOffer: discountText,
      showOfferType: 'OFFER',
      translations: [{
        locale: language,
        name: translation.name || '',
        slug: translation.slug || '',
        showOffer: discountText,
      }],
      _count: store._count,
      vouchers: store.vouchers,
    };
  });

  const carouselTitle = isArabic ? 'متاجر مميزة' : 'Featured Stores with Discounts';

  // Transform blog posts
  const blogPosts = blogPostsRaw.map(p => transformBlogPost(p, language));

  // ── Structured data ────────────────────────────────────────────────────
  const homepageSchema = topStores.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageH1,
    description: pageSubtitle,
    numberOfItems: topStores.length,
    itemListElement: topStores.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      url: `${BASE_URL}/${locale}/stores/${s.slug}`,
    })),
  } : null;

  return (
    <>
      {homepageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
        />
      )}

      <main className="homepage-wrapper" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="homepage-hero-heading" aria-label="page heading">
          <h1 className="homepage-h1">{pageH1}</h1>
          <p className="homepage-h1-sub">{pageSubtitle}</p>
        </div>

        {/* ✅ Pass pre‑fetched slides to HeroCuratedSection */}
        <HeroCuratedSection slides={curatedSlides} locale={locale} />

        <FeaturedStoresCarousel
          title={carouselTitle}
          stores={topStores}
          locale={locale}
        />

        {/* ✅ Pass pre‑fetched stacks to OfferStacksSection */}
        <OfferStacksSection stacks={offerStacks} locale={locale} />

        <HomeFeaturedProductsSection locale={locale} countryCode={country} />
        <HowItWorks locale={locale} />

        {/* ✅ Pass pre‑fetched blog posts to HomepageBlogSection */}
        <HomepageBlogSection posts={blogPosts} locale={locale} />

        <PromoCodesFAQ includeStructuredData={true} />
        <HelpBox locale={locale} />
      </main>
    </>
  );
}
