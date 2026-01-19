// app/actions/faqs.js
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Create FAQ for store
 */
export async function createStoreFAQ(storeId, countryId, formData) {
  try {
    // Get max order for this store+country
    const maxOrder = await prisma.storeFAQ.aggregate({
      where: { storeId: parseInt(storeId), countryId: parseInt(countryId) },
      _max: { order: true }
    });
    
    const faq = await prisma.storeFAQ.create({
      data: {
        storeId: parseInt(storeId),
        countryId: parseInt(countryId),
        question_en: formData.question_en,
        question_ar: formData.question_ar,
        answer_en: formData.answer_en,
        answer_ar: formData.answer_ar,
        order: (maxOrder._max.order || 0) + 1,
        isActive: true
      }
    });
    
    revalidatePath(`/admin/stores/${storeId}/faqs`);
    return { success: true, faqId: faq.id };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Update FAQ
 */
export async function updateStoreFAQ(faqId, formData) {
  try {
    await prisma.storeFAQ.update({
      where: { id: parseInt(faqId) },
      data: {
        question_en: formData.question_en,
        question_ar: formData.question_ar,
        answer_en: formData.answer_en,
        answer_ar: formData.answer_ar,
        isActive: formData.isActive
      }
    });
    
    revalidatePath(`/admin/stores/*/faqs`);
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Reorder FAQs
 */
export async function reorderFAQs(faqIds) {
  try {
    await prisma.$transaction(
      faqIds.map((id, index) =>
        prisma.storeFAQ.update({
          where: { id: parseInt(id) },
          data: { order: index }
        })
      )
    );
    
    revalidatePath(`/admin/stores/*/faqs`);
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Delete FAQ
 */
export async function deleteStoreFAQ(faqId) {
  try {
    await prisma.storeFAQ.delete({
      where: { id: parseInt(faqId) }
    });
    
    revalidatePath(`/admin/stores/*/faqs`);
    return { success: true };
    
  } catch (error) {
    return { error: error.message };
  }
}