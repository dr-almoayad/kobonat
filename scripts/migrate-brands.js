// scripts/migrate-brands.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateBrands() {
  try {
    // Get all unique brand names from product attributes
    const brandAttributes = await prisma.productAttribute.findMany({
      where: { key: 'Brand' },
      select: { value: true },
      distinct: ['value']
    });

    console.log(`Found ${brandAttributes.length} unique brands`);

    // Create Brand records
    for (const brandAttr of brandAttributes) {
      await prisma.brand.upsert({
        where: { name: brandAttr.value },
        update: {},
        create: {
          name: brandAttr.value,
          logo: null // Add logos later if needed
        }
      });
    }

    // Update products to link to Brand table
    const products = await prisma.product.findMany({
      include: {
        attributes: {
          where: { key: 'Brand' }
        }
      }
    });

    for (const product of products) {
      const brandAttribute = product.attributes.find(attr => attr.key === 'Brand');
      if (brandAttribute) {
        const brand = await prisma.brand.findUnique({
          where: { name: brandAttribute.value }
        });

        if (brand) {
          await prisma.product.update({
            where: { id: product.id },
            data: { brandId: brand.id }
          });
        }
      }
    }

    console.log('Brand migration completed!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBrands();