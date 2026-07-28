import { calculateStoreSavings } from '@/lib/leaderboard/calculateStoreSavings';
import { prisma } from '@/lib/prisma';

export async function computeEffectivePrice(offer, methodology) {
  // "offer" here is a StoreProduct row (isComparisonOffer: true)
  const config = {
    maxSavingsCap: methodology.maxSavingsCap,
    referenceBasketSize: offer.currentPrice, // <-- the trick: use THIS product's price as the basket
    methodology,
  };

  const result = await calculateStoreSavings(offer.storeId, config);

  const effectivePrice = offer.currentPrice * (1 - result.calculatedMaxSavingsPercent / 100);

  return {
    storeProductId: offer.id,
    listedPrice: offer.currentPrice,
    effectivePrice: Math.round(effectivePrice * 100) / 100,
    savingsAmount: Math.round((offer.currentPrice - effectivePrice) * 100) / 100,
    savingsPercent: result.calculatedMaxSavingsPercent,
    stackingPath: result.stackingPath, // e.g. "CODE(10.0%) + BANK_OFFER(5.0%)" — reuse existing display logic from StoreOfferStacks
  };
}

export async function getBestEffectiveOffer({ comparisonProductId, comparisonVariantId, countryId }) {
  const offers = await prisma.storeProduct.findMany({
    where: {
      isComparisonOffer: true,
      isInStock: true,
      ...(comparisonVariantId ? { comparisonVariantId } : { comparisonProductId, comparisonVariantId: null }),
      countries: { some: { country: { id: countryId } } },
    },
    include: { store: { include: { translations: true } } },
  });

  const methodology = await prisma.savingsMethodology.findFirst({ where: { isActive: true } });

  const withEffective = await Promise.all(
    offers.map(async (o) => ({ ...o, ...(await computeEffectivePrice(o, methodology)) }))
  );

  return withEffective.sort((a, b) => a.effectivePrice - b.effectivePrice);
}
