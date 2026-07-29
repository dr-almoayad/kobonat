// components/product_info/ProductInfo.jsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { addToRecentlyViewed } from "@/utils/recentlyViewed";
import VariantSelector from '../VariantSelector/VariantSelector';
import OfferCard from '../pricelist/OfferCard';
import { useComparison } from '@/contexts/ComparisonContext';
import ProductBadges from '../ProductBadges/ProductBadges';
import { useProduct } from '@/contexts/ProductContext';
import './product_info.css';

export default function ProductInfo({ product }) {
  if (!product) return null;

  const t = useTranslations('ProductInfo');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { data: session } = useSession();

  // ── Context ──
  const { bestOffer, updateVariant } = useProduct();
  const { addToCompare, isInComparison, removeFromCompare } = useComparison();

  // ── UI State ──
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || '/placeholder.png');
  const [heartFill, setHeartFill] = useState(false);
  const [alertFill, setAlertFill] = useState(false);

  // ── Computed ──
  const brandLogo = product.brand?.logo || product.brand?.name || "N/A";
  const productTitle = product.name; // Already localized in the fetched data
  const productDescription = product.description;

  // ── Recently viewed ──
  useEffect(() => {
    if (product) addToRecentlyViewed(product);
  }, [product]);

  // ── Variant change handler ──
  const handleVariantChange = useCallback(({ variant }) => {
    updateVariant(variant);
    if (variant) {
      // If the variant has its own image, use it; otherwise keep current
      if (variant.image) {
        setSelectedImage(variant.image);
      } else {
        // fallback: use the product's first image
        setSelectedImage(product.images?.[0] || '/placeholder.png');
      }
    } else {
      // reset to product's first image when no variant selected
      setSelectedImage(product.images?.[0] || '/placeholder.png');
    }
  }, [updateVariant, product.images]);

  // ── Seller info for the best offer ──
  const lowestSellerInfo = bestOffer
    ? {
        name: bestOffer.store?.name || 'Store',
        avatar: bestOffer.store?.logo || '/placeholder_store.png',
        accent: bestOffer.store?.accent || '#000'
      }
    : null;

  // ── Track view (stub – API may not exist yet) ──
  useEffect(() => {
    const trackView = async () => {
      try {
        const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
        sessionStorage.setItem('session_id', sessionId);
        // These endpoints may not be implemented – wrap in try/catch
        await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        await fetch('/api/products/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, sessionId })
        });
      } catch (error) {
        // Silently fail – tracking is non‑critical
        console.debug('View tracking failed (stub):', error);
      }
    };
    trackView();
  }, [product.id]);

  // ── Wishlist (stub – user account required) ──
  const handleWishlist = async () => {
    if (!session) {
      alert(t('pleaseSignIn'));
      return;
    }
    // Instead of making a real API call, show a "coming soon" message
    alert(t('comingSoon') || 'Wishlist coming soon!');
    // Toggle locally for UI feedback
    setHeartFill(!heartFill);
  };

  // ── Price alert (stub) ──
  const handlePriceAlert = async () => {
    if (!session) {
      alert(t('pleaseSignIn'));
      return;
    }
    const targetPrice = prompt(t('enterTargetPrice'));
    if (!targetPrice) return;
    alert(t('comingSoon') || 'Price alerts coming soon!');
    setAlertFill(!alertFill);
  };

  // ── Compare (stub – uses context, but may fail if no API) ──
  const handleCompare = () => {
    if (isInComparison(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <section className="product_info">
      <div className="product_info_wrapper">

        {/* ── MOBILE TOP SECTION ── */}
        <div className="product_top_section">
          <div className="product_media">
            <Link href={`/brands/${encodeURIComponent(product.brand?.slug || '')}`}>
              <Image className="product_brand" src={brandLogo} width={60} height={60} alt={product.brand?.name || 'Brand'} />
            </Link>
            <div className="product_image_gallery">
              {product.images?.length > 1 && (
                <div className="thumbnail_strip">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      className={`thumb_item ${selectedImage === img ? 'active' : ''}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <Image src={img} alt={`${productTitle} ${i}`} width={80} height={80} />
                    </button>
                  ))}
                </div>
              )}
              <div className="main_image">
                <Image src={selectedImage} alt={productTitle} width={800} height={800} priority />
              </div>
            </div>
          </div>

          <div className="product_details_mobile">
            <div className="title"><h2>{productTitle}</h2></div>
            <div className="product_actions_mobile">
              <button onClick={handleWishlist} title={t('addToWishlist')}>
                <i className={`bi ${heartFill ? "bi-heart-fill" : "bi-heart"}`}></i>
              </button>
              <button onClick={handlePriceAlert} title={t('priceAlert')}>
                <i className={`bi ${alertFill ? "bi-bell-fill" : "bi-bell"}`}></i>
              </button>
              <button onClick={handleCompare} title={t('compare')}>
                <i className="bi bi-arrow-left-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP MEDIA (Left Column) ── */}
        <div className="product_media product_media_desktop">
          <Link href={`/brands/${encodeURIComponent(product.brand?.slug || '')}`}>
            <Image className="product_brand" src={brandLogo} width={60} height={60} alt={product.brand?.name || 'Brand'} />
          </Link>
          <div className="product_image_gallery">
            {product.images && product.images.length > 0 && (
              <div className="thumbnail_strip">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    className={`thumb_item ${selectedImage === img ? 'active' : ''}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image src={img} alt={`${productTitle} ${i}`} width={80} height={80} />
                  </button>
                ))}
              </div>
            )}
            <div className="main_image">
              <Image src={selectedImage} alt={productTitle} width={800} height={800} priority />
            </div>
          </div>
        </div>

        {/* ── DESKTOP DETAILS (Center Column) ── */}
        <div className="product_details_desktop">
          <div className="product_tags">
            <ProductBadges
              product={product}
              priceHistory={[]}
              categoryRank={1}
              watchCount={400}
            />
          </div>

          <Link className="brand_page_link" href={`/brands/${encodeURIComponent(product.brand?.slug || '')}`}>
            <h1>{t('shopAllFrom', { brand: product.brand?.name || '' })}</h1>
          </Link>

          <div className="title"><h2>{productTitle}</h2></div>

          <div className="product_actions">
            <button className="wishlist_btn" onClick={handleWishlist}>
              <span className={`material-symbols-sharp ${heartFill ? "filled" : ""}`}>favorite</span>
              <p>{t('addToWishlist')}</p>
            </button>
            <div className="separator"></div>
            <button className="alert_btn" onClick={handlePriceAlert}>
              <span className={`material-symbols-sharp ${alertFill ? "filled" : ""}`}>notifications</span>
              <p>{t('priceAlert')}</p>
            </button>
            <div className="separator"></div>
            <button onClick={handleCompare} className={`compare_btn ${isInComparison(product.id) ? 'active' : ''}`}>
              <span className="material-symbols-sharp">compare_arrows</span>
              <p>{isInComparison(product.id) ? t('removeCompare') : t('compare')}</p>
            </button>
          </div>

          <div className="block_separator"></div>

          <div className="description">{productDescription || t('noDescription')}</div>

          <VariantSelector product={product} onVariantChange={handleVariantChange} />
        </div>

        {/* ── MOBILE DESCRIPTION ── */}
        <div className="description_mobile">
          <p>{productDescription || t('noDescription')}</p>
          <VariantSelector product={product} onVariantChange={handleVariantChange} />
        </div>

        {/* ── RIGHT COLUMN: BEST OFFER ── */}
        <div className="area-other">
          {bestOffer ? (
            <div className="store_card_sticky_wrapper">
              <OfferCard
                sellerProduct={bestOffer}
                sellerInfo={lowestSellerInfo}
                highlight={true}
              />
            </div>
          ) : (
            <div className="store-card-clean" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              <p>{t('selectOptionsToSee')}</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
