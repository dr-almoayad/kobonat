"use client";
import React, { useState, useMemo } from "react";
import SmartTabFilters from "@/components/SmartTabFilters/SmartTabFilters";
import SmartSidebarFilters from "@/components/SmartSidebarFilters/SmartSidebarFilters";
import Grid from "@/components/grid/Grid";
import "./store-page.css"; // Note the CSS import name change

const StoreClient = ({ products, storeName, storeId, categories = [] }) => {
  const [tabFilters, setTabFilters] = useState({});
  const [sidebarFilters, setSidebarFilters] = useState({
    selectedFilters: {},
    priceRange: [0, 10000]
  });

  // IMPORTANT: Filter products to ensure only products from this store
  const storeProducts = useMemo(() => {
    // We filter the main product list to only include products
    // that have an active offer from the current store.
    // The 'products' prop passed in should already be pre-filtered by the server.
    // This client-side filter is an extra safeguard.
    return products.filter(product => 
      product.stores.some(s => s.storeId === storeId && s.isActive)
    );
  }, [products, storeId]);

  // Apply filters to store products only
  const filteredProducts = useMemo(() => {
    let result = [...storeProducts]; // Start with only this store's products

    // Apply tab filters (quick filters from top)
    Object.entries(tabFilters).forEach(([key, value]) => {
      if (!value) return;

      result = result.filter(product => {
        // Handle special feature filters
        if (key === "FreeShipping") {
          return product.stores?.some(s => s.storeId === storeId && parseFloat(s.shippingCost || 0) === 0);
        }
        if (key === "COD" || key === "CashonDelivery") {
          return product.stores?.some(s => s.storeId === storeId && s.cashOnDeliveryAvailable);
        }
        if (key === "BNPL" || key === "BuyNowPayLater") {
          return product.stores?.some(s => s.storeId === storeId && s.buyNowPayLaterAvailable);
        }

        // Standard attribute filters
        if (key === "Color") return product.color === value;
        if (key === "Capacity") return product.capacity === value;
        if (key === "Size") return product.size === value;
        if (key === "Variant") return product.variant === value;
        
        // Custom attributes
        return product.productAttributes?.some(
          attr => attr.key === key && attr.value === value
        );
      });
    });

    // Apply sidebar filters
    const { selectedFilters, priceRange } = sidebarFilters;

    // Price filter (based on this store's price)
    if (priceRange) {
      result = result.filter(product => {
        const storePrice = product.stores?.find(s => s.storeId === storeId)?.price;
        if (storePrice === undefined) return false;
        
        const price = parseFloat(storePrice);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Multi-select sidebar filters
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (!values || values.length === 0) return;

      result = result.filter(product => {
        return values.some(value => {
          // NOTE: Store filter is irrelevant here since we are on a store page
          // but we check for 'Brand'
          if (key === "Brand") {
            return product.brand?.name === value;
          }
          if (key === "Shipping") {
            if (value === "Free Shipping") {
              return product.stores?.some(s => s.storeId === storeId && parseFloat(s.shippingCost || 0) === 0);
            }
            if (value === "Cash on Delivery") {
              return product.stores?.some(s => s.storeId === storeId && s.cashOnDeliveryAvailable);
            }
            if (value === "Buy Now Pay Later") {
              return product.stores?.some(s => s.storeId === storeId && s.buyNowPayLaterAvailable);
            }
          }
          if (key === "Color") return product.color === value;
          if (key === "Capacity") return product.capacity === value;
          if (key === "Size") return product.size === value;
          if (key === "Variant") return product.variant === value;
          
          return product.productAttributes?.some(
            attr => attr.key === key && attr.value === value
          );
        });
      });
    });

    return result;
  }, [storeProducts, tabFilters, sidebarFilters, storeId]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = Object.keys(tabFilters).length;
    
    if (sidebarFilters.selectedFilters) {
      count += Object.values(sidebarFilters.selectedFilters).flat().length;
    }
    
    // Check if price range is active
    if (sidebarFilters.priceRange && storeProducts.length > 0) {
      const prices = storeProducts.map(p => parseFloat(p.stores.find(s => s.storeId === storeId)?.price || 0));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (sidebarFilters.priceRange[0] > minPrice || sidebarFilters.priceRange[1] < maxPrice) {
        count += 1;
      }
    }
    
    return count;
  }, [tabFilters, sidebarFilters, storeProducts, storeId]);

  const handleTabFilterChange = (filters) => {
    setTabFilters(filters);
  };

  const handleSidebarChange = ({ filters, priceRange }) => {
    setSidebarFilters({
      selectedFilters: filters || {},
      priceRange: priceRange || [0, 10000]
    });
  };

  return (
    <div className="store_page_content">
      {/* Quick Filters at the top */}
      <SmartTabFilters
        products={storeProducts}
        onFilterChange={handleTabFilterChange}
        categoryName={storeName} // Use storeName as the title for filters
      />

      <div className="filters_products_grid">
        {/* Sidebar Filters */}
        <SmartSidebarFilters
          products={storeProducts}
          onFilterChange={handleSidebarChange}
        />

        <div className="products_grid_container">
          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <Grid products={filteredProducts} />
          ) : (
            <div className="no-results">
              <span className="material-symbols-sharp">search_off</span>
              <h3>No products found</h3>
              <p>Try adjusting your filters to see more results</p>
            </div>
          )}

          {/* Results Info */}
          <div className="results-info">
            <p>
              {filteredProducts.length === storeProducts.length ? (
                `Showing all ${storeProducts.length.toLocaleString()} products`
              ) : (
                <>
                  Showing {filteredProducts.length.toLocaleString()} of {storeProducts.length.toLocaleString()} products
                  {activeFilterCount > 0 && (
                    <span className="active-filters-count">
                      {" "}· {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreClient;