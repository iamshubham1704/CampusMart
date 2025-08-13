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
import { useCart } from '../../components/contexts/CartContext';
import CartDrawer from '../../components/CartDrawer';
import ProductViewModal from './quick-view/page';

const BuyerDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [wishlist, setWishlist] = useState(new Set());
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Get cart context
  const { 
    totalItems, 
    addToCart, 
    isInCart, 
    openCart,
    isLoading: cartLoading 
  } = useCart();

  // Filter states
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    conditions: [],
    locations: [],
    sortBy: 'newest'
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

      const listingsArray = data.listings || [];
      console.log(`Found ${listingsArray.length} listings from API`);

      if (listingsArray.length === 0) {
        console.log('No listings found, using mock data');
        setListings(getMockData());
        return;
      }

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
      console.log('Using mock data as fallback');
      setListings(getMockData());
    } finally {
      setLoading(false);
    }
  };

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
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
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
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
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

  const filteredProducts = listings.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    const matchesPrice = product.price >= filters.priceRange.min && 
                        product.price <= filters.priceRange.max;

    const matchesCondition = filters.conditions.length === 0 || 
                           filters.conditions.includes(product.condition);

    const matchesLocation = filters.locations.length === 0 || 
                          filters.locations.includes(product.location);

    return matchesSearch && matchesCategory && matchesPrice && matchesCondition && matchesLocation;
  }).sort((a, b) => {
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

  // Updated addToCart function to use cart context
  const handleAddToCart = async (product) => {
    try {
      const success = await addToCart(product.id, 1);
      if (success) {
        console.log(`Added ${product.title} to cart`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

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

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.conditions.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (selectedCategory !== 'all') count++;
    if (searchQuery) count++;
    return count;
  };

  const styles = {
    dashboard: {
      minHeight: '100vh',
      backgroundColor: isDarkTheme ? '#0a0b14' : '#f8fafc',
      color: isDarkTheme ? '#e2e8f0' : '#1a202c',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    animatedBackground: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      background: isDarkTheme 
        ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 35%, transparent 60%)`
        : `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 35%, transparent 60%)`,
      transition: 'all 0.3s ease'
    },
    header: {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
      padding: '1rem 2rem'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    menuToggle: {
      display: 'none',
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '0.5rem',
      transition: 'background-color 0.2s',
      '@media (max-width: 768px)': {
        display: 'block'
      }
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1.5rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    searchSection: {
      flex: 1,
      maxWidth: '500px',
      margin: '0 2rem'
    },
    searchBar: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: isDarkTheme ? '#1e293b' : '#f1f5f9',
      border: `2px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
      borderRadius: '1rem',
      padding: '0.75rem 1rem',
      transition: 'all 0.3s ease'
    },
    searchInput: {
      flex: 1,
      background: 'none',
      border: 'none',
      outline: 'none',
      color: 'inherit',
      fontSize: '1rem',
      marginLeft: '0.5rem'
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    actionButton: {
      position: 'relative',
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      padding: '0.75rem',
      borderRadius: '0.75rem',
      transition: 'all 0.2s',
      backgroundColor: isDarkTheme ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 0.5)'
    },
    badge: {
      position: 'absolute',
      top: '0.25rem',
      right: '0.25rem',
      backgroundColor: '#ef4444',
      color: 'white',
      fontSize: '0.75rem',
      fontWeight: '600',
      borderRadius: '50%',
      width: '1.25rem',
      height: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    mainContent: {
      display: 'flex',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      gap: '2rem'
    },
    sidebar: {
      width: '300px',
      backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
      borderRadius: '1rem',
      padding: '1.5rem',
      height: 'fit-content',
      position: 'sticky',
      top: '120px',
      border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
      '@media (max-width: 768px)': {
        display: 'none'
      }
    },
    categorySection: {
      marginBottom: '2rem'
    },
    categoryList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      marginTop: '1rem'
    },
    categoryItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      background: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.2s',
      textAlign: 'left',
      width: '100%'
    },
    categoryItemActive: {
      backgroundColor: '#3b82f6',
      color: '#ffffff'
    },
    contentArea: {
      flex: 1
    },
    contentHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    resultsInfo: {
      flex: 1
    },
    viewControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    filterToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      backgroundColor: isDarkTheme ? '#334155' : '#f1f5f9',
      color: 'inherit',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      position: 'relative',
      transition: 'all 0.2s'
    },
    viewModeToggle: {
      display: 'flex',
      backgroundColor: isDarkTheme ? '#334155' : '#f1f5f9',
      borderRadius: '0.5rem',
      padding: '0.25rem'
    },
    viewButton: {
      padding: '0.5rem',
      border: 'none',
      background: 'none',
      color: 'inherit',
      cursor: 'pointer',
      borderRadius: '0.25rem',
      transition: 'all 0.2s'
    },
    viewButtonActive: {
      backgroundColor: '#3b82f6',
      color: '#ffffff'
    },
    productsContainer: {
      display: 'grid',
      gap: '1.5rem'
    },
    gridView: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
    },
    listView: {
      gridTemplateColumns: '1fr'
    },
    productCard: {
      backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
      borderRadius: '1rem',
      overflow: 'hidden',
      border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative'
    },
    productImage: {
      position: 'relative',
      height: '200px',
      overflow: 'hidden'
    },
    productImageImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    productOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.3s'
    },
    quickViewButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    wishlistButton: {
      position: 'absolute',
      top: '0.5rem',
      right: '0.5rem',
      padding: '0.5rem',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      transition: 'all 0.2s',
      zIndex: 10
    },
    wishlistButtonActive: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    conditionBadge: {
      position: 'absolute',
      top: '0.5rem',
      left: '0.5rem',
      padding: '0.25rem 0.5rem',
      backgroundColor: '#10b981',
      color: 'white',
      fontSize: '0.75rem',
      fontWeight: '600',
      borderRadius: '0.25rem'
    },
    productInfo: {
      padding: '1rem'
    },
    productTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      lineHeight: '1.4'
    },
    sellerInfo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.75rem'
    },
    sellerDetails: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.85rem',
      opacity: 0.8
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      color: '#fbbf24'
    },
    productMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '1rem',
      fontSize: '0.8rem',
      opacity: 0.7
    },
    productMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    priceSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1rem',
      flexWrap: 'wrap'
    },
    currentPrice: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#10b981'
    },
    originalPrice: {
      fontSize: '0.9rem',
      textDecoration: 'line-through',
      opacity: 0.6
    },
    savings: {
      fontSize: '0.8rem',
      color: '#ef4444',
      fontWeight: '600'
    },
    productActions: {
      display: 'flex',
      gap: '0.5rem'
    },
    addToCartButton: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.75rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      disabled: cartLoading
    },
    contactSellerButton: {
      flex: 1,
      padding: '0.75rem',
      backgroundColor: 'transparent',
      color: 'inherit',
      border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    filterTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      backgroundColor: isDarkTheme ? '#334155' : '#e2e8f0',
      borderRadius: '1rem',
      fontSize: '0.8rem',
      fontWeight: '500'
    },
    filterTagButton: {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontSize: '1rem',
      lineHeight: 1,
      marginLeft: '0.25rem'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1rem'
    },
    spinner: {
      animation: 'spin 1s linear infinite'
    },
    errorContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1rem',
      color: '#ef4444'
    },
    tryAgainButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      cursor: 'pointer'
    },
    noItemsContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1rem',
      opacity: 0.7
    },
    clearFiltersButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      cursor: 'pointer'
    },
    filterGroup: {
      marginBottom: '1.5rem'
    },
    filterLabel: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '600',
      marginBottom: '0.5rem'
    },
    filterSelect: {
      width: '100%',
      padding: '0.5rem',
      borderRadius: '0.25rem',
      border: '1px solid #ccc',
      backgroundColor: isDarkTheme ? '#333' : '#fff',
      color: isDarkTheme ? '#fff' : '#000'
    },
    priceRange: {
      marginTop: '0.5rem'
    },
    priceLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.8rem',
      opacity: 0.7,
      marginTop: '0.25rem'
    },
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.85rem',
      cursor: 'pointer'
    },
    sidebarOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999,
      display: 'none',
    }
  };

  return (
    <div style={styles.dashboard}>
      {/* Animated Background */}
      <div style={styles.animatedBackground} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <button
              style={styles.menuToggle}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div style={styles.logo}>
              <Sparkles size={32} />
              <span>CampusMart</span>
            </div>
          </div>

          <div style={styles.searchSection}>
            <div style={styles.searchBar}>
              <Search size={20} />
              <input
                style={styles.searchInput}
                type="text"
                placeholder="Search for textbooks, electronics, furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.headerActions}>
            <button style={styles.actionButton} onClick={toggleTheme}>
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button style={styles.actionButton}>
              <Bell size={20} />
              <span style={styles.badge}>3</span>
            </button>

            <button style={styles.actionButton}>
              <Heart size={20} />
              <span style={styles.badge}>{wishlist.size}</span>
            </button>

            <button style={styles.actionButton} onClick={openCart}>
              <ShoppingCart size={20} />
              {totalItems > 0 && <span style={styles.badge}>{totalItems}</span>}
            </button>

            <div style={styles.actionButton}>
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      <div style={styles.mainContent}>
        {/* Sidebar */}
        <aside style={{...styles.sidebar, display: isSidebarOpen ? 'block' : styles.sidebar.display}}>
          <div>
            <button
              style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', float: 'right'}}
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>

            <div style={styles.categorySection}>
              <h3>Categories</h3>
              <div style={styles.categoryList}>
                {categories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      style={{
                        ...styles.categoryItem,
                        ...(selectedCategory === category.id ? styles.categoryItemActive : {})
                      }}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent size={20} />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3>Filters</h3>
                {getActiveFilterCount() > 0 && (
                  <button 
                    onClick={clearAllFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Clear All ({getActiveFilterCount()})
                  </button>
                )}
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Sort By</label>
                <select 
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Price Range: ₹{filters.priceRange.min} - ₹{filters.priceRange.max}</label>
                <div style={styles.priceRange}>
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
                  <div style={styles.priceLabels}>
                    <span>₹0</span>
                    <span>₹10000+</span>
                  </div>
                </div>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Condition ({filters.conditions.length} selected)</label>
                <div style={styles.checkboxGroup}>
                  {['Like New', 'Excellent', 'Good', 'Fair'].map(condition => (
                    <label key={condition} style={styles.checkboxLabel}>
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

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Location ({filters.locations.length} selected)</label>
                <div style={styles.checkboxGroup}>
                  {['North Campus', 'South Campus', 'East Campus', 'West Campus'].map(location => (
                    <label key={location} style={styles.checkboxLabel}>
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
        <main style={styles.contentArea}>
          {/* Content Header */}
          <div style={styles.contentHeader}>
            <div style={styles.resultsInfo}>
              <h2>Found {filteredProducts.length} items</h2>
              <p>
                {getActiveFilterCount() > 0 
                  ? `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} applied` 
                  : 'Best deals for students'
                }
              </p>
            </div>

            <div style={styles.viewControls}>
              <button 
                style={{
                  ...styles.filterToggle,
                  ...(getActiveFilterCount() > 0 ? {backgroundColor: '#3b82f6', color: 'white'} : {})
                }}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Filter size={18} />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    padding: '0.125rem 0.375rem',
                    fontSize: '0.75rem',
                    marginLeft: '0.5rem'
                  }}>
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>

              <div style={styles.viewModeToggle}>
                <button
                  style={{
                    ...styles.viewButton,
                    ...(viewMode === 'grid' ? styles.viewButtonActive : {})
                  }}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  style={{
                    ...styles.viewButton,
                    ...(viewMode === 'list' ? styles.viewButtonActive : {})
                  }}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {getActiveFilterCount() > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: '0.5rem'
            }}>
              {selectedCategory !== 'all' && (
                <span style={styles.filterTag}>
                  Category: {categories.find(c => c.id === selectedCategory)?.name}
                  <button style={styles.filterTagButton} onClick={() => setSelectedCategory('all')}>×</button>
                </span>
              )}
              {searchQuery && (
                <span style={styles.filterTag}>
                  Search: "{searchQuery}"
                  <button style={styles.filterTagButton} onClick={() => setSearchQuery('')}>×</button>
                </span>
              )}
              {filters.conditions.map(condition => (
                <span key={condition} style={styles.filterTag}>
                  {condition}
                  <button style={styles.filterTagButton} onClick={() => handleConditionChange(condition, false)}>×</button>
                </span>
              ))}
              {filters.locations.map(location => (
                <span key={location} style={styles.filterTag}>
                  {location}
                  <button style={styles.filterTagButton} onClick={() => handleLocationChange(location, false)}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Loading and Error States */}
          {loading && (
            <div style={styles.loadingContainer}>
              <Loader2 size={48} style={styles.spinner} />
              <p>Loading amazing deals...</p>
            </div>
          )}

          {error && (
            <div style={styles.errorContainer}>
              <AlertCircle size={48} />
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button style={styles.tryAgainButton} onClick={fetchAllListings}>
                Try Again
              </button>
            </div>
          )}

          {/* Products Container */}
          {!loading && !error && (
            <div style={{
              ...styles.productsContainer,
              ...(viewMode === 'grid' ? styles.gridView : styles.listView)
            }}>
              {filteredProducts.length === 0 ? (
                <div style={styles.noItemsContainer}>
                  <Search size={64} />
                  <h3>No items found</h3>
                  <p>Try adjusting your search or filters</p>
                  {getActiveFilterCount() > 0 && (
                    <button style={styles.clearFiltersButton} onClick={clearAllFilters}>
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id}
                    onClick={() => handleProductClick(product)}
                    style={styles.productCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = isDarkTheme 
                        ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                      const overlay = e.currentTarget.querySelector('[data-overlay]');
                      if (overlay) overlay.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      const overlay = e.currentTarget.querySelector('[data-overlay]');
                      if (overlay) overlay.style.opacity = '0';
                    }}
                  >
                    <div style={styles.productImage}>
                      <img style={styles.productImageImg} src={product.image} alt={product.title} />
                      <div data-overlay style={styles.productOverlay}>
                        <button 
                          style={styles.quickViewButton}
                          onClick={(e) => handleQuickView(e, product.id)}
                        >
                          <Eye size={18} />
                          Quick View
                        </button>
                      </div>
                      <button
                        style={{
                          ...styles.wishlistButton,
                          ...(wishlist.has(product.id) ? styles.wishlistButtonActive : {})
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                      >
                        <Heart size={18} />
                      </button>
                      <div style={styles.conditionBadge}>
                        {product.condition}
                      </div>
                    </div>

                    <div style={styles.productInfo}>
                      <h3 style={styles.productTitle}>{product.title}</h3>

                      <div style={styles.sellerInfo}>
                        <div style={styles.sellerDetails}>
                          <User size={14} />
                          <span>{product.seller}</span>
                          <div style={styles.rating}>
                            <Star size={12} />
                            <span>{product.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div style={styles.productMeta}>
                        <div style={styles.productMetaItem}>
                          <MapPin size={14} />
                          <span>{product.location}</span>
                        </div>
                        <div style={styles.productMetaItem}>
                          <Clock size={14} />
                          <span>{product.timePosted}</span>
                        </div>
                        <div style={styles.productMetaItem}>
                          <Eye size={14} />
                          <span>{product.views} views</span>
                        </div>
                      </div>

                      <div style={styles.priceSection}>
                        <div style={styles.currentPrice}>
                          <DollarSign size={20} />
                          {product.price}
                        </div>
                        {product.originalPrice > product.price && (
                          <>
                            <div style={styles.originalPrice}>
                              ₹{product.originalPrice}
                            </div>
                            <div style={styles.savings}>
                              Save ₹{(product.originalPrice - product.price).toFixed(2)}
                            </div>
                          </>
                        )}
                      </div>

                      <div style={styles.productActions}>
                        <button
                          style={{
                            ...styles.addToCartButton,
                            opacity: cartLoading || isInCart(product.id) ? 0.6 : 1,
                            cursor: cartLoading || isInCart(product.id) ? 'not-allowed' : 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isInCart(product.id)) {
                              handleAddToCart(product);
                            }
                          }}
                          disabled={cartLoading || isInCart(product.id)}
                        >
                          <ShoppingCart size={16} />
                          {isInCart(product.id) ? 'In Cart' : 'Add to Cart'}
                        </button>
                        <button
                          style={styles.contactSellerButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            contactSeller(product);
                          }}
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
      {isSidebarOpen && <div style={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />}

      {/* Product Modal */}
      {selectedProductId && (
        <ProductViewModal
          productId={selectedProductId}
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
};

export default BuyerDashboard;