// scripts/update-existing-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExistingData() {
  // Update stores with default payment options
  await prisma.store.updateMany({
    data: {
      paymentOptions: ['credit_card', 'debit_card'],
      acceptsCashOnDelivery: true,
      acceptsBuyNowPayLater: true,
      bnplProviders: ['tabby', 'tamara'],
      acceptsReturns: true,
      returnWindowDays: 14
    }
  });

  // Update store products with default values
  await prisma.storeProduct.updateMany({
    data: {
      deliveryTime: '2-3 business days',
      isReturnable: true,
      returnWindowDays: 14,
      cashOnDeliveryAvailable: true,
      buyNowPayLaterAvailable: true
    }
  });

  console.log('✓ Updated existing data');
}

updateExistingData()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });