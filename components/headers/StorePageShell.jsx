'use client';

import { useRef } from 'react';
import StoreHeader from './StoreHeader';
import StickyStoreHeader from './StickyStoreHeader';

const StorePageShell = (props) => {
  const sentinelRef = useRef(null);

  return (
    <>
      <StoreHeader {...props} sentinelRef={sentinelRef} />
      <StickyStoreHeader {...props} sentinelRef={sentinelRef} />
    </>
  );
};

export default StorePageShell;
