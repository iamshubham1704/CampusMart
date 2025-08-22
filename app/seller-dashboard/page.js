"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, MessageSquare, Heart, Star, User, Bell, Settings,
  LogOut, Package, Eye, Plus, MapPin,
  Loader2, AlertCircle, Menu, X, DollarSign
} from 'lucide-react';
import styles from './SellerDashboard.module.css';
import { listingsAPI, dashboardAPI } from '../utils/api';
import EditListingModal from '../../components/EditListingModal';
import SellerDeliveryIntegration from '../../components/SellerDeliveryIntegration';
import { getStoredToken, isAuthenticated, redirectToLogin } from '../../lib/auth';
// import NotificationBadge from '../../components/NotificationBadge';

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerData, setSellerData] = useState(null);
  const [myListings, setMyListings] = useState([]);
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [editingListing, setEditingListing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Helper function to get current user from token
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;

    // Check authentication first
    if (!isAuthenticated('seller')) {
      redirectToLogin('seller');
      return null;
    }

    const token = getStoredToken('seller');
    if (!token) {
      redirectToLogin('seller');
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format - not a valid JWT');
        redirectToLogin('seller');
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.error('Token has expired');
        redirectToLogin('seller');
        return null;
      }

      return {
        id: payload.sellerId || payload.userId || payload.id || payload.sub || payload.email,
        name: payload.name || payload.given_name || 'User',
        email: payload.email || '',
        picture: payload.picture || null,
        token
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      redirectToLogin('seller');
      return null;
    }
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingListing(null);
  };

  const handleUpdateListing = () => {
    // Refresh listings after update
    fetchData();
    setShowEditModal(false);
    setEditingListing(null);
  };

  const handleDeleteListing = () => {
    // Refresh listings after delete
    fetchData();
    setShowEditModal(false);
    setEditingListing(null);
  };

  // Generate user avatar
  const generateUserAvatar = (name, profileImage) => {
    if (profileImage) return profileImage;

    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' fill='%23667eea' rx='18'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' fill='%23ffffff' font-size='14' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
  };

  // Mobile menu handlers
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Prevent body scroll when menu is open
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Close mobile menu when navigating
  const handleNavigation = (callback) => {
    return () => {
      closeMobileMenu();
      if (callback) callback();
    };
  };

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = getCurrentUser();

      if (!user || !user.token) {
        console.error('No valid user or token found, redirecting to login');
        router.push('/seller-login');
        return;
      }

      // Verify token is still valid before making API calls
      const tokenParts = user.token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        redirectToLogin('seller');
        return;
      }

      let tokenPayload;
      try {
        tokenPayload = JSON.parse(atob(tokenParts[1]));
        if (tokenPayload.exp && tokenPayload.exp < Date.now() / 1000) {
          console.error('Token expired during fetch');
          redirectToLogin('seller');
          return;
        }
      } catch (e) {
        console.error('Error parsing token payload:', e);
        redirectToLogin('seller');
        return;
      }

      console.log('Making API calls with valid token...');

      // Use real APIs by default; no dummy fallbacks
      const useRealAPIs = true;

      let apiCalls;
      if (useRealAPIs) {
        apiCalls = [
          listingsAPI.getMyListings().catch(err => {
            console.error('Listings API error:', err);
            return { success: false, listings: [], message: err.message || 'Failed to fetch listings' };
          }),
          dashboardAPI.getSellerStats().catch(err => {
            console.error('Stats API error:', err);
            return { success: false, stats: null, message: err.message || 'Failed to fetch stats' };
          }),
          dashboardAPI.getPendingPaymentRequestsCount().catch(err => {
            console.error('Pending payments count API error:', err);
            return { success: false, count: 0, message: err.message || 'Failed to fetch pending payments count' };
          }),
          dashboardAPI.getReadyToRequestPaymentCount().catch(err => {
            console.error('Ready-to-request count API error:', err);
            return { success: false, count: 0, message: err.message || 'Failed to fetch ready-to-request count' };
          })
        ];
      } else {
        // Fetch listings and pending payments count even when other APIs are disabled
        apiCalls = [
          listingsAPI.getMyListings().catch(err => {
            console.error('Listings API error:', err);
            return { success: false, listings: [], message: err.message || 'Failed to fetch listings' };
          }),
          dashboardAPI.getPendingPaymentRequestsCount().catch(err => {
            console.error('Pending payments count API error:', err);
            return { success: false, count: 0, message: err.message || 'Failed to fetch pending payments count' };
          }),
          dashboardAPI.getReadyToRequestPaymentCount().catch(err => {
            console.error('Ready-to-request count API error:', err);
            return { success: false, count: 0, message: err.message || 'Failed to fetch ready-to-request count' };
          })
        ];
      }

      const responses = await Promise.all(apiCalls);
      const [listingsResponse, statsResponse, pendingPaymentsResponse, readyToRequestResponse] = useRealAPIs ? responses : [
        responses[0], 
        { success: false, stats: null, message: 'Stats API disabled for debugging' },
        responses[1],
        responses[2]
      ];

      // Handle listings response
      if (listingsResponse.success) {
        setMyListings(listingsResponse.listings || []);
        console.log('Listings fetched successfully:', listingsResponse.listings.length);
      } else {
        console.warn('Error fetching listings:', listingsResponse.message);
        setMyListings([]);
        
        // If it's a token error, redirect to login
        if (listingsResponse.message && listingsResponse.message.toLowerCase().includes('token')) {
          redirectToLogin('seller');
          return;
        }
      }

      // Handle stats with better error handling
      let sellerStats = {};
      
      if (statsResponse.success && statsResponse.stats) {
        sellerStats = statsResponse.stats;
        console.log('Stats fetched successfully');
      } else {
        console.warn('Stats API failed:', {
          success: statsResponse.success,
          message: statsResponse.message,
          hasStats: !!statsResponse.stats
        });
        
        // If it's a token error, redirect to login
        if (statsResponse.message && 
            (statsResponse.message.toLowerCase().includes('token') || 
             statsResponse.message.toLowerCase().includes('unauthorized') ||
             statsResponse.message.toLowerCase().includes('authentication'))) {
          console.error('Authentication error detected, redirecting to login');
          redirectToLogin('seller');
          return;
        }

        // Fallback to basic stats calculation from listings
        const activeListingsCount = listingsResponse.success
          ? (listingsResponse.listings || []).filter(listing => listing.status === 'active').length
          : 0;

        // Mock payment data for demo purposes
        const mockPaymentData = {
          totalEarnings: 0,
          pendingPayments: 0,
          monthlyEarnings: 0,
          paymentHistory: [
            { id: '1', amount: 890, status: 'completed', date: '2 days ago' },
            { id: '2', amount: 1200, status: 'pending', date: '5 days ago' },
            { id: '3', amount: 650, status: 'completed', date: '1 week ago' }
          ]
        };

        sellerStats = {
          savedItems: 0,
          activeChats: 0,
          activeListings: activeListingsCount,
          reviewsGiven: 0,
          rating: 0,
          totalSales: 0,
          totalEarnings: mockPaymentData.totalEarnings,
          monthlyEarnings: mockPaymentData.monthlyEarnings,
          pendingPayments: mockPaymentData.pendingPayments,
          paymentHistory: mockPaymentData.paymentHistory,
          responseRate: 95,
          // unreadNotifications: 0,
          memberSince: new Date().getFullYear(),
          accountType: 'Standard',
          changes: {
            savedItemsWeekly: "+0 this week",
            activeChatsDaily: "+0 new today",
            activeListingsMonthly: "This month",
            reviewsRating: "0 avg rating",
            earningsMonthly: `+₹${mockPaymentData.monthlyEarnings.toLocaleString()} this month`
          }
        };
      }

      // Merge pending payments count if available
      if (pendingPaymentsResponse && pendingPaymentsResponse.success) {
        sellerStats.pendingPayments = pendingPaymentsResponse.count || 0;
      }

      if (readyToRequestResponse && readyToRequestResponse.success) {
        sellerStats.readyToRequest = readyToRequestResponse.count || 0;
      }

      // Combine user data with stats
      const completeSellerData = {
        _id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.picture,
        ...sellerStats
      };

      setSellerData(completeSellerData);

      // Recent Activity removed from dashboard

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Check if it's a token-related error
      if (err.message && err.message.toLowerCase().includes('token')) {
        redirectToLogin('seller');
        return;
      }

      setError('Failed to load dashboard data. Please try again.');

      // Set basic user data even on error
      const user = getCurrentUser();
      if (user) {
        setSellerData({
          _id: user.id,
          name: user.name,
          email: user.email,
          profileImage: user.picture,
          savedItems: 0,
          activeChats: 0,
          activeListings: 0,
          reviewsGiven: 0,
          rating: 0,
          totalSales: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
          pendingPayments: 0,
          responseRate: 95,
          // unreadNotifications: 0,
          memberSince: new Date().getFullYear(),
          accountType: 'Standard'
        });
      } else {
        router.push('/seller-login');
        return;
      }

      setMyListings([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for valid token before mounting
    const user = getCurrentUser();
    if (!user || !user.token) {
      router.push('/seller-login');
      return;
    }
    
    fetchData();
  }, [router]);

  // Periodically refresh pending payment requests count
  useEffect(() => {
    let isMounted = true;

    const refreshPendingPayments = async () => {
      try {
        const response = await dashboardAPI.getPendingPaymentRequestsCount();
        if (isMounted && response && response.success) {
          setSellerData(prev => prev ? { ...prev, pendingPayments: response.count || 0 } : prev);
        }
      } catch (_) {
        // ignore
      }
    };

    // initial fetch and interval
    refreshPendingPayments();
    const intervalId = setInterval(refreshPendingPayments, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Cleanup body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/seller-login');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfileAction = (action) => {
    setShowProfileDropdown(false);

    switch (action) {
      case 'profile':
        setActiveTab('profile');
        break;
      case 'settings':
        router.push('/seller-dashboard/settings');
        break;
      // case 'notifications':
      //   router.push('/seller-dashboard/notifications');
      //   break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.userProfile}`)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProfileDropdown]);

  const StatCard = ({ icon: Icon, value, label, change, color }) => (
    <div className={styles.statCard}>
      <div className={styles.statCardHeader}>
        <div className={styles.statIcon} style={{ backgroundColor: color }}>
          <Icon size={20} color="white" />
        </div>
        {change && (
          <span className={styles.statChange}>
            {change}
          </span>
        )}
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );

  const ListingCard = ({ listing }) => (
    <div className={styles.listingCard}>
      <div className={styles.listingImageContainer}>
        <img
          src={listing.image}
          alt={listing.title}
          className={styles.listingImage}
        />
        <div className={`${styles.conditionBadge} ${listing.condition === 'Like New' ? styles.conditionLikeNew :
          listing.condition === 'Excellent' ? styles.conditionExcellent :
            styles.conditionGood
          }`}>
          {listing.condition}
        </div>
        {/* Show sold badge if product is sold */}
        {listing.status === 'sold' && (
          <div className={styles.soldBadge}>
            SOLD
          </div>
        )}
      </div>

      <div className={styles.listingContent}>
        <h3 className={styles.listingTitle}>
          {listing.title}
        </h3>
        <div className={styles.listingPrice}>
          ₹{listing.price.toLocaleString()}
        </div>
        <div className={styles.listingLocation}>
          <MapPin size={14} style={{ marginRight: '4px' }} />
          {listing.location}
        </div>
        
        {/* Show delivery scheduling for sold products */}
        {listing.status === 'sold' && (
          <div className={styles.deliverySection}>
            <SellerDeliveryIntegration productId={listing.id} />
          </div>
        )}
        
        <div className={styles.listingFooter}>
          <div className={styles.listingViews}>
            <Eye size={14} style={{ marginRight: '4px' }} />
            {listing.views} views
          </div>
          {listing.status !== 'sold' && (
            <button
              className={styles.messageButton}
              onClick={() => handleEditListing(listing)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={`${styles.mobileNavOverlay} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}
          onClick={closeMobileMenu}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Mobile Menu Toggle */}
          <button 
            className={styles.mobileNavToggle}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <img src="/logo.png" alt="CampusMart" style={{ height: 80, width: 'auto' }} />
            </div>
          </div>

          <div className={styles.headerActions}>
            <div>
              <input
                type="text"
                placeholder="Search products, colleges, categories..."
                className={styles.searchInput}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className={styles.sellButton} onClick={() => router.push('/seller-dashboard/create-listing')}>
                <Plus size={20} />
                <span>Sell Item</span>
              </button>

              {/* Payments Button */}
              <button 
                className={styles.paymentsButton}
                onClick={() => router.push('/seller-dashboard/payments')}
                title="Payment Requests"
              >
                <DollarSign size={16} />
                <span>Payments</span>
                {sellerData?.pendingPayments > 0 && (
                  <>
                    <span className={styles.notificationBadge}>
                      {sellerData.pendingPayments}
                    </span>
                    <span className={styles.paymentsAttention} aria-hidden="true">
                      <span className={styles.dotPulse}>
                        <span></span><span></span><span></span>
                      </span>
                    </span>
                  </>
                )}
              </button>

              {/* Delivery Scheduling Button */}
              {myListings.filter(listing => listing.status === 'sold').length > 0 && (
                <button 
                  className={styles.deliveryButton}
                  onClick={() => {
                    const soldProductsSection = document.querySelector(`.${styles.soldProductsSection}`);
                    if (soldProductsSection) {
                      soldProductsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  title="Schedule Delivery for Sold Products"
                >
                  <Package size={16} />
                  <span>Delivery</span>
                  <span className={styles.deliveryNotificationBadge}>
                    {myListings.filter(listing => listing.status === 'sold').length}
                  </span>
                </button>
              )}

              <div className={styles.profileSection}>
                <div
                  className={styles.userProfile}
                  onClick={toggleProfileDropdown}
                  title="Profile Menu"
                >
                  <img
                    src={generateUserAvatar(sellerData?.name, sellerData?.profileImage)}
                    alt={`${sellerData?.name || 'User'}'s Profile`}
                    className={styles.userAvatar}
                  />
                  <span className={styles.userName}>{sellerData?.name || 'User'}</span>
                  <svg
                    className={`${styles.dropdownArrow} ${showProfileDropdown ? styles.dropdownArrowOpen : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>

                {showProfileDropdown && (
                  <>
                    <div className={styles.profileDropdownOverlay} onClick={() => setShowProfileDropdown(false)}></div>
                    <div className={styles.profileDropdown}>
                      <div className={styles.profileHeader}>
                        <img
                          src={generateUserAvatar(sellerData?.name, sellerData?.profileImage)}
                          alt="Profile"
                          className={styles.profileDropdownAvatar}
                        />
                        <div className={styles.profileInfo}>
                          <div className={styles.profileName}>{sellerData?.name || 'User'}</div>
                          <div className={styles.profileEmail}>{sellerData?.email || ''}</div>
                        </div>
                      </div>

                      <div className={styles.profileDivider}></div>

                      <div className={styles.profileMenuItems}>
                        <button
                          className={styles.profileMenuItem}
                          onClick={() => handleProfileAction('settings')}
                        >
                          <Settings size={16} />
                          <span>Account Settings</span>
                        </button>

                        {/* <button
                          className={styles.profileMenuItem}
                          onClick={() => handleProfileAction('notifications')}
                        >
                          <Bell size={16} />
                          <span>Notifications</span>
                          {sellerData?.unreadNotifications > 0 && (
                            <span className={styles.notificationCount}>
                              {sellerData.unreadNotifications}
                            </span>
                          )}
                        </button> */}

                        <div className={styles.profileDivider}></div>

                        <button
                          className={`${styles.profileMenuItem} ${styles.logoutMenuItem}`}
                          onClick={() => handleProfileAction('logout')}
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* <button className={styles.messagesButton}
               onClick={() => router.push('/seller-dashboard/messages')}>
                <MessageSquare size={16} />
                <span>Messages</span>
              </button> */}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarMobileOpen : styles.sidebarMobile}`}>
          <nav className={styles.nav}>
            <div className={styles.navList}>
              <button
                onClick={handleNavigation(() => setActiveTab('home'))}
                className={`${styles.navItem} ${activeTab === 'home' ? styles.active : ''}`}
              >
                <Home size={20} />
                <span>Home</span>
              </button>

              <button
                onClick={handleNavigation(() => router.push('/seller-dashboard/products'))}
                className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`}
              >
                <Package size={20} />
                <span>My Products</span>
              </button>

              {/* Payments Navigation Item */}
              <button
                onClick={handleNavigation(() => router.push('/seller-dashboard/payments'))}
                className={`${styles.navItem} ${activeTab === 'payments' ? styles.active : ''}`}
              >
                <DollarSign size={20} />
                <span>Payments</span>
                {sellerData?.pendingPayments > 0 && (
                  <>
                    <span className={styles.navNotificationBadge}>
                      {sellerData.pendingPayments}
                    </span>
                    <span className={styles.paymentsAttention} aria-hidden="true">
                      <span className={styles.dotPulse}>
                        <span></span><span></span><span></span>
                      </span>
                    </span>
                  </>
                )}
              </button>

              {/* <button
                onClick={handleNavigation(() => router.push('/seller-dashboard/notifications'))}
                className={`${styles.navItem} ${activeTab === 'notifications' ? styles.active : ''}`}
              >
                <Bell size={20} />
                <span>Notifications</span>
              </button> */}

              <button 
                onClick={handleNavigation(() => router.push('/seller-dashboard/settings'))}
                className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </div>

            <div className={styles.navDivider}>
              <button className={`${styles.navItem} ${styles.logoutButton}`} onClick={handleNavigation(handleLogout)}>
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Welcome Section */}
          <div className={styles.welcomeSection}>
            <h1 className={styles.welcomeTitle}>
              Hey {sellerData?.name || 'User'} 👋
            </h1>
            <p className={styles.welcomeSubtitle}>Ready to find great deals today?</p>
          </div>

          {/* Enhanced Stats Cards with Payments */}
          <div className={styles.statsGrid}>
            <StatCard
              icon={Package}
              value={myListings.length}
              label="Active Listings"
              change="This month"
              color="#10b981"
            />
            <StatCard
              icon={DollarSign}
              value={`₹${(sellerData?.totalEarnings || 0).toLocaleString()}`}
              label="Total Earnings"
              change={sellerData?.changes?.earningsMonthly || "+₹0 this month"}
              color="#8b5cf6"
            />
            <StatCard
              icon={Star}
              value={sellerData?.reviewsGiven || 0}
              label="Reviews Given"
              change={`${sellerData?.rating || 0} avg rating`}
              color="#eab308"
            />
            <StatCard
              icon={Package}
              value={myListings.filter(listing => listing.status === 'sold').length}
              label="Sold Products"
              change="Need delivery"
              color="#ef4444"
            />
          </div>

          <div className={styles.contentGrid}>
            {/* My Listings */}
            <div className={styles.listingsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Package className={styles.sectionIcon} />
                  Your Products
                </h2>
                <button className={styles.viewAllButton}
                  onClick={() => router.push('/seller-dashboard/products')}>
                  View All ({myListings.length})
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className={styles.emptyState}>
                  <Package size={64} />
                  <h3>No listings yet</h3>
                  <p>Create your first listing to start selling on CampusMarket</p>
                  <button onClick={() => router.push('/seller-dashboard/create-listing')}>
                    <Plus size={20} />
                    Create First Listing
                  </button>
                </div>
              ) : (
                <div className={styles.listingsGrid}>
                  {myListings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>

            {/* Sold Products - Delivery Scheduling */}
            {myListings.filter(listing => listing.status === 'sold').length > 0 && (
              <div className={styles.soldProductsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <Package className={styles.sectionIcon} />
                    Sold Products - Schedule Delivery
                  </h2>
                  <span className={styles.soldCount}>
                    {myListings.filter(listing => listing.status === 'sold').length} sold
                  </span>
                </div>
                
                <div className={styles.soldProductsGrid}>
                  {myListings
                    .filter(listing => listing.status === 'sold')
                    .map(listing => (
                      <div key={listing.id} className={styles.soldProductCard}>
                        <div className={styles.soldProductImage}>
                          <img src={listing.image} alt={listing.title} />
                          <div className={styles.soldBadge}>SOLD</div>
                        </div>
                        <div className={styles.soldProductInfo}>
                          <h3>{listing.title}</h3>
                          <p className={styles.soldProductPrice}>₹{listing.price.toLocaleString()}</p>
                          <p className={styles.soldProductLocation}>
                            <MapPin size={14} style={{ marginRight: '4px' }} />
                            {listing.location}
                          </p>
                        </div>
                        <div className={styles.deliveryIntegration}>
                          <SellerDeliveryIntegration productId={listing.id} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sidebar Content */}
            <div className={styles.sidebarContent}>
              {/* Quick Payment Overview */}
              <div className={styles.sidebarCard}>
                <h3 className={styles.cardTitle}>
                  <DollarSign style={{ marginRight: '8px' }} size={20} />
                  Payment Overview
                </h3>

                <div className={styles.paymentOverview}>
                  <div className={styles.paymentStat}>
                    <span className={styles.paymentLabel}>This Month</span>
                    <span className={styles.paymentValue}>
                      ₹{(sellerData?.monthlyEarnings || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.paymentStat}>
                    <span className={styles.paymentLabel}>Ready to Request</span>
                    <span className={styles.paymentValue}>
                      {sellerData?.readyToRequest || 0} {((sellerData?.readyToRequest || 0) === 1 ? 'request' : 'requests')}
                      {(sellerData?.readyToRequest || 0) > 0 && (
                        <span className={styles.paymentsAttention} aria-hidden="true" style={{ marginLeft: 6 }}>
                          <span className={styles.dotPulse}>
                            <span></span><span></span><span></span>
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <button 
                  className={styles.viewPaymentsButton}
                  onClick={() => router.push('/seller-dashboard/payments')}
                >
                  View All Payments
                </button>
              </div>

              {/* Recent Activity removed */}
            </div>
          </div>
        </main>
      </div>

      <EditListingModal
        listing={editingListing}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onUpdate={handleUpdateListing}
        onDelete={handleDeleteListing}
      />
    </div>
  );
};

export default SellerDashboard;