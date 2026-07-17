// app/api/feeds/store-products.xml/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // ✅ Prevents static generation
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const products = await prisma.storeProduct.findMany({
      where: {
        store: {
          isActive: true,
          countries: { some: { country: { code: 'SA', isActive: true } } },
        },
      },
      include: {
        translations: { where: { locale: { in: ['ar', 'en'] } } },
        store: {
          select: {
            logo: true,
            translations: { where: { locale: { in: ['ar', 'en'] } } },
          },
        },
        linkedVoucher: {
          select: {
            code: true,
            type: true,
            discountPercent: true,
            translations: { where: { locale: { in: ['ar', 'en'] } } },
          },
        },
        linkedPromo: {
          select: {
            type: true,
            discountPercent: true,
            translations: { where: { locale: { in: ['ar', 'en'] } } },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { id: 'asc' }],
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<products count="${products.length}" generatedAt="${new Date().toISOString()}">\n`;

    for (const product of products) {
      const ar = product.translations.find(t => t.locale === 'ar') || {};
      const en = product.translations.find(t => t.locale === 'en') || {};
      const storeAr = product.store?.translations.find(t => t.locale === 'ar') || {};
      const storeEn = product.store?.translations.find(t => t.locale === 'en') || {};

      xml += '  <product>\n';
      xml += `    <id>${product.id}</id>\n`;
      xml += `    <titleAr>${escapeXml(ar.title)}</titleAr>\n`;
      xml += `    <titleEn>${escapeXml(en.title)}</titleEn>\n`;
      xml += `    <descriptionAr>${escapeXml(ar.description)}</descriptionAr>\n`;
      xml += `    <descriptionEn>${escapeXml(en.description)}</descriptionEn>\n`;
      xml += `    <image>${escapeXml(product.image)}</image>\n`;
      xml += `    <originalPrice>${product.originalPrice ?? ''}</originalPrice>\n`;
      xml += `    <currentPrice>${product.currentPrice ?? ''}</currentPrice>\n`;
      xml += `    <discountValue>${product.discountValue ?? ''}</discountValue>\n`;
      xml += `    <discountType>${product.discountType}</discountType>\n`;
      xml += `    <productUrl>${escapeXml(product.productUrl)}</productUrl>\n`;
      xml += `    <isFeatured>${product.isFeatured}</isFeatured>\n`;
      xml += `    <clickCount>${product.clickCount}</clickCount>\n`;

      xml += '    <store>\n';
      xml += `      <id>${product.store.id}</id>\n`;
      xml += `      <nameAr>${escapeXml(storeAr.name)}</nameAr>\n`;
      xml += `      <nameEn>${escapeXml(storeEn.name)}</nameEn>\n`;
      xml += `      <slugAr>${escapeXml(storeAr.slug)}</slugAr>\n`;
      xml += `      <slugEn>${escapeXml(storeEn.slug)}</slugEn>\n`;
      xml += `      <logo>${escapeXml(product.store.logo)}</logo>\n`;
      xml += '    </store>\n';

      if (product.linkedVoucher) {
        const vAr = product.linkedVoucher.translations.find(t => t.locale === 'ar') || {};
        const vEn = product.linkedVoucher.translations.find(t => t.locale === 'en') || {};
        xml += '    <linkedVoucher>\n';
        xml += `      <id>${product.linkedVoucher.id}</id>\n`;
        xml += `      <code>${escapeXml(product.linkedVoucher.code)}</code>\n`;
        xml += `      <type>${product.linkedVoucher.type}</type>\n`;
        xml += `      <discountPercent>${product.linkedVoucher.discountPercent ?? ''}</discountPercent>\n`;
        xml += `      <titleAr>${escapeXml(vAr.title)}</titleAr>\n`;
        xml += `      <titleEn>${escapeXml(vEn.title)}</titleEn>\n`;
        xml += '    </linkedVoucher>\n';
      }

      if (product.linkedPromo) {
        const pAr = product.linkedPromo.translations.find(t => t.locale === 'ar') || {};
        const pEn = product.linkedPromo.translations.find(t => t.locale === 'en') || {};
        xml += '    <linkedPromo>\n';
        xml += `      <id>${product.linkedPromo.id}</id>\n`;
        xml += `      <type>${product.linkedPromo.type}</type>\n`;
        xml += `      <discountPercent>${product.linkedPromo.discountPercent ?? ''}</discountPercent>\n`;
        xml += `      <titleAr>${escapeXml(pAr.title)}</titleAr>\n`;
        xml += `      <titleEn>${escapeXml(pEn.title)}</titleEn>\n`;
        xml += '    </linkedPromo>\n';
      }

      xml += `    <updatedAt>${product.updatedAt.toISOString()}</updatedAt>\n`;
      xml += '  </product>\n';
    }

    xml += '</products>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[GET /api/feeds/store-products.xml]', error);
    const fallbackXml = '<?xml version="1.0" encoding="UTF-8"?>\n<products count="0" error="Failed to generate feed"/>';
    return new NextResponse(fallbackXml, {
      status: 503,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
