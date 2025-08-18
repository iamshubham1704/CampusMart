"use client";
import React, { useState, useEffect } from 'react';
import styles from './OrderHistory.module.css'; // Correct import for CSS Modules
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User, // Added for Seller icon
  Tag, // Added for Category icon
} from 'lucide-react';
import Link from 'next/link';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Orders', icon: Package, color: 'default' },
    { value: 'payment_pending_verification', label: 'Payment Pending', icon: Clock, color: 'warning' },
    { value: 'payment_verified', label: 'Payment Verified', icon: CheckCircle, color: 'success' },
    { value: 'will_be_delivered_soon', label: 'Will be Delivered Soon', icon: Info, color: 'info' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'success' },
    { value: 'payment_rejected', label: 'Payment Rejected', icon: XCircle, color: 'error' }
  ];

  const fetchOrders = async (page = 1, status = selectedStatus) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (status && status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/buyer/order-history?${params}`, {
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
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.orders) {
        setOrders(data.data.orders || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setCurrentPage(page);
      } else {
        setOrders([]);
        setTotalPages(1);
        setCurrentPage(page);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    setRefreshing(true);
    await fetchOrders(1, selectedStatus);
    setRefreshing(false);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    fetchOrders(1, status);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const productTitle = order.product?.title?.toLowerCase() || '';
    const sellerName = order.seller?.name?.toLowerCase() || '';
    const sellerEmail = order.seller?.email?.toLowerCase() || '';
    const statusMessage = order.statusMessage?.toLowerCase() || '';
    
    return productTitle.includes(searchLower) ||
           sellerName.includes(searchLower) ||
           sellerEmail.includes(searchLower) ||
           statusMessage.includes(searchLower);
  });

  const getStatusInfo = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption || { icon: Package, color: 'default' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchOrders(page, selectedStatus);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const adminContact = {
    email: 'iamshubham1719@gmail.com',
    phone: '+91 9315863073'
  };

  if (loading && orders.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <RefreshCw size={48} className={styles.spinner} />
        <p>Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className={styles.orderHistoryContainer}>
      <div className={styles.orderHistoryHeader}>
        <div className={styles.headerLeft}>
          <Link href="/buyer-dashboard" className={styles.backButton}>
            <ChevronLeft size={20} />
            Back to Dashboard
          </Link>
          <h1>Order History</h1>
          <p>Track all your orders and their current status.</p>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
            onClick={refreshOrders}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by product, seller, or status..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className={styles.statusFilters}>
          {statusOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.value}
                className={`${styles.statusFilter} ${selectedStatus === option.value ? styles.active : ''} ${styles[option.color]}`}
                onClick={() => handleStatusChange(option.value)}
              >
                <IconComponent size={16} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div className={styles.noOrders}>
            <Package size={64} />
            <h3>No Orders Found</h3>
            <p>
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filters.'
                : "You haven't placed any orders yet. Start shopping to see them here!"
              }
            </p>
            {searchQuery || selectedStatus !== 'all' ? (
              <button 
                className={styles.clearFiltersButton}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  fetchOrders(1, 'all');
                }}
              >
                Clear All Filters
              </button>
            ) : (
              <Link href="/buyer-dashboard" className={styles.startShoppingButton}>
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;
            return (
            <div key={order._id} className={`${styles.orderCard} ${styles[statusInfo.color]}`}>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <h3 className={styles.productTitle}>
                    {order.product?.title || 'Product Not Found'}
                  </h3>
                  <div className={styles.orderMeta}>
                    <span>Order #{order._id.toString().slice(-8).toUpperCase()}</span>
                    <span><Calendar size={14} />{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div className={`${styles.statusBadge} ${styles[statusInfo.color]}`}>
                  <StatusIcon size={16} />
                  {order.statusMessage}
                </div>
              </div>

              <div className={styles.orderContent}>
                <div className={styles.productSection}>
                  <div className={styles.productImage}>
                    {order.product?.image && order.product.image !== 'https://via.placeholder.com/80x80?text=No+Image' ? (
                      <img 
                        src={order.product.image} 
                        alt={order.product.title || 'Product'}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=No+Image'; }}
                      />
                    ) : (
                      <div className={styles.noImage}><Package size={32} /></div>
                    )}
                  </div>
                  <div className={styles.productDetails}>
                    <div className={styles.productMetaTags}>
                      <span className={styles.category}><Tag size={14}/>{order.product?.category || 'Unknown'}</span>
                      {order.product?.condition && (
                        <span className={styles.condition}>{order.product.condition}</span>
                      )}
                    </div>
                     {order.product?.description && (
                       <p className={styles.productDescription}>{order.product.description}</p>
                     )}
                     {!order.product?.title && (
                       <p className={styles.productDescription} style={{color: '#ef4444'}}>
                         ⚠️ Product details could not be loaded.
                       </p>
                     )}
                  </div>
                </div>

                <div className={styles.orderDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}><DollarSign size={16}/>Amount Paid</span>
                    <span className={`${styles.value} ${styles.amount}`}>₹{order.amount}</span>
                  </div>
                  <div className={styles.detailRow}>
                     <span className={styles.label}><User size={16}/>Seller</span>
                     <span className={`${styles.value} ${styles.sellerName}`}>{order.seller.name}</span>
                  </div>
                   <div className={styles.detailRow}>
                      <span className={styles.label}><Phone size={16}/>Contact</span>
                      <div className={styles.contactInfo}>
                        <a href={`mailto:${order.seller.email}`} className={styles.contactLink}>
                          <Mail size={14} />
                        </a>
                        {order.seller.phone && (
                          <a href={`tel:${order.seller.phone}`} className={styles.contactLink}>
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                  </div>
                </div>
              </div>
              
                {order.status === 'payment_rejected' && (
                  <div className={`${styles.orderActions} ${styles.error}`}>
                    <AlertCircle size={18} />
                    <span>Payment was rejected. Contact admin for assistance at <a href={`mailto:${adminContact.email}`}>{adminContact.email}</a></span>
                  </div>
                )}
                {order.status === 'will_be_delivered_soon' && (
                  <div className={`${styles.orderActions} ${styles.info}`}>
                    <Info size={18} />
                    <span>Your order will be delivered soon. The admin will contact you for coordination.</span>
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div className={`${styles.orderActions} ${styles.success}`}>
                    <CheckCircle size={18} />
                    <span>Order successfully delivered! Thank you for shopping with us.</span>
                  </div>
                )}
            </div>
          )})
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <div className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </div>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;