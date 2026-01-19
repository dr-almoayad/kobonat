// contexts/ProductContext.jsx - SMART VERSION
'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children, product }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false); // Track if user clicked anything
  const [serverStores, setServerStores] = useState(product?.stores || []);
  const [hasServerDataLoaded, setHasServerDataLoaded] = useState(true);

  // Update when product changes
  useEffect(() => {
    if (product?.stores) {
      setServerStores(product.stores);
      setHasServerDataLoaded(true);
      // Reset interaction flag when product changes
      setUserHasInteracted(false);
      setSelectedVariant(null);
    }
  }, [product?.id]);

  // Calculate active offers
  const activeOffers = useMemo(() => {
    // ✅ SMART LOGIC: Only use variant prices if user explicitly selected
    if (!selectedVariant || !userHasInteracted) {
      console.log('📦 Using base product prices (no user selection)');
      return serverStores;
    }

    console.log('🎯 Using variant prices (user selected)');
    const storeVariants = selectedVariant.storeVariants || [];
    
    if (storeVariants.length === 0) {
      console.warn('⚠️ No store variants, falling back to base prices');
      return serverStores;
    }

    const transformed = storeVariants.map(sv => ({
      productId: product.id,
      storeId: sv.storeId,
      price: sv.price,
      currency: sv.currency || 'SAR',
      shippingCost: sv.shippingCost || 0,
      shippingCurrency: sv.shippingCurrency || 'SAR',
      deliveryTime: sv.deliveryTime || '3-5 days',
      shipsFrom: sv.shipsFrom || sv.store?.name || 'Not specified',
      isInternational: sv.isInternational || false,
      shipsFromCountry: sv.shipsFromCountry || null,
      customsFeesEstimate: sv.customsFeesEstimate || 0,
      taxFeesEstimate: sv.taxFeesEstimate || 0,
      feesCurrency: sv.feesCurrency || 'SAR',
      cashOnDeliveryAvailable: sv.cashOnDeliveryAvailable || sv.store?.acceptsCashOnDelivery || false,
      buyNowPayLaterAvailable: sv.buyNowPayLaterAvailable || false,
      availablePaymentMethods: sv.availablePaymentMethods || sv.store?.paymentOptions || [],
      bnplProvidersForProduct: sv.bnplProvidersForVariant || sv.store?.bnplProviders || [],
      isReturnable: sv.isReturnable !== undefined ? sv.isReturnable : (sv.store?.acceptsReturns || true),
      returnWindowDays: sv.returnWindowDays || sv.store?.returnWindowDays || 14,
      isActive: sv.isInStock || true,
      productUrl: sv.productUrl || null,
      store: sv.store || {
        id: sv.storeId,
        name: 'Unknown Store',
        logoUrl: '/placeholder_store.png',
        accent: '#000'
      }
    }));

    return transformed;
  }, [selectedVariant, userHasInteracted, serverStores, product?.id]);

  // Calculate best offer
  const bestOffer = useMemo(() => {
    if (!activeOffers || activeOffers.length === 0) {
      return null;
    }

    const best = activeOffers.reduce((prev, curr) => {
      const prevTotal = (typeof prev.price === 'string' ? parseFloat(prev.price) : prev.price) + 
                       (typeof prev.shippingCost === 'string' ? parseFloat(prev.shippingCost) : (prev.shippingCost || 0));
      const currTotal = (typeof curr.price === 'string' ? parseFloat(curr.price) : curr.price) + 
                       (typeof curr.shippingCost === 'string' ? parseFloat(curr.shippingCost) : (curr.shippingCost || 0));
      
      return currTotal < prevTotal ? curr : prev;
    }, activeOffers[0]);

    console.log('🏆 Best offer:', {
      store: best?.store?.name,
      price: best?.price,
      isVariantPrice: userHasInteracted && !!selectedVariant
    });

    return best;
  }, [activeOffers, userHasInteracted, selectedVariant]);

  // Update variant handler
  const updateVariant = useCallback((variant) => {
    console.log('🔄 User selected variant:', variant?.id);
    setSelectedVariant(variant);
    setUserHasInteracted(true); // Mark that user has made a choice
  }, []);

  const value = {
    product,
    selectedVariant,
    updateVariant,
    activeOffers,
    bestOffer,
    serverStores,
    hasServerDataLoaded,
    userHasInteracted // Expose this so components know if prices are variant-specific
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};