"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, DollarSign, TrendingUp, Eye, Heart, ShoppingCart, Package,
  Edit3, Trash2, User, Bell, Settings, Calendar, BarChart3, Star,
  MapPin, Clock, Camera, Upload, X, Sparkles, Award, Target, Zap,
  MessageCircle, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import styles from '../styles/SellerDashboard.module.css';

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showListingModal, setShowListingModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for seller data
  const [sellerData, setSellerData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [myListings, setMyListings] = useState([]);

  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'textbooks',
    condition: 'like-new',
    images: []
  });

  const router = useRouter();

  // Helper functions for authentication
  const getCurrentSellerId = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      console.log('getCurrentSellerId - token from localStorage:', !!token);

      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            console.log('Invalid JWT format');
            localStorage.removeItem('token');
            return null;
          }

          const payload = JSON.parse(atob(parts[1]));
          console.log('getCurrentSellerId - decoded payload:', payload);

          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (payload.exp < currentTime) {
            console.log('Token expired in getCurrentSellerId');
            localStorage.removeItem('token');
            return null;
          }

          // Try different possible field names for seller ID
          const sellerId = payload.sellerId || payload.userId || payload.id || payload.sub;
          console.log('getCurrentSellerId - extracted sellerId:', sellerId);

          return sellerId;
        } catch (e) {
          console.error('Error decoding token in getCurrentSellerId:', e);
          localStorage.removeItem('token');
          return null;
        }
      }
    }
    return null;
  };
  const handleProfileEdit = async (updatedData) => {
    try {
      const sellerId = getCurrentSellerId();
      const token = getAuthToken();

      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Refresh seller data
      const updatedSellerResponse = await fetch(`/api/sellers/${sellerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (updatedSellerResponse.ok) {
        const updatedSeller = await updatedSellerResponse.json();
        setSellerData(updatedSeller);
      }

      return { success: true, message: 'Profile updated successfully' };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, message: err.message };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Unknown';
    }
  };


  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;

          if (payload.exp < currentTime) {
            console.log('Token expired, removing');
            localStorage.removeItem('token');
            return null;
          }

          return token;
        } catch (e) {
          console.error('Error validating token:', e);
          localStorage.removeItem('token');
          return null;
        }
      }
    }
    return null;
  };

  const debugAuth = () => {
    console.log('=== AUTH DEBUG ===');

    if (typeof window === 'undefined') {
      console.log('Running on server side');
      return;
    }

    const token = localStorage.getItem('token');
    console.log('Raw token from localStorage:', token);

    if (!token) {
      console.log('❌ No token found in localStorage');
      console.log('Available localStorage keys:', Object.keys(localStorage));
      return;
    }

    try {
      // Split the token into parts
      const parts = token.split('.');
      console.log('Token parts count:', parts.length);

      if (parts.length !== 3) {
        console.log('❌ Invalid JWT format - should have 3 parts');
        return;
      }

      // Decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1]));
      console.log('🔍 Decoded token payload:', payload);

      // Check expiration
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;

      console.log('Current time:', currentTime);
      console.log('Token expires at:', payload.exp);
      console.log('Token expired:', isExpired);

      if (isExpired) {
        console.log('❌ Token is expired');
        const expiredDate = new Date(payload.exp * 1000);
        console.log('Token expired on:', expiredDate.toLocaleString());
      } else {
        console.log('✅ Token is valid');
        const expiresDate = new Date(payload.exp * 1000);
        console.log('Token expires on:', expiresDate.toLocaleString());
      }

      // Check required fields
      console.log('Seller ID in token:', payload.sellerId || payload.userId || payload.id);
      console.log('Email in token:', payload.email);
      console.log('Name in token:', payload.name);

    } catch (error) {
      console.log('❌ Error decoding token:', error.message);
      console.log('Token might be corrupted');
    }

    console.log('=== END AUTH DEBUG ===');
  };

  // Fetch seller data from MongoDB
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        console.log('Starting to fetch seller data...');
        setLoading(true);
        setError(null);

        const sellerId = getCurrentSellerId();
        const token = getAuthToken();

        if (!sellerId || !token) {
          console.log('❌ Missing authentication - redirecting to login');
          router.push('/seller-login');
          return;
        }

        // Try to fetch real data first, fall back to mock data
        try {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          };

          // Try to fetch seller profile
          const sellerResponse = await fetch(`/api/sellers/${sellerId}`, {
            method: 'GET',
            headers: headers,
          });

          if (sellerResponse.ok) {
            const text = await sellerResponse.text();
            if (!text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
              const sellerData = JSON.parse(text);
              setSellerData(sellerData);
            } else {
              throw new Error('API returned HTML');
            }
          } else {
            throw new Error('API not available');
          }
        } catch (apiError) {
          console.warn('API not available, using mock data:', apiError.message);

          // Use mock data when API is not available
          const mockSellerData = {
            _id: sellerId,
            name: 'Demo Seller',
            email: 'demo@campusmart.com',
            joinDate: '2024-01-15',
            rating: 4.8,
            totalSales: 0,
            responseRate: 100,
            totalListings: 0,
            completionRate: 100,
            averagePrice: '0.00',
            totalEarnings: 0,
            categories: ['textbooks', 'electronics'],
            phone: '+1-234-567-8900',
            location: 'Campus',
            bio: 'Welcome to my CampusMart store! I sell quality items at great prices.'
          };

          setSellerData(mockSellerData);
        }

        // Set mock data for other endpoints
        setEarningsData({
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          allTime: 0,
          pending: 0,
          totalTransactions: 0,
          averageTransaction: 0,
          topSellingItems: []
        });

        setAnalyticsData({
          activeListings: 0,
          totalViews: 0,
          messagesReceived: 0
        });

        setMyListings([]);

      } catch (err) {
        console.error('Error in fetchSellerData:', err);
        setError(err.message);

        // Only redirect to login for authentication errors
        if (err.message.includes('401') || err.message.includes('Authentication failed')) {
          localStorage.removeItem('token');
          router.push('/seller-login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      fetchSellerData();
    }
  }, [router]);

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

  const categories = [
    { id: 'textbooks', name: 'Textbooks' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'food', name: 'Food & Drinks' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'other', name: 'Other' }
  ];

  const conditions = [
    { id: 'like-new', name: 'Like New' },
    { id: 'excellent', name: 'Excellent' },
    { id: 'good', name: 'Good' },
    { id: 'fair', name: 'Fair' }
  ];

  const handleListingSubmit = async (e) => {
    e.preventDefault();

    try {
      const sellerId = getCurrentSellerId();
      const token = getAuthToken();

      if (!sellerId || !token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // Try real API first, fall back to mock
      try {
        const formData = new FormData();
        Object.keys(newListing).forEach(key => {
          if (key === 'images') {
            newListing.images.forEach(image => {
              formData.append('images', image);
            });
          } else {
            formData.append(key, newListing[key]);
          }
        });

        const response = await fetch(`/api/sellers/${sellerId}/listings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const text = await response.text();
          if (!text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
            const newListingData = JSON.parse(text);
            setMyListings(prev => [newListingData, ...prev]);
          } else {
            throw new Error('API returned HTML');
          }
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        console.warn('API not available, creating mock listing:', apiError.message);

        // Create mock listing
        const mockListing = {
          _id: Date.now().toString(),
          title: newListing.title,
          description: newListing.description,
          price: newListing.price,
          originalPrice: newListing.originalPrice,
          category: newListing.category,
          condition: newListing.condition,
          images: [], // Mock - no actual image upload
          sellerId: sellerId,
          status: 'active',
          views: 0,
          likes: 0,
          messages: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setMyListings(prev => [mockListing, ...prev]);
      }

      setShowListingModal(false);

      // Reset form
      setNewListing({
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        category: 'textbooks',
        condition: 'like-new',
        images: []
      });

      // Update analytics
      if (analyticsData) {
        setAnalyticsData(prev => ({
          ...prev,
          activeListings: prev.activeListings + 1
        }));
      }

    } catch (err) {
      console.error('Error creating listing:', err);
      setError(`Failed to create listing: ${err.message}`);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const sellerId = getCurrentSellerId();
      const token = getAuthToken();

      if (!sellerId || !token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`/api/sellers/${sellerId}/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Listing not found or already deleted.');
        }

        const text = await response.text();

        // Check if response is HTML (error page)
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error(`Server error: API endpoint returned HTML instead of JSON. Status: ${response.status}`);
        }

        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          throw new Error(`Server error (Status: ${response.status}): ${text}`);
        }

        throw new Error(errorData.error || `Failed to delete listing (Status: ${response.status})`);
      }

      // Update local state
      setMyListings(prev => prev.filter(listing => listing._id !== listingId));

      // Update analytics
      if (analyticsData) {
        setAnalyticsData(prev => ({
          ...prev,
          activeListings: Math.max(0, prev.activeListings - 1)
        }));
      }

    } catch (err) {
      console.error('Error deleting listing:', err);
      setError(`Failed to delete listing: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/seller-login');
  };

  const StatCard = ({ icon: Icon, title, value, change, color = 'purple' }) => (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statIcon}>
        <Icon size={24} />
      </div>
      <div className={styles.statContent}>
        <h3>{title}</h3>
        <div className={styles.statValue}>
          {title.includes('Earnings') || title.includes('$') ? `$${value}` : value}
        </div>
        {change && (
          <div className={styles.statChange}>
            <TrendingUp size={14} />
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );


  const ListingCard = ({ listing }) => (
    <div className={`${styles.listingCard} ${styles[listing.status || 'active']}`}>
      <div className={styles.listingImage}>
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <Package size={48} />
          </div>
        )}
        <div className={styles.statusBadge}>
          {listing.status === 'active' && <CheckCircle size={16} />}
          {listing.status === 'sold' && <Award size={16} />}
          {listing.status === 'pending' && <AlertCircle size={16} />}
          <span>{listing.status || 'active'}</span>
        </div>
      </div>

      <div className={styles.listingInfo}>
        <h4>{listing.title}</h4>
        <div className={styles.listingPrice}>
          <span className={styles.currentPrice}>${parseFloat(listing.price || 0).toFixed(2)}</span>
          {listing.originalPrice && parseFloat(listing.originalPrice) > parseFloat(listing.price) && (
            <span className={styles.originalPrice}>${parseFloat(listing.originalPrice).toFixed(2)}</span>
          )}
        </div>

        <div className={styles.listingStats}>
          <div className={styles.stat}>
            <Eye size={14} />
            <span>{listing.views || 0}</span>
          </div>
          <div className={styles.stat}>
            <Heart size={14} />
            <span>{listing.likes || 0}</span>
          </div>
          <div className={styles.stat}>
            <MessageCircle size={14} />
            <span>{listing.messages || 0}</span>
          </div>
        </div>

        <div className={styles.listingMeta}>
          <span>{formatDate(listing.createdAt)}</span>
          <span>•</span>
          <span>{listing.condition || 'good'}</span>
          <span>•</span>
          <span>{listing.category || 'other'}</span>
        </div>

        <div className={styles.listingActions}>
          <button className={styles.editButton}>
            <Edit3 size={16} />
            Edit
          </button>
          <button
            className={styles.deleteButton}
            onClick={() => handleDeleteListing(listing._id)}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Error state
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
      {/* Animated Background */}
      <div className={styles.animatedBackground}>
        <div
          className={styles.gradientOverlay}
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          }}
        />

        {/* Floating particles */}
        <div className={styles.floatingParticles}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <Sparkles size={32} />
              <span>CampusMart</span>
              <span className={styles.sellerBadge}>Seller</span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.listItemButton}
              onClick={() => setShowListingModal(true)}
            >
              <Plus size={20} />
              <span>List Item</span>
            </button>

            <button className={styles.actionButton}>
              <Bell size={20} />
              <span className={styles.badge}>5</span>
            </button>

            <button className={styles.actionButton}>
              <Settings size={20} />
            </button>

            <div className={styles.userProfile} onClick={handleLogout}>
              <img
                src={sellerData?.profileImage || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23667eea' rx='20'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' fill='%23ffffff' font-size='16' font-family='Arial, sans-serif' font-weight='bold'%3E${sellerData?.name?.charAt(0) || 'U'}%3C/text%3E%3C/svg%3E`}
                alt="Profile"
                style={{ width: 40, height: 40, borderRadius: '50%' }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={20} />
              <span>Overview</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'listings' ? styles.active : ''}`}
              onClick={() => setActiveTab('listings')}
            >
              <Package size={20} />
              <span>My Listings</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'earnings' ? styles.active : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              <DollarSign size={20} />
              <span>Earnings</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} />
              <span>Profile</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className={styles.contentArea}>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.welcomeSection}>
                <h1>Welcome back, {sellerData?.name || 'Seller'}! 👋</h1>
                <p>Here's what's happening with your store today</p>
              </div>

              {/* Quick Stats */}
              <div className={styles.quickStats}>
                <StatCard
                  icon={DollarSign}
                  title="Today's Earnings"
                  value={(earningsData?.today || 0).toFixed(2)}
                  change={earningsData?.today > 0 ? "+12%" : null}
                  color="green"
                />
                <StatCard
                  icon={Eye}
                  title="Total Views"
                  value={analyticsData?.totalViews || 0}
                  change={analyticsData?.totalViews > 0 ? "+8%" : null}
                  color="blue"
                />
                <StatCard
                  icon={Package}
                  title="Active Listings"
                  value={analyticsData?.activeListings || 0}
                  color="purple"
                />
                <StatCard
                  icon={MessageCircle}
                  title="New Messages"
                  value={analyticsData?.messagesReceived || 0}
                  change={analyticsData?.messagesReceived > 0 ? "+3" : null}
                  color="pink"
                />
              </div>

              {/* Charts Section */}
              <div className={styles.chartsSection}>
                <div className={styles.chartCard}>
                  <h3>Earnings Overview</h3>
                  <div className={styles.earningsChart}>
                    <div className={styles.chartPlaceholder}>
                      <BarChart3 size={48} />
                      <p>Interactive earnings chart would go here</p>
                    </div>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <h3>Recent Activity</h3>
                  <div className={styles.activityList}>
                    {myListings.slice(0, 4).map((listing, index) => (
                      <div key={listing._id} className={styles.activityItem}>
                        {listing.status === 'sold' && <CheckCircle size={16} />}
                        {listing.status === 'active' && <Eye size={16} />}
                        {listing.status === 'pending' && <AlertCircle size={16} />}
                        <span>
                          {listing.status === 'sold'
                            ? `${listing.title} sold for ${listing.price}`
                            : listing.status === 'active'
                              ? `${listing.title} is active`
                              : `${listing.title} is pending`
                          }
                        </span>
                        <span className={styles.time}>{listing.datePosted}</span>
                      </div>
                    ))}
                    {myListings.length === 0 && (
                      <div className={styles.activityItem}>
                        <Package size={16} />
                        <span>No recent activity</span>
                        <span className={styles.time}>Create your first listing!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className={styles.listingsTab}>
              <div className={styles.listingsHeader}>
                <div>
                  <h2>My Listings</h2>
                  <p>Manage your items and track performance</p>
                </div>
                <button
                  className={styles.addListingButton}
                  onClick={() => setShowListingModal(true)}
                >
                  <Plus size={20} />
                  Add New Listing
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className={styles.emptyState}>
                  <Package size={64} />
                  <h3>No listings yet</h3>
                  <p>Create your first listing to start selling on CampusMart</p>
                  <button
                    className={styles.addListingButton}
                    onClick={() => setShowListingModal(true)}
                  >
                    <Plus size={20} />
                    Create First Listing
                  </button>
                </div>
              ) : (
                <div className={styles.listingsGrid}>
                  {myListings.map(listing => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className={styles.earningsTab}>
              <div className={styles.earningsHeader}>
                <h2>Earnings Dashboard</h2>
                <p>Track your income and performance</p>
              </div>

              <div className={styles.earningsCards}>
                <div className={styles.earningsCard}>
                  <div className={styles.earningsIcon}>
                    <DollarSign size={24} />
                  </div>
                  <div className={styles.earningsInfo}>
                    <h3>Total Earnings</h3>
                    <div className={styles.earningsAmount}>
                      ${(earningsData?.allTime || 0).toFixed(2)}
                    </div>
                    <div className={styles.earningsChange}>
                      {earningsData?.totalTransactions || 0} transactions
                    </div>
                  </div>
                </div>

                <div className={styles.earningsCard}>
                  <div className={styles.earningsIcon}>
                    <Calendar size={24} />
                  </div>
                  <div className={styles.earningsInfo}>
                    <h3>This Month</h3>
                    <div className={styles.earningsAmount}>
                      ${(earningsData?.thisMonth || 0).toFixed(2)}
                    </div>
                    <div className={styles.earningsChange}>
                      {earningsData?.thisWeek > earningsData?.thisMonth - earningsData?.thisWeek ? '+' : ''}
                      {((earningsData?.thisWeek / Math.max(earningsData?.thisMonth - earningsData?.thisWeek, 1)) * 100).toFixed(0)}% from last week
                    </div>
                  </div>
                </div>

                <div className={styles.earningsCard}>
                  <div className={styles.earningsIcon}>
                    <Target size={24} />
                  </div>
                  <div className={styles.earningsInfo}>
                    <h3>Pending</h3>
                    <div className={styles.earningsAmount}>
                      ${(earningsData?.pending || 0).toFixed(2)}
                    </div>
                    <div className={styles.earningsChange}>Awaiting payment</div>
                  </div>
                </div>
              </div>

              <div className={styles.earningsDetails}>
                <div className={styles.earningsBreakdown}>
                  <h3>Earnings Breakdown</h3>
                  <div className={styles.monthlyStats}>
                    <div className={styles.monthStat}>
                      <span>Today</span>
                      <span>${(earningsData?.today || 0).toFixed(2)}</span>
                    </div>
                    <div className={styles.monthStat}>
                      <span>This Week</span>
                      <span>${(earningsData?.thisWeek || 0).toFixed(2)}</span>
                    </div>
                    <div className={styles.monthStat}>
                      <span>This Month</span>
                      <span>${(earningsData?.thisMonth || 0).toFixed(2)}</span>
                    </div>
                    <div className={styles.monthStat}>
                      <span>All Time</span>
                      <span>${(earningsData?.allTime || 0).toFixed(2)}</span>
                    </div>
                    <div className={styles.monthStat}>
                      <span>Average Per Sale</span>
                      <span>${(earningsData?.averageTransaction || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.topProducts}>
                  <h3>Top Selling Items</h3>
                  <div className={styles.productsList}>
                    {earningsData?.topSellingItems && earningsData.topSellingItems.length > 0 ? (
                      earningsData.topSellingItems.map((item, index) => (
                        <div key={index} className={styles.productEarning}>
                          <span>{item.title}</span>
                          <span>${parseFloat(item.price).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className={styles.productEarning}>
                        <span>No sold items yet</span>
                        <span>$0.00</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && sellerData && (
            <div className={styles.profileTab}>
              <div className={styles.profileHeader}>
                <div className={styles.profileImage}>
                  <img
                    src={sellerData?.profileImage || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23667eea' rx='40'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' fill='%23ffffff' font-size='32' font-family='Arial, sans-serif' font-weight='bold'%3E${sellerData?.name?.charAt(0) || 'U'}%3C/text%3E%3C/svg%3E`}
                    alt="Profile"
                    style={{ width: 80, height: 80, borderRadius: '50%' }}
                  />
                  <button className={styles.changePhotoButton}>
                    <Camera size={16} />
                  </button>
                </div>
                <div className={styles.profileInfo}>
                  <h2>{sellerData.name}</h2>
                  <p>Member since {sellerData.joinDate}</p>
                  <div className={styles.profileStats}>
                    <div className={styles.profileStat}>
                      <Star size={16} fill="currentColor" />
                      <span>{(sellerData.rating || 0).toFixed(1)} Rating</span>
                    </div>
                    <div className={styles.profileStat}>
                      <Award size={16} />
                      <span>{sellerData.totalSales || 0} Sales</span>
                    </div>
                    <div className={styles.profileStat}>
                      <Zap size={16} />
                      <span>{sellerData.responseRate || 0}% Response Rate</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.profileDetails}>
                <div className={styles.profileSection}>
                  <h3>Contact Information</h3>
                  <div className={styles.profileField}>
                    <label>Email</label>
                    <div className={styles.fieldValue}>
                      <span>{sellerData.email}</span>
                    </div>
                  </div>
                  <div className={styles.profileField}>
                    <label>Phone</label>
                    <div className={styles.fieldValue}>
                      <span>{sellerData.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className={styles.profileField}>
                    <label>Location</label>
                    <div className={styles.fieldValue}>
                      <MapPin size={16} />
                      <span>{sellerData.location || 'Campus'}</span>
                    </div>
                  </div>
                  {sellerData.bio && (
                    <div className={styles.profileField}>
                      <label>Bio</label>
                      <div className={styles.fieldValue}>
                        <span>{sellerData.bio}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.profileSection}>
                  <h3>Seller Performance</h3>
                  <div className={styles.performanceGrid}>
                    <div className={styles.performanceCard}>
                      <h4>Total Listings</h4>
                      <div className={styles.performanceValue}>{sellerData.totalListings || 0}</div>
                    </div>
                    <div className={styles.performanceCard}>
                      <h4>Completion Rate</h4>
                      <div className={styles.performanceValue}>
                        {sellerData.completionRate || 0}%
                      </div>
                    </div>
                    <div className={styles.performanceCard}>
                      <h4>Average Price</h4>
                      <div className={styles.performanceValue}>
                        ${sellerData.averagePrice || '0.00'}
                      </div>
                    </div>
                    <div className={styles.performanceCard}>
                      <h4>Total Earnings</h4>
                      <div className={styles.performanceValue}>
                        ${(sellerData.totalEarnings || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {sellerData.categories && sellerData.categories.length > 0 && (
                    <div className={styles.categoriesSection}>
                      <h4>Categories You Sell</h4>
                      <div className={styles.categoryTags}>
                        {sellerData.categories.map(category => (
                          <span key={category} className={styles.categoryTag}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* List Item Modal */}
      {showListingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>List New Item</h2>
              <button
                className={styles.closeModal}
                onClick={() => setShowListingModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleListingSubmit} className={styles.listingForm}>
              <div className={styles.formGroup}>
                <label>Item Title *</label>
                <input
                  type="text"
                  value={newListing.title}
                  onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                  placeholder="Enter item title..."
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    value={newListing.category}
                    onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Condition *</label>
                  <select
                    value={newListing.condition}
                    onChange={(e) => setNewListing({ ...newListing, condition: e.target.value })}
                    required
                  >
                    {conditions.map(cond => (
                      <option key={cond.id} value={cond.id}>{cond.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Your Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newListing.price}
                    onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Original Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newListing.originalPrice}
                    onChange={(e) => setNewListing({ ...newListing, originalPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  placeholder="Describe your item in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Photos</label>
                <div className={styles.uploadArea}>
                  <Upload size={32} />
                  <p>Drag & drop photos here, or click to browse</p>
                  <span>Up to 5 photos, max 5MB each</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setNewListing({ ...newListing, images: Array.from(e.target.files) })}
                    style={{ display: 'none' }}
                    id="imageUpload"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('imageUpload').click()}
                    className={styles.uploadButton}
                  >
                    Choose Files
                  </button>
                </div>
                {newListing.images.length > 0 && (
                  <div className={styles.selectedFiles}>
                    <p>{newListing.images.length} file(s) selected</p>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowListingModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  <Plus size={16} />
                  List Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;