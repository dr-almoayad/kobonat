/**
 * Intelligent Search Engine with Automatic Spell Correction
 * Zero configuration - learns from your product catalog automatically
 */

// Calculate Levenshtein distance (edit distance between strings)
const levenshteinDistance = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[s2.length][s1.length];
};

// Calculate similarity score (0-1, where 1 is exact match)
const calculateSimilarity = (str1, str2) => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLength);
};

// Check if strings sound similar (basic phonetic matching)
const soundsSimilar = (str1, str2) => {
  const s1 = str1.toLowerCase().replace(/[^a-z]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z]/g, '');
  
  // Check for common typos
  const commonTypos = {
    'ph': 'f', 'gh': 'f', 'tion': 'shun', 'sion': 'shun',
    'c': 'k', 'ck': 'k', 'qu': 'kw', 'x': 'ks'
  };
  
  let normalized1 = s1;
  let normalized2 = s2;
  
  Object.entries(commonTypos).forEach(([from, to]) => {
    normalized1 = normalized1.replace(new RegExp(from, 'g'), to);
    normalized2 = normalized2.replace(new RegExp(from, 'g'), to);
  });
  
  return calculateSimilarity(normalized1, normalized2) > 0.7;
};

/**
 * Build search index from products
 * Automatically extracts brands, categories, and searchable terms
 */
export const buildSearchIndex = (products) => {
  const index = {
    brands: new Map(),
    categories: new Map(),
    terms: new Map(),
    products: new Map()
  };
  
  products.forEach((product, idx) => {
    const productId = product.id || idx;
    
    // Index product
    index.products.set(productId, product);
    
    // Extract and index brand
    const brand = product.productAttributes?.find(a => a.key === "Brand")?.value || product.brand;
    if (brand) {
      const brandLower = brand.toLowerCase();
      if (!index.brands.has(brandLower)) {
        index.brands.set(brandLower, { original: brand, products: [], count: 0 });
      }
      index.brands.get(brandLower).products.push(productId);
      index.brands.get(brandLower).count++;
    }
    
    // Extract and index category
    const category = typeof product.category === 'string' ? product.category : product.category?.name;
    if (category) {
      const categoryLower = category.toLowerCase();
      if (!index.categories.has(categoryLower)) {
        index.categories.set(categoryLower, { original: category, products: [], count: 0 });
      }
      index.categories.get(categoryLower).products.push(productId);
      index.categories.get(categoryLower).count++;
    }
    
    // Extract and index product name/title
    const name = product.name || product.title || '';
    if (name) {
      // Tokenize name into words
      const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      words.forEach(word => {
        if (!index.terms.has(word)) {
          index.terms.set(word, { original: word, products: new Set(), count: 0 });
        }
        index.terms.get(word).products.add(productId);
        index.terms.get(word).count++;
      });
    }
    
    // Index all attributes
    if (product.productAttributes) {
      product.productAttributes.forEach(attr => {
        if (attr.value) {
          const value = String(attr.value).toLowerCase();
          const words = value.split(/\s+/).filter(w => w.length > 2);
          words.forEach(word => {
            if (!index.terms.has(word)) {
              index.terms.set(word, { original: word, products: new Set(), count: 0 });
            }
            index.terms.get(word).products.add(productId);
            index.terms.get(word).count++;
          });
        }
      });
    }
  });
  
  return index;
};

/**
 * Find spelling corrections for a query term
 */
