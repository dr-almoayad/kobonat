// /contexts/ComparisonContext.js
"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const ComparisonContext = createContext();

// Define compatible categories for cross-comparison
const COMPATIBLE_CATEGORIES = {
  'computers': ['Desktop PCs', 'Gaming Laptops', 'Business Laptops', 'MacBooks', 'Tablets'],
  'mobile': ['Mobile Phones', 'Smartphones', 'Tablets'],
  'audio': ['Headphones', 'Speakers', 'Earbuds', 'Sound Systems'],
  'gaming': ['Gaming Consoles', 'Gaming Laptops', 'Gaming Accessories'],
  'appliances': ['Refrigerators', 'Washing Machines', 'Dishwashers', 'Ovens']
};

const getCompatibilityGroup = (categoryName) => {
  if (!categoryName) return 'unknown';
  for (const [group, categories] of Object.entries(COMPATIBLE_CATEGORIES)) {
    if (categories.some(cat => categoryName.toLowerCase().includes(cat.toLowerCase()) || 
                            cat.toLowerCase().includes(categoryName.toLowerCase()))) {
      return group;
    }
  }
  return categoryName.toLowerCase();
};

export const ComparisonProvider = ({ children }) => {
  const [compareProducts, setCompareProducts] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('compareProducts');
    if (saved) {
      try {
        setCompareProducts(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading comparison data:', error);
      }
    }
  }, []);

  // Save to localStorage when compareProducts changes
  useEffect(() => {
    localStorage.setItem('compareProducts', JSON.stringify(compareProducts));
  }, [compareProducts]);

    const addToCompare = (product) => {
        if (compareProducts.length >= 4) {
        return { success: false, message: 'Maximum 4 products can be compared' };
        }

        // Check if product already exists
        if (compareProducts.some(p => p.id === product.id)) {
        return { success: false, message: 'Product already in comparison' };
        }

        if (compareProducts.length > 0) {
            const newGroup = getCompatibilityGroup(product?.category?.name);
            for (let p of compareProducts) {
                const existingGroup = getCompatibilityGroup(p?.category?.name);
                if (existingGroup !== newGroup) {
                    return {
                        success: false,
                        message: `Cannot compare ${product?.category?.name || 'this product'} with ${p?.category?.name || 'other products'}. Please compare similar products.`
                    };
                }
            }
        }



        setCompareProducts([...compareProducts, product]);
        return { success: true, message: 'Product added to comparison' };
    };

  const removeFromCompare = (productId) => {
    setCompareProducts(compareProducts.filter(p => p.id !== productId));
  };

  const clearComparison = () => {
    setCompareProducts([]);
  };

  const isInComparison = (productId) => {
    return compareProducts.some(p => p.id === productId);
  };

  return (
    <ComparisonContext.Provider value={{
      compareProducts,
      addToCompare,
      removeFromCompare,
      clearComparison,
      isInComparison,
      maxReached: compareProducts.length >= 4
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};