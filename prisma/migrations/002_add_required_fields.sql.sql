-- migrations/002_add_required_fields.sql

-- First, add columns as nullable
ALTER TABLE "Brand" ADD COLUMN "slug" TEXT;
ALTER TABLE "Category" ADD COLUMN "slug" TEXT;
ALTER TABLE "Seller" ADD COLUMN "slug" TEXT;
ALTER TABLE "SellerProduct" ADD COLUMN "productUrl" TEXT;

-- Generate slugs for existing data
UPDATE "Brand" SET "slug" = LOWER(REPLACE("name", ' ', '-')) WHERE "slug" IS NULL;
UPDATE "Category" SET "slug" = LOWER(REPLACE("name", ' ', '-')) WHERE "slug" IS NULL;
UPDATE "Seller" SET "slug" = LOWER(REPLACE("name", ' ', '-')) WHERE "slug" IS NULL;

-- Set default product URLs
UPDATE "SellerProduct" SET "productUrl" = 'https://example.com/product' WHERE "productUrl" IS NULL;

-- Set updatedAt defaults for existing NULL values
UPDATE "Product" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
UPDATE "SellerProduct" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Now make columns required and add unique constraints
ALTER TABLE "Brand" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_slug_key" UNIQUE ("slug");

ALTER TABLE "Category" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_key" UNIQUE ("slug");

ALTER TABLE "Seller" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_slug_key" UNIQUE ("slug");

ALTER TABLE "SellerProduct" ALTER COLUMN "productUrl" SET NOT NULL;

ALTER TABLE "Product" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "SellerProduct" ALTER COLUMN "updatedAt" SET NOT NULL;