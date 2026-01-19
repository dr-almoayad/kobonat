// scripts/typesense-setup.js
/**
 * Typesense Setup Script
 * Run this to initialize Typesense with your product data
 * 
 * Usage:
 * node scripts/typesense-setup.js [command]
 * 
 * Commands:
 * - init: Create collection and index all products
 * - reindex: Delete and recreate collection, then index all products
 * - stats: Show collection statistics
 * - index-product [id]: Index a single product
 */

import { 
  createProductsCollection, 
  indexAllProducts,
  indexProduct,
  deleteProduct,
  getCollectionStats 
} from '../lib/typesense/indexer.js';

const command = process.argv[2] || 'init';
const arg = process.argv[3];

async function main() {
  console.log(`\n🚀 Typesense Setup Script`);
  console.log(`📝 Command: ${command}\n`);

  try {
    switch (command) {
      case 'init':
        console.log('🏗️  Initializing Typesense...\n');
        await createProductsCollection(false);
        await indexAllProducts();
        console.log('\n✅ Initialization complete!');
        const stats = await getCollectionStats();
        console.log(`📊 Collection stats:`, stats);
        break;

      case 'reindex':
        console.log('🔄 Reindexing all products...\n');
        await createProductsCollection(true);
        await indexAllProducts();
        console.log('\n✅ Reindexing complete!');
        const reindexStats = await getCollectionStats();
        console.log(`📊 Collection stats:`, reindexStats);
        break;

      case 'stats':
        console.log('📊 Getting collection statistics...\n');
        const collectionStats = await getCollectionStats();
        console.log(collectionStats);
        break;

      case 'index-product':
        if (!arg) {
          console.error('❌ Please provide a product ID');
          console.log('Usage: node scripts/typesense-setup.js index-product [product-id]');
          process.exit(1);
        }
        console.log(`🔄 Indexing product ${arg}...\n`);
        await indexProduct(parseInt(arg));
        console.log('\n✅ Product indexed!');
        break;

      case 'delete-product':
        if (!arg) {
          console.error('❌ Please provide a product ID');
          console.log('Usage: node scripts/typesense-setup.js delete-product [product-id]');
          process.exit(1);
        }
        console.log(`🗑️  Deleting product ${arg}...\n`);
        await deleteProduct(parseInt(arg));
        console.log('\n✅ Product deleted!');
        break;

      case 'help':
        console.log(`
Available commands:

  init                    Create collection and index all products (first time setup)
  reindex                 Delete and recreate collection, then index all products
  stats                   Show collection statistics
  index-product [id]      Index a single product by ID
  delete-product [id]     Delete a product from index by ID
  help                    Show this help message

Examples:

  node scripts/typesense-setup.js init
  node scripts/typesense-setup.js reindex
  node scripts/typesense-setup.js index-product 123
  node scripts/typesense-setup.js stats
        `);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node scripts/typesense-setup.js help" for available commands');
        process.exit(1);
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();