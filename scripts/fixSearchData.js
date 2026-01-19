// scripts/fixSearchData.js - Run this to fix your search data
import { PrismaClient } from '@prisma/client'
import { ProductNormalizer } from '../lib/services/productMatcher.js'

const prisma = new PrismaClient()
const normalizer = new ProductNormalizer()

async function fixSearchData() {
  console.log('🔧 Starting search data migration...\n')

  try {
    // 1. Get all products
    const products = await prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        stores: true
      }
    })

    console.log(`📦 Found ${products.length} products\n`)

    let updated = 0
    let errors = 0

    // 2. Process each product
    for (const product of products) {
      try {
        // Extract attributes
        const attributes = normalizer.extractAttributes(
          product.name,
          product.category?.name
        )

        // Generate normalized name
        const normalizedName = normalizer.generateNormalizedName({
          brand: product.brand?.name || attributes.brand,
          model: attributes.model,
          capacity: attributes.capacity,
          color: attributes.color,
          size: attributes.size,
          variant: attributes.variant
        })

        // Update product
        await prisma.product.update({
          where: { id: product.id },
          data: {
            normalizedName: normalizedName || product.name,
            model: attributes.model || product.model,
            capacity: attributes.capacity || product.capacity,
            color: attributes.color || product.color,
            size: attributes.size || product.size,
            canonicalId: normalizer.generateCanonicalId(product.name, attributes),
            updatedAt: new Date()
          }
        })

        // Update search index
        const searchText = [
          product.name,
          normalizedName,
          product.description,
          attributes.model,
          product.brand?.name,
          product.category?.name,
          attributes.capacity,
          attributes.color,
          attributes.size
        ].filter(Boolean).join(' ').toLowerCase()

        const popularityScore = (product.stores?.length || 0) * 10 +
                                (product.qualityScore || 0) * 50

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

        updated++

        if (updated % 50 === 0) {
          console.log(`✅ Processed ${updated}/${products.length} products...`)
        }
      } catch (error) {
        errors++
        console.error(`❌ Error processing product ${product.id}:`, error.message)
      }
    }

    console.log(`\n🎉 Migration complete!`)
    console.log(`✅ Updated: ${updated}`)
    console.log(`❌ Errors: ${errors}`)

    // 3. Verify search works
    console.log('\n🔍 Testing search...')
    const testResults = await prisma.product.findMany({
      where: {
        AND: [
          { stores: { some: {} } },
          {
            OR: [
              { name: { contains: 'iphone', mode: 'insensitive' } },
              { brand: { name: { contains: 'iphone', mode: 'insensitive' } } }
            ]
          }
        ]
      },
      take: 5
    })

    console.log(`Found ${testResults.length} test results`)
    console.log('\n✨ All done! Your search should now work.')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
fixSearchData()
  .catch(console.error)
  .finally(() => process.exit())