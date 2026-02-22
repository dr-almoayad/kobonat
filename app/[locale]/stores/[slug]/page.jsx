// app/[locale]/stores/[slug]/page.jsx - FULLY SEO OPTIMIZED WITH FAQ
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import StorePageShell from "@/components/headers/StorePageShell";
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import StoreFAQ from "@/components/StoreFAQ/StoreFAQ";
import StoreCard from "@/components/StoreCard/StoreCard";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel/FeaturedProductsCarousel";
import OtherPromosSection from "@/components/OtherPromosSection/OtherPromosSection";
import FAQStructuredData from "@/components/StructuredData/FAQStructuredData";
import StoreStructuredData from "@/components/StructuredData/StoreStructuredData";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import PromoCodesFAQ from "@/components/PromoCodesFAQ/PromoCodesFAQ";
import { getCategoryData, getCountryCategories } from "@/lib/storeCategories";
import { getStoresData, getStoreData } from "@/lib/stores";
import { generateEnhancedStoreMetadata, generateEnhancedCategoryMetadata } from "@/lib/seo/generateStoreMetadata";
import HelpBox from "@/components/help/HelpBox";
import "./store-page.css";
import "./stores-page.css";

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function generateMetadata({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');

    const isArabic = language === 'ar';

    // Get country data
    const country = await prisma.country.findUnique({
      where: { code: countryCode, isActive: true },
      include: { translations: { where: { locale: language } } }
    });

    // Try as category first
    const category = await getCategoryData(slug, language, countryCode);
    if (category) {
      const categoryTranslation = category.translations[0];
      
      // Check if custom SEO fields exist - PRIORITIZE CUSTOM SEO
      if (categoryTranslation?.seoTitle || categoryTranslation?.seoDescription) {
        const categoryName = categoryTranslation?.name || 'Category';
        
        return {
          icons: {
            icon: `${BASE_URL}/favicon.ico`,
            apple: `${BASE_URL}/apple-touch-icon.png`,
          },
          siteName: isArabic ? 'كوبونات' : 'Cobonat',
          title: categoryTranslation.seoTitle || categoryName,
          description: categoryTranslation.seoDescription || categoryTranslation?.description || '',
          openGraph: {
            siteName: isArabic ? 'كوبونات' : 'Cobonat',
            title: categoryTranslation.seoTitle || categoryName,
            description: categoryTranslation.seoDescription || categoryTranslation?.description || '',
            type: 'website',
            locale: locale,
            url: `${BASE_URL}/${locale}/stores/${slug}`,
            images: [
              {
                url: `${BASE_URL}/logo-512x512.png`,
                width: 512,
                height: 512,
                alt: 'Cobonat Logo',
              }
            ], 
          },
          twitter: {
            card: 'summary_large_image',
            title: categoryTranslation.seoTitle || categoryName,
            description: categoryTranslation.seoDescription || categoryTranslation?.description || '',
            images: category.image ? [category.image] : [],
          },
          alternates: {
            canonical: `${BASE_URL}/${locale}/stores/${slug}`,
          }
        };
      }
      
      // Fallback to generated metadata if no custom SEO
      const stores = await getStoresData({ 
        language, 
        countryCode, 
        categoryId: category.id 
      });
      
      const voucherCount = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);
      
      return generateEnhancedCategoryMetadata({
        category: {
          ...category,
          name: categoryTranslation?.name || 'Category',
          description: categoryTranslation?.description || '',
          slug
        },
        locale,
        storeCount: stores.length,
        voucherCount,
        country: country ? {
          name: country.translations[0]?.name || country.code
        } : null
      });
    }

    // Try as store
    const store = await getStoreData(slug, language, countryCode);
    if (store) {
      const storeTranslation = store.translations[0];
      
      // Check if custom SEO fields exist - PRIORITIZE CUSTOM SEO
      if (storeTranslation?.seoTitle || storeTranslation?.seoDescription) {
        const storeName = storeTranslation?.name || slug;
        
        return {
          icons: {
            icon: `${BASE_URL}/favicon.ico`,
            apple: `${BASE_URL}/apple-touch-icon.png`,
          },
          siteName: isArabic ? 'كوبونات' : 'Cobonat',
          title: storeTranslation.seoTitle || storeName,
          description: storeTranslation.seoDescription || storeTranslation?.description || `Find the best coupons and deals for ${storeName}`,
          openGraph: {
            siteName: isArabic ? 'كوبونات' : 'Cobonat',
            title: storeTranslation.seoTitle || storeName,
            description: storeTranslation.seoDescription || storeTranslation?.description || '',
            type: 'website',
            locale: locale,
            url: `${BASE_URL}/${locale}/stores/${slug}`,
            images: [
              ...(store.coverImage ? [{
                url: store.coverImage,
                width: 1200,
                height: 630,
                alt: storeName,
              }] : []),
              ...(store.logo ? [{
                url: store.logo,
                width: 800,
                height: 600,
                alt: `${storeName} logo`,
              }] : []),
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title: storeTranslation.seoTitle || storeName,
            description: storeTranslation.seoDescription || storeTranslation?.description || '',
            images: store.coverImage ? [store.coverImage] : (store.logo ? [store.logo] : []),
          },
          alternates: {
            canonical: `${BASE_URL}/${locale}/stores/${slug}`,
          }
        };
      }

      // Fallback to generated metadata if no custom SEO
      const voucherCount = await prisma.voucher.count({
        where: {
          storeId: store.id,
          AND: [
            {
              OR: [
                { expiryDate: null },
                { expiryDate: { gte: new Date() } }
              ]
            },
            {
              countries: {
                some: { country: { code: countryCode } }
              }
            }
          ]
        }
      });

      return generateEnhancedStoreMetadata({
        store: {
          ...store,
          name: storeTranslation?.name || slug,
          description: storeTranslation?.description || '',
          slug
        },
        locale,
        voucherCount,
        categories: store.categories.map(sc => ({
          name: sc.category.translations[0]?.name || ''
        })),
        country: country ? {
          name: country.translations[0]?.name || country.code
        } : null
      });
    }

    return { title: "Not Found" };
  } catch (error) {
    console.error('Metadata generation error:', error);
    return { title: "Error" };
  }
}

