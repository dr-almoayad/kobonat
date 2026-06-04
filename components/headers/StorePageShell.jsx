'use client';

import { useRef } from 'react';
import StoreHeader from './StoreHeader';
import StickyStoreHeader from './StickyStoreHeader';

/**
 * StorePageShell
 * Explicitly forwards props to guarantee server-client consistency 
 * across both standard and viewport-sticky banner states.
 */
const StorePageShell = ({
  store,
  mostTrackedVoucher,
  paymentMethods,
  bnplMethods,
  locale,
  country,
  voucherCount,
  maxSavings,
  pageH1,
  heroSubtitle,
  latestVoucherDate
}) => {
  const sentinelRef = useRef(null);

  // Group payload data for clean down-stream distribution
  const headerProps = {
    store,
    mostTrackedVoucher,
    paymentMethods,
    bnplMethods,
    locale,
    country,
    voucherCount,
    maxSavings,
    pageH1,
    heroSubtitle,
    latestVoucherDate,
    sentinelRef
  };

  return (
    <>
      <StoreHeader {...headerProps} />
      <StickyStoreHeader {...headerProps} />
    </>
  );
};

export default StorePageShell;
