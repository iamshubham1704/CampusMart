"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Heart,
  ShoppingCart,
  User,
  Bell,
  Grid3X3,
  List,
  Star,
  MapPin,
  Clock,
  DollarSign,
  BookOpen,
  Laptop,
  Coffee,
  Shirt,
  Home,
  Gamepad2,
  Menu,
  X,
  Sparkles,
  Eye,
  Sun,
  Moon,
  Loader2,
  AlertCircle,
  Settings,
  LogOut,
  Camera,
  Phone,
  Mail,
  Edit3,
  Save,
  Package,
  ChevronDown,
  Pen
} from 'lucide-react';
import { useCart } from '../../components/contexts/CartContext';
import CartDrawer from '../../components/CartDrawer';
import ProductViewModal from './quick-view/page';
import { useWishlist } from '../../components/contexts/WishlistContext';
import WishlistModal from './wishlist/page';
import Link from 'next/link';
import './BuyerDashboard.css';

const useBuyer = () => {
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBuyerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        setBuyer(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/buyer/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('buyerToken');
          localStorage.removeItem('token');
          setBuyer(null);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();
      setBuyer(data.data);
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
      setError(error.message);
      setBuyer(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return { success: false, error: 'No authentication token found' };
      }

      const response = await fetch('/api/buyer/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('buyerToken');
          localStorage.removeItem('token');
          window.location.href = '/buyer-login';
          return { success: false, error: 'Authentication failed' };
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setBuyer(data.data);
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerProfile();
  }, []);

  return { buyer, updateProfile, loading, error, refetch: fetchBuyerProfile };
};

const ProfileModal = ({ isOpen, onClose, isDarkTheme, buyer, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    College: '',
    year: ''
  });

  useEffect(() => {
    if (buyer) {
      setFormData({
        name: buyer.name || '',
        email: buyer.email || '',
        phone: buyer.phone || '',
        location: buyer.location || '',
        university: buyer.university || '',
        year: buyer.year || ''
      });
    }
  }, [buyer]);

  const handleSave = async () => {
    alert('Save functionality needs to be wired up with a real updateProfile function passed as prop.');
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    window.location.href = '/buyer-login';
  };

  if (!isOpen || loading || !buyer) {
    if (loading) return (
      <div className="modalOverlay">
        <div className="profileModal">
          <div className="loadingContainer">
            <Loader2 size={32} className="spinner" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
    return null;
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="profileModal" onClick={(e) => e.stopPropagation()}>
        <div className="profileModalHeader">
          <h2>Profile</h2>
          <button className="closeButton" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="profileSection">
          <div className="avatarContainer">
            <img
              src={buyer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer.name)}&size=120&background=3b82f6&color=ffffff`}
              alt={buyer.name}
              className="avatar"
            />
            <button className="cameraButton">
              <Camera size={16} />
            </button>
          </div>

          <h3 className="userName">{buyer.name}</h3>
          <p className="memberSince">
            Member since {new Date(buyer.createdAt).toLocaleDateString()}
          </p>

          {buyer.verified && (
            <span className="verifiedBadge">
              ✓ Verified Student
            </span>
          )}
        </div>

        <div className="personalInfo">
          <div className="personalInfoHeader">
            <h3>Personal Information</h3>
            <button
              className="editButton"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="spinner" /> : isEditing ? <Save size={16} /> : <Edit3 size={16} />}
              {loading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div className="formFields">
            {[
              { key: 'name', label: 'Name', icon: User, type: 'text' },
              { key: 'email', label: 'Email', icon: Mail, type: 'email' },
              { key: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
              { key: 'university', label: 'College', icon: BookOpen, type: 'text' },
            ].map(({ key, label, icon: Icon, type }) => (
              <div key={key} className="fieldGroup">
                <label className="fieldLabel">
                  <Icon size={16} />
                  {label}
                </label>
                {isEditing ? (
                  <input
                    type={type}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="fieldInput"
                  />
                ) : (
                  <div className="fieldDisplay">
                    {buyer[key] || 'Not specified'}
                  </div>
                )}
              </div>
            ))}

            <div className="fieldGroup">
              <label className="fieldLabel">
                <MapPin size={16} />
                Campus Location
              </label>
              {isEditing ? (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="fieldInput"
                >
                  <option value="">Select Location</option>
                  <option value="MAIN CANTEEN">MAIN CANTEEN</option>
                  <option value="GROUND">GROUND</option>
                  <option value="LIBRARY">LIBRARY</option>
                  <option value="OTHER">OTHER</option>
                </select>
              ) : (
                <div className="fieldDisplay">
                  {buyer.location || 'Not specified'}
                </div>
              )}
            </div>

            <div className="fieldGroup">
              <label className="fieldLabel">
                <BookOpen size={16} />
                Academic Year
              </label>
              {isEditing ? (
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="fieldInput"
                >
                  <option value="">Select Year</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="Graduate">Graduated</option>
                </select>
              ) : (
                <div className="fieldDisplay">
                  {buyer.year || 'Not specified'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="actionButtons">
          <button className="settingsButton" onClick={() => console.log('Settings clicked')}>
            <Settings size={16} />
            Settings
          </button>
          <button className="logoutButton" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const BuyerDashboard = () => {
  // Mouse tracking state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const dashboardRef = useRef(null);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    isInWishlist,
    getWishlistCount,
    toggleWishlist,
    loading: wishlistLoading
  } = useWishlist();
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    totalItems,
    addToCart,
    isInCart,
    openCart,
    isLoading: cartLoading,
    isCartOpen
  } = useCart();
  const { buyer, loading: buyerLoading, error: buyerError, updateProfile: updateBuyerProfile } = useBuyer();
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    conditions: [],
    locations: [],
    sortBy: 'newest'
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dashboardRef.current) {
        const rect = dashboardRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    const dashboard = dashboardRef.current;
    if (dashboard) {
      dashboard.addEventListener('mousemove', handleMouseMove);
      return () => dashboard.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  useEffect(() => {
    if (listings.length === 0 && process.env.NODE_ENV === 'development') {
      setListings([
        {
          id: '654321098765432109876545',
          title: 'Advanced Physics Textbook',
          description: 'Complete textbook for physics course',
          price: 500,
          originalPrice: 800,
          category: 'textbooks',
          condition: 'Like New',
          location: 'North Campus',
          seller: {
            id: '654321098765432109876544',
            name: 'Alice Johnson',
            avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&size=100&background=c084fc&color=ffffff',
            rating: 4.8,
            verified: true,
          },
          rating: 4.8,
          timePosted: '2 hours ago',
          views: 23,
          image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
          createdAt: '2023-12-01T10:00:00Z'
        },
        {
          id: '654321098765432109876546',
          title: 'MacBook Pro 13"',
          description: 'Excellent condition laptop perfect for students',
          price: 45000,
          originalPrice: 65000,
          category: 'electronics',
          condition: 'Excellent',
          location: 'South Campus',
          seller: {
            id: '654321098765432109876547',
            name: 'Bob Smith',
            avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&size=100&background=10b981&color=ffffff',
            rating: 4.9,
            verified: true,
          },
          rating: 4.9,
          timePosted: '5 hours ago',
          views: 45,
          image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
          createdAt: '2023-12-01T07:00:00Z'
        }
      ]);
      setLoading(false);
    }
  }, [listings.length]);

  // Categories
  const categories = [
    { id: 'all', name: 'All Items', icon: Grid3X3 },
    { id: 'textbooks', name: 'Textbooks', icon: BookOpen },
    { id: 'electronics', name: 'Electronics', icon: Laptop },
    { id: 'clothing', name: 'Clothing', icon: Shirt },
    { id: 'Stationery', name: 'Stationery', icon: Pen },
    { id: 'furniture', name: 'Furniture', icon: Home },
    { id: 'food', name: 'Food & Drinks', icon: Coffee },
    { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  ];

  // Fetch listings from API
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/listings/public', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();
      setListings(data.data || data.listings || []);

    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (!buyerLoading && !buyer) {
      console.warn('User is not logged in to BuyerDashboard.');
    }
  }, [buyerLoading, buyer]);

  // Filter and sort products
  const filteredProducts = listings.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPrice = product.price >= filters.priceRange.min && product.price <= filters.priceRange.max;
    const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(product.condition);
    const matchesLocation = filters.locations.length === 0 || filters.locations.includes(product.location);

    return matchesSearch && matchesCategory && matchesPrice && matchesCondition && matchesLocation;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      default: return 0;
    }
  });

  // Helper functions
  const handleWishlistToggle = async (product, event) => {
    event.stopPropagation();
    const productIdToToggle = product.id || product._id;
    const success = await toggleWishlist(productIdToToggle);
    if (success) {
      console.log('Wishlist updated successfully');
    }
  };

  const handleAddToCart = async (product) => {
    const productIdToAdd = product.id || product._id;
    const success = await addToCart(productIdToAdd, 1);
    if (success) {
      console.log('Item added to cart successfully');
    }
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 10000 },
      conditions: [],
      locations: [],
      sortBy: 'newest'
    });
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.conditions.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (selectedCategory !== 'all') count++;
    if (searchQuery) count++;
    return count;
  };

  const handlePriceRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { ...prev.priceRange, [field]: parseInt(value) }
    }));
  };

  const handleConditionChange = (condition, checked) => {
    setFilters(prev => ({
      ...prev,
      conditions: checked
        ? [...prev.conditions, condition]
        : prev.conditions.filter(c => c !== condition)
    }));
  };

  const openProductModal = (productId) => {
    setSelectedProductId(productId);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setSelectedProductId(null);
    setIsProductModalOpen(false);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (buyerLoading) {
    return (
      <div className={`dashboard ${isDarkTheme ? 'dark' : 'light'}`}>
        <div className="loadingScreen">
          <Loader2 size={48} className="spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${isDarkTheme ? 'dark' : 'light'}`} ref={dashboardRef}>
      {/* Mouse-tracking animated background */}
      <div className="animatedBackground">
        <div
          className="gradientOverlay"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            background: isDarkTheme
              ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 35%, transparent 60%)`
              : `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 35%, transparent 60%)`
          }}
        />
      </div>

      {/* Header */}
      <header className="header">
        <div className="headerContent">
          <div className="logoSection">
            <button className="menuToggle" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="logo">
              <Sparkles size={32} />
              <span>CampusMart</span>
            </div>
          </div>

          <div className="searchSection">
            <div className="searchBar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search for textbooks, electronics, furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Link href="/seller-login">
            <button className="sellButton">Sell Item</button>
          </Link>

          <div className="headerActions">
            <button className="actionButton" onClick={() => setIsDarkTheme(!isDarkTheme)}>
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="actionButton">
              <Bell size={20} />
              <span className="badge">3</span>
            </button>

            <button className="actionButton" onClick={() => setIsWishlistOpen(true)}>
              <Heart size={20} />
              {getWishlistCount() > 0 && <span className="badge">{getWishlistCount()}</span>}
            </button>

            <button className="actionButton" onClick={openCart}>
              <ShoppingCart size={20} />
              {totalItems > 0 && <span className="badge">{totalItems}</span>}
            </button>

            <button className="actionButton" onClick={() => setIsProfileOpen(true)}>
              {buyer && (
                <img
                  src={buyer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer.name)}&size=40&background=3b82f6&color=ffffff`}
                  alt={buyer.name}
                  className="userAvatar"
                />
              ) || <User size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mainContent">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'sidebarOpen' : ''}`}>
          <div className="sidebarContent">
            <button className="closeSidebar" onClick={closeSidebar}>
              <X size={20} />
            </button>

            {buyer && (
              <div className="welcomeMessage">
                <h3>Welcome back, {buyer.name?.split(' ')[0]}!</h3>
                <p>{buyer.university} - {buyer.year} year</p>
              </div>
            )}

            <div className="categorySection">
              <h3>Categories</h3>
              <div className="categoryList">
                {categories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      className={`categoryItem ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent size={20} />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="filterSection">
              <div className="filterHeader">
                <h3>Filters</h3>
                {getActiveFilterCount() > 0 && (
                  <button className="clearFilters" onClick={clearAllFilters}>
                    Clear All ({getActiveFilterCount()})
                  </button>
                )}
              </div>

              <div className="filterGroup">
                <label>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="filterSelect"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div className="filterGroup">
                <label>
                  Price Range: ₹{filters.priceRange.min} - ₹{filters.priceRange.max}
                </label>
                <div className="priceRange">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={filters.priceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={filters.priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  />
                </div>
              </div>

              <div className="filterGroup">
                <label>Condition ({filters.conditions.length} selected)</label>
                <div className="checkboxGroup">
                  {['Like New', 'Excellent', 'Good', 'Fair'].map(condition => (
                    <label key={condition} className="checkboxLabel">
                      <input
                        type="checkbox"
                        checked={filters.conditions.includes(condition)}
                        onChange={(e) => handleConditionChange(condition, e.target.checked)}
                      />
                      <span>{condition}</span>
                    </label>
                  ))}
                </div>
              </div>
              <select
                // style={styles.dropdown}
                value={filters.locations[0] || ""}
                onChange={(e) => {
                  // Update filters object properly
                  setFilters(prev => ({
                    ...prev,
                    locations: e.target.value ? [e.target.value] : []
                  }));
                  // OR if you're mutating directly (not recommended):
                  // filters.locations = e.target.value ? [e.target.value] : [];
                  // forceUpdate(); // You'll need some way to trigger re-render
                }}
              >
                <option value="">Select Location</option>
                {['MAIT', 'DTU', 'NSUT', 'DU'].map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="contentArea">
          <div className="contentHeader">
            <div className="resultsInfo">
              <h2>Found {filteredProducts.length} items</h2>
              <p>
                {getActiveFilterCount() > 0
                  ? `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} applied`
                  : 'Best deals for students'
                }
              </p>
            </div>

            <div className="viewControls">
              <button
                className={`filterToggle mobileOnly ${getActiveFilterCount() > 0 ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Filter size={18} />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="filterCount">{getActiveFilterCount()}</span>
                )}
              </button>

              <div className="viewModeToggle">
                <button
                  className={`viewButton ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  className={`viewButton ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {(error || buyerError) && (
            <div className="errorBanner">
              <AlertCircle size={20} />
              <span>
                {error && `Listings: ${error}`}
                {error && buyerError && ' | '}
                {buyerError && `Profile: ${buyerError}`}
              </span>
            </div>
          )}

          {loading && (
            <div className="loadingContainer">
              <Loader2 size={48} className="spinner" />
              <p>Loading amazing deals...</p>
            </div>
          )}

          {!loading && (
            <div className={`productsContainer ${viewMode === 'grid' ? 'gridView' : 'listView'}`}>
              {filteredProducts.length === 0 ? (
                <div className="noResults">
                  <Search size={64} />
                  <h3>No items found</h3>
                  <p>Try adjusting your search or filters</p>
                  {getActiveFilterCount() > 0 && (
                    <button className="clearFiltersButton" onClick={clearAllFilters}>
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id || product._id}
                    className="productCard"
                    onClick={() => openProductModal(product.id || product._id)}
                  >
                    <div className="productImage">
                      <img src={product.image} alt={product.title} />
                      <div className="productOverlay">
                        <button className="quickViewButton">
                          <Eye size={18} />
                          Quick View
                        </button>
                      </div>
                      <button
                        className={`wishlistButton ${isInWishlist(product.id || product._id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                      >
                        <Heart size={18} />
                      </button>
                      <div className="conditionBadge">
                        {product.condition}
                      </div>
                    </div>

                    <div className="productInfo">
                      <h3 className="productTitle">{product.title}</h3>

                      <div className="sellerInfo">
                        <div className="sellerDetails">
                          <User size={14} />
                          <span>{product.seller?.name || product.seller || 'Unknown Seller'}</span>
                          <div className="rating">
                            <Star size={12} />
                            <span>{product.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="productMeta">
                        <div className="productMetaItem">
                          <MapPin size={14} />
                          <span>{product.location}</span>
                        </div>
                        <div className="productMetaItem">
                          <Clock size={14} />
                          <span>{product.timePosted}</span>
                        </div>
                        <div className="productMetaItem">
                          <Eye size={14} />
                          <span>{product.views} views</span>
                        </div>
                      </div>

                      <div className="priceSection">
                        <div className="currentPrice">
                          ₹{Math.round(product.price)}
                        </div>
                        {product.originalPrice > product.price && (
                          <>
                            <div className="originalPrice">
                              ₹{product.originalPrice}
                            </div>
                            <div className="savings">
                              Save ₹{(product.originalPrice - product.price).toFixed(2)}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="productActions">
                        <button
                          className={`addToCartButton ${cartLoading || isInCart(product.id || product._id) ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isInCart(product.id || product._id)) {
                              handleAddToCart(product);
                            }
                          }}
                          disabled={cartLoading || isInCart(product.id || product._id)}
                        >
                          <ShoppingCart size={16} />
                          {isInCart(product.id || product._id) ? 'In Cart' : 'Add to Cart'}
                        </button>
                        <button
                          className="contactSellerButton"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProductModal(product.id || product._id);
                          }}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        isDarkTheme={isDarkTheme}
        buyer={buyer}
        loading={buyerLoading}
      />

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="sidebarOverlay" onClick={closeSidebar} />}

      <ProductViewModal
        productId={selectedProductId}
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        currentUser={buyer}
        currentUserLoading={buyerLoading}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        isDarkTheme={isDarkTheme}
      />

      <CartDrawer />
    </div>
  );
};

export default BuyerDashboard;