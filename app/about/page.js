'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Users,
  Shield,
  Zap,
  ShoppingBag,
  Star,
  Award,
  Globe,
  ArrowRight,
  Heart,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

const CampusMartAbout = () => {
  const [mounted, setMounted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
    
    // Theme initialization
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') === 'dark';
      setIsDarkTheme(savedTheme);
    }
  }, []);

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

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="about-page">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <nav className="navbar">
            {/* Brand Logo */}
            <div className="nav-brand">
              <div className="brand-logo">
                <div className="logo-container">
                  <img src="/logo.png" alt="CampusMart" />
                </div>
                <div className="brand-text">
                  <h1 className="brand-name">CampusMart</h1>
                  <span className="brand-tagline">Student Marketplace</span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="nav-center">
              <ul className="nav-menu">
                <li className="nav-item">
                  <Link href="/" className="nav-link">
                    <Home size={18} />
                    <span>Home</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/about" className="nav-link active">
                    <Users size={18} />
                    <span>About</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/policy" className="nav-link">
                    <Shield size={18} />
                    <span>Policy</span>
                  </Link>
                </li>
                
              </ul>
            </div>

            {/* Right Actions */}
            <div className="nav-actions">
              <button 
                className="theme-toggle" 
                onClick={toggleTheme} 
                title={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
              >
                <div className="theme-icon">
                  {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                </div>
              </button>

              <button 
                className="mobile-menu-btn" 
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <div className="mobile-menu-content">
              <ul className="mobile-nav-menu">
                <li><Link href="/" className="mobile-nav-link"><Home size={20} /><span>Home</span></Link></li>
                <li><Link href="/about" className="mobile-nav-link active"><Users size={20} /><span>About</span></Link></li>
                <li><Link href="/policy" className="mobile-nav-link"><Shield size={20} /><span>Policy</span></Link></li>
                
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        

        {/* Journey Section */}
        <section className="journey-section">
          <div className="container">
            <div className="journey-header">
              
              <h2 className="journey-title">Our Journey</h2>
            </div>
            
            <div className="journey-content">
              <h3 className="journey-main-title">Connecting Students Through Smart Commerce</h3>
              <p className="journey-description">
                At CampusMart, we're on a mission to revolutionize how students buy and sell on campus, 
                making it easier and safer for the student community to trade items they need. Our 
                team combines technology expertise with deep understanding of student needs to deliver 
                a platform that truly serves the campus community.
              </p>
              
              
            </div>
            
            <div className="brand-highlight">
              <span className="brand-name-large">CampusMart</span>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="timeline-section">
          <div className="container">
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-year">2025: The Beginning</div>
                <div className="timeline-content">
                  <p>Founded by a team of college students and tech enthusiasts, CampusMart was born 
                  from the vision to create a trusted marketplace exclusively for the student community.</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-year">2025: First Launch</div>
                <div className="timeline-content">
                  <p>Our beta platform launched at MAIT, connecting the first batch of student buyers 
                  and sellers, creating a safer alternative to random hostel notice board postings.</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-year">2025: Campus Expansion</div>
                <div className="timeline-content">
                  <p>We expanded our verification system and user base, introducing features like 
                  campus-specific listings and secure messaging to build trust within student communities.</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-year">2025: Today</div>
                <div className="timeline-content">
                  <p>Now serving multiple colleges with hundreds of registered students, we continue 
                  to innovate and expand our reach, helping students save money and reduce waste 
                  through smart sharing.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="mission-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Mission & Vision</h2>
              
            </div>
            
            <div className="mission-grid">
              <div className="mission-card">
                <h3 className="mission-title">Our Mission</h3>
                <p className="mission-text">
                  To create a trusted, campus-exclusive marketplace that enables students to buy, 
                  sell, and trade items safely within their college community, promoting sustainability 
                  and affordability in student life.
                </p>
                <div className="mission-quote">
                  "We believe commerce should serve the student community."
                </div>
              </div>
              
              <div className="mission-card">
                <h3 className="mission-title">Our Vision</h3>
                <p className="mission-text">
                  To become the go-to platform for student commerce across all colleges in India, 
                  creating a sustainable ecosystem where students can access affordable goods 
                  while building meaningful connections within their campus community.
                </p>
                <div className="mission-quote">
                  "A campus where every student has access to what they need."
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="values-section">
          <div className="container">
            <h2 className="values-title">Our Core Values</h2>
            <p className="values-subtitle">The principles that guide our decisions and define our culture</p>
            
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">
                  <Zap size={32} />
                </div>
                <h3 className="value-title">Innovation</h3>
                <p className="value-description">
                  We constantly explore new ways to improve the student marketplace experience 
                  through technology and user-centered design.
                </p>
              </div>
              
              <div className="value-card">
                <div className="value-icon">
                  <Users size={32} />
                </div>
                <h3 className="value-title">Community</h3>
                <p className="value-description">
                  We believe in the power of student communities, fostering connections and 
                  mutual support among campus peers.
                </p>
              </div>
              
              <div className="value-card">
                <div className="value-icon">
                  <TrendingUp size={32} />
                </div>
                <h3 className="value-title">Student-Focused</h3>
                <p className="value-description">
                  We measure our success by how well we serve student needs, creating tangible 
                  value for campus life and academic success.
                </p>
              </div>
              
              <div className="value-card">
                <div className="value-icon">
                  <Shield size={32} />
                </div>
                <h3 className="value-title">Trust & Safety</h3>
                <p className="value-description">
                  We uphold the highest standards of safety and verification, ensuring every 
                  transaction happens within a trusted campus environment.
                </p>
              </div>
              
              <div className="value-card">
                <div className="value-icon">
                  <BookOpen size={32} />
                </div>
                <h3 className="value-title">Continuous Learning</h3>
                <p className="value-description">
                  We embrace feedback from our student community to continuously improve 
                  and adapt to changing campus needs.
                </p>
              </div>
              
              <div className="value-card">
                <div className="value-icon">
                  <Heart size={32} />
                </div>
                <h3 className="value-title">Campus-Centric</h3>
                <p className="value-description">
                  We place campus communities at the center of everything we do, building 
                  features that strengthen student connections and experiences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <div className="container">
            <h2 className="team-title">Meet Our Team</h2>
            <p className="team-subtitle">The dedicated individuals behind CampusMart's success</p>
            
            <div className="team-grid">
              <div className="team-card">
                <div className="team-avatar">
                  <span>KV</span>
                </div>
                <div className="team-info">
                  <h3 className="team-name">Shubham Solanki</h3>
                  
                  <p className="team-description">
                    Computer Science student and entrepreneur, passionate about building technology 
                    solutions that serve the student community. Experienced in platform development 
                    and community building.
                  </p>
                </div>
              </div>
              
              <div className="team-card">
                <div className="team-avatar">
                  <span>SS</span>
                </div>
                <div className="team-info">
                  <h3 className="team-name">Krish Vishwakarma</h3>
                  
                  <p className="team-description">
                    Engineering student and tech enthusiast, expert in building scalable platforms 
                    and secure transaction systems. Focused on creating seamless user experiences 
                    for student commerce.
                  </p>
                </div>
              </div>
              
              <div className="team-card">
                <div className="team-avatar">
                  <span>SR</span>
                </div>
                <div className="team-info">
                  <h3 className="team-name">Shubham Raj</h3>
                  
                  <p className="team-description">
                    Student leader and operations specialist, leading campus outreach and community 
                    engagement initiatives. Focused on building trust and expanding CampusMart's 
                    presence across college campuses.
                  </p>
                </div>
              </div>
            </div>
            
           
          </div>
        </section>

        {/* Milestones Section */}
        <section className="milestones-section">
          <div className="container">
            <h2 className="milestones-title">Our Milestones</h2>
            <p className="milestones-subtitle">Key achievements that mark our journey of growth and impact</p>
            
            <div className="milestones-grid">
              <div className="milestone-card">
                <div className="milestone-number">500+</div>
                <div className="milestone-label">Students Registered</div>
              </div>
              
              <div className="milestone-card">
                <div className="milestone-number">₹10,000+</div>
                <div className="milestone-label">Total Transactions</div>
              </div>
              
              <div className="milestone-card">
                <div className="milestone-number">50+</div>
                <div className="milestone-label">Items Traded</div>
              </div>
              
              <div className="milestone-card">
                <div className="milestone-number">5+</div>
                <div className="milestone-label">Partner Colleges</div>
              </div>
            </div>
          </div>
        </section>

        {/* Approach Section */}
        <section className="approach-section">
          <div className="container">
            <h2 className="approach-title">Our Unique Approach</h2>
            <p className="approach-subtitle">What sets CampusMart apart in the student marketplace</p>
            
            <div className="approach-grid">
              <div className="approach-card">
                <div className="approach-icon">
                  <Shield size={48} />
                </div>
                <h3 className="approach-card-title">Campus-Only Verification</h3>
                <p className="approach-description">
                  Unlike general marketplaces, we verify that every user is a legitimate student 
                  from their respective college, creating a trusted campus-exclusive environment.
                </p>
                <ul className="approach-features">
                  <li><CheckCircle size={16} />Email verification</li>
                  <li><CheckCircle size={16} />Student verification</li>
                  <li><CheckCircle size={16} />Campus-specific listings</li>
                </ul>
              </div>
              
              <div className="approach-card">
                <div className="approach-icon">
                  <Users size={48} />
                </div>
                <h3 className="approach-card-title">Community-Centered Design</h3>
                <p className="approach-description">
                  We design our platform around the unique needs of student life, from textbook 
                  exchanges to dorm essentials, fostering genuine campus connections.
                </p>
                <ul className="approach-features">
                  <li><CheckCircle size={16} />Student-friendly interface</li>
                  <li><CheckCircle size={16} />Campus pickup locations</li>
                  <li><CheckCircle size={16} />Academic calendar integration</li>
                </ul>
              </div>
              
              <div className="approach-card">
                <div className="approach-icon">
                  <Star size={48} />
                </div>
                <h3 className="approach-card-title">Trust-First Methodology</h3>
                <p className="approach-description">
                  Our approach prioritizes building trust within the student community through 
                  transparent ratings, secure messaging, and verified user profiles.
                </p>
                <ul className="approach-features">
                  <li><CheckCircle size={16} />Peer rating system</li>
                  <li><CheckCircle size={16} />Secure in-app messaging</li>
                  <li><CheckCircle size={16} />Transaction monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Join the Campus Community?</h2>
              <p className="cta-description">
                Join thousands of students who have discovered a better way to buy and sell 
                on campus. Connect with your college community today.
              </p>
              <div className="cta-buttons">
                <Link href="/buyer-dashboard" className="btn btn-primary">
                  <ShoppingBag size={20} />
                  Start Buying
                </Link>
                <Link href="/seller-dashboard" className="btn btn-secondary">
                  <Store size={20} />
                  Start Selling
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <div className="footer-brand">
                  <div className="footer-logo">
                    <img src="/logo.png" alt="CampusMart" />
                    <span>CampusMart</span>
                  </div>
                  <p className="footer-tagline">
                    Empowering student commerce with trusted, campus-exclusive marketplace 
                    solutions since 2024.
                  </p>
                </div>
              </div>
              
              <div className="footer-section">
                <h3 className="footer-title">Platform</h3>
                <ul className="footer-links">
                  <li><Link href="/buyer-dashboard">Buy Items</Link></li>
                  <li><Link href="/seller-dashboard">Sell Items</Link></li>
                  <li><Link href="/categories">Categories</Link></li>
                  <li><Link href="/how-it-works">How It Works</Link></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h3 className="footer-title">Company</h3>
                <ul className="footer-links">
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/testimonials">Student Stories</Link></li>
                  <li><Link href="/blog">Campus Blog</Link></li>
                  <li><Link href="/careers">Join Our Team</Link></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h3 className="footer-title">Contact</h3>
                <ul className="footer-contact">
                  <li>
                    <Mail size={16} />
                    <span>iamshubham1719@gmail.com</span>
                  </li>
                  <li>
                    <Phone size={16} />
                    <span>+91 9315863073</span>
                  </li>
                  <li>
                    <MapPin size={16} />
                    <span>Delhi, India</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>&copy; 2024 CampusMart. All rights reserved. | Privacy Policy | Terms of Service</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CampusMartAbout;