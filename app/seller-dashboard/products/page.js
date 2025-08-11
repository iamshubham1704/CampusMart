"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Edit3, Trash2, Eye, MapPin, Heart,
  Plus, Search, Filter, Grid, List, Loader2,
  AlertCircle, Calendar, Star, TrendingUp
} from 'lucide-react';
import styles from './Products.module.css'; // You'll need to create this CSS file
import { listingsAPI } from '../../utils/api';
import EditListingModal from '../../../components/EditListingModal';

const Products = () => {
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [editingListing, setEditingListing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

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

  // Fetch listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = getCurrentUser();
      if (!user) {
        router.push('/seller-login');
        return;
      }

      const response = await listingsAPI.getMyListings();
      if (response.success) {
        setMyListings(response.listings);
      } else {
        throw new Error(response.message || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load your listings');
      setMyListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [router]);

  // Handle edit listing
  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingListing(null);
  };

  const handleUpdateListing = () => {
    fetchListings(); // Refresh listings after update
    setShowEditModal(false);
    setEditingListing(null);
  };

  const handleDeleteListing = () => {
    fetchListings(); // Refresh listings after delete
    setShowEditModal(false);
    setEditingListing(null);
  };

  // Filter and sort listings
  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = myListings.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort listings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.datePosted) - new Date(a.createdAt || a.datePosted);
        case 'oldest':
          return new Date(a.createdAt || a.datePosted) - new Date(b.createdAt || b.datePosted);
        case 'priceHigh':
          return b.price - a.price;
        case 'priceLow':
          return a.price - b.price;
        case 'mostViewed':
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [myListings, searchQuery, selectedCategory, sortBy]);

  // Get unique categories from listings
  const categories = React.useMemo(() => {
    const categorySet = new Set(myListings.map(listing => listing.category).filter(Boolean));
    return Array.from(categorySet);
  }, [myListings]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalListings = myListings.length;
    const activeListings = myListings.filter(listing => listing.status === 'active').length;
    const totalViews = myListings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    const totalValue = myListings.reduce((sum, listing) => sum + listing.price, 0);

    return {
      totalListings,
      activeListings,
      totalViews,
      totalValue
    };
  }, [myListings]);

  // Grid view listing card
  const GridListingCard = ({ listing }) => (
    <div className={styles.gridCard}>
      <div className={styles.cardImageContainer}>
        <img
          src={listing.image || '/api/placeholder/300/200'}
          alt={listing.title}
          className={styles.cardImage}
        />
        <div className={styles.cardBadges}>
          <span className={`${styles.statusBadge} ${styles[listing.status || 'active']}`}>
            {listing.status || 'Active'}
          </span>
          {listing.condition && (
            <span className={styles.conditionBadge}>
              {listing.condition}
            </span>
          )}
        </div>
        <div className={styles.cardActions}>
          <button
            className={styles.actionButton}
            onClick={() => handleEditListing(listing)}
            title="Edit listing"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{listing.title}</h3>
        <div className={styles.cardPrice}>₹{listing.price.toLocaleString()}</div>
        
        <div className={styles.cardMeta}>
          <div className={styles.cardLocation}>
            <MapPin size={14} />
            {listing.location}
          </div>
          <div className={styles.cardViews}>
            <Eye size={14} />
            {listing.views || 0} views
          </div>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>
            <Calendar size={14} />
            {new Date(listing.createdAt || listing.datePosted).toLocaleDateString()}
          </span>
          <div className={styles.cardButtonGroup}>
            <button
              className={styles.editButton}
              onClick={() => handleEditListing(listing)}
            >
              <Edit3 size={14} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // List view listing card
  const ListListingCard = ({ listing }) => (
    <div className={styles.listCard}>
      <div className={styles.listImageContainer}>
        <img
          src={listing.image || '/api/placeholder/150/100'}
          alt={listing.title}
          className={styles.listImage}
        />
      </div>

      <div className={styles.listContent}>
        <div className={styles.listHeader}>
          <h3 className={styles.listTitle}>{listing.title}</h3>
          <div className={styles.listPrice}>₹{listing.price.toLocaleString()}</div>
        </div>

        <div className={styles.listMeta}>
          <span className={styles.listCategory}>{listing.category}</span>
          <span className={styles.listCondition}>{listing.condition}</span>
          <span className={styles.listLocation}>
            <MapPin size={14} />
            {listing.location}
          </span>
          <span className={styles.listViews}>
            <Eye size={14} />
            {listing.views || 0} views
          </span>
        </div>

        <p className={styles.listDescription}>
          {listing.description?.substring(0, 120)}...
        </p>

        <div className={styles.listFooter}>
          <span className={styles.listDate}>
            <Calendar size={14} />
            {new Date(listing.createdAt || listing.datePosted).toLocaleDateString()}
          </span>
          <div className={styles.listStatus}>
            <span className={`${styles.statusBadge} ${styles[listing.status || 'active']}`}>
              {listing.status || 'Active'}
            </span>
          </div>
          <div className={styles.listActions}>
            <button
              className={styles.editButton}
              onClick={() => handleEditListing(listing)}
            >
              <Edit3 size={14} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading your products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <h2>Error Loading Products</h2>
        <p>{error}</p>
        <button onClick={fetchListings} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.productsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>
              <Package className={styles.titleIcon} />
              My Products
            </h1>
            <p className={styles.pageSubtitle}>
              Manage and track all your listings
            </p>
          </div>
          <button
            className={styles.createButton}
            onClick={() => router.push('/seller-dashboard/create-listing')}
          >
            <Plus size={20} />
            New Listing
          </button>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Package size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalListings}</div>
              <div className={styles.statLabel}>Total Listings</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.activeListings}</div>
              <div className={styles.statLabel}>Active</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Eye size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalViews}</div>
              <div className={styles.statLabel}>Total Views</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Star size={20} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>₹{stats.totalValue.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search your products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.filtersSection}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="mostViewed">Most Viewed</option>
          </select>

          <div className={styles.viewModeToggle}>
            <button
              className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button
              className={`${styles.viewModeButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className={styles.resultsInfo}>
        <p>
          Showing {filteredAndSortedListings.length} of {myListings.length} products
          {searchQuery && (
            <span> for "{searchQuery}"</span>
          )}
          {selectedCategory !== 'all' && (
            <span> in {selectedCategory}</span>
          )}
        </p>
      </div>

      {/* Listings Grid/List */}
      <div className={styles.listingsContainer}>
        {filteredAndSortedListings.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={64} />
            <h3>
              {searchQuery || selectedCategory !== 'all' 
                ? 'No products found' 
                : 'No listings yet'
              }
            </h3>
            <p>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first listing to start selling on CampusMarket'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                className={styles.createFirstButton}
                onClick={() => router.push('/seller-dashboard/create-listing')}
              >
                <Plus size={20} />
                Create First Listing
              </button>
            )}
          </div>
        ) : (
          <div className={`${styles.listingsGrid} ${viewMode === 'list' ? styles.listView : styles.gridView}`}>
            {filteredAndSortedListings.map(listing => (
              viewMode === 'grid' ? (
                <GridListingCard key={listing.id} listing={listing} />
              ) : (
                <ListListingCard key={listing.id} listing={listing} />
              )
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
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

export default Products;