// components/StructuredData/CouponsStructuredData.jsx
// Emits three schemas for the /coupons page:
//  1. BreadcrumbList
//  2. WebPage (OfferCatalog)
//  3. ItemList of individual offers (top 20)

export default function CouponsStructuredData({ vouchers = [], locale, baseUrl }) {
  const [language] = locale.split('-');
  const isAr  = language === 'ar';
  const pageUrl = `${baseUrl}/${locale}/coupons`;

  // ── 1. Breadcrumb ──────────────────────────────────────────────────────
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      {
        '@type':  'ListItem',
        position: 1,
        name:     isAr ? 'الرئيسية' : 'Home',
        item:     `${baseUrl}/${locale}`,
      },
      {
        '@type':  'ListItem',
        position: 2,
        name:     isAr ? 'كل الكوبونات' : 'All Coupons',
        item:     pageUrl,
      },
    ],
  };

  // ── 2. WebPage → OfferCatalog ──────────────────────────────────────────
  const webPageSchema = {
    '@context':   'https://schema.org',
    '@type':      'WebPage',
    '@id':        pageUrl,
    url:          pageUrl,
    name:         isAr
      ? 'كل أكواد خصم وكوبونات السعودية | كوبونات'
      : 'All Promo Codes & Coupons in Saudi Arabia | Cobonat',
    description:  isAr
      ? 'تصفح جميع أكواد الخصم والعروض الفعالة المتاحة في السعودية'
      : 'Browse all active promo codes and deals available in Saudi Arabia',
    inLanguage:   language,
    isPartOf:  { '@type': 'WebSite',      '@id': `${baseUrl}/#website` },
    publisher: { '@type': 'Organization', '@id': `${baseUrl}/#organization` },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
    // Link to the offer catalog below
    ...(vouchers.length > 0 && {
      mainEntity: { '@id': `${pageUrl}#offers` },
    }),
  };

  // ── 3. ItemList of offers ──────────────────────────────────────────────
  let itemListSchema = null;
  if (vouchers.length > 0) {
    itemListSchema = {
      '@context': 'https://schema.org',
      '@type':    'ItemList',
      '@id':      `${pageUrl}#offers`,
      url:        pageUrl,
      name:       isAr ? 'كوبونات وعروض السعودية' : 'Saudi Arabia Coupons & Deals',
      description: isAr
        ? `${vouchers.length} كوبون ودیل نشط في السعودية`
        : `${vouchers.length} active coupons and deals in Saudi Arabia`,
      numberOfItems: vouchers.length,
      itemListElement: vouchers.slice(0, 20).map((v, i) => ({
        '@type':   'ListItem',
        position:  i + 1,
        item: {
          '@type':      'Offer',
          '@id':        `${baseUrl}/${locale}/voucher/${v.id}`,
          name:         v.title || (isAr ? 'عرض خاص' : 'Special Offer'),
          description:  v.description || undefined,
          availability: 'https://schema.org/InStock',
          ...(v.expiryDate && {
            validThrough: new Date(v.expiryDate).toISOString(),
          }),
          ...(v.code && { serialNumber: v.code }),
          seller: {
            '@type': 'Organization',
            name:    v.store?.name || 'Store',
            ...(v.store?.slug && {
              url: `${baseUrl}/${locale}/stores/${v.store.slug}`,
            }),
          },
          offeredBy: {
            '@type': 'Organization',
            '@id':   `${baseUrl}/#organization`,
            name:    'Cobonat',
          },
        },
      })),
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
    </>
  );
}
