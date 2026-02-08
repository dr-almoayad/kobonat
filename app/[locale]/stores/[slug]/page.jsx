// app/[locale]/stores/[slug]/page.jsx - FIXED SEO
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import StoreHeader from "@/components/headers/StoreHeader";
import StickyStoreHeader from "@/components/headers/StickyStoreHeader";
import StorePageShell from "@/components/headers/StorePageShell";
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import StoreFAQ from "@/components/StoreFAQ/StoreFAQ";
import StoreCard from "@/components/StoreCard/StoreCard";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel/FeaturedProductsCarousel";
import OtherPromosSection from "@/components/OtherPromosSection/OtherPromosSection";
// ✅ CHANGED: Import the new Structured Data component
import FAQStructuredData from "@/components/StructuredData/FAQStructuredData"; 
import { getCategoryData, getCountryCategories } from "@/lib/storeCategories";
import { getStoresData, getStoreData } from "@/lib/stores";
import HelpBox from "@/components/help/HelpBox";
import "./store-page.css";
import "./stores-page.css";

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://coubonat.vercel.app';

export async function generateMetadata({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    const isArabic = language === 'ar';

    // Try as category first
    const category = await getCategoryData(slug, language, countryCode);
    if (category) {
      const categoryName = category.translations[0]?.name || 'Category';
      
      return {
        title: isArabic 
          ? `كوبونات ${categoryName} - عروض ${countryCode}`
          : `${categoryName} Coupons - ${countryCode} Deals`,
        description: category.translations[0]?.description || 
          (isArabic 
            ? `أفضل كوبونات ${categoryName} في ${countryCode}`
            : `Best ${categoryName} coupons in ${countryCode}`),
        
        alternates: {
          canonical: `${BASE_URL}/${locale}/stores/${slug}`,
          languages: {
            'ar-SA': `${BASE_URL}/ar-SA/stores/${slug}`,
            'en-SA': `${BASE_URL}/en-SA/stores/${slug}`,
            'ar-AE': `${BASE_URL}/ar-AE/stores/${slug}`,
            'en-AE': `${BASE_URL}/en-AE/stores/${slug}`,
            'x-default': `${BASE_URL}/ar-SA/stores/${slug}`,
          }
        },
        
        openGraph: {
          url: `${BASE_URL}/${locale}/stores/${slug}`,
          locale: locale,
        },
        
        robots: {
          index: true,
          follow: true,
        },
      };
    }

    // Try as store
    const store = await getStoreData(slug, language, countryCode);
    if (store) {
      const storeName = store.translations[0]?.name || store.slug;
      
      return {
        title: isArabic 
          ? `كوبونات ${storeName} - خصومات حصرية`
          : `${storeName} Coupons & Deals - Save Money`,
        description: store.translations[0]?.description || 
          (isArabic
            ? `احصل على أفضل الكوبونات من ${storeName}`
            : `Get the best deals from ${storeName}`),
        
        alternates: {
          canonical: `${BASE_URL}/${locale}/stores/${slug}`,
          languages: {
            'ar-SA': `${BASE_URL}/ar-SA/stores/${slug}`,
            'en-SA': `${BASE_URL}/en-SA/stores/${slug}`,
            'ar-AE': `${BASE_URL}/ar-AE/stores/${slug}`,
            'en-AE': `${BASE_URL}/en-AE/stores/${slug}`,
            'x-default': `${BASE_URL}/ar-SA/stores/${slug}`,
          }
        },
        
        openGraph: {
          url: `${BASE_URL}/${locale}/stores/${slug}`,
          locale: locale,
          images: store.logo ? [{ url: store.logo }] : [],
        },
        
        robots: {
          index: true,
          follow: true,
        },
      };
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
      const allCategories = await getCountryCategories(language, countryCode);
      
      const translation = categoryData.translations[0];
      const totalVouchers = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);

      return (
        <div className="stores_page">
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
          {/* ✅ CHANGED: Use the new component */}
          <FAQStructuredData faqs={faqs} locale={locale} />
          <div className="store-page-layout">
            <StorePageShell {...headerProps} />

            <main className="store-main-content">
              {transformedProducts.length > 0 && (
                <FeaturedProductsCarousel
                  storeSlug={transformedStore.slug}
                  storeName={transformedStore.name}
                  storeLogo={transformedStore.logo}
                  products={transformedProducts}
                />
              )}
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
                storeSlug={store.slug}
                storeName={store.name}
              />

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
