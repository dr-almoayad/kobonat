// lib/services/enhancedSearchEngine.js - Improved search with better product normalization
import { PrismaClient } from '@prisma/client'
import { ProductNormalizer } from './productMatcher.js'

const prisma = new PrismaClient()

export class EnhancedSearchEngine {
  constructor() {
    this.normalizer = new ProductNormalizer()
    
    // Enhanced synonyms and brand mappings
    this.synonyms = {
      'phone': ['smartphone', 'mobile', 'cell phone', 'cellphone', 'iphone', 'android'],
      'laptop': ['notebook', 'computer', 'pc', 'macbook'],
      'tv': ['television', 'smart tv', 'led tv', 'oled', 'monitor'],
      'headphones': ['earphones', 'earbuds', 'headset', 'airpods'],
      'tablet': ['ipad', 'android tablet', 'tab'],
      'gaming': ['game', 'games', 'video game', 'console'],
      'wireless': ['bluetooth', 'wifi', 'cordless'],
      'storage': ['memory', 'hard drive', 'ssd', 'hdd', 'nvme'],
      'watch': ['smartwatch', 'timepiece'],
      'speaker': ['audio', 'sound', 'bluetooth speaker']
    }
    
    this.brandAliases = {
      'apple': ['iphone', 'ipad', 'macbook', 'imac', 'airpods', 'apple watch'],
      'samsung': ['galaxy', 'note', 'samsung galaxy'],
      'google': ['pixel', 'nest', 'google pixel'],
      'microsoft': ['surface', 'xbox', 'windows'],
      'sony': ['playstation', 'ps4', 'ps5', 'bravia', 'walkman'],
      'dell': ['alienware', 'inspiron', 'xps'],
      'hp': ['hewlett packard', 'pavilion', 'elitebook'],
      'lenovo': ['thinkpad', 'ideapad', 'yoga'],
      'nintendo': ['switch', 'nintendo switch'],
      'lg': ['life is good']
    }

    this.categoryMappings = {
      'smartphones': ['phone', 'mobile', 'smartphone', 'iphone', 'android', 'cellular'],
      'laptops': ['laptop', 'notebook', 'computer', 'macbook', 'ultrabook'],
      'tablets': ['tablet', 'ipad', 'tab', 'slate'],
      'headphones': ['headphones', 'earbuds', 'earphones', 'airpods', 'headset'],
      'tvs': ['tv', 'television', 'smart tv', 'led tv', 'oled'],
      'gaming': ['gaming', 'console', 'playstation', 'xbox', 'nintendo'],
      'watches': ['watch', 'smartwatch', 'timepiece', 'apple watch'],
      'speakers': ['speaker', 'audio', 'bluetooth speaker', 'sound']
    }
  }
  
  // Expand query terms with synonyms and brand aliases
  expandQuery(query) {
    const expandedTerms = new Set([query.toLowerCase()])
    const words = query.toLowerCase().split(/\s+/)
    
    // Add synonyms
    for (const word of words) {
      if (this.synonyms[word]) {
        this.synonyms[word].forEach(synonym => expandedTerms.add(synonym))
      }
      
      // Add partial matches for longer words
      if (word.length > 4) {
        expandedTerms.add(word.substring(0, 4))
      }
    }
    
    // Add brand aliases
    for (const word of words) {
      for (const [brand, aliases] of Object.entries(this.brandAliases)) {
        if (aliases.includes(word) || word === brand) {
          expandedTerms.add(brand)
          aliases.forEach(alias => expandedTerms.add(alias))
        }
      }
    }
    
    return Array.from(expandedTerms)
  }
  
  // Parse search query to extract intent
  parseSearchQuery(query) {
    const normalizedQuery = this.normalizer.normalizeText(query)
    
    const intent = {
      brand: null,
      capacity: null,
      color: null,
      size: null,
      priceRange: null,
      category: null,
      mainQuery: query,
      expandedTerms: this.expandQuery(query),
      originalWords: query.toLowerCase().split(/\s+/)
    }
    
    // Extract attributes using the normalizer
    const attributes = this.normalizer.extractAttributes(query)
    intent.brand = attributes.brand
    intent.capacity = attributes.capacity
    intent.color = attributes.color
    intent.size = attributes.size
    
    // Extract price range patterns
    const pricePatterns = [
      /under\s*\$?(\d+)/i,
      /below\s*\$?(\d+)/i,
      /less\s+than\s*\$?(\d+)/i,
      /cheaper\s+than\s*\$?(\d+)/i
    ]
    
    for (const pattern of pricePatterns) {
      const match = query.match(pattern)
      if (match) {
        intent.priceRange = { max: parseInt(match[1]) }
        break
      }
    }
    
    const rangeMatch = query.match(/between\s*\$?(\d+)\s*and\s*\$?(\d+)|from\s*\$?(\d+)\s*to\s*\$?(\d+)/i)
    if (rangeMatch) {
      intent.priceRange = {
        min: parseInt(rangeMatch[1] || rangeMatch[3]),
        max: parseInt(rangeMatch[2] || rangeMatch[4])
      }
    }
    
    // Detect category hints
    for (const [category, keywords] of Object.entries(this.categoryMappings)) {
      if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
        intent.category = category
        break
      }
    }
    
