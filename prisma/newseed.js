// seed.js
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in correct order to handle foreign keys)
  console.log('🧹 Clearing existing data...');
  
  const tables = [
    'ProductMatchReview', 'ProductMatchLog', 'ProductMatchError', 'ProductMatchJob',
    'BatchOperation', 'QualityReport', 'ProductMatch', 'PriceHistory',
    'StoreProduct', 'ProductAttribute', 'ProductImage', 'Wishlist', 'PriceAlert',
    'CollectionItem', 'CollectionCollaborator', 'CollectionLike', 'CollectionComment',
    'CollectionShare', 'Collection', 'ProductView', 'ProductClick', 'SearchQuery',
    'WishlistInteraction', 'PriceAlertInteraction', 'ProductAssociation',
    'UserRecommendation', 'ProductStats', 'ProductFingerprint', 'ProductSearchIndex',
    'ProductAnalytics', 'AdminActivityLog', 'ReportedContent', 'Admin',
    'SystemHealth', 'DailyAnalytics', 'SystemMetric', 'UserSession', 'Product',
    'Store', 'Brand', 'Category', 'User'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`✅ Cleared ${table}`);
    } catch (error) {
      console.log(`⚠️ Could not clear ${table}: ${error.message}`);
    }
  }

  // Create Categories
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Smartphones',
        slug: 'smartphones',
        image: faker.image.url(),
        color: '#3B82F6'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Laptops',
        slug: 'laptops',
        image: faker.image.url(),
        color: '#10B981'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Tablets',
        slug: 'tablets',
        image: faker.image.url(),
        color: '#F59E0B'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Headphones',
        slug: 'headphones',
        image: faker.image.url(),
        color: '#EF4444'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Smart Watches',
        slug: 'smart-watches',
        image: faker.image.url(),
        color: '#8B5CF6'
      }
    })
  ]);

  // Create Brands
  console.log('🏷️ Creating brands...');
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: 'Apple',
        slug: 'apple',
        logo: faker.image.url(),
        website: 'https://apple.com'
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Samsung',
        slug: 'samsung',
        logo: faker.image.url(),
        website: 'https://samsung.com'
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Sony',
        slug: 'sony',
        logo: faker.image.url(),
        website: 'https://sony.com'
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Dell',
        slug: 'dell',
        logo: faker.image.url(),
        website: 'https://dell.com'
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Bose',
        slug: 'bose',
        logo: faker.image.url(),
        website: 'https://bose.com'
      }
    })
  ]);

  // Create Stores
  console.log('🏪 Creating stores...');
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: 'Amazon',
        slug: 'amazon',
        website: 'https://amazon.com',
        logoUrl: faker.image.url(),
        processingPriority: 1,
        rateLimit: 1000
      }
    }),
    prisma.store.create({
      data: {
        name: 'Best Buy',
        slug: 'best-buy',
        website: 'https://bestbuy.com',
        logoUrl: faker.image.url(),
        processingPriority: 2,
        rateLimit: 500
      }
    }),
    prisma.store.create({
      data: {
        name: 'Walmart',
        slug: 'walmart',
        website: 'https://walmart.com',
        logoUrl: faker.image.url(),
        processingPriority: 3,
        rateLimit: 300
      }
    }),
    prisma.store.create({
      data: {
        name: 'Target',
        slug: 'target',
        website: 'https://target.com',
        logoUrl: faker.image.url(),
        processingPriority: 4,
        rateLimit: 200
      }
    }),
    prisma.store.create({
      data: {
        name: 'Newegg',
        slug: 'newegg',
        website: 'https://newegg.com',
        logoUrl: faker.image.url(),
        processingPriority: 5,
        rateLimit: 100
      }
    })
  ]);

  // Create Products
  console.log('📦 Creating products...');
  const products = [];

  // Smartphones
  const smartphones = [
    { name: 'iPhone 15 Pro', brand: 'Apple', basePrice: 999, capacity: '128GB', color: 'Natural Titanium' },
    { name: 'iPhone 15', brand: 'Apple', basePrice: 799, capacity: '128GB', color: 'Black' },
    { name: 'Galaxy S24 Ultra', brand: 'Samsung', basePrice: 1199, capacity: '256GB', color: 'Titanium Gray' },
    { name: 'Galaxy Z Flip 5', brand: 'Samsung', basePrice: 999, capacity: '256GB', color: 'Mint' },
    { name: 'Xperia 1 V', brand: 'Sony', basePrice: 1299, capacity: '256GB', color: 'Black' }
  ];

  for (const phone of smartphones) {
    const brand = brands.find(b => b.name === phone.brand);
    const product = await prisma.product.create({
      data: {
        name: phone.name,
        slug: generateSlug(phone.name),
        description: faker.commerce.productDescription(),
        categoryId: categories[0].id,
        brandId: brand.id,
        normalizedName: phone.name.toLowerCase(),
        model: phone.name,
        capacity: phone.capacity,
        color: phone.color,
        qualityScore: faker.number.float({ min: 0.7, max: 1.0 }),
        isVerified: true,
        verifiedAt: new Date(),
        attributes: {
          screenSize: '6.1-6.8 inch',
          camera: '48MP+12MP',
          battery: '4000-5000mAh',
          processor: 'A17 Pro / Snapdragon 8 Gen 3'
        },
        images: {
          create: Array.from({ length: 3 }, (_, i) => ({
            url: faker.image.url(),
            alt: `${phone.name} image ${i + 1}`,
            isPrimary: i === 0
          }))
        },
        productAttributes: {
          create: [
            { key: 'Operating System', value: phone.brand === 'Apple' ? 'iOS 17' : 'Android 14', confidence: 0.95 },
            { key: 'RAM', value: '8GB', confidence: 0.9 },
            { key: 'Storage', value: phone.capacity, confidence: 1.0 },
            { key: 'Color', value: phone.color, confidence: 1.0 }
          ]
        }
      }
    });
    products.push(product);
  }

  // Laptops
  const laptops = [
    { name: 'MacBook Pro 16"', brand: 'Apple', basePrice: 2499, specs: 'M3 Pro, 16GB, 1TB' },
    { name: 'MacBook Air 13"', brand: 'Apple', basePrice: 1099, specs: 'M2, 8GB, 256GB' },
    { name: 'XPS 13 Plus', brand: 'Dell', basePrice: 1299, specs: 'i7, 16GB, 512GB' },
    { name: 'Galaxy Book3 Ultra', brand: 'Samsung', basePrice: 2199, specs: 'i9, 32GB, 1TB' },
    { name: 'VAIO SX14', brand: 'Sony', basePrice: 1799, specs: 'i7, 16GB, 512GB' }
  ];

  for (const laptop of laptops) {
    const brand = brands.find(b => b.name === laptop.brand);
    const product = await prisma.product.create({
      data: {
        name: laptop.name,
        slug: generateSlug(laptop.name),
        description: faker.commerce.productDescription(),
        categoryId: categories[1].id,
        brandId: brand.id,
        normalizedName: laptop.name.toLowerCase(),
        model: laptop.name,
        qualityScore: faker.number.float({ min: 0.8, max: 1.0 }),
        isVerified: true,
        verifiedAt: new Date(),
        attributes: {
          display: '13-16 inch',
          processor: laptop.specs.split(', ')[0],
          memory: laptop.specs.split(', ')[1],
          storage: laptop.specs.split(', ')[2],
          graphics: 'Integrated / Dedicated'
        },
        images: {
          create: Array.from({ length: 3 }, (_, i) => ({
            url: faker.image.url(),
            alt: `${laptop.name} image ${i + 1}`,
            isPrimary: i === 0
          }))
        },
        productAttributes: {
          create: [
            { key: 'Processor', value: laptop.specs.split(', ')[0], confidence: 0.95 },
            { key: 'RAM', value: laptop.specs.split(', ')[1], confidence: 0.95 },
            { key: 'Storage', value: laptop.specs.split(', ')[2], confidence: 0.95 },
            { key: 'Display', value: 'Retina / OLED', confidence: 0.9 }
          ]
        }
      }
    });
    products.push(product);
  }

  // Create StoreProducts (price listings)
  console.log('💰 Creating store products and prices...');
  for (const product of products) {
    // Each product available in 2-4 stores with different prices
    const storeCount = faker.number.int({ min: 2, max: 4 });
    const selectedStores = faker.helpers.arrayElements(stores, storeCount);
    
    for (const store of selectedStores) {
      const basePrice = product.name.includes('Pro') || product.name.includes('Ultra') ? 
        faker.number.float({ min: 800, max: 2500 }) : 
        faker.number.float({ min: 300, max: 1500 });
      
      await prisma.storeProduct.create({
        data: {
          productId: product.id,
          storeId: store.id,
          price: basePrice,
          shippingCost: faker.number.float({ min: 0, max: 20 }),
          deliveryTime: faker.helpers.arrayElement(['1-2 days', '3-5 days', '1 week']),
          paymentMethods: ['Credit Card', 'PayPal', 'Apple Pay'],
          availability: faker.helpers.arrayElement(['In Stock', 'Limited Stock', 'Pre-order']),
          originalProductName: product.name,
          productUrl: faker.internet.url(),
          lastScraped: new Date()
        }
      });

      // Create some price history
      for (let i = 0; i < 5; i++) {
        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            storeId: store.id,
            price: basePrice * faker.number.float({ min: 0.8, max: 1.1 }),
            timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Past 5 days
          }
        });
      }
    }
  }

  // Create Users
  console.log('👤 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        name: 'John Doe',
        hashedPassword: 'hashed_password_123',
        lastLoginAt: new Date(),
        loginCount: 5
      }
    }),
    prisma.user.create({
      data: {
        email: 'user2@example.com',
        name: 'Jane Smith',
        hashedPassword: 'hashed_password_456',
        lastLoginAt: new Date(),
        loginCount: 3
      }
    })
  ]);

  // Create Wishlists
  console.log('❤️ Creating wishlists...');
  for (const user of users) {
    const wishlistProducts = faker.helpers.arrayElements(products, 3);
    for (const product of wishlistProducts) {
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId: product.id
        }
      });
    }
  }

  // Create Collections
  console.log('📚 Creating collections...');
  const collections = await Promise.all([
    prisma.collection.create({
      data: {
        title: 'Gaming Setup 2024',
        description: 'The ultimate gaming setup with the latest tech',
        slug: 'gaming-setup-2024',
        type: 'tech',
        userId: users[0].id,
        coverImage: faker.image.url(),
        totalPrice: 3500,
        items: {
          create: [
            { productId: products[5].id, position: 0, notes: 'Main gaming machine' },
            { productId: products[2].id, position: 1, notes: 'Secondary device' }
          ]
        }
      }
    }),
    prisma.collection.create({
      data: {
        title: 'Work From Home Essentials',
        description: 'Everything you need for productive remote work',
        slug: 'work-from-home-essentials',
        type: 'office',
        userId: users[1].id,
        coverImage: faker.image.url(),
        totalPrice: 2200,
        items: {
          create: [
            { productId: products[6].id, position: 0, notes: 'Primary work laptop' },
            { productId: products[8].id, position: 1, notes: 'Backup device' }
          ]
        }
      }
    })
  ]);

  // Create Product Stats
  console.log('📊 Creating product stats...');
  for (const product of products) {
    await prisma.productStats.create({
      data: {
        productId: product.id,
        views24h: faker.number.int({ min: 50, max: 500 }),
        views7d: faker.number.int({ min: 300, max: 2000 }),
        clicks24h: faker.number.int({ min: 10, max: 100 }),
        trendingScore: faker.number.float({ min: 0, max: 1 })
      }
    });
  }

  // Create Admin User
  console.log('👑 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      hashedPassword: 'hashed_admin_password',
      lastLoginAt: new Date(),
      loginCount: 10
    }
  });

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      role: 'SUPER_ADMIN',
      permissions: ['all']
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:
    - ${categories.length} categories
    - ${brands.length} brands  
    - ${stores.length} stores
    - ${products.length} products
    - ${users.length + 1} users (including admin)
    - ${collections.length} collections
  `);

  console.log('\n🔑 Test Accounts:');
  console.log('   Regular User: user1@example.com / hashed_password_123');
  console.log('   Admin User: admin@example.com / hashed_admin_password');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });