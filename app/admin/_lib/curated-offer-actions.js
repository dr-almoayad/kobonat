'use server';
// app/admin/_lib/curated-offer-actions.js
// Follows the same 'use server' + revalidatePath pattern as actions.js

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ── Shared field extractor ────────────────────────────────────────────────────
function extractFields(formData, current = null) {
  const offerImage = formData.get('offerImage') || current?.offerImage || '';
  const code       = formData.get('code')       || null;
  const type       = formData.get('type')       || 'DEAL';
  const ctaUrl     = formData.get('ctaUrl')     || current?.ctaUrl || '';
  const order      = parseInt(formData.get('order') || '0');
  const isActive   = formData.has('isActive')
    ? formData.get('isActive') === 'on'
    : (current?.isActive ?? true);
  const isFeatured = formData.has('isFeatured')
    ? formData.get('isFeatured') === 'on'
    : (current?.isFeatured ?? false);
  const startDate  = formData.get('startDate')  ? new Date(formData.get('startDate'))  : null;
  const expiryDate = formData.get('expiryDate') ? new Date(formData.get('expiryDate')) : null;

  return { offerImage, code, type, ctaUrl, order, isActive, isFeatured, startDate, expiryDate };
}

// ── CREATE ────────────────────────────────────────────────────────────────────
export async function createCuratedOffer(formData) {
  try {
    const storeId    = parseInt(formData.get('storeId'));
    const countryIds = formData.getAll('countryIds').map(Number).filter(Boolean);
    const fields     = extractFields(formData);

    if (!storeId)        return { error: 'Store is required' };
    if (!fields.offerImage) return { error: 'Offer image URL is required' };
    if (!fields.ctaUrl)  return { error: 'CTA URL is required' };

    const offer = await prisma.curatedOffer.create({
      data: {
        storeId,
        ...fields,
        translations: {
          create: [
            {
              locale:      'en',
              title:       formData.get('title_en')       || '',
              description: formData.get('description_en') || null,
              ctaText:     formData.get('ctaText_en')     || 'SHOP NOW',
            },
            {
              locale:      'ar',
              title:       formData.get('title_ar')       || '',
              description: formData.get('description_ar') || null,
              ctaText:     formData.get('ctaText_ar')     || 'تسوق الآن',
            }
          ]
        },
        ...(countryIds.length > 0 && {
          countries: {
            create: countryIds.map(countryId => ({ countryId }))
          }
        })
      }
    });

    revalidatePath('/admin/curated-offers');
    revalidatePath(`/admin/stores/${storeId}`);
    return { success: true, id: offer.id };
  } catch (error) {
    console.error('Create curated offer error:', error);
    return { error: error.message };
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
export async function updateCuratedOffer(id, formData) {
  try {
    const offerId    = parseInt(id);
    const countryIds = formData.getAll('countryIds').map(Number).filter(Boolean);

    const current = await prisma.curatedOffer.findUnique({ where: { id: offerId } });
    if (!current) return { error: `Curated offer ${id} not found` };

    const fields = extractFields(formData, current);

    await prisma.curatedOffer.update({
      where: { id: offerId },
      data: fields
    });

    // Upsert translations for both locales
    for (const locale of ['en', 'ar']) {
      await prisma.curatedOfferTranslation.upsert({
        where:  { offerId_locale: { offerId, locale } },
        create: {
          offerId,
          locale,
          title:       formData.get(`title_${locale}`)       || '',
          description: formData.get(`description_${locale}`) || null,
          ctaText:     formData.get(`ctaText_${locale}`)     || (locale === 'ar' ? 'تسوق الآن' : 'SHOP NOW'),
        },
        update: {
          title:       formData.get(`title_${locale}`)       || '',
          description: formData.get(`description_${locale}`) || null,
          ctaText:     formData.get(`ctaText_${locale}`)     || (locale === 'ar' ? 'تسوق الآن' : 'SHOP NOW'),
        }
      });
    }

    // Replace countries
    await prisma.curatedOfferCountry.deleteMany({ where: { offerId } });
    if (countryIds.length > 0) {
      await prisma.curatedOfferCountry.createMany({
        data: countryIds.map(countryId => ({ offerId, countryId }))
      });
    }

    revalidatePath('/admin/curated-offers');
    revalidatePath(`/admin/stores/${current.storeId}`);
    return { success: true };
  } catch (error) {
    console.error('Update curated offer error:', error);
    return { error: error.message };
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function deleteCuratedOffer(id) {
  try {
    const offer = await prisma.curatedOffer.findUnique({
      where:  { id: parseInt(id) },
      select: { storeId: true }
    });

    await prisma.curatedOffer.delete({ where: { id: parseInt(id) } });

    revalidatePath('/admin/curated-offers');
    if (offer) revalidatePath(`/admin/stores/${offer.storeId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete curated offer error:', error);
    return { error: error.message };
  }
}

// ── TOGGLE ACTIVE (quick action from list) ────────────────────────────────────
export async function toggleCuratedOfferActive(id, currentValue) {
  try {
    await prisma.curatedOffer.update({
      where: { id: parseInt(id) },
      data:  { isActive: !currentValue }
    });
    revalidatePath('/admin/curated-offers');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
