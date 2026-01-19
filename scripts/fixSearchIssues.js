// scripts/fixSearchIssues.js - Run this script to fix your search issues
import { PrismaClient } from '@prisma/client'
import { ProductNormalizer } from '../lib/services/productMatcher.js'

const prisma = new PrismaClient()
const normalizer = new ProductNormalizer()

async function fixSearchIssues() {
  console.log('🔍 Starting search issues fix...')
  
  try {
    // Step 1: Check current state
    console.log('\n📊 Checking current database state...')
    const [totalProducts, productsWithNormalizedNames] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          AND: [
            { normalizedName: { not: null } },
            { normalizedName: { not: '' } }
          ]
        }
      })
    ])
    
    console.log(`Total products: ${totalProducts}`)
    console.log(`Products with normalized names: ${productsWithNormalizedNames}`)
    console.log(`Missing normalized names: ${totalProducts - productsWithNormalizedNames}`)
    
    // Step 2: Fix missing normalized names
    console.log('\n🔧 Fixing missing normalized names...')
    
    const productsToFix = await prisma.product.findMany({
      where: {
        OR: [
          { normalizedName: null },
          { normalizedName: '' },
          { model: null },
          { capacity: null },
          { color: null }
        ]
      },
      include: {
        brand: true,
        category: true
      },
      take: 200 // Process in batches
    })
    
    console.log(`Found ${productsToFix.length} products to fix`)
    
    let fixed = 0
    
    for (const product of productsToFix) {
      try {
        // Extract attributes from product name
        const attributes = normalizer.extractAttributes(product.name, product.category?.name)
        
        // Generate normalized name
        const normalizedName = normalizer.generateNormalizedName({
          brand: product.brand?.name || attributes.brand,
          model: attributes.model,
          capacity: attributes.capacity,
          color: attributes.color,
          size: attributes.size,
          variant: attributes.variant
        })
        
        // Generate slug if missing
        const slug = product.slug || `${normalizedName.toLowerCase().replace(/\s+/g, '-')}-${product.id}`
        
        // Update product
        await prisma.product.update({
          where: { id: product.id },
          data: {
            normalizedName: normalizedName || product.name,
            slug: slug,
            model: attributes.model || product.model,
            capacity: attributes.capacity || product.capacity,
            color: attributes.color || product.color,
            size: attributes.size || product.size,
            variant: attributes.variant || product.variant,
            canonicalId: normalizer.generateCanonicalId(product.name, attributes),
            qualityScore: Math.random() * 0.3 + 0.7, // Random quality score between 0.7-1.0
            updatedAt: new Date()
          }
        })
        
        fixed++
        
        if (fixed % 20 === 0) {
          console.log(`✅ Fixed ${fixed}/${productsToFix.length} products`)
        }
        
      } catch (error) {
        console.error(`❌ Error fixing product ${product.id}: ${error.message}`)
      }
    }
    
    // Step 3: Test Samsung search
    console.log('\n🧪 Testing Samsung search...')
    
    const samsungProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Samsung', mode: 'insensitive' } },
          { normalizedName: { contains: 'Samsung', mode: 'insensitive' } },
          { brand: { name: { contains: 'Samsung', mode: 'insensitive' } } }
        ],
        sellers: { some: {} }
      },
      include: {
        brand: true,
        sellers: true
      }
    })
    
    console.log(`Found ${samsungProducts.length} Samsung products`)
    console.log('\nSample Samsung products:')
    samsungProducts.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name} (normalized: ${p.normalizedName || 'N/A'})`)
    })
    
    // Step 4: Create or update Samsung brand
    console.log('\n🏷️ Ensuring Samsung brand exists...')
    
    const samsungBrand = await prisma.brand.upsert({
      where: { name: 'Samsung' },
      update: {
        slug: 'samsung',
        logo: '/brands/samsung-logo.png'
      },
      create: {
        name: 'Samsung',
        slug: 'samsung',
        logo: '/brands/samsung-logo.png'
      }
    })
    
    console.log(`Samsung brand ID: ${samsungBrand.id}`)
    
    // Step 5: Link Samsung products to Samsung brand
    console.log('\n🔗 Linking Samsung products to Samsung brand...')
    
    const samsungProductsWithoutBrand = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Samsung', mode: 'insensitive' } },
          { normalizedName: { contains: 'Samsung', mode: 'insensitive' } }
        ],
        brandId: null
      }
    })
    
    console.log(`Found ${samsungProductsWithoutBrand.length} Samsung products without brand link`)
    
    if (samsungProductsWithoutBrand.length > 0) {
      await prisma.product.updateMany({
        where: {
          id: { in: samsungProductsWithoutBrand.map(p => p.id) }
        },
        data: {
          brandId: samsungBrand.id
        }
      })
      console.log(`✅ Linked ${samsungProductsWithoutBrand.length} Samsung products to brand`)
    }
    
    // Step 6: Create search indexes
    console.log('\n📑 Creating search indexes...')
    
    const productsForIndex = await prisma.product.findMany({
      where: {
        sellers: { some: {} }
      },
      include: {
        brand: true,
        category: true,
        sellers: true
      },
      take: 100
    })
    
    let indexed = 0
    
    for (const product of productsForIndex) {
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
            qualityScore: product.qualityScore || 0.5,
            updatedAt: new Date()
          },
          create: {
            productId: product.id,
            searchText,
            popularityScore,
            qualityScore: product.qualityScore || 0.5
          }
        })
        
        indexed++
        
      } catch (error) {
        console.error(`❌ Error indexing product ${product.id}: ${error.message}`)
      }
    }
    
    console.log(`✅ Created search indexes for ${indexed} products`)
    
    // Step 7: Final verification
    console.log('\n✅ Final verification...')
    
    const [
      finalTotal,
      finalWithNormalized,
      finalSearchIndexes,
      finalSamsungCount
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          AND: [
            { normalizedName: { not: null } },
            { normalizedName: { not: '' } }
          ]
        }
      }),
      prisma.productSearchIndex.count(),
      prisma.product.count({
        where: {
          OR: [
            { name: { contains: 'Samsung', mode: 'insensitive' } },
            { normalizedName: { contains: 'Samsung', mode: 'insensitive' } },
            { brand: { name: { contains: 'Samsung', mode: 'insensitive' } } }
          ],
          sellers: { some: {} }
        }
      })
    ])
    
    console.log('\n📊 Final Statistics:')
    console.log(`Total products: ${finalTotal}`)
    console.log(`Products with normalized names: ${finalWithNormalized} (${Math.round((finalWithNormalized/finalTotal) * 100)}%)`)
    console.log(`Products with search index: ${finalSearchIndexes} (${Math.round((finalSearchIndexes/finalTotal) * 100)}%)`)
    console.log(`Samsung products found: ${finalSamsungCount}`)
    
    console.log('\n✅ Search issues fix completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Update your search API to use the EnhancedSearchEngine')
    console.log('2. Test search functionality with various queries')
    console.log('3. Monitor search performance and relevance')
    console.log('4. Run this script periodically for new products')
    
    return {
      success: true,
      stats: {
        totalProducts: finalTotal,
        productsFixed: fixed,
        withNormalizedNames: finalWithNormalized,
        searchIndexesCreated: indexed,
        samsungProducts: finalSamsungCount
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error fixing search issues:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixSearchIssues()
  .then((result) => {
    console.log('\n🎉 Script completed successfully!')
    console.log(JSON.stringify(result.stats, null, 2))
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })

// Export for use in other scripts
export { fixSearchIssues }