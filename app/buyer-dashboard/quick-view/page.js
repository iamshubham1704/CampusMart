import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Heart,
  ShoppingCart,
  User,
  Star,
  MapPin,
  Clock,
  Eye,
  Shield,
  MessageCircle,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  Trash2,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '../../../components/contexts/CartContext';
import './ProductPage.css';

const ProductViewModal = ({ productId, isOpen, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [pickupInfo, setPickupInfo] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [actionLoading, setActionLoading] = useState({ buy: false, cart: false, contact: false });
  
  // Cart-specific states using CartContext
  const { 
    totalItems, 
    addToCart, 
    removeFromCart,
    updateQuantity,
    getItemQuantity,
    isInCart, 
    openCart,
    isLoading: cartLoading,
    cart // This should come from CartContext
  } = useCart();
  
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [cartItemQuantity, setCartItemQuantity] = useState(0);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  useEffect(() => {
    // Update cart item quantity when cart or productId changes
    if (productId) {
      setCartItemQuantity(getItemQuantity(productId));
    }
  }, [cart, productId, getItemQuantity]);

  // Remove these functions since you're using CartContext
  // const loadCart = () => { ... }
  // const saveCart = (newCart) => { ... }

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/listings/public/${productId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      const transformedProduct = {
        id: data._id || data.id,
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : parseFloat(data.price) * 1.3,
        condition: data.condition || 'Good',
        category: data.category,
        images: data.images || ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop'],
        seller: {
          id: data.seller?._id || data.sellerId,
          name: data.seller?.name || data.sellerName || 'Anonymous Seller',
          yearDept: data.seller?.yearDept || data.seller?.department || '3rd Year • CSE',
          verified: data.seller?.verified || false,
          rating: data.seller?.rating || 4.5,
          totalRatings: data.seller?.totalRatings || 0,
          joinDate: data.seller?.createdAt || new Date().toISOString(),
          email: data.seller?.email,
          phone: data.seller?.phone
        },
        location: data.location || 'Campus',
        createdAt: data.createdAt,
        views: data.views || 0,
        status: data.status || 'active',
        specifications: data.specifications || {},
        tags: data.tags || []
      };

      setProduct(transformedProduct);
      setPickupInfo(`Meet at ${transformedProduct.location}`);
      updateViewCount(productId);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(`Failed to load product details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateViewCount = async (id) => {
    try {
      await fetch(`/api/listings/public/${id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Error updating view count:', err);
    }
  };

  const handleBuyNow = async () => {
    try {
      setActionLoading({ ...actionLoading, buy: true });
      const orderData = {
        productId: product.id,
        sellerId: product.seller.id,
        quantity,
        paymentMethod: selectedPayment,
        pickupInfo,
        totalAmount: product.price * quantity
      };
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Failed to create order');
      const order = await response.json();
      alert(`Order placed successfully! Order ID: ${order.id}`);
      onClose();
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, buy: false });
    }
  };

  const handleAddToCart = async () => {
    try {
      setActionLoading({ ...actionLoading, cart: true });
      
      const success = await addToCart(product.id, quantity);
      
      if (success) {
        setShowCartPreview(true);
        
        // Auto-hide preview after 3 seconds
        setTimeout(() => setShowCartPreview(false), 3000);
        
        console.log(`Added ${product.title} to cart`);
      } else {
        console.error('Failed to add item to cart');
        alert('Failed to add to cart. Please try again.');
      }

    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, cart: false });
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      const success = await removeFromCart(productId);
      if (!success) {
        alert('Failed to remove item from cart');
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      alert('Failed to remove item from cart');
    }
  };

  const handleUpdateCartQuantity = async (newQuantity) => {
    if (newQuantity <= 0) {
      await handleRemoveFromCart();
      return;
    }

    try {
      const success = await updateQuantity(productId, newQuantity);
      if (!success) {
        alert('Failed to update cart quantity');
      }
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      alert('Failed to update cart quantity');
    }
  };

  const getCartTotal = () => {
    // Add null check for cart
    if (!cart || !Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return totalItems || 0;
  };

  const handleContactSeller = async () => {
    try {
      setActionLoading({ ...actionLoading, contact: true });
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: product.seller.id,
          productId: product.id,
          message: `Hi! I'm interested in your ${product.title}.`
        })
      });
      if (!response.ok) throw new Error('Failed to contact seller');
      setShowContactInfo(true);
    } catch (err) {
      console.error('Error contacting seller:', err);
      alert('Failed to contact seller. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, contact: false });
    }
  };

  const toggleWishlist = async () => {
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch(`/api/wishlist/${product.id}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) setIsWishlisted(!isWishlisted);
    } catch (err) {
      console.error('Error updating wishlist:', err);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const calculateSavings = () => {
    return ((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  if (!isOpen) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Cart Preview Notification */}
        {showCartPreview && (
          <div className="cart-preview-notification">
            <CheckCircle size={20} />
            <span>Added to cart! ({getCartItemCount()} items)</span>
            <button onClick={() => setShowCartPreview(false)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Cart Icon with Badge */}
        {getCartItemCount() > 0 && (
          <div className="cart-badge-container">
            <button className="cart-icon-btn" onClick={() => {
              setShowCartPreview(false);
              openCart();
            }}>
              <ShoppingCart size={20} />
              <span className="cart-badge">{getCartItemCount()}</span>
            </button>
          </div>
        )}

        {/* Cart Preview Dropdown - Add null checks */}
        {showCartPreview && cart && Array.isArray(cart) && cart.length > 0 && (
          <div className="cart-preview-dropdown">
            <div className="cart-preview-header">
              <h3>Cart ({getCartItemCount()} items)</h3>
              <button onClick={() => setShowCartPreview(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="cart-preview-items">
              {cart.slice(0, 3).map((item) => (
                <div key={item.id} className="cart-preview-item">
                  <img src={item.image} alt={item.title} />
                  <div className="item-details">
                    <h4>{item.title}</h4>
                    <p>₹{item.price} × {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="remove-item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {cart.length > 3 && (
                <p className="more-items">+{cart.length - 3} more items</p>
              )}
            </div>
            <div className="cart-preview-footer">
              <div className="cart-total">Total: ₹{getCartTotal()}</div>
              <button className="view-cart-btn" onClick={openCart}>
                <ShoppingBag size={16} />
                View Cart
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="modal-loading">
            <Loader2 size={48} className="spinner" />
            <p>Loading product details...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="modal-error">
            <AlertCircle size={48} />
            <h3>Failed to load product</h3>
            <p>{error}</p>
            <button onClick={fetchProductDetails} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {/* Product Content */}
        {product && (
          <div className="product-content">
            {/* Left Column - Gallery */}
            <div className="product-gallery">
              <div className="main-image">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                />

                {product.images.length > 1 && (
                  <>
                    <button className="image-nav prev" onClick={prevImage}>
                      <ChevronLeft size={20} />
                    </button>
                    <button className="image-nav next" onClick={nextImage}>
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                <button
                  className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={toggleWishlist}
                >
                  <Heart size={18} />
                </button>

                <div className="image-badges">
                  <div className="condition-badge">
                    <Package size={14} />
                    {product.condition}
                  </div>
                  {product.seller.verified && (
                    <div className="verified-badge">
                      <Shield size={14} />
                      Verified
                    </div>
                  )}
                  {isInCart(product?.id) && (
                    <div className="in-cart-badge">
                      <ShoppingCart size={14} />
                      In Cart ({cartItemQuantity})
                    </div>
                  )}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="image-thumbnails">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={image} alt={`${product.title} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="product-details">
              {/* Header */}
              <h1 className="product-title">{product.title}</h1>

              <div className="product-meta">
                <div className="meta-item">
                  <MapPin size={14} />
                  {product.location}
                </div>
                <div className="meta-item">
                  <Clock size={14} />
                  {formatTimeAgo(product.createdAt)}
                </div>
                <div className="meta-item">
                  <Eye size={14} />
                  {product.views} views
                </div>
              </div>

              {/* Price Section */}
              <div className="price-section">
                <div className="current-price">₹{product.price}</div>
                {product.originalPrice > product.price && (
                  <div className="price-comparison">
                    <span className="original-price">₹{product.originalPrice}</span>
                    <span className="savings-badge">
                      Save {calculateSavings()}%
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="product-description">
                <p>{product.description}</p>
              </div>

              {/* Specifications */}
              {Object.keys(product.specifications).length > 0 && (
                <div className="product-specs">
                  <h3>Specifications</h3>
                  <div className="specs-grid">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="spec-item">
                        <div className="spec-label">{key}:</div>
                        <div className="spec-value">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase Options */}
              <div className="purchase-options">
                <div className="quantity-section">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button onClick={decreaseQuantity}>
                      <Minus size={16} />
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button onClick={increaseQuantity}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Cart Management for Already Added Items */}
                {isInCart(product?.id) && (
                  <div className="cart-management">
                    <label>In Cart ({cartItemQuantity} items):</label>
                    <div className="cart-controls">
                      <button onClick={() => handleUpdateCartQuantity(cartItemQuantity - 1)}>
                        <Minus size={16} />
                      </button>
                      <span>{cartItemQuantity}</span>
                      <button onClick={() => handleUpdateCartQuantity(cartItemQuantity + 1)}>
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={handleRemoveFromCart}
                        className="remove-from-cart"
                        title="Remove from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="payment-section">
                  <label>Payment Method:</label>
                  <div className="payment-options">
                    <button
                      className={`payment-option ${selectedPayment === 'upi' ? 'active' : ''}`}
                      onClick={() => setSelectedPayment('upi')}
                    >
                      <Smartphone size={16} />
                      UPI
                    </button>
                    <button
                      className={`payment-option ${selectedPayment === 'card' ? 'active' : ''}`}
                      onClick={() => setSelectedPayment('card')}
                    >
                      <CreditCard size={16} />
                      Card
                    </button>
                    <button
                      className={`payment-option ${selectedPayment === 'cash' ? 'active' : ''}`}
                      onClick={() => setSelectedPayment('cash')}
                    >
                      <Banknote size={16} />
                      Cash
                    </button>
                  </div>
                </div>

                <div className="pickup-section">
                  <label>Pickup Information:</label>
                  <div className="pickup-info">
                    <input
                      type="text"
                      value={pickupInfo}
                      onChange={(e) => setPickupInfo(e.target.value)}
                      placeholder="Enter pickup details..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    className="buy-now-btn"
                    onClick={handleBuyNow}
                    disabled={actionLoading.buy}
                  >
                    {actionLoading.buy ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <ShoppingCart size={16} />
                    )}
                    Buy Now - ₹{product.price * quantity}
                  </button>
                  <button
                    className={`add-cart-btn ${isInCart(product?.id) ? 'in-cart' : ''}`}
                    onClick={handleAddToCart}
                    disabled={actionLoading.cart || cartLoading}
                  >
                    {actionLoading.cart || cartLoading ? (
                      <Loader2 size={16} className="spinner" />
                    ) : isInCart(product?.id) ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Package size={16} />
                    )}
                    {isInCart(product?.id) ? `Update Cart (+${quantity})` : 'Add to Cart'}
                  </button>
                </div>

                <button
                  className="contact-seller-btn"
                  onClick={handleContactSeller}
                  disabled={actionLoading.contact}
                >
                  {actionLoading.contact ? (
                    <Loader2 size={16} className="spinner" />
                  ) : (
                    <MessageCircle size={16} />
                  )}
                  Contact Seller
                </button>
              </div>

              {/* Seller Section */}
              <div className="seller-section">
                <div className="seller-header">
                  <div className="seller-avatar">
                    <User size={24} />
                  </div>
                  <div className="seller-info">
                    <h3>{product.seller.name}</h3>
                    <p>{product.seller.yearDept}</p>
                    <div className="seller-rating">
                      <Star size={14} />
                      {product.seller.rating} ({product.seller.totalRatings} reviews)
                    </div>
                  </div>
                  {product.seller.verified && (
                    <div className="verification-badge">
                      <CheckCircle size={16} />
                      Verified Seller
                    </div>
                  )}
                </div>

                {showContactInfo && (
                  <div className="contact-info">
                    <p>Contact details:</p>
                    <div className="contact-methods">
                      {product.seller.email && (
                        <a href={`mailto:${product.seller.email}`} className="contact-method">
                          <Mail size={16} />
                          {product.seller.email}
                        </a>
                      )}
                      {product.seller.phone && (
                        <a href={`tel:${product.seller.phone}`} className="contact-method">
                          <Phone size={16} />
                          {product.seller.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="product-tags">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ProductViewModal.propTypes = {
  productId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ProductViewModal;