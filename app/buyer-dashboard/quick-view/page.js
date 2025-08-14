// ProductViewModal.js - Enhanced version with original frontend design
"use client";
import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  ShoppingCart,
  Star,
  MapPin,
  Clock,
  Eye,
  User,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Flag,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useCart } from '../../../components/contexts/CartContext';
import './ProductPage.css';

const ProductViewModal = ({ productId, isOpen, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [selectedColor, setSelectedColor] = useState('black');

  const { addToCart, isInCart, cartLoading } = useCart();

  // Fetch product details when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching product details for ID:', productId);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Using auth token');
      } else {
        console.log('⚠️ No auth token found');
      }

      console.log('📡 Making request to:', `/api/listings/public/${productId}`);

      const response = await fetch(`/api/listings/public/${productId}`, {
        method: 'GET',
        headers
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);

        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to fetch product: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Received data:', data);

      // Your API returns data in 'listing' field, not 'data'
      const productData = data.listing || data.data || data;
      console.log('📦 Product data:', productData);

      setProduct(productData);

      // Update view count using public endpoint (optional)
      if (productData) {
        console.log('👀 View already tracked by API');
      }

    } catch (err) {
      console.error('❌ Error fetching product:', err);
      setError(err.message);

      // Fallback to mock data for development
      const mockProduct = {
        id: productId,
        title: 'Noise-Canceling Over-Ear Headphones',
        price: 4999,
        originalPrice: 6999,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
        ],
        condition: 'Like New',
        category: 'electronics',
        description: 'Experience unparalleled audio quality with our premium Noise-Canceling Over-Ear Headphones. Engineered for audiophiles and everyday users alike, these headphones deliver exceptional sound reproduction while blocking out the world around you. The advanced noise cancellation technology uses multiple microphones to detect and neutralize ambient noise, creating a peaceful listening environment whether you\'re commuting, working, or relaxing at home.',
        features: [
          'Advanced noise cancellation up to 35 dB',
          '35-hour battery life with full charge',
          'Foldable and portable design for easy travel',
          'Bluetooth 5.0 support with 30-foot range',
          'Premium sound quality with deep bass',
          '1-year warranty included with purchase'
        ],
        seller: {
          id: 'seller1',
          name: 'Aarav Patel',
          avatar: 'https://ui-avatars.com/api/?name=Aarav+Patel&size=100&background=3b82f6&color=ffffff',
          rating: 4.8,
          verified: true,
          totalSales: 47,
          responseTime: '2 hours',
          university: 'State University',
          joinedDate: '2023-09-15'
        },
        location: 'Chennai district',
        timePosted: '2 hours ago',
        views: 124,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        tags: ['electronics', 'headphones', 'bluetooth', 'noise-canceling'],
        specifications: {
          'Brand': 'Bose',
          'Model': 'QC45',
          'Color': 'Black',
          'Connectivity': 'Bluetooth 5.0',
          'Battery Life': '35 hours',
          'Weight': '240g'
        },
        reviews: [
          {
            id: 1,
            buyer: 'Radha Sharma',
            rating: 5,
            comment: 'Excellent Bluetooth works seamlessly. Great clarity and the battery is good!',
            date: '2024-01-10',
            verified: true
          },
          {
            id: 2,
            buyer: 'Rahul Singh',
            rating: 5,
            comment: 'Sound clarity really solid for treble dynamics and music',
            date: '2024-01-08',
            verified: true
          }
        ],
        similarItems: [
          {
            id: 101,
            title: 'Wireless Earbuds Water-Shock Resistant',
            price: 3999,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop'
          },
          {
            id: 102,
            title: 'Sony Bluetooth Speaker Music',
            price: 5999,
            image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=200&h=200&fit=crop'
          }
        ]
      };
      setProduct(mockProduct);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      console.error('❌ Product is null/undefined');
      return;
    }

    // Debug: Log the entire product object to see available fields
    console.log('🔍 Product object:', product);
    console.log('🔍 Product ID:', product.id);
    console.log('🔍 Product _id:', product._id);
    console.log('🔍 Product listingId:', product.listingId);

    // Try different possible ID fields
    const productId = product.id || product._id || product.listingId || productId;

    if (!productId) {
      console.error('❌ No valid product ID found');
      console.error('Available fields:', Object.keys(product));
      return;
    }

    console.log('🛒 Adding to cart with ID:', productId, 'quantity:', quantity);

    try {
      const success = await addToCart(productId, quantity);
      if (success) {
        console.log('✅ Added to cart successfully');
      } else {
        console.error('❌ Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
    }
  };

  const handleContactSeller = () => {
    // Open chat/contact modal or navigate to chat page
    console.log('Opening chat with seller:', product?.seller?.id);
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    // API call to update wishlist
  };

  const calculateSavings = () => {
    if (!product || !product.originalPrice) return 0;
    return ((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0);
  };

  const colors = [
    { name: 'black', label: 'Midnight Black', hex: '#1a1a1a' },
    { name: 'white', label: 'Pearl White', hex: '#f8f9fa' },
    { name: 'silver', label: 'Space Silver', hex: '#c0c0c0' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="description-content">
            <h3>Product Description</h3>
            <p>
              {product.description}
            </p>
            {product.features && (
              <div className="key-features">
                <h4>Key Features:</h4>
                <ul className="features-list">
                  {product.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <h4>What's in the Box</h4>
            <ul>
              <li>Noise-Canceling Over-Ear Headphones</li>
              <li>USB-C Charging Cable</li>
              <li>3.5mm Audio Cable</li>
              <li>Premium Carrying Case</li>
              <li>Quick Start Guide</li>
              <li>Warranty Information</li>
            </ul>
          </div>
        );
      case 'specifications':
        return (
          <div className="specifications-content">
            {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="spec-row">
                <span className="spec-label">{key}:</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>
        );
      case 'reviews':
        return (
          <div className="reviews-content">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">{review.buyer}</span>
                      {review.verified && <span className="verified-badge">✓ Verified</span>}
                    </div>
                    <div className="review-stars">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="review-text">{review.comment}</p>
                  <span className="review-date">{review.date}</span>
                </div>
              ))
            ) : (
              <p>No reviews yet. Be the first to review this product!</p>
            )}
            
            <div className="add-review">
              <h4>Add a review</h4>
              <textarea placeholder="Share your experience (review optional)"></textarea>
              <button className="submit-review">Submit Review</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button onClick={onClose} className="modal-close-btn">
          <X size={20} />
        </button>

        <div className="product-modal-content">
          {/* Loading State */}
          {loading && (
            <div className="modal-loading">
              <Loader2 size={48} className="spinner" />
              <p className="loading-text">Loading product details...</p>
            </div>
          )}

          {/* Error State */}
          {error && !product && (
            <div className="modal-error">
              <AlertCircle size={48} className="error-icon" />
              <h3 className="error-title">Failed to load product</h3>
              <p className="error-message">{error}</p>
              <button onClick={fetchProductDetails} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {/* Product Content */}
          {product && (
            <div className="product-page">
              {/* Breadcrumb */}
              <div className="breadcrumb">
                <span>Home</span>
                <span className="separator">›</span>
                <span>Products</span>
              </div>

              {/* Product Header */}
              <div className="product-header">
                <h1>{product.title}</h1>
                <p className="product-subtitle">
                  Premium over-ear headphones with active noise cancellation. 20+ features with all premium 
                  — perfect for study sessions.
                </p>
              </div>

              <div className="product-container">
                {/* Left Side - Product Image */}
                <div className="product-image-section">
                  <div className="main-product-image">
                    {product.images && product.images.length > 0 ? (
                      <>
                        <img
                          src={product.images[selectedImageIndex]}
                          alt={product.title}
                          className="product-image"
                        />
                        {/* Image Navigation */}
                        {product.images.length > 1 && (
                          <>
                            <button
                              onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                              disabled={selectedImageIndex === 0}
                              className="image-nav-btn prev"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={() => setSelectedImageIndex(Math.min(product.images.length - 1, selectedImageIndex + 1))}
                              disabled={selectedImageIndex === product.images.length - 1}
                              className="image-nav-btn next"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="image-placeholder">
                        <div className="headphone-visual">🎧</div>
                      </div>
                    )}
                    <div className="image-tags">
                      <span className="tag">Hot Selling</span>
                      <span className="tag verified">✓ Verified</span>
                    </div>
                  </div>

                  {/* Image Thumbnails */}
                  {product.images && product.images.length > 1 && (
                    <div className="thumbnail-images">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`thumbnail-btn ${selectedImageIndex === index ? 'active' : ''}`}
                        >
                          <img
                            src={image}
                            alt={`${product.title} ${index + 1}`}
                            className="thumbnail-image"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Product Details */}
                <div className="product-details-section">
                  <div className="price-section">
                    <div className="price">₹ {product.price}</div>
                    {product.originalPrice && (
                      <>
                        <div className="original-price">₹{product.originalPrice}</div>
                        <div className="discount">save {calculateSavings()}%</div>
                      </>
                    )}
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
                        <span className="change-link">📍 Need at {product.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <button className="buy-now-btn">Buy Now</button>
                    <button 
                      onClick={handleAddToCart}
                      disabled={cartLoading || isInCart(product.id)}
                      className={`add-cart-btn ${isInCart(product.id) ? 'in-cart' : ''}`}
                    >
                      {cartLoading ? (
                        <Loader2 size={20} className="spinner" />
                      ) : (
                        <>🛒 {isInCart(product.id) ? 'In Cart' : 'Add to Cart'}</>
                      )}
                    </button>
                  </div>

                  <div className="additional-info">
                    <span>📞 Get product assistance from expert</span>
                  </div>

                  {product.seller && (
                    <div className="seller-info">
                      <div className="seller-avatar">
                        <img src={product.seller.avatar} alt={product.seller.name} />
                      </div>
                      <div className="seller-details">
                        <div className="seller-name">
                          <span>{product.seller.name}</span>
                          {product.seller.verified && <span className="verified-badge">Verified</span>}
                        </div>
                        <div className="seller-rating">★★★★★</div>
                      </div>
                      <button onClick={handleContactSeller} className="message-seller">
                        💬 Message seller
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details Section */}
              <div className="details-section">
                <div className="details-left">
                  <h3>Details</h3>
                  <p>
                    {product.description}
                  </p>

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
                      <span>4.8 • {product.reviews?.length || 0} reviews</span>
                      <button className="view-reviews">View reviews</button>
                    </div>

                    {product.reviews && product.reviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <span className="reviewer-name">{review.buyer}</span>
                            <div className="review-stars">★★★★★</div>
                          </div>
                        </div>
                        <p className="review-text">{review.comment}</p>
                      </div>
                    ))}

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
                      {product.similarItems && product.similarItems.map((item) => (
                        <div key={item.id} className="similar-item">
                          <div className="similar-image">🎧</div>
                          <p>{item.title}</p>
                        </div>
                      ))}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductViewModal;