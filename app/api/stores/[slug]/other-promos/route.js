// app/api/stores/[slug]/other-promos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale      = searchParams.get('locale')  || 'en';
    const countryCode = searchParams.get('country') || 'SA';

    const store = await prisma.store.findFirst({
      where: { translations: { some: { slug, locale } } },
      select: { id: true }
    });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const country = await prisma.country.findUnique({
      where: { code: countryCode },
      select: { id: true }
    });
    if (!country) return NextResponse.json({ error: 'Country not found' }, { status: 404 });

    const promos = await prisma.otherPromo.findMany({
      where: {
        storeId:   store.id,
        countryId: country.id,
        isActive:  true,
        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }]
      },
      include: {
        translations: { where: { locale } },
        // Bank-issued offer (e.g. Al Rajhi cashback on all purchases)
        bank: {
          select: {
            id:   true,
            logo: true,
            slug: true,
            translations: { where: { locale }, select: { name: true } }
          }
        },
        // Specific card eligibility (e.g. Riyad Bank Visa Infinite)
        card: {
          select: {
            id:      true,
            image:   true,
            network: true,
            tier:    true,
            translations: { where: { locale }, select: { name: true } }
          }
        },
        // Payment network or BNPL (Visa, Mastercard, Tabby, Tamara, STC Pay…)
        paymentMethod: {
          select: {
            id:     true,
            slug:   true,
            type:   true,
            isBnpl: true,
            logo:   true,
            translations: { where: { locale }, select: { name: true } }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    const transformedPromos = promos.map(p => ({
      id:          p.id,
      type:        p.type,
      image:       p.image,
      url:         p.url,
      voucherCode: p.voucherCode || null,
      startDate:   p.startDate,
      expiryDate:  p.expiryDate,
      title:       p.translations[0]?.title       || '',
      description: p.translations[0]?.description || '',
      terms:       p.translations[0]?.terms       || '',
      bank: p.bank ? {
        id:   p.bank.id,
        logo: p.bank.logo,
        name: p.bank.translations[0]?.name || p.bank.slug
      } : null,
      card: p.card ? {
        id:      p.card.id,
        image:   p.card.image,
        network: p.card.network,
        tier:    p.card.tier,
        name:    p.card.translations[0]?.name || p.card.network
      } : null,
      paymentMethod: p.paymentMethod ? {
        id:     p.paymentMethod.id,
        slug:   p.paymentMethod.slug,
        type:   p.paymentMethod.type,
        isBnpl: p.paymentMethod.isBnpl,
        logo:   p.paymentMethod.logo,
        name:   p.paymentMethod.translations[0]?.name || p.paymentMethod.slug
      } : null
    }));

    return NextResponse.json({ promos: transformedPromos });

  } catch (error) {
    console.error('Other promos fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch promos' }, { status: 500 });
  }
}
