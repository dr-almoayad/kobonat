// app/[locale]/coupons/page.jsx - FIXED FOR MULTI-LANGUAGE
import { prisma } from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import HelpBox from "@/components/help/HelpBox";

import "./coupons-page.css";

export const revalidate = 60; 

const CouponsPage = async ({ params }) => {
  const { locale = 'en-sa' } = await params;
  const t = await getTranslations('CouponsPage');
  const now = new Date();

  // ✅ FIX: Extract language and country code from locale
  const [language, countryCode] = locale.includes('-') 
    ? locale.split('-')
    : [locale, locale.toUpperCase()];
  
  // ✅ FIX: Normalize country code
  const normalizedCountryCode = countryCode?.toUpperCase() || 'SA';

  // ✅ FIX: Fetch vouchers with proper translations and country filtering
  const vouchers = await prisma.voucher.findMany({
    where: {
      // Ensure the store is active
      store: { isActive: true },
      
      // REGION FILTER: Only vouchers linked to this specific country
      countries: {
        some: {
          country: {
            code: normalizedCountryCode
          }
        }
      },

      // EXPIRY FILTER: Only active/future vouchers
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: now } }
      ]
    },
    include: {
      translations: {
        where: { locale: language },
        select: {
          title: true,
          description: true,
        }
      },
      store: {
        include: {
          translations: {
            where: { locale: language },
            select: { 
              name: true, 
              slug: true 
            }
          }
        }
      },
      _count: {
        select: { clicks: true }
      }
    },
    orderBy: [
      { isExclusive: 'desc' },
      { popularityScore: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // ✅ FIX: Transform vouchers to flatten translations
  const transformVoucher = (voucher) => {
    const voucherTranslation = voucher.translations?.[0] || {};
    const storeTranslation = voucher.store?.translations?.[0] || {};
    
    return {
      ...voucher,
      title: voucherTranslation.title || 'Special Offer',
      description: voucherTranslation.description || null,
      store: voucher.store ? {
        ...voucher.store,
        name: storeTranslation.name || '',
        slug: storeTranslation.slug || '',
        translations: undefined
      } : null,
      translations: undefined
    };
  };

  const transformedVouchers = vouchers.map(transformVoucher);

  // Calculate statistics for display
  const activeVouchers = transformedVouchers.length;
  const exclusiveVouchers = transformedVouchers.filter(v => v.isExclusive).length;
  const verifiedVouchers = transformedVouchers.filter(v => v.isVerified).length;

  return (
    <main className="coupons_page">
      <div className="coupons_page_header_container">
        <div className="coupons_page_content">
          
          <div className="coupons_title_section">
            <div className="title_left">
              <h1>{t('pageTitle')}</h1>
              <p className="subtitle">
                {language === 'ar' 
                  ? `${activeVouchers} كوبون نشط متاح في ${normalizedCountryCode}`
                  : `${activeVouchers} active coupons available in ${normalizedCountryCode}`
                }
              </p>
            </div>
            
            {/* Stats Row */}
            <div className="coupons_stats_row">
              <div className="stat_badge">
                <span className="material-symbols-sharp">local_offer</span>
                <div>
                  <span className="stat_number">{activeVouchers}</span>
                  <span className="stat_label">
                    {language === 'ar' ? 'كوبون نشط' : 'Active'}
                  </span>
                </div>
              </div>
              
              {exclusiveVouchers > 0 && (
                <div className="stat_badge exclusive">
                  <span className="material-symbols-sharp">star</span>
                  <div>
                    <span className="stat_number">{exclusiveVouchers}</span>
                    <span className="stat_label">
                      {language === 'ar' ? 'حصري' : 'Exclusive'}
                    </span>
                  </div>
                </div>
              )}
              
              {verifiedVouchers > 0 && (
                <div className="stat_badge verified">
                  <span className="material-symbols-sharp">verified</span>
                  <div>
                    <span className="stat_number">{verifiedVouchers}</span>
                    <span className="stat_label">
                      {language === 'ar' ? 'موثق' : 'Verified'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="coupons_container">
        <VouchersGrid 
          vouchers={transformedVouchers} 
          emptyMessage={
            language === 'ar' 
              ? `لا توجد كوبونات متاحة حالياً في ${normalizedCountryCode}`
              : `No coupons available at the moment in ${normalizedCountryCode}`
          }
        />
      </div>
      <HelpBox/>
    </main>
  );
};

export default CouponsPage;
