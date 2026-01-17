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
  FileText,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  Eye,
  ThumbsUp,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Building2,
} from 'lucide-react';
import { useCollege } from '../components/contexts/CollegeContext';

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
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  // College context
  const { selectedCollege, setSelectedCollege, colleges } = useCollege();

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

  // Trending products: will be populated from shared-listing IDs
  const [featuredProducts, setFeaturedProducts] = useState([
    {
      id: 1,
      title: "MacBook Pro 13\"",
      price: 45000,
      originalPrice: 55000,
      image: "https://ik.imagekit.io/zuxeumnng/campusmart/Asserts/drafter.jpg?updatedAt=1757927822487",
      discount: 18,
      rating: 4.8,
      badge: "Featured Deal",
      category: "Electronics"
    },
    {
      id: 2,
      title: "iPhone 13",
      price: 35000,
      originalPrice: 42000,
      image: "https://images.unsplash.com/photo-1592899677977-9c10b588e4e3?w=300&h=200&fit=crop",
      discount: 17,
      rating: 4.9,
      badge: "Best Seller",
      category: "Electronics"
    },
    {
      id: 3,
      title: "Sony WH-1000XM4",
      price: 12000,
      originalPrice: 15000,
      image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop",
      discount: 20,
      rating: 4.7,
      badge: "Hot Deal",
      category: "Audio"
    },
    {
      id: 4,
      title: "Gaming Chair",
      price: 8000,
      originalPrice: 10000,
      image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=300&h=200&fit=crop",
      discount: 20,
      rating: 4.6,
      badge: "Bundle Deal",
      category: "Furniture"
    },
    {
      id: 5,
      title: "Textbook Set",
      price: 2500,
      originalPrice: 3500,
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop",
      discount: 29,
      rating: 4.5,
      badge: "Study Essential",
      category: "Books"
    },
    {
      id: 6,
      title: "Study Table",
      price: 3500,
      originalPrice: 4500,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
      discount: 22,
      rating: 4.4,
      badge: "Furniture",
      category: "Furniture"
    },
    {
      id: 7,
      title: "Nintendo Switch",
      price: 18000,
      originalPrice: 25000,
      image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=200&fit=crop",
      discount: 28,
      rating: 4.8,
      badge: "Gaming",
      category: "Gaming"
    },
    {
      id: 8,
      title: "AirPods Pro",
      price: 15000,
      originalPrice: 20000,
      image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=300&h=200&fit=crop",
      discount: 25,
      rating: 4.6,
      badge: "Popular",
      category: "Audio"
    },
    {
      id: 9,
      title: "iPad Air",
      price: 25000,
      originalPrice: 30000,
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=200&fit=crop",
      discount: 17,
      rating: 4.6,
      badge: "New Arrival",
      category: "Tablets"
    },
    {
      id: 10,
      title: "Mechanical Keyboard",
      price: 3500,
      originalPrice: 5000,
      image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=200&fit=crop",
      discount: 30,
      rating: 4.7,
      badge: "Accessories",
      category: "Accessories"
    },
    {
      id: 11,
      title: "4K Monitor",
      price: 22000,
      originalPrice: 28000,
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=200&fit=crop",
      discount: 21,
      rating: 4.5,
      badge: "Display",
      category: "Monitors"
    },
    {
      id: 12,
      title: "Wireless Mouse",
      price: 1200,
      originalPrice: 2000,
      image: "https://images.unsplash.com/photo-1527864550417-7f91c4da76f3?w=300&h=200&fit=crop",
      discount: 40,
      rating: 4.4,
      badge: "Essential",
      category: "Accessories"
    }
  ]);

  // Shared listing IDs to fetch and populate Trending Products
  const trendingListingIds = [
    '68b8834cc57ad8cf93469ebd',
    '68b3603e29a70f7d84f1295b',
    '68adec04324a09560f95daad',
    '68adfb56d5619957c31accbd',
    '68acb2935fb5db6eab36f119',
    '68ac99da38db3914a70d8b3b',
    '68ac43edb1e37e08d150f377'
  ];

  // Fetch listing details for Trending Products
  useEffect(() => {
    let isCancelled = false;

    const loadTrending = async () => {
      try {
        // If no college is selected, show default products
        if (!selectedCollege) {
          const responses = await Promise.all(
            trendingListingIds.map(async (id) => {
              try {
                // Use live API so shared-listing IDs resolve to real data
                // Fetch via local proxy to avoid CORS and ensure SSR/edge compatibility
                const res = await fetch(`/api/proxy-listings/${id}`, { cache: 'no-store' });
                if (!res.ok) return null;
                const data = await res.json();
                if (!data?.success || !data?.listing) return null;
                const l = data.listing;
                const imgObj = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null;
                const imageUrl = imgObj?.thumbnailUrl || imgObj?.url || '/next.svg';
                const price = Number(l.price) || 0;
                const originalPrice = Number(l.originalPrice) || Math.round(price * 1.2);
                const discount = originalPrice > 0 ? Math.max(0, Math.min(95, Math.round(((originalPrice - price) / originalPrice) * 100))) : 0;

                return {
                  id: l.id || l._id,
                  title: l.title || 'Listing',
                  price,
                  originalPrice,
                  image: imageUrl,
                  discount,
                  rating: l.seller?.rating || 4.6,
                  badge: l.category ? 'Featured ' + l.category : 'Featured',
                  category: l.category || 'General'
                };
              } catch {
                return null;
              }
            })
          );

          const filtered = responses.filter(Boolean);
          if (!isCancelled && filtered.length > 0) {
            setFeaturedProducts(filtered);
          }
          return;
        }

        // If college is selected, fetch college-specific products
        try {
          const queryParams = new URLSearchParams();
          queryParams.append('college', selectedCollege);
          queryParams.append('limit', '12'); // Limit to 12 for trending

          const res = await fetch(`/api/listings/public?${queryParams.toString()}`, {
            cache: 'no-store'
          });

          if (!res.ok) {
            console.error('Failed to fetch college-specific listings');
            return;
          }

          const data = await res.json();
          if (data.success && data.listings && data.listings.length > 0) {
            const collegeProducts = data.listings.map(l => {
              const imgObj = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null;
              const imageUrl = imgObj?.thumbnailUrl || imgObj?.url || '/next.svg';
              const price = Number(l.price) || 0;
              const originalPrice = Number(l.originalPrice) || Math.round(price * 1.2);
              const discount = originalPrice > 0 ? Math.max(0, Math.min(95, Math.round(((originalPrice - price) / originalPrice) * 100))) : 0;

              return {
                id: l._id || l.id,
                title: l.title || 'Listing',
                price,
                originalPrice,
                image: imageUrl,
                discount,
                rating: l.seller?.rating || 4.6,
                badge: l.category ? 'Featured ' + l.category : 'Featured',
                category: l.category || 'General',
                college: l.college || selectedCollege
              };
            });

            if (!isCancelled) {
              setFeaturedProducts(collegeProducts);
            }
          }
        } catch (error) {
          console.error('Failed to load college-specific listings:', error);
        }
      } catch (e) {
        console.error('Failed to load trending listings:', e);
      }
    };

    loadTrending();
    return () => {
      isCancelled = true;
    };
  }, [selectedCollege]);

  // Hero slides data
  const heroSlides = [
    {
      id: 1,
      image: "https://ik.imagekit.io/zuxeumnng/campusmart/Asserts/Buy.png?updatedAt=1757882682300",
      buttonText: "Buy now"
    },
    {
      id: 2,
      image: "https://ik.imagekit.io/zuxeumnng/campusmart/Asserts/Assignment.png?updatedAt=1757927631064",
      buttonText: "Create Assignment"
    },
    {
      id: 3,
      image: "https://ik.imagekit.io/zuxeumnng/campusmart/Asserts/Sell.png?updatedAt=1757920843886",
      buttonText: "Sell Now"
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

  const nextHeroSlide = () => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevHeroSlide = () => {
    setCurrentHeroSlide((prev) =>
      prev === 0 ? heroSlides.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(interval);
  }, [currentSlide, isAutoPlaying]);

  // Hero slides auto-play
  useEffect(() => {
    const heroInterval = setInterval(() => {
      nextHeroSlide();
    }, 5000);

    return () => clearInterval(heroInterval);
  }, [currentHeroSlide]);

  // Trending products auto-play
  useEffect(() => {
    const trendingInterval = setInterval(() => {
      setCurrentProductSlide(prev => 
        prev < Math.ceil(featuredProducts.length / 4) - 1 ? prev + 1 : 0
      );
    }, 6000);

    return () => clearInterval(trendingInterval);
  }, [currentProductSlide]);

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

  // Sticky header functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setIsSticky(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Counter animation for stats
  useEffect(() => {
    const animateCounters = () => {
      const counters = document.querySelectorAll('.stat-number');
      
      counters.forEach(counter => {
        // Skip if already animated
        if (counter.classList.contains('animated')) return;
        counter.classList.add('animated');
        
        const target = parseFloat(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); 
        let current = 0;
        
        // Set initial value to 0 for animation
        counter.textContent = '0';
        
        const updateCounter = () => {
          if (current < target) {
            current += increment;
            if (current > target) current = target;
            
            if (target === 4.6) {
              counter.textContent = current.toFixed(1);
            } else if (target >= 1000) {
              counter.textContent = Math.floor(current).toLocaleString();
            } else {
              counter.textContent = Math.floor(current);
            }
            
            requestAnimationFrame(updateCounter);
          }
        };
        
        updateCounter();
      });
    };

    // Simple timeout to ensure animation runs
    const timer = setTimeout(() => {
      animateCounters();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
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
      <header className={`header ${isSticky ? 'sticky' : ''}`}>
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
                    <Link href="/buyer-dashboard" className="nav-link">
                      <ShoppingBag size={18} />
                      <span>Buy</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/buyer-dashboard/assignments" className="nav-link">
                      <FileText size={18} />
                      <span>Assignment</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/seller-dashboard" className="nav-link">
                      <Store size={18} />
                      <span>Sell</span>
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {/* Right Actions */}
            <div className="nav-actions">
              {/* Selected College Display */}
              {selectedCollege && (
                <div className="college-display">
                  <Building2 size={16} />
                  <span className="college-name">{selectedCollege}</span>
                </div>
              )}

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
                <li><Link href="/buyer-dashboard" className="mobile-nav-link"><ShoppingBag size={20} /><span>Buy</span></Link></li>
                <li><Link href="/assignments" className="mobile-nav-link"><FileText size={20} /><span>Assignment</span></Link></li>
                <li><Link href="/seller-dashboard" className="mobile-nav-link"><Store size={20} /><span>Sell</span></Link></li>
                <li><Link href="/about" className="mobile-nav-link"><Info size={20} /><span>About</span></Link></li>
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

      {/* Sliding Hero Section */}
      <section className="sliding-hero-section">
        <div className="hero-container">
          <div className="hero-layout">
            {/* Main Hero Carousel */}
            <div className="hero-main-carousel">
              <div className="hero-carousel-container">
                <button 
                  className="hero-nav-btn prev-btn"
                  onClick={prevHeroSlide}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <div className="hero-slides-container">
                  <div 
                    className="hero-slides"
                    style={{
                      transform: `translateX(-${currentHeroSlide * 100}%)`,
                      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {heroSlides.map((slide) => (
                      <div key={slide.id} className="hero-slide">
                        <div className="hero-slide-content">
                          <div className="hero-slide-image">
                            <img src={slide.image} alt={`Slide ${slide.id}`} />
                            <div className="hero-slide-overlay"></div>
                          </div>
                          <div className="hero-slide-button-container">
                            <button className="hero-cta-btn" onClick={() => handleRoleSelect('buyer')}>
                              {slide.buttonText}
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  className="hero-nav-btn next-btn"
                  onClick={nextHeroSlide}
                  aria-label="Next slide"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
              
              {/* Hero Indicators */}
              <div className="hero-indicators">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`hero-indicator ${index === currentHeroSlide ? 'active' : ''}`}
                    onClick={() => setCurrentHeroSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side Deals Box */}
            <div className="hero-deals-box">
              <div className="deals-box-content">
                <div className="deals-header">
                  <h3>Grab New Deals</h3>
                  <div className="deals-badge">
                    <Zap size={16} />
                    <span>Hot</span>
                  </div>
                </div>
                <div className="deals-list">
                  <div className="deal-item">
                    <div className="deal-icon">
                      <FileText size={20} />
                    </div>
                    <div className="deal-info">
                      <span className="deal-title">Practical Files</span>
                      <span className="deal-discount">Up to 50% OFF</span>
                    </div>
                  </div>
                  <div className="deal-item">
                    <div className="deal-icon">
                      <Award size={20} />
                    </div>
                    <div className="deal-info">
                      <span className="deal-title">Akash PYQ</span>
                      <span className="deal-discount">Up to 70% OFF</span>
                    </div>
                  </div>
                  <div className="deal-item">
                    <div className="deal-icon">
                      <Store size={20} />
                    </div>
                    <div className="deal-info">
                      <span className="deal-title">Drafter</span>
                      <span className="deal-discount">Up to 40% OFF</span>
                    </div>
                  </div>
                </div>
                <button className="deals-cta-btn" onClick={() => handleRoleSelect('buyer')}>
                  <ShoppingBag size={16} />
                  View All Deals
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products Sliding Section */}
      <section className="trending-products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {selectedCollege ? `Trending Products at ${selectedCollege}` : 'Trending Products'}
            </h2>
            <p className="section-subtitle">
              {selectedCollege 
                ? `Discover the most popular items from students at ${selectedCollege}`
                : 'Discover the most popular items from students in your campus'
              }
            </p>
            {selectedCollege && (
              <div className="college-badge">
                <Building2 size={16} />
                <span>{selectedCollege}</span>
              </div>
            )}
          </div>
          
          <div className="trending-carousel-container">
            <button 
              className="trending-nav-btn prev-btn"
              onClick={() => setCurrentProductSlide(prev => prev > 0 ? prev - 1 : Math.ceil(featuredProducts.length / 4) - 1)}
              disabled={currentProductSlide === 0}
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="trending-carousel">
              <div 
                className="trending-slides"
                style={{
                  transform: `translateX(-${currentProductSlide * (100 / Math.ceil(featuredProducts.length / 4))}%)`,
                  transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {Array.from({ length: Math.ceil(featuredProducts.length / 4) }).map((_, slideIndex) => (
                  <div key={slideIndex} className="trending-slide">
                    <div className="trending-products-grid">
                      {featuredProducts.slice(slideIndex * 4, slideIndex * 4 + 4).map((product) => (
                        <div key={product.id} className="trending-product-card">
                          <div className="product-image-container">
                            <img src={product.image} alt={product.title} className="product-image" />
                            <div className="product-badge">
                              {product.badge}
                            </div>
                            <div className="product-discount-badge">
                              -{product.discount}%
                            </div>
                            <div className="product-overlay">
                              <button className="quick-view-btn" onClick={() => handleRoleSelect('buyer')}>
                                <Eye size={16} />
                                Quick View
                              </button>
                            </div>
                          </div>
                          <div className="product-info">
                            <h3 className="product-title">{product.title}</h3>
                            <div className="product-category">{product.category}</div>
                            <div className="product-rating">
                              <Star className="star-icon" size={16} />
                              <span>{product.rating}</span>
                            </div>
                            <div className="product-pricing">
                              <span className="product-price">₹{product.price.toLocaleString()}</span>
                              <span className="product-original-price">₹{product.originalPrice.toLocaleString()}</span>
                            </div>
                            <button className="product-buy-btn" onClick={() => handleRoleSelect('buyer')}>
                              <ShoppingBag size={16} />
                              Buy Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              className="trending-nav-btn next-btn"
              onClick={() => setCurrentProductSlide(prev => prev < Math.ceil(featuredProducts.length / 4) - 1 ? prev + 1 : 0)}
              disabled={currentProductSlide >= Math.ceil(featuredProducts.length / 4) - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className="trending-indicators">
            {Array.from({ length: Math.ceil(featuredProducts.length / 4) }).map((_, index) => (
              <button
                key={index}
                className={`trending-indicator ${index === currentProductSlide ? 'active' : ''}`}
                onClick={() => setCurrentProductSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          <div className="section-cta">
            <button className="btn btn-outline" onClick={() => handleRoleSelect('buyer')}>
              <Eye size={20} />
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* Three Service Models Section */}
      <section className="services-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">Choose the service that fits your needs</p>
          </div>

          <div className="services-grid">
            <div className="service-card" onClick={() => handleRoleSelect('buyer')}>
              <div className="service-icon">
                <ShoppingBag size={48} />
              </div>
              <h3 className="service-title">Buy</h3>
              <p className="service-description">
                Discover amazing deals on textbooks, electronics, furniture, and more from verified students in your campus.
              </p>
              <div className="service-features">
                <div className="feature-item">
                  <Check size={16} />
                  <span>Verified sellers</span>
                </div>
                <div className="feature-item">
                  <Check size={16} />
                  <span>Secure payments</span>
                </div>
                <div className="feature-item">
                  <Check size={16} />
                  <span>Campus meetups</span>
                </div>
              </div>
              <button className="btn btn-service">
                Learn More
                <ArrowRight size={16} />
              </button>
              </div>

            <div className="service-card" onClick={() => handleRoleSelect('seller')}>
              <div className="service-icon">
                <Store size={48} />
                </div>
              <h3 className="service-title">Sell</h3>
              <p className="service-description">
                Turn your unused items into cash. List your products and connect with buyers in your campus community.
              </p>
              <div className="service-features">
                <div className="feature-item">
                  <Check size={16} />
                  <span>Easy listing</span>
                </div>
                <div className="feature-item">
                  <Check size={16} />
                  <span>Instant messaging</span>
              </div>
                <div className="feature-item">
                  <Check size={16} />
                  <span>No fees</span>
                </div>
              </div>
              <button className="btn btn-service">
                Learn More
                <ArrowRight size={16} />
              </button>
              </div>

            <div className="service-card" onClick={() => handleRoleSelect('buyer')}>
              <div className="service-icon">
                <FileText size={48} />
              </div>
              <h3 className="service-title">Assignment</h3>
              <p className="service-description">
                Get help with your assignments from top-performing students. Quality work at affordable prices.
              </p>
              <div className="service-features">
                <div className="feature-item">
                  <Check size={16} />
                  <span>Expert tutors</span>
                </div>
                <div className="feature-item">
                  <Check size={16} />
                  <span>On-time delivery</span>
                </div>
                <div className="feature-item">
                  <Check size={16} />
                  <span>Plagiarism-free</span>
              </div>
            </div>
              <button className="btn btn-service">
                Learn More
                <ArrowRight size={16} />
            </button>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Trust Section */}
      <section className="professional-trust-section">
        <div className="container">
          <div className="trust-header">
            <h2 className="trust-title">
              Trusted by Students
              <span className="gradient-text"> Nationwide</span>
            </h2>
            <div className="trust-underline"></div>
            <p className="trust-subtitle">
              Join the largest student marketplace community and be part of something bigger
            </p>
          </div>

          <div className="professional-stats-grid">
            <div className="professional-stat-card">
              <div className="stat-icon-wrapper">
                <div className="stat-icon">
                  <Users size={40} />
                </div>
              </div>
              <div className="stat-number" data-target="1600">1600</div>
              <div className="stat-label">Registered Students</div>
              <div className="stat-subtitle">Across 20+ colleges</div>
              <div className="stat-trend">
                <TrendingUp size={14} />
                <span>+25% this month</span>
              </div>
            </div>

            <div className="professional-stat-card">
              <div className="stat-icon-wrapper">
                <div className="stat-icon">
                  <ShoppingBag size={40} />
                </div>
              </div>
              <div className="stat-number" data-target="150">150</div>
              <div className="stat-label">Items Sold</div>
              <div className="stat-subtitle">This semester alone</div>
              <div className="stat-trend">
                <TrendingUp size={14} />
                <span>+40% growth</span>
              </div>
            </div>

            <div className="professional-stat-card">
              <div className="stat-icon-wrapper">
                <div className="stat-icon">
                  <Star size={40} />
                </div>
              </div>
              <div className="stat-number" data-target="4.6">4.6</div>
              <div className="stat-label">Average Rating</div>
              <div className="stat-subtitle">From user reviews</div>
              <div className="stat-trend special">
                <Award size={14} />
                <span>Top rated platform</span>
              </div>
            </div>

            <div className="professional-stat-card">
              <div className="stat-icon-wrapper">
                <div className="stat-icon">
                  <DollarSign size={40} />
                </div>
              </div>
              <div className="stat-number" data-target="18000">18,000</div>
              <div className="stat-label">Transactions</div>
              <div className="stat-subtitle">By users</div>
              <div className="stat-trend">
                <TrendingUp size={14} />
                <span>₹18,000+ value</span>
              </div>
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

      {/* ZeberAI Style Footer - 4 Column Layout */}
      <footer className="zeberai-footer">
        <div className="container">
          <div className="footer-content-zeberai">
            {/* Column 1: Brand */}
            <div className="footer-column-zeberai footer-brand-zeberai">
              <div className="footer-logo-zeberai">
                <span className="logo-ai">CampusMart</span>
              </div>
              <p className="footer-description-zeberai">
                Your trusted campus marketplace for buying, selling, and getting assignment help from verified students.
              </p>
            </div>

            {/* Column 2: Services */}
            <div className="footer-column-zeberai">
              <h4 className="footer-title-zeberai">Services</h4>
              <ul className="footer-links-zeberai">
                <li><Link href="/buyer-dashboard">Buy Items</Link></li>
                <li><Link href="/seller-dashboard">Sell Items</Link></li>
                <li><Link href="/assignments">Assignment Help</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="footer-column-zeberai">
              <h4 className="footer-title-zeberai">Company</h4>
              <ul className="footer-links-zeberai">
                <li><Link href="/about">About Us</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div className="footer-column-zeberai">
              <h4 className="footer-title-zeberai">Contact</h4>
              <div className="contact-info-zeberai">
                <div className="contact-item-zeberai">
                  <Mail size={16} />
                  <span>campusmart.store.mail@gmail.com</span>
                </div>
                <div className="contact-item-zeberai">
                  <Phone size={16} />
                  <span>+91 87504 71736</span>
                </div>
                <div className="contact-item-zeberai">
                  <MapPin size={16} />
                  <span>Available in MAIT only</span>
                </div>
              </div>
              <div className="social-media-zeberai">
                <a href="#" className="social-icon-zeberai" aria-label="X">
                  <X size={18} />
                </a>
                <a href="#" className="social-icon-zeberai" aria-label="LinkedIn">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="social-icon-zeberai" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
                <a href="#" className="social-icon-zeberai" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-separator-zeberai"></div>
          
          <div className="footer-bottom-zeberai">
            <div className="footer-bottom-left-zeberai">
              <p className="copyright-zeberai">&copy; 2025 CampusMart. All rights reserved. | Privacy Policy | Terms of Service</p>
            </div>
            <div className="footer-bottom-right-zeberai">
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default CampusMart;