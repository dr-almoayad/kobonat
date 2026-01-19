// app/[locale]/search/SearchClient.jsx - FIXED FOR MULTI-LANGUAGE
"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import VouchersGrid from "@/components/VouchersGrid/VouchersGrid";
import StoreCard from "@/components/StoreCard/StoreCard";
import "./searchPage.css";

const SearchClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('SearchClient');
  
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  
  const [stores, setStores] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState(type);

  // Helper function to transform store data from API
  const transformStoreData = (store) => {
    // API might return flattened data or nested translations
    return {
      ...store,
      name: store.name || store.translations?.[0]?.name || '',
      slug: store.slug || store.translations?.[0]?.slug || '',
      // Ensure _count exists
      _count: store._count || { vouchers: 0 }
    };
  };

  // Helper function to transform voucher data from API
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

  // Fetch search results
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setStores([]);
      setVouchers([]);
      setTotalCount(0);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: query.trim(),
          type: activeTab,
          locale: locale,
          limit: '50'
        });

        console.log('🔍 Fetching search results:', params.toString());

        const response = await fetch(`/api/search?${params}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Search API error:', errorText);
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ Search API response:', data);

        // Transform and handle response based on type
        if (activeTab === 'all') {
          const transformedStores = (data.stores || []).map(transformStoreData);
          const transformedVouchers = (data.vouchers || []).map(transformVoucherData);
          setStores(transformedStores);
          setVouchers(transformedVouchers);
        } else if (activeTab === 'stores') {
          const transformedStores = (data.stores || []).map(transformStoreData);
          setStores(transformedStores);
          setVouchers([]);
        } else if (activeTab === 'vouchers') {
          const transformedVouchers = (data.vouchers || []).map(transformVoucherData);
          setStores([]);
          setVouchers(transformedVouchers);
        }
        
        setTotalCount(data.total || 0);

      } catch (err) {
        console.error('❌ Search error:', err);
        setError(err.message);
        setStores([]);
        setVouchers([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, activeTab, locale]);

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams);
    params.set('type', newTab);
    router.push(`?${params.toString()}`);
  };

  // Calculate counts per tab
  const counts = useMemo(() => ({
    all: stores.length + vouchers.length,
    stores: stores.length,
    vouchers: vouchers.length
  }), [stores, vouchers]);

  // Loading state
  if (loading) {
    return (
      <div className="search-content">
        <div className="search-loading-state">
          <div className="spinner-large"></div>
          <p>{t('searchingFor', { query })}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="search-content">
        <div className="search-error-state">
          <span className="material-symbols-sharp" style={{ fontSize: '48px', color: '#ff5500' }}>
            error
          </span>
          <h2>{t('searchError')}</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>{t('tryAgain')}</button>
        </div>
      </div>
    );
  }

  const showNoResults = query && totalCount === 0 && !loading;

  return (
    <div className="search-content">
      {/* Query Info */}
      {query && (
        <div className="search-info">
          <h1 className="search-title">
            {t('searchResultsFor')} <span className="query-highlight">"{query}"</span>
          </h1>

          <p className="search-count">
            {totalCount === 0 ? (
              t('noResultsFound')
            ) : (
              t('resultsFound', { totalCount })
            )}
          </p>
        </div>
      )}

      {/* Tabs */}
      {totalCount > 0 && (
        <div className="search-tabs">
          <button
            className={`search-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            <span className="material-symbols-sharp">grid_view</span>
            {t('all')} ({counts.all})
          </button>
          <button
            className={`search-tab ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => handleTabChange('stores')}
          >
            <span className="material-symbols-sharp">storefront</span>
            {t('stores')} ({counts.stores})
          </button>
          <button
            className={`search-tab ${activeTab === 'vouchers' ? 'active' : ''}`}
            onClick={() => handleTabChange('vouchers')}
          >
            <span className="material-symbols-sharp">local_offer</span>
            {t('vouchers')} ({counts.vouchers})
          </button>
        </div>
      )}

      {/* No Results */}
      {showNoResults && (
        <div className="no-results">
          <span className="material-symbols-sharp no-results-icon">search_off</span>
          <h2>{t('noResultsFound')}</h2>
          <p>{t('couldNotFind', { query })}</p>
          <div className="no-results-suggestions">
            <h3>{t('try')}</h3>
            <ul>
              <li>{t('checkSpelling')}</li>
              <li>{t('useGeneralTerms')}</li>
              <li>{t('tryDifferentKeywords')}</li>
              <li>{t('searchByStore')}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Results */}
      {totalCount > 0 && (
        <div className="search-results-container">

          {/* Vouchers Section */}
          {(activeTab === 'all' || activeTab === 'vouchers') && vouchers.length > 0 && (
            <div className="results-section">
              {activeTab === 'all' && (
                <h2 className="results-section-title">
                  <span className="material-symbols-sharp">local_offer</span>
                  {t('vouchers')} ({vouchers.length})
                </h2>
              )}
              <VouchersGrid vouchers={vouchers} />
            </div>
          )}

          {/* Stores Section */}
          {(activeTab === 'all' || activeTab === 'stores') && stores.length > 0 && (
            <div className="results-section">
              {activeTab === 'all' && (
                <h2 className="results-section-title">
                  <span className="material-symbols-sharp">storefront</span>
                  {t('stores')} ({stores.length})
                </h2>
              )}
              <div className="stores-grid">
                {stores.map(store => (
                  <StoreCard 
                    key={store.id} 
                    store={store}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default SearchClient;