// lib/services/productMatcher.js - Fixed with better error handling
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ProductNormalizer {
  constructor() {
    this.brandMappings = {
      'apple': ['apple', 'iphone', 'ipad', 'macbook', 'imac', 'airpods', 'watch', 'mac'],
      'samsung': ['samsung', 'galaxy'],
      'google': ['google', 'pixel'],
      'microsoft': ['microsoft', 'surface', 'xbox'],
      'sony': ['sony', 'playstation', 'ps4', 'ps5', 'bravia'],
      'nintendo': ['nintendo', 'switch'],
      'dell': ['dell', 'alienware'],
      'hp': ['hp', 'hewlett packard'],
      'lenovo': ['lenovo', 'thinkpad'],
      'asus': ['asus'],
      'acer': ['acer']
    }
    
    this.capacityPatterns = [
      /(\d+)\s*(gb|tb|gigabyte|terabyte)/gi,
      /(\d+)\s*(gb|tb)/gi,
      /(\d+)gb/gi,
      /(\d+)tb/gi
    ]
    
    this.colorPatterns = [
      /\b(black|white|red|blue|green|yellow|pink|purple|gray|grey|silver|gold|rose gold|space gray|midnight|starlight|sierra blue|pacific blue|alpine green|deep purple|product red|champagne|graphite|arctic white|cherry|crimson|forest green|violet)\b/gi
    ]
    
    this.sizePatterns = [
      /(\d+(?:\.\d+)?)\s*(inch|"|'|cm|mm)/gi,
      /\b(xs|s|m|l|xl|xxl|2xl|3xl)\b/gi,
      /\b(small|medium|large|extra large)\b/gi
    ]

    this.modelPatterns = {
      'apple': {
        'iPhone 15 Pro': ['iphone 15 pro', 'iphone15pro', 'ip15pro', 'iphone 15pro', 'apple iphone 15 pro', 'iphone fifteen pro'],
        'iPhone 15': ['iphone 15', 'iphone15', 'ip15', 'apple iphone 15', 'iphone fifteen'],
        'iPhone 14 Pro': ['iphone 14 pro', 'iphone14pro', 'ip14pro', 'iphone 14pro'],
        'iPad Pro': ['ipad pro', 'ipadpro'],
        'iPad Air': ['ipad air'],
        'MacBook Pro': ['macbook pro', 'mbp'],
        'MacBook Air': ['macbook air', 'mba']
      },
      'samsung': {
        'Galaxy S24 Ultra': ['galaxy s24 ultra', 's24 ultra', 'samsung s24 ultra', 'galaxy s 24 ultra', 's24ultra'],
        'Galaxy S24': ['galaxy s24', 's24', 'samsung s24', 'galaxy s 24'],
        'Galaxy Note': ['galaxy note', 'note']
      }
    }
    
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'new', 'brand', 'original', 'genuine', 'official',
      'unlocked', 'factory', 'sealed', 'boxed', 'warranty', 'latest',
      'smartphone', 'mobile', 'phone', 'device', 'tablet', 'laptop',
      'computer', 'gaming', 'edition', 'version', 'model', 'series'
    ])
  }
  
  normalizeText(text) {
    if (!text || typeof text !== 'string') return ''
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  extractBrand(text) {
    if (!text) return null
    
    const normalizedText = this.normalizeText(text)
    
    for (const [brand, variations] of Object.entries(this.brandMappings)) {
      for (const variation of variations) {
        if (normalizedText.includes(variation)) {
          return brand.charAt(0).toUpperCase() + brand.slice(1)
        }
      }
    }
    return null
  }
  
  extractCapacity(text) {
    if (!text) return null
    
    const normalizedText = this.normalizeText(text)
    
    for (const pattern of this.capacityPatterns) {
      pattern.lastIndex = 0 // Reset regex state
      const match = pattern.exec(normalizedText)
      if (match) {
        const [, value, unit] = match
        const normalizedUnit = unit.toLowerCase()
        
        if (['gigabyte', 'gb'].includes(normalizedUnit)) {
          return `${value}GB`
        } else if (['terabyte', 'tb'].includes(normalizedUnit)) {
          return `${value}TB`
        }
      }
    }
    return null
  }
  
  extractColor(text) {
    if (!text) return null
    
    const normalizedText = this.normalizeText(text)
    
    for (const pattern of this.colorPatterns) {
      pattern.lastIndex = 0 // Reset regex state
      const match = pattern.exec(normalizedText)
      if (match) {
        return match[0].split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
    }
    return null
  }
  
  extractSize(text) {
    if (!text) return null
    
    const normalizedText = this.normalizeText(text)
    
    for (const pattern of this.sizePatterns) {
      pattern.lastIndex = 0 // Reset regex state
      const match = pattern.exec(normalizedText)
      if (match) {
        if (match.length === 3) {
          return `${match[1]}${match[2]}`
        }
        return match[1].toUpperCase()
      }
    }
    return null
  }
  
  extractModel(text, brand) {
    if (!text || !brand) return null
    
    const normalizedText = this.normalizeText(text)
    
    if (this.modelPatterns[brand.toLowerCase()]) {
      const brandModels = this.modelPatterns[brand.toLowerCase()]
      for (const [model, patterns] of Object.entries(brandModels)) {
        for (const pattern of patterns) {
          if (normalizedText.includes(pattern)) {
            return model
          }
        }
      }
    }
    
    return null
  }
  
  extractAttributes(productName, category = null) {
    if (!productName) {
      return {
        brand: null,
        model: null,
        capacity: null,
        color: null,
        size: null,
        category
      }
    }

    try {
      const brand = this.extractBrand(productName)
      const model = this.extractModel(productName, brand)
      const capacity = this.extractCapacity(productName)
      const color = this.extractColor(productName)
      const size = this.extractSize(productName)
      
      return {
        brand,
        model,
        capacity,
        color,
        size,
        category
      }
    } catch (error) {
      console.error('Error extracting attributes from:', productName, error)
      return {
        brand: null,
        model: null,
        capacity: null,
        color: null,
        size: null,
        category
      }
    }
  }
  
  generateNormalizedName(attributes) {
    try {
      const parts = []
      
      if (attributes.brand) parts.push(attributes.brand)
      if (attributes.model) parts.push(attributes.model)
      if (attributes.capacity) parts.push(attributes.capacity)
      if (attributes.color) parts.push(attributes.color)
      if (attributes.size) parts.push(attributes.size)
      if (attributes.variant) parts.push(attributes.variant)
      
      return parts.length > 0 ? parts.join(' ') : 'Unknown Product'
    } catch (error) {
      console.error('Error generating normalized name:', error)
      return 'Unknown Product'
    }
  }

  generateCanonicalId(name, attributes = {}) {
    try {
      const extracted = this.extractAttributes(name, attributes)
      
      const parts = [
        extracted.brand || 'unknown',
        extracted.model || 'generic',
        extracted.capacity || '',
        extracted.color || ''
      ].filter(Boolean)

      return parts.join('-').toLowerCase().replace(/\s+/g, '-')
    } catch (error) {
      console.error('Error generating canonical ID:', error)
      return `unknown-${Date.now()}`
    }
  }
}