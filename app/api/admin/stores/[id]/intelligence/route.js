// app/api/admin/stores/[id]/intelligence/route.js
// GET — full intelligence data for the admin editor
// Returns store logistics + latest metrics + upcoming events + peak seasons + last 3 snapshots

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const id = Number(params.id);

  const store = await prisma.store.findUnique({
    where: { id },
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
        where:   { categoryId: null }, // global only
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

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  return NextResponse.json(store);
}