export default async function UnifiedStorePage({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    
    const t = await getTranslations('StoresPage');
    const tStore = await getTranslations('StorePage');

    // Try as category first
    const categoryData = await getCategoryData(slug, language, countryCode);

    if (categoryData) {
      const stores = await getStoresData({ 
        language, 
        countryCode, 
        categoryId: categoryData.id 
      });

      const featuredStoresWithCovers = stores.filter(s => 
        s.isFeatured && s.coverImage
      ).slice(0, 6);

      const carouselStores = featuredStoresWithCovers.map(store => ({
        id: store.id,
        image: store.coverImage,
        name: store.name,
        logo: store.logo,
      }));

      const featuredStores = stores.filter(s => s.isFeatured);
      const regularStores = stores.filter(s => !s.isFeatured);
      const translation = categoryData.translations[0];
      const totalVouchers = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);

      // Build breadcrumbs
      const breadcrumbs = [
        {
          name: language === 'ar' ? 'الرئيسية' : 'Home',
          url: `${BASE_URL}/${locale}`
        },
        {
          name: language === 'ar' ? 'المتاجر' : 'Stores',
          url: `${BASE_URL}/${locale}/stores`
        },
        {
          name: translation?.name || 'Category',
          url: `${BASE_URL}/${locale}/stores/${slug}`
        }
      ];

      return (
        <div className="stores_page">
          <Breadcrumbs items={breadcrumbs} locale={locale} />

          {carouselStores.length > 0 && (
            <div className="category-hero-section">
              <HeroCarousel 
                images={carouselStores}
                locale={locale}
                height="320px"
                autoplayDelay={3500}
              />
            </div>
          )}

          <div className="stores_page_header">
            <div className="stores_page_header_container">
              <div className="stores_page_title_section">
                <div className="stores_page_icon">
                  <span className="material-symbols-sharp">
                    {categoryData.icon || 'category'}
                  </span>
                </div>
                <div className="stores_info">
                  <h1>{translation?.name || 'Category'}</h1>
                  {translation?.description && (
                    <p className="category_description">{translation.description}</p>
                  )}
                  <p className="stores_stats">
                    <span className="stat_item">
                      <span className="material-symbols-sharp">store</span>
                      <strong>{stores.length}</strong>
                      {t('storesCount', { count: stores.length })}
                    </span>
                    <span className="stat_separator">•</span>
                    <span className="stat_item">
                      <span className="material-symbols-sharp">local_offer</span>
                      <strong>{totalVouchers}</strong>
                      {t('vouchersCount', { count: totalVouchers })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <main>
            {featuredStores.length > 0 && (
              <section className="featured_stores_section">
                <div className="section_header">
                  <h2>
                    <span className="material-symbols-sharp">star</span>
                    {t('featuredStores')}
                  </h2>
                  <span className="section_count">
                    {t('count', { count: featuredStores.length })}
                  </span>
                </div>
                <StoresGrid stores={featuredStores} locale={locale} />
              </section>
            )}

            <section className="all_stores_section">
              <div className="section_header">
                <h2>
                  {featuredStores.length > 0 ? t('otherStores') : t('allStores')}
                </h2>
                <span className="section_count">
                  {t('count', { count: regularStores.length })}
                </span>
              </div>
              <StoresGrid 
                stores={featuredStores.length > 0 ? regularStores : stores} 
                locale={locale} 
              />
            </section>

            {/* Promo Codes FAQ - Category Pages */}
            <section className="promo-faq-section">
              <PromoCodesFAQ />
            </section>
          </main>
          
          <HelpBox locale={locale}/>
        </div>
      );
    }

    // Try as store
    const store = await getStoreData(slug, language, countryCode);

    if (store) {
      const country = await prisma.country.findUnique({
        where: { code: countryCode, isActive: true },
        include: {
          translations: {
            where: { locale: language }
          }
        }
      });

      if (!country) return notFound();

      const storeTranslation = store.translations[0];
      const transformedStore = {
        ...store,
        name: storeTranslation?.name || slug,
        slug: storeTranslation?.slug || slug,
        description: storeTranslation?.description || null,
        coverImage: store.coverImage,
        categories: store.categories.map(sc => ({
          id: sc.category.id,
          name: sc.category.translations[0]?.name || '',
          slug: sc.category.translations[0]?.slug || '',
          icon: sc.category.icon,
          color: sc.category.color
        }))
      };

      const vouchers = await prisma.voucher.findMany({
        where: {
          storeId: store.id,
          AND: [
            {
              OR: [
                { expiryDate: null },
                { expiryDate: { gte: new Date() } }
              ]
            },
            {
              countries: {
                some: { country: { code: countryCode } }
              }
            }
          ]
        },
        include: {
          translations: { where: { locale: language } },
          _count: { select: { clicks: true } }
        },
        orderBy: [
          { isExclusive: 'desc' },
          { isVerified: 'desc' },
          { popularityScore: 'desc' }
        ]
      });

      const transformedVouchers = vouchers.map(v => ({
        ...v,
        title: v.translations[0]?.title || '',
        description: v.translations[0]?.description || null,
        store: transformedStore
      }));

      const paymentMethodsData = await prisma.storePaymentMethod.findMany({
        where: {
          storeId: store.id,
          countryId: country.id
        },
        include: {
          paymentMethod: {
            include: {
              translations: { where: { locale: language } }
            }
          }
        }
      });

      const allPaymentMethods = paymentMethodsData.map(spm => ({
        ...spm.paymentMethod,
        name: spm.paymentMethod.translations[0]?.name || '',
        description: spm.paymentMethod.translations[0]?.description || null
      }));

      const bnplMethods = allPaymentMethods.filter(pm => pm.isBnpl);
      const otherPaymentMethods = allPaymentMethods.filter(pm => !pm.isBnpl);
      const mostTrackedVoucher = transformedVouchers[0] || null;

      const faqs = await prisma.storeFAQ.findMany({
        where: {
          storeId: store.id,
          countryId: country.id,
          isActive: true
        },
        include: {
          translations: { where: { locale: language } }
        },
        orderBy: { order: 'asc' }
      });

      const relatedStores = await prisma.store.findMany({
        where: {
          id: { not: store.id },
          isActive: true,
          countries: {
            some: { country: { code: countryCode } }
          },
          categories: {
            some: {
              categoryId: { in: store.categories.map(sc => sc.categoryId) }
            }
          }
        },
        include: {
          translations: { where: { locale: language } },
          _count: {
            select: {
              vouchers: { where: { expiryDate: { gte: new Date() } } }
            }
          }
        },
        take: 6,
        orderBy: { isFeatured: 'desc' }
      });

      const transformedRelatedStores = relatedStores.map(s => ({
        ...s,
        name: s.translations[0]?.name || '',
        slug: s.translations[0]?.slug || ''
      }));

      const storeProducts = await prisma.storeProduct.findMany({
        where: {
          storeId: store.id,
          isFeatured: true
        },
        select: {
          id: true,
          image: true,
          productUrl: true,
          discountValue: true,
          discountType: true,
          translations: {
            where: { locale: language },
            select: {
              title: true
            }
          }
        },
        orderBy: { order: 'asc' },
        take: 12
      });

      const transformedProducts = storeProducts.map(p => ({
        id: p.id,
        image: p.image,
        title: p.translations[0]?.title || '',
        price: p.price,
        originalPrice: p.originalPrice,
        productUrl: p.productUrl,
        discountValue: p.discountValue,
        discountType: p.discountType
      }));

      const codeVouchers = transformedVouchers.filter(v => v.type === 'CODE');
      const dealVouchers = transformedVouchers.filter(v => v.type === 'DEAL');
      const shippingVouchers = transformedVouchers.filter(v => v.type === 'FREE_SHIPPING');
      const countryName = country.translations[0]?.name || country.code;

      // Build breadcrumbs for store page
      const breadcrumbs = [
        {
          name: language === 'ar' ? 'الرئيسية' : 'Home',
          url: `${BASE_URL}/${locale}`
        },
        {
          name: language === 'ar' ? 'المتاجر' : 'Stores',
          url: `${BASE_URL}/${locale}/stores`
        },
        {
          name: transformedStore.name,
          url: `${BASE_URL}/${locale}/stores/${slug}`
        }
      ];

      const headerProps = {
        store: transformedStore,
        mostTrackedVoucher,
        paymentMethods: otherPaymentMethods,
        bnplMethods,
        locale,
        country,
      };

      return (
        <>
          {/* Comprehensive Structured Data */}
          <StoreStructuredData 
            store={transformedStore}
            vouchers={transformedVouchers}
            locale={locale}
            country={country}
            breadcrumbs={breadcrumbs}
          />
          <FAQStructuredData faqs={faqs} locale={locale} />
          
          <div className="store-page-layout">
            <Breadcrumbs items={breadcrumbs} locale={locale} />
            <StorePageShell {...headerProps} />

            <main className="store-main-content">
              
              {codeVouchers.length > 0 && (
                <section className="vouchers-section">
                  <h2 className="section-title">
                    <span className="material-symbols-sharp">local_offer</span>
                    {tStore('couponCodes')}
                  </h2>
                  <VouchersGrid vouchers={codeVouchers} hideStoreBranding={true} />
                </section>
              )}

              {dealVouchers.length > 0 && (
                <section className="vouchers-section">
                  <h2 className="section-title">
                    <span className="material-symbols-sharp">shopping_bag</span>
                    {tStore('deals')}
                  </h2>
                  <VouchersGrid vouchers={dealVouchers} hideStoreBranding={true} />
                </section>
              )}

              {shippingVouchers.length > 0 && (
                <section className="vouchers-section">
                  <h2 className="section-title">
                    <span className="material-symbols-sharp">local_shipping</span>
                    {tStore('freeShipping')}
                  </h2>
                  <VouchersGrid vouchers={shippingVouchers} hideStoreBranding={true} />
                </section>
              )}

              <OtherPromosSection 
                storeSlug={transformedStore.slug}
                storeName={transformedStore.name}
              />

              {transformedProducts.length > 0 && (
                <FeaturedProductsCarousel
                  storeSlug={transformedStore.slug}
                  storeName={transformedStore.name}
                  storeLogo={transformedStore.logo}
                  products={transformedProducts}
                />
              )}

              {faqs.length > 0 && (
                <StoreFAQ 
                  faqs={faqs} 
                  locale={locale} 
                  storeName={transformedStore.name}
                  countryName={countryName}
                />
              )}

              {transformedRelatedStores.length > 0 && (
                <section className="related-stores-section">
                  <h2 className="section-title">
                    <span className="material-symbols-sharp">storefront</span>
                    {tStore('similarStores')}
                  </h2>
                  <div className="related-stores-grid">
                    {transformedRelatedStores.map((relatedStore) => (
                      <StoreCard
                        key={relatedStore.id} 
                        store={relatedStore} 
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Promo Codes FAQ - Store Pages */}
              <section className="promo-faq-section">
                <PromoCodesFAQ />
              </section>
            </main>
          </div>
          
          <HelpBox locale={locale}/>
        </>
      );
    }

    notFound();
    
  } catch (error) {
    console.error('Page render error:', error);
    throw error;
  }
}
