'use client';

import { useRef } from 'react';
import StoreHeader from './StoreHeader';
import StickyStoreHeader from './StickyStoreHeader';

/**
 * StorePageShell
 *
 * This is intentionally minimal.  It exists solely because:
 *   1. useRef() requires a client component.
 *   2. The ref must be created in the same render tree that passes it
 *      to both StoreHeader (as sentinelRef) and StickyStoreHeader
 *      (so it can observe it).
 *
 * By isolating this to a single small wrapper we keep the rest of the
 * store page (vouchers, FAQs, related stores …) as Server Components,
 * which is better for performance and SEO.
 */
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
