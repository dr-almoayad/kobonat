// lib/search/localSearchEngine.js - UPDATED FOR NEW TRANSLATION SCHEMA

/**
 * Calculate similarity between two strings (0-1, where 1 is exact match)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Levenshtein distance for fuzzy matching
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = [];
  
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

/**
 * Normalize text for searching
 */
function normalize(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim();
}

/**
 * Extract searchable text from an item based on current locale
 */
function getSearchableText(item, locale = 'en') {
  const fields = [];
  
  // Store search
  if (item.name) {
    fields.push(item.name);
    fields.push(item.description || '');
    fields.push(item.slug || '');
  }
  
  // Voucher search
  if (item.title) {
    fields.push(item.title);
    fields.push(item.description || '');
    fields.push(item.discount || '');
    fields.push(item.code || '');
    fields.push(item.type || '');
  }
  
  // Category names (translated)
  if (item.categories) {
    item.categories.forEach(cat => {
      fields.push(cat.name || '');
      fields.push(cat.slug || '');
    });
  }
  
  // Store name for vouchers
  if (item.store && item.store.name) {
    fields.push(item.store.name);
    fields.push(item.store.description || '');
    fields.push(item.store.slug || '');
  }
  
  return fields.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Score a single item against query
 */
function scoreItem(item, query, locale = 'en') {
  const normalizedQuery = normalize(query);
  const searchableText = getSearchableText(item, locale);
  
  if (!searchableText) return 0;
  
  let score = 0;
  
  // Exact name/title match (highest score)
  const name = normalize(item.name || item.title || '');
  if (name === normalizedQuery) {
    score += 1000;
  } else if (name.startsWith(normalizedQuery)) {
    score += 800;
  } else if (name.includes(normalizedQuery)) {
    score += 600;
  }
  
  // Searchable text contains query
  if (searchableText.includes(normalizedQuery)) {
    score += 400;
  }
  
  // Word-by-word matching
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
  queryWords.forEach(word => {
    if (searchableText.includes(word)) {
      score += 100;
    }
  });
  
  // Fuzzy matching for single words
  if (queryWords.length === 1 && queryWords[0].length >= 3) {
    const similarity = calculateSimilarity(queryWords[0], name);
    if (similarity > 0.7) {
      score += Math.floor(similarity * 200);
    }
  }
  
  // Boost for featured items
  if (item.isFeatured) {
    score += 50;
  }
  
  // Boost for exclusive vouchers
  if (item.isExclusive) {
    score += 30;
  }
  
  // Boost for verified vouchers
  if (item.isVerified) {
    score += 20;
  }
  
  // Boost by popularity
  if (item.popularityScore) {
    score += Math.min(item.popularityScore / 10, 100);
  }
  
  // Boost by voucher count for stores
  if (item._count && item._count.vouchers > 0) {
    score += Math.min(item._count.vouchers * 2, 50);
  }
  
  return score;
}

/**
 * Search stores - UPDATED for translation schema
 */
export function searchStores(query, stores, options = {}) {
  const {
    locale = 'en',
    limit = 20,
    categoryId = null
  } = options;
  
  if (!query || !query.trim()) {
    return {
      results: stores.slice(0, limit),
      total: stores.length,
      query: ''
    };
  }
  
  // Filter by category if specified
  let filteredStores = stores;
  if (categoryId) {
    filteredStores = stores.filter(store => 
      store.categories?.some(cat => cat.id === categoryId)
    );
  }
  
  // Score and sort
  const scored = filteredStores
    .map(store => ({
      ...store,
      _score: scoreItem(store, query, locale)
    }))
    .filter(store => store._score > 0)
    .sort((a, b) => b._score - a._score);
  
  return {
    results: scored.slice(0, limit),
    total: scored.length,
    query: query.trim()
  };
}

/**
 * Search vouchers - UPDATED for translation schema
 */
export function searchVouchers(query, vouchers, options = {}) {
  const {
    locale = 'en',
    limit = 50,
    storeId = null,
    type = null,
    activeOnly = true
  } = options;
  
  // Filter active vouchers
  let filteredVouchers = vouchers;
  
  if (activeOnly) {
    const now = new Date();
    filteredVouchers = filteredVouchers.filter(v => 
      !v.expiryDate || new Date(v.expiryDate) >= now
    );
  }
  
  if (storeId) {
    filteredVouchers = filteredVouchers.filter(v => v.storeId === storeId);
  }
  
  if (type) {
    filteredVouchers = filteredVouchers.filter(v => v.type === type);
  }
  
  // If no query, return filtered results
  if (!query || !query.trim()) {
    return {
      results: filteredVouchers
        .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
        .slice(0, limit),
      total: filteredVouchers.length,
      query: ''
    };
  }
  
  // Score and sort
  const scored = filteredVouchers
    .map(voucher => ({
      ...voucher,
      _score: scoreItem(voucher, query, locale)
    }))
    .filter(voucher => voucher._score > 0)
    .sort((a, b) => b._score - a._score);
  
  return {
    results: scored.slice(0, limit),
    total: scored.length,
    query: query.trim()
  };
}

/**
 * Combined search (stores and vouchers) - UPDATED
 */
export function searchAll(query, { stores, vouchers }, options = {}) {
  const {
    locale = 'en',
    limit = 20,
    type = 'all' // 'all', 'stores', 'vouchers'
  } = options;
  
  const results = {
    stores: [],
    vouchers: [],
    total: 0,
    query: query?.trim() || ''
  };
  
  if (!query || !query.trim()) {
    return results;
  }
  
  // Search stores
  if (type === 'all' || type === 'stores') {
    const storeResults = searchStores(query, stores, { 
      locale, 
      limit: type === 'stores' ? limit : Math.ceil(limit / 2) 
    });
    results.stores = storeResults.results;
  }
  
  // Search vouchers
  if (type === 'all' || type === 'vouchers') {
    const voucherResults = searchVouchers(query, vouchers, { 
      locale, 
      limit: type === 'vouchers' ? limit : Math.ceil(limit / 2) 
    });
    results.vouchers = voucherResults.results;
  }
  
  results.total = results.stores.length + results.vouchers.length;
  
  return results;
}

/**
 * Get autocomplete suggestions - UPDATED for translation schema
 */
export function getAutocompleteSuggestions(query, { stores, vouchers }, options = {}) {
  const {
    locale = 'en',
    limit = 8
  } = options;
  
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const normalizedQuery = normalize(query);
  const suggestions = new Set();
  
  // Store names
  stores.forEach(store => {
    const name = normalize(store.name);
    if (name.includes(normalizedQuery)) {
      suggestions.add({
        text: store.name,
        type: 'store',
        id: store.id,
        slug: store.slug,
        logo: store.logo
      });
    }
  });
  
  // Voucher keywords
  vouchers.forEach(voucher => {
    const title = normalize(voucher.title);
    const discount = normalize(voucher.discount || '');
    const storeName = normalize(voucher.store?.name || '');
    
    if (title.includes(normalizedQuery)) {
      suggestions.add({
        text: voucher.title,
        type: 'voucher',
        id: voucher.id,
        store: voucher.store
      });
    } else if (discount.includes(normalizedQuery)) {
      suggestions.add({
        text: voucher.discount,
        type: 'discount',
        id: voucher.id
      });
    } else if (storeName.includes(normalizedQuery)) {
      suggestions.add({
        text: `${voucher.store?.name} - ${voucher.title}`,
        type: 'voucher',
        id: voucher.id,
        store: voucher.store
      });
    }
  });
  
  // Category names from stores
  stores.forEach(store => {
    if (store.categories) {
      store.categories.forEach(cat => {
        const catName = normalize(cat.name);
        if (catName.includes(normalizedQuery)) {
          suggestions.add({
            text: cat.name,
            type: 'category',
            id: cat.id,
            slug: cat.slug
          });
        }
      });
    }
  });
  
  return Array.from(suggestions).slice(0, limit);
}

/**
 * Get trending searches (most popular stores/vouchers) - UPDATED
 */
export function getTrendingSearches({ stores, vouchers }, options = {}) {
  const {
    limit = 10,
    locale = 'en'
  } = options;
  
  const trending = [];
  
  // Top featured stores
  stores
    .filter(s => s.isFeatured)
    .slice(0, 5)
    .forEach(store => {
      trending.push({
        text: store.name,
        type: 'store',
        id: store.id,
        slug: store.slug,
        logo: store.logo
      });
    });
  
  // Popular vouchers (exclusive/verified with high popularity)
  vouchers
    .filter(v => v.isExclusive || v.isVerified)
    .sort((a, b) => {
      // Sort by exclusivity first, then popularity
      if (a.isExclusive && !b.isExclusive) return -1;
      if (!a.isExclusive && b.isExclusive) return 1;
      return (b.popularityScore || 0) - (a.popularityScore || 0);
    })
    .slice(0, 5)
    .forEach(voucher => {
      trending.push({
        text: voucher.title,
        type: 'voucher',
        id: voucher.id,
        discount: voucher.discount,
        store: voucher.store
      });
    });
  
  return trending.slice(0, limit);
}

/**
 * Filter stores by criteria - UPDATED for translation schema
 */
export function filterStores(stores, filters = {}) {
  const {
    categoryId,
    isFeatured,
    hasActiveVouchers,
    countryCode
  } = filters;
  
  let filtered = [...stores];
  
  if (categoryId) {
    filtered = filtered.filter(store =>
      store.categories?.some(cat => cat.id === categoryId)
    );
  }
  
  if (isFeatured !== undefined) {
    filtered = filtered.filter(store => store.isFeatured === isFeatured);
  }
  
  if (hasActiveVouchers) {
    filtered = filtered.filter(store => 
      store._count?.vouchers > 0 || store.activeVouchersCount > 0
    );
  }
  
  if (countryCode) {
    filtered = filtered.filter(store => 
      store.countries?.some(c => c.country?.code === countryCode) || 
      store.country === countryCode
    );
  }
  
  return filtered;
}

/**
 * Filter vouchers by criteria - UPDATED for translation schema
 */
export function filterVouchers(vouchers, filters = {}) {
  const {
    storeId,
    categoryId,
    type,
    isExclusive,
    isVerified,
    minDiscount,
    countryCode,
    activeOnly = true
  } = filters;
  
  let filtered = [...vouchers];
  
  // Active only (not expired)
  if (activeOnly) {
    const now = new Date();
    filtered = filtered.filter(v => 
      !v.expiryDate || new Date(v.expiryDate) >= now
    );
  }
  
  if (storeId) {
    filtered = filtered.filter(v => v.storeId === storeId);
  }
  
  if (categoryId) {
    filtered = filtered.filter(v =>
      v.store?.categories?.some(cat => cat.id === categoryId)
    );
  }
  
  if (type) {
    filtered = filtered.filter(v => v.type === type);
  }
  
  if (isExclusive !== undefined) {
    filtered = filtered.filter(v => v.isExclusive === isExclusive);
  }
  
  if (isVerified !== undefined) {
    filtered = filtered.filter(v => v.isVerified === isVerified);
  }
  
  if (minDiscount) {
    filtered = filtered.filter(v => {
      const discount = parseInt(v.discount?.match(/\d+/)?.[0] || '0');
      return discount >= minDiscount;
    });
  }
  
  if (countryCode) {
    filtered = filtered.filter(v =>
      v.countries?.some(c => c.country?.code === countryCode) ||
      v.country === countryCode
    );
  }
  
  return filtered;
}

/**
 * Quick search for header/search bar - optimized for performance
 */
export function quickSearch(query, { stores, vouchers }, options = {}) {
  const {
    locale = 'en',
    limit = 5
  } = options;
  
  if (!query || query.trim().length < 2) {
    return { stores: [], vouchers: [] };
  }
  
  const normalizedQuery = normalize(query);
  
  // Quick filter stores (name only for performance)
  const storeResults = stores
    .filter(store => {
      const name = normalize(store.name);
      return name.includes(normalizedQuery);
    })
    .slice(0, limit);
  
  // Quick filter vouchers (title and store name)
  const voucherResults = vouchers
    .filter(voucher => {
      const title = normalize(voucher.title);
      const storeName = normalize(voucher.store?.name || '');
      return title.includes(normalizedQuery) || storeName.includes(normalizedQuery);
    })
    .slice(0, limit);
  
  return {
    stores: storeResults,
    vouchers: voucherResults
  };
}

/**
 * Search with advanced filters
 */
export function advancedSearch(query, { stores, vouchers }, filters = {}) {
  const {
    locale = 'en',
    categoryId,
    storeId,
    type,
    minDiscount,
    maxDiscount,
    countryCode,
    sortBy = 'relevance', // relevance, popularity, newest, discount
    limit = 20,
    page = 1
  } = filters;
  
  const offset = (page - 1) * limit;
  
  // Start with all items
  let storeResults = [...stores];
  let voucherResults = [...vouchers];
  
  // Apply country filter
  if (countryCode) {
    storeResults = filterStores(storeResults, { countryCode });
    voucherResults = filterVouchers(voucherResults, { countryCode });
  }
  
  // Apply category filter
  if (categoryId) {
    storeResults = filterStores(storeResults, { categoryId });
    voucherResults = filterVouchers(voucherResults, { categoryId });
  }
  
  // Apply store filter (for vouchers)
  if (storeId) {
    voucherResults = voucherResults.filter(v => v.storeId === storeId);
  }
  
  // Apply type filter (for vouchers)
  if (type) {
    voucherResults = voucherResults.filter(v => v.type === type);
  }
  
  // Apply discount filters (for vouchers)
  if (minDiscount || maxDiscount) {
    voucherResults = voucherResults.filter(v => {
      const discount = parseInt(v.discount?.match(/\d+/)?.[0] || '0');
      const min = minDiscount || 0;
      const max = maxDiscount || 100;
      return discount >= min && discount <= max;
    });
  }
  
  // If query exists, perform search
  if (query && query.trim()) {
    const searchOpts = { locale, limit: 100 }; // Get more for sorting
    
    // Search stores
    const storeSearch = searchStores(query, storeResults, searchOpts);
    storeResults = storeSearch.results;
    
    // Search vouchers
    const voucherSearch = searchVouchers(query, voucherResults, searchOpts);
    voucherResults = voucherSearch.results;
  }
  
  // Sort results
  if (sortBy === 'popularity') {
    storeResults.sort((a, b) => (b._count?.vouchers || 0) - (a._count?.vouchers || 0));
    voucherResults.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
  } else if (sortBy === 'newest') {
    storeResults.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    voucherResults.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (sortBy === 'discount') {
    voucherResults.sort((a, b) => {
      const discountA = parseInt(a.discount?.match(/\d+/)?.[0] || '0');
      const discountB = parseInt(b.discount?.match(/\d+/)?.[0] || '0');
      return discountB - discountA;
    });
  }
  
  // Paginate
  const paginatedStores = storeResults.slice(offset, offset + limit);
  const paginatedVouchers = voucherResults.slice(offset, offset + limit);
  
  return {
    stores: paginatedStores,
    vouchers: paginatedVouchers,
    total: storeResults.length + voucherResults.length,
    totalStores: storeResults.length,
    totalVouchers: voucherResults.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil((storeResults.length + voucherResults.length) / limit),
      hasNext: (offset + limit) < (storeResults.length + voucherResults.length),
      hasPrev: page > 1
    }
  };
}

export default {
  searchStores,
  searchVouchers,
  searchAll,
  quickSearch,
  advancedSearch,
  getAutocompleteSuggestions,
  getTrendingSearches,
  filterStores,
  filterVouchers,
  calculateSimilarity,
  normalize
};