// components/SmartSearchInput/AnimatedSearchInput.jsx - FIXED FOR MULTI-LANGUAGE
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import "./AnimatedSearchInput.css";

const AnimatedSearchInput = () => {
  const router = useRouter();
  const t = useTranslations('Search');
  const locale = useLocale();
  const isRtl = locale.startsWith('ar');
  const currentLanguage = locale.split('-')[0];
  
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [animatedText, setAnimatedText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState({ stores: [], vouchers: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  
  // Animated placeholder texts
  const placeholderTexts = isRtl ? [
    "أمازون",
    "خصم 50%",
    "توصيل مجاني",
    "نون",
    "شين",
    "إلكترونيات",
    "أزياء",
    "منتجات التجميل"
  ] : [
    "Amazon",
    "50% off",
    "Free shipping",
    "Noon",
    "Shein",
    "Electronics",
    "Fashion",
    "Beauty"
  ];

  // Animated typing effect
  useEffect(() => {
    if (isFocused) return;
    
    const currentText = placeholderTexts[textIndex];
    let charIndex = 0;
    let isDeleting = false;
    let timeout;

    const animate = () => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setAnimatedText(currentText.substring(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(animate, 100);
        } else {
          timeout = setTimeout(() => {
            isDeleting = true;
            animate();
          }, 2000);
        }
      } else {
        if (charIndex > 0) {
          setAnimatedText(currentText.substring(0, charIndex - 1));
          charIndex--;
          timeout = setTimeout(animate, 50);
        } else {
          isDeleting = false;
          setTextIndex((prev) => (prev + 1) % placeholderTexts.length);
          timeout = setTimeout(animate, 500);
        }
      }
    };

    animate();
    return () => clearTimeout(timeout);
  }, [textIndex, isFocused, isRtl]);

  // Load recent searches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`recentSearches_${locale}`);
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved).slice(0, 5));
        } catch (e) {
          console.error('Error loading recent searches:', e);
        }
      }
    }
  }, [locale]);

  // Helper function to transform store data
  const transformStoreData = (store) => {
    return {
      ...store,
      name: store.name || store.translations?.[0]?.name || '',
      slug: store.slug || store.translations?.[0]?.slug || '',
      _count: store._count || { vouchers: 0 }
    };
  };

  // Helper function to transform voucher data
  const transformVoucherData = (voucher) => {
    return {
      ...voucher,
      title: voucher.title || voucher.translations?.[0]?.title || '',
      description: voucher.description || voucher.translations?.[0]?.description || '',
      store: voucher.store ? {
        ...voucher.store,
        name: voucher.store.name || voucher.store.translations?.[0]?.name || '',
        slug: voucher.store.slug || voucher.store.translations?.[0]?.slug || ''
      } : null
    };
  };

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions({ stores: [], vouchers: [] });
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          type: 'all',
          locale: locale,
          limit: '8'
        });

        console.log('🔍 Fetching autocomplete:', params.toString());

        const response = await fetch(`/api/search?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('✅ Autocomplete response:', data);
          
          // Transform the data
          const transformedStores = (data.stores || []).map(transformStoreData);
          const transformedVouchers = (data.vouchers || []).map(transformVoucherData);
          
          setSuggestions({
            stores: transformedStores.slice(0, 4),
            vouchers: transformedVouchers.slice(0, 4)
          });
          setShowSuggestions(true);
        } else {
          console.error('Autocomplete error:', response.status);
          setSuggestions({ stores: [], vouchers: [] });
        }
      } catch (error) {
        console.error('❌ Autocomplete error:', error);
        setSuggestions({ stores: [], vouchers: [] });
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, locale]);

  // Save to recent searches
  const saveToRecentSearches = useCallback((searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    
    const newSearch = searchQuery.trim();
    const updated = [
      newSearch,
      ...recentSearches.filter(item => item.toLowerCase() !== newSearch.toLowerCase())
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem(`recentSearches_${locale}`, JSON.stringify(updated));
  }, [recentSearches, locale]);

  // Handle search
  const handleSearch = useCallback((searchQuery = query) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    console.log('🔍 Searching for:', trimmedQuery);

    saveToRecentSearches(trimmedQuery);
    router.push(`/${locale}/search?q=${encodeURIComponent(trimmedQuery)}`);
    setIsFocused(false);
    setShowSuggestions(false);
  }, [query, router, locale, saveToRecentSearches]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const totalSuggestions = suggestions.stores.length + suggestions.vouchers.length;
    
    if (e.key === 'Enter') {
      if (selectedSuggestion >= 0) {
        // Navigate to selected suggestion
        if (selectedSuggestion < suggestions.stores.length) {
          const store = suggestions.stores[selectedSuggestion];
          router.push(`/${locale}/stores/${store.slug}`);
        } else {
          const voucherIndex = selectedSuggestion - suggestions.stores.length;
          const voucher = suggestions.vouchers[voucherIndex];
          // Since we don't have a voucher detail page, redirect to store
          if (voucher.store?.slug) {
            router.push(`/${locale}/stores/${voucher.store.slug}`);
          }
        }
        setIsFocused(false);
        setShowSuggestions(false);
      } else if (query.trim()) {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < totalSuggestions - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => prev > -1 ? prev - 1 : -1);
    }
  };

  // Click outside to close dropdown
  const handleClickOutside = useCallback((e) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
      setShowSuggestions(false);
      setIsFocused(false);
      if (document.activeElement === inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(`recentSearches_${locale}`);
  };

  // Get voucher discount text
  const getVoucherDiscount = (voucher) => {
    if (voucher.discount) {
      return voucher.discount.includes('%') ? voucher.discount : `${voucher.discount}%`;
    }
    if (voucher.type === 'FREE_SHIPPING') {
      return isRtl ? 'توصيل مجاني' : 'Free shipping';
    }
    return isRtl ? 'عرض خاص' : 'Special deal';
  };

  return (
    <div className="search-wrapper" ref={wrapperRef} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Search Input */}
      <div className={`search-input-container ${isFocused ? 'focused' : ''}`}>
        <span className="material-symbols-sharp search-icon">search</span>
        
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={isFocused ? t('placeholder') : `${isRtl ? 'ابحث عن' : 'Search for'} ${animatedText}|`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          dir={isRtl ? 'rtl' : 'ltr'}
          autoComplete="off"
        />

        {query && (
          <button 
            className="clear-btn" 
            onClick={() => {
              setQuery("");
              setSuggestions({ stores: [], vouchers: [] });
              inputRef.current?.focus();
            }}
            type="button"
          >
            <span className="material-symbols-sharp">close</span>
          </button>
        )}

        {isLoading && (
          <span className="material-symbols-sharp loading-spinner">
            progress_activity
          </span>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {(showSuggestions || (isFocused && !query)) && (
        <div className="autocomplete-dropdown">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="recent-section">
              <div className="section-header">
                <span className="material-symbols-sharp">history</span>
                <span>{isRtl ? 'البحث السابق' : 'Recent Searches'}</span>
                <button 
                  className="clear-all-btn" 
                  onClick={clearRecentSearches}
                  type="button"
                >
                  {isRtl ? 'مسح الكل' : 'Clear all'}
                </button>
              </div>
              {recentSearches.map((item, index) => (
                <button
                  key={index}
                  className="suggestion-item recent-item"
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  type="button"
                >
                  <span className="material-symbols-sharp">search</span>
                  <span className="suggestion-text">{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* Store Suggestions */}
          {suggestions.stores.length > 0 && (
            <div className="suggestions-section">
              <div className="section-header">
                <span className="material-symbols-sharp">storefront</span>
                <span>{isRtl ? 'المتاجر' : 'Stores'}</span>
              </div>
              {suggestions.stores.map((store, index) => (
                <button
                  key={store.id}
                  className={`suggestion-item store-item ${selectedSuggestion === index ? 'selected' : ''}`}
                  onClick={() => {
                    router.push(`/${locale}/stores/${store.slug}`);
                    setIsFocused(false);
                    setShowSuggestions(false);
                  }}
                  onMouseEnter={() => setSelectedSuggestion(index)}
                  type="button"
                >
                  <div className="store-logo">
                    {store.logo ? (
                      <Image 
                        src={store.logo} 
                        alt={store.name}
                        width={32}
                        height={32}
                        unoptimized
                      />
                    ) : (
                      <span className="material-symbols-sharp">storefront</span>
                    )}
                  </div>
                  <div className="suggestion-content">
                    <span className="suggestion-text">{store.name}</span>
                    {store._count?.vouchers > 0 && (
                      <span className="voucher-count">
                        {store._count.vouchers} {isRtl ? 'كوبون' : 'coupon'}{store._count.vouchers !== 1 ? (isRtl ? 'ات' : 's') : ''}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-sharp arrow-icon">
                    {isRtl ? 'arrow_back' : 'arrow_forward'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Voucher Suggestions */}
          {suggestions.vouchers.length > 0 && (
            <div className="suggestions-section">
              <div className="section-header">
                <span className="material-symbols-sharp">local_offer</span>
                <span>{isRtl ? 'العروض' : 'Deals'}</span>
              </div>
              {suggestions.vouchers.map((voucher, index) => {
                const globalIndex = suggestions.stores.length + index;
                return (
                  <button
                    key={voucher.id}
                    className={`suggestion-item voucher-item ${selectedSuggestion === globalIndex ? 'selected' : ''}`}
                    onClick={() => {
                      if (voucher.store?.slug) {
                        router.push(`/${locale}/stores/${voucher.store.slug}`);
                      }
                      setIsFocused(false);
                      setShowSuggestions(false);
                    }}
                    onMouseEnter={() => setSelectedSuggestion(globalIndex)}
                    type="button"
                  >
                    {voucher.store?.logo && (
                      <div className="store-logo small">
                        <Image 
                          src={voucher.store.logo} 
                          alt={voucher.store.name}
                          width={24}
                          height={24}
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="suggestion-content">
                      <span className="suggestion-text">
                        {voucher.title}
                      </span>
                      <span className="voucher-meta">
                        {voucher.store?.name} • {getVoucherDiscount(voucher)}
                      </span>
                    </div>
                    {voucher.isExclusive && (
                      <span className="exclusive-badge">
                        {isRtl ? 'حصري' : 'Exclusive'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {query && suggestions.stores.length === 0 && suggestions.vouchers.length === 0 && !isLoading && (
            <div className="no-results">
              <span className="material-symbols-sharp">search_off</span>
              <p>{isRtl ? 'لا توجد نتائج' : 'No results found'}</p>
              <button 
                className="search-anyway-btn"
                onClick={() => handleSearch()}
                type="button"
              >
                {isRtl ? `ابحث عن "${query}"` : `Search for "${query}"`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimatedSearchInput;