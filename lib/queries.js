import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get product with lowest seller price
 */
export async function getProductWithLowestPrice(productId) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      stores: {
        include: { store: true },
        orderBy: { price: "asc" },
        take: 1,
      },
      images: true,
      productAttributes: true,
    },
  });
}

/**
 * Compare two products (same category)
 */
export async function compareProducts(productId1, productId2) {
  return prisma.product.findMany({
    where: { id: { in: [productId1, productId2] } },
    include: {
      productAttributes: true,
      images: true,
      stores: {
        include: { store: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
  });
}

/**
 * Add product to user wishlist
 */
export async function addToWishlist(userId, productId) {
  return prisma.wishlist.create({
    data: { userId, productId },
  });
}

/**
 * Get all wishlist products for a user
 */
export async function getUserWishlist(userId) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: true,
          stores: {
            orderBy: { price: "asc" },
            take: 1,
          },
        },
      },
    },
  });
}

/**
 * Add price alert for a product
 */
export async function addPriceAlert(userId, productId, targetPrice) {
  return prisma.priceAlert.create({
    data: { userId, productId, targetPrice },
  });
}

/**
 * Get all price alerts for a user
 */
export async function getUserPriceAlerts(userId) {
  return prisma.priceAlert.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: true,
          stores: {
            orderBy: { price: "asc" },
            take: 1,
          },
        },
      },
    },
  });
}

