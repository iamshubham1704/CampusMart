'use client';

import Image from 'next/image';
import { useState } from 'react';
import './ProductPage.css';

export default function ProductDetails() {
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="product-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <span className="separator">›</span>
        <span>Products</span>
      </div>

      {/* Product Header */}
      <div className="product-header">
        <h1>Noise-Canceling Over-Ear Headphones</h1>
        <p className="product-subtitle">
          Premium over-ear headphones with active noise cancellation. 20+ features with all premium 
          — perfect for study sessions.
        </p>
      </div>

      <div className="product-container">
        {/* Left Side - Product Image */}
        <div className="product-image-section">
          <div className="main-product-image">
            <div className="image-placeholder">
              <div className="headphone-visual">🎧</div>
            </div>
            <div className="image-tags">
              <span className="tag">Hot Selling</span>
              <span className="tag verified">✓ Verified</span>
            </div>
          </div>
        </div>

        {/* Right Side - Product Details */}
        <div className="product-details-section">
          <div className="price-section">
            <div className="price">₹ 4,999</div>
            <div className="original-price">₹6,999</div>
            <div className="discount">save 28%</div>
          </div>

          <div className="quantity-section">
            <label>Quantity</label>
            <div className="quantity-controls">
              <button 
                className="qty-btn" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                className="qty-btn" 
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="payment-section">
            <label>Payment Method</label>
            <div className="payment-options">
              <div className={`payment-option ${selectedPayment === 'upi' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="upi"
                  checked={selectedPayment === 'upi'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                />
                <span className="payment-icon">📱</span>
                <span>UPI</span>
              </div>
              <div className={`payment-option ${selectedPayment === 'card' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="card"
                  checked={selectedPayment === 'card'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                />
                <span className="payment-icon">💳</span>
                <span>Card</span>
              </div>
              <div className={`payment-option ${selectedPayment === 'cash' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cash"
                  checked={selectedPayment === 'cash'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                />
                <span className="payment-icon">💵</span>
                <span>Cash</span>
              </div>
            </div>
          </div>

          <div className="delivery-section">
            <div className="delivery-info">
              <strong>Delivery / Pickup</strong>
              <div className="delivery-option">
                <span>🎯</span>
                <span>Same as Current address</span>
                <span className="change-link">📍 Need at Chennai district</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="buy-now-btn">Buy Now</button>
            <button className="add-cart-btn">🛒 Add to Cart</button>
          </div>

          <div className="additional-info">
            <span>📞 Get product assistance from expert</span>
          </div>

          <div className="seller-info">
            <div className="seller-avatar">
              <div className="avatar-placeholder">AP</div>
            </div>
            <div className="seller-details">
              <div className="seller-name">
                <span>Aarav Patel</span>
                <span className="verified-badge">Verified</span>
              </div>
              <div className="seller-rating">★★★★★</div>
            </div>
            <button className="message-seller">💬 Message seller</button>
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="details-section">
        <div className="details-left">
          <h3>Details</h3>
          <p>
            Experience premium sound with Bose QC45. Customizable EQ music and noise cancellation 
            feedback & QC35 proven technology. Headset provides all-day comfort, thanks to its 
            wearing, it has and plush cushion. It supports streaming. Warranty: 1-Year domestic warranty.
          </p>

          <div className="key-features">
            <h4>Key Features:</h4>
            <ul>
              <li>✓ Advanced noise cancellation up to 35 dB</li>
              <li>✓ 35-hours battery life - call + full charge</li>
              <li>✓ Foldable and portable in solid material</li>
              <li>✓ Supports Bluetooth 5.0 - upto 30 ft away</li>
            </ul>
          </div>

          <div className="product-specs">
            <div className="spec-item">
              <span className="spec-icon">🎵</span>
              <span>Excellent audio quality</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">📱</span>
              <span>Good for smartphones</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">⭐</span>
              <span>Used as favorites</span>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section">
            <div className="reviews-header">
              <div className="review-stars">★★★★★</div>
              <span>4.8 • 16,458 reviews</span>
              <button className="view-reviews">View reviews</button>
            </div>

            <div className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">Radha Sharma</span>
                  <div className="review-stars">★★★★★</div>
                </div>
              </div>
              <p className="review-text">
                Excellent Bluetooth works seamlessly. Great clarity and the battery is good!
              </p>
              <div className="review-image">
                <div className="review-img-placeholder">📷</div>
              </div>
            </div>

            <div className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">Rahul Singh</span>
                  <div className="review-stars">★★★★★</div>
                </div>
              </div>
              <p className="review-text">Sound clarity really solid for treble dynamics and music</p>
            </div>

            <div className="add-review">
              <h4>Add a review</h4>
              <textarea placeholder="Share your experience (review optional)"></textarea>
              <button className="submit-review">Submit Review</button>
            </div>
          </div>
        </div>

        <div className="details-right">
          <div className="similar-products">
            <h4>More from this Seller</h4>
            <div className="similar-grid">
              <div className="similar-item">
                <div className="similar-image">🎧</div>
                <p>Wireless Earbuds Water-Shock Resistant</p>
              </div>
              <div className="similar-item">
                <div className="similar-image">🎧</div>
                <p>Sony Bluetooth Speaker Music</p>
              </div>
            </div>

            <h4>Similar Items You May Like</h4>
            <div className="similar-grid">
              <div className="similar-item">
                <div className="similar-image">🎧</div>
                <p>Beats Over-Ear Headphones Wireless</p>
              </div>
              <div className="similar-item">
                <div className="similar-image">🎧</div>
                <p>Boat ANC Headphones Wireless</p>
              </div>
            </div>
          </div>

          <div className="footer-actions">
            <button className="footer-btn">📋 Upload Order Policy</button>
            <button className="footer-btn">📄 Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}
