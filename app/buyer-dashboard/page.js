"use client";
import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import './BuyerDashboard.css';
import ProductViewModal from './quick-view/page';

const BuyerDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [wishlist, setWishlist] = useState(new Set());
  const [cart, setCart] = useState(new Set());
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    conditions: [],
    locations: [],
    sortBy: 'newest' // newest, oldest, price-low, price-high
  });

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

  // Fetch all listings from API
  const fetchAllListings = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching listings from API...');

      // Fetch all public listings
      const response = await fetch('/api/listings/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch listings');
      }

      // Handle both array and object responses
      const listingsArray = data.listings || [];
      console.log(`Found ${listingsArray.length} listings from API`);

      if (listingsArray.length === 0) {
        console.log('No listings found, using mock data');
        setListings(getMockData());
        return;
      }

      // Transform the data to match the expected format
      const transformedListings = listingsArray.map(listing => {
        console.log('Processing listing:', listing.title || listing._id);
        return {
          id: listing._id || listing.id,
          title: listing.title || 'Untitled Item',
          price: parseFloat(listing.price) || 0,
          originalPrice: listing.originalPrice ? parseFloat(listing.originalPrice) : (parseFloat(listing.price) || 0) * 1.5,
          image: listing.images?.[0] || listing.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
          seller: listing.seller?.[0]?.name || listing.seller?.name || listing.sellerName || 'Anonymous Seller',
          rating: listing.seller?.[0]?.rating || listing.seller?.rating || 4.5,
          location: listing.location || 'Campus',
          timePosted: formatTimeAgo(listing.createdAt),
          category: mapCategory(listing.category),
          condition: listing.condition || 'Good',
          description: listing.description || 'No description available',
          views: listing.views || 0,
          status: listing.status || 'active',
          createdAt: listing.createdAt || new Date()
        };
      });

      console.log('Transformed listings:', transformedListings.length);

      // Filter out sold items (optional since we're already filtering in the API)
      const activeListings = transformedListings.filter(listing => {
        const isActive = listing.status === 'active' || !listing.status;
        console.log(`Listing ${listing.title}: status=${listing.status}, isActive=${isActive}`);
        return isActive;
      });

      console.log('Active listings:', activeListings.length);
      setListings(activeListings);

    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(`Failed to load listings: ${err.message}`);
      // Fallback to mock data if API fails
      console.log('Using mock data as fallback');
      setListings(getMockData());
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  // Helper function to map backend categories to frontend categories
  const mapCategory = (backendCategory) => {
    const categoryMap = {
      'Books': 'textbooks',
      'Textbooks': 'textbooks',
      'Electronics': 'electronics',
      'Clothing': 'clothing',
      'Furniture': 'furniture',
      'Food': 'food',
      'Food & Drinks': 'food',
      'Gaming': 'gaming',
      'Other': 'all'
    };

    return categoryMap[backendCategory] || 'all';
  };

  // Fallback mock data with more items for testing
  const getMockData = () => [
    {
      id: 1,
      title: 'Calculus Textbook - 12th Edition',
      price: 89.99,
      originalPrice: 299.99,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=300&fit=crop',
      seller: 'Sarah M.',
      rating: 4.8,
      location: 'North Campus',
      timePosted: '2 hours ago',
      category: 'textbooks',
      condition: 'Like New',
      description: 'Barely used calculus textbook. Only a few pages highlighted.',
      views: 24,
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 2,
      title: 'MacBook Pro 2021 - M1 Chip',
      price: 1299.99,
      originalPrice: 1999.99,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop',
      seller: 'Alex K.',
      rating: 4.9,
      location: 'South Campus',
      timePosted: '1 day ago',
      category: 'electronics',
      condition: 'Excellent',
      description: 'Perfect condition MacBook, comes with charger and case.',
      views: 156,
      status: 'active',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: 3,
      title: 'iPhone 14 Pro - 256GB',
      price: 899.99,
      originalPrice: 1199.99,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
      seller: 'Mike R.',
      rating: 4.7,
      location: 'East Campus',
      timePosted: '3 hours ago',
      category: 'electronics',
      condition: 'Like New',
      description: 'Barely used iPhone with all original accessories.',
      views: 89,
      status: 'active',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 4,
      title: 'Chemistry Lab Manual',
      price: 25.99,
      originalPrice: 89.99,
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=300&fit=crop',
      seller: 'Emily S.',
      rating: 4.6,
      location: 'West Campus',
      timePosted: '5 hours ago',
      category: 'textbooks',
      condition: 'Good',
      description: 'Complete chemistry lab manual with all experiments.',
      views: 43,
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: 5,
      title: 'Gaming Chair - RGB',
      price: 149.99,
      originalPrice: 299.99,
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
      seller: 'Jason T.',
      rating: 4.8,
      location: 'North Campus',
      timePosted: '6 hours ago',
      category: 'furniture',
      condition: 'Excellent',
      description: 'Comfortable gaming chair with RGB lighting.',
      views: 67,
      status: 'active',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: 6,
      title: 'Coffee Maker - Keurig',
      price: 79.99,
      originalPrice: 149.99,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop',
      seller: 'Lisa W.',
      rating: 4.5,
      location: 'South Campus',
      timePosted: '8 hours ago',
      category: 'food',
      condition: 'Good',
      description: 'Single-serve coffee maker, perfect for dorm rooms.',
      views: 32,
      status: 'active',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
    }
  ];

  // Fetch listings on component mount
  useEffect(() => {
    fetchAllListings();
  }, []);

  const categories = [
    { id: 'all', name: 'All Items', icon: Grid3X3 },
    { id: 'textbooks', name: 'Textbooks', icon: BookOpen },
    { id: 'electronics', name: 'Electronics', icon: Laptop },
    { id: 'clothing', name: 'Clothing', icon: Shirt },
    { id: 'furniture', name: 'Furniture', icon: Home },
    { id: 'food', name: 'Food & Drinks', icon: Coffee },
    { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  ];

  // Filter handling functions
  const handlePriceRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [field]: parseInt(value)
      }
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

  const handleLocationChange = (location, checked) => {
    setFilters(prev => ({
      ...prev,
      locations: checked 
        ? [...prev.locations, location]
        : prev.locations.filter(l => l !== location)
    }));
  };

  const handleSortChange = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy
    }));
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

  // Enhanced filtering and sorting logic
  const filteredProducts = listings.filter(product => {
    // Search filter
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    // Price range filter
    const matchesPrice = product.price >= filters.priceRange.min && 
                        product.price <= filters.priceRange.max;

    // Condition filter
    const matchesCondition = filters.conditions.length === 0 || 
                           filters.conditions.includes(product.condition);

    // Location filter
    const matchesLocation = filters.locations.length === 0 || 
                          filters.locations.includes(product.location);

    return matchesSearch && matchesCategory && matchesPrice && matchesCondition && matchesLocation;
  }).sort((a, b) => {
    // Sorting logic
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
      case 'oldest':
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const toggleWishlist = (productId) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
    } else {
      newWishlist.add(productId);
    }
    setWishlist(newWishlist);
  };

  const addToCart = (productId) => {
    const newCart = new Set(cart);
    newCart.add(productId);
    setCart(newCart);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Contact seller function
  const contactSeller = (listing) => {
    console.log('Contacting seller for:', listing.title);
  };

  const openProductModal = (productId) => {
    setSelectedProductId(productId);
    setIsProductModalOpen(true);
  }

  const closeProductModal = () => {
    setSelectedProductId(null);
    setIsProductModalOpen(false);
  };

  const handleProductClick = (product) => {
    openProductModal(product.id);
  }

  const handleQuickView = (e, productId) => {
    e.stopPropagation();
    openProductModal(productId);
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.conditions.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (selectedCategory !== 'all') count++;
    if (searchQuery) count++;
    return count;
  };

  return (
    <div className={`dashboard ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      {/* Animated Background */}
      <div className="animated-background">
        <div
          className="gradient-overlay"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          }}
        />

        {/* Floating particles */}
        <div className="floating-particles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <button
              className="menu-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="logo">
              <Sparkles size={32} />
              <span>CampusMart</span>
            </div>
          </div>

          <div className="search-section">
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search for textbooks, electronics, furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-actions">
            <button className="action-button" onClick={toggleTheme}>
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="action-button">
              <Bell size={20} />
              <span className="badge">3</span>
            </button>

            <button className="action-button">
              <Heart size={20} />
              <span className="badge">{wishlist.size}</span>
            </button>

            <button className="action-button">
              <ShoppingCart size={20} />
              <span className="badge">{cart.size}</span>
            </button>

            <div className="user-profile">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-content">
            <button
              className="close-sidebar"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="category-section">
              <h3>Categories</h3>
              <div className="category-list">
                {categories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent size={20} />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-header">
                <h3>Filters</h3>
                {getActiveFilterCount() > 0 && (
                  <button 
                    className="clear-filters-btn"
                    onClick={clearAllFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Clear All ({getActiveFilterCount()})
                  </button>
                )}
              </div>

              <div className="filter-group">
                <label>Sort By</label>
                <select 
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    background: isDarkTheme ? '#333' : '#fff',
                    color: isDarkTheme ? '#fff' : '#000'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Price Range: ₹{filters.priceRange.min} - ₹{filters.priceRange.max}</label>
                <div className="price-range">
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
                  <div className="price-labels">
                    <span>₹0</span>
                    <span>₹10000+</span>
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <label>Condition ({filters.conditions.length} selected)</label>
                <div className="checkbox-group">
                  {['Like New', 'Excellent', 'Good', 'Fair'].map(condition => (
                    <label key={condition}>
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

              <div className="filter-group">
                <label>Location ({filters.locations.length} selected)</label>
                <div className="checkbox-group">
                  {['North Campus', 'South Campus', 'East Campus', 'West Campus'].map(location => (
                    <label key={location}>
                      <input 
                        type="checkbox"
                        checked={filters.locations.includes(location)}
                        onChange={(e) => handleLocationChange(location, e.target.checked)}
                      />
                      <span>{location}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="content-area">
          {/* Content Header */}
          <div className="content-header">
            <div className="results-info">
              <h2>Found {filteredProducts.length} items</h2>
              <p>
                {getActiveFilterCount() > 0 
                  ? `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} applied` 
                  : 'Best deals for students'
                }
              </p>
            </div>

            <div className="view-controls">
              <button 
                className={`filter-toggle ${getActiveFilterCount() > 0 ? 'has-filters' : ''}`}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Filter size={18} />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="filter-count">{getActiveFilterCount()}</span>
                )}
              </button>

              <div className="view-mode-toggle">
                <button
                  className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {getActiveFilterCount() > 0 && (
            <div className="active-filters" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px',
              padding: '12px',
              background: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: '8px'
            }}>
              {selectedCategory !== 'all' && (
                <span className="filter-tag">
                  Category: {categories.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('all')}>×</button>
                </span>
              )}
              {searchQuery && (
                <span className="filter-tag">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>×</button>
                </span>
              )}
              {filters.conditions.map(condition => (
                <span key={condition} className="filter-tag">
                  {condition}
                  <button onClick={() => handleConditionChange(condition, false)}>×</button>
                </span>
              ))}
              {filters.locations.map(location => (
                <span key={location} className="filter-tag">
                  {location}
                  <button onClick={() => handleLocationChange(location, false)}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Loading and Error States */}
          {loading && (
            <div className="loading-container" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              gap: '16px'
            }}>
              <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              <p>Loading amazing deals...</p>
            </div>
          )}

          {error && (
            <div className="error-container" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              gap: '16px',
              color: '#ef4444'
            }}>
              <AlertCircle size={48} />
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button
                onClick={fetchAllListings}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Products Container */}
          {!loading && !error && (
            <div className={`products-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
              {filteredProducts.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  gap: '16px',
                  opacity: 0.7
                }}>
                  <Search size={64} />
                  <h3>No items found</h3>
                  <p>Try adjusting your search or filters</p>
                  {getActiveFilterCount() > 0 && (
                    <button 
                      onClick={clearAllFilters}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="product-card">
                    <div className="product-image">
                      <img src={product.image} alt={product.title} />
                      <div className="product-overlay">
                        <button className="quick-view-button"
                        onClick={(e)=>handleQuickView(e,product.id)}>
                          <Eye size={18} />
                          Quick View
                        </button>
                      </div>
                      <button
                        className={`wishlist-button ${wishlist.has(product.id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                      >
                        <Heart size={18} />
                      </button>
                      <div className="condition-badge">
                        {product.condition}
                      </div>
                    </div>

                    <div className="product-info">
                      <h3 className="product-title">{product.title}</h3>

                      <div className="seller-info">
                        <div className="seller-details">
                          <User size={14} />
                          <span>{product.seller}</span>
                          <div className="rating">
                            <Star size={12} />
                            <span>{product.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="product-meta">
                        <div>
                          <MapPin size={14} />
                          <span>{product.location}</span>
                        </div>
                        <div>
                          <Clock size={14} />
                          <span>{product.timePosted}</span>
                        </div>
                        <div>
                          <Eye size={14} />
                          <span>{product.views} views</span>
                        </div>
                      </div>

                      <div className="price-section">
                        <div className="current-price">
                          <DollarSign size={20} />
                          {product.price}
                        </div>
                        {product.originalPrice > product.price && (
                          <>
                            <div className="original-price">
                              ₹{product.originalPrice}
                            </div>
                            <div className="savings">
                              Save ₹{(product.originalPrice - product.price).toFixed(2)}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="product-actions">
                        <button
                          className="add-to-cart-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product.id);
                          }}
                        >
                          <ShoppingCart size={16} />
                          Add to Cart
                        </button>
                        <button
                          className="contact-seller-button"
                          onClick={() => contactSeller(product)}
                        >
                          Contact Seller
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

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

        {selectedProductId && (
          <ProductViewModal
          productId={selectedProductId}
          isOpen={isProductModalOpen}
          onClose={closeProductModal}/>
        )}

    </div>
  );
};

export default BuyerDashboard;