    return intent
  }

  // Build comprehensive WHERE conditions for search
  buildWhereConditions(intent, filters = {}) {
    const conditions = {
      AND: [
        { sellers: { some: {} } } // Only products with sellers
      ]
    }
    
    // Text search across multiple fields with OR conditions
    if (intent.expandedTerms.length > 0) {
      const textSearchConditions = []
      
      // Search in product name
      textSearchConditions.push({
        name: {
          contains: intent.mainQuery,
          mode: 'insensitive'
        }
      })
      
      // Search in normalized name if it exists
      textSearchConditions.push({
        normalizedName: {
          contains: intent.mainQuery,
          mode: 'insensitive'
        }
      })
      
      // Search in description
      textSearchConditions.push({
        description: {
          contains: intent.mainQuery,
          mode: 'insensitive'
        }
      })
      
      // Search in model field
      textSearchConditions.push({
        model: {
          contains: intent.mainQuery,
          mode: 'insensitive'
        }
      })
      
      // Search in brand name
      textSearchConditions.push({
        brand: {
          name: {
            contains: intent.mainQuery,
            mode: 'insensitive'
          }
        }
      })
      
      // Search in category name
      textSearchConditions.push({
        category: {
          name: {
            contains: intent.mainQuery,
            mode: 'insensitive'
          }
        }
      })
      
      // Add expanded terms search
      for (const term of intent.expandedTerms) {
        if (term !== intent.mainQuery.toLowerCase()) {
          textSearchConditions.push({
            name: {
              contains: term,
              mode: 'insensitive'
            }
          })
          
          textSearchConditions.push({
            brand: {
              name: {
                contains: term,
                mode: 'insensitive'
              }
            }
          })
        }
      }
      
      conditions.AND.push({
        OR: textSearchConditions
      })
    }
    
    // Apply extracted intent filters
    if (intent.brand) {
      conditions.AND.push({
        brand: {
          name: {
            contains: intent.brand,
            mode: 'insensitive'
          }
        }
      })
    }

    if (intent.capacity) {
      conditions.AND.push({
        OR: [
          {
            capacity: {
              contains: intent.capacity,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: intent.capacity,
              mode: 'insensitive'
            }
          }
        ]
      })
    }

    if (intent.color) {
      conditions.AND.push({
        OR: [
          {
            color: {
              contains: intent.color,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: intent.color,
              mode: 'insensitive'
            }
          }
        ]
      })
    }

    if (intent.size) {
      conditions.AND.push({
        OR: [
          {
            size: {
              contains: intent.size,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: intent.size,
              mode: 'insensitive'
            }
          }
        ]
      })
    }
    
    // Apply additional filters
    if (filters.brandId) {
      conditions.AND.push({
        brandId: { equals: parseInt(filters.brandId) }
      })
    }
    
    if (filters.brand) {
      conditions.AND.push({
        brand: {
          name: {
            contains: filters.brand,
            mode: 'insensitive'
          }
        }
      })
    }
    
    if (filters.categoryId) {
      conditions.AND.push({
        categoryId: { equals: parseInt(filters.categoryId) }
      })
    }
    
    if (filters.category) {
      conditions.AND.push({
        category: {
          name: {
            contains: filters.category,
            mode: 'insensitive'
          }
        }
      })
    }
    
    // Price filtering
    if (filters.minPrice || filters.maxPrice || intent.priceRange) {
      const priceCondition = {
        sellers: {
          some: {
            price: {}
          }
        }
      }
      
      if (filters.minPrice) {
        priceCondition.sellers.some.price.gte = parseFloat(filters.minPrice)
      }
      if (filters.maxPrice) {
        priceCondition.sellers.some.price.lte = parseFloat(filters.maxPrice)
      }
      if (intent.priceRange?.min) {
        priceCondition.sellers.some.price.gte = intent.priceRange.min
      }
      if (intent.priceRange?.max) {
        priceCondition.sellers.some.price.lte = intent.priceRange.max
      }
      
      conditions.AND.push(priceCondition)
    }
    
    // Attribute filters (color, capacity, etc.)
    if (filters.color) {
      conditions.AND.push({
        OR: [
          {
            color: {
              contains: filters.color,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: filters.color,
              mode: 'insensitive'
            }
          }
        ]
      })
    }
    
    if (filters.capacity) {
      conditions.AND.push({
        OR: [
          {
            capacity: {
              contains: filters.capacity,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: filters.capacity,
              mode: 'insensitive'
            }
          }
        ]
      })
    }
    
    return conditions
  }

  // Enhanced relevance scoring
  calculateRelevanceScore(product, intent) {
    let score = 0
    
    const productText = [
      product.name?.toLowerCase() || '',
      product.normalizedName?.toLowerCase() || '',
      product.description?.toLowerCase() || '',
      product.model?.toLowerCase() || '',
      product.brand?.name?.toLowerCase() || ''
    ].join(' ')
    
    // Exact query match in any field
    if (productText.includes(intent.mainQuery.toLowerCase())) {
      score += 100
    }
    
    // Brand matching
    if (intent.brand && product.brand?.name?.toLowerCase() === intent.brand.toLowerCase()) {
      score += 80
    }
    
    // Check if any of the original query words appear in the product
    for (const word of intent.originalWords) {
      if (productText.includes(word)) {
        score += 20
      }
    }
    
    // Expanded terms matching
    for (const term of intent.expandedTerms) {
      if (productText.includes(term)) {
        score += 10
      }
    }
    
    // Attribute matches
    if (intent.capacity && (product.capacity?.toLowerCase().includes(intent.capacity.toLowerCase()) || 
        productText.includes(intent.capacity.toLowerCase()))) {
      score += 30
    }
    
    if (intent.color && (product.color?.toLowerCase().includes(intent.color.toLowerCase()) || 
        productText.includes(intent.color.toLowerCase()))) {
      score += 25
    }
    
    if (intent.size && (product.size?.toLowerCase().includes(intent.size.toLowerCase()) || 
        productText.includes(intent.size.toLowerCase()))) {
      score += 20
    }
    
    // Product name length bonus (more descriptive names often better)
    if (product.name && product.name.length > 30) {
      score += 5
    }
    
    // Multiple sellers bonus (popular products)
    if (product.sellers && product.sellers.length > 1) {
      score += product.sellers.length * 3
    }
    
    // Recent products bonus
    if (product.createdAt) {
      const daysSinceCreated = (new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 30) {
        score += 10
      }
    }
    
    // Quality score bonus if available
    if (product.qualityScore && product.qualityScore > 0.7) {
      score += 15
    }
    
    return Math.max(0, score)
  }

  // Enhanced search with better product processing
  async search(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      filters = {}
    } = options
    
    const intent = this.parseSearchQuery(query)
    const offset = (page - 1) * limit
    
    const whereConditions = this.buildWhereConditions(intent, filters)
    
    try {
      // Get products with comprehensive includes
      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where: whereConditions,
          include: {
            brand: {
              select: { id: true, name: true, logo: true, slug: true }
            },
            category: {
              select: { id: true, name: true, image: true, slug: true }
            },
            sellers: {
              include: {
                seller: {
                  select: { id: true, name: true, website: true, logoUrl: true }
                }
              },
              orderBy: { price: 'asc' },
              take: 10 // Get more sellers for better comparison
            },
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, alt: true }
            },
            // Include all images as fallback
            _count: {
              select: {
                sellers: true,
                images: true
              }
            }
          },
          skip: offset,
          take: limit * 2 // Get more results to allow for better sorting
        }),
        prisma.product.count({
          where: whereConditions
        })
      ])
      
      // Process and enhance results
      const enhancedResults = products.map(product => {
        const sellers = product.sellers || []
        const prices = sellers.map(s => parseFloat(s.price)).filter(p => !isNaN(p))
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
        
        // Calculate relevance score
        const relevanceScore = this.calculateRelevanceScore(product, intent)
        
        return {
          id: product.id,
          name: product.name,
          normalizedName: product.normalizedName,
          slug: product.slug,
          description: product.description,
          brand: product.brand?.name,
          brandId: product.brand?.id,
          model: product.model,
          capacity: product.capacity,
          color: product.color,
          size: product.size,
          variant: product.variant,
          category: product.category?.name,
          categoryId: product.category?.id,
          imageUrl: product.images[0]?.url,
          minPrice,
          maxPrice,
          sellerCount: sellers.length,
          sellers: sellers.slice(0, 5).map(seller => ({
            id: seller.seller.id,
            name: seller.seller.name,
            price: parseFloat(seller.price),
            currency: seller.currency || 'USD',
            shippingCost: parseFloat(seller.shippingCost || 0),
            deliveryTime: seller.deliveryTime,
            availability: seller.availability,
            website: seller.seller.website,
            url: seller.productUrl,
            logoUrl: seller.seller.logoUrl,
            lastScraped: seller.lastScraped
          })),
          relevanceScore,
          priceSpread: sellers.length > 1 ? maxPrice - minPrice : 0,
          qualityScore: product.qualityScore || 0,
          isVerified: product.isVerified || false,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }
      })
      
      // Sort results
      let sortedResults = enhancedResults
      
      switch (sortBy) {
        case 'relevance':
          sortedResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
          break
        case 'price_low':
          sortedResults.sort((a, b) => (a.minPrice || Infinity) - (b.minPrice || Infinity))
          break
        case 'price_high':
          sortedResults.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0))
          break
        case 'newest':
          sortedResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case 'popularity':
          sortedResults.sort((a, b) => b.sellerCount - a.sellerCount)
          break
        default:
          sortedResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
      }
      
      // Return only the requested number of results
      const finalResults = sortedResults.slice(0, limit)
      
      return {
        products: finalResults,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
        searchIntent: intent,
        appliedFilters: filters,
        searchStats: {
          totalProducts: totalCount,
          avgRelevanceScore: finalResults.reduce((sum, p) => sum + p.relevanceScore, 0) / finalResults.length || 0,
          brandMatches: finalResults.filter(p => intent.brand && p.brand?.toLowerCase().includes(intent.brand.toLowerCase())).length
        }
      }
      
    } catch (error) {
      console.error('Enhanced search error:', error)
      throw new Error('Search failed: ' + error.message)
    }
  }

  // Enhanced suggestions with better product matching
  async getSearchSuggestions(query, limit = 10) {
    if (!query || query.length < 2) return []
    
    const normalizedQuery = query.toLowerCase().trim()
    const intent = this.parseSearchQuery(query)
    
    try {
      const suggestions = []
      
      // Brand suggestions with product count
      const brands = await prisma.brand.findMany({
        where: {
          name: { contains: normalizedQuery, mode: 'insensitive' }
        },
        include: {
          _count: {
            select: { 
              products: {
                where: {
                  sellers: { some: {} }
                }
              }
            }
          }
        },
        take: 4
      })
      
      brands.forEach(brand => {
        if (brand._count.products > 0) {
          suggestions.push({
            type: 'brand',
            text: brand.name,
            label: `${brand.name}`,
            subtitle: `${brand._count.products} products`,
            count: brand._count.products,
            brandId: brand.id
          })
        }
      })
      
      // Product suggestions with enhanced data
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: normalizedQuery, mode: 'insensitive' } },
            { normalizedName: { contains: normalizedQuery, mode: 'insensitive' } },
            { model: { contains: normalizedQuery, mode: 'insensitive' } },
            { brand: { name: { contains: normalizedQuery, mode: 'insensitive' } } }
          ],
          sellers: { some: {} }
        },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          sellers: {
            orderBy: { price: 'asc' },
            take: 1
          },
          images: { 
            where: { isPrimary: true },
            take: 1 
          }
        },
        take: 8
      })
      
      // Calculate relevance for product suggestions
      const productSuggestions = products.map(product => {
        const relevanceScore = this.calculateRelevanceScore(product, intent)
        const minPrice = product.sellers[0] ? parseFloat(product.sellers[0].price) : 0
        
        return {
          type: 'product',
          text: product.normalizedName || product.name,
          label: product.name,
          subtitle: product.brand?.name || product.category?.name,
          price: minPrice,
          productId: product.id,
          slug: product.slug,
          imageUrl: product.images[0]?.url,
          brand: product.brand?.name,
          relevanceScore
        }
      })
      
      // Sort product suggestions by relevance
      productSuggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)
      suggestions.push(...productSuggestions.slice(0, 5))
      
      // Category suggestions
      const categories = await prisma.category.findMany({
        where: {
          name: { contains: normalizedQuery, mode: 'insensitive' }
        },
        include: {
          _count: {
            select: { 
              products: {
                where: {
                  sellers: { some: {} }
                }
              }
            }
          }
        },
        take: 3
      })
      
      categories.forEach(category => {
        if (category._count.products > 0) {
          suggestions.push({
            type: 'category',
            text: category.name,
            label: category.name,
            subtitle: `${category._count.products} products`,
            count: category._count.products,
            categoryId: category.id
          })
        }
      })
      
      return suggestions.slice(0, limit)
      
    } catch (error) {
      console.error('Enhanced search suggestions error:', error)
      return []
    }
  }

  // Fuzzy search with enhanced fallback
  async fuzzySearch(query, options = {}) {
    // Try exact search first
    const exactResults = await this.search(query, options)
    
    if (exactResults.totalCount > 0) {
      return exactResults
    }
    
    // Generate fuzzy variations
    const words = query.toLowerCase().split(/\s+/)
    const fuzzyQueries = new Set()
    
    // Add individual words
    words.forEach(word => {
      if (word.length > 3) {
        fuzzyQueries.add(word)
      }
    })
    
    // Add brand variations
    for (const [brand, aliases] of Object.entries(this.brandAliases)) {
      if (words.some(word => aliases.includes(word) || word === brand)) {
        fuzzyQueries.add(brand)
        aliases.forEach(alias => fuzzyQueries.add(alias))
      }
    }
    
    // Add synonym variations
    words.forEach(word => {
      if (this.synonyms[word]) {
        this.synonyms[word].forEach(synonym => fuzzyQueries.add(synonym))
      }
    })
    
    if (fuzzyQueries.size === 0) {
      return exactResults
    }
    
    // Try fuzzy search with combined terms
    const fuzzyQuery = Array.from(fuzzyQueries).join(' ')
    const fuzzyResults = await this.search(fuzzyQuery, options)
    
    fuzzyResults.isFuzzyMatch = true
    fuzzyResults.originalQuery = query
    fuzzyResults.correctedQuery = fuzzyQuery
    
    return fuzzyResults
  }

  // Get facets for filtering
  async getSearchFacets(query, currentFilters = {}) {
    const intent = this.parseSearchQuery(query)
    const baseConditions = this.buildWhereConditions(intent, {})
    
    try {
      const [brands, categories, priceStats, capacities, colors, sizes] = await Promise.all([
        // Enhanced brands aggregation
        prisma.product.groupBy({
          by: ['brandId'],
          where: baseConditions,
          _count: true,
          orderBy: {
            _count: {
              brandId: 'desc'
            }
          },
          take: 20
        }).then(async (brandGroups) => {
          const brandIds = brandGroups.map(g => g.brandId).filter(Boolean)
          if (brandIds.length === 0) return []
          
          const brands = await prisma.brand.findMany({
            where: { id: { in: brandIds } },
            select: { id: true, name: true, logo: true }
          })
          
          return brandGroups.map(group => {
            const brand = brands.find(b => b.id === group.brandId)
            return brand ? {
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              count: group._count
            } : null
          }).filter(Boolean)
        }),
        
        // Enhanced categories aggregation
        prisma.product.groupBy({
          by: ['categoryId'],
          where: baseConditions,
          _count: true,
          orderBy: {
            _count: {
              categoryId: 'desc'
            }
          },
          take: 15
        }).then(async (categoryGroups) => {
          const categoryIds = categoryGroups.map(g => g.categoryId)
          const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, image: true }
          })
          
          return categoryGroups.map(group => {
            const category = categories.find(c => c.id === group.categoryId)
            return category ? {
              id: category.id,
              name: category.name,
              image: category.image,
              count: group._count
            } : null
          }).filter(Boolean)
        }),
        
        // Enhanced price statistics
        prisma.sellerProduct.aggregate({
          where: {
            product: baseConditions
          },
          _min: { price: true },
          _max: { price: true },
          _avg: { price: true }
        }),
        
        // Capacity options with proper grouping
        prisma.product.groupBy({
          by: ['capacity'],
          where: {
            ...baseConditions,
            capacity: { not: null }
          },
          _count: true,
          orderBy: {
            _count: {
              capacity: 'desc'
            }
          },
          take: 10
        }),
        
        // Color options with proper grouping
        prisma.product.groupBy({
          by: ['color'],
          where: {
            ...baseConditions,
            color: { not: null }
          },
          _count: true,
          orderBy: {
            _count: {
              color: 'desc'
            }
          },
          take: 10
        }),
        
        // Size options with proper grouping
        prisma.product.groupBy({
          by: ['size'],
          where: {
            ...baseConditions,
            size: { not: null }
          },
          _count: true,
          orderBy: {
            _count: {
              size: 'desc'
            }
          },
          take: 8
        })
      ])
      
      return {
        brands,
        categories,
        capacities: capacities.map(c => ({
          value: c.capacity,
          count: c._count
        })),
        colors: colors.map(c => ({
          value: c.color,
          count: c._count
        })),
        sizes: sizes.map(s => ({
          value: s.size,
          count: s._count
        })),
        priceRange: {
          min: priceStats._min.price ? parseFloat(priceStats._min.price) : 0,
          max: priceStats._max.price ? parseFloat(priceStats._max.price) : 1000,
          avg: priceStats._avg.price ? parseFloat(priceStats._avg.price) : 500
        }
      }
      
    } catch (error) {
      console.error('Enhanced facets error:', error)
      return {
        brands: [],
        categories: [],
        capacities: [],
        colors: [],
        sizes: [],
        priceRange: { min: 0, max: 1000, avg: 500 }
      }
    }
  }

  // Get trending searches based on popular products
  async getTrendingSearches(limit = 10) {
    try {
      const trending = await prisma.product.findMany({
        where: {
          sellers: { some: {} }
        },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          sellers: {
            orderBy: { price: 'asc' },
            take: 1
          },
          _count: {
            select: { sellers: true }
          }
        },
        orderBy: [
          { sellers: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: limit
      })
      
      return trending.map(product => ({
        query: product.normalizedName || product.name,
        category: product.category?.name,
        brand: product.brand?.name,
        minPrice: product.sellers[0] ? parseFloat(product.sellers[0].price) : 0,
        productId: product.id,
        slug: product.slug,
        popularity: product._count.sellers,
        searchTerms: [
          product.brand?.name,
          product.model,
          product.category?.name
        ].filter(Boolean)
      }))
      
    } catch (error) {
      console.error('Enhanced trending searches error:', error)
      return []
    }
  }

  // Populate missing normalized names for existing products
  async populateNormalizedNames() {
    try {
      console.log('Starting to populate normalized names...')
      
      // Get products without normalized names
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { normalizedName: null },
            { normalizedName: '' }
          ]
        },
        include: {
          brand: true,
          category: true
        },
        take: 100 // Process in batches
      })
      
      console.log(`Found ${products.length} products without normalized names`)
      
      let updated = 0
      
      for (const product of products) {
        try {
          // Extract attributes from product name
          const attributes = this.normalizer.extractAttributes(product.name, product.category?.name)
          
          // Generate normalized name
          const normalizedName = this.normalizer.generateNormalizedName({
            brand: product.brand?.name || attributes.brand,
            model: attributes.model,
            capacity: attributes.capacity,
            color: attributes.color,
            size: attributes.size,
            variant: attributes.variant
          })
          
          // Update product with extracted data
          await prisma.product.update({
            where: { id: product.id },
            data: {
              normalizedName: normalizedName,
              model: attributes.model,
              capacity: attributes.capacity,
              color: attributes.color,
              size: attributes.size,
              variant: attributes.variant,
              canonicalId: this.normalizer.generateCanonicalId(product.name, attributes),
              updatedAt: new Date()
            }
          })
          
          updated++
          
          if (updated % 10 === 0) {
            console.log(`Updated ${updated} products...`)
          }
          
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error.message)
        }
      }
      
      console.log(`Successfully updated ${updated} products with normalized names`)
      return updated
      
    } catch (error) {
      console.error('Error populating normalized names:', error)
      throw error
    }
  }

  // Rebuild search index for better performance
  async rebuildSearchIndex() {
    try {
      console.log('Starting search index rebuild...')
      
      const products = await prisma.product.findMany({
        include: {
          brand: true,
          category: true,
          sellers: true
        }
      })
      
      let indexed = 0
      
      for (const product of products) {
        try {
          // Generate search text
          const searchText = [
            product.name,
            product.normalizedName,
            product.description,
            product.model,
            product.brand?.name,
            product.category?.name,
            product.capacity,
            product.color,
            product.size
          ].filter(Boolean).join(' ').toLowerCase()
          
          // Calculate popularity score
          const popularityScore = (product.sellers?.length || 0) * 10 + 
                                (product.qualityScore || 0) * 50
          
          // Update or create search index
          await prisma.productSearchIndex.upsert({
            where: { productId: product.id },
            update: {
              searchText,
              popularityScore,
              qualityScore: product.qualityScore || 0,
              updatedAt: new Date()
            },
            create: {
              productId: product.id,
              searchText,
              popularityScore,
              qualityScore: product.qualityScore || 0
            }
          })
          
          indexed++
          
          if (indexed % 50 === 0) {
            console.log(`Indexed ${indexed} products...`)
          }
          
        } catch (error) {
          console.error(`Error indexing product ${product.id}:`, error.message)
        }
      }
      
      console.log(`Successfully indexed ${indexed} products`)
      return indexed
      
    } catch (error) {
      console.error('Error rebuilding search index:', error)
      throw error
    }
  }
}

// Export enhanced search engine
export const enhancedSearchEngine = new EnhancedSearchEngine()

// Utility function to migrate existing search to enhanced version
export async function migrateToEnhancedSearch() {
  console.log('Starting migration to enhanced search...')
  
  const searchEngine = new EnhancedSearchEngine()
  
  try {
    // Step 1: Populate normalized names
    const normalizedCount = await searchEngine.populateNormalizedNames()
    console.log(`✅ Populated ${normalizedCount} normalized names`)
    
    // Step 2: Rebuild search index
    const indexedCount = await searchEngine.rebuildSearchIndex()
    console.log(`✅ Rebuilt search index for ${indexedCount} products`)
    
    console.log('✅ Migration to enhanced search completed successfully!')
    
    return {
      success: true,
      normalizedCount,
      indexedCount
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}