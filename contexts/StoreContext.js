// contexts/StoreContext.js
'use client';
import { createContext, useContext, useState } from 'react';

const StoreContext = createContext({});

export function StoreProvider({ children }) {
  const [currentStoreCover, setCurrentStoreCover] = useState(null);

  return (
    <StoreContext.Provider value={{ currentStoreCover, setCurrentStoreCover }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
