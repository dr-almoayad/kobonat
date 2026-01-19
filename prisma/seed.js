// prisma/seed.js - COMPLETE FIXED VERSION
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function futureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

// ============================================================================
// SEED DATA - COUNTRIES
// ============================================================================

const COUNTRIES = [
  { code: 'SA', name_en: 'Saudi Arabia', name_ar: 'السعودية', currency: 'SAR', flag: '🇸🇦', isDefault: true },
  { code: 'AE', name_en: 'UAE', name_ar: 'الإمارات', currency: 'AED', flag: '🇦🇪' },
  { code: 'EG', name_en: 'Egypt', name_ar: 'مصر', currency: 'EGP', flag: '🇪🇬' },
  { code: 'QA', name_en: 'Qatar', name_ar: 'قطر', currency: 'QAR', flag: '🇶🇦' },
  { code: 'KW', name_en: 'Kuwait', name_ar: 'الكويت', currency: 'KWD', flag: '🇰🇼' },
  { code: 'OM', name_en: 'Oman', name_ar: 'عمان', currency: 'OMR', flag: '🇴🇲' }
];

// ============================================================================
// SEED DATA - CATEGORIES
// ============================================================================

const CATEGORIES = [
  { 
    name_en: 'Fashion', 
    name_ar: 'الأزياء',
    icon: 'checkroom',
    color: '#181818ff'
  },
  { 
    name_en: 'Electronics', 
    name_ar: 'الإلكترونيات',
    icon: 'devices',
    color: '#2b83d5ff'
  },
  { 
    name_en: 'Beauty', 
    name_ar: 'التجميل',
    icon: 'lips',
    color: '#e9779cff'
  },
  { 
    name_en: 'Home & More', 
    name_ar: 'المنزل وأكثر',
    icon: 'home',
    color: '#ffc272ff'
  },
  { 
    name_en: 'Travel & Hotels', 
    name_ar: 'السفر والفنادق',
    icon: 'travel',
    color: '#64B5F6'
  },
  { 
    name_en: 'Sports & Fitness', 
    name_ar: 'الرياضة واللياقة',
    icon: 'sports_soccer',
    color: '#56e577ff'
  },
  { 
    name_en: 'Entertainment', 
    name_ar: 'الترفيه',
    icon: 'sports_esports',
    color: '#2e2bfcff'
  },
  { 
    name_en: 'Baby & Kids', 
    name_ar: 'الأطفال والرضع',
    icon: 'stroller',
    color: '#FFD54F'
  },
  { 
    name_en: 'Automotive', 
    name_ar: 'السيارات',
    icon: 'directions_car',
    color: '#3a3f41ff'
  },
  { 
    name_en: 'Books', 
    name_ar: 'الكتب',
    icon: 'book_2',
    color: '#876154ff'
  }
];

// ============================================================================
// SEED DATA - STORES (WITH CORRECT CATEGORY MAPPING)
// ============================================================================

const STORES = [
  // Fashion & Retail
  {
    name: 'Namshi',
    description: 'Leading online fashion destination in the Middle East',
    websiteUrl: 'https://www.namshi.com',
    logo: '/stores/namshi.webp',
    color: '#b6ed2f',
    affiliateNetwork: 'Optimise',
    trackingUrl: 'https://track.namshi.com/aff_c?offer_id=123',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Shein',
    description: 'International fashion retailer with affordable prices',
    websiteUrl: 'https://www.shein.com',
    logo: '/stores/shein.webp',
    color: '#000000',
    affiliateNetwork: 'CJ',
    trackingUrl: 'https://track.shein.com/aff_c?offer_id=456',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Ounass',
    description: 'Luxury fashion and lifestyle destination',
    websiteUrl: 'https://www.ounass.ae',
    logo: '/stores/ounass.webp',
    color: '#ffffff',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'H&M',
    description: 'Swedish multinational clothing retailer',
    websiteUrl: 'https://www2.hm.com',
    logo: '/stores/hm.webp',
    color: '#ffffff',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: 'Nike',
    description: 'World leader in athletic footwear and apparel',
    websiteUrl: 'https://www.nike.com',
    logo: '/stores/nike.webp',
    color: '#000000',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Sports & Fitness']
  },
  {
    name: 'Puma',
    description: 'Global sports brand specializing in athletic footwear and apparel',
    websiteUrl: 'https://www.puma.com',
    logo: '/stores/puma.webp',
    color: '#000000',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Sports & Fitness']
  },
  {
    name: 'Adidas',
    description: 'German multinational sportswear manufacturer',
    websiteUrl: 'https://www.adidas.com',
    logo: '/stores/adidas.webp',
    color: '#000000',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Sports & Fitness']
  },
  {
    name: 'Under Armour',
    description: 'American sports equipment and apparel company',
    websiteUrl: 'https://www.underarmour.com',
    logo: '/stores/underarmour.webp',
    color: '#000000',
    affiliateNetwork: 'CJ',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Sports & Fitness']
  },
  {
    name: 'Gosport',
    description: 'Sports equipment and apparel retailer in the Middle East',
    websiteUrl: 'https://www.gosport.com',
    logo: '/stores/gosport.webp',
    color: '#00458a',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: false,
    categories: ['Sports & Fitness']
  },
  {
    name: 'Next',
    description: 'British multinational clothing, footwear and home products retailer',
    websiteUrl: 'https://www.next.ae',
    logo: '/stores/next.webp',
    color: '#ffffff',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion', 'Home & Living']
  },
  {
    name: 'The Luxury Closet',
    description: 'Luxury fashion resale marketplace',
    websiteUrl: 'https://www.theluxurycloset.com',
    logo: '/stores/luxurycloset.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Dubai Phone',
    description: 'Mobile phones and electronics retailer in Dubai',
    websiteUrl: 'https://www.dubaiphone.net',
    logo: '/stores/dubaiphone.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Electronics']
  },
  {
    name: 'ASOS',
    description: 'British online fashion and cosmetic retailer',
    websiteUrl: 'https://www.asos.com',
    logo: '/stores/asos.webp',
    color: '#ffffff',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Beauty']
  },
  {
    name: 'Level Shoes',
    description: 'Luxury footwear destination in Dubai',
    websiteUrl: 'https://www.levelshoes.com',
    logo: '/stores/levelshoes.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Foot Locker',
    description: 'Global athletic footwear and apparel retailer',
    websiteUrl: 'https://www.footlocker.com',
    logo: '/stores/footlocker.webp',
    color: '#000000',
    affiliateNetwork: 'CJ',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Sports & Fitness']
  },
  {
    name: 'Dropkick',
    description: 'Sports apparel and equipment retailer',
    websiteUrl: 'https://www.dropkick.com',
    logo: '/stores/dropkick.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Sports & Fitness']
  },
  {
    name: 'Yallamomz',
    description: 'Platform for mothers and parenting essentials',
    websiteUrl: 'https://www.yallamomz.com',
    logo: '/stores/yallamomz.webp',
    color: '#ff6b6b',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Baby & Kids']
  },
  {
    name: 'Yalla Toys',
    description: 'Toys and games retailer in the Middle East',
    websiteUrl: 'https://www.yallatoys.com',
    logo: '/stores/yallatoys.webp',
    color: '#ffcc00',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Baby & Kids']
  },
  {
    name: 'Fashion Eyewear',
    description: 'Designer sunglasses and eyewear retailer',
    websiteUrl: 'https://www.fashioneyewear.com',
    logo: '/stores/fashioneyewear.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: 'Keeta',
    description: 'Online fashion and lifestyle retailer',
    websiteUrl: 'https://www.keeta.com',
    logo: '/stores/keeta.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: 'Talabat',
    description: 'Food delivery and grocery service in the Middle East',
    websiteUrl: 'https://www.talabat.com',
    logo: '/stores/talabat.webp',
    color: '#ff6600',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: true,
    categories: ['Food & Dining']
  },
  {
    name: '2B',
    description: 'Fashion retailer offering trendy clothing',
    websiteUrl: 'https://www.2b.com',
    logo: '/stores/2b.webp',
    color: '#000000',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: '6th Street',
    description: 'Online fashion and lifestyle destination',
    websiteUrl: 'https://www.6thstreet.com',
    logo: '/stores/6thstreet.webp',
    color: '#00458a',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: 'Baytonia',
    description: 'Luxury fashion and accessories retailer',
    websiteUrl: 'https://www.baytonia.com',
    logo: '/stores/baytonia.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  
  // Electronics
  {
    name: 'Noon',
    description: 'Regional e-commerce platform for everything',
    websiteUrl: 'https://www.noon.com',
    logo: '/stores/noon.webp',
    color: '#f0ff00',
    affiliateNetwork: 'In-house',
    trackingUrl: 'https://track.noon.com/aff_c?offer_id=789',
    isActive: true,
    isFeatured: true,
    categories: ['Electronics', 'Fashion', 'Home & Living']
  },
  {
    name: 'Amazon',
    description: 'Global marketplace with millions of products',
    websiteUrl: 'https://www.amazon.ae',
    logo: '/stores/amazon.webp',
    color: '#131921',
    affiliateNetwork: 'Amazon Associates',
    trackingUrl: 'https://track.amazon.ae/aff_c?offer_id=111',
    isActive: true,
    isFeatured: true,
    categories: ['Electronics', 'Books', 'Home & Living']
  },
  {
    name: 'Jarir',
    description: 'Leading retailer of electronics and books in Saudi Arabia',
    websiteUrl: 'https://www.jarir.com',
    logo: '/stores/jarir.webp',
    color: '#ffffff',
    affiliateNetwork: 'DCM',
    isActive: true,
    isFeatured: true,
    categories: ['Electronics', 'Books']
  },
  {
    name: 'Dubai Phone',
    description: 'Mobile phones and electronics retailer in Dubai',
    websiteUrl: 'https://www.dubaiphone.net',
    logo: '/stores/dubaiphone.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Electronics']
  },
  {
    name: 'Dyson',
    description: 'Innovative home appliances and technology',
    websiteUrl: 'https://www.dyson.com',
    logo: '/stores/dyson.webp',
    color: '#000000',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Electronics', 'Home & Living']
  },
  
  // Beauty & Personal Care
  {
    name: 'Sephora',
    description: 'World leader in beauty retail',
    websiteUrl: 'https://www.sephora.ae',
    logo: '/stores/sephora.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    trackingUrl: 'https://track.sephora.ae/aff_c?offer_id=222',
    isActive: true,
    isFeatured: true,
    categories: ['Beauty']
  },
  {
    name: 'Golden Scent',
    description: 'Premium Arabian & International fragrances',
    websiteUrl: 'https://www.goldenscent.com',
    logo: '/stores/goldenscent.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Beauty']
  },
  {
    name: 'The Body Shop',
    description: 'Ethical beauty and skincare products',
    websiteUrl: 'https://www.thebodyshop.com',
    logo: '/stores/bodyshop.webp',
    color: '#008080',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Beauty']
  },
  {
    name: 'Eyewa',
    description: 'Online eyewear and contact lenses retailer',
    websiteUrl: 'https://www.eyewa.com',
    logo: '/stores/eyewa.webp',
    color: '#00458a',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Beauty']
  },
  {
    name: 'Bath & Body Works',
    description: 'Fragrance and body care products',
    websiteUrl: 'https://www.bathandbodyworks.com',
    logo: '/stores/bathbodyworks.webp',
    color: '#ff6699',
    affiliateNetwork: 'CJ',
    isActive: true,
    isFeatured: true,
    categories: ['Beauty']
  },
  {
    name: 'Dr. M',
    description: 'Skincare and dermatology products',
    websiteUrl: 'https://www.drm.com',
    logo: '/stores/drm.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Beauty']
  },
  {
    name: 'Styli',
    description: 'Beauty and cosmetics retailer',
    websiteUrl: 'https://www.styli.com',
    logo: '/stores/styli.webp',
    color: '#ff3366',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Beauty']
  },
  {
    name: 'Huda Beauty',
    description: 'Global cosmetics brand by Huda Kattan',
    websiteUrl: 'https://www.hudabeauty.com',
    logo: '/stores/hudabeauty.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Beauty']
  },
  {
    name: 'Rituals',
    description: 'Luxury home and body cosmetics',
    websiteUrl: 'https://www.rituals.com',
    logo: '/stores/rituals.webp',
    color: '#000000',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Beauty', 'Home & Living']
  },
  {
    name: 'YSL Beauty',
    description: 'Luxury cosmetics and fragrances',
    websiteUrl: 'https://www.yslbeauty.com',
    logo: '/stores/yslbeauty.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Beauty']
  },
  {
    name: 'Al Dakheel Oud',
    description: 'Arabian perfumes and oud fragrances',
    websiteUrl: 'https://www.aldakheeloud.com',
    logo: '/stores/aldakheeloud.webp',
    color: '#8b4513',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Beauty']
  },
  {
    name: 'Magrabi',
    description: 'Luxury eyewear and optical services',
    websiteUrl: 'https://www.magrabi.com',
    logo: '/stores/magrabi.webp',
    color: '#00458a',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Beauty']
  },
  
  // Travel
  {
    name: 'Booking.com',
    description: 'Book hotels, homes, and experiences worldwide',
    websiteUrl: 'https://www.booking.com',
    logo: '/stores/booking.webp',
    color: '#003b95',
    affiliateNetwork: 'Booking Partner',
    trackingUrl: 'https://track.booking.com/aff_c?offer_id=444',
    isActive: true,
    isFeatured: true,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Almosafer',
    description: 'Travel platform for flights and hotels in MENA',
    websiteUrl: 'https://www.almosafer.com',
    logo: '/stores/almosafer.webp',
    color: '#003143',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Expedia',
    description: 'Global travel platform for flights, hotels, and packages',
    websiteUrl: 'https://www.expedia.com',
    logo: '/stores/expedia.webp',
    color: '#003580',
    affiliateNetwork: 'Expedia Partner',
    isActive: true,
    isFeatured: true,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Qatar Airways',
    description: 'National airline of Qatar',
    websiteUrl: 'https://www.qatarairways.com',
    logo: '/stores/qatarairways.webp',
    color: '#8a1538',
    affiliateNetwork: 'Travel Affiliate',
    isActive: true,
    isFeatured: true,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Airalo',
    description: 'eSIM store for international travel',
    websiteUrl: 'https://www.airalo.com',
    logo: '/stores/airalo.webp',
    color: '#00a0dc',
    affiliateNetwork: 'Airalo Affiliate',
    isActive: true,
    isFeatured: true,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Flynas',
    description: 'Saudi Arabian low-cost airline',
    websiteUrl: 'https://www.flynas.com',
    logo: '/stores/flynas.webp',
    color: '#00458a',
    affiliateNetwork: 'Travel Affiliate',
    isActive: true,
    isFeatured: false,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Hotels',
    description: 'Hotel booking platform',
    websiteUrl: 'https://www.hotels.com',
    logo: '/stores/hotels.webp',
    color: '#003580',
    affiliateNetwork: 'Expedia Partner',
    isActive: true,
    isFeatured: false,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Trip',
    description: 'Travel booking and hotel reservation platform',
    websiteUrl: 'https://www.trip.com',
    logo: '/stores/trip.webp',
    color: '#ff6600',
    affiliateNetwork: 'Travel Affiliate',
    isActive: true,
    isFeatured: false,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Jazeera Airways',
    description: 'Kuwaiti low-cost airline',
    websiteUrl: 'https://www.jazeeraairways.com',
    logo: '/stores/jazeeraairways.webp',
    color: '#8a1538',
    affiliateNetwork: 'Travel Affiliate',
    isActive: true,
    isFeatured: false,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Air India',
    description: 'National airline of India',
    websiteUrl: 'https://www.airindia.com',
    logo: '/stores/airindia.webp',
    color: '#ff671f',
    affiliateNetwork: 'Travel Affiliate',
    isActive: true,
    isFeatured: false,
    categories: ['Travel & Hotels']
  },
  {
    name: 'Etihad Airways',
    description: 'National airline of the United Arab Emirates',
    websiteUrl: 'https://www.etihad.com',
    logo: '/stores/etihad.webp',
    color: '#ff671f',
    affiliateNetwork: 'Travel Affiliate',
    isActive: true,
    isFeatured: true,
    categories: ['Travel & Hotels']
  },
  
  // Home & Living
  {
    name: 'IKEA',
    description: 'Swedish furniture and home accessories retailer',
    websiteUrl: 'https://www.ikea.com',
    logo: '/stores/ikea.webp',
    color: '#0058ab',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Home & Living']
  },
  {
    name: 'The Home Store',
    description: 'Furniture and home decor retailer',
    websiteUrl: 'https://www.thehomestore.com',
    logo: '/stores/homestore.webp',
    color: '#00458a',
    affiliateNetwork: 'DCM',
    isActive: true,
    isFeatured: false,
    categories: ['Home & Living']
  },
  
  // Sports & Fitness
  {
    name: 'Sun & Sand Sports',
    description: 'Leading sports retailer in the Middle East',
    websiteUrl: 'https://www.sunandsandsports.com',
    logo: '/stores/sunandsand.webp',
    color: '#00458a',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Sports & Fitness']
  },
  {
    name: 'New Balance',
    description: 'American sports footwear and apparel brand',
    websiteUrl: 'https://www.newbalance.com',
    logo: '/stores/newbalance.webp',
    color: '#000000',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Sports & Fitness', 'Fashion']
  },
  {
    name: 'Blends',
    description: 'Sports nutrition and supplements',
    websiteUrl: 'https://www.blends.com',
    logo: '/stores/blends.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Sports & Fitness']
  },
  
  // Baby & Kids
  {
    name: 'Mumzworld',
    description: 'Everything for mothers, babies, and children',
    websiteUrl: 'https://www.mumzworld.com',
    logo: '/stores/mumzworld.webp',
    color: '#00458a',
    affiliateNetwork: 'Optimise',
    trackingUrl: 'https://track.mumzworld.com/aff_c?offer_id=555',
    isActive: true,
    isFeatured: true,
    categories: ['Baby & Kids']
  },
  {
    name: 'Mamas and Papas',
    description: 'Premium nursery and baby products',
    websiteUrl: 'https://www.mamasandpapas.com',
    logo: '/stores/mamasandpapas.webp',
    color: '#ff6699',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Baby & Kids']
  },
  {
    name: 'Mothercare',
    description: 'International retailer of products for mothers-to-be',
    websiteUrl: 'https://www.mothercare.com',
    logo: '/stores/mothercare.webp',
    color: '#00458a',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: false,
    categories: ['Baby & Kids']
  },
  {
    name: 'FirstCry',
    description: 'India\'s largest online store for baby and kids products',
    websiteUrl: 'https://www.firstcry.com',
    logo: '/stores/firstcry.webp',
    color: '#ff6600',
    affiliateNetwork: 'FirstCry Affiliate',
    isActive: true,
    isFeatured: true,
    categories: ['Baby & Kids']
  },
  
  // Additional Fashion
  {
    name: 'Defacto',
    description: 'International fashion brand',
    websiteUrl: 'https://www.defacto.com',
    logo: '/stores/defacto.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: 'Max Fashion',
    description: 'Value fashion retailer in the Middle East',
    websiteUrl: 'https://www.maxfashion.com',
    logo: '/stores/maxfashion.webp',
    color: '#ff0000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Dabdoob',
    description: 'Fashion and lifestyle retailer',
    websiteUrl: 'https://www.dabdoob.com',
    logo: '/stores/dabdoob.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: 'Bloomingdale\'s',
    description: 'American luxury department store',
    websiteUrl: 'https://www.bloomingdales.com',
    logo: '/stores/bloomingdales.webp',
    color: '#000000',
    affiliateNetwork: 'CJ',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'GAP',
    description: 'American clothing and accessories retailer',
    websiteUrl: 'https://www.gap.com',
    logo: '/stores/gap.webp',
    color: '#00458a',
    affiliateNetwork: 'CJ',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Farfetch',
    description: 'Global luxury fashion online platform',
    websiteUrl: 'https://www.farfetch.com',
    logo: '/stores/farfetch.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Vogacloset',
    description: 'Luxury fashion rental platform',
    websiteUrl: 'https://www.vogacloset.com',
    logo: '/stores/vogacloset.webp',
    color: '#000000',
    affiliateNetwork: 'Optimise',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  {
    name: 'Swarovski',
    description: 'Austrian producer of crystal jewelry and accessories',
    websiteUrl: 'https://www.swarovski.com',
    logo: '/stores/swarovski.webp',
    color: '#000000',
    affiliateNetwork: 'Awin',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion']
  },
  {
    name: 'Victoria\'s Secret',
    description: 'American lingerie, clothing, and beauty retailer',
    websiteUrl: 'https://www.victoriassecret.com',
    logo: '/stores/victoriassecret.webp',
    color: '#000000',
    affiliateNetwork: 'CJ',
    isActive: true,
    isFeatured: true,
    categories: ['Fashion', 'Beauty']
  },
  {
    name: 'Deraah',
    description: 'Arabian fashion and accessories',
    websiteUrl: 'https://www.deraah.com',
    logo: '/stores/deraah.webp',
    color: '#8b4513',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Fashion']
  },
  
  // Services & Other
  {
    name: 'Noon Now Now',
    description: 'Express delivery service from Noon',
    websiteUrl: 'https://now.noon.com',
    logo: '/stores/noonnow.webp',
    color: '#f0ff00',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Electronics', 'Fashion', 'Home & Living']
  },
  {
    name: 'Raya Shop',
    description: 'Online marketplace in the UAE',
    websiteUrl: 'https://www.rayashop.com',
    logo: '/stores/rayashop.webp',
    color: '#00458a',
    affiliateNetwork: 'In-house',
    isActive: true,
    isFeatured: false,
    categories: ['Electronics', 'Fashion', 'Home & Living']
  }
];

// ============================================================================
// VOUCHER TEMPLATES
// ============================================================================

const VOUCHER_TEMPLATES = {
  percentageOff: [
    { discount: '10%', title_suffix: 'Off', exclusive: false, verified: true },
    { discount: '15%', title_suffix: 'Off First Order', exclusive: true, verified: true },
    { discount: '20%', title_suffix: 'Off', exclusive: false, verified: true },
    { discount: '25%', title_suffix: 'Off Sale Items', exclusive: false, verified: false },
    { discount: '30%', title_suffix: 'Off', exclusive: true, verified: true },
    { discount: '40%', title_suffix: 'Off Selected Items', exclusive: false, verified: true },
    { discount: '50%', title_suffix: 'Off Everything', exclusive: true, verified: true },
    { discount: 'Up to 70%', title_suffix: 'Off Clearance', exclusive: false, verified: false }
  ],
  
  freeShipping: [
    { title_en: 'Free Shipping on All Orders', title_ar: 'شحن مجاني على جميع الطلبات' },
    { title_en: 'Free Express Shipping', title_ar: 'شحن سريع مجاني' },
    { title_en: 'Free Delivery Over 100 SAR', title_ar: 'توصيل مجاني للطلبات فوق 100 ريال' }
  ],
  
  deals: [
    { title_en: 'Buy 1 Get 1 Free', title_ar: 'اشتر واحد واحصل على الثاني مجاناً', discount: 'BOGO' },
    { title_en: 'Buy 2 Get 30% Off', title_ar: 'اشتر 2 واحصل على خصم 30%', discount: 'Buy 2 Save 30%' },
    { title_en: 'Spend 500 SAR, Save 100 SAR', title_ar: 'أنفق 500 ريال، وفر 100 ريال', discount: '100 SAR Off' },
    { title_en: 'Flash Sale - Limited Time', title_ar: 'تخفيضات سريعة - وقت محدود', discount: 'Up to 60% Off' }
  ]
};

function generateCode(storeName, discount) {
  const prefix = storeName.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${discount.replace(/[^0-9]/g, '')}${random}`;
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.voucherClick.deleteMany();
  await prisma.voucherCountry.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.storeCategory.deleteMany();
  await prisma.storeCountry.deleteMany();
  await prisma.store.deleteMany();
  await prisma.category.deleteMany();
  await prisma.country.deleteMany();
  
  console.log('✅ Cleanup complete\n');

  // ============================================================================
  // SEED COUNTRIES
  // ============================================================================
  
  console.log('🌍 Seeding countries...');
  const countries = await Promise.all(
    COUNTRIES.map(country => 
      prisma.country.create({ data: country })
    )
  );
  console.log(`✅ Created ${countries.length} countries\n`);

  // ============================================================================
  // SEED CATEGORIES
  // ============================================================================
  
  console.log('📁 Seeding categories...');
  const categories = await Promise.all(
    CATEGORIES.map(category => 
      prisma.category.create({
        data: {
          ...category,
          slug: slugify(category.name_en)
        }
      })
    )
  );
  console.log(`✅ Created ${categories.length} categories\n`);

  // ============================================================================
  // SEED STORES & VOUCHERS
  // ============================================================================
  
  console.log('🏪 Seeding stores and vouchers...');
  
  let totalVouchers = 0;
  
  for (const storeData of STORES) {
    // Create store
    const store = await prisma.store.create({
      data: {
        name: storeData.name,
        slug: slugify(storeData.name),
        logo: storeData.logo,
        websiteUrl: storeData.websiteUrl,
        description: storeData.description,
        affiliateNetwork: storeData.affiliateNetwork,
        trackingUrl: storeData.trackingUrl,
        isActive: storeData.isActive,
        isFeatured: storeData.isFeatured
      }
    });

    console.log(`\n📦 Processing: ${store.name}`);

    // Link store to ALL countries
    console.log(`  🌍 Linking to countries...`);
    for (const country of countries) {
      await prisma.storeCountry.create({
        data: {
          storeId: store.id,
          countryId: country.id
        }
      });
    }
    console.log(`  ✓ Linked to ${countries.length} countries`);

    // Link store to categories
    const storeCategoryNames = storeData.categories || [];
    console.log(`  📂 Linking to categories: ${storeCategoryNames.join(', ')}`);
    
    for (const catName of storeCategoryNames) {
      const category = categories.find(c => 
        c.name_en.toLowerCase() === catName.toLowerCase()
      );
      
      if (category) {
        await prisma.storeCategory.create({
          data: {
            storeId: store.id,
            categoryId: category.id
          }
        });
        console.log(`    ✓ Linked to: ${category.name_en}`);
      } else {
        console.log(`    ⚠️  Category not found: ${catName}`);
      }
    }

    // Generate vouchers for this store
    const storeVouchers = [];

    // 1. Percentage discount codes (2-4 per store)
    const numPercentage = Math.floor(Math.random() * 3) + 2;
    const percentageTemplates = VOUCHER_TEMPLATES.percentageOff
      .sort(() => 0.5 - Math.random())
      .slice(0, numPercentage);

    for (const template of percentageTemplates) {
      const code = generateCode(store.name, template.discount);
      const expiryDays = Math.floor(Math.random() * 60) + 30;
      
      storeVouchers.push({
        title_en: `${template.discount} ${template.title_suffix}`,
        title_ar: `خصم ${template.discount}`,
        description_en: `Get ${template.discount} off your purchase at ${store.name}`,
        description_ar: `احصل على خصم ${template.discount} على مشترياتك من ${store.name}`,
        code: code,
        type: 'CODE',
        discount: template.discount,
        landingUrl: `${storeData.trackingUrl}?code=${code}`,
        startDate: new Date(),
        expiryDate: futureDate(expiryDays),
        isExclusive: template.exclusive,
        isVerified: template.verified,
        popularityScore: Math.floor(Math.random() * 1000)
      });
    }

    // 2. Free shipping (1-2 per store)
    if (Math.random() > 0.3) {
      const shippingTemplate = VOUCHER_TEMPLATES.freeShipping[
        Math.floor(Math.random() * VOUCHER_TEMPLATES.freeShipping.length)
      ];
      
      const hasCode = Math.random() > 0.5;
      
      storeVouchers.push({
        title_en: shippingTemplate.title_en,
        title_ar: shippingTemplate.title_ar,
        description_en: `Enjoy free shipping on orders from ${store.name}`,
        description_ar: `استمتع بالشحن المجاني على الطلبات من ${store.name}`,
        code: hasCode ? generateCode(store.name, 'SHIP') : null,
        type: hasCode ? 'CODE' : 'FREE_SHIPPING',
        discount: 'Free Shipping',
        landingUrl: hasCode ? `${storeData.trackingUrl}?code=SHIP` : storeData.trackingUrl,
        startDate: new Date(),
        expiryDate: futureDate(Math.floor(Math.random() * 90) + 30),
        isExclusive: false,
        isVerified: true,
        popularityScore: Math.floor(Math.random() * 800)
      });
    }

    // 3. Special deals (1-3 per store)
    const numDeals = Math.floor(Math.random() * 3) + 1;
    const dealTemplates = VOUCHER_TEMPLATES.deals
      .sort(() => 0.5 - Math.random())
      .slice(0, numDeals);

    for (const template of dealTemplates) {
      storeVouchers.push({
        title_en: template.title_en,
        title_ar: template.title_ar,
        description_en: `Special deal at ${store.name}`,
        description_ar: `عرض خاص في ${store.name}`,
        code: null,
        type: 'DEAL',
        discount: template.discount,
        landingUrl: storeData.trackingUrl,
        startDate: new Date(),
        expiryDate: futureDate(Math.floor(Math.random() * 30) + 15),
        isExclusive: Math.random() > 0.6,
        isVerified: Math.random() > 0.3,
        popularityScore: Math.floor(Math.random() * 1200)
      });
    }

    // Create vouchers and link to countries
    console.log(`  🎟️  Creating ${storeVouchers.length} vouchers...`);
    for (const voucherData of storeVouchers) {
      const voucher = await prisma.voucher.create({
        data: {
          ...voucherData,
          storeId: store.id
        }
      });

      // Link voucher to ALL countries
      for (const country of countries) {
        await prisma.voucherCountry.create({
          data: {
            voucherId: voucher.id,
            countryId: country.id
          }
        });
      }
    }

    totalVouchers += storeVouchers.length;
    console.log(`  ✓ Created ${storeVouchers.length} vouchers`);
  }

  console.log(`\n✅ Created ${STORES.length} stores with ${totalVouchers} total vouchers\n`);

  // ============================================================================
  // SEED ANALYTICS DATA (Voucher Clicks)
  // ============================================================================
  
  console.log('📊 Seeding click analytics...');
  
  const vouchers = await prisma.voucher.findMany();
  let totalClicks = 0;

  for (const voucher of vouchers) {
    const numClicks = Math.floor(Math.random() * 46) + 5;
    
    const clicks = [];
    for (let i = 0; i < numClicks; i++) {
      clicks.push({
        voucherId: voucher.id,
        ipHash: Math.random().toString(36).substring(2, 15),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        referrer: 'https://google.com',
        countryCode: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].code,
        clickedAt: randomDate(new Date(2024, 0, 1), new Date())
      });
    }

    await prisma.voucherClick.createMany({
      data: clicks
    });

    totalClicks += numClicks;
  }

  console.log(`✅ Created ${totalClicks} voucher clicks\n`);

  // ============================================================================
  // VERIFICATION
  // ============================================================================
  
  console.log('🔍 Verifying data integrity...\n');
  
  console.log('Categories with stores:');
  for (const category of categories) {
    const storeCount = await prisma.storeCategory.count({
      where: { categoryId: category.id }
    });
    console.log(`  ${category.name_en.padEnd(20)} : ${storeCount} stores`);
  }

  console.log('\nStores by country:');
  for (const country of countries) {
    const storeCount = await prisma.storeCountry.count({
      where: { countryId: country.id }
    });
    console.log(`  ${country.name_en.padEnd(20)} : ${storeCount} stores`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  
  console.log('\n📈 Seed Summary:');
  console.log('================');
  console.log(`Countries: ${countries.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Stores: ${STORES.length}`);
  console.log(`Vouchers: ${totalVouchers}`);
  console.log(`Clicks: ${totalClicks}`);
  console.log('================\n');
  
  console.log('✨ Seed completed successfully!');
}

// ============================================================================
// EXECUTE
// ============================================================================

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });