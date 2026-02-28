// app/api/admin/stores/[id]/route.js
// GET    — fetch store for the editor page (no intelligence payload; use /intelligence route for that)
// PUT    — update core store fields + translations / countries / categories
// DELETE — hard delete a store

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ─────────────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const store = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        // Core translations (all locales for the editor)
        translations: true,

        // Countries
        countries: {
          include: {
            country: {
              include: {
                translations: { where: { locale } },
              },
            },
          },
        },

        // Categories — orderBy removed (no 'order' field on StoreCategory)
        categories: {
          include: {
            category: {
              include: {
                translations: { where: { locale } },
              },
            },
          },
        },

        // Vouchers (for the vouchers tab)
        vouchers: {
          include: {
            translations: { where: { locale } },
            countries: {
              include: {
                country: {
                  include: { translations: { where: { locale } } },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },

        // FAQs
        faqs: {
          include: {
            translations: { where: { locale } },
            country: {
              include: { translations: { where: { locale } } },
            },
          },
          orderBy: { order: 'asc' },
        },

        // Bank / card promos
        otherPromos: {
          include: {
            translations: { where: { locale } },
            country: {
              include: { translations: { where: { locale } } },
            },
          },
          orderBy: { order: 'asc' },
        },

        // Curated offers
        curatedOffers: {
          include: {
            translations: { where: { locale } },
            countries: {
              include: {
                country: {
                  include: { translations: { where: { locale } } },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },

        // Store products
        products: {
          include: {
            translations: { where: { locale } },
          },
          orderBy: { createdAt: 'desc' },
        },

        // Payment methods
        paymentMethods: {
          include: {
            paymentMethod: {
              include: { translations: { where: { locale } } },
            },
          },
        },

        // NOTE: savingsSnapshots / savingsMetrics / upcomingEvents / peakSeasons
        // are intentionally omitted here — they are heavy and only needed by the
        // Intelligence page, which fetches them via /api/admin/stores/[id]/intelligence
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error('[admin/stores/[id] GET]', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT — update core store fields
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeId = parseInt(id);
    const body = await request.json();

    const {
      logo, bigLogo, color,
      showOffer, showOfferType,
      websiteUrl, affiliateNetwork, trackingUrl,
      isActive, isFeatured,
      translations, countryIds, categoryIds,
    } = body;

    // Update core fields
    await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(logo             !== undefined && { logo }),
        ...(bigLogo          !== undefined && { bigLogo }),
        ...(color            !== undefined && { color }),
        ...(showOffer        !== undefined && { showOffer }),
        ...(showOfferType    !== undefined && { showOfferType }),
        ...(websiteUrl       !== undefined && { websiteUrl }),
        ...(affiliateNetwork !== undefined && { affiliateNetwork }),
        ...(trackingUrl      !== undefined && { trackingUrl }),
        ...(isActive         !== undefined && { isActive }),
        ...(isFeatured       !== undefined && { isFeatured }),
      },
    });

    // Replace translations
    if (Array.isArray(translations)) {
      await prisma.storeTranslation.deleteMany({ where: { storeId } });
      if (translations.length > 0) {
        await prisma.storeTranslation.createMany({
          data: translations.map(t => ({ ...t, storeId })),
        });
      }
    }

    // Replace country associations
    if (Array.isArray(countryIds)) {
      await prisma.storeCountry.deleteMany({ where: { storeId } });
      if (countryIds.length > 0) {
        await prisma.storeCountry.createMany({
          data: countryIds.map(countryId => ({ storeId, countryId })),
        });
      }
    }

    // Replace category associations
    if (Array.isArray(categoryIds)) {
      await prisma.storeCategory.deleteMany({ where: { storeId } });
      if (categoryIds.length > 0) {
        await prisma.storeCategory.createMany({
          data: categoryIds.map(categoryId => ({ storeId, categoryId })),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/stores/[id] PUT]', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.store.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/stores/[id] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
