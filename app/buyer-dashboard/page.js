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
  Pen,
  MessageCircle
} from 'lucide-react';
import { useCart } from '../../components/contexts/CartContext';
import CartDrawer from '../../components/CartDrawer';
import ProductViewModal from './quick-view/page';
import { useWishlist } from '../../components/contexts/WishlistContext';
import WishlistModal from './wishlist/page';
import Link from 'next/link';
import { getStoredToken, isAuthenticated, redirectToLogin } from '../../lib/auth';
import './BuyerDashboard.css';

const useBuyer = () => {
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBuyerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Checking authentication for buyer dashboard...');
      
      // Check authentication first
      if (!isAuthenticated('buyer')) {
        console.log('Buyer not authenticated, redirecting to login');
        redirectToLogin('buyer');
        return;
      }

      const token = getStoredToken('buyer');
      if (!token) {
        console.log('No buyer token found, redirecting to login');
        redirectToLogin('buyer');
        return;
      }

      // Also check if we have the token in localStorage directly
      const directToken = localStorage.getItem('buyerToken') || localStorage.getItem('auth-token');
      if (!directToken) {
        console.log('No direct token found in localStorage, redirecting to login');
        redirectToLogin('buyer');
        return;
      }

      console.log('Token found, fetching buyer profile...');
      console.log('Using token:', token.substring(0, 20) + '...');

      // Use the direct token from localStorage for the API call
      const response = await fetch('/api/buyer/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${directToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized response, redirecting to login');
          redirectToLogin('buyer');
          return;
        }
        const errorText = await response.text();
        console.error('Profile fetch error:', errorText);
        
        // Try to parse as JSON for better error messages
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`Profile fetch failed: ${errorData.message || errorData.error || response.statusText}`);
        } catch (parseError) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Profile data received:', data);
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

      const token = getStoredToken('buyer');
      if (!token) {
        redirectToLogin('buyer');
        return;
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
          redirectToLogin('buyer');
          return;
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

const ProfileModal = ({ isOpen, onClose, isDarkTheme, buyer, loading, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    university: '',
    year: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

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
    if (!onUpdate) {
      setIsEditing(false);
      return;
    }
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess('');
      const payload = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        university: formData.university,
        year: formData.year
      };
      const result = await onUpdate(payload);
      if (result && result.success) {
        setSaveSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        setSaveError(result?.error || 'Failed to update profile');
      }
    } catch (e) {
      setSaveError(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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
          <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
            <a href={`mailto:${buyer.email}`} style={{ color: 'inherit', textDecoration: 'none', marginRight: 12 }}>
              <Mail size={14} style={{ marginRight: 4 }} /> {buyer.email}
            </a>
            {buyer.phone && (
              <a href={`tel:${buyer.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <Phone size={14} style={{ marginRight: 4 }} /> {buyer.phone}
              </a>
            )}
          </div>
        </div>

        <div className="personalInfo">
          <div className="personalInfoHeader">
            <h3>Personal Information</h3>
            <button
              className="editButton"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading || saving}
            >
              {(loading || saving) ? <Loader2 size={16} className="spinner" /> : isEditing ? <Save size={16} /> : <Edit3 size={16} />}
              {(loading || saving) ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          {(saveError || saveSuccess) && (
            <div style={{
              background: saveError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: saveError ? '#ef4444' : '#10b981',
              padding: '8px 12px',
              borderRadius: 8,
              marginBottom: 12
            }}>
              {saveError || saveSuccess}
            </div>
          )}

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
                    disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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

const conditions = ["Like New", "Excellent", "Good", "Fair"];

function ConditionFilter({ selectedConditions, onConditionChange }) {
  return (
    <div className="condition-filter">
      <h3 className="condition-header">
        <span className="condition-icon">📦</span> Condition
        <span className="condition-count">
          ({selectedConditions.length} selected)
        </span>
      </h3>

      <div className="condition-list">
        {conditions.map((condition) => (
          <label
            key={condition}
            className={`condition-item ${
              selectedConditions.includes(condition) ? "selected" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selectedConditions.includes(condition)}
              onChange={(e) => onConditionChange(condition, e.target.checked)}
              className="condition-checkbox"
            />
            <span className="condition-label">{condition}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

const BuyerDashboard = () => {
  // Mouse tracking state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const dashboardRef = useRef(null);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  // Location dropdown state
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const locationDropdownRef = useRef(null);

  // Available locations for dropdown
  const availableLocations = [
    'Maharaja Agrasen Institute of Technology (MAIT)',
    'Indian Institute of Technology Delhi (IIT Delhi)',
    'Delhi Technological University (DTU)',
    'Netaji Subhas University of Technology (NSUT)',
    'Indraprastha Institute of Information Technology Delhi (IIIT Delhi)',
    'Jamia Millia Islamia - Faculty of Engineering and Technology',
    'Guru Tegh Bahadur Institute of Technology (GTBIT)',
    'Bharati Vidyapeeth’s College of Engineering',
    'Bhagwan Parshuram Institute of Technology (BPIT)',
    'Maharaja Surajmal Institute of Technology (MSIT)',
    'Bhaskaracharya College of Applied Sciences',
    'Acharya Narendra Dev College',
    'Cluster Innovation Centre (CIC), University of Delhi',
    'Faculty of Technology, University of Delhi',
    'Ambedkar Institute of Technology',
    'School of Planning and Architecture (SPA), Delhi',
    'Indira Gandhi Delhi Technical University for Women (IGDTUW)',
    'Amity School of Engineering & Technology, Delhi',
    'Jamia Hamdard - School of Engineering Science & Technology',
    'Guru Premsukh Memorial College of Engineering',
    'National Institute of Technology Delhi (NIT Delhi)',
    'University School of Biotechnology',
    'University School of Chemical Technology',
    'University School of Information Technology',
    'University School of Automation and Robotics',
    'Dr. Akhilesh Das Gupta Institute of Professional Studies',
    'CBP Government Engineering College',
    'Govind Ballabh Pant Engineering College',
    'Delhi Institute of Tool Engineering',
    'Sushant School of Art and Architecture',
    'TVB School of Habitat Studies',
    'Vastu Kala Academy',
    'HMR Institute of Technology & Management',
    'Northern India Engineering College',
    'Fairfield Institute of Management and Technology',
    'Shri Ram College of Commerce (SRCC)',
    'Hindu College',
    'Hansraj College',
    'St. Stephen’s College',
    'Miranda House',
    'Lady Shri Ram College for Women (LSR)',
    'Ramjas College',
    'Kirori Mal College',
    'Daulat Ram College',
    'Indraprastha College for Women (IP College)',
    'Sri Venkateswara College',
    'Atma Ram Sanatan Dharma College (ARSD)',
    'Gargi College',
    'Maitreyi College',
    'Delhi College of Arts & Commerce (DCAC)'
  ];

  // Filter locations based on search
  const filteredLocations = availableLocations.filter(location =>
    location.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dashboardRef.current) {
        const rect = dashboardRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });

        // Update CSS var for searchBar glow
        const search = document.querySelector('.searchBar');
        if (search) {
          const mx = ((e.clientX - rect.left) / rect.width) * 100;
          search.style.setProperty('--mx', mx + '%');
        }
      }
    };

    const dashboard = dashboardRef.current;
    if (dashboard) {
      dashboard.addEventListener('mousemove', handleMouseMove);
      return () => dashboard.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

      const token = getStoredToken('buyer');
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
    setSelectedLocation('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.conditions.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (selectedCategory !== 'all') count++;
    if (searchQuery) count++;
    if (selectedLocation) count++;
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

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFilters(prev => ({
      ...prev,
      locations: location ? [location] : []
    }));
    setIsLocationDropdownOpen(false);
    setLocationSearchQuery('');
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
    // Remove body scroll lock when sidebar closes
    document.body.style.overflow = 'unset';
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
    // Prevent body scroll when sidebar is open on mobile
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    }
  };

  // Clean up body scroll lock on component unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Header scroll shrink effect
  useEffect(() => {
    const onScroll = () => {
      setIsHeaderScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fetch pending order count
  const fetchPendingOrderCount = async () => {
    try {
      const token = getStoredToken('buyer');
      if (!token) return;

      const response = await fetch('/api/buyer/order-history?page=1&limit=1000', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const orders = data.data?.orders || [];
        
        // Count orders that are pending delivery or in payment verification
        const pendingCount = orders.filter(order => {
          const status = order.displayStatus || order.status;
          return status === 'payment_pending_verification' || 
                 status === 'payment_verified' || 
                 status === 'will_be_delivered_soon';
        }).length;
        
        setPendingOrderCount(pendingCount);
      }
    } catch (error) {
      console.error('Error fetching pending order count:', error);
    }
  };

  useEffect(() => {
    fetchPendingOrderCount();
  }, []);

  useEffect(() => {
    if (buyer) {
      fetchPendingOrderCount();
    }
  }, [buyer]);

  // Refresh pending order count
  const refreshPendingOrderCount = async () => {
    await fetchPendingOrderCount();
  };

  // Expose refresh function for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshPendingOrderCount = refreshPendingOrderCount;
    }
  }, []);

  // Fetch buyer profile

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
    <div className={`dashboard ${isDarkTheme ? 'dark' : 'light'} ${isSidebarOpen ? 'sidebar-open' : ''}`} ref={dashboardRef}>
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
      <header className={`header ${isHeaderScrolled ? 'scrolled' : ''}`}>
        <div className="headerContent">
          <div className="logoSection">
            <button className="menuToggle" onClick={openSidebar} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div className="logo">
              <img src="/logo.png" alt="CampusMart" />
            </div>
          </div>

          <div className="searchSection">
            <div className="searchBar">
              <Search size={20} className="search-icon" />
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

            {/* <button className="actionButton">
              <Bell size={20} />
              <span className="badge">3</span>
            </button> */}

            {/* <button className="actionButton" onClick={() => setIsWishlistOpen(true)}>
              <Heart size={20} />
              {getWishlistCount() > 0 && <span className="badge">{getWishlistCount()}</span>}
            </button> */}

            <Link href="/buyer-dashboard/order-history" className="actionButton">
              <Package size={20} />
              {pendingOrderCount > 0 && <span className="badge">{pendingOrderCount}</span>}
            </Link>

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
            <button className="closeSidebar js-sidebar-close" onClick={closeSidebar}>
              <X size={20} />
            </button>

            {buyer && (
              <div className="welcomeMessage">
                <div className="greeting">
                  <div className="greeting-icon">👋</div>
                  <h3>Welcome back, {buyer.name?.split(' ')[0]}!</h3>
                </div>
                <div className="college-info">
                  <BookOpen size={18} className="college-icon" />
                  <span>{buyer.university || 'Student'}</span>
                  {buyer.year && <span>• {buyer.year} year</span>}
                </div>
                <div className="member-duration">
                  Member since {new Date(buyer.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            )}

            {/* Navigation Section */}
            <div className="navigationSection">
              <h3>
                <Package size={20} />
                My Account
              </h3>
              <div className="navigationList">
                <Link href="/buyer-dashboard" className="navItem active">
                  <Grid3X3 size={18} />
                  <span>Browse Items</span>
                </Link>
                <Link href="/buyer-dashboard/order-history" className="navItem">
                  <Package size={18} />
                  <span>Order History</span>
                  {pendingOrderCount > 0 && <span className="navBadge">{pendingOrderCount}</span>}
                </Link>
                <Link href="/buyer-dashboard/orders" className="navItem">
                  <ShoppingCart size={18} />
                  <span>My Orders</span>
                </Link>
                <Link href="/buyer-dashboard/messages" className="navItem">
                  <MessageCircle size={18} />
                  <span>Messages</span>
                </Link>
                <Link href="/buyer-dashboard/wishlist" className="navItem">
                  <Heart size={18} />
                  <span>Wishlist</span>
                </Link>
              </div>
            </div>

            <div className="categorySection">
              <h3>
                <Grid3X3 size={20} />
                Categories
              </h3>
              <div className="categoryList">
                {categories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      className={`categoryItem ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent size={22} className="category-icon" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="filterSection">
              <div className="filterHeader">
                <h3>
                  <Filter size={20} />
                  Filters
                </h3>
                {getActiveFilterCount() > 0 && (
                  <button className="clearFilters" onClick={clearAllFilters}>
                    Clear All ({getActiveFilterCount()})
                  </button>
                )}
              </div>

              <div className="filterGroup">
                <div className="priceRange">
                  <div className="price-label">
                    <DollarSign size={18} className="filter-icon" />
                    Price Range
                  </div>
                  <div className="priceSliderContainer">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={filters.priceRange.min}
                      onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                      className="priceSlider"
                    />
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={filters.priceRange.max}
                      onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                      className="priceSlider"
                    />
                  </div>
                  <div className="price-display">
                    <span className="min-price">₹{filters.priceRange.min}</span>
                    <span className="max-price">₹{filters.priceRange.max}</span>
                  </div>
                </div>
              </div>

              <div className="filterGroup">
                <ConditionFilter 
                  selectedConditions={filters.conditions}
                  onConditionChange={handleConditionChange}
                />
              </div>

              <div className="locationGroup">
                <label>
                  <MapPin size={18} className="filter-icon" />
                  College Location
                </label>
                <div className="locationSelector" ref={locationDropdownRef}>
                  <input
                    type="text"
                    className="locationInput js-location-dropdown"
                    placeholder="Select College Location"
                    value={selectedLocation}
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    onChange={() => {}} // Read-only for display
                    readOnly
                  />
                  <div className={`locationDropdown js-location-search ${isLocationDropdownOpen ? 'show' : ''}`}>
                    <div className="locationSearch">
                      <input
                        type="text"
                        className="locationSearchInput"
                        placeholder="Search locations..."
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="locationOptions">
                      <div
                        className="locationOption"
                        onClick={() => handleLocationSelect('')}
                      >
                        <span>All Locations</span>
                      </div>
                      {filteredLocations.map(location => (
                        <div
                          key={location}
                          className="locationOption"
                          onClick={() => handleLocationSelect(location)}
                        >
                          <span>{location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
                onClick={openSidebar}
              >
                <Filter size={18} />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="filterCount">{getActiveFilterCount()}</span>
                )}
              </button>
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
            <div className="productsContainer">
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
                          ₹{Math.round(
                            (product.finalPrice !== undefined
                              ? product.finalPrice
                              : (product.price || 0) + ((product.price || 0) * ((product.commission ?? 0) / 100))
                            )
                          )}
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
        onUpdate={updateBuyerProfile}
      />

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="sidebarOverlay js-sidebar-overlay show" onClick={closeSidebar} />}

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