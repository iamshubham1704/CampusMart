'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';

import styles from './styles/Landing.module.css';
import LottiePlayer from '../components/LottiePlayer';


const CampusMarketplace = () => {
  const [isLoaded, setIsLoaded] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const router = useRouter();

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage if available
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
    }
  }, []);

  // Handle mouse movement
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

  // Handle theme changes - apply immediately when isDarkTheme changes
  useEffect(() => {
    if (mounted) {
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = isDarkTheme ? 'dark-theme' : 'light-theme';
      localStorage.setItem('theme', theme);
      
      // Also update document body class for additional styling support
      document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
      
      console.log('Theme changed to:', theme); // Debug log
    }
  }, [isDarkTheme, mounted]);

  const toggleTheme = () => {
    console.log('Toggle theme clicked, current isDarkTheme:', isDarkTheme); // Debug log
    setIsDarkTheme(prev => !prev);
  };

  const handleRoleSelect = (role) => {
    if (role === 'buyer') {
      router.push('/buyer-registration');
    } else if (role === 'seller') {
      router.push('/registration-seller');
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className={`dashboard ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <div className={styles.container}>
        {/* Theme Toggle Button */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
          type="button"
          style={{
            // Inline styles to ensure the button is visible and clickable
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '10px 15px',
            backgroundColor: isDarkTheme ? '#333' : '#fff',
            color: isDarkTheme ? '#fff' : '#333',
            border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDarkTheme ? 'Light' : 'Dark'}</span>
        </button>

        {/* Lottie Animation */}
        <LottiePlayer />

        {/* Main Content */}
        <div className={`${styles.mainContent} ${isLoaded ? styles.loaded : ''}`}>
          <header className={styles.header}>
            <h1 className={styles.mainTitle}>CAMPUSMART</h1>
            <p className={styles.subtitle}>
              The <span className={styles.highlightPurple}>ultimate</span> marketplace where students
              <span className={styles.highlightPink}> buy</span> and
              <span className={styles.highlightBlue}> sell</span> everything campus!
            </p>
          </header>

          {/* Role Selection Cards */}
          <div className={styles.roleSelection}>
            <div
              onClick={() => handleRoleSelect('buyer')}
              className={`${styles.roleCard} ${styles.buyerCard}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRoleSelect('buyer');
                }
              }}
            >
              <div className={styles.cardGlow}></div>
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <div className={styles.iconWrapper}>
                    <ShoppingBag size={48} />
                  </div>
                </div>
                <h3 className={styles.cardTitle}>BUY</h3>
                <div className={styles.cardAction}>
                  <span>Start Shopping</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>

            <div
              onClick={() => handleRoleSelect('seller')}
              className={`${styles.roleCard} ${styles.sellerCard}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRoleSelect('seller');
                }
              }}
            >
              <div className={styles.cardGlow}></div>
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <div className={styles.iconWrapper}>
                    <Store size={48} />
                  </div>
                </div>
                <h3 className={styles.cardTitle}>SELL</h3>
                <div className={styles.cardAction}>
                  <span>Start Selling</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className={styles.featuresSection}>
            <div className={styles.feature}>
              <Users size={24} />
              <span>Student Community</span>
            </div>
            <div className={styles.feature}>
              <Zap size={24} />
              <span>Instant Deals</span>
            </div>
            <div className={styles.feature}>
              <TrendingUp size={24} />
              <span>Best Prices</span>
            </div>
          </div>
        </div>

        {/* Debug info - remove this after testing */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '10px',
          backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          color: isDarkTheme ? '#fff' : '#000',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Current theme: {isDarkTheme ? 'Dark' : 'Light'}
        </div>
      </div>
    </div>
  );
};

export default CampusMarketplace;