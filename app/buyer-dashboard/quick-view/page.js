// ProductViewModal.js - Enhanced version with CSS classes
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
        title: 'Premium Noise-Canceling Headphones',
        price: 4999,
        originalPrice: 6999,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
        ],
        condition: 'Like New',
        category: 'electronics',
        description: 'Excellent condition noise-canceling headphones with premium sound quality. Perfect for study sessions and music. Comes with original box and all accessories. These headphones feature advanced noise cancellation technology that blocks out up to 35 dB of ambient noise, making them perfect for focused work sessions or immersive music listening.',
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
        location: 'North Campus',
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
            title: 'Sony Wireless Headphones',
            price: 3999,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop'
          },
          {
            id: 102,
            title: 'Beats Studio Pro',
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div>
            <p className="product-description">
              {product.description}
            </p>
            {product.features && (
              <div className="features-section">
                <h4>Key Features:</h4>
                <ul className="features-list">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
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
                    <div className="review-rating">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
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
            <>
              {/* Product Grid */}
              <div className="product-grid">
                {/* Product Images */}
                <div className="product-images">
                  <div className="main-image-container">
                    <img
                      src={product.images?.[selectedImageIndex] || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'}
                      alt={product.title}
                      className="main-product-image"
                    />

                    {/* Condition Badge */}
                    <div className="condition-badge">
                      {product.condition}
                    </div>

                    {/* Image Navigation */}
                    {product.images && product.images.length > 1 && (
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
                  </div>

                  {/* Image Thumbnails */}
                  {product.images && product.images.length > 1 && (
                    <div className="image-thumbnails">
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

                {/* Product Details */}
                <div className="product-details">
                  <div>
                    {/* Tags */}
                    <div className="product-tags">
                      {product.tags && product.tags.map(tag => (
                        <span key={tag} className="product-tag">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h1 className="product-title">{product.title}</h1>
                  </div>

                  {/* Price Section */}
                  <div className="price-section">
                    <div className="price-container">
                      <span className="current-price">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="original-price">₹{product.originalPrice}</span>
                      )}
                      {product.originalPrice && (
                        <span className="discount-badge">
                          {calculateSavings()}% OFF
                        </span>
                      )}
                    </div>
                    {product.originalPrice && (
                      <p className="savings-text">
                        You save ₹{product.originalPrice - product.price}!
                      </p>
                    )}
                  </div>

                  {/* Quick Info */}
                  <div className="quick-info">
                    <div className="info-item">
                      <MapPin size={16} className="info-icon" />
                      <span className="info-text">{product.location}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={16} className="info-icon" />
                      <span className="info-text">{product.timePosted}</span>
                    </div>
                    <div className="info-item">
                      <Eye size={16} className="info-icon" />
                      <span className="info-text">{product.views} views</span>
                    </div>
                    <div className="info-item">
                      <Zap size={16} className="info-icon quick-delivery" />
                      <span className="info-text quick-delivery">Quick delivery</span>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="quantity-section">
                    <label className="quantity-label">Quantity</label>
                    <div className="quantity-controls">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="qty-btn"
                      >
                        -
                      </button>
                      <span className="quantity-display">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      onClick={handleAddToCart}
                      disabled={cartLoading || isInCart(product.id)}
                      className={`primary-btn ${isInCart(product.id) ? 'in-cart' : ''}`}
                    >
                      {cartLoading ? (
                        <Loader2 size={20} className="spinner" />
                      ) : (
                        <ShoppingCart size={20} />
                      )}
                      {isInCart(product.id) ? 'In Cart' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={handleWishlistToggle}
                      className={`icon-btn ${isWishlisted ? 'wishlist-active' : ''}`}
                    >
                      <Heart size={20} />
                    </button>
                    <button className="icon-btn">
                      <Share2 size={20} />
                    </button>
                  </div>

                  {/* Seller Info */}
                  {product.seller && (
                    <div className="seller-info">
                      <div className="seller-container">
                        <div className="seller-profile">
                          <img
                            src={product.seller.avatar}
                            alt={product.seller.name}
                            className="seller-avatar"
                          />
                          <div className="seller-details">
                            <h4>
                              {product.seller.name}
                              {product.seller.verified && (
                                <span className="verified-badge">✓ Verified</span>
                              )}
                            </h4>
                            <div className="seller-stats">
                              <div className="rating">
                                <Star size={14} fill="#fbbf24" />
                                <span>{product.seller.rating}</span>
                              </div>
                              <span>{product.seller.totalSales} sales</span>
                              <span>Responds in {product.seller.responseTime}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={handleContactSeller} className="message-seller-btn">
                          <MessageCircle size={16} />
                          Message
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Tabs */}
              <div className="product-tabs">
                <div className="tab-headers">
                  <div className="tab-nav">
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                    >
                      Description
                    </button>
                    <button
                      onClick={() => setActiveTab('specifications')}
                      className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
                    >
                      Specifications
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                    >
                      Reviews ({product.reviews?.length || 0})
                    </button>
                  </div>
                </div>

                <div className="tab-content">
                  {renderTabContent()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductViewModal;