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
  AlertCircle,
  Settings,
  LogOut,
  Camera,
  Phone,
  Mail,
  Edit3,
  Save,
  Package,
  ChevronDown
} from 'lucide-react';
import { useCart } from '../../components/contexts/CartContext';
import CartDrawer from '../../components/CartDrawer';
import ProductViewModal from './quick-view/page';
import { useWishlist } from '../../components/contexts/WishlistContext';
import WishlistModal from './wishlist/page';
import Link from 'next/link';

// Updated useBuyer hook with real API integration
const useBuyer = () => {
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch buyer profile from API
  const fetchBuyerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
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
          window.location.href = '/buyer-login';
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();
      setBuyer(data.data);
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
      setError(error.message);

      // Fallback to mock data for development
      setBuyer({
        _id: '1',
        name: 'John Doe',
        email: 'john.doe@university.edu',
        phone: '+1 234 567 8900',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        location: 'North Campus',
        university: 'State University',
        year: 'Junior',
        createdAt: '2023-09-15T00:00:00.Z',
        verified: true,
        totalPurchases: 12,
        totalSaved: 2450,
        favoriteCategory: 'Electronics'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
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

  // Initialize buyer data on mount
  useEffect(() => {
    fetchBuyerProfile();
  }, []);

  return { buyer, updateProfile, loading, error, refetch: fetchBuyerProfile };
};

const ProfileModal = ({ isOpen, onClose, isDarkTheme }) => {
  const { buyer, updateProfile, loading } = useBuyer();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    College: '',
    year: ''
  });

  // Update form data when buyer data changes
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
    const result = await updateProfile(formData);
    if (result.success) {
      setIsEditing(false);
    } else {
      alert(`Failed to update profile: ${result.error}`);
    }
  };

  const handleLogout = () => {
    // Clear all possible token variations
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');

    // Redirect to login
    window.location.href = '/buyer-login';
  };

  if (!isOpen || !buyer) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  };

  const modalStyle = {
    backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
    color: isDarkTheme ? '#e2e8f0' : '#1a202c',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  };


  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          borderBottom: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
          paddingBottom: '1rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Profile</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = isDarkTheme ? '#334155' : '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <img
              src={buyer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer.name)}&size=120&background=3b82f6&color=ffffff`}
              alt={buyer.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #3b82f6'
              }}
            />
            <button style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Camera size={16} />
            </button>
          </div>

          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{buyer.name}</h3>
          <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>
            Member since {new Date(buyer.createdAt).toLocaleDateString()}
          </p>

          {buyer.verified && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              marginTop: '0.75rem',
              fontWeight: '500'
            }}>
              ✓ Verified Student
            </span>
          )}

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            width: '100%',
            marginTop: '1.5rem'
          }}>
           
            
            
          </div>
        </div>

        {/* Personal Information */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Personal Information</h3>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : isEditing ? <Save size={16} /> : <Edit3 size={16} />}
              {loading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'name', label: 'Name', icon: User, type: 'text' },
              { key: 'email', label: 'Email', icon: Mail, type: 'email' },
              { key: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
              { key: 'College', label: 'College', icon: BookOpen, type: 'text' },
            ].map(({ key, label, icon: Icon, type }) => (
              <div key={key}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  opacity: 0.7,
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  <Icon size={16} />
                  {label}
                </label>
                {isEditing ? (
                  <input
                    type={type}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                      border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`,
                      borderRadius: '0.5rem',
                      color: 'inherit',
                      fontSize: '0.9rem'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                    borderRadius: '0.5rem',
                    border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`
                  }}>
                    {buyer[key] || 'Not specified'}
                  </div>
                )}
              </div>
            ))}

            {/* Location and Year selects */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                opacity: 0.7,
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                <MapPin size={16} />
                Campus Location
              </label>
              {isEditing ? (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                    border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`,
                    borderRadius: '0.5rem',
                    color: 'inherit',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select Location</option>
                  <option value="MAIN CANTEEN">MAIN CANTEEN</option>
                  <option value="GROUND">GROUND</option>
                  <option value="LIBRARY">LIBRARY</option>
                  <option value="OTHER">OTHER</option>
                </select>
              ) : (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`
                }}>
                  {buyer.location || 'Not specified'}
                </div>
              )}
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                opacity: 0.7,
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                <BookOpen size={16} />
                Academic Year
              </label>
              {isEditing ? (
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                    border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`,
                    borderRadius: '0.5rem',
                    color: 'inherit',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select Year</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="Graduate">Graduated</option>
                </select>
              ) : (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`
                }}>
                  {buyer.year || 'Not specified'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          paddingTop: '1.5rem',
          borderTop: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`
        }}>
          <button
            onClick={() => {
              // Handle settings - you can add settings functionality here
              console.log('Settings clicked');
            }} style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: isDarkTheme ? '#334155' : '#f1f5f9',
              border: `1px solid ${isDarkTheme ? '#475569' : '#e2e8f0'}`,
              borderRadius: '0.5rem',
              color: 'inherit',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}>
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const BuyerDashboard = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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
  const { buyer, loading: buyerLoading, error: buyerError } = useBuyer();
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    conditions: [],
    locations: [],
    sortBy: 'newest'
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Mock data for development
  useEffect(() => {
    if (listings.length === 0) {
      setListings([
        {
          id: '1',
          title: 'Advanced Physics Textbook',
          description: 'Complete textbook for physics course',
          price: 500,
          originalPrice: 800,
          category: 'textbooks',
          condition: 'Like New',
          location: 'North Campus',
          seller: 'Alice Johnson',
          rating: 4.8,
          timePosted: '2 hours ago',
          views: 23,
          image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
          createdAt: '2023-12-01T10:00:00Z'
        },
        {
          id: '2',
          title: 'MacBook Pro 13"',
          description: 'Excellent condition laptop perfect for students',
          price: 45000,
          originalPrice: 65000,
          category: 'electronics',
          condition: 'Excellent',
          location: 'South Campus',
          seller: 'Bob Smith',
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

  // Mouse position for animated background
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

  // Categories
  const categories = [
    { id: 'all', name: 'All Items', icon: Grid3X3 },
    { id: 'textbooks', name: 'Textbooks', icon: BookOpen },
    { id: 'electronics', name: 'Electronics', icon: Laptop },
    { id: 'clothing', name: 'Clothing', icon: Shirt },
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

      // Update the API endpoint to match your structure
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
      // Keep your existing fallback mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
    if (!token) {
      // Optionally redirect to login if no token found
      // window.location.href = '/buyer-login';
      console.warn('No authentication token found');
    }
  }, []);

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
  const handleWishlistToggle = async (productId, event) => {
    event.stopPropagation();
    const success = await toggleWishlist(productId);
    if (success) {
      console.log('Wishlist updated successfully');
    }
  };

  const handleAddToCart = async (product) => {
    const success = await addToCart(product.id, 1);
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

  // Filter handlers
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

  const handleLocationChange = (location, checked) => {
    setFilters(prev => ({
      ...prev,
      locations: checked
        ? [...prev.locations, location]
        : prev.locations.filter(l => l !== location)
    }));
  };

  // Show loading state if buyer is still loading
  if (buyerLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkTheme ? '#0a0b14' : '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        color: isDarkTheme ? '#e2e8f0' : '#1a202c'
      }}>
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Styles
  const styles = {
    dashboard: {
      minHeight: '100vh',
      backgroundColor: isDarkTheme ? '#0a0b14' : '#f8fafc',
      color: isDarkTheme ? '#e2e8f0' : '#1a202c',
      position: 'relative',
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
    searchBar: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: isDarkTheme ? '#1e293b' : '#f1f5f9',
      border: `2px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
      borderRadius: '1rem',
      padding: '0.75rem 1rem',
      transition: 'all 0.3s ease',
      flex: 1,
      maxWidth: '500px',
      margin: '0 2rem'
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
      border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`
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
      width: '100%',
      marginBottom: '0.5rem'
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
    productsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
    },
    productsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    productCard: {
      backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
      borderRadius: '1rem',
      overflow: 'hidden',
      border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    productImage: {
      position: 'relative',
      height: viewMode === 'grid' ? '200px' : '150px',
      overflow: 'hidden'
    },
    productImageImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
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
      transition: 'background-color 0.2s'
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
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1rem'
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
    filterGroup: {
      marginBottom: '1.5rem'
    },
    filterLabel: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '600',
      marginBottom: '0.5rem'
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
    }
  };

  const openProductModal = (productId) => {
    setSelectedProductId(productId);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setSelectedProductId(null);
    setIsProductModalOpen(false);
  };

  return (
    <div style={styles.dashboard}>
      {/* Animated Background */}
      <div style={styles.animatedBackground} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem'
              }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div style={styles.logo}>
              <Sparkles size={32} />
              <span>CampusMart</span>
            </div>
          </div>

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
          <Link href="/seller-login"><button style={{backgroundColor: '#3b82f6',fontSize: '1rem', color: 'white', padding: '1rem', borderRadius: '0.5rem'}}>Sell Item</button></Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={styles.actionButton} onClick={() => setIsDarkTheme(!isDarkTheme)}>
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button style={styles.actionButton}>
              <Bell size={20} />
              <span style={styles.badge}>3</span>
            </button>

            <button style={styles.actionButton}>
              <Heart size={20}
                onClick={() => setIsWishlistOpen(true)} />
              {getWishlistCount() > 0 && <span style={styles.badge}>{getWishlistCount()}</span>}
            </button>

            <button style={styles.actionButton} onClick={openCart}>
              <ShoppingCart size={20} />
              {totalItems > 0 && <span style={styles.badge}>{totalItems}</span>}
            </button>

            <button
              style={styles.actionButton}
              onClick={() => setIsProfileOpen(true)}
            >
              {buyer && (
                <img
                  src={buyer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer.name)}&size=40&background=3b82f6&color=ffffff`}
                  alt={buyer.name}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) || <User size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div style={styles.mainContent}>
        {/* Sidebar */}
        <aside style={{
          ...styles.sidebar,
          display: isSidebarOpen ? 'block' : 'block',
        }}>
          <div>
            {/* Welcome Message */}
            {buyer && (
              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: isDarkTheme ? '#334155' : '#f8fafc',
                borderRadius: '0.75rem',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                  Welcome back, {buyer.name.split(' ')[0]}!
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
                  {buyer.university} • {buyer.location}
                </p>
              </div>
            )}

            {/* Categories */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Categories</h3>
              <div>
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
                      onMouseEnter={(e) => {
                        if (selectedCategory !== category.id) {
                          e.target.style.background = isDarkTheme ? '#334155' : '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== category.id) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                    >
                      <IconComponent size={20} />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Filters</h3>
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear All ({getActiveFilterCount()})
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`,
                    backgroundColor: isDarkTheme ? '#334155' : '#fff',
                    color: 'inherit'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Price Range */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  Price Range: ₹{filters.priceRange.min} - ₹{filters.priceRange.max}
                </label>
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={filters.priceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={filters.priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Condition */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  Condition ({filters.conditions.length} selected)
                </label>
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

              {/* Location */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  Location ({filters.locations.length} selected)
                </label>
                <div style={styles.checkboxGroup}>
                  {['MAIT', 'DTU', 'NSUT', 'DU'].map(location => (
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
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                Found {filteredProducts.length} items
              </h2>
              <p style={{ margin: 0, opacity: 0.7 }}>
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
                  ...(getActiveFilterCount() > 0 ? { backgroundColor: '#3b82f6', color: 'white' } : {})
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

          {/* Error Banner */}
          {(error || buyerError) && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={20} />
              <span>
                {error && `Listings: ${error}`}
                {error && buyerError && ' | '}
                {buyerError && `Profile: ${buyerError}`}
              </span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={styles.loadingContainer}>
              <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Loading amazing deals...</p>
            </div>
          )}

          {/* Products Container */}
          {!loading && (
            <div style={viewMode === 'grid' ? styles.productsGrid : styles.productsList}>
              {filteredProducts.length === 0 ? (
                <div style={styles.loadingContainer}>
                  <Search size={64} />
                  <h3>No items found</h3>
                  <p>Try adjusting your search or filters</p>
                  {getActiveFilterCount() > 0 && (
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    style={styles.productCard}
                    onClick={() => openProductModal(product.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = isDarkTheme
                        ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                        : '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={styles.productImage}>
                      <img style={styles.productImageImg} src={product.image} alt={product.title} />
                      <button
                        style={{
                          ...styles.wishlistButton,
                          ...(isInWishlist(product.id) ? styles.wishlistButtonActive : {})
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
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
                          ₹{product.price}
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
                            // Handle contact seller - could open a modal or navigate to chat
                            console.log('Contact seller for product:', product.id);
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
      />

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ProductViewModal
        productId={selectedProductId}
        isOpen={isProductModalOpen}
        onClose={isProductModalOpen ? () => setIsProductModalOpen(false) : null}
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