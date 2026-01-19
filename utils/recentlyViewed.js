// utils/recentlyViewed.js - FIXED VERSION
export const addToRecentlyViewed = (product) => {
  let viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

  // Remove if product already exists to avoid duplicates
  viewed = viewed.filter((p) => p.id !== product.id);

  // ✅ FIXED: Properly normalize all product data
  const normalizedProduct = {
    // Core identifiers
    id: product.id,
    slug: product.slug,
    
    // Names (multilingual)
    name: product.name_en || product.name,
    name_en: product.name_en || product.name,
    name_ar: product.name_ar || product.name_en || product.name,
    
    // Descriptions (multilingual)
    description: product.description_en || product.description || '',
    description_en: product.description_en || product.description || '',
    description_ar: product.description_ar || product.description_en || product.description || '',
    
    // Brand - save as object with all fields
    brand: typeof product.brand === 'object' ? {
      id: product.brand.id,
      name: product.brand.name_en || product.brand.name_ar || product.brand.name,
      name_en: product.brand.name_en || product.brand.name,
      name_ar: product.brand.name_ar || product.brand.name_en || product.brand.name,
      slug: product.brand.slug,
      logo: product.brand.logo
    } : {
      name: product.brand,
      name_en: product.brand,
      name_ar: product.brand,
      slug: product.brand?.toLowerCase().replace(/\s+/g, '-')
    },
    brandId: product.brandId,
    
    // Category - save as object with all fields
    category: typeof product.category === 'object' ? {
      id: product.category.id,
      name: product.category.name_en || product.category.name_ar || product.category.name,
      name_en: product.category.name_en || product.category.name,
      name_ar: product.category.name_ar || product.category.name_en || product.category.name,
      slug: product.category.slug
    } : {
      name: product.category,
      name_en: product.category,
      name_ar: product.category,
      slug: product.category?.toLowerCase().replace(/\s+/g, '-')
    },
    categoryId: product.categoryId,
    
    // Images - ensure array of objects with url property
    images: product.images && Array.isArray(product.images) && product.images.length > 0 ? 
      (typeof product.images[0] === 'string' ? 
        product.images.map(url => ({ url })) : 
        product.images.map(img => ({ url: img.url || img }))
      ) : 
      [{ url: product.imageUrl || product.image || '/placeholder.png' }],
    
    imageUrl: product.imageUrl || 
              (product.images && product.images[0]?.url) || 
              (product.images && Array.isArray(product.images) && product.images[0]) ||
              '/placeholder.png',
    
    // Prices
    price: product.price || product.minPrice || product.lowestPrice || 0,
    minPrice: product.minPrice || product.price || product.lowestPrice || 0,
    maxPrice: product.maxPrice || product.price || product.lowestPrice || 0,
    lowestPrice: product.lowestPrice || product.minPrice || product.price || 0,
    
    // ✅ CRITICAL: Store sellers array properly
    stores: Array.isArray(product.stores) ? product.stores.map(store => ({
      price: typeof store.price === 'string' ? parseFloat(store.price) : (store.price || 0),
      shippingCost: typeof store.shippingCost === 'string' ? parseFloat(store.shippingCost) : (store.shippingCost || 0),
      deliveryTime: store.deliveryTime || '3-5 days',
      currency: store.currency || 'SAR',
      availability: store.availability || 'In Stock',
      productUrl: store.productUrl,
      store: typeof store.store === 'object' ? {
        id: store.store.id,
        name: store.store.name,
        logoUrl: store.store.logoUrl || '/placeholder_store.png',
        website: store.store.website,
        accent: store.store.accent || '#000'
      } : {
        name: store.store || store.name || 'Store',
        logoUrl: store.logoUrl || '/placeholder_store.png',
        website: store.website
      }
    })) : [],
    
    storeCount: Array.isArray(product.stores) ? product.stores.length : 0,
    
    // Timestamps
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString()
  };

  // Add new product at the start
  viewed.unshift(normalizedProduct);

  // Keep only last 10 products
  if (viewed.length > 10) {
    viewed = viewed.slice(0, 10);
  }

  try {
    localStorage.setItem("recentlyViewed", JSON.stringify(viewed));
    console.log('✅ Product added to recently viewed:', normalizedProduct.name);
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
  }
};

export const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem("recentlyViewed");
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('❌ Error reading from localStorage:', error);
    return [];
  }
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem("recentlyViewed");
    console.log('✅ Recently viewed cleared');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
};

export const removeFromRecentlyViewed = (productId) => {
  try {
    let viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    viewed = viewed.filter(p => p.id !== productId);
    localStorage.setItem("recentlyViewed", JSON.stringify(viewed));
    console.log('✅ Product removed from recently viewed');
    return viewed;
  } catch (error) {
    console.error('❌ Error removing from localStorage:', error);
    return [];
  }
};