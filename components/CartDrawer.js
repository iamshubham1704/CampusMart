// components/CartDrawer.js
'use client';
import React from 'react';
import { useCart } from './contexts/CartContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  DollarSign,
  User,
  ArrowRight,
  Package
} from 'lucide-react';
import './CartDrawer.css';

const CartDrawer = () => {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const handleQuantityChange = async (listingId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(listingId);
    } else {
      await updateQuantity(listingId, newQuantity);
    }
  };

  const handleCheckout = () => {
    // Implement checkout logic
    console.log('Proceeding to checkout with items:', cartItems);
    // You can navigate to checkout page or open checkout modal
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={closeCart} />
      
      {/* Cart Drawer */}
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingBag size={24} />
            <h2>Your Cart ({totalItems})</h2>
          </div>
          <button className="close-cart-btn" onClick={closeCart}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="cart-content">
          {isLoading ? (
            <div className="cart-loading">
              <div className="loading-spinner" />
              <p>Loading your cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="empty-cart">
              <Package size={64} />
              <h3>Your cart is empty</h3>
              <p>Browse our marketplace to find great deals!</p>
              <button className="continue-shopping-btn" onClick={closeCart}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.listingId} className="cart-item">
                    <div className="item-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                    
                    <div className="item-details">
                      <h4 className="item-title">{item.title}</h4>
                      <div className="item-seller">
                        <User size={14} />
                        <span>{item.seller}</span>
                      </div>
                      <div className="item-condition">
                        <span className="condition-badge">{item.condition}</span>
                      </div>
                      <div className="item-price">
                        <DollarSign size={16} />
                        <span>${item.price}</span>
                      </div>
                    </div>

                    <div className="item-actions">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.listingId, item.quantity - 1)}
                          disabled={isLoading}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.listingId, item.quantity + 1)}
                          disabled={isLoading}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <button
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.listingId)}
                        disabled={isLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="item-subtotal">
                      <strong>${item.subtotal.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="cart-footer">
                <div className="cart-summary">
                  <div className="summary-line">
                    <span>Items ({totalItems}):</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="summary-line total">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="cart-actions">
                  <button
                    className="clear-cart-btn"
                    onClick={clearCart}
                    disabled={isLoading}
                  >
                    Clear Cart
                  </button>
                  
                  <button
                    className="checkout-btn"
                    onClick={handleCheckout}
                    disabled={isLoading || cartItems.length === 0}
                  >
                    <span>Checkout</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;