// ProductViewModal.js - Enhanced version with proper payment options popup
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Zap,
  FileText,
  AlertTriangle,
  QrCode,
  CreditCard,
  ArrowRight,
  Copy,
  Upload,
  Camera
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
  const [selectedPayment, setSelectedPayment] = useState('');
  const [selectedColor, setSelectedColor] = useState('black');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showOrderPolicyModal, setShowOrderPolicyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('options'); // 'options', 'qr', 'upi-id', or 'screenshot'
  const [uploadedScreenshot, setUploadedScreenshot] = useState(null);
  const [selectedUpiOption, setSelectedUpiOption] = useState(''); // 'qr' or 'upi-id'

  const { addToCart, isInCart, cartLoading } = useCart();
  const router = useRouter();

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
      setSelectedImageIndex(0); // Reset image index

      console.log('🔍 Fetching product details for ID:', productId);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Using auth token');
      }

      console.log('📡 Making request to:', `/api/listings/public/${productId}`);

      const response = await fetch(`/api/listings/public/${productId}`, {
        method: 'GET',
        headers
      });

      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);

        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Received API data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch product');
      }

      // Extract the listing from the API response
      const productData = data.listing;
      
      if (!productData) {
        throw new Error('No product data found');
      }

      console.log('📦 Product data extracted:', productData);
      console.log('🖼️ Product images:', productData.images);

      // Ensure images are properly formatted
      if (productData.images && productData.images.length > 0) {
        console.log('🎨 Processing images...');
        productData.images.forEach((img, idx) => {
          console.log(`Image ${idx}:`, {
            type: typeof img,
            hasUrl: img && img.url ? 'YES' : 'NO',
            url: img && img.url ? img.url.substring(0, 50) + '...' : 'No URL'
          });
        });
      } else {
        console.log('⚠️ No images found in product data');
      }

      setProduct(productData);

    } catch (err) {
      console.error('❌ Error fetching product:', err);
      setError(err.message);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (!product || !product.images || product.images.length === 0) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop';
    }

    const currentImage = product.images[selectedImageIndex];
    
    if (!currentImage) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop';
    }

    // Handle different image formats
    if (typeof currentImage === 'string') {
      // Old format - direct base64 string
      return currentImage;
    } else if (typeof currentImage === 'object' && currentImage.url) {
      // New format - ImageKit object
      return currentImage.url;
    }

    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop';
  };

  // Get thumbnail URL for image navigation
  const getThumbnailUrl = (image) => {
    if (typeof image === 'string') {
      return image;
    } else if (typeof image === 'object' && image.thumbnailUrl) {
      return image.thumbnailUrl;
    } else if (typeof image === 'object' && image.url) {
      return image.url;
    }
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop';
  };

  // Handler functions
  const handleScreenshotUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedScreenshot(file);
      console.log('📸 Screenshot uploaded:', file.name);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!uploadedScreenshot) {
      alert('Please upload payment screenshot first');
      return;
    }

    if (!currentUser || !product) {
      alert('Missing user or product information');
      return;
    }

    try {
      console.log('📤 Uploading payment screenshot...', {
        file: uploadedScreenshot.name,
        size: uploadedScreenshot.size,
        type: uploadedScreenshot.type
      });

      const formData = new FormData();
      formData.append('screenshot', uploadedScreenshot);
      formData.append('productId', product._id || product.id);
      formData.append('sellerId', product.seller?._id || product.sellerId);
      formData.append('amount', product.price.toString());
      formData.append('paymentMethod', 'upi');
      formData.append('upiId', '8750471736@ptsbi');

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to continue');
        router.push('/buyer-login');
        return;
      }

      const response = await fetch('/api/payment-screenshots/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to upload screenshot');
      }

      console.log('✅ Screenshot uploaded successfully:', result);

      alert(`Order submitted successfully! 

Order ID: ${result.data.orderId}
Status: Payment verification pending

We will verify your payment and confirm your order shortly. You can track your order status in your dashboard.`);

      setShowPaymentModal(false);
      setPaymentStep('options');
      setSelectedUpiOption('');
      setUploadedScreenshot(null);
      onClose();

    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      alert(`Failed to submit order: ${error.message}`);
    }
  };

  const handleBuyNow = () => {
    if (currentUserLoading) {
      alert('Please wait while we load your profile.');
      return;
    }

    if (!currentUser) {
      alert('Please log in to purchase this product.');
      router.push('/buyer-login');
      return;
    }

    setShowPaymentModal(true);
    setPaymentStep('options');
    setSelectedUpiOption('');
    setUploadedScreenshot(null);
  };

  const handlePaymentOptionSelect = (option) => {
    setSelectedUpiOption(option);
    if (option === 'qr') {
      setPaymentStep('qr');
    } else if (option === 'upi-id') {
      setPaymentStep('upi-id');
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      console.error('❌ Product is null/undefined');
      return;
    }

    const listingId = product.id || product._id;

    if (!listingId) {
      console.error('❌ No valid product ID found for cart');
      return;
    }

    console.log('🛒 Adding to cart with ID:', listingId, 'quantity:', quantity);

    try {
      const success = await addToCart(listingId, quantity);
      if (success) {
        console.log('✅ Added to cart successfully');
      } else {
        console.error('❌ Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
    }
  };

  const handleContactSeller = async () => {
    if (currentUserLoading) {
      alert('Your profile is still loading. Please wait a moment and try again.');
      return;
    }

    if (!currentUser || !currentUser._id) {
      alert('Please log in to contact the seller.');
      router.push('/buyer-login');
      return;
    }

    if (!product) {
      console.error('Cannot contact seller: Product info missing.');
      alert('Product information is unavailable. Please try again later.');
      return;
    }

    let sellerId = product.seller?._id || product.seller?.id || product.sellerId;

    if (!sellerId) {
      console.error('Cannot contact seller: Seller ID not found in product data.');
      console.log('Product structure:', product);
      alert('Seller information is unavailable. Please try again later.');
      return;
    }

    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');

      if (!token) {
        alert('Please log in to contact the seller.');
        router.push('/buyer-login');
        return;
      }

      const requestBody = {
        buyerId: currentUser._id,
        sellerId: sellerId,
        productId: product._id || product.id
      };

      console.log('Sending conversation request:', requestBody);

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
      console.log('Conversation response:', data);

      onClose();

      const conversationId = data.conversationId || data.conversation?._id || data.conversation?.id;

      if (!conversationId) {
        console.error('No conversation ID returned:', data);
        alert('Conversation created but navigation failed. Please check your messages.');
        return;
      }

      router.push(`/buyer-dashboard/messages?chatId=${conversationId}`);

    } catch (error) {
      console.error('Error initiating conversation:', error);
      alert(`Could not start conversation: ${error.message}`);
    }
  };

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText('8750471736@ptsbi');
      alert('UPI ID copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy UPI ID:', error);
      const textArea = document.createElement('textarea');
      textArea.value = '8750471736@ptsbi';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('UPI ID copied to clipboard!');
    }
  };

  const calculateSavings = () => {
    if (!product || !product.originalPrice) return 0;
    return ((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0);
  };

  const handleImageError = (e) => {
    console.warn('❌ Image failed to load:', e.target.src);
    e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop';
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
              {/* Product Header */}
              <div className="product-header">
                <h1>{product.title}</h1>
              </div>

              <div className="product-container">
                {/* Left Side - Product Image */}
                <div className="product-image-section">
                  <div className="main-product-image">
                    <img
                      src={getCurrentImageUrl()}
                      alt={product.title}
                      className="product-image"
                      onError={handleImageError}
                      onLoad={() => console.log('✅ Image loaded successfully:', getCurrentImageUrl())}
                    />
                    
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
                            src={getThumbnailUrl(image)}
                            alt={`${product.title} ${index + 1}`}
                            className="thumbnail-image"
                            onError={handleImageError}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Product Details */}
                <div className="product-details-section">
                  <div className="price-section">
                    <div className="price">
                      ₹ {product.commission !== undefined 
                        ? Math.round((product.price || 0) + ((product.price || 0) * ((product.commission || 0) / 100)))
                        : product.price
                      }
                    </div>
                    {product.originalPrice && (
                      <>
                        <div className="original-price">₹{product.originalPrice}</div>
                        <div className="discount">save {calculateSavings()}%</div>
                      </>
                    )}
                  </div>

                  <div className="delivery-section">
                    <div className="delivery-info">
                      <strong>Delivery / Pickup</strong>
                      <div className="delivery-option">
                        <span>🎯</span>
                        <span>Same as Current address</span>
                        <span className="change-link">📍 Need at {product.location}</span>
                      </div>
                      {(product.college || product.location) && (
                        <div className="delivery-option" style={{ marginTop: 6 }}>
                          <span>🏫</span>
                          <span>College</span>
                          <span className="change-link">{product.college || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="action-buttons">
                    <button onClick={handleBuyNow} className="buy-now-btn">
                      Buy Now
                    </button>
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
                  

                  {/* Product Actions */}
                  <div className="product-actions">
                    <div className="action-cards">
                      <button onClick={() => setShowOrderPolicyModal(true)} className="action-card">
                        <div className="action-icon">
                          <FileText size={24} />
                        </div>
                        <div className="action-content">
                          <h5>Order Policy</h5>
                          <p>View return policy, shipping info, and warranty details</p>
                        </div>
                      </button>

                      <button onClick={() => setShowReportModal(true)} className="action-card report-card">
                        <div className="action-icon">
                          <Flag size={24} />
                        </div>
                        <div className="action-content">
                          <h5>Report Product</h5>
                          <p>Report inappropriate content or issues with this listing</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="details-section">
                <div className="details-left">
                  <h3>Details</h3>
                  <p>{product.description}</p>
                  
                  {product.views && (
                    <div className="product-stats">
                      <span className="stat">
                        <Eye size={16} />
                        {product.views} views
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Payment Modal */}
          {showPaymentModal && (
            <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
              <div className="payment-modal-popup" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Complete Payment</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="modal-close-btn">
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-body">
                  {/* Trust & Support Banner */}
                  <div className="payment-support-banner">
                    <div className="banner-title">For Payment Inquiries, Please Contact:</div>
                    <div className="banner-contacts">
                      <span>Shubham Solanki: <a href="tel:+919315863073">+91 93158 63073</a></span>
                      <span>Krish: <a href="tel:+919821646882">+91 98216 46882</a></span>
                    </div>
                    <div className="banner-note">Feel free to reach out!</div>
                  </div>
                  {/* Step 1: Payment Options */}
                  {paymentStep === 'options' && (
                    <div className="payment-options-step">
                      <div className="payment-step-header">
                        <h4>Choose Payment Method</h4>
                        <p>Select how you'd like to pay for this item</p>
                      </div>

                      <div className="payment-options-grid">
                        <div
                          className={`payment-option-card ${selectedUpiOption === 'qr' ? 'selected' : ''}`}
                          onClick={() => handlePaymentOptionSelect('qr')}
                        >
                          <div className="payment-option-icon">
                            <QrCode size={32} />
                          </div>
                          <div className="payment-option-content">
                            <h5>Scan QR Code</h5>
                            <p>Use any UPI app to scan and pay instantly</p>
                            <span className="payment-option-badge">Recommended</span>
                          </div>
                          <ArrowRight size={20} className="payment-option-arrow" />
                        </div>

                        <div
                          className={`payment-option-card ${selectedUpiOption === 'upi-id' ? 'selected' : ''}`}
                          onClick={() => handlePaymentOptionSelect('upi-id')}
                        >
                          <div className="payment-option-icon">
                            <CreditCard size={32} />
                          </div>
                          <div className="payment-option-content">
                            <h5>UPI ID</h5>
                            <p>Pay using UPI ID manually</p>
                            <span className="payment-option-badge">Alternative</span>
                          </div>
                          <ArrowRight size={20} className="payment-option-arrow" />
                        </div>
                      </div>

                      <div className="payment-summary">
                        <div className="summary-row">
                          <span>Product:</span>
                          <span>{product?.title}</span>
                        </div>
                        <div className="summary-row">
                          <span>Quantity:</span>
                          <span>{quantity}</span>
                        </div>
                        <div className="summary-row total">
                          <span>Total Amount:</span>
                          <span>₹{product?.price}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: QR Code Payment */}
                  {paymentStep === 'qr' && (
                    <div className="payment-qr-step">
                      <div className="payment-step-header">
                        <button
                          onClick={() => setPaymentStep('options')}
                          className="back-btn"
                        >
                          <ChevronLeft size={16} /> Back to Options
                        </button>
                        <h4>Scan QR Code to Pay</h4>
                      </div>

                      <div className="qr-payment-container">
                        <div className="qr-code-display">
                          <div className="qr-placeholder">
                            <img
                              src="/qr.png"
                              alt="Payment QR Code"
                              className="qr-image"
                            />

                            <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <QrCode size={120} />
                            </div>
                          </div>
                          <p className="qr-instruction">Scan with any UPI app</p>
                        </div>

                        <div className="payment-details">
                          <div className="detail-row">
                            <span className="detail-label">UPI ID:</span>
                            <span className="detail-value">8750471736@ptsbi</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Amount:</span>
                            <span className="detail-value">₹{product?.price}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Product:</span>
                            <span className="detail-value">{product?.title}</span>
                          </div>
                        </div>

                        <div className="payment-instructions">
                          <h5>How to pay:</h5>
                          <ol>
                            <li>Open any UPI app (PhonePe, GPay, Paytm, etc.)</li>
                            <li>Tap on 'Scan & Pay' or QR scanner</li>
                            <li>Scan the QR code above</li>
                            <li>Enter amount ₹{product?.price} and confirm payment</li>
                            <li>Take a screenshot of successful payment</li>
                          </ol>
                        </div>

                        <button
                          onClick={() => setPaymentStep('screenshot')}
                          className="payment-done-btn"
                        >
                          Payment Done - Upload Screenshot
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: UPI ID Payment */}
                  {paymentStep === 'upi-id' && (
                    <div className="payment-upi-step">
                      <div className="payment-step-header">
                        <button
                          onClick={() => setPaymentStep('options')}
                          className="back-btn"
                        >
                          <ChevronLeft size={16} /> Back to Options
                        </button>
                        <h4>Pay with UPI ID</h4>
                      </div>

                      <div className="upi-payment-container">
                        <div className="upi-id-display">
                          <h5>Send money to this UPI ID:</h5>
                          <div className="upi-id-box">
                            <span className="upi-id-text">8750471736@ptsbi</span>
                            <button onClick={handleCopyUpiId} className="copy-btn">
                              <Copy size={16} /> Copy
                            </button>
                          </div>
                        </div>

                        <div className="payment-details">
                          <div className="detail-row">
                            <span className="detail-label">Amount to Send:</span>
                            <span className="detail-value amount">₹{product?.price}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Product:</span>
                            <span className="detail-value">{product?.title}</span>
                          </div>
                        </div>

                        <div className="payment-instructions">
                          <h5>Steps to pay:</h5>
                          <ol>
                            <li>Open your UPI app</li>
                            <li>Choose 'Send Money' or 'Pay'</li>
                            <li>Enter UPI ID: <strong>8750471736@ptsbi</strong></li>
                            <li>Enter amount: <strong>₹{product?.price}</strong></li>
                            <li>Complete the payment</li>
                            <li>Take screenshot of successful transaction</li>
                          </ol>
                        </div>

                        <button
                          onClick={() => setPaymentStep('screenshot')}
                          className="payment-done-btn"
                        >
                          Payment Done - Upload Screenshot
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Screenshot Upload */}
                  {paymentStep === 'screenshot' && (
                    <div className="payment-screenshot-step">
                      <div className="payment-step-header">
                        <button
                          onClick={() => setPaymentStep(selectedUpiOption)}
                          className="back-btn"
                        >
                          <ChevronLeft size={16} /> Back
                        </button>
                        <h4>Upload Payment Screenshot</h4>
                      </div>

                      <div className="screenshot-upload-container">
                        <div className="upload-area">
                          <label htmlFor="screenshot-upload" className="upload-label">
                            {uploadedScreenshot ? (
                              <div className="uploaded-file">
                                <Camera size={32} />
                                <span>Screenshot uploaded successfully!</span>
                                <p className="file-name">{uploadedScreenshot.name}</p>
                              </div>
                            ) : (
                              <div className="upload-placeholder">
                                <Upload size={32} />
                                <span>Click to upload screenshot</span>
                                <p>Upload a clear screenshot of your successful payment</p>
                              </div>
                            )}
                          </label>
                          <input
                            id="screenshot-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotUpload}
                            style={{ display: 'none' }}
                          />
                        </div>

                        <div className="upload-instructions">
                          <h5>Screenshot should contain:</h5>
                          <ul>
                            <li>✓ Transaction successful message</li>
                            <li>✓ Amount: ₹{product?.price}</li>
                            <li>✓ UPI ID: 8750471736@ptsbi</li>
                            <li>✓ Date and time of transaction</li>
                          </ul>
                        </div>

                        <button
                          onClick={handlePaymentSubmit}
                          disabled={!uploadedScreenshot}
                          className={`submit-order-btn ${!uploadedScreenshot ? 'disabled' : ''}`}
                        >
                          {!uploadedScreenshot ? 'Upload Screenshot First' : 'Submit Order'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Report Modal */}
          {showReportModal && (
            <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
              <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Report Product</h3>
                  <button onClick={() => setShowReportModal(false)} className="modal-close-btn">
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-content">
                  <div className="report-options">
                    <div className="report-option">
                      <input type="radio" id="fake" name="report" value="fake" />
                      <label htmlFor="fake">Fake or counterfeit product</label>
                    </div>
                    <div className="report-option">
                      <input type="radio" id="misleading" name="report" value="misleading" />
                      <label htmlFor="misleading">Misleading description</label>
                    </div>
                    <div className="report-option">
                      <input type="radio" id="inappropriate" name="report" value="inappropriate" />
                      <label htmlFor="inappropriate">Inappropriate content</label>
                    </div>
                    <div className="report-option">
                      <input type="radio" id="spam" name="report" value="spam" />
                      <label htmlFor="spam">Spam or duplicate listing</label>
                    </div>
                    <div className="report-option">
                      <input type="radio" id="other" name="report" value="other" />
                      <label htmlFor="other">Other</label>
                    </div>
                  </div>
                  <textarea
                    placeholder="Additional details (optional)"
                    className="report-details"
                    rows={4}
                  />
                  <button
                    onClick={() => {
                      alert('Report submitted. We will review this listing.');
                      setShowReportModal(false);
                    }}
                    className="submit-report-btn"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Policy Modal */}
          {showOrderPolicyModal && (
            <div className="policy-modal-overlay" onClick={() => setShowOrderPolicyModal(false)}>
              <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Order Policy & Information</h3>
                  <button onClick={() => setShowOrderPolicyModal(false)} className="modal-close-btn">
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-content">
                  <div className="policy-content">
                    <div className="policy-section">
                      <h4>📦 Shipping & Delivery</h4>
                      <ul>
                        <li>Free delivery within campus</li>
                        <li>Same-day delivery available</li>
                        <li>Delivery charges may apply for off-campus locations</li>
                        <li>Contact seller for pickup arrangements</li>
                      </ul>
                    </div>

                    {/* <div className="policy-section">
                      <h4>🔄 Return Policy</h4>
                      <ul>
                        <li>7-day return policy for defective items</li>
                        <li>Items must be in original condition</li>
                        <li>Buyer responsible for return shipping</li>
                        <li>No returns on used items unless defective</li>
                      </ul>
                    </div> */}

                    <div className="policy-section">
                      <h4>🛡️ Warranty</h4>
                      <ul>
                        <li>Original manufacturer warranty applies</li>
                        <li>Warranty terms as per brand guidelines</li>
                        <li>Keep purchase receipt for warranty claims</li>
                      </ul>
                    </div>

                    <div className="policy-section">
                      <h4>💳 Payment</h4>
                      <ul>
                        <li>UPI payments accepted</li>
                        <li>Payment verification required</li>
                        <li>Cash on delivery for local pickups</li>
                        <li>No refunds without valid reason</li>
                      </ul>
                    </div>
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