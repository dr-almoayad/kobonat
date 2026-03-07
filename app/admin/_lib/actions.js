'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================================================
// STORES
// ============================================================================

export async function createStore(formData) {
  try {
    const store = await prisma.store.create({
      data: {
        logo: formData.get('logo'),
        bigLogo: formData.get('bigLogo'),
        coverImage: formData.get('coverImage'),
        backgroundImage: formData.get('backgroundImage'),
        color: formData.get('color') || '#470ae2',
        websiteUrl: formData.get('websiteUrl'),
        affiliateNetwork: formData.get('affiliateNetwork'),
        trackingUrl: formData.get('trackingUrl'),
        isActive: formData.get('isActive') === 'on',
        isFeatured: formData.get('isFeatured') === 'on',
        
        // ✅ UPDATED: showOfferType as ENUM
        showOfferType: formData.get('showOfferType') || null,
        
        translations: {
          create: [
            {
              locale: 'en',
              name: formData.get('name_en'),
              slug: formData.get('slug_en'),
              description: formData.get('description_en'),
              seoTitle: formData.get('seoTitle_en'),
              seoDescription: formData.get('seoDescription_en'),
              showOffer: formData.get('showOffer_en') // ✅ NEW
            },
            {
              locale: 'ar',
              name: formData.get('name_ar'),
              slug: formData.get('slug_ar'),
              description: formData.get('description_ar'),
              seoTitle: formData.get('seoTitle_ar'),
              seoDescription: formData.get('seoDescription_ar'),
              showOffer: formData.get('showOffer_ar') // ✅ NEW
            }
          ]
        },
        countries: {
          create: formData.getAll('countryIds').map(id => ({
            countryId: parseInt(id)
          }))
        },
        categories: {
          create: formData.getAll('categoryIds').map(id => ({
            categoryId: parseInt(id)
          }))
        }
      }
    });

    revalidatePath('/admin/stores');
    return { success: true, id: store.id };
  } catch (error) {
    console.error('Create store error:', error);
    return { error: error.message };
  }
}


export async function updateStore(id, formData) {
  try {
    // First, get the current store to preserve missing fields
    const currentStore = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true
      }
    });

    if (!currentStore) {
      return { error: `Store with ID ${id} not found` };
    }

    // Build update data object with fallbacks to current values
    const updateData = {
      logo: formData.get('logo') || currentStore.logo,
      bigLogo: formData.get('bigLogo') || currentStore.bigLogo,
      coverImage: formData.get('coverImage') || currentStore.coverImage,
      backgroundImage: formData.get('backgroundImage') || currentStore.backgroundImage,
      color: formData.get('color') || currentStore.color,
      websiteUrl: formData.get('websiteUrl') || currentStore.websiteUrl,
      affiliateNetwork: formData.get('affiliateNetwork') || currentStore.affiliateNetwork,
      trackingUrl: formData.get('trackingUrl') || currentStore.trackingUrl,
      isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : currentStore.isActive,
      isFeatured: formData.has('isFeatured') ? formData.get('isFeatured') === 'on' : currentStore.isFeatured,
      showOfferType: formData.has('showOfferType') ? formData.get('showOfferType') : currentStore.showOfferType,
    };

    // Validate required fields
    if (!updateData.websiteUrl) {
      return { error: 'Website URL is required' };
    }

    // Update store
    await prisma.store.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // ✅ FIXED: Update translations including showOffer
    for (const locale of ['en', 'ar']) {
      const name = formData.get(`name_${locale}`);
      const slug = formData.get(`slug_${locale}`);
      const description = formData.get(`description_${locale}`);
      const seoTitle = formData.get(`seoTitle_${locale}`);
      const seoDescription = formData.get(`seoDescription_${locale}`);
      const showOffer = formData.get(`showOffer_${locale}`);
      
      // Check if we have any translation data to update
      const hasTranslationData = name !== null || slug !== null || 
                                description !== null || seoTitle !== null || 
                                seoDescription !== null || showOffer !== null;
      
      if (hasTranslationData) {
        // Get current translation if exists
        const currentTranslation = currentStore.translations?.find(t => t.locale === locale);
        
        const upsertData = {
          name: name !== null ? name : (currentTranslation?.name || ''),
          slug: slug !== null ? slug : (currentTranslation?.slug || ''),
          description: description !== null ? description : currentTranslation?.description,
          seoTitle: seoTitle !== null ? seoTitle : currentTranslation?.seoTitle,
          seoDescription: seoDescription !== null ? seoDescription : currentTranslation?.seoDescription,
          showOffer: showOffer !== null ? showOffer : currentTranslation?.showOffer,
        };

        await prisma.storeTranslation.upsert({
          where: {
            storeId_locale: {
              storeId: parseInt(id),
              locale
            }
          },
          create: {
            storeId: parseInt(id),
            locale,
            ...upsertData
          },
          update: upsertData
        });
      }
    }

    revalidatePath(`/admin/stores/${id}`);
    revalidatePath('/admin/stores');
    return { success: true };
  } catch (error) {
    console.error('Update store error:', error);
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return { error: error.message };
  }
}


