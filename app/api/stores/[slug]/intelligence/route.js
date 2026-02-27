// app/api/stores/[slug]/intelligence/route.js
// GET /api/stores/noon/intelligence?locale=ar&countryCode=SA
//
// Single optimized query — fetches all intelligence data in one Prisma call.
// Reads from snapshot tables only. Zero score calculation on request path.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentMonthIdentifier } from '@/lib/intelligence/calculateStoreScore.js';

export const revalidate = 3600; // Cache 1 hour — data changes monthly

export async function GET(request, { params }) {
  const { slug }        = params;
  const { searchParams } = new URL(request.url);
  const locale          = searchParams.get('locale') || 'en';
  const lang            = locale.split('-')[0]; // "ar-SA" → "ar"
  const countryCode     = searchParams.get('countryCode') || 'SA';

  try {
    // ── Single compound query — all intelligence data at once ──────────────
    const store = await prisma.store.findFirst({
      where: {
        translations: { some: { locale: lang, slug } },
        isActive:     true,
      },
      select: {
        id:                      true,
        logo:                    true,
        color:                   true,

        // Logistics fields
        averageDeliveryDaysMin:  true,
        averageDeliveryDaysMax:  true,
        freeShippingThreshold:   true,
        returnWindowDays:        true,
        freeReturns:             true,
        refundProcessingDaysMin: true,
        refundProcessingDaysMax: true,
        offerFrequencyDays:      true,
        lastVerifiedAt:          true,

        // Store translation for this locale
        translations: {
          where:  { locale: lang },
          select: { name: true, slug: true, description: true },
        },

        // Active payment methods for this country
        paymentMethods: {
          where: {
            isActive: true,
            country:  { code: countryCode },
          },
          select: {
            id: true,
            paymentMethod: {
              select: {
                slug: true,
                type: true,
                logo: true,
                isBnpl: true,
                translations: {
                  where:  { locale: lang },
                  select: { name: true },
                },
              },
            },
          },
        },

        // Latest monthly metrics snapshot
        savingsMetrics: {
          orderBy: { monthIdentifier: 'desc' },
          take:    1,
          select: {
            monthIdentifier:            true,
            averageDiscountPercent:     true,
            maxStackableSavingsPercent: true,
            codeSuccessRate:            true,
            totalActiveOffers:          true,
            storeScore:                 true,
            scoreBreakdown:             true,
            updatedAt:                  true,
          },
        },

        // Upcoming events (next 3 months)
        upcomingEvents: {
          where: {
            expectedMonth: { gte: getCurrentMonthIdentifier() },
          },
          orderBy: [{ expectedMonth: 'asc' }, { confidenceLevel: 'desc' }],
          take: 5,
          select: {
            eventName:           true,
            expectedMonth:       true,
            confidenceLevel:     true,
            expectedMaxDiscount: true,
          },
        },

        // Peak seasons
        peakSeasons: {
          select: {
            seasonKey: true,
            nameEn:    true,
            nameAr:    true,
          },
        },

        // Leaderboard rank (global, current week)
        savingsSnapshots: {
          orderBy: { calculatedAt: 'desc' },
          take:    1,
          select: {
            rank:         true,
            movement:     true,
            previousRank: true,
            weekIdentifier: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const t        = store.translations[0] || {};
    const metrics  = store.savingsMetrics[0] || null;
    const snapshot = store.savingsSnapshots[0] || null;

    // ── Shape the response ─────────────────────────────────────────────────
    const response = {
      store: {
        id:          store.id,
        name:        t.name        || '',
        slug:        t.slug        || slug,
        description: t.description || null,
        logo:        store.logo,
        color:       store.color,
      },

      logistics: {
        deliveryRange: store.averageDeliveryDaysMin != null && store.averageDeliveryDaysMax != null
          ? { min: store.averageDeliveryDaysMin, max: store.averageDeliveryDaysMax }
          : null,
        freeShippingThreshold: store.freeShippingThreshold,
        returnWindowDays:      store.returnWindowDays,
        freeReturns:           store.freeReturns,
        refundProcessingRange: store.refundProcessingDaysMin != null
          ? { min: store.refundProcessingDaysMin, max: store.refundProcessingDaysMax }
          : null,
        lastVerifiedAt: store.lastVerifiedAt,
      },

      payments: store.paymentMethods.map((pm) => ({
        slug:   pm.paymentMethod.slug,
        name:   pm.paymentMethod.translations[0]?.name || pm.paymentMethod.slug,
        logo:   pm.paymentMethod.logo,
        type:   pm.paymentMethod.type,
        isBnpl: pm.paymentMethod.isBnpl,
      })),

      savings: metrics ? {
        monthIdentifier:            metrics.monthIdentifier,
        averageDiscountPercent:     metrics.averageDiscountPercent,
        maxStackableSavingsPercent: metrics.maxStackableSavingsPercent,
        codeSuccessRate:            metrics.codeSuccessRate,
        totalActiveOffers:          metrics.totalActiveOffers,
        offerFrequencyDays:         store.offerFrequencyDays,
        updatedAt:                  metrics.updatedAt,
      } : null,

      peakSeasons: store.peakSeasons,
      upcomingEvents: store.upcomingEvents,

      leaderboard: snapshot ? {
        rank:           snapshot.rank,
        previousRank:   snapshot.previousRank,
        movement:       snapshot.movement,
        weekIdentifier: snapshot.weekIdentifier,
      } : null,

      storeScore: metrics ? {
        total:     metrics.storeScore,
        breakdown: metrics.scoreBreakdown ? JSON.parse(metrics.scoreBreakdown) : null,
      } : null,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });

  } catch (error) {
    console.error('[/api/store/intelligence]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
