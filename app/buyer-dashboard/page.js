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

      <style jsx>{`
        /* Base Styles */
        .dashboard {
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          transition: all 0.5s ease;
        }

        .dark-theme {
          background: #0a0a0a;
          color: white;
        }

        .light-theme {
          background: #f8fafc;
          color: #1f2937;
        }

        /* Animated Background */
        .animated-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          z-index: -1;
        }

        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          transition: transform 0.1s ease-out;
        }

        .dark-theme .gradient-overlay {
          background: linear-gradient(135deg, #1a0b2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%);
          opacity: 0.1;
        }

        .light-theme .gradient-overlay {
          background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 25%, #e9d5ff 50%, #ddd6fe 75%, #c4b5fd 100%);
          opacity: 0.3;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .floating-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: float 8s ease-in-out infinite;
        }

        .dark-theme .particle {
          background: linear-gradient(45deg, #a855f7, #ec4899);
          box-shadow: 0 0 6px rgba(168, 85, 247, 0.4);
        }

        .light-theme .particle {
          background: linear-gradient(45deg, #8b5cf6, #a855f7);
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.6);
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1); 
            opacity: 0.4;
          }
          50% { 
            transform: translateY(-40px) rotate(180deg) scale(1.5); 
            opacity: 0.8;
          }
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid;
          transition: all 0.3s ease;
        }

        .dark-theme .header {
          background: rgba(17, 24, 39, 0.95);
          border-color: rgba(168, 85, 247, 0.2);
        }

        .light-theme .header {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .dark-theme .menu-toggle {
          color: white;
        }

        .light-theme .menu-toggle {
          color: #1f2937;
        }

        .menu-toggle:hover {
          transform: scale(1.05);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .logo svg {
          color: #a855f7;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        ..search-section {
          flex: 1;
          max-width: 1000px;
          margin: 0 2rem;
        }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
          border: 2px solid;
          border-radius: 24px;
          padding: 1.25rem 2rem;
          transition: all 0.3s ease;
          height: 68px;
          width: 100%;
        }

        .dark-theme .search-bar {
          background: rgba(31, 41, 55, 0.8);
          border-color: rgba(168, 85, 247, 0.2);
        }

        .light-theme .search-bar {
          background: rgba(243, 244, 246, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .search-bar:focus-within {
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
        }

        .dark-theme .search-bar:focus-within {
          border-color: #a855f7;
          background: rgba(31, 41, 55, 0.9);
        }

        .light-theme .search-bar:focus-within {
          border-color: #a855f7;
          background: rgba(243, 244, 246, 0.9);
        }

        .search-bar svg {
          margin-right: 0.75rem;
        }

        .dark-theme .search-bar svg {
          color: #6b7280;
        }

        .light-theme .search-bar svg {
          color: #4b5563;
        }

        .search-bar input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-size: 1rem;
        }

        .dark-theme .search-bar input {
          color: white;
        }

        .light-theme .search-bar input {
          color: #1f2937;
        }

        .search-bar input::placeholder {
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-left:18vw;
        }

        .action-button {
          position: relative;
          border: 1px solid;
          border-radius: 12px;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dark-theme .action-button {
          background: rgba(31, 41, 55, 0.8);
          border-color: rgba(168, 85, 247, 0.2);
          color: #6b7280;
        }

        .light-theme .action-button {
          background: rgba(243, 244, 246, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
          color: #4b5563;
        }

        .action-button:hover {
          color: #a855f7;
          border-color: #a855f7;
          transform: translateY(-2px) scale(1.05);
        }

        .dark-theme .action-button:hover {
          background: rgba(168, 85, 247, 0.1);
        }

        .light-theme .action-button:hover {
          background: rgba(168, 85, 247, 0.1);
        }

        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          min-width: 20px;
          text-align: center;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .user-profile {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          border-radius: 12px;
          padding: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .user-profile:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(168, 85, 247, 0.4);
        }

        /* Main Content */
        .main-content {
          display: flex;
          max-width: 1400px;
          margin: 0 auto;
          min-height: calc(100vh - 100px);
        }

        /* Sidebar */
        .sidebar {
          width: 300px;
          backdrop-filter: blur(20px);
          border-right: 1px solid;
          padding: 2rem;
          position: sticky;
          top: 100px;
          height: fit-content;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          transition: all 0.3s ease;
        }

        .dark-theme .sidebar {
          background: rgba(17, 24, 39, 0.8);
          border-color: rgba(168, 85, 247, 0.2);
        }

        .light-theme .sidebar {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .sidebar-content {
          position: relative;
        }

        .close-sidebar {
          display: none;
          position: absolute;
          top: -1rem;
          right: -1rem;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 0.5rem;
          color: #ef4444;
          cursor: pointer;
        }

        .category-section {
          margin-bottom: 2rem;
        }

        .category-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #a855f7;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: none;
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .dark-theme .category-item {
          color: #9ca3af;
        }

        .light-theme .category-item {
          color: #6b7280;
        }

        .category-item:hover {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.3);
          color: #a855f7;
          transform: translateX(5px);
        }

        .category-item.active {
          background: rgba(168, 85, 247, 0.2);
          border-color: #a855f7;
          color: #a855f7;
        }

        .filter-section {
          border-top: 1px solid;
          padding-top: 2rem;
        }

        .dark-theme .filter-section {
          border-color: rgba(75, 85, 99, 0.3);
        }

        .light-theme .filter-section {
          border-color: rgba(209, 213, 219, 0.3);
        }

        .filter-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #a855f7;
        }

        .filter-group {
          margin-bottom: 1.5rem;
        }

        .filter-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .dark-theme .filter-group > label {
          color: #d1d5db;
        }

        .light-theme .filter-group > label {
          color: #4b5563;
        }

        .price-range input {
          width: 100%;
          accent-color: #a855f7;
        }

        .price-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        .dark-theme .price-labels {
          color: #6b7280;
        }

        .light-theme .price-labels {
          color: #4b5563;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .checkbox-group label:hover {
          color: #a855f7;
        }

        .checkbox-group input[type="checkbox"] {
          accent-color: #a855f7;
        }

        .dark-theme .checkbox-group label {
          color: #9ca3af;
        }

        .light-theme .checkbox-group label {
          color: #6b7280;
        }

        /* Content Area */
        .content-area {
          flex: 1;
          padding: 2rem;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid;
        }

        .dark-theme .content-header {
          border-color: rgba(75, 85, 99, 0.3);
        }

        .light-theme .content-header {
          border-color: rgba(209, 213, 219, 0.3);
        }

        .results-info h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .results-info p {
          color: #6b7280;
        }

        .view-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .filter-toggle {
          display: none;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dark-theme .filter-toggle {
          background: rgba(31, 41, 55, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
          color: #6b7280;
        }

        .light-theme .filter-toggle {
          background: rgba(243, 244, 246, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
          color: #4b5563;
        }

        .filter-toggle:hover {
          color: #a855f7;
          border-color: #a855f7;
          background: rgba(168, 85, 247, 0.1);
        }

        .view-mode-toggle {
          display: flex;
          border: 1px solid;
          border-radius: 12px;
          overflow: hidden;
        }

        .dark-theme .view-mode-toggle {
          background: rgba(31, 41, 55, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .light-theme .view-mode-toggle {
          background: rgba(243, 244, 246, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .view-button {
          background: none;
          border: none;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dark-theme .view-button {
          color: #6b7280;
        }

        .light-theme .view-button {
          color: #4b5563;
        }

        .view-button.active {
          background: #a855f7;
          color: white;
        }

        .view-button:hover:not(.active) {
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
        }

        /* Products Container */
        .products-container {
          display: grid;
          gap: 2rem;
        }

        .grid-view {
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        }

        .list-view {
          grid-template-columns: 1fr;
        }

        .list-view .product-card {
          display: flex;
          align-items: center;
        }

        .list-view .product-image {
          width: 200px;
          height: 150px;
          flex-shrink: 0;
        }

        .list-view .product-info {
          flex: 1;
          margin-left: 1.5rem;
        }

        /* Product Card */
        .product-card {
          backdrop-filter: blur(20px);
          border: 1px solid;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          position: relative;
        }

        .dark-theme .product-card {
          background: rgba(17, 24, 39, 0.8);
          border-color: rgba(168, 85, 247, 0.2);
        }

        .light-theme .product-card {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .product-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: #a855f7;
          box-shadow: 
            0 20px 40px rgba(168, 85, 247, 0.2),
            0 0 0 1px rgba(168, 85, 247, 0.1);
        }

        .product-card:hover::before {
          opacity: 1;
        }

        .product-image {
          position: relative;
          width: 100%;
          height: 250px;
          overflow: hidden;
          background: #1f2937;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .product-card:hover .product-image img {
          transform: scale(1.1);
        }

        .product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .product-card:hover .product-overlay {
          opacity: 1;
        }

        .quick-view-button {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .quick-view-button:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(168, 85, 247, 0.4);
        }

        .wishlist-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          padding: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .wishlist-button:hover {
          background: rgba(236, 72, 153, 0.8);
          border-color: #ec4899;
          transform: scale(1.1);
        }

        .wishlist-button.active {
          background: #ec4899;
          border-color: #ec4899;
          color: white;
        }

        .condition-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          z-index: 10;
        }

        .product-info {
          padding: 1.5rem;
          position: relative;
          z-index: 5;
        }

        .product-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .seller-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .seller-details {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .dark-theme .seller-details {
          color: #9ca3af;
        }

        .light-theme .seller-details {
          color: #6b7280;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #fbbf24;
          margin-left: 0.5rem;
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }

        .dark-theme .product-meta {
          color: #6b7280;
        }

        .light-theme .product-meta {
          color: #4b5563;
        }

        .product-meta > div {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .price-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .current-price {
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: #10b981;
        }

        .original-price {
          text-decoration: line-through;
          font-size: 1rem;
        }

        .dark-theme .original-price {
          color: #6b7280;
        }

        .light-theme .original-price {
          color: #4b5563;
        }

        .savings {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .product-actions {
          display: flex;
          gap: 0.75rem;
        }

        .add-to-cart-button {
          flex: 1;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .add-to-cart-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
        }

        .contact-seller-button {
          border: 1px solid;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #a855f7;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dark-theme .contact-seller-button {
          background: rgba(31, 41, 55, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .light-theme .contact-seller-button {
          background: rgba(243, 244, 246, 0.8);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .contact-seller-button:hover {
          background: rgba(168, 85, 247, 0.1);
          border-color: #a855f7;
          transform: translateY(-2px);
        }

        /* Sidebar Overlay for Mobile */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: -300px;
            height: 100vh;
            z-index: 50;
            padding-top: 4rem;
            max-height: 100vh;
          }

          .sidebar.sidebar-open {
            left: 0;
          }

          .sidebar-overlay {
            display: block;
          }

          .close-sidebar {
            display: block;
          }

          .menu-toggle {
            display: block;
          }

          .content-area {
            padding: 1rem;
          }

          .filter-toggle {
            display: flex;
          }
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 0 1rem;
            gap: 1rem;
          }

          .search-section {
            max-width: none;
          }

          .header-actions {
            gap: 0.5rem;
          }

          .content-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .view-controls {
            align-self: flex-end;
          }

          .products-container.grid-view {
            grid-template-columns: 1fr;
          }

          .list-view .product-card {
            flex-direction: column;
          }

          .list-view .product-image {
            width: 100%;
            height: 200px;
          }

          .list-view .product-info {
            margin-left: 0;
          }
        }

        @media (max-width: 480px) {
          .logo span {
            display: none;
          }

          .search-bar {
            padding: 0.5rem;
          }

          .product-card {
            margin: 0 -0.5rem;
          }

          .product-actions {
            flex-direction: column;
          }

          .price-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }

        /* Scrollbar Styling */
        .sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
};

export default BuyerDashboard;