export const findSpellingCorrections = (term, index, maxSuggestions = 3) => {
  const termLower = term.toLowerCase();
  const suggestions = [];
  
  // Check brands
  index.brands.forEach((data, brandLower) => {
    const similarity = calculateSimilarity(termLower, brandLower);
    if (similarity > 0.6 && similarity < 0.95) { // Not exact match but similar
      suggestions.push({
        term: data.original,
        type: 'brand',
        similarity,
        count: data.count,
        confidence: similarity * 0.9 // Brands have high confidence
      });
    }
  });
  
  // Check categories
  index.categories.forEach((data, categoryLower) => {
    const similarity = calculateSimilarity(termLower, categoryLower);
    if (similarity > 0.6 && similarity < 0.95) {
      suggestions.push({
        term: data.original,
        type: 'category',
        similarity,
        count: data.count,
        confidence: similarity * 0.8
      });
    }
  });
  
  // Check general terms
  index.terms.forEach((data, termKey) => {
    if (termKey.length >= 3) {
      const similarity = calculateSimilarity(termLower, termKey);
      if (similarity > 0.65 && similarity < 0.95) {
        suggestions.push({
          term: data.original,
          type: 'term',
          similarity,
          count: data.count,
          confidence: similarity * 0.7
        });
      }
    }
  });
  
  // Sort by confidence and popularity
  suggestions.sort((a, b) => {
    const scoreA = a.confidence * 0.7 + (a.count / 1000) * 0.3;
    const scoreB = b.confidence * 0.7 + (b.count / 1000) * 0.3;
    return scoreB - scoreA;
  });
  
  // Return top unique suggestions
  const seen = new Set();
  return suggestions
    .filter(s => {
      const key = s.term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxSuggestions);
};

/**
 * Get autocomplete suggestions
 */
export const getAutocompleteSuggestions = (query, index, maxSuggestions = 8) => {
  const queryLower = query.toLowerCase().trim();
  if (queryLower.length < 2) return [];
  
  const suggestions = [];
  
  // Exact prefix matches from brands (highest priority)
  index.brands.forEach((data, brandLower) => {
    if (brandLower.startsWith(queryLower)) {
      suggestions.push({
        text: data.original,
        type: 'brand',
        count: data.count,
        score: 100 + data.count
      });
    }
  });
  
  // Partial matches from brands
  index.brands.forEach((data, brandLower) => {
    if (!brandLower.startsWith(queryLower) && brandLower.includes(queryLower)) {
      suggestions.push({
        text: data.original,
        type: 'brand',
        count: data.count,
        score: 80 + data.count
      });
    }
  });
  
  // Category matches
  index.categories.forEach((data, categoryLower) => {
    if (categoryLower.startsWith(queryLower) || categoryLower.includes(queryLower)) {
      suggestions.push({
        text: data.original,
        type: 'category',
        count: data.count,
        score: 70 + data.count
      });
    }
  });
  
  // Term matches
  index.terms.forEach((data, termKey) => {
    if (termKey.length >= 3 && (termKey.startsWith(queryLower) || termKey.includes(queryLower))) {
      suggestions.push({
        text: data.original,
        type: 'term',
        count: data.count,
        score: 50 + data.count
      });
    }
  });
  
  // Sort by score and remove duplicates
  const seen = new Set();
  return suggestions
    .sort((a, b) => b.score - a.score)
    .filter(s => {
      const key = s.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxSuggestions);
};

/**
 * Search products with intelligent matching
 */
export const searchProducts = (query, products, index) => {
  const queryLower = query.toLowerCase().trim();
  if (!queryLower) return { results: products, corrections: [], query };
  
  const tokens = queryLower.split(/\s+/);
  const results = [];
  const productScores = new Map();
  
  products.forEach((product) => {
    let score = 0;
    const productId = product.id || products.indexOf(product);
    
    // Get searchable text from product
    const searchableText = [
      product.name,
      product.title,
      product.brand,
      product.productAttributes?.find(a => a.key === "Brand")?.value,
      typeof product.category === 'string' ? product.category : product.category?.name,
      ...(product.productAttributes?.map(a => a.value) || [])
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Exact phrase match (highest score)
    if (searchableText.includes(queryLower)) {
      score += 1000;
    }
    
    // Token matching
    tokens.forEach(token => {
      if (searchableText.includes(token)) {
        score += 100;
        
        // Bonus for matches in important fields
        const brand = (product.brand || product.productAttributes?.find(a => a.key === "Brand")?.value || '').toLowerCase();
        const name = (product.name || product.title || '').toLowerCase();
        
        if (brand.includes(token)) score += 200;
        if (name.includes(token)) score += 150;
        
        // Bonus for prefix matches
        if (brand.startsWith(token) || name.startsWith(token)) {
          score += 100;
        }
      }
    });
    
    // Fuzzy matching for single word queries
    if (tokens.length === 1 && tokens[0].length >= 3) {
      const brand = (product.brand || product.productAttributes?.find(a => a.key === "Brand")?.value || '').toLowerCase();
      const similarity = calculateSimilarity(tokens[0], brand);
      if (similarity > 0.7) {
        score += Math.floor(similarity * 50);
      }
    }
    
    if (score > 0) {
      productScores.set(productId, score);
      results.push(product);
    }
  });
  
  // Sort by score
  results.sort((a, b) => {
    const idA = a.id || products.indexOf(a);
    const idB = b.id || products.indexOf(b);
    return (productScores.get(idB) || 0) - (productScores.get(idA) || 0);
  });
  
  // Find spelling corrections if results are poor
  let corrections = [];
  if (results.length < 5) {
    tokens.forEach(token => {
      if (token.length >= 3) {
        const tokenCorrections = findSpellingCorrections(token, index, 2);
        corrections.push(...tokenCorrections);
      }
    });
    
    // Remove duplicates and sort by confidence
    const seen = new Set();
    corrections = corrections
      .filter(c => {
        const key = c.term.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }
  
  return {
    results,
    corrections,
    query,
    resultCount: results.length,
    hasCorrections: corrections.length > 0
  };
};

/**
 * Get popular searches (trending)
 */
export const getPopularSearches = (index, limit = 10) => {
  const popular = [];
  
  // Get top brands
  index.brands.forEach((data, key) => {
    popular.push({
      term: data.original,
      type: 'brand',
      count: data.count
    });
  });
  
  // Get top categories
  index.categories.forEach((data, key) => {
    popular.push({
      term: data.original,
      type: 'category',
      count: data.count
    });
  });
  
  return popular
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export default {
  buildSearchIndex,
  findSpellingCorrections,
  getAutocompleteSuggestions,
  searchProducts,
  getPopularSearches,
  calculateSimilarity,
  levenshteinDistance
};