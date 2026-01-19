// app/actions/vouchers.js
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Create voucher
 */
export async function createVoucher(formData) {
  try {
    const voucher = await prisma.voucher.create({
      data: {
        storeId: parseInt(formData.storeId),
        title_en: formData.title_en,
        title_ar: formData.title_ar,
        description_en: formData.description_en,
        description_ar: formData.description_ar,
        code: formData.code,
        type: formData.type, // 'CODE' | 'DEAL' | 'FREE_SHIPPING'
        discount: formData.discount,
        landingUrl: formData.landingUrl,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        isExclusive: formData.isExclusive,
        isVerified: formData.isVerified,
        displayOrder: formData.displayOrder || 0,
        
        // SEO
        terms_en: formData.terms_en,
        terms_ar: formData.terms_ar,
        
        // Countries
        countries: {
          create: formData.countries.map(countryId => ({
            country: { connect: { id: parseInt(countryId) } }
          }))
        }
      }
    });

    revalidatePath(`/admin/stores/${formData.storeId}/vouchers`);
    return { success: true, voucherId: voucher.id };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Update voucher
 */
export async function updateVoucher(voucherId, formData) {
  try {
    await prisma.voucher.update({
      where: { id: parseInt(voucherId) },
      data: {
        title_en: formData.title_en,
        title_ar: formData.title_ar,
        description_en: formData.description_en,
        description_ar: formData.description_ar,
        code: formData.code,
        type: formData.type,
        discount: formData.discount,
        landingUrl: formData.landingUrl,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        isExclusive: formData.isExclusive,
        isVerified: formData.isVerified,
        displayOrder: formData.displayOrder,
        terms_en: formData.terms_en,
        terms_ar: formData.terms_ar
      }
    });
    
    revalidatePath(`/admin/vouchers/${voucherId}`);
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Soft delete voucher
 */
export async function deleteVoucher(voucherId) {
  try {
    await prisma.voucher.update({
      where: { id: parseInt(voucherId) },
      data: { deletedAt: new Date() }
    });
    
    revalidatePath('/admin/vouchers');
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Reorder vouchers for a store
 */
export async function reorderVouchers(storeId, voucherIds) {
  try {
    await prisma.$transaction(
      voucherIds.map((id, index) =>
        prisma.voucher.update({
          where: { id: parseInt(id) },
          data: { displayOrder: index }
        })
      )
    );
    
    revalidatePath(`/admin/stores/${storeId}/vouchers`);
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}