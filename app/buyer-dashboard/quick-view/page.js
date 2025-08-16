// ProductViewModal.js - Enhanced version with original frontend design
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
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

// Accept currentUser and currentUserLoading as props
const ProductViewModal = ({ productId, isOpen, onClose, currentUser, currentUserLoading }) => {
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
  const router = useRouter(); // Initialize router

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

      ('🔍 Fetching product details for ID:', productId);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        ('🔑 Using auth token');
      } else {
        ('⚠️ No auth token found');
      }

      ('📡 Making request to:', `/api/listings/public/${productId}`);

      const response = await fetch(`/api/listings/public/${productId}`, {
        method: 'GET',
        headers
      });

      ('📨 Response status:', response.status);
      ('📨 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);

        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to fetch product: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      ('✅ Received data:', data);

      // Your API returns data in 'listing' field, not 'data'
      const productData = data.listing || data.data || data;
      ('📦 Product data:', productData);

      setProduct(productData);

      // Update view count using public endpoint (optional)
      if (productData) {
        ('👀 View already tracked by API');
      }

    } catch (err) {
      console.error('❌ Error fetching product:', err);
      setError(err.message);

      // Fallback to mock data for development - ONLY FOR DEV, REMOVE IN PRODUCTION
      if (process.env.NODE_ENV === 'development') {
        const mockProduct = {
          id: productId,
          _id: productId, // Add both id and _id
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
          // FIXED: Ensure seller structure matches what we expect
          seller: {
            _id: '654321098765432109876544', // Use _id instead of id
            id: '654321098765432109876544', // Keep both for compatibility
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
      } else {
        setProduct(null); // Clear product if fetching failed and not in dev mode
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      console.error('❌ Product is null/undefined');
      return;
    }

    const listingId = product.id || product._id || product.listingId;

    if (!listingId) {
      console.error('❌ No valid product ID found for cart');
      return;
    }

    ('🛒 Adding to cart with ID:', listingId, 'quantity:', quantity);

    try {
      const success = await addToCart(listingId, quantity);
      if (success) {
        ('✅ Added to cart successfully');
      } else {
        console.error('❌ Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
    }
  };

  const handleContactSeller = async () => {
    // Check if user is loading
    if (currentUserLoading) {
      alert('Your profile is still loading. Please wait a moment and try again.');
      return;
    }

    // Check if user is logged in
    if (!currentUser || !currentUser._id) {
      alert('Please log in to contact the seller.');
      router.push('/buyer-login');
      return;
    }

    // Check if product exists
    if (!product) {
      console.error('Cannot contact seller: Product info missing.');
      alert('Product information is unavailable. Please try again later.');
      return;
    }

    // Get seller ID from product
    let sellerId = null;

    if (product.seller && (product.seller._id || product.seller.id)) {
      sellerId = product.seller._id || product.seller.id;
    } else if (product.sellerId || product.seller_id) {
      sellerId = product.sellerId || product.seller_id;
    } else if (product.userId || product.user_id) {
      sellerId = product.userId || product.user_id;
    }

    if (!sellerId) {
      console.error('Cannot contact seller: Seller ID not found in product data.');
      ('Product structure:', product);
      alert('Seller information is unavailable. Please try again later.');
      return;
    }

    ('Attempting to contact seller:', product.seller?.name || 'Unknown', 'Seller ID:', sellerId);

    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');

      if (!token) {
        alert('Please log in to contact the seller.');
        router.push('/buyer-login');
        return;
      }

      // FIXED: Send exactly what your API expects
      const requestBody = {
        buyerId: currentUser._id,
        sellerId: sellerId,
        productId: product._id || product.id
      };

      ('Sending conversation request:', requestBody);

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to initiate conversation');
      }

      const data = await response.json();
      ('Conversation response:', data);

      onClose(); // Close the product modal

      // Get conversation ID from response (your API returns conversationId field)
      const conversationId = data.conversationId || data.conversation?._id || data.conversation?.id;

      if (!conversationId) {
        console.error('No conversation ID returned:', data);
        alert('Conversation created but navigation failed. Please check your messages.');
        return;
      }

      // Redirect to the buyer's messages page with the conversation ID
      router.push(`/buyer-dashboard/messages?chatId=${conversationId}`);

    } catch (error) {
      console.error('Error initiating conversation:', error);
      alert(`Could not start conversation: ${error.message}`);
    }
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
    if (!product) return null; // Ensure product is loaded before rendering tab content

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
                    <div className="price">₹ {Math.round(product.price * 1.1)}</div>
                    {product.originalPrice && (
                      <>
                        <div className="original-price">₹{product.originalPrice}</div>
                        <div className="discount">save {calculateSavings()}%</div>
                      </>
                    )}
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
                      disabled={cartLoading || isInCart(product.id || product._id)}
                      className={`add-cart-btn ${isInCart(product.id || product._id) ? 'in-cart' : ''}`}
                    >
                      {cartLoading ? (
                        <Loader2 size={20} className="spinner" />
                      ) : (
                        <>🛒 {isInCart(product.id || product._id) ? 'In Cart' : 'Add to Cart'}</>
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