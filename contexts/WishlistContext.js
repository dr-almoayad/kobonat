// src/contexts/WishlistContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
// You might need useSession if the API call depends on it
// import { useSession } from 'next-auth/react'; 

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  // const { data: session } = useSession(); // Uncomment if needed

  // Your fetch logic, adapted for the context
  useEffect(() => {
    // Only fetch if we haven't already or if the user logs in
    // (add session to dependency array if needed)
    
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        // We only care about the wishlist for this context
        const wishlistRes = await fetch("/api/user/wishlist");

        if (wishlistRes.ok) {
          const wishlistData = await wishlistRes.json();
          setWishlistItems(Array.isArray(wishlistData) ? wishlistData : []);
        } else {
          setWishlistItems([]); // Clear on error
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []); // Add 'session' here if fetch depends on it

  // --- Functions to modify the wishlist ---
  // These should update the API *and* the local state

  const addToWishlist = async (product) => {
    // TODO: Add API call to POST /api/user/wishlist
    // On success:
    setWishlistItems(prevItems => [...prevItems, product]);
  };

  const removeFromWishlist = async (productId) => {
    // TODO: Add API call to DELETE /api/user/wishlist/{productId}
    // On success:
    setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId));
  };
  
  const clearWishlist = async () => {
    // TODO: Add API call to DELETE /api/user/wishlist (clear all)
    // On success:
    setWishlistItems([]);
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};