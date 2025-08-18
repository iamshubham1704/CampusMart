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
  Filter,
  Search,
  RefreshCw,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
// Removed the duplicate/incorrect CSS import: './OrderHistory.module.css'

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Orders', icon: Package, color: 'default' },
    { value: 'payment_pending_verification', label: 'Payment Pending', icon: Clock, color: 'warning' },
    { value: 'payment_verified', label: 'Payment Verified', icon: CheckCircle, color: 'success' },
    { value: 'will_be_delivered_soon', label: 'Will be Delivered Soon', icon: Info, color: 'info' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'success' },
    { value: 'payment_rejected', label: 'Payment Rejected', icon: XCircle, color: 'error' }
  ];

  // Fetch orders from API
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

  // Refresh orders
  const refreshOrders = async () => {
    setRefreshing(true);
    await fetchOrders(1, selectedStatus);
    setRefreshing(false);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    fetchOrders(1, status);
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    // Filter orders locally based on search query
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const productTitle = order.product?.title?.toLowerCase() || '';
    const sellerName = order.seller?.name?.toLowerCase() || '';
    const sellerEmail = order.seller?.email?.toLowerCase() || '';
    const statusMessage = order.statusMessage?.toLowerCase() || '';
    
    const matches = productTitle.includes(searchLower) ||
                   sellerName.includes(searchLower) ||
                   sellerEmail.includes(searchLower) ||
                   statusMessage.includes(searchLower);
    
    return matches;
  });

  // Get status icon and color
  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.icon : Package;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchOrders(page, selectedStatus);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  // Contact admin info
  const adminContact = {
    email: 'iamshubham1719@gmail.com',
    phone: '+91 9315863073'
  };

  if (loading && orders.length === 0) {
    return (
      <div className={styles.orderHistoryContainer}>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.spinner} />
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.orderHistoryContainer}>
      {/* Header */}
      <div className={styles.orderHistoryHeader}>
        <div className={styles.headerLeft}>
          <Link href="/buyer-dashboard" className={styles.backButton}>
            <ChevronLeft size={20} />
            Back to Dashboard
          </Link>
          <h1>Order History</h1>
          <p>Track all your orders and their current status</p>
        </div>
        
        <div className={styles.headerRight}>
          <button 
            className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
            onClick={refreshOrders}
            disabled={refreshing}
          >
            <RefreshCw size={20} className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search orders by product, seller, or status..."
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
                <IconComponent size={18} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Orders List */}
      <div className={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div className={styles.noOrders}>
            <Package size={64} />
            <h3>No orders found</h3>
            <p>
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You haven\'t placed any orders yet. Start shopping to see your order history here!'
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

          filteredOrders.map((order) => (
            <div key={order._id} className={styles.orderCard}>
              {/* Order Header */}
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <div className={styles.orderId}>
                    <Package size={18} />
                    Order #{order._id.toString().slice(-8).toUpperCase()}
                  </div>
                  <div className={styles.orderDate}>
                    <Calendar size={16} />
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className={styles.orderStatus}>
                  <div className={`${styles.statusBadge} ${styles[getStatusColor(order.status)]}`}>
                    {React.createElement(getStatusIcon(order.status), { size: 18 })}
                    {order.statusMessage}
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className={styles.orderContent}>
                <div className={styles.productSection}>
                  <div className={styles.productImage}>
                    {order.product.image ? (
                      <img 
                        src={order.product.image} 
                        alt={order.product.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className={styles.noImage}>
                        <Package size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.productDetails}>
                    <h3 className={styles.productTitle}>{order.product.title}</h3>
                    <div className={styles.productMeta}>
                      <span className={styles.category}>{order.product.category}</span>
                      <span className={styles.paymentMethod}>
                        <DollarSign size={14} />
                        {order.paymentMethod?.toUpperCase() || 'UPI'}
                      </span>
=======
          filteredOrders.map((order) => {
            
            return (
              <div key={order._id} className="orderCard">
                {/* Order Header */}
                <div className="orderHeader">
                  <div className="orderInfo">
                    <div className="orderId">
                      <Package size={18} />
                      Order #{order._id.toString().slice(-8).toUpperCase()}
                    </div>
                    <div className="orderDate">
                      <Calendar size={16} />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
=======
          filteredOrders.map((order) => {
            
            return (
              <div key={order._id} className="orderCard">
                {/* Order Header */}
                <div className="orderHeader">
                  <div className="orderInfo">
                    <div className="orderId">
                      <Package size={18} />
                      Order #{order._id.toString().slice(-8).toUpperCase()}
                    </div>
                    <div className="orderDate">
                      <Calendar size={16} />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="orderStatus">
                    <div className={`statusBadge ${getStatusColor(order.status)}`}>
                      {React.createElement(getStatusIcon(order.status), { size: 18 })}
                      {order.statusMessage}

                    </div>
                  </div>
                </div>


                <div className={styles.orderDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Amount:</span>
                    <span className={`${styles.value} ${styles.amount}`}>₹{order.amount}</span>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Seller:</span>
                    <span className={`${styles.value} ${styles.sellerName}`}>{order.seller.name}</span>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Contact:</span>
                    <div className={styles.contactInfo}>
                      <a href={`mailto:${order.seller.email}`} className={styles.contactLink}>
                        <Mail size={14} />
                        {order.seller.email}
                      </a>
                      {order.seller.phone && (
                        <a href={`tel:${order.seller.phone}`} className={styles.contactLink}>
                          <Phone size={14} />
                          {order.seller.phone}

                {/* Order Content */}
                <div className="orderContent">
                  <div className="productSection">
                    <div className="productImage">
                      {order.product && order.product.image && order.product.image !== 'https://via.placeholder.com/80x80?text=No+Image' ? (
                        <img 
                          src={order.product.image} 
                          alt={order.product.title || 'Product'}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="noImage">
                          <Package size={32} />
                        </div>
                      )}
                    </div>
                    
                    <div className="productDetails">
                      <h3 className="productTitle">
                        {order.product?.title || 'Product not found'}
                      </h3>
                      <div className="productMeta">
                        <span className="category">
                          {order.product?.category || 'Unknown Category'}
                        </span>
                        {order.product?.condition && (
                          <span className="condition">{order.product.condition}</span>
                        )}
                        <span className="paymentMethod">
                          <DollarSign size={14} />
                          {order.paymentMethod?.toUpperCase() || 'UPI'}
                        </span>
                      </div>
                      {order.product?.description && (
                        <p className="productDescription">{order.product.description}</p>
                      )}
                      {!order.product?.title && (
                        <p className="productDescription" style={{color: '#ef4444', fontStyle: 'italic'}}>
                          ⚠️ Product details could not be loaded. This may be due to a database issue.
                        </p>
                      )}
                    </div>
                  </div>                {/* Order Content */}
                <div className="orderContent">
                  <div className="productSection">
                    <div className="productImage">
                      {order.product && order.product.image && order.product.image !== 'https://via.placeholder.com/80x80?text=No+Image' ? (
                        <img 
                          src={order.product.image} 
                          alt={order.product.title || 'Product'}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="noImage">
                          <Package size={32} />
                        </div>
                      )}
                    </div>
                    
                    <div className="productDetails">
                      <h3 className="productTitle">
                        {order.product?.title || 'Product not found'}
                      </h3>
                      <div className="productMeta">
                        <span className="category">
                          {order.product?.category || 'Unknown Category'}
                        </span>
                        {order.product?.condition && (
                          <span className="condition">{order.product.condition}</span>
                        )}
                        <span className="paymentMethod">
                          <DollarSign size={14} />
                          {order.paymentMethod?.toUpperCase() || 'UPI'}
                        </span>
                      </div>
                      {order.product?.description && (
                        <p className="productDescription">{order.product.description}</p>
                      )}
                      {!order.product?.title && (
                        <p className="productDescription" style={{color: '#ef4444', fontStyle: 'italic'}}>
                          ⚠️ Product details could not be loaded. This may be due to a database issue.
                        </p>
                      )}
                    </div>
                  </div>


                  <div className="orderDetails">
                    <div className="detailRow">
                      <span className="label">Amount:</span>
                      <span className="value amount">₹{order.amount || 0}</span>
                    </div>
                    
                    <div className="detailRow">
                      <span className="label">Seller:</span>
                      <span className="value sellerName">
                        {order.seller?.name || 'Unknown Seller'}
                      </span>
                    </div>
                    
                    <div className="detailRow">
                      <span className="label">Contact:</span>
                      <div className="contactInfo">
                        <a href={`mailto:${order.seller?.email || '#'}`} className="contactLink">
                          <Mail size={14} />
                          {order.seller?.email || 'No email available'}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                        </a>
                        {order.seller?.phone && order.seller.phone !== 'No phone available' && (
                          <a href={`tel:${order.seller.phone}`} className="contactLink">
                            <Phone size={14} />
                            {order.seller.phone}
                          </a>
                        )}
                      </div>
                      
                      {(!order.seller?.name || !order.seller?.email) && (
                        <div className="detailRow">
                          <span className="label">Note:</span>
                          <span className="value" style={{color: '#ef4444', fontStyle: 'italic'}}>
                            Seller information incomplete
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
              {/* Order Actions */}
              <div className={styles.orderActions}>
                {order.status === 'payment_rejected' && (
                  <div className={styles.adminContactInfo}>
                    <AlertCircle size={16} />
                    <span>Payment was rejected. Contact admin for assistance:</span>
                    <div className={styles.adminContacts}>
                      <a href={`mailto:${adminContact.email}`} className={styles.adminContact}>
                        <Mail size={14} />
                        {adminContact.email}
                      </a>
                      <a href={`tel:${adminContact.phone}`} className={styles.adminContact}>
                        <Phone size={14} />
                        {adminContact.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {order.status === 'will_be_delivered_soon' && (
                  <div className={styles.deliveryInfo}>
                    <Info size={16} />
                    <span>Your order will be delivered soon. Admin will contact you for coordination.</span>
                  </div>
                )}
                
                {order.status === 'delivered' && (
                  <div className={styles.deliverySuccess}>
                    <CheckCircle size={16} />
                    <span>Order successfully delivered! Thank you for shopping with CampusMart.</span>
                  </div>
                )}
=======
                {/* Order Actions */}
                <div className="orderActions">
                  {order.status === 'payment_rejected' && (
                    <div className="adminContactInfo">
                      <AlertCircle size={16} />
                      <span>Payment was rejected. Contact admin for assistance:</span>
                      <div className="adminContacts">
                        <a href={`mailto:${adminContact.email}`} className="adminContact">
                          <Mail size={14} />
                          {adminContact.email}
                        </a>
                        <a href={`tel:${adminContact.phone}`} className="adminContact">
                          <Phone size={14} />
                          {adminContact.phone}
                        </a>
                      </div>
                    </div>
=======
                {/* Order Actions */}
                <div className="orderActions">
                  {order.status === 'payment_rejected' && (
                    <div className="adminContactInfo">
                      <AlertCircle size={16} />
                      <span>Payment was rejected. Contact admin for assistance:</span>
                      <div className="adminContacts">
                        <a href={`mailto:${adminContact.email}`} className="adminContact">
                          <Mail size={14} />
                          {adminContact.email}
                        </a>
                        <a href={`tel:${adminContact.phone}`} className="adminContact">
                          <Phone size={14} />
                          {adminContact.phone}
                        </a>
                      </div>
                    </div>
>>>>>>> Stashed changes
                  )}
                  
                  {order.status === 'will_be_delivered_soon' && (
                    <div className="deliveryInfo">
                      <Info size={16} />
                      <span>Your order will be delivered soon. Admin will contact you for coordination.</span>
                    </div>
                  )}
                  
                  {order.status === 'delivered' && (
                    <div className="deliverySuccess">
                      <CheckCircle size={16} />
                      <span>Order successfully delivered! Thank you for shopping with CampusMart.</span>
                    </div>
                  )}
                </div>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
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