export async function deleteStore(id) {
  try {
    const storeId = parseInt(id);
    
    // Check all dependencies
    const [voucherCount, productCount, faqCount, promoCount] = await Promise.all([
      prisma.voucher.count({ where: { storeId } }),
      prisma.storeProduct.count({ where: { storeId } }),
      prisma.storeFAQ.count({ where: { storeId } }),
      prisma.otherPromo.count({ where: { storeId } })
    ]);

    const totalDeps = voucherCount + productCount + faqCount + promoCount;
    
    if (totalDeps > 0) {
      const deps = [];
      if (voucherCount) deps.push(`${voucherCount} voucher(s)`);
      if (productCount) deps.push(`${productCount} product(s)`);
      if (faqCount) deps.push(`${faqCount} FAQ(s)`);
      if (promoCount) deps.push(`${promoCount} promo(s)`);
      
      return { 
        error: `Cannot delete store. Please delete its ${deps.join(', ')} first.`
      };
    }

    await prisma.store.delete({
      where: { id: storeId }
    });

    revalidatePath('/admin/stores');
    return { success: true };
    
  } catch (error) {
    console.error('Delete store error:', error);
    return { error: error.message || 'Failed to delete store' };
  }
    }


export async function updateStoreCountries(id, formData) {
  try {
    const countryIds = formData.getAll('countryIds').map(id => parseInt(id));
    
    await prisma.storeCountry.deleteMany({
      where: { storeId: parseInt(id) }
    });
    
    if (countryIds.length > 0) {
      await prisma.storeCountry.createMany({
        data: countryIds.map(countryId => ({
          storeId: parseInt(id),
          countryId
        }))
      });
    }

    revalidatePath(`/admin/stores/${id}`);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateStoreCategories(id, formData) {
  try {
    const categoryIds = formData.getAll('categoryIds').map(id => parseInt(id));
    
    await prisma.storeCategory.deleteMany({
      where: { storeId: parseInt(id) }
    });
    
    if (categoryIds.length > 0) {
      await prisma.storeCategory.createMany({
        data: categoryIds.map(categoryId => ({
          storeId: parseInt(id),
          categoryId
        }))
      });
    }

    revalidatePath(`/admin/stores/${id}`);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}


// ============================================================================
// STORE PRODUCTS
// ============================================================================

export async function createStoreProduct(formData) {
  try {
    const storeId = parseInt(formData.get('storeId'));
    const discountValue = formData.get('discountValue') ? parseFloat(formData.get('discountValue')) : null;
    const discountType = formData.get('discountType') || 'PERCENTAGE';

    const isFeatured = formData.get('isFeatured') === 'on';

    const product = await prisma.storeProduct.create({
      data: {
        storeId,
        image: formData.get('image'),
        discountValue,
        discountType,
        productUrl: formData.get('productUrl'),
        isFeatured: isFeatured,
        order: parseInt(formData.get('order') || '0'),
        translations: {
          create: [
            {
              locale: 'en',
              title: formData.get('title_en'),
              description: formData.get('description_en')
            },
            {
              locale: 'ar',
              title: formData.get('title_ar'),
              description: formData.get('description_ar')
            }
          ]
        }
      }
    });

    revalidatePath(`/admin/stores/${storeId}`);
    return { success: true, id: product.id };
  } catch (error) {
    console.error('Create store product error:', error);
    return { error: error.message };
  }
}

export async function updateStoreProduct(id, formData) {
  try {
    const discountValue = formData.get('discountValue') ? parseFloat(formData.get('discountValue')) : null;
    const discountType = formData.get('discountType') || 'PERCENTAGE';

    const isFeatured = formData.get('isFeatured') === 'on';
    
    const updatedProduct = await prisma.storeProduct.update({
      where: { id: parseInt(id) },
      data: {
        image: formData.get('image'),
        discountValue,
        discountType,
        productUrl: formData.get('productUrl'),
        isFeatured: isFeatured,
        order: parseInt(formData.get('order') || '0')
      }
    });

    // Update translations
    for (const locale of ['en', 'ar']) {
      await prisma.storeProductTranslation.upsert({
        where: {
          productId_locale: {
            productId: parseInt(id),
            locale
          }
        },
        create: {
          productId: parseInt(id),
          locale,
          title: formData.get(`title_${locale}`),
          description: formData.get(`description_${locale}`)
        },
        update: {
          title: formData.get(`title_${locale}`),
          description: formData.get(`description_${locale}`)
        }
      });
    }

    revalidatePath(`/admin/stores/${updatedProduct.storeId}`);
    return { success: true };
  } catch (error) {
    console.error('Update store product error:', error);
    return { error: error.message };
  }
}




export async function deleteStoreProduct(id) {
  try {
    const product = await prisma.storeProduct.findUnique({
      where: { id: parseInt(id) },
      select: { storeId: true }
    });

    await prisma.storeProduct.delete({
      where: { id: parseInt(id) }
    });

    if (product) {
      revalidatePath(`/admin/stores/${product.storeId}`);
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}


// app/admin/_lib/actions.js - ADD THESE TO YOUR EXISTING FILE

// ============================================================================
// CURATED OFFERS
// ============================================================================

export async function createCuratedOffer(formData) {
  try {
    const storeId = parseInt(formData.get('storeId'));
    const startDate = formData.get('startDate') ? new Date(formData.get('startDate')) : null;
    const expiryDate = formData.get('expiryDate') ? new Date(formData.get('expiryDate')) : null;

    const offer = await prisma.curatedOffer.create({
      data: {
        storeId,
        offerImage: formData.get('offerImage'),
        code: formData.get('code') || null,
        type: formData.get('type'),
        ctaUrl: formData.get('ctaUrl'),
        startDate,
        expiryDate,
        isFeatured: formData.get('isFeatured') === 'on',
        isActive: formData.get('isActive') === 'on',
        order: parseInt(formData.get('order') || '0'),
        translations: {
          create: [
            {
              locale: 'en',
              title: formData.get('title_en'),
              description: formData.get('description_en'),
              ctaText: formData.get('ctaText_en')
            },
            {
              locale: 'ar',
              title: formData.get('title_ar'),
              description: formData.get('description_ar'),
              ctaText: formData.get('ctaText_ar')
            }
          ]
        }
      }
    });

    revalidatePath('/admin/curated-offers');
    return { success: true, id: offer.id };
  } catch (error) {
    console.error('Create curated offer error:', error);
    return { error: error.message };
  }
}

export async function updateCuratedOffer(id, formData) {
  try {
    const startDate = formData.get('startDate') ? new Date(formData.get('startDate')) : null;
    const expiryDate = formData.get('expiryDate') ? new Date(formData.get('expiryDate')) : null;

    const offer = await prisma.curatedOffer.update({
      where: { id: parseInt(id) },
      data: {
        storeId: parseInt(formData.get('storeId')),
        offerImage: formData.get('offerImage'),
        code: formData.get('code') || null,
        type: formData.get('type'),
        ctaUrl: formData.get('ctaUrl'),
        startDate,
        expiryDate,
        isFeatured: formData.get('isFeatured') === 'on',
        isActive: formData.get('isActive') === 'on',
        order: parseInt(formData.get('order') || '0')
      }
    });

    // Update translations
    for (const locale of ['en', 'ar']) {
      await prisma.curatedOfferTranslation.upsert({
        where: {
          offerId_locale: {
            offerId: parseInt(id),
            locale
          }
        },
        create: {
          offerId: parseInt(id),
          locale,
          title: formData.get(`title_${locale}`),
          description: formData.get(`description_${locale}`),
          ctaText: formData.get(`ctaText_${locale}`)
        },
        update: {
          title: formData.get(`title_${locale}`),
          description: formData.get(`description_${locale}`),
          ctaText: formData.get(`ctaText_${locale}`)
        }
      });
    }

    revalidatePath('/admin/curated-offers');
    return { success: true };
  } catch (error) {
    console.error('Update curated offer error:', error);
    return { error: error.message };
  }
}

export async function deleteCuratedOffer(id) {
  try {
    await prisma.curatedOffer.delete({
      where: { id: parseInt(id) }
    });

    revalidatePath('/admin/curated-offers');
    return { success: true };
  } catch (error) {
    console.error('Delete curated offer error:', error);
    return { error: error.message };
  }
}


// ============================================================================
// VOUCHERS
// ============================================================================

export async function createVoucher(formData) {
  return handleVoucherSave(null, formData);
}

export async function updateVoucher(id, formData) {
  return handleVoucherSave(id, formData);
}

async function handleVoucherSave(id, formData) {
  try {
    const isUpdate = id && id !== 'undefined';
    const voucherId = isUpdate ? parseInt(id) : undefined;

    const storeId = parseInt(formData.get('storeId'));
    const startDate = formData.get('startDate') ? new Date(formData.get('startDate')) : null;
    const expiryDate = formData.get('expiryDate') ? new Date(formData.get('expiryDate')) : null;
    const countryIds = formData.getAll('countryIds').map(cid => parseInt(cid));

    const coreData = {
      storeId,
      code: formData.get('code'),
      type: formData.get('type'),
      discount: formData.get('discount'),
      landingUrl: formData.get('landingUrl'),
      startDate,
      expiryDate,
      isExclusive: formData.get('isExclusive') === 'on',
      isVerified: formData.get('isVerified') === 'on',
      popularityScore: parseInt(formData.get('popularityScore') || '0')
    };

    let voucher;

    if (isUpdate) {
      voucher = await prisma.voucher.update({
        where: { id: voucherId },
        data: coreData
      });
      
      await prisma.voucherCountry.deleteMany({ where: { voucherId } });
      if (countryIds.length > 0) {
        await prisma.voucherCountry.createMany({
          data: countryIds.map(countryId => ({ voucherId, countryId }))
        });
      }
    } else {
      voucher = await prisma.voucher.create({
        data: {
          ...coreData,
          countries: {
            create: countryIds.map(cid => ({ countryId: cid }))
          }
        }
      });
    }

    // Update Translations
    for (const locale of ['en', 'ar']) {
      const title = formData.get(`title_${locale}`);
      const description = formData.get(`description_${locale}`);

      if (title) {
        await prisma.voucherTranslation.upsert({
          where: {
            voucherId_locale: {
              voucherId: voucher.id,
              locale
            }
          },
          create: {
            voucherId: voucher.id,
            locale,
            title,
            description
          },
          update: {
            title,
            description
          }
        });
      }
    }

    revalidatePath('/admin/vouchers');
    return { success: true };
  } catch (error) {
    console.error('Voucher Save Error:', error);
    return { error: error.message };
  }
}

export async function deleteVoucher(id) {
  try {
    await prisma.voucher.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/vouchers');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// CATEGORIES
// ============================================================================

// PATCH: app/admin/_lib/actions.js
// Replace the existing upsertCategory function with this version.
// Only change: reads bankScoringWeights from formData and saves it to the Category row.

export async function upsertCategory(id, formData) {
  try {
    const isUpdate   = id && id !== 'undefined' && id !== '';
    const categoryId = isUpdate ? parseInt(id) : undefined;

    // Parse bankScoringWeights — empty string or missing → null (not a bank niche)
    const rawWeights = formData.get('bankScoringWeights');
    let bankScoringWeights = null;
    if (rawWeights) {
      try {
        const parsed = JSON.parse(rawWeights);
        bankScoringWeights = Object.keys(parsed).length > 0 ? parsed : null;
      } catch {
        bankScoringWeights = null;
      }
    }

    const data = {
      icon:               formData.get('icon')  || null,
      image:              formData.get('image') || null,
      color:              formData.get('color') || null,
      bankScoringWeights,   // ← new
    };

    let category;
    if (isUpdate) {
      category = await prisma.category.update({ where: { id: categoryId }, data });
    } else {
      category = await prisma.category.create({ data });
    }

    // Translations (unchanged)
    for (const locale of ['en', 'ar']) {
      const name         = formData.get(`name_${locale}`);
      const slug         = formData.get(`slug_${locale}`);
      const description  = formData.get(`description_${locale}`);
      const seoTitle     = formData.get(`seoTitle_${locale}`);
      const seoDescription = formData.get(`seoDescription_${locale}`);

      if (name && slug) {
        await prisma.categoryTranslation.upsert({
          where:  { categoryId_locale: { categoryId: category.id, locale } },
          create: { categoryId: category.id, locale, name, slug, description, seoTitle, seoDescription },
          update: { name, slug, description, seoTitle, seoDescription },
        });
      }
    }

    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    console.error('Category Upsert Error:', error);
    return { error: error.message };
  }
}

export async function deleteCategory(id) {
  try {
    const storeCount = await prisma.storeCategory.count({
      where: { categoryId: parseInt(id) }
    });

    if (storeCount > 0) {
      return { error: `Cannot delete category used by ${storeCount} stores` };
    }

    await prisma.category.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// COUNTRIES
// ============================================================================

export async function createCountry(formData) {
  try {
    const country = await prisma.country.create({
      data: {
        code: formData.get('code'),
        currency: formData.get('currency'),
        flag: formData.get('flag'),
        isActive: formData.get('isActive') === 'on',
        isDefault: formData.get('isDefault') === 'on',
        translations: {
          create: [
            {
              locale: 'en',
              name: formData.get('name_en')
            },
            {
              locale: 'ar',
              name: formData.get('name_ar')
            }
          ]
        }
      }
    });

    revalidatePath('/admin/countries');
    return { success: true, id: country.id };
  } catch (error) {
    console.error('Create country error:', error);
    return { error: error.message };
  }
}

export async function updateCountry(id, formData) {
  try {
    await prisma.country.update({
      where: { id: parseInt(id) },
      data: {
        code: formData.get('code'),
        currency: formData.get('currency'),
        flag: formData.get('flag'),
        isActive: formData.get('isActive') === 'on',
        isDefault: formData.get('isDefault') === 'on'
      }
    });

    // Update translations
    for (const locale of ['en', 'ar']) {
      await prisma.countryTranslation.upsert({
        where: {
          countryId_locale: {
            countryId: parseInt(id),
            locale
          }
        },
        create: {
          countryId: parseInt(id),
          locale,
          name: formData.get(`name_${locale}`)
        },
        update: {
          name: formData.get(`name_${locale}`)
        }
      });
    }

    revalidatePath('/admin/countries');
    return { success: true };
  } catch (error) {
    console.error('Update country error:', error);
    return { error: error.message };
  }
}

export async function deleteCountry(id) {
  try {
    const storeCount = await prisma.storeCountry.count({
      where: { countryId: parseInt(id) }
    });

    if (storeCount > 0) {
      return { error: `Cannot delete country used by ${storeCount} stores` };
    }

    await prisma.country.delete({
      where: { id: parseInt(id) }
    });

    revalidatePath('/admin/countries');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export async function upsertPaymentMethod(formData) {
  try {
    const id = formData.get('id');
    const isUpdate = id && id !== 'undefined';
    
    const data = {
      slug: formData.get('slug'),
      type: formData.get('type'),
      isBnpl: formData.get('isBnpl') === 'on',
      logo: formData.get('logo')
    };

    let paymentMethod;
    if (isUpdate) {
      paymentMethod = await prisma.paymentMethod.update({
        where: { id: parseInt(id) },
        data
      });
    } else {
      paymentMethod = await prisma.paymentMethod.create({ data });
    }

    // Update translations
    for (const locale of ['en', 'ar']) {
      await prisma.paymentMethodTranslation.upsert({
        where: {
          paymentMethodId_locale: {
            paymentMethodId: paymentMethod.id,
            locale
          }
        },
        create: {
          paymentMethodId: paymentMethod.id,
          locale,
          name: formData.get(`name_${locale}`),
          description: formData.get(`description_${locale}`)
        },
        update: {
          name: formData.get(`name_${locale}`),
          description: formData.get(`description_${locale}`)
        }
      });
    }

    revalidatePath('/admin/payment-methods');
    return { success: true, id: paymentMethod.id };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deletePaymentMethod(id) {
  try {
    const storeCount = await prisma.storePaymentMethod.count({
      where: { paymentMethodId: parseInt(id) }
    });

    if (storeCount > 0) {
      return { error: `Cannot delete payment method used by ${storeCount} stores` };
    }

    await prisma.paymentMethod.delete({
      where: { id: parseInt(id) }
    });

    revalidatePath('/admin/payment-methods');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}


// ============================================================================
// OTHER PROMOS
// ============================================================================

// PATCH: app/admin/_lib/actions.js
// Replace the existing createOtherPromo function with this version.
// Adds bankId, cardId, cardNetwork, installmentMonths — all nullable/optional.

export async function createOtherPromo(formData) {
  try {
    const storeId   = parseInt(formData.get('storeId'));
    const countryId = parseInt(formData.get('countryId'));
    const startDate  = formData.get('startDate')  ? new Date(formData.get('startDate'))  : null;
    const expiryDate = formData.get('expiryDate') ? new Date(formData.get('expiryDate')) : null;

    // ── Bank / card fields (all nullable) ──────────────────────────────────
    const rawBankId     = formData.get('bankId');
    const rawCardId     = formData.get('cardId');
    const rawNetwork    = formData.get('cardNetwork');
    const rawInstall    = formData.get('installmentMonths');

    const bankId            = rawBankId  ? parseInt(rawBankId)  : null;
    const cardId            = rawCardId  ? parseInt(rawCardId)  : null;
    const cardNetwork       = rawNetwork || null;
    const installmentMonths = rawInstall ? parseInt(rawInstall) : null;

    const promo = await prisma.otherPromo.create({
      data: {
        storeId,
        countryId,
        image:    formData.get('image')    || null,
        type:     formData.get('type'),
        url:      formData.get('url')      || null,
        startDate,
        expiryDate,
        isActive: formData.get('isActive') === 'on',
        order:    parseInt(formData.get('order') || '0'),

        // ← new fields
        bankId,
        cardId,
        cardNetwork,
        installmentMonths,

        translations: {
          create: [
            {
              locale:      'en',
              title:       formData.get('title_en'),
              description: formData.get('description_en'),
              terms:       formData.get('terms_en'),
            },
            {
              locale:      'ar',
              title:       formData.get('title_ar'),
              description: formData.get('description_ar'),
              terms:       formData.get('terms_ar'),
            },
          ],
        },
      },
    });

    revalidatePath(`/admin/stores/${storeId}`);
    return { success: true, id: promo.id };
  } catch (error) {
    console.error('Create other promo error:', error);
    return { error: error.message };
  }
}

export async function updateOtherPromo(id, formData) {
  try {
    const startDate = formData.get('startDate') ? new Date(formData.get('startDate')) : null;
    const expiryDate = formData.get('expiryDate') ? new Date(formData.get('expiryDate')) : null;

    const promo = await prisma.otherPromo.update({
      where: { id: parseInt(id) },
      data: {
        countryId: parseInt(formData.get('countryId')),
        image: formData.get('image'),
        type: formData.get('type'),
        url: formData.get('url'),
        startDate,
        expiryDate,
        isActive: formData.get('isActive') === 'on',
        order: parseInt(formData.get('order') || '0')
      }
    });

    // Update translations
    for (const locale of ['en', 'ar']) {
      await prisma.otherPromoTranslation.upsert({
        where: {
          promoId_locale: {
            promoId: parseInt(id),
            locale
          }
        },
        create: {
          promoId: parseInt(id),
          locale,
          title: formData.get(`title_${locale}`),
          description: formData.get(`description_${locale}`),
          terms: formData.get(`terms_${locale}`)
        },
        update: {
          title: formData.get(`title_${locale}`),
          description: formData.get(`description_${locale}`),
          terms: formData.get(`terms_${locale}`)
        }
      });
    }

    revalidatePath(`/admin/stores/${promo.storeId}`);
    return { success: true };
  } catch (error) {
    console.error('Update other promo error:', error);
    return { error: error.message };
  }
}

export async function deleteOtherPromo(id) {
  try {
    const promo = await prisma.otherPromo.findUnique({
      where: { id: parseInt(id) },
      select: { storeId: true }
    });

    await prisma.otherPromo.delete({
      where: { id: parseInt(id) }
    });

    if (promo) {
      revalidatePath(`/admin/stores/${promo.storeId}`);
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// FAQs
// ============================================================================

export async function upsertFAQ(formData) {
  try {
    const faqId = formData.get('faqId');
    const storeId = formData.get('storeId');
    const isUpdate = faqId && faqId !== 'undefined';
    
    const data = {
      storeId: parseInt(storeId),
      countryId: parseInt(formData.get('countryId')),
      order: parseInt(formData.get('order') || '0'),
      // ✅ FIX: Default to true if not explicitly set
      isActive: formData.has('isActive') 
        ? formData.get('isActive') === 'on' 
        : true  // Default to active for new FAQs
    };

    let faq;
    if (isUpdate) {
      faq = await prisma.storeFAQ.update({
        where: { id: parseInt(faqId) },
        data
      });
    } else {
      faq = await prisma.storeFAQ.create({ data });
    }

    // Update translations
    for (const locale of ['en', 'ar']) {
      await prisma.storeFAQTranslation.upsert({
        where: {
          faqId_locale: {
            faqId: faq.id,
            locale
          }
        },
        create: {
          faqId: faq.id,
          locale,
          question: formData.get(`question_${locale}`),
          answer: formData.get(`answer_${locale}`)
        },
        update: {
          question: formData.get(`question_${locale}`),
          answer: formData.get(`answer_${locale}`)
        }
      });
    }

    revalidatePath(`/admin/stores/${storeId}`);
    return { success: true, id: faq.id };
  } catch (error) {
    console.error('FAQ upsert error:', error);
    return { error: error.message };
  }
}

export async function deleteFAQ(formData) {
  try {
    const id = formData.get('id');
    const storeId = formData.get('storeId');
    
    await prisma.storeFAQ.delete({
      where: { id: parseInt(id) }
    });

    revalidatePath(`/admin/stores/${storeId}`);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}









// ============================================================================
// ── NEW: STORE INTELLIGENCE — LOGISTICS
// ============================================================================

/**
 * Update all logistics / cadence fields for a store.
 * Automatically stamps lastVerifiedAt on every save.
 */
export async function updateStoreLogistics(storeId, formData) {
  try {
    const n = (k) => { const v = formData.get(k); return v === '' || v === null ? null : Number(v); };

    await prisma.store.update({
      where: { id: parseInt(storeId) },
      data:  {
        averageDeliveryDaysMin:  n('averageDeliveryDaysMin'),
        averageDeliveryDaysMax:  n('averageDeliveryDaysMax'),
        freeShippingThreshold:   n('freeShippingThreshold'),
        returnWindowDays:        n('returnWindowDays'),
        freeReturns:             formData.get('freeReturns') === 'on',
        refundProcessingDaysMin: n('refundProcessingDaysMin'),
        refundProcessingDaysMax: n('refundProcessingDaysMax'),
        offerFrequencyDays:      n('offerFrequencyDays'),
        lastVerifiedAt:          new Date(),   // always stamp on save
      }
    });

    revalidatePath(`/admin/stores/${storeId}/intelligence`);
    return { success: true };
  } catch (error) {
    console.error('Update store logistics error:', error);
    return { error: error.message };
  }
}

// ============================================================================
// ── NEW: STORE INTELLIGENCE — UPCOMING EVENTS
// ============================================================================

export async function createUpcomingEvent(formData) {
  try {
    const storeId = parseInt(formData.get('storeId'));
    const raw     = formData.get('expectedMaxDiscount');

    const event = await prisma.storeUpcomingEvent.create({
      data: {
        storeId,
        eventName:           formData.get('eventName'),
        expectedMonth:       formData.get('expectedMonth'),
        confidenceLevel:     formData.get('confidenceLevel') || 'MEDIUM',
        expectedMaxDiscount: raw ? parseFloat(raw) : null,
        notes:               formData.get('notes') || null,
      }
    });

    revalidatePath(`/admin/stores/${storeId}/intelligence`);
    return { success: true, id: event.id };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteUpcomingEvent(id, storeId) {
  try {
    await prisma.storeUpcomingEvent.delete({ where: { id: parseInt(id) } });
    revalidatePath(`/admin/stores/${storeId}/intelligence`);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// ── NEW: STORE INTELLIGENCE — PEAK SEASONS
// ============================================================================

export async function createPeakSeason(formData) {
  try {
    const storeId = parseInt(formData.get('storeId'));
    const season  = await prisma.storePeakSeason.create({
      data: {
        storeId,
        seasonKey: formData.get('seasonKey'),
        nameEn:    formData.get('nameEn'),
        nameAr:    formData.get('nameAr'),
      }
    });
    revalidatePath(`/admin/stores/${storeId}/intelligence`);
    return { success: true, id: season.id };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deletePeakSeason(id, storeId) {
  try {
    await prisma.storePeakSeason.delete({ where: { id: parseInt(id) } });
    revalidatePath(`/admin/stores/${storeId}/intelligence`);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// ── NEW: SAVINGS METHODOLOGY (FORMULA VERSIONS)
// ============================================================================

export async function createMethodology(formData) {
  try {
    const version     = formData.get('version')?.trim();
    const description = formData.get('description')?.trim();
    if (!version || !description) return { error: 'Version and description are required' };

    const existing = await prisma.savingsMethodology.findUnique({ where: { version } });
    if (existing) return { error: `Version "${version}" already exists` };

    const m = await prisma.savingsMethodology.create({
      data: {
        version, description,
        isActive:            false,   // must be activated deliberately
        maxSavingsCap:       parseFloat(formData.get('maxSavingsCap')       || '75'),
        referenceBasketSize: parseFloat(formData.get('referenceBasketSize') || '500'),
        multiplierExact:     parseFloat(formData.get('multiplierExact')     || '1.00'),
        multiplierVerified:  parseFloat(formData.get('multiplierVerified')  || '1.00'),
        multiplierTypical:   parseFloat(formData.get('multiplierTypical')   || '0.80'),
        multiplierEstimated: parseFloat(formData.get('multiplierEstimated') || '0.35'),
      }
    });

    revalidatePath('/admin/leaderboard/methodology');
    return { success: true, id: m.id };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Atomically activates one version and deactivates all others.
 * Call with the methodology's numeric id.
 */
export async function activateMethodology(id) {
  try {
    await prisma.$transaction([
      prisma.savingsMethodology.updateMany({ where: { isActive: true }, data: { isActive: false } }),
      prisma.savingsMethodology.update({ where: { id: parseInt(id) }, data: { isActive: true } }),
    ]);
    revalidatePath('/admin/leaderboard/methodology');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteMethodology(id) {
  try {
    const m = await prisma.savingsMethodology.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { snapshots: true } } }
    });
    if (!m) return { error: 'Not found' };
    if (m.isActive) return { error: 'Cannot delete the active formula version' };
    if (m._count.snapshots > 0) return { error: `${m._count.snapshots} leaderboard snapshots reference this version — archive it instead` };

    await prisma.savingsMethodology.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/leaderboard/methodology');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// ── NEW: LEADERBOARD — MANUAL SAVINGS OVERRIDE
// ============================================================================

/**
 * Set or clear a manual savings override on a leaderboard snapshot.
 * Pass overrideValue as a number (0–100) to set, or null to clear.
 */
export async function setLeaderboardOverride(snapshotId, overrideValue) {
  try {
    if (overrideValue !== null) {
      const n = Number(overrideValue);
      if (isNaN(n) || n < 0 || n > 100) return { error: 'Override must be 0–100, or null to clear' };
    }
    await prisma.storeSavingsSnapshot.update({
      where: { id: parseInt(snapshotId) },
      data:  { savingsOverridePercent: overrideValue }
    });
    revalidatePath('/admin/leaderboard');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
