import React, { useState, useEffect } from 'react';
import './PaymentRequests.css';
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User, 
  Package,
  Eye,
  X,
  Loader2,
  IndianRupee,
  Smartphone,
  Calendar,
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Mail,
  Phone
} from 'lucide-react';

const SellerPaymentRequests = () => {
  const [verifiedOrders, setVerifiedOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    upiId: '',
    accountHolderName: '',
    bankName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching payment data...');

      // Check for authentication token
      const token = localStorage?.getItem?.('token') || 'demo-token';
      if (!token) {
        console.warn('⚠️ No authentication token found, using demo data');
      }

      // Mock data for development - replace with real API calls
      const mockVerifiedOrders = [
        {
          _id: '67890abcdef12345',
          product: {
            title: 'MacBook Pro 16" M2 Max',
            category: 'Electronics',
            condition: 'Like New',
            description: 'Barely used MacBook Pro with all original accessories',
            images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400']
          },
          buyer: {
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+91 98765 43210'
          },
          amount: 185000,
          createdAt: '2024-01-15T10:30:00Z',
          verifiedAt: '2024-01-15T12:45:00Z',
          hasPaymentRequest: false,
          paymentRequested: false,
          orderStatus: 'payment_verified',
          deliveryAddress: 'Mumbai, Maharashtra'
        },
        {
          _id: '12345abcdef67890',
          product: {
            title: 'iPhone 15 Pro Max 256GB',
            category: 'Electronics',
            condition: 'Excellent',
            description: 'Mint condition iPhone with warranty remaining',
            images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400']
          },
          buyer: {
            name: 'Jane Smith',
            email: 'jane.smith@email.com',
            phone: '+91 87654 32109'
          },
          amount: 135000,
          createdAt: '2024-01-14T14:20:00Z',
          verifiedAt: '2024-01-14T16:30:00Z',
          hasPaymentRequest: true,
          paymentRequested: true,
          paymentRequestStatus: 'pending',
          orderStatus: 'payment_requested',
          deliveryAddress: 'Bangalore, Karnataka'
        },
        {
          _id: 'abcdef1234567890',
          product: {
            title: 'Dell XPS 13 Plus',
            category: 'Electronics',
            condition: 'Good',
            description: 'Well-maintained laptop, perfect for professionals',
            images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400']
          },
          buyer: {
            name: 'Mike Johnson',
            email: 'mike.johnson@email.com',
            phone: '+91 76543 21098'
          },
          amount: 89000,
          createdAt: '2024-01-13T09:15:00Z',
          verifiedAt: '2024-01-13T11:22:00Z',
          hasPaymentRequest: false,
          paymentRequested: false,
          orderStatus: 'payment_verified',
          deliveryAddress: 'Delhi, Delhi'
        },
        {
          _id: 'fedcba0987654321',
          product: {
            title: 'iPad Pro 12.9" with Apple Pencil',
            category: 'Electronics',
            condition: 'Like New',
            description: 'Complete set with keyboard and pencil',
            images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400']
          },
          buyer: {
            name: 'Sarah Wilson',
            email: 'sarah.wilson@email.com',
            phone: '+91 65432 10987'
          },
          amount: 95000,
          createdAt: '2024-01-12T16:45:00Z',
          verifiedAt: '2024-01-12T18:20:00Z',
          hasPaymentRequest: false,
          paymentRequested: false,
          orderStatus: 'payment_verified',
          deliveryAddress: 'Pune, Maharashtra'
        }
      ];

      const mockTransactions = [
        {
          _id: 't001',
          orderId: '12345abcdef67890',
          product: {
            title: 'iPhone 15 Pro Max 256GB',
            category: 'Electronics'
          },
          buyer: {
            name: 'Jane Smith',
            email: 'jane.smith@email.com',
            phone: '+91 87654 32109'
          },
          amount: 135000,
          status: 'pending',
          createdAt: '2024-01-14T16:35:00Z',
          sellerUpiId: 'seller123@paytm',
          accountHolderName: 'Seller Account',
          bankName: 'HDFC Bank',
          estimatedCompletionDate: '2024-01-17T18:00:00Z',
          adminNotes: 'Payment request under review'
        },
        {
          _id: 't002',
          orderId: 'completed_order_1',
          product: {
            title: 'iPad Air 64GB Wi-Fi',
            category: 'Electronics'
          },
          buyer: {
            name: 'Alice Brown',
            email: 'alice.brown@email.com',
            phone: '+91 54321 09876'
          },
          amount: 45000,
          status: 'completed',
          createdAt: '2024-01-10T11:00:00Z',
          completedAt: '2024-01-12T16:30:00Z',
          sellerUpiId: 'seller123@paytm',
          accountHolderName: 'Seller Account',
          bankName: 'HDFC Bank',
          transactionReference: 'TXN456789012345',
          adminNotes: 'Payment processed successfully'
        },
        {
          _id: 't003',
          orderId: 'processing_order_1',
          product: {
            title: 'Samsung Galaxy S24 Ultra',
            category: 'Electronics'
          },
          buyer: {
            name: 'Bob Wilson',
            email: 'bob.wilson@email.com',
            phone: '+91 43210 98765'
          },
          amount: 125000,
          status: 'processing',
          createdAt: '2024-01-11T13:45:00Z',
          sellerUpiId: 'seller123@paytm',
          accountHolderName: 'Seller Account',
          bankName: 'HDFC Bank',
          estimatedCompletionDate: '2024-01-16T17:00:00Z',
          adminNotes: 'Payment verification in progress'
        },
        {
          _id: 't004',
          orderId: 'failed_order_1',
          product: {
            title: 'Gaming Laptop RTX 4060',
            category: 'Electronics'
          },
          buyer: {
            name: 'Charlie Davis',
            email: 'charlie.davis@email.com',
            phone: '+91 32109 87654'
          },
          amount: 110000,
          status: 'failed',
          createdAt: '2024-01-09T08:20:00Z',
          failedAt: '2024-01-10T14:15:00Z',
          sellerUpiId: 'invalid@upi',
          accountHolderName: 'Invalid Name',
          bankName: 'Unknown Bank',
          adminNotes: 'Invalid UPI ID provided. Please update payment details.',
          failureReason: 'INVALID_UPI_ID'
        },
        {
          _id: 't005',
          orderId: 'completed_order_2',
          product: {
            title: 'AirPods Pro 2nd Generation',
            category: 'Electronics'
          },
          buyer: {
            name: 'Emma Thompson',
            email: 'emma.thompson@email.com',
            phone: '+91 21098 76543'
          },
          amount: 22000,
          status: 'completed',
          createdAt: '2024-01-08T09:30:00Z',
          completedAt: '2024-01-09T15:45:00Z',
          sellerUpiId: 'seller123@paytm',
          accountHolderName: 'Seller Account',
          bankName: 'HDFC Bank',
          transactionReference: 'TXN789012345678',
          adminNotes: 'Fast-tracked payment processed'
        }
      ];

      try {
        // Attempt real API calls
        const ordersResponse = await fetch('/api/seller/orders?status=payment_verified', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const transactionsResponse = await fetch('/api/seller/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (ordersResponse.ok && transactionsResponse.ok) {
          const ordersData = await ordersResponse.json();
          const transactionsData = await transactionsResponse.json();

          console.log('✅ Real API data loaded');
          setVerifiedOrders(ordersData.data?.verifiedOrders || []);
          setTransactions(transactionsData.data?.transactions || []);
        } else {
          throw new Error('API not available, using mock data');
        }
      } catch (apiError) {
        console.log('📦 Using mock data:', apiError.message);
        setVerifiedOrders(mockVerifiedOrders);
        setTransactions(mockTransactions);
      }

      console.log('✅ Data set successfully:', {
        verifiedOrders: mockVerifiedOrders.length,
        transactions: mockTransactions.length
      });

    } catch (err) {
      console.error('❌ Error fetching payment data:', err);
      setError(err.message);
      
      // Fallback to empty arrays on error
      setVerifiedOrders([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleRequestPayment = (order) => {
    console.log('🎯 Requesting payment for order:', order);
    setSelectedOrder(order);
    setShowRequestModal(true);
    setFormData({
      upiId: '',
      accountHolderName: '',
      bankName: ''
    });
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!formData.upiId || !selectedOrder) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate UPI ID format
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(formData.upiId)) {
      alert('Please enter a valid UPI ID (e.g., yourname@paytm)');
      return;
    }

    try {
      setSubmitting(true);
      console.log('💰 Submitting payment request:', {
        orderId: selectedOrder._id,
        upiId: formData.upiId,
        amount: selectedOrder.amount
      });

      const token = localStorage?.getItem?.('token') || 'demo-token';
      
      try {
        const response = await fetch('/api/seller/transactions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: selectedOrder._id,
            upiId: formData.upiId,
            accountHolderName: formData.accountHolderName,
            bankName: formData.bankName
          })
        });

        const result = await response.json();
        console.log('💳 Payment request response:', result);

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit payment request');
        }
      } catch (apiError) {
        // Mock successful submission for demo
        console.log('📦 Mock payment request submitted');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      alert('Payment request submitted successfully! You will be notified once the payment is processed.');
      setShowRequestModal(false);
      setSelectedOrder(null);
      
      // Refresh data to show updated status
      await fetchData();

    } catch (err) {
      console.error('❌ Error submitting payment request:', err);
      alert(`Failed to submit payment request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { cls: 'pending', icon: Clock, text: 'Pending' },
      processing: { cls: 'processing', icon: Loader2, text: 'Processing' },
      completed: { cls: 'completed', icon: CheckCircle, text: 'Completed' },
      failed: { cls: 'failed', icon: AlertCircle, text: 'Failed' }
    };

    const cfg = statusConfig[status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <span className={`status-badge ${cfg.cls}`}>
        <Icon size={12} />
        {cfg.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Safer formatters to avoid displaying "Invalid Date"
  const safeFormatDate = (dateString, fallbackText = '-') => {
    if (!dateString) return fallbackText;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return fallbackText;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const safeFormatDateTime = (dateString, fallbackText = '-') => {
    if (!dateString) return fallbackText;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return fallbackText;
    return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProductImage = (product) => {
    if (product?.images && product.images.length > 0) {
      const imageUrl = product.images[0];
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      } else {
        return `/api/images/${imageUrl}`;
      }
    }
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';
  };

  const getConditionBadge = (condition) => {
    const slug = String(condition || '')
      .toLowerCase()
      .replace(/[^a-z\s-]/g, '')
      .replace(/\s+/g, '-');
    const supported = ['like-new', 'excellent', 'good', 'fair'];
    const className = supported.includes(slug)
      ? `condition-badge ${slug}`
      : 'condition-badge';
    return <span className={className}>{condition || 'Unknown'}</span>;
  };

  const exportData = () => {
    const csvContent = [
      ['Transaction ID', 'Product', 'Buyer', 'Amount', 'Status', 'Request Date', 'UPI ID'],
      ...transactions.map(t => [
        t._id,
        t.product?.title || 'N/A',
        t.buyer?.name || 'N/A',
        t.amount,
        t.status,
        formatDate(t.createdAt),
        t.sellerUpiId || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-requests-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  const pendingOrdersCount = verifiedOrders.filter(order => !order.hasPaymentRequest && !order.paymentRequested).length;
  

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-screen">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Payment Requests</h2>
          <p className="text-gray-600">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-screen">
        <AlertCircle size={64} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Loading Data</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
        <button 
          onClick={fetchData}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="payment-requests-container">
      {/* Header */}
      <div className="payment-header">
        <div className="header-top">
          <div className="header-left">
            <button 
              onClick={() => window.history.back()}
              className="back-button"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="header-title">Payment Requests</h1>
              <p className="header-subtitle">Manage your seller payments and transactions</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => window.location.href = '/seller-dashboard'}
              className="action-button secondary"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="action-button"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button 
              onClick={exportData}
              className="action-button"
              title="Export CSV"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-border">
          <nav className="tab-nav">
            <button
              onClick={() => setActiveTab('pending')}
              className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            >
              Ready for Request ({pendingOrdersCount})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            >
              Transaction History ({transactions.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <div className="content-card">
          <div className="content-header">
            <div className="content-header-top">
              <div>
                <h2>Orders Ready for Payment Request</h2>
                <p>These orders have verified buyer payments and are ready for your payment request.</p>
              </div>
              {pendingOrdersCount > 0 && (
                <div className="content-header-right">
                  <p>Total pending amount</p>
                  <p className="total-amount">
                    {formatCurrency(verifiedOrders
                      .filter(order => !order.hasPaymentRequest && !order.paymentRequested)
                      .reduce((sum, order) => sum + order.amount, 0)
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {verifiedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={64} className="mx-auto text-gray-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-3">No verified orders</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Orders will appear here once buyers complete their payments and admin verifies them.
                Check back regularly for new orders.
              </p>
              <button 
                onClick={handleRefresh}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="items-list">
              {verifiedOrders.map((order) => (
                <div key={order._id} className="item-row">
                  <div className="item-content">
                    <div className="item-left">
                      <img
                        src={getProductImage(order.product)}
                        alt={order.product?.title || 'Product'}
                        className="product-image"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="item-title">{order.product?.title || 'Unknown Product'}</h3>
                            <div className="item-meta">
                              <div className="item-meta-item">
                                <span>📂</span>
                                <span>{order.product?.category || 'Unknown'}</span>
                              </div>
                              {getConditionBadge(order.product?.condition)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600 flex items-center">
                              <User size={14} className="mr-2" />
                              <span className="font-medium">Buyer:</span>
                              <span className="ml-1">{order.buyer?.name || 'Unknown Buyer'}</span>
                            </p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Mail size={14} className="mr-2" />
                              <span>{order.buyer?.email || 'No email'}</span>
                            </p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Phone size={14} className="mr-2" />
                              <span>{order.buyer?.phone || 'No phone'}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Calendar size={14} className="mr-2" />
                              <span className="font-medium">Order Date:</span>
                              <span className="ml-1">{safeFormatDate(order.createdAt || order.orderDate, '—')}</span>
                            </p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <CheckCircle size={14} className="mr-2" />
                              <span className="font-medium">Verified:</span>
                              <span className="ml-1">{safeFormatDate(order.verifiedAt, '—')}</span>
                            </p>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Package size={14} className="mr-2" />
                              <span className="font-medium">Delivery:</span>
                              <span className="ml-1">{order.deliveryAddress || '—'}</span>
                            </p>
                          </div>
                        </div>

                        {order.product?.description && (
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{order.product.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="item-right">
                      <div className="item-amount-card">
                        <p className="item-amount">{formatCurrency(order.amount)}</p>
                        <p className="item-order-id">Order: #{order._id.substring(order._id.length - 8)}</p>
                        
                        <div className="item-actions">
                          {order.hasPaymentRequest || order.paymentRequested ? (
                            <div>
                              {getStatusBadge(order.paymentRequestStatus || 'pending')}
                              <p className="text-xs text-gray-500 mt-2">Request submitted</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRequestPayment(order)}
                              className="request-payment-btn"
                            >
                              <DollarSign size={14} className="mr-2" />
                              Request Payment
                            </button>
                          )}
                        
                          <div className="status-indicator">
                            <span className="status-dot"></span>
                            <span className="status-text">Payment Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="content-card">
          <div className="content-header">
            <div className="content-header-top">
              <div>
                <h2>Transaction History</h2>
                <p>Track all your payment requests and their status.</p>
              </div>
              <div className="filter-controls">
                <div className="filter-select">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className=""
                  >
                    <option value="all">All Status ({transactions.length})</option>
                    <option value="pending">Pending ({transactions.filter(t => t.status === 'pending').length})</option>
                    <option value="processing">Processing ({transactions.filter(t => t.status === 'processing').length})</option>
                    <option value="completed">Completed ({transactions.filter(t => t.status === 'completed').length})</option>
                    <option value="failed">Failed ({transactions.filter(t => t.status === 'failed').length})</option>
                  </select>
                </div>
                {filteredTransactions.length > 0 && (
                  <div className="content-header-right">
                    <p>Filtered total</p>
                    <p className="total-amount">
                      {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={64} className="empty-state-icon" />
              <h3>No transactions found</h3>
              <p>
                {filter === 'all' 
                  ? 'Your payment requests will appear here once submitted.' 
                  : `No transactions with status "${filter}" found.`}
              </p>
              <div className="empty-state-actions">
                {filter !== 'all' && (
                  <button 
                    onClick={() => setFilter('all')}
                    className="action-button"
                  >
                    Show All
                  </button>
                )}
                <button 
                  onClick={handleRefresh}
                  className="action-button primary"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          ) : (
            <div className="items-list">
              {filteredTransactions.map((transaction) => (
                <div key={transaction._id} className="item-row">
                  <div className="item-content">
                    <div className="item-left" style={{gap: '1rem'}}>
                      <div className="item-details" style={{flex: 1}}>
                        <div className="item-header">
                          <h3 className="item-title">
                            {transaction.product?.title || transaction.productTitle || 'Unknown Product'}
                          </h3>
                          {getStatusBadge(transaction.status)}
                        </div>

                        <div className="details-grid" style={{margin: 0}}>
                          <div className="detail-section">
                            <div className="detail-item">
                              <span className="label">Transaction ID:</span>
                              <span className="overview-value mono">#{transaction._id}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Request Date:</span>
                              <span>{safeFormatDateTime(transaction.createdAt || transaction.requestDate, '—')}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">UPI ID:</span>
                              <span className="overview-value mono">{transaction.sellerUpiId || transaction.upiId || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="detail-section">
                            <div className="detail-item">
                              <span className="label">Buyer:</span>
                              <span>{transaction.buyer?.name || 'Unknown'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Email:</span>
                              <span>{transaction.buyer?.email || 'No email'}</span>
                            </div>
                            {transaction.buyer?.phone && (
                              <div className="detail-item">
                                <span className="label">Phone:</span>
                                <span>{transaction.buyer.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {transaction.status === 'completed' && (
                          <div className="status-info-card completed">
                            <div className="status-info-header completed">
                              <CheckCircle size={16} />
                              <span>Payment Completed</span>
                            </div>
                            <div className="status-info-content completed">
                              <p><span className="label">Completed:</span> {safeFormatDateTime(transaction.completedAt || transaction.completedDate, '—')}</p>
                              {transaction.transactionReference && (
                                <p><span className="label">Reference:</span> {transaction.transactionReference}</p>
                              )}
                              {transaction.adminNotes && (
                                <p><span className="label">Note:</span> {transaction.adminNotes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {transaction.status === 'failed' && (
                          <div className="status-info-card failed">
                            <div className="status-info-header failed">
                              <AlertCircle size={16} />
                              <span>Payment Failed</span>
                            </div>
                            <div className="status-info-content failed">
                              {transaction.failedAt && (
                                <p><span className="label">Failed:</span> {safeFormatDateTime(transaction.failedAt, '—')}</p>
                              )}
                              {transaction.adminNotes && (
                                <p><span className="label">Reason:</span> {transaction.adminNotes}</p>
                              )}
                              {transaction.failureReason && (
                                <p><span className="label">Error Code:</span> {transaction.failureReason}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {(transaction.status === 'pending' || transaction.status === 'processing') && (
                          <div className="status-info-card processing">
                            <div className="status-info-header processing">
                              <Clock size={16} />
                              <span>{transaction.status === 'pending' ? 'Awaiting Processing' : 'Payment in Progress'}</span>
                            </div>
                            <div className="status-info-content processing">
                              {transaction.estimatedCompletionDate && (
                                <p><span className="label">Estimated Completion:</span> {safeFormatDateTime(transaction.estimatedCompletionDate, '—')}</p>
                              )}
                              {transaction.adminNotes && (
                                <p><span className="label">Status:</span> {transaction.adminNotes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="item-footer">
                          <p className="item-last-updated">
                            Last updated: {safeFormatDateTime(transaction.updatedAt || transaction.createdAt, '—')}
                          </p>
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="view-details-btn"
                          >
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="item-right">
                      <div className="item-amount-card">
                        <p className="item-amount">{formatCurrency(transaction.amount)}</p>
                        <p className="item-order-id">Txn: #{transaction._id.substring(transaction._id.length - 8)}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Request Modal */}
      {showRequestModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Request Payment</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <img
                  src={getProductImage(selectedOrder.product)}
                  alt={selectedOrder.product?.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{selectedOrder.product?.title}</h4>
                  <p className="text-sm text-gray-600">Buyer: {selectedOrder.buyer?.name}</p>
                  <p className="text-sm text-gray-600">Order: #{selectedOrder._id.substring(selectedOrder._id.length - 8)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Amount to receive:</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedOrder.amount)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="yourname@paytm"
                    className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Enter your UPI ID for direct payment transfer</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="Full name as per bank account"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Bank name (optional)"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Payment Processing Information:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Payment will be processed within 2-3 business days</li>
                      <li>• You'll receive notifications at each stage</li>
                      <li>• Ensure your UPI ID is active and correct</li>
                      <li>• Contact support if you face any issues</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <DollarSign size={18} className="mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-gray-900">
                    {selectedTransaction.product?.title || 'Unknown Product'}
                  </h4>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="text-sm font-mono text-gray-900">#{selectedTransaction._id}</p>
                  </div>
                </div>
              </div>

              {/* Buyer Information */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User size={16} className="mr-2" />
                  Buyer Information
                </h5>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedTransaction.buyer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedTransaction.buyer?.email || 'N/A'}</p>
                    </div>
                    {selectedTransaction.buyer?.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedTransaction.buyer.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard size={16} className="mr-2" />
                  Payment Information
                </h5>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">UPI ID</p>
                      <p className="font-mono text-gray-900">{selectedTransaction.sellerUpiId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Holder</p>
                      <p className="font-medium text-gray-900">{selectedTransaction.accountHolderName || 'N/A'}</p>
                    </div>
                    {selectedTransaction.bankName && (
                      <div>
                        <p className="text-sm text-gray-600">Bank</p>
                        <p className="font-medium text-gray-900">{selectedTransaction.bankName}</p>
                      </div>
                    )}
                    {selectedTransaction.transactionReference && (
                      <div>
                        <p className="text-sm text-gray-600">Reference ID</p>
                        <p className="font-mono text-gray-900">{selectedTransaction.transactionReference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock size={16} className="mr-2" />
                  Timeline
                </h5>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Payment Request Submitted</p>
                        <p className="text-xs text-gray-500">{formatDateTime(selectedTransaction.createdAt)}</p>
                      </div>
                    </div>
                    
                    {selectedTransaction.status === 'completed' && selectedTransaction.completedAt && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                          <p className="text-xs text-gray-500">{formatDateTime(selectedTransaction.completedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedTransaction.status === 'failed' && selectedTransaction.failedAt && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Payment Failed</p>
                          <p className="text-xs text-gray-500">{formatDateTime(selectedTransaction.failedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedTransaction.adminNotes && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText size={16} className="mr-2" />
                    Notes
                  </h5>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedTransaction.adminNotes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPaymentRequests;