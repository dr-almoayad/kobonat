// components/StructuredData/CouponsStructuredData.jsx

export default function CouponsStructuredData({ vouchers = [], locale, baseUrl }) {
  const [language] = locale.split('-');
  const isAr  = language === 'ar';
  const pageUrl = `${baseUrl}/${locale}/coupons`;
  
  // ✅ Dynamic Brand Name for Site Name consistency
  const brandName = isAr ? 'كوبونات' : 'Cobonat';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home', item: `${baseUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'كل الكوبونات' : 'All Coupons', item: pageUrl },
    ],
  };

  const webPageSchema = {
    '@context':   'https://schema.org',
    '@type':      'WebPage',
    '@id':        pageUrl,
    url:          pageUrl,
    name:         isAr ? 'كل أكواد خصم وكوبونات السعودية | كوبونات' : 'All Promo Codes in Saudi Arabia | Cobonat',
    isPartOf:     { '@type': 'WebSite', '@id': `${baseUrl}/#website` },
    // ✅ FIX: Use dynamic brandName here
    publisher:    { '@type': 'Organization', '@id': `${baseUrl}/#organization`, name: brandName },
  };

  let itemListSchema = null;
  if (vouchers.length > 0) {
    itemListSchema = {
      '@context': 'https://schema.org',
      '@type':    'ItemList',
      name:       isAr ? 'أحدث الكوبونات والعروض' : 'Latest Coupons & Offers',
      numberOfItems: vouchers.length,
      itemListElement: vouchers.slice(0, 20).map((v, i) => ({
        '@type':   'ListItem',
        position:  i + 1,
        item: {
          '@type':      'Offer',
          '@id':        `${baseUrl}/${locale}/voucher/${v.id}`,
          name:         v.title || (isAr ? 'عرض خاص' : 'Special Offer'),
          // ✅ FIX: Use dynamic brandName here
          offeredBy: {
            '@type': 'Organization',
            '@id':   `${baseUrl}/#organization`,
            name:    brandName,
          },
          seller: {
            '@type': 'Organization',
            name: v.store?.name || 'Store'
          }
        },
      })),
    };
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      {itemListSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />}
    </>
  );
}
