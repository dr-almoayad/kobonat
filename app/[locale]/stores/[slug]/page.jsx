// app/[locale]/stores/[slug]/page.jsx - FIXED UNIFIED ROUTE
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import StoresGrid from "@/components/StoresGrid/StoresGrid";
import CategoryFilterTabs from "@/components/CategoryFilterTabs/CategoryFilterTabs";
import StoreHeader from "@/components/headers/StoreHeader";
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import StoreFAQ from "@/components/StoreFAQ/StoreFAQ";
import StoreCard from "@/components/StoreCard/StoreCard";
import { FAQSchema } from "@/lib/seo/faqSchema";
import { getCategoryData, getCategorySEO, getCountryCategories } from "@/lib/storeCategories";
import { getStoresData, getStoreData } from "@/lib/stores";
import "./store-page.css";
import "./stores-page.css";

export const revalidate = 300;

/**
 * GENERATE METADATA - Determines if category or store
 */
export async function generateMetadata({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');

    console.log('🔍 Metadata generation:', { slug, locale, language, countryCode });

    // Try as category first
    const category = await getCategoryData(slug, language, countryCode);
    if (category) {
      console.log('✅ Found as category:', category.translations[0]?.name);
      return getCategorySEO(category, locale, countryCode);
    }

    // Try as store
    const store = await getStoreData(slug, language, countryCode);
    if (store) {
      console.log('✅ Found as store:', store.translations[0]?.name);
      const storeName = store.translations[0]?.name || store.slug;
      const isArabic = locale.startsWith('ar');
      
      return {
        title: isArabic 
          ? `كوبونات ${storeName} - خصومات حصرية`
          : `${storeName} Coupons & Deals - Save Money`,
        description: store.translations[0]?.description || `Get the best deals from ${storeName}`,
        alternates: {
          canonical: `/${locale}/stores/${slug}`
        }
      };
    }

    console.log('❌ Not found as category or store');
    return { title: "Not Found" };
  } catch (error) {
    console.error('❌ Metadata generation error:', error);
    return { title: "Error" };
  }
}

/**
 * PAGE COMPONENT - Renders category page OR store page
 */
export default async function UnifiedStorePage({ params }) {
  try {
    const { slug, locale } = await params;
    const [language, countryCode] = locale.split('-');
    
    console.log('📄 Page render:', { slug, locale, language, countryCode });
    
    const t = await getTranslations('StoresPage');
    const tStore = await getTranslations('StorePage');

    // ========================================
    // 1. TRY AS CATEGORY FIRST
    // ========================================
    const categoryData = await getCategoryData(slug, language, countryCode);

    if (categoryData) {
      console.log('✅ Rendering as CATEGORY page');
      
      // Fetch stores in this category
      const stores = await getStoresData({ 
        language, 
        countryCode, 
        categoryId: categoryData.id 
      });

      const featuredStores = stores.filter(s => s.isFeatured);
      const regularStores = stores.filter(s => !s.isFeatured);

      // Fetch all categories for filter tabs
      const allCategories = await getCountryCategories(language, countryCode);
      
      const translation = categoryData.translations[0];
      const totalVouchers = stores.reduce((sum, s) => sum + s.activeVouchersCount, 0);

      return (
        <div className="stores_page">
          {/* Category Header */}
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

              {/* Category Filter Tabs */}
              <CategoryFilterTabs 
                categories={allCategories}
                currentCategory={slug}
                locale={locale}
              />
            </div>
          </div>

          {/* Stores Grid */}
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
        </div>
      );
    }

    // ========================================
    // 2. TRY AS STORE
    // ========================================
    const store = await getStoreData(slug, language, countryCode);

    if (store) {
      console.log('✅ Rendering as STORE page');
      
      // Get country
      const country = await prisma.country.findUnique({
        where: { code: countryCode, isActive: true },
        include: {
          translations: {
            where: { locale: language }
          }
        }
      });

      if (!country) {
        console.log('❌ Country not found');
        return notFound();
      }

      // Transform store data
      const storeTranslation = store.translations[0];
      const transformedStore = {
        ...store,
        name: storeTranslation?.name || slug,
        slug: storeTranslation?.slug || slug,
        description: storeTranslation?.description || null,
        categories: store.categories.map(sc => ({
          id: sc.category.id,
          name: sc.category.translations[0]?.name || '',
          slug: sc.category.translations[0]?.slug || '',
          icon: sc.category.icon,
          color: sc.category.color
        }))
      };

      // Fetch vouchers
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

      // Fetch payment methods
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

      // Get most tracked voucher
      const mostTrackedVoucher = transformedVouchers[0] || null;

      // Fetch FAQs
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

      // Fetch related stores
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

      // Separate vouchers by type
      const codeVouchers = transformedVouchers.filter(v => v.type === 'CODE');
      const dealVouchers = transformedVouchers.filter(v => v.type === 'DEAL');
      const shippingVouchers = transformedVouchers.filter(v => v.type === 'FREE_SHIPPING');

      const countryName = country.translations[0]?.name || country.code;

      return (
        <>
          <FAQSchema faqs={faqs} locale={locale} />
          <div className="store-page-layout">
            <StoreHeader 
              store={transformedStore}
              mostTrackedVoucher={mostTrackedVoucher}
              paymentMethods={otherPaymentMethods}
              bnplMethods={bnplMethods}
              locale={locale}
              country={country}
            />

            <main className="store-main-content">
              {transformedVouchers.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="no-vouchers-state">
                  <span className="material-symbols-sharp">sentiment_dissatisfied</span>
                  <h3>{tStore('noActiveVouchers')}</h3>
                  <p>{tStore('checkBackSoon')}</p>
                  {transformedStore.websiteUrl && (
                    <a 
                      href={transformedStore.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="visit-store-anyway-btn"
                    >
                      <span className="material-symbols-sharp">open_in_new</span>
                      {tStore('visitStoreAnyway')}
                    </a>
                  )}
                </div>
              )}
            </main>
          </div>
        </>
      );
    }

    // ========================================
    // 3. NOT FOUND
    // ========================================
    console.log('❌ Slug not found as category or store');
    notFound();
    
  } catch (error) {
    console.error('❌ Page render error:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to show Next.js error page
  }
}