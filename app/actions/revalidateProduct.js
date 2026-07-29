// app/actions/revalidateProduct.js
'use server';
import { revalidatePath } from 'next/cache';

export async function revalidateProduct(slug, locale = 'en') {
  revalidatePath(`/${locale}/product/${slug}`);
  revalidatePath(`/api/comparison/products/${slug}`);
  return { success: true };
}
