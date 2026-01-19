// lib/utils/searchDataAdapter.js - Adapter to convert search results to component format

/**
 * Adapts search engine results to match the format expected by ProductCard components
 */
export function adaptSearchResultsForComponents(searchResults) {
  if (!searchResults || !searchResults.products) {
    return searchResults
  }

  const adaptedProducts = searchResults.products.map(product => {
    // Convert sellers array to the format HorizontalProductCard expects
    const adaptedSellers = (product.sellers || []).map(seller => ({
      // The card expects seller data in this structure:
      price: seller.price,
      shippingCost: seller.shippingCost || 0,
      deliveryTime: seller.deliveryTime,
      availability: seller.availability,
      productUrl: seller.url,
      lastScraped: seller.lastScraped,
      seller: {
        id: seller.id,
        name: seller.name,
        website: seller.website,
        logoUrl: seller.logoUrl
      }
    }))

    // Convert product attributes from the enhanced format
    const productAttributes = []
    
    // Add brand as an attribute if it exists
    if (product.brand) {
      productAttributes.push({
        key: 'Brand',
        value: product.brand
      })
    }
    
    // Add other extracted attributes
    if (product.capacity) {
      productAttributes.push({
        key: 'Capacity',
        value: product.capacity
      })
    }
    
    if (product.color) {
      productAttributes.push({
        key: 'Color',
        value: product.color
      })
    }
    
    if (product.size) {
      productAttributes.push({
        key: 'Size',
        value: product.size
      })
    }
    
    if (product.model) {
      productAttributes.push({
        key: 'Model',
        value: product.model
      })
    }

    // Build the adapted product object
    return {
      id: product.id,
      name: product.name,
      normalizedName: product.normalizedName,
      description: product.description,
      slug: product.slug,
      
      // Seller information
      sellers: adaptedSellers,
      
      // Attributes array that components expect
      productAttributes: productAttributes,
      
      // Image information
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      image: product.imageUrl, // Fallback
      imageUrl: product.imageUrl, // Fallback
      
      // Price information
      price: product.minPrice,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      
      // Brand information (multiple formats for compatibility)
      brand: product.brand,
      brandId: product.brandId,
      
      // Category information
      category: product.category,
      categoryId: product.categoryId,
      
      // Additional metadata
      sellerCount: product.sellerCount,
      relevanceScore: product.relevanceScore,
      priceSpread: product.priceSpread,
      qualityScore: product.qualityScore,
      isVerified: product.isVerified,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }
  })

  return {
    ...searchResults,
    products: adaptedProducts
  }
}

/**
 * Adapts a single product for component consumption
 */
export function adaptProductForComponent(product) {
  if (!product) return null

  const result = adaptSearchResultsForComponents({
    products: [product]
  })

  return result.products[0]
}

/**
 * Validates that a product has the required structure for components
 */
export function validateProductStructure(product) {
  const errors = []

  if (!product) {
    errors.push('Product is null or undefined')
    return { isValid: false, errors }
  }

  // Check required fields
  if (!product.id) errors.push('Missing product.id')
  if (!product.name) errors.push('Missing product.name')
  
  // Check sellers structure
  if (!product.sellers || !Array.isArray(product.sellers)) {
    errors.push('Missing or invalid product.sellers array')
  } else if (product.sellers.length > 0) {
    const firstSeller = product.sellers[0]
    if (!firstSeller.seller || !firstSeller.seller.name) {
      errors.push('Invalid seller structure: missing seller.name')
    }
    if (firstSeller.price === undefined) {
      errors.push('Invalid seller structure: missing price')
    }
  }

  // Check images
  if (!product.images && !product.imageUrl && !product.image) {
    errors.push('Missing product images')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}