'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
    return null;
  };

  // Fetch cart from API
  const fetchCart = async () => {
    const token = getAuthToken();
    if (!token) {
      console.log('No auth token found, skipping cart fetch');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🛒 Fetching cart data...');
      
      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('🛒 Cart API response:', data);

      if (data.success) {
        console.log('🛒 Cart items received:', data.cart.items);
        console.log('🛒 Cart total items:', data.cart.totalItems);
        console.log('🛒 Cart total price:', data.cart.totalPrice);
        
        setCartItems(data.cart.items || []);
        setTotalItems(data.cart.totalItems || 0);
        setTotalPrice(data.cart.totalPrice || 0);
      } else {
        console.error('Failed to fetch cart:', data.message);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (listingId, quantity = 1) => {
    const token = getAuthToken();
    if (!token) {
      alert('Please login to add items to cart');
      return false;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listingId, quantity })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh cart data
        await fetchCart();
        return true;
      } else {
        alert(data.message || 'Failed to add item to cart');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
      return false;
    }
  };

  // Update item quantity
  const updateQuantity = async (listingId, quantity) => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listingId, quantity })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh cart data
        await fetchCart();
        return true;
      } else {
        console.error('Failed to update cart:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (listingId) => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`/api/cart?listingId=${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Refresh cart data
        await fetchCart();
        return true;
      } else {
        console.error('Failed to remove item:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch('/api/cart?clearAll=true', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setCartItems([]);
        setTotalItems(0);
        setTotalPrice(0);
        return true;
      } else {
        console.error('Failed to clear cart:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  // Check if item is in cart
  const isInCart = (listingId) => {
    return cartItems.some(item => item.listingId === listingId);
  };

  // Get item quantity in cart
  const getItemQuantity = (listingId) => {
    const item = cartItems.find(item => item.listingId === listingId);
    return item ? item.quantity : 0;
  };

  // Toggle cart visibility
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Fetch cart on component mount and when auth changes
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      console.log('🛒 Initial cart fetch on mount');
      fetchCart();
    }
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const handleStorageChange = () => {
      const token = getAuthToken();
      if (token) {
        console.log('🛒 Auth change detected, fetching cart');
        fetchCart();
      } else {
        // Clear cart if user logs out
        console.log('🛒 User logged out, clearing cart');
        setCartItems([]);
        setTotalItems(0);
        setTotalPrice(0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    // State
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
    isCartOpen,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,

    // Utilities
    isInCart,
    getItemQuantity,

    // Cart visibility
    toggleCart,
    openCart,
    closeCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};