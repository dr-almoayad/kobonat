// components/pricelist/priceList.jsx
'use client';
import React from 'react';
import OfferCard from './OfferCard'; // renamed import
import { useProduct } from '@/contexts/ProductContext';
import './priceList.css';

export default function PriceList({ product }) {
  const { activeOffers } = useProduct();

  const offers = activeOffers || product.allOffers || [];

  if (offers.length === 0) {
    return (
      <section className="price_list">
        <div className="price_list_container">
          <h2>No Offers Available</h2>
          <p>This product is currently not available from any retailers.</p>
        </div>
      </section>
    );
  }

  // Sort by effectivePrice (ascending)
  const sorted = [...offers].sort((a, b) => a.effectivePrice - b.effectivePrice);

  return (
    <section className="price_list">
      <div className="price_list_container">
        <div className="price_list_wrapper">
          {sorted.map((offer, idx) => (
            <OfferCard
              key={offer.id}
              sellerProduct={offer}
              sellerInfo={{
                name: offer.store?.name || 'Store',
                avatar: offer.store?.logo || '/placeholder_store.png',
              }}
              highlight={idx === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
