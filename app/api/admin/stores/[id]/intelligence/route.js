// app/api/admin/stores/[id]/intelligence/route.js
// GET — full intelligence data for the admin editor
// Returns store logistics + latest metrics + upcoming events + peak seasons + last snapshots

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Next.js 15: params is a Promise — must await ──────────────────────
    const { id } = await params;
    const storeId = Number(id);

    if (!storeId || isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id:                      true,
        logo:                    true,
        averageDeliveryDaysMin:  true,
        averageDeliveryDaysMax:  true,
        freeShippingThreshold:   true,
        returnWindowDays:        true,
        freeReturns:             true,
        refundProcessingDaysMin: true,
        refundProcessingDaysMax: true,
        offerFrequencyDays:      true,
        lastVerifiedAt:          true,
        translations: {
          where:  { locale: 'en' },
          select: { name: true, slug: true },
        },
        savingsMetrics: {
          orderBy: { monthIdentifier: 'desc' },
          take:    6,
          select: {
            monthIdentifier:            true,
            averageDiscountPercent:     true,
            maxStackableSavingsPercent: true,
            offerQualityRatio:          true,
            totalActiveOffers:          true,
            storeScore:                 true,
            scoreBreakdown:             true,
            updatedAt:                  true,
          },
        },
        savingsSnapshots: {
          orderBy: { weekIdentifier: 'desc' },
          take:    4,
          where:   { categoryId: null }, // global rank only
          select: {
            weekIdentifier:              true,
            rank:                        true,
            previousRank:                true,
            movement:                    true,
            calculatedMaxSavingsPercent: true,
            savingsOverridePercent:      true,
            stackingPath:                true,
          },
        },
        upcomingEvents: {
          orderBy: { expectedMonth: 'asc' },
          select: {
            id:                  true,
            eventName:           true,
            expectedMonth:       true,
            confidenceLevel:     true,
            expectedMaxDiscount: true,
            notes:               true,
          },
        },
        peakSeasons: {
          orderBy: { seasonKey: 'asc' },
          select: {
            id:        true,
            seasonKey: true,
            nameEn:    true,
            nameAr:    true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error('[admin/stores/[id]/intelligence GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch intelligence data', details: error.message },
      { status: 500 }
    );
  }
}
