// components/CartDrawer.js
'use client';
import React, { useState } from 'react';
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
  Package,
  Image
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

  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});

  const handleImageError = (listingId) => {
    console.log(`🖼️ Image failed to load for listing ${listingId}, using fallback`);
    setImageErrors(prev => ({ ...prev, [listingId]: true }));
  };

  const handleImageLoad = (listingId) => {
    console.log(`🖼️ Image loaded successfully for listing ${listingId}`);
    setImageLoading(prev => ({ ...prev, [listingId]: false }));
  };

  const handleImageLoadStart = (listingId) => {
    console.log(`🖼️ Starting to load image for listing ${listingId}`);
    setImageLoading(prev => ({ ...prev, [listingId]: true }));
  };

  const getImageUrl = (item) => {
    if (imageErrors[item.listingId]) {
      console.log(`🖼️ Using fallback image for listing ${item.listingId}`);
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop';
    }
    
    if (!item.image || item.image === '') {
      console.log(`🖼️ No image URL for listing ${item.listingId}, using fallback`);
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop';
    }
    
    console.log(`🖼️ Using image URL for listing ${item.listingId}: ${item.image.substring(0, 50)}...`);
    return item.image;
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
                      {imageLoading[item.listingId] && (
                        <div className="image-loading">
                          <Image size={24} />
                          <span>Loading...</span>
                        </div>
                      )}
                      <img 
                        src={getImageUrl(item)} 
                        alt={item.title}
                        onError={() => handleImageError(item.listingId)}
                        onLoad={() => handleImageLoad(item.listingId)}
                        onLoadStart={() => handleImageLoadStart(item.listingId)}
                        loading="lazy"
                        style={{ 
                          display: imageLoading[item.listingId] ? 'none' : 'block',
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    
                    <div className="item-details">
                      <h4 className="item-title">{item.title}</h4>
                      <div className="item-condition">
                        <span className="condition-badge">{item.condition}</span>
                      </div>
                      <div className="item-price">
                        <span>₹{item.price}</span>
                      </div>
                    </div>

                    <div className="item-actions">
                      <button
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.listingId)}
                        disabled={isLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="item-subtotal">
                      <strong>₹{item.subtotal.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="cart-footer">
                <div className="cart-summary">
                  <div className="summary-line">
                    <span>Items ({totalItems}):</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="summary-line total">
                    <span>Total:</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
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
                    Proceed to Checkout
                    <ArrowRight size={16} />
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