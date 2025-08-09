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
  Moon
} from 'lucide-react';
import './BuyerDashboard.css'; 

const BuyerDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [wishlist, setWishlist] = useState(new Set());
  const [cart, setCart] = useState(new Set());
  const [isDarkTheme, setIsDarkTheme] = useState(true);

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
    { id: 'all', name: 'All Items', icon: Grid3X3 },
    { id: 'textbooks', name: 'Textbooks', icon: BookOpen },
    { id: 'electronics', name: 'Electronics', icon: Laptop },
    { id: 'clothing', name: 'Clothing', icon: Shirt },
    { id: 'furniture', name: 'Furniture', icon: Home },
    { id: 'food', name: 'Food & Drinks', icon: Coffee },
    { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  ];

  const products = [
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
      views: 24
    },
    {
      id: 2,
      title: 'MacBook Pro 2021 - M1 Chip',
      price: 1299.99,
      originalPrice: 1999.99,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop',
      seller: 'Alex K.',
      rating: 4.9,
      location: 'South Dorms',
      timePosted: '1 day ago',
      category: 'electronics',
      condition: 'Excellent',
      description: 'Perfect condition MacBook, comes with charger and case.',
      views: 156
    },
    {
      id: 3,
      title: 'Designer Winter Jacket',
      price: 45.00,
      originalPrice: 120.00,
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop',
      seller: 'Emma R.',
      rating: 4.7,
      location: 'West Campus',
      timePosted: '3 hours ago',
      category: 'clothing',
      condition: 'Good',
      description: 'Stylish winter jacket, size M. Perfect for cold weather.',
      views: 89
    },
    {
      id: 4,
      title: 'Mini Fridge - Compact',
      price: 75.00,
      originalPrice: 150.00,
      image: 'https://images.unsplash.com/photo-1586627733488-b16dd1c16d2a?w=300&h=300&fit=crop',
      seller: 'Mike T.',
      rating: 4.6,
      location: 'East Campus',
      timePosted: '5 hours ago',
      category: 'furniture',
      condition: 'Good',
      description: 'Perfect for dorm room. Clean and working perfectly.',
      views: 43
    },
    {
      id: 5,
      title: 'Gaming Headset - Wireless',
      price: 65.99,
      originalPrice: 129.99,
      image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=300&h=300&fit=crop',
      seller: 'Chris L.',
      rating: 4.8,
      location: 'North Campus',
      timePosted: '1 day ago',
      category: 'gaming',
      condition: 'Like New',
      description: 'Premium gaming headset with noise cancellation.',
      views: 78
    },
    {
      id: 6,
      title: 'Coffee Maker - Single Serve',
      price: 25.00,
      originalPrice: 59.99,
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop',
      seller: 'Lisa W.',
      rating: 4.5,
      location: 'Central Campus',
      timePosted: '6 hours ago',
      category: 'food',
      condition: 'Good',
      description: 'Perfect for quick morning coffee in your dorm.',
      views: 32
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
              <h3>Filters</h3>

              <div className="filter-group">
                <label>Price Range</label>
                <div className="price-range">
                  <input type="range" min="0" max="2000" />
                  <div className="price-labels">
                    <span>$0</span>
                    <span>$2000+</span>
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <label>Condition</label>
                <div className="checkbox-group">
                  {['Like New', 'Excellent', 'Good', 'Fair'].map(condition => (
                    <label key={condition}>
                      <input type="checkbox" />
                      <span>{condition}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>Location</label>
                <div className="checkbox-group">
                  {['North Campus', 'South Campus', 'East Campus', 'West Campus'].map(location => (
                    <label key={location}>
                      <input type="checkbox" />
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
              <p>Best deals for students</p>
            </div>

            <div className="view-controls">
              <button className="filter-toggle">
                <Filter size={18} />
                Filters
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

          {/* Products Container */}
          <div className={`products-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.title} />
                  <div className="product-overlay">
                    <button className="quick-view-button">
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
                    <div className="original-price">
                      ${product.originalPrice}
                    </div>
                    <div className="savings">
                      Save ${(product.originalPrice - product.price).toFixed(2)}
                    </div>
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
                    <button className="contact-seller-button">
                      Contact Seller
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

    </div>
  );
};

export default BuyerDashboard;