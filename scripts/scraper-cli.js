// ============================================================================
// 20. SCRAPER CLI TOOL
// scripts/scraper-cli.js
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const priceScraperService = require('../lib/scrapers/priceScraperService').default;

const prisma = new PrismaClient();

const commands = {
  async 'scrape-all'(args) {
    console.log('Starting full scraping job...');
    const limit = args.limit || 100;
    const results = await priceScraperService.scrapeAllProducts(limit);
    console.log('Results:', results);
  },

  async 'scrape-store'(args) {
    if (!args.storeId) {
      console.error('Error: --storeId required');
      process.exit(1);
    }

    console.log(`Scraping store ${args.storeId}...`);
    const products = await prisma.storeProduct.findMany({
      where: { 
        storeId: parseInt(args.storeId),
        isActive: true 
      },
      include: { store: true, product: true }
    });

    console.log(`Found ${products.length} products`);
    
    for (const product of products) {
      await priceScraperService.scrapeStoreProduct(product);
    }
  },

  async 'scrape-product'(args) {
    if (!args.productId) {
      console.error('Error: --productId required');
      process.exit(1);
    }

    console.log(`Scraping product ${args.productId}...`);
    const stores = await prisma.storeProduct.findMany({
      where: { 
        productId: parseInt(args.productId),
        isActive: true 
      },
      include: { store: true, product: true }
    });

    for (const store of stores) {
      const result = await priceScraperService.scrapeStoreProduct(store);
      console.log(`${store.store.name}: $${result?.price || 'FAILED'}`);
    }
  },

  async 'health'() {
    const healthCheck = require('../lib/scrapers/healthCheck').default;
    const health = await healthCheck.checkHealth();
    console.log(JSON.stringify(health, null, 2));
  },

  async 'stats'() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      totalProducts: await prisma.storeProduct.count(),
      scrapedLast24h: await prisma.storeProduct.count({
        where: { lastScraped: { gte: last24h } }
      }),
      errorsLast24h: await prisma.productMatchError.count({
        where: {
          errorType: 'SCRAPING_ERROR',
          createdAt: { gte: last24h }
        }
      }),
      priceHistoryCount: await prisma.priceHistory.count()
    };

    console.log('Scraper Statistics:');
    console.log(JSON.stringify(stats, null, 2));
  },

  help() {
    console.log(`
Scraper CLI Tool

Usage:
  node scripts/scraper-cli.js <command> [options]

Commands:
  scrape-all              Scrape all products
    --limit <n>          Limit number of products (default: 100)

  scrape-store            Scrape products from specific store
    --storeId <id>       Store ID to scrape

  scrape-product          Scrape specific product from all stores
    --productId <id>     Product ID to scrape

  health                  Check scraper health status
  stats                   Show scraper statistics
  help                    Show this help message

Examples:
  node scripts/scraper-cli.js scrape-all --limit 50
  node scripts/scraper-cli.js scrape-store --storeId 1
  node scripts/scraper-cli.js scrape-product --productId 123
  node scripts/scraper-cli.js health
    `);
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  return { command, options };
}

// Run CLI
async function main() {
  const { command, options } = parseArgs();

  if (!commands[command]) {
    console.error(`Unknown command: ${command}`);
    commands.help();
    process.exit(1);
  }

  try {
    await commands[command](options);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = commands;