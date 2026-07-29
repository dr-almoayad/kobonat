// app/[locale]/product/[slug]/page.jsx
import ProductInfo from '@/components/product_info/ProductInfo';
import ProductSpecs from '@/components/productSpecs/productSpecs';
import PriceList from '@/components/pricelist/priceList';
import PriceHistory from '@/components/price_history/priceHistory';
import TabNavigation from '@/components/tabnav/Tabnav';
// import SimilarProductsCarousel from '@/components/carousel/SimilarProductsCarousel';
// import BoughtTogetherCarousel from '@/components/carousel/BoughtTogetherCarousel';
import { setRequestLocale } from 'next-intl/server';
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs';
import { ProductProvider } from '@/contexts/ProductContext';
import { getComparisonProduct } from '@/lib/comparison/getComparisonProduct';
import { notFound } from 'next/navigation';
import './product_page.css';

// ISR – revalidate every hour, stale-while-revalidate handles real-time requests
export const revalidate = 3600;
export const dynamicParams = true;

// ✅ SEO: Generate dynamic metadata using the product data
export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const product = await getComparisonProduct(slug, locale);
  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false },
    };
  }

  const bestPrice = product.allOffers?.sort((a, b) => a.effectivePrice - b.effectivePrice)[0]?.effectivePrice || null;
  const title = `${product.name} – Best Prices & Deals | Cobonat`;
  const description = bestPrice
    ? `Compare prices for ${product.name} from top retailers in Saudi Arabia. Best price from ${bestPrice.toFixed(2)} SAR.`
    : `Find the best deals on ${product.name}. Compare prices and save at Cobonat.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images?.[0] || '/logo-512x512.png',
      type: 'product',
      url: `/${locale}/product/${slug}`,
    },
    alternates: {
      canonical: `/${locale}/product/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  // Pre‑build the most popular products (e.g., top 100)
  // For now, just return empty to let ISR handle on-demand
  return [];
}

export default async function ProductPage({ params }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const product = await getComparisonProduct(slug, locale);
  if (!product) notFound();

  return (
    <div className="product_page_wrapper">
      <Breadcrumbs
        category={product.category}
        brand={product.brand}
        product={product}
      />

      <ProductProvider product={product}>
        <section className="product_page">
          <ProductInfo product={product} />
          <TabNavigation />
          <div className="product_page_grid">
            <section id="price-list" className="tab_section">
              <PriceList product={product} />
            </section>
            <section id="price-history" className="tab_section">
              <PriceHistory product={product} />
            </section>
            <section id="product-specs" className="tab_section">
              <ProductSpecs product={product} />
            </section>
            <aside className="compare-sidebar">{/* optional */}</aside>
          </div>
          <section className="tab_section">
            {/* <BoughtTogetherCarousel
              productId={product.id}
              categoryId={product.category?.id}
              limit={8}
            /> */}
          </section>
          <section className="tab_section">
            {/* <SimilarProductsCarousel
              productId={product.id}
              categoryId={product.category?.id}
              brandId={product.brand?.id}
              limit={12}
            /> */}
          </section>
        </section>
      </ProductProvider>
    </div>
  );
}
