'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Heart,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

const CampusMart = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonialImages = [
    {
      id: 1,
      imageUrl: "https://ik.imagekit.io/zuxeumnng/Testimonials/ananya%20goyal.jpg?updatedAt=1755797239781"
    },
    {
      id: 2,
      imageUrl: "https://ik.imagekit.io/zuxeumnng/Testimonials/test2.jpg"
    },
    {
      id: 3,
      imageUrl: "https://ik.imagekit.io/zuxeumnng/Testimonials/test3.jpg"
    },
    {
      id: 4,
      imageUrl: "https://ik.imagekit.io/zuxeumnng/Testimonials/test4.jpg"
    },
    {
      id: 5,
      imageUrl: "https://ik.imagekit.io/zuxeumnng/Testimonials/test5.jpg"
    },
    {
      id: 6,
      imageUrl: "https://ik.imagekit.io/zuxeumnng/Testimonials/test6.jpg"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(testimonialImages.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? Math.ceil(testimonialImages.length / 3) - 1 : prev - 1
    );
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(interval);
  }, [currentSlide, isAutoPlaying]);

  const totalSlides = Math.ceil(testimonialImages.length / 3);

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
                  <img src="/logo.png" alt="CampusMart" />
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
                    <Link href="/" className="nav-link active">
                      <Home size={18} />
                      <span>Home</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/policy" className="nav-link">
                      <ShoppingBag size={18} />
                      <span>Policy</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/about" className="nav-link">
                      <Info size={18} />
                      <span>About</span>
                    </Link>
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
              {/* {windowSize.width > 480 && (
                <button className="notification-btn" title="Notifications" aria-label="Notifications">
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </button>
              )} */}

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
                <li><Link href="/" className="mobile-nav-link active"><Home size={20} /><span>Home</span></Link></li>
                <li><Link href="/policy" className="mobile-nav-link"><ShoppingBag size={20} /><span>Policy</span></Link></li>
                <li><Link href="/about" className="mobile-nav-link"><Info size={20} /><span>About</span></Link></li>
                <li><a href="#" className="mobile-nav-link"><Users size={20} /><span>Community</span></a></li>
              </ul>
              <div className="mobile-actions">
                {/* <button className="mobile-notification-btn">
                  <Bell size={20} />
                  <span>Notifications</span>
                  <span className="notification-badge">3</span>
                </button> */}
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
          </div>

          <div className="testimonials-container">
            <div className="testimonials-header">
              <MessageCircle className="header-icon" size={40} />
              <h3>Real Student Conversations</h3>
              <p className="testimonials-subtitle">Authentic WhatsApp chats showing genuine student experiences on CampusMart</p>
            </div>

            <div
              className="testimonials-slideshow"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <button
                className="nav-button prev-button"
                onClick={prevSlide}
                aria-label="Previous testimonials"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="testimonials-track">
                <div
                  className="testimonials-slides"
                  style={{
                    transform: `translateX(-${currentSlide * 100}%)`,
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                    <div key={slideIndex} className="testimonials-slide">
                      <div className="testimonials-grid">
                        {testimonialImages.slice(slideIndex * 3, slideIndex * 3 + 3).map((testimonial) => (
                          <div key={testimonial.id} className="testimonial-card">
                            <div className="image-container">
                        <img 
                          src={testimonial.imageUrl} 
                          alt={testimonial.title}
                          className="testimonial-screenshot"
                        />
                            </div>
                            <div className="testimonial-overlay">
                              <div className="testimonial-type">{testimonial.type}</div>
                              <h4>{testimonial.title}</h4>
                              <p>{testimonial.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="nav-button next-button"
                onClick={nextSlide}
                aria-label="Next testimonials"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="slideshow-indicators">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
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
    </>
  );
};

export default CampusMart;