// File: components/contexts/WishlistContext.js
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context with a default value
const WishlistContext = createContext({
  wishlist: [],
  toggleWishlist: () => {},
  removeFromWishlist: () => {}, // Add the new function to the default context
  isInWishlist: () => false,
  getWishlistCount: () => 0,
  loading: true
});

// Create the provider component
export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist from localStorage on initial mount
  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem('wishlist');
      if (storedWishlist) {
        setWishlist(JSON.parse(storedWishlist));
      }
    } catch (error) {
      console.error("Failed to parse wishlist from localStorage", error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, loading]);

  // Function to add/remove an item from the main product grid
  const toggleWishlist = (product) => {
    setWishlist(prevWishlist => {
      const productExists = prevWishlist.some(item => item.id === product.id);
      if (productExists) {
        return prevWishlist.filter(item => item.id !== product.id);
      } else {
        return [...prevWishlist, product];
      }
    });
  };

  // *** NEW FUNCTION TO MATCH YOUR MODAL ***
  // Function to explicitly remove an item by its ID
  const removeFromWishlist = (productId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };
  
  // Provide all functions and state to consuming components
  const value = {
    wishlist,
    toggleWishlist,
    removeFromWishlist, // Make sure this is exported in the value
    isInWishlist,
    getWishlistCount,
    loading
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook for easy consumption
export const useWishlist = () => {
  return useContext(WishlistContext);
};