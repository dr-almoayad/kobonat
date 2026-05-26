// UPDATED: app/api/stores/[slug]/products/route.js
// Changes vs previous:
//   • Returns originalPrice and currentPrice on each product
//   • Returns installmentMonths from the linked otherPromo (for BNPL display)
//   • Returns bank + paymentMethod objects on the linked promo for logo/name

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    // Find store by slug
    const store = await prisma.store.findFirst({
      where: {
        translations: {
          some: { slug, locale }
        },
        isActive: true
      },
      select: { id: true }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get featured products with price and promo data
    const products = await prisma.storeProduct.findMany({
      where: {
        storeId:   store.id,
        isFeatured: true
      },
      include: {
        translations: {
          where: { locale }
        },
        // Include linked voucher for ribbon / BNPL context
        linkedVoucher: {
          select: {
            id:              true,
            code:            true,
            type:            true,
            discount:        true,
            discountPercent: true,
            landingUrl:      true,
          }
        },
        // Include linked promo — full detail so the card can render logo & BNPL
        linkedPromo: {
          include: {
            translations: { where: { locale } },
            bank: {
              select: {
                id:   true,
                logo: true,
                slug: true,
                translations: { where: { locale }, select: { name: true } }
              }
            },
            paymentMethod: {
              select: {
                id:     true,
                slug:   true,
                type:   true,
                isBnpl: true,
                logo:   true,
                translations: { where: { locale }, select: { name: true } }
              }
            },
            card: {
              select: {
                id:                  true,
                network:             true,
                tier:                true,
                image:               true,
                maxInstallmentMonths: true,
              }
            }
          }
        }
      },
      orderBy: [
        { order:     'asc' },
        { createdAt: 'desc' }
      ],
      take: 12 // Limit to 12 featured products
    });

    // Transform data
    const transformedProducts = products.map(p => {
      const linkedPromo = p.linkedPromo;

      return {
        id:            p.id,
        image:         p.image,
        // ── Prices ──────────────────────────────────────────────────────────
        originalPrice: p.originalPrice,   // NEW — "was" price (struck-through)
        currentPrice:  p.currentPrice,    // NEW — live selling price
        // ── Legacy discount badge (used when no explicit prices) ────────────
        discountValue: p.discountValue,
        discountType:  p.discountType,
        // ── Links ────────────────────────────────────────────────────────────
        productUrl:    p.productUrl,
        clickCount:    p.clickCount,
        // ── Translation ──────────────────────────────────────────────────────
        title:         p.translations[0]?.title       || '',
        description:   p.translations[0]?.description || '',
        // ── Linked voucher (ribbon) ───────────────────────────────────────────
        voucher: p.linkedVoucher ? {
          id:              p.linkedVoucher.id,
          code:            p.linkedVoucher.code,
          type:            p.linkedVoucher.type,
          discount:        p.linkedVoucher.discount,
          discountPercent: p.linkedVoucher.discountPercent,
          landingUrl:      p.linkedVoucher.landingUrl,
        } : null,
        // ── Linked promo (ribbon + BNPL) ──────────────────────────────────────
        otherPromo: linkedPromo ? {
          id:                linkedPromo.id,
          type:              linkedPromo.type,
          image:             linkedPromo.image,
          discountPercent:   linkedPromo.discountPercent,
          // BNPL fields — used by StoreProductCard for the installment line
          installmentMonths: linkedPromo.installmentMonths,
          bank: linkedPromo.bank ? {
            id:   linkedPromo.bank.id,
            logo: linkedPromo.bank.logo,
            name: linkedPromo.bank.translations[0]?.name || linkedPromo.bank.slug,
          } : null,
          paymentMethod: linkedPromo.paymentMethod ? {
            id:     linkedPromo.paymentMethod.id,
            slug:   linkedPromo.paymentMethod.slug,
            type:   linkedPromo.paymentMethod.type,
            isBnpl: linkedPromo.paymentMethod.isBnpl,
            logo:   linkedPromo.paymentMethod.logo,
            name:   linkedPromo.paymentMethod.translations[0]?.name || linkedPromo.paymentMethod.slug,
          } : null,
          card: linkedPromo.card ? {
            id:                  linkedPromo.card.id,
            network:             linkedPromo.card.network,
            tier:                linkedPromo.card.tier,
            image:               linkedPromo.card.image,
            maxInstallmentMonths: linkedPromo.card.maxInstallmentMonths,
          } : null,
        } : null,
      };
    });

    return NextResponse.json({
      products:  transformedProducts,
      total:     products.length
    });

  } catch (error) {
    console.error('Store products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
