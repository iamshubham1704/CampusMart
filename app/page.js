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

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
    const savedTheme = typeof window !== 'undefined' ? 
      (localStorage.getItem('theme') === 'dark') : false;
    setIsDarkTheme(savedTheme);
  }, []);

  // Enhanced mouse movement handler with parallax calculation
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      
      setMousePosition({ x, y });
      
      // Calculate parallax offset for background elements
      const parallaxX = (e.clientX - window.innerWidth / 2) * 0.05;
      const parallaxY = (e.clientY - window.innerHeight / 2) * 0.05;
      setParallaxOffset({ x: parallaxX, y: parallaxY });
    };

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.3;
      
      // Update CSS custom properties for scroll-based parallax
      document.documentElement.style.setProperty('--scroll-y', `${parallax}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (mounted) {
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = isDarkTheme ? 'dark-theme' : 'light-theme';
      document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    }
  }, [isDarkTheme, mounted]);

  // Update mouse position CSS variables for interactive background
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty('--mouse-x', `${mousePosition.x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${mousePosition.y}%`);
      document.documentElement.style.setProperty('--parallax-x', `${parallaxOffset.x}px`);
      document.documentElement.style.setProperty('--parallax-y', `${parallaxOffset.y}px`);
    }
  }, [mousePosition, parallaxOffset, mounted]);

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleRoleSelect = (role) => {
    if (role === 'buyer') {
      router.push('/buyer-registration');
    } else if (role === 'seller') {
      router.push('/seller-registration');
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Interactive Background Elements */}
      <div className="interactive-background">
        <div className="bg-element bg-element-1"></div>
        <div className="bg-element bg-element-2"></div>
        <div className="bg-element bg-element-3"></div>
        <div className="parallax-layer parallax-layer-1"></div>
        <div className="parallax-layer parallax-layer-2"></div>
        <div className="parallax-layer parallax-layer-3"></div>
      </div>

      {/* Enhanced Professional Header */}
      <header className="header">
        <div className="header-container">
          <nav className="navbar">
            {/* Brand Logo */}
            <div className="nav-brand">
              <div className="brand-logo">
                <div className="logo-container">
                  <div className="logo-icon">
                    <Store size={28} />
                  </div>
                  <div className="logo-pulse"></div>
                </div>
                <div className="brand-text">
                  <h1 className="brand-name">CampusMart</h1>
                  <span className="brand-tagline">Student Marketplace</span>
                </div>
              </div>
            </div>

            {/* Center Navigation */}
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
                    <span>Marketplace</span>
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#" className="nav-link">
                    <Users size={18} />
                    <span>Community</span>
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

            {/* Right Actions */}
            <div className="nav-actions">
              {/* Mobile Menu Button */}
              <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
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
          <div className="hero-pattern"></div>
          <div className="mouse-follower"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Campus
              <span className="gradient-text"> Marketplace</span>
            </h1>
            
            <div className="hero-buttons">
              <div className="role-card buyer-card" 
                style={{
                  width: '280px',
                  height: '180px',
                  margin: '0 auto'
                }} 
                onClick={() => handleRoleSelect('buyer')}>
                <div className="card-icon">
                  <ShoppingBag size={28} />
                </div>
                <div className="card-content">
                  <h3>Start Buying</h3>
                  <p>Find great deals from students</p>
                </div>
                <ArrowRight className="card-arrow" size={20} />
              </div>
              
              <div className="role-card seller-card" 
                style={{
                  width: '280px',
                  height: '180px',
                  margin: '0 auto'
                }} 
                onClick={() => handleRoleSelect('seller')}>
                <div className="card-icon">
                  <Store size={28} />
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
                  <User size={32} />
                </div>
                <div className="step-content">
                  <h3>Create Account</h3>
                  <p>Sign up with your university email to join your campus community and start buying or selling.</p>
                </div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-number">2</div>
                <div className="step-icon">
                  <Search size={32} />
                </div>
                <div className="step-content">
                  <h3>Browse & List</h3>
                  <p>Search for items you need or list your own products with photos and descriptions.</p>
                </div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-number">3</div>
                <div className="step-icon">
                  <Users size={32} />
                </div>
                <div className="step-content">
                  <h3>Connect & Trade</h3>
                  <p>Message sellers, negotiate prices, and arrange safe meetups on campus.</p>
                </div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-number">4</div>
                <div className="step-icon">
                  <Check size={32} />
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
              { emoji: '📚', name: 'Engineering Textbook', price: '$45', originalPrice: '$120', seller: 'Alex M.', rating: 5, location: 'North Campus', badge: 'Hot Deal' },
              { emoji: '💻', name: 'MacBook Pro 2019', price: '$899', originalPrice: '$1299', seller: 'Sarah K.', rating: 5, location: 'South Dorm', badge: 'Featured' },
              { emoji: '🪑', name: 'Study Desk & Chair', price: '$75', originalPrice: '$150', seller: 'Mike R.', rating: 4, location: 'West Campus', badge: 'New' },
              { emoji: '🎧', name: 'Noise-Canceling Headphones', price: '$120', originalPrice: '$200', seller: 'Emma L.', rating: 5, location: 'East Hall', badge: 'Popular' },
              { emoji: '📱', name: 'iPhone 12', price: '$450', originalPrice: '$699', seller: 'Josh T.', rating: 4, location: 'Central Campus', badge: 'Hot Deal' },
              { emoji: '🛏️', name: 'Twin Mattress', price: '$80', originalPrice: '$200', seller: 'Lisa W.', rating: 5, location: 'Graduate Housing', badge: 'Featured' }
            ].map((product, index) => (
              <div key={index} className="product-card">
                <div className="product-image">
                  <span className="product-emoji">{product.emoji}</span>
                  <div className={`product-badge ${product.badge.toLowerCase().replace(' ', '-')}`}>{product.badge}</div>
                  <button className="favorite-btn">
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
              <h3>10K+</h3>
              <p>Active Students</p>
              <span>Across 50+ universities</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <h3>25K+</h3>
              <p>Items Sold</p>
              <span>This semester alone</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <h3>4.8★</h3>
              <p>Average Rating</p>
              <span>From user reviews</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <h3>$2M+</h3>
              <p>Money Saved</p>
              <span>By our community</span>
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
                <p>"Saved over $300 on textbooks this semester! Super easy to use and everyone's been honest."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">JD</div>
                  <div className="author-info">
                    <div className="author-name">Jessica Davis</div>
                    <div className="author-school">Stanford University</div>
                  </div>
                </div>
              </div>
              
              <div className="testimonial-card">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>"Perfect for moving out! Sold my furniture quickly to students who actually needed them."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">RM</div>
                  <div className="author-info">
                    <div className="author-name">Ryan Mitchell</div>
                    <div className="author-school">UC Berkeley</div>
                  </div>
                </div>
              </div>
              
              <div className="testimonial-card">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>"The verification system makes me feel safe. Great way to find affordable campus items!"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">AL</div>
                  <div className="author-info">
                    <div className="author-name">Amy Liu</div>
                    <div className="author-school">MIT</div>
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
                <p>Every user is verified through their official university email address.</p>
              </div>
            </div>
            
            <div className="trust-feature">
              <div className="trust-icon">
                <Users size={24} />
              </div>
              <div className="trust-content">
                <h4>Campus Community</h4>
                <p>Trade only with verified students from your university for maximum trust.</p>
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
    </>
  );
};

export default CampusMart;