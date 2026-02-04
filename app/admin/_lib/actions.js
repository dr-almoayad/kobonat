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
        coverImage: formData.get('coverImage'),      // NEW
        backgroundImage: formData.get('backgroundImage'), // NEW
        color: formData.get('color') || '#2563eb',
        websiteUrl: formData.get('websiteUrl'),
        affiliateNetwork: formData.get('affiliateNetwork'),
        trackingUrl: formData.get('trackingUrl'),
        isActive: formData.get('isActive') === 'on',
        isFeatured: formData.get('isFeatured') === 'on',
        translations: {
          create: [
            {
              locale: 'en',
              name: formData.get('name_en'),
              slug: formData.get('slug_en'),
              description: formData.get('description_en'),
              seoTitle: formData.get('seoTitle_en'),
              seoDescription: formData.get('seoDescription_en')
            },
            {
              locale: 'ar',
              name: formData.get('name_ar'),
              slug: formData.get('slug_ar'),
              description: formData.get('description_ar'),
              seoTitle: formData.get('seoTitle_ar'),
              seoDescription: formData.get('seoDescription_ar')
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

// FIXED updateStore function with proper handling of partial updates
export async function updateStore(id, formData) {
  try {
    // First, get the current store to preserve missing fields
    const currentStore = await prisma.store.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentStore) {
      return { error: `Store with ID ${id} not found` };
    }

    // Build update data object with fallbacks to current values
    const updateData = {
      logo: formData.get('logo') || currentStore.logo,
      coverImage: formData.get('coverImage') || currentStore.coverImage,    // NEW
      backgroundImage: formData.get('backgroundImage') || currentStore.backgroundImage, // NEW
      color: formData.get('color') || currentStore.color,
      websiteUrl: formData.get('websiteUrl') || currentStore.websiteUrl,
      affiliateNetwork: formData.get('affiliateNetwork') || currentStore.affiliateNetwork,
      trackingUrl: formData.get('trackingUrl') || currentStore.trackingUrl,
      isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : currentStore.isActive,
      isFeatured: formData.has('isFeatured') ? formData.get('isFeatured') === 'on' : currentStore.isFeatured,
    };

    // Validate required fields
    if (!updateData.websiteUrl) {
      return { error: 'Website URL is required' };
    }

    // Debug log
    console.log('Updating store data:', updateData);

    await prisma.store.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Update translations only if they exist in formData
    for (const locale of ['en', 'ar']) {
      const name = formData.get(`name_${locale}`);
      const slug = formData.get(`slug_${locale}`);
      
      // Only update translation if at least name or slug is provided
      if (name !== null || slug !== null) {
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
            name: name || '',
            slug: slug || '',
            description: formData.get(`description_${locale}`) || null,
            seoTitle: formData.get(`seoTitle_${locale}`) || null,
            seoDescription: formData.get(`seoDescription_${locale}`) || null
          },
          update: {
            name: name !== null ? name : undefined,
            slug: slug !== null ? slug : undefined,
            description: formData.has(`description_${locale}`) ? formData.get(`description_${locale}`) : undefined,
            seoTitle: formData.has(`seoTitle_${locale}`) ? formData.get(`seoTitle_${locale}`) : undefined,
            seoDescription: formData.has(`seoDescription_${locale}`) ? formData.get(`seoDescription_${locale}`) : undefined
          }
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

export async function upsertCategory(id, formData) {
  try {
    const isUpdate = id && id !== 'undefined' && id !== '';
    const categoryId = isUpdate ? parseInt(id) : undefined;

    const data = {
      icon: formData.get('icon'),
      image: formData.get('image'), // NEW
      color: formData.get('color'),
    };

    let category;

    if (isUpdate) {
      category = await prisma.category.update({
        where: { id: categoryId },
        data
      });
    } else {
      category = await prisma.category.create({ data });
    }

    // Update Translations
    for (const locale of ['en', 'ar']) {
      const name = formData.get(`name_${locale}`);
      const slug = formData.get(`slug_${locale}`);
      const description = formData.get(`description_${locale}`);
      const seoTitle = formData.get(`seoTitle_${locale}`);
      const seoDescription = formData.get(`seoDescription_${locale}`);

      if (name && slug) {
        await prisma.categoryTranslation.upsert({
          where: {
            categoryId_locale: {
              categoryId: category.id,
              locale
            }
          },
          create: {
            categoryId: category.id,
            locale,
            name,
            slug,
            description,
            seoTitle,
            seoDescription
          },
          update: {
            name,
            slug,
            description,
            seoTitle,
            seoDescription
          }
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

export async function createOtherPromo(formData) {
  try {
    const storeId = parseInt(formData.get('storeId'));
    const countryId = parseInt(formData.get('countryId'));
    const startDate = formData.get('startDate') ? new Date(formData.get('startDate')) : null;
    const expiryDate = formData.get('expiryDate') ? new Date(formData.get('expiryDate')) : null;

    const promo = await prisma.otherPromo.create({
      data: {
        storeId,
        countryId,
        image: formData.get('image'),
        type: formData.get('type'),
        url: formData.get('url'),
        startDate,
        expiryDate,
        isActive: formData.get('isActive') === 'on',
        order: parseInt(formData.get('order') || '0'),
        translations: {
          create: [
            {
              locale: 'en',
              title: formData.get('title_en'),
              description: formData.get('description_en'),
              terms: formData.get('terms_en')
            },
            {
              locale: 'ar',
              title: formData.get('title_ar'),
              description: formData.get('description_ar'),
              terms: formData.get('terms_ar')
            }
          ]
        }
      }
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
