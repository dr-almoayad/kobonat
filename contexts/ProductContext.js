// contexts/ProductContext.js
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

export function ProductProvider({ children, product }) {
  // 1. Find the default variant
  const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0] || null;

  // 2. Initialize offers based on that default variant
  const initialOffers = defaultVariant
    ? [...(product.offers || []), ...(defaultVariant.offers || [])]
    : (product.allOffers || []);

  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
  const [activeOffers, setActiveOffers] = useState(initialOffers);
  const [bestOffer, setBestOffer] = useState(null);

  useEffect(() => {
    const sorted = [...(activeOffers || [])].sort((a, b) => a.effectivePrice - b.effectivePrice);
    setBestOffer(sorted[0] || null);
  }, [activeOffers]);

  const updateVariant = (variant) => {
    setSelectedVariant(variant);
    if (variant) {
      const all = [...(product.offers || []), ...(variant.offers || [])];
      setActiveOffers(all);
    } else {
      setActiveOffers(product.allOffers || []);
    }
  };

  return (
    <ProductContext.Provider value={{ selectedVariant, activeOffers, bestOffer, updateVariant }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};
