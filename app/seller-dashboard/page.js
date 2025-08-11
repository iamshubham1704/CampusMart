"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, MessageSquare, Heart, Star, User, Bell, Settings,
  LogOut, Package, Eye, Plus, MapPin, Activity,
  Loader2, AlertCircle
} from 'lucide-react';
import styles from './SellerDashboard.module.css';
import { listingsAPI } from '../utils/api';
import EditListingModal from '../../components/EditListingModal';
import Link from 'next/link';

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerData, setSellerData] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const router = useRouter();
  const [editingListing, setEditingListing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Helper function to get current user from token
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        localStorage.removeItem('token');
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        localStorage.removeItem('token');
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
      localStorage.removeItem('token');
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

  // Fetch data
  // In your SellerDashboard component, replace the fetchData function:

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = getCurrentUser();

      if (!user) {
        router.push('/seller-login');
        return;
      }

      // Fetch real listings data
      try {
        const listingsResponse = await listingsAPI.getMyListings();
        if (listingsResponse.success) {
          setMyListings(listingsResponse.listings);
        }
      } catch (listingsError) {
        console.error('Error fetching listings:', listingsError);
        setMyListings([]); // Set empty array on error
      }

      // Set user data (keep some mock stats for now)
      const mockSellerData = {
        _id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.picture,
        savedItems: 25,
        activeChats: 8,
        itemsPurchased: 12,
        reviewsGiven: 7,
        rating: 4.5,
        totalSales: 120,
        totalEarnings: 35000,
        responseRate: 95,
        unreadNotifications: 3,
        memberSince: '2023',
        accountType: 'Premium'
      };

      const mockActivity = [
        { type: 'listing', title: 'New listing created', subtitle: 'Item posted successfully', time: '1h ago' },
        { type: 'message', title: 'New message', subtitle: 'Buyer inquiry', time: '2h ago' },
        { type: 'view', title: 'Item viewed', subtitle: 'Someone viewed your MacBook', time: '3h ago' }
      ];

      setSellerData(mockSellerData);
      setRecentActivity(mockActivity);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);


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
        setActiveTab('settings');
        break;
      case 'notifications':
        setActiveTab('notifications');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
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
        <button className={styles.favoriteButton}>
          <Heart size={16} color="white" />
        </button>
        <div className={`${styles.conditionBadge} ${listing.condition === 'Like New' ? styles.conditionLikeNew :
          listing.condition === 'Excellent' ? styles.conditionExcellent :
            styles.conditionGood
          }`}>
          {listing.condition}
        </div>
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
        <div className={styles.listingFooter}>
          <div className={styles.listingViews}>
            <Eye size={14} style={{ marginRight: '4px' }} />
            {listing.views} views
          </div>
          <button
            className={styles.messageButton}
            onClick={() => handleEditListing(listing)}
          >
            Edit
          </button>
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
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <span className={styles.logoText}>Campus</span>
              <span className={styles.logoTextSecondary}>Market</span>
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
                Sell Item
              </button>

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
                        <Link href="/seller-dashboard/profile-section"><button
                          className={styles.profileMenuItem}
                          onClick={() => handleProfileAction('profile')}
                        >
                          <User size={16} />
                          <span>My Profile</span>
                        </button></Link>

                        <button
                          className={styles.profileMenuItem}
                          onClick={() => handleProfileAction('settings')}
                        >
                          <Settings size={16} />
                          <span>Account Settings</span>
                        </button>

                        <button
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
                        </button>

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

              <button className={styles.messagesButton}>
                <MessageSquare size={16} />
                Messages
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <div className={styles.navList}>
              <button
                onClick={() => setActiveTab('home')}
                className={`${styles.navItem} ${activeTab === 'home' ? styles.active : ''}`}
              >
                <Home size={20} />
                <span>Home</span>
              </button>

              <button
                onClick={() => setActiveTab('chats')}
                className={`${styles.navItem} ${activeTab === 'chats' ? styles.active : ''}`}
              >
                <MessageSquare size={20} />
                <span>Messages</span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`${styles.navItem} ${activeTab === 'saved' ? styles.active : ''}`}
              >
                <Heart size={20} />
                <span>Saved</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`}
              >
                <Package size={20} />
                <span>My Products</span>
              </button>

              <button className={styles.navItem}>
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </div>

            <div className={styles.navDivider}>
              <button className={`${styles.navItem} ${styles.logoutButton}`} onClick={handleLogout}>
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

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <StatCard
              icon={Heart}
              value={sellerData?.savedItems || 0}
              label="Saved Items"
              change="+3 this week"
              color="#ec4899"
            />
            <StatCard
              icon={MessageSquare}
              value={sellerData?.activeChats || 0}
              label="Active Chats"
              change="+2 new today"
              color="#3b82f6"
            />
            <StatCard
              icon={Package}
              value={myListings.length}
              label="Active Listings"
              change="This month"
              color="#10b981"
            />
            <StatCard
              icon={Star}
              value={sellerData?.reviewsGiven || 0}
              label="Reviews Given"
              change={`${sellerData?.rating || 0} avg rating`}
              color="#eab308"
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
                <button className={styles.viewAllButton}>
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

            {/* Sidebar Content */}
            <div className={styles.sidebarContent}>
              {/* Recent Activity */}
              <div className={styles.sidebarCard}>
                <h3 className={styles.cardTitle}>
                  <Activity style={{ marginRight: '8px' }} size={20} />
                  Recent Activity
                </h3>

                <div className={styles.activityList}>
                  {recentActivity.map((activity, index) => (
                    <div key={index} className={styles.activityItem}>
                      <div className={styles.activityDot}></div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityTitle}>
                          {activity.title}
                        </p>
                        <p className={styles.activitySubtitle}>
                          {activity.subtitle}
                        </p>
                        <p className={styles.activityTime}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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