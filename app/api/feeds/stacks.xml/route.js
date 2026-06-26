// app/api/feeds/stacks.xml/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server'; 

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
  const stacks = await prisma.offerStack.findMany({
    where: {
      isActive: true,
      store: {
        isActive: true,
        countries: { some: { country: { code: 'SA', isActive: true } } },
      },
    },
    include: {
      store: {
        select: {
          logo: true,
          translations: { where: { locale: { in: ['ar', 'en'] } } },
        },
      },
      codeVoucher: {
        select: {
          code: true,
          type: true,
          discountPercent: true,
          translations: { where: { locale: { in: ['ar', 'en'] } } },
        },
      },
      dealVoucher: {
        select: {
          code: true,
          type: true,
          discountPercent: true,
          translations: { where: { locale: { in: ['ar', 'en'] } } },
        },
      },
      promo: {
        select: {
          type: true,
          discountPercent: true,
          translations: { where: { locale: { in: ['ar', 'en'] } } },
        },
      },
    },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<stacks count="${stacks.length}" generatedAt="${new Date().toISOString()}">\n`;

  for (const stack of stacks) {
    const storeAr = stack.store?.translations.find(t => t.locale === 'ar') || {};
    const storeEn = stack.store?.translations.find(t => t.locale === 'en') || {};

    xml += '  <stack>\n';
    xml += `    <id>${stack.id}</id>\n`;
    xml += `    <label>${escapeXml(stack.label)}</label>\n`;

    xml += '    <store>\n';
    xml += `      <id>${stack.store.id}</id>\n`;
    xml += `      <nameAr>${escapeXml(storeAr.name)}</nameAr>\n`;
    xml += `      <nameEn>${escapeXml(storeEn.name)}</nameEn>\n`;
    xml += `      <slugAr>${escapeXml(storeAr.slug)}</slugAr>\n`;
    xml += `      <slugEn>${escapeXml(storeEn.slug)}</slugEn>\n`;
    xml += `      <logo>${escapeXml(stack.store.logo)}</logo>\n`;
    xml += '    </store>\n';

    if (stack.codeVoucher) {
      const cvAr = stack.codeVoucher.translations.find(t => t.locale === 'ar') || {};
      const cvEn = stack.codeVoucher.translations.find(t => t.locale === 'en') || {};
      xml += '    <codeVoucher>\n';
      xml += `      <id>${stack.codeVoucher.id}</id>\n`;
      xml += `      <code>${escapeXml(stack.codeVoucher.code)}</code>\n`;
      xml += `      <type>${stack.codeVoucher.type}</type>\n`;
      xml += `      <discountPercent>${stack.codeVoucher.discountPercent ?? ''}</discountPercent>\n`;
      xml += `      <titleAr>${escapeXml(cvAr.title)}</titleAr>\n`;
      xml += `      <titleEn>${escapeXml(cvEn.title)}</titleEn>\n`;
      xml += '    </codeVoucher>\n';
    }

    if (stack.dealVoucher) {
      const dvAr = stack.dealVoucher.translations.find(t => t.locale === 'ar') || {};
      const dvEn = stack.dealVoucher.translations.find(t => t.locale === 'en') || {};
      xml += '    <dealVoucher>\n';
      xml += `      <id>${stack.dealVoucher.id}</id>\n`;
      xml += `      <code>${escapeXml(stack.dealVoucher.code)}</code>\n`;
      xml += `      <type>${stack.dealVoucher.type}</type>\n`;
      xml += `      <discountPercent>${stack.dealVoucher.discountPercent ?? ''}</discountPercent>\n`;
      xml += `      <titleAr>${escapeXml(dvAr.title)}</titleAr>\n`;
      xml += `      <titleEn>${escapeXml(dvEn.title)}</titleEn>\n`;
      xml += '    </dealVoucher>\n';
    }

    if (stack.promo) {
      const prAr = stack.promo.translations.find(t => t.locale === 'ar') || {};
      const prEn = stack.promo.translations.find(t => t.locale === 'en') || {};
      xml += '    <promo>\n';
      xml += `      <id>${stack.promo.id}</id>\n`;
      xml += `      <type>${stack.promo.type}</type>\n`;
      xml += `      <discountPercent>${stack.promo.discountPercent ?? ''}</discountPercent>\n`;
      xml += `      <titleAr>${escapeXml(prAr.title)}</titleAr>\n`;
      xml += `      <titleEn>${escapeXml(prEn.title)}</titleEn>\n`;
      xml += '    </promo>\n';
    }

    xml += `    <updatedAt>${stack.updatedAt.toISOString()}</updatedAt>\n`;
    xml += '  </stack>\n';
  }

  xml += '</stacks>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
