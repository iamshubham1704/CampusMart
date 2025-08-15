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
  MapPin
} from 'lucide-react';

const CampusMart = () => {
  const [mounted, setMounted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const router = useRouter();

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
    // Load theme from in-memory storage (no localStorage in Claude artifacts)
    const savedTheme = typeof window !== 'undefined' ? 
      (document.documentElement.getAttribute('data-theme') === 'dark') : true;
    setIsDarkTheme(savedTheme);
  }, []);

  // Handle mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (mounted) {
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = isDarkTheme ? 'dark-theme' : 'light-theme';
      document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
    }
  }, [isDarkTheme, mounted]);

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
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
    <div className={`homepage ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      {/* Theme Toggle Button */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
        type="button"
      >
        {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
        <span>{isDarkTheme ? 'Light' : 'Dark'}</span>
      </button>

      {/* Header */}
      <header className="header">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>CampusMart</h1>
          </div>
          <ul className="nav-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#buyer-policy">Buyer Policy</a></li>
            <li><a href="#seller-policy">Seller Policy</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
          <div className="nav-actions">
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search products..." className="search-input" />
            </div>
            <button className="login-btn">Login</button>
            <button className="signup-btn">Sign Up</button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div 
          className="hero-background"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(64, 224, 208, 0.15) 0%, transparent 50%)`
          }}
        />
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">The Student Marketplace</h1>
            <p className="hero-subtitle">
              Buy and sell within your campus effortlessly. Connect with fellow
              students, find great deals, and declutter your dorm.
            </p>
            
            {/* Role Selection Cards */}
            <div className="hero-buttons">
              <div
                onClick={() => handleRoleSelect('buyer')}
                className="btn btn-buyer role-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRoleSelect('buyer');
                  }
                }}
              >
                <div className="card-glow"></div>
                <div className="card-content">
                  <div className="btn-icon">
                    <ShoppingBag size={24} />
                  </div>
                  <span className="btn-text">I'm a Buyer</span>
                  <ArrowRight size={18} className="btn-arrow" />
                </div>
              </div>
              
              <div
                onClick={() => handleRoleSelect('seller')}
                className="btn btn-seller role-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRoleSelect('seller');
                  }
                }}
              >
                <div className="card-glow"></div>
                <div className="card-content">
                  <div className="btn-icon">
                    <Store size={24} />
                  </div>
                  <span className="btn-text">I'm a Seller</span>
                  <ArrowRight size={18} className="btn-arrow" />
                </div>
              </div>
            </div>
            
            <div className="hero-features">
              <div className="feature-item">
                <Check size={16} className="feature-icon" />
                <span>Verified Students Only</span>
              </div>
              <div className="feature-item">
                <Shield size={16} className="feature-icon" />
                <span>Safe Campus Meetings</span>
              </div>
              <div className="feature-item">
                <Zap size={16} className="feature-icon" />
                <span>No Platform Fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="roadmap-section" id="how-it-works">
        <div className="container">
          <h2 className="section-title">ROADMAP</h2>
          <p className="section-subtitle">
            Your journey to seamless campus trading starts here. Follow our cosmic
            roadmap to success.
          </p>
          
          <div className="roadmap-container">
            <div className="roadmap-path">
              <div className="roadmap-step">
                <div className="step-icon">
                  <Users size={32} />
                </div>
                <div className="step-content">
                  <h3>Sign Up with College Email</h3>
                  <p>Verify your student status with your official college email address for secure access to your campus marketplace.</p>
                </div>
                <div className="step-number">Step 1</div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-icon">
                  <Search size={32} />
                </div>
                <div className="step-content">
                  <h3>Browse or List</h3>
                  <p>Find exactly what you need, or list what you want to sell. From textbooks to tech, we've got it.</p>
                </div>
                <div className="step-number">Step 2</div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-icon">
                  <Zap size={32} />
                </div>
                <div className="step-content">
                  <h3>Chat & Negotiate</h3>
                  <p>Connect directly with buyers/sellers through our secure messaging system. Negotiate prices and arrange meetups.</p>
                </div>
                <div className="step-number">Step 3</div>
              </div>
              
              <div className="roadmap-step">
                <div className="step-icon">
                  <Shield size={32} />
                </div>
                <div className="step-content">
                  <h3>Meet Safely On Campus</h3>
                  <p>Complete your transaction in person at safe, public locations on campus. Cash or digital payments accepted.</p>
                </div>
                <div className="step-number">Step 4</div>
              </div>
            </div>
          </div>
          
          <button className="btn btn-primary roadmap-cta">Begin Your Journey</button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <p className="section-subtitle">
            Discover amazing deals from fellow students. These hot items won't last long!
          </p>
          
          <div className="products-grid">
            {[
              {
                title: "MacBook Air M2 - Like New",
                price: "$899",
                originalPrice: "$1099",
                seller: "Sarah M.",
                rating: 5,
                location: "East Campus",
                badge: "Electronics",
                image: "💻"
              },
              {
                title: "Calculus Textbook Bundle",
                price: "$45",
                originalPrice: "$180",
                seller: "Mike Chen",
                rating: 5,
                location: "Science Library",
                badge: "Textbooks",
                image: "📚"
              },
              {
                title: "Mini Fridge - Perfect for Dorms",
                price: "$85",
                originalPrice: "$150",
                seller: "Emma K.",
                rating: 5,
                location: "West Residence",
                badge: "Furniture",
                image: "❄️"
              },
              {
                title: "Gaming Chair - Ergonomic",
                price: "$120",
                originalPrice: "$200",
                seller: "Alex P.",
                rating: 5,
                location: "Tech Campus",
                badge: "Furniture",
                image: "🪑"
              }
            ].map((product, index) => (
              <div key={index} className="product-card">
                <div className="product-image">
                  <span className="product-emoji">{product.image}</span>
                  <span className="product-badge">{product.badge}</span>
                </div>
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <div className="product-price">
                    <span className="current-price">{product.price}</span>
                    <span className="original-price">{product.originalPrice}</span>
                  </div>
                  <div className="seller-info">
                    <span className="seller-name">{product.seller}</span>
                    <div className="rating">
                      {Array.from({ length: product.rating }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <p className="product-location">
                    <MapPin size={14} />
                    {product.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section" id="about">
        <div className="container">
          <h2 className="section-title">Trusted by Students Everywhere</h2>
          <p className="section-subtitle">
            Join thousands of students who trust CampusMart for safe and easy campus trading.
          </p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h3>10,000+</h3>
              <p>Active Students</p>
              <span>Verified students using our platform on their campuses</span>
            </div>
            <div className="stat-card">
              <h3>25,000+</h3>
              <p>Successful Trades</p>
              <span>Completed transactions on our platform monthly</span>
            </div>
            <div className="stat-card">
              <h3>99.9%</h3>
              <p>Safety Rate</p>
              <span>Of all campus meetings result in safe transactions</span>
            </div>
            <div className="stat-card">
              <h3>&lt; 2 hrs</h3>
              <p>Average Response</p>
              <span>Quick replies from fellow students</span>
            </div>
          </div>
          
          <div className="testimonials-section">
            <h3>What Students Are Saying</h3>
            <div className="testimonials-grid">
              {[
                {
                  text: "Found my dream laptop at half the price! The seller was super responsive and we met safely on campus. Couldn't be happier!",
                  author: "Jessica Chen",
                  school: "Stanford University",
                  initials: "JC"
                },
                {
                  text: "Sold my textbooks in just 2 days. Way better than those other buyback programs that give you pennies.",
                  author: "Marcus Johnson",
                  school: "UCLA",
                  initials: "MJ"
                },
                {
                  text: "The verification process made me feel so much safer. Knowing everyone is a real student gives me peace of mind.",
                  author: "Priya Patel",
                  school: "MIT",
                  initials: "PP"
                }
              ].map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p>"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{testimonial.initials}</div>
                    <div className="author-info">
                      <span className="author-name">{testimonial.author}</span>
                      <span className="author-school">{testimonial.school}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="cta-section">
            <h3>Start your campus trading journey today!</h3>
            <p>Join thousands of students who are already buying and selling safely on their campus. No fees, no hassle. Just great deals with fellow students.</p>
            <div className="cta-buttons">
              <button 
                className="btn btn-buyer"
                onClick={() => handleRoleSelect('buyer')}
              >
                <Users size={20} />
                Join as Buyer
              </button>
              <button 
                className="btn btn-seller"
                onClick={() => handleRoleSelect('seller')}
              >
                <Store size={20} />
                Join as Seller
              </button>
            </div>
          </div>
          
          <div className="trust-features">
            <div className="trust-feature">
              <div className="trust-icon">
                <Check size={24} />
              </div>
              <div className="trust-content">
                <h4>Student Verified</h4>
                <p>Only verified students can join your campus marketplace</p>
              </div>
            </div>
            <div className="trust-feature">
              <div className="trust-icon">
                <Zap size={24} />
              </div>
              <div className="trust-content">
                <h4>No Platform Fees</h4>
                <p>Keep 100% of your earnings - we don't charge any fees</p>
              </div>
            </div>
            <div className="trust-feature">
              <div className="trust-icon">
                <Shield size={24} />
              </div>
              <div className="trust-content">
                <h4>Safe Meetings</h4>
                <p>Meet safely on campus in public, well-lit areas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>CampusMart</h3>
              <p>The trusted student marketplace connecting campus communities. Buy and sell safely with verified students at your university.</p>
              <div className="newsletter">
                <h4>Stay Updated</h4>
                <div className="newsletter-form">
                  <input type="email" placeholder="Enter your email" />
                  <button className="subscribe-btn">Subscribe</button>
                </div>
                <p className="newsletter-text">Get notified about new features and campus deals.</p>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-section" id="buyer-policy">
              <h4>Policies</h4>
              <ul>
                <li><a href="#buyer-policy">Buyer Policy</a></li>
                <li><a href="#seller-policy">Seller Policy</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#faq">FAQs</a></li>
                <li><a href="#report">Report a Problem</a></li>
                <li><a href="#safety">Safety Tips</a></li>
              </ul>
              <div className="contact-info">
                <h4>Contact Us</h4>
                <p>📧 hello@campusmart.com</p>
                <p>📞 1-800-CAMPUS</p>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 CampusMart. All rights reserved.</p>
            <div className="social-links">
              <span>Follow us:</span>
              <a href="#facebook" aria-label="Facebook">📘</a>
              <a href="#twitter" aria-label="Twitter">🐦</a>
              <a href="#instagram" aria-label="Instagram">📸</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CampusMart;