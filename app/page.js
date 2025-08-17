'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  Search,
  Sun,
  Moon,
  ArrowRight,
  Users,
  Shield,
  Zap,
  Check,
  Star,
  MapPin,
  Menu,
  X,
  Home,
  Info,
  Phone,
  User,
  LogIn,
  Bell,
  Heart
} from 'lucide-react';

const CampusMart = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [reportData, setReportData] = useState({
    role: '',
    issueType: '',
    email: '',
    description: '',
    priority: 'medium'
  });

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
    
    // Get initial window size
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Theme initialization - avoid localStorage on server
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') === 'dark';
      setIsDarkTheme(savedTheme);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced mouse movement handler with parallax calculation - only on desktop
  useEffect(() => {
    if (windowSize.width <= 768) return; // Skip on mobile/tablet
    
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      
      setMousePosition({ x, y });
      
      // Calculate parallax offset for background elements
      const parallaxX = (e.clientX - window.innerWidth / 2) * 0.02; // Reduced intensity
      const parallaxY = (e.clientY - window.innerHeight / 2) * 0.02;
      setParallaxOffset({ x: parallaxX, y: parallaxY });
    };

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.1; // Reduced scroll parallax
      document.documentElement.style.setProperty('--scroll-y', `${parallax}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [windowSize.width]);

  // Handle theme changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = isDarkTheme ? 'dark-theme' : 'light-theme';
      document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
      localStorage.setItem('theme', theme);
    }
  }, [isDarkTheme, mounted]);

  // Update mouse position CSS variables for interactive background - only on desktop
  useEffect(() => {
    if (mounted && windowSize.width > 768) {
      document.documentElement.style.setProperty('--mouse-x', `${mousePosition.x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${mousePosition.y}%`);
      document.documentElement.style.setProperty('--parallax-x', `${parallaxOffset.x}px`);
      document.documentElement.style.setProperty('--parallax-y', `${parallaxOffset.y}px`);
    }
  }, [mousePosition, parallaxOffset, mounted, windowSize.width]);

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleRoleSelect = (role) => {
    if (role === 'buyer') {
      router.push('/buyer-dashboard');
    } else if (role === 'seller') {
      router.push('/seller-dashboard');
    }
  };

  const handleReportSubmit = async () => {
    if (!reportData.description || !reportData.role || !reportData.issueType) {
      return;
    }

    setIsSubmittingReport(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: reportData.role,
          issueType: reportData.issueType,
          email: reportData.email,
          description: reportData.description,
          priority: reportData.priority,
          timestamp: new Date().toISOString(),
          status: 'pending'
        }),
      });

      if (response.ok) {
        setShowReportModal(false);
        setReportData({
          role: '',
          issueType: '',
          email: '',
          description: '',
          priority: 'medium'
        });
        setShowSuccessToast(true);
        
        // Hide success toast after 5 seconds
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const isMobile = windowSize.width <= 768;
  const isTablet = windowSize.width > 768 && windowSize.width <= 1024;

  return (
    <>
      {/* Interactive Background Elements - Only on desktop */}
      {!isMobile && (
        <div className="interactive-background">
          <div className="bg-element bg-element-1"></div>
          <div className="bg-element bg-element-2"></div>
          <div className="bg-element bg-element-3"></div>
          <div className="parallax-layer parallax-layer-1"></div>
          <div className="parallax-layer parallax-layer-2"></div>
          <div className="parallax-layer parallax-layer-3"></div>
        </div>
      )}

      {/* Enhanced Professional Header */}
      <header className="header">
        <div className="header-container">
          <nav className="navbar">
            {/* Brand Logo */}
            <div className="nav-brand">
              <div className="brand-logo">
                <div className="logo-container">
                  <div className="logo-icon">
                    <Store size={isMobile ? 24 : 28} />
                  </div>
                  {!isMobile && <div className="logo-pulse"></div>}
                </div>
                <div className="brand-text">
                  <h1 className="brand-name">CampusMart</h1>
                  {!isMobile && <span className="brand-tagline">Student Marketplace</span>}
                </div>
              </div>
            </div>

            {/* Center Navigation - Hidden on mobile/tablet */}
            {!isMobile && !isTablet && (
              <div className="nav-center">
                <ul className="nav-menu">
                  <li className="nav-item">
                    <a href="#" className="nav-link active">
                      <Home size={18} />
                      <span>Home</span>
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="#" className="nav-link">
                      <ShoppingBag size={18} />
                      <span>Policy</span>
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="#" className="nav-link">
                      <Info size={18} />
                      <span>About</span>
                    </a>
                  </li>
                </ul>
              </div>
            )}

            {/* Right Actions */}
            <div className="nav-actions">
              {/* Theme Toggle */}
              <button 
                className="theme-toggle" 
                onClick={toggleTheme} 
                title={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
                aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
              >
                <div className="theme-icon">
                  {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                </div>
              </button>

              {/* Notifications - Hidden on small mobile */}
              {windowSize.width > 480 && (
                <button className="notification-btn" title="Notifications" aria-label="Notifications">
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </button>
              )}

              <button 
                className="mobile-menu-btn" 
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <div className="mobile-menu-content">
              <div className="mobile-search">
                <div className="search-wrapper">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search products..."
                  />
                </div>
              </div>
              
              <ul className="mobile-nav-menu">
                <li><a href="#" className="mobile-nav-link active"><Home size={20} /><span>Home</span></a></li>
                <li><a href="#" className="mobile-nav-link"><ShoppingBag size={20} /><span>Marketplace</span></a></li>
                <li><a href="#" className="mobile-nav-link"><Users size={20} /><span>Community</span></a></li>
                <li><a href="#" className="mobile-nav-link"><Info size={20} /><span>About</span></a></li>
              </ul>
              
              <div className="mobile-actions">
                <button className="mobile-notification-btn">
                  <Bell size={20} />
                  <span>Notifications</span>
                  <span className="notification-badge">3</span>
                </button>
                <button className="mobile-favorites-btn">
                  <Heart size={20} />
                  <span>Favorites</span>
                </button>
              </div>

              <div className="mobile-auth-buttons">
                <button className="mobile-login-btn">
                  <LogIn size={20} />
                  <span>Login</span>
                </button>
                <button className="mobile-signup-btn">
                  <User size={20} />
                  <span>Sign Up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Interactive Background */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          {!isMobile && <div className="hero-pattern"></div>}
          {!isMobile && <div className="mouse-follower"></div>}
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Campus
              <span className="gradient-text"> Marketplace</span>
            </h1>
            
            <div className="hero-buttons">
              <div className="role-card buyer-card" onClick={() => handleRoleSelect('buyer')}>
                <div className="card-icon">
                  <ShoppingBag size={isMobile ? 24 : 28} />
                </div>
                <div className="card-content">
                  <h3>Start Buying</h3>
                  <p>Find great deals from students</p>
                </div>
                <ArrowRight className="card-arrow" size={20} />
              </div>
              
              <div className="role-card seller-card" onClick={() => handleRoleSelect('seller')}>
                <div className="card-icon">
                  <Store size={isMobile ? 24 : 28} />
                </div>
                <div className="card-content">
                  <h3>Start Selling</h3>
                  <p>Turn your items into cash</p>
                </div>
                <ArrowRight className="card-arrow" size={20} />
              </div>
            </div>
            
            <div className="hero-features">
              <div className="feature-badge">
                <Shield size={16} />
                <span>Secure & Verified</span>
              </div>
              <div className="feature-badge">
                <Users size={16} />
                <span>Campus Only</span>
              </div>
              <div className="feature-badge">
                <Zap size={16} />
                <span>Instant Connect</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="roadmap-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How CampusMart Works</h2>
            <p className="section-subtitle">
              Join thousands of students in just 4 simple steps
            </p>
          </div>
          
          <div className="roadmap-container">
            <div className="roadmap-path">
              <div className="roadmap-step">
                <div className="step-number">1</div>
                <div className="step-icon">
                  <User size={isMobile ? 28 : 32} />
                </div>
                <div className="step-content">
                  <h3>Create Account</h3>
                  <p>Sign up with your email and register as buyer or seller and start buying or selling.</p>
                </div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-number">2</div>
                <div className="step-icon">
                  <Search size={isMobile ? 28 : 32} />
                </div>
                <div className="step-content">
                  <h3>Browse & List</h3>
                  <p>Search for items you need or list your own products with photos and descriptions.</p>
                </div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-number">3</div>
                <div className="step-icon">
                  <Users size={isMobile ? 28 : 32} />
                </div>
                <div className="step-content">
                  <h3>Connect & Trade</h3>
                  <p>Message sellers after payment and arrange safe meetups on campus.</p>
                </div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-number">4</div>
                <div className="step-icon">
                  <Check size={isMobile ? 28 : 32} />
                </div>
                <div className="step-content">
                  <h3>Complete Transaction</h3>
                  <p>Meet safely, exchange items, and leave reviews to build your campus reputation.</p>
                </div>
              </div>
            </div>
            
            <button className="roadmap-cta" onClick={() => handleRoleSelect('buyer')}>
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trending on Campus</h2>
            <p className="section-subtitle">
              Most popular items being traded right now
            </p>
          </div>
          
          <div className="products-grid">
            {[
              { emoji: '📚', name: 'Engineering Textbook', price: '₹45', originalPrice: '₹120', seller: 'Alex M.', rating: 5, location: 'North Campus', badge: 'Hot Deal' },
              { emoji: '💻', name: 'MacBook Pro 2019', price: '₹899', originalPrice: '₹1299', seller: 'Sarah K.', rating: 5, location: 'South Dorm', badge: 'Featured' },
              { emoji: '🪑', name: 'Study Desk & Chair', price: '₹75', originalPrice: '₹150', seller: 'Mike R.', rating: 4, location: 'West Campus', badge: 'New' },
              { emoji: '🎧', name: 'Noise-Canceling Headphones', price: '₹120', originalPrice: '₹200', seller: 'Emma L.', rating: 5, location: 'East Hall', badge: 'Popular' },
              { emoji: '📱', name: 'iPhone 12', price: '₹450', originalPrice: '₹699', seller: 'Josh T.', rating: 4, location: 'Central Campus', badge: 'Hot Deal' },
              { emoji: '🛏', name: 'Twin Mattress', price: '₹80', originalPrice: '₹200', seller: 'Lisa W.', rating: 5, location: 'Graduate Housing', badge: 'Featured' }
            ].map((product, index) => (
              <div key={index} className="product-card">
                <div className="product-image">
                  <span className="product-emoji">{product.emoji}</span>
                  <div className={`product-badge ${product.badge.toLowerCase().replace(' ', '-')}`}>{product.badge}</div>
                  <button className="favorite-btn" aria-label="Add to favorites">
                    <Heart size={16} />
                  </button>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">
                    <span className="current-price">{product.price}</span>
                    <span className="original-price">{product.originalPrice}</span>
                    <span className="discount">{Math.round((1 - parseInt(product.price.slice(1)) / parseInt(product.originalPrice.slice(1))) * 100)}% off</span>
                  </div>
                  <div className="seller-info">
                    <span className="seller-name">{product.seller}</span>
                    <div className="rating">
                      {[...Array(product.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                      <span className="rating-text">({product.rating})</span>
                    </div>
                  </div>
                  <div className="product-location">
                    <MapPin size={14} />
                    <span>{product.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trusted by Students Nationwide</h2>
            <p className="section-subtitle">
              Join the largest student marketplace community
            </p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <h3>100+</h3>
              <p>Registered Students</p>
              <span>Across 20+ colleges</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <h3>50+</h3>
              <p>Items Sold</p>
              <span>This semester alone</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <h3>4.5★</h3>
              <p>Average Rating</p>
              <span>From user reviews</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <h3>₹10,000+</h3>
              <p>Transactions</p>
              <span>By users</span>
            </div>
          </div>

          <div className="testimonials-section">
            <h3>What Students Say</h3>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>"Sold my old engineering drawing kit in just 2 days! Didn't have to put up random posters on hostel notice boards anymore. The buyer was from my own campus so delivery was super easy."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">HR</div>
                  <div className="author-info">
                    <div className="author-name">Harsh Rana</div>
                    <div className="author-school">MAIT</div>
                  </div>
                </div>
              </div>
              
              <div className="testimonial-card">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>"Managed to get my lab coat and a couple of reference books all in one go from seniors. Everything was in great condition and way cheaper than the campus shop."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">SM</div>
                  <div className="author-info">
                    <div className="author-name">Suteekshn Manchanda</div>
                    <div className="author-school">MAIT</div>
                  </div>
                </div>
              </div>
              
              <div className="testimonial-card">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>"Posted my old textbooks here before summer break and made enough money to cover my mess bill for the month. Best part - I didn't even have to step outside campus."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">AS</div>
                  <div className="author-info">
                    <div className="author-name">Abhay Singh</div>
                    <div className="author-school">MAIT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cta-section">
            <h3>Ready to Start Trading?</h3>
            <p>Join your campus community today and discover a smarter way to buy and sell.</p>
            <div className="cta-buttons">
              <button className="btn btn-buyer" onClick={() => handleRoleSelect('buyer')}>
                <ShoppingBag size={20} />
                Start Buying
              </button>
              <button className="btn btn-seller" onClick={() => handleRoleSelect('seller')}>
                <Store size={20} />
                Start Selling
              </button>
            </div>
          </div>

          <div className="trust-features">
            <div className="trust-feature">
              <div className="trust-icon">
                <Shield size={24} />
              </div>
              <div className="trust-content">
                <h4>University Verified</h4>
                <p>Verifying college users at the time of registrations.</p>
              </div>
            </div>
            
            <div className="trust-feature">
              <div className="trust-icon">
                <Users size={24} />
              </div>
              <div className="trust-content">
                <h4>Campus Community</h4>
                <p>Trade only with verified students from your college for maximum trust.</p>
              </div>
            </div>
            
            <div className="trust-feature">
              <div className="trust-icon">
                <Zap size={24} />
              </div>
              <div className="trust-content">
                <h4>Instant Messaging</h4>
                <p>Connect with buyers and sellers instantly through our secure messaging system.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Issue Section */}
      <section className="report-issue-section">
        <div className="container">
          <div className="report-issue-card">
            <div className="report-issue-header">
              <div className="report-icon">
                <Shield size={24} />
              </div>
              <div className="report-content">
                <h3>Need Help?</h3>
                <p>Report any issues or concerns to help us improve CampusMart</p>
              </div>
            </div>
            <button 
              className="report-issue-btn"
              onClick={() => setShowReportModal(true)}
            >
              Report Issue
            </button>
          </div>
        </div>
      </section>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report an Issue</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowReportModal(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="reporterRole">Your Role</label>
                <select 
                  id="reporterRole"
                  value={reportData.role}
                  onChange={(e) => setReportData(prev => ({ ...prev, role: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select your role</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="issueType">Issue Type</label>
                <select 
                  id="issueType"
                  value={reportData.issueType}
                  onChange={(e) => setReportData(prev => ({ ...prev, issueType: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select issue type</option>
                  <option value="technical">Technical Problem</option>
                  <option value="payment">Payment Issue</option>
                  <option value="fraud">Suspicious Activity/Fraud</option>
                  <option value="seller">Seller Issue</option>
                  <option value="buyer">Buyer Issue</option>
                  <option value="product">Product Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reportEmail">Email</label>
                <input
                  type="email"
                  id="reportEmail"
                  value={reportData.email}
                  onChange={(e) => setReportData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                  placeholder="Your email for follow-up"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reportDescription">Description</label>
                <textarea
                  id="reportDescription"
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reportUrgency">Priority Level</label>
                <select 
                  id="reportUrgency"
                  value={reportData.priority}
                  onChange={(e) => setReportData(prev => ({ ...prev, priority: e.target.value }))}
                  className="form-select"
                >
                  <option value="low">Low - General feedback</option>
                  <option value="medium">Medium - Issue affecting experience</option>
                  <option value="high">High - Urgent issue</option>
                  <option value="critical">Critical - Security/Safety concern</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowReportModal(false)}
                disabled={isSubmittingReport}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleReportSubmit}
                disabled={!reportData.description || !reportData.role || !reportData.issueType || isSubmittingReport}
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="success-toast">
          <div className="toast-content">
            <Check size={20} />
            <span>Report submitted successfully! We'll review it soon.</span>
          </div>
        </div>
      )}
    </>
  );
};

export default CampusMart;