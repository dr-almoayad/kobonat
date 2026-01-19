// utils/hydration.js
export function useHydrationGuard(initialValue) {
  const [value, setValue] = useState(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // On server, return initial value immediately
  // On client, return initial value for first render, then update
  return isClient ? value : initialValue;
}

// utils/productData.js
export function normalizeProductData(product) {
  if (!product) return null;
  
  return {
    ...product,
    stores: (product.stores || []).map(store => ({
      ...store,
      price: typeof store.price === 'string' ? parseFloat(store.price) : store.price,
      shippingCost: typeof store.shippingCost === 'string' ? parseFloat(store.shippingCost) : (store.shippingCost || 0),
      store: store.store || {
        id: store.storeId,
        name: store.store?.name || 'Store',
        logoUrl: store.store?.logoUrl || '/placeholder_store.png',
        accent: store.store?.accent || '#000'
      }
    }))
  };
}