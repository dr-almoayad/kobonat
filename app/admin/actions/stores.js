// app/actions/stores.js
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Create new store
 */
export async function createStore(formData) {
  try {
    const store = await prisma.store.create({
      data: {
        name: formData.name_en,
        slug: formData.slug,
        logo: formData.logo,
        color: formData.color,
        websiteUrl: formData.websiteUrl,
        affiliateNetwork: formData.affiliateNetwork,
        trackingUrl: formData.trackingUrl,
        description: formData.description_en,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        
        // SEO fields
        metaTitle_en: formData.metaTitle_en,
        metaTitle_ar: formData.metaTitle_ar,
        metaDesc_en: formData.metaDesc_en,
        metaDesc_ar: formData.metaDesc_ar,
        
        // Create translations implicitly in the same model
        name_ar: formData.name_ar,
        description_ar: formData.description_ar,
        
        // Connect countries
        countries: {
          create: formData.countries.map(countryCode => ({
            country: { connect: { code: countryCode } }
          }))
        },
        
        // Connect categories
        categories: {
          create: formData.categories.map(categoryId => ({
            category: { connect: { id: categoryId } }
          }))
        }
      }
    });

    revalidatePath('/admin/stores');
    redirect(`/admin/stores/${store.id}`);
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Update existing store
 */
export async function updateStore(storeId, formData) {
  try {
    await prisma.store.update({
      where: { id: parseInt(storeId) },
      data: {
        name: formData.name_en,
        slug: formData.slug,
        logo: formData.logo,
        color: formData.color,
        websiteUrl: formData.websiteUrl,
        description: formData.description_en,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        
        // SEO
        metaTitle_en: formData.metaTitle_en,
        metaTitle_ar: formData.metaTitle_ar,
        metaDesc_en: formData.metaDesc_en,
        metaDesc_ar: formData.metaDesc_ar,
        
        // Translations
        name_ar: formData.name_ar,
        description_ar: formData.description_ar,
        
        lastEditedAt: new Date()
      }
    });
    
    // Update country relations
    await prisma.storeCountry.deleteMany({
      where: { storeId: parseInt(storeId) }
    });
    
    await prisma.storeCountry.createMany({
      data: formData.countries.map(code => ({
        storeId: parseInt(storeId),
        countryId: code
      }))
    });

    revalidatePath(`/admin/stores/${storeId}`);
    revalidatePath('/admin/stores');
    
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Delete store
 */
export async function deleteStore(storeId) {
  try {
    await prisma.store.delete({
      where: { id: parseInt(storeId) }
    });
    
    revalidatePath('/admin/stores');
    redirect('/admin/stores');
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Toggle store status
 */
export async function toggleStoreStatus(storeId) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: parseInt(storeId) },
      select: { isActive: true }
    });
    
    await prisma.store.update({
      where: { id: parseInt(storeId) },
      data: { isActive: !store.isActive }
    });
    
    revalidatePath('/admin/stores');
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}