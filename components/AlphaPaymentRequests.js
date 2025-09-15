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
  FileText,
  Mail,
  Phone,
  Shield,
  Search
} from 'lucide-react';

const AlphaPaymentRequests = () => {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [filter, setFilter] = useState('all'); // all | pending | requested | paid | failed
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching alpha payment requests...');

      const token = localStorage?.getItem?.('alphaToken');
      if (!token) {
        console.error('❌ No alpha token found');
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/alpha/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📦 Payment requests response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        const errorData = await response.json();
        console.error('❌ Payment requests API error response:', errorData);
        throw new Error(errorData.error || `Payment requests API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Payment requests data received:', data);
      
      setPaymentRequests(data.data || []);
      console.log('✅ Alpha payment requests loaded successfully');

    } catch (err) {
      console.error('❌ Error fetching payment requests:', err);
      setError(err.message);
      setPaymentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentRequests();
    setRefreshing(false);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handlePaymentAction = async (paymentId, action) => {
    try {
      setSubmitting(true);
      console.log('💰 Processing payment action:', { paymentId, action });

      const token = localStorage?.getItem?.('alphaToken');
      
      const response = await fetch('/api/alpha/payments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentRequestId: paymentId,
          action: action
        })
      });

      const result = await response.json();
      console.log('💳 Payment action response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update payment request');
      }

      // Update the payment in the list
      setPaymentRequests(prev => 
        prev.map(p => p._id === paymentId ? result.data : p)
      );

      alert(`Payment request ${action === 'request_payout' ? 'submitted' : 'updated'} successfully!`);
      
    } catch (err) {
      console.error('❌ Error processing payment action:', err);
      alert(`Failed to process payment request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { cls: 'pending', icon: Clock, text: 'Pending' },
      requested: { cls: 'processing', icon: Loader2, text: 'Requested' },
      paid: { cls: 'completed', icon: CheckCircle, text: 'Paid' },
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

  const exportData = () => {
    const csvContent = [
      ['Payment ID', 'Assignment', 'Amount', 'Status', 'Created Date', 'Updated Date'],
      ...paymentRequests.map(p => [
        p._id,
        p.assignment?.title || 'N/A',
        p.amount,
        p.status,
        formatDate(p.createdAt),
        formatDate(p.updatedAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alpha-payment-requests-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

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
          onClick={fetchPaymentRequests}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Derived collections
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const historyPaymentsAll = paymentRequests.filter(p => p.status !== 'pending');

  const filteredHistoryPayments = historyPaymentsAll.filter(payment => {
    const matchesFilter = filter === 'all' ? true : payment.status === filter;
    if (!matchesFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = payment.assignment?.title?.toLowerCase() || '';
    return title.includes(q);
  });

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
              <p className="header-subtitle">Manage your alpha payment requests and transactions</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => window.location.href = '/alpha-dashboard'}
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
              <Loader2 size={16} className={refreshing ? 'animate-spin' : ''} />
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
              Ready for Request ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            >
              Transaction History ({historyPaymentsAll.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Search Bar (History only) */}
      {activeTab === 'history' && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by assignment title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
            <div className="filter-select">
              <Filter size={16} className="text-gray-400" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Status ({historyPaymentsAll.length})</option>
                <option value="requested">Requested ({historyPaymentsAll.filter(p=>p.status==='requested').length})</option>
                <option value="paid">Paid ({historyPaymentsAll.filter(p=>p.status==='paid').length})</option>
                <option value="failed">Failed ({historyPaymentsAll.filter(p=>p.status==='failed').length})</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content: Pending */}
      {activeTab === 'pending' && (
        <div className="content-card">
          <div className="content-header">
            <div className="content-header-top">
              <div>
                <h2>Payment Requests Ready for Payout</h2>
                <p>These requests are waiting for you to request payout.</p>
              </div>
              {pendingPayments.length > 0 && (
                <div className="content-header-right">
                  <p>Total requestable amount</p>
                  <p className="total-amount">
                    {formatCurrency(pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={64} className="mx-auto text-gray-400 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-3">No pending payout requests</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Once admin confirms delivery, your payment request will appear here.
              </p>
              <button onClick={handleRefresh} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="items-list">
              {pendingPayments.map((payment) => (
                <div key={payment._id} className="item-row hover:shadow-md transition-shadow duration-200">
                  <div className="item-content">
                    <div className="item-left">
                      <div className="item-details" style={{flex: 1}}>
                        <div className="item-header">
                          <h3 className="item-title">{payment.assignment?.title || 'Assignment Payment'}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Payment ID:</span>
                            <span className="font-mono text-gray-900">#{payment._id.substring(payment._id.length - 8)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Created:</span>
                            <span>{safeFormatDateTime(payment.createdAt, '—')}</span>
                          </div>
                        </div>
                        <div className="item-footer">
                          <p className="item-last-updated">Last updated: {safeFormatDateTime(payment.updatedAt || payment.createdAt, '—')}</p>
                          <button onClick={() => handleViewDetails(payment)} className="view-details-btn">
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="item-right">
                      <div className="item-amount-card">
                        <p className="item-amount">{formatCurrency(payment.amount)}</p>
                        <p className="item-order-id">Payment: #{payment._id.substring(payment._id.length - 8)}</p>
                        {getStatusBadge(payment.status)}
                        <div className="item-actions mt-3">
                          <button
                            onClick={() => handlePaymentAction(payment._id, 'request_payout')}
                            disabled={submitting}
                            className="request-payment-btn"
                          >
                            <DollarSign size={14} className="mr-2" />
                            Request Payout
                          </button>
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

      {/* Content: History */}
      {activeTab === 'history' && (
        <div className="content-card">
          <div className="content-header">
            <div className="content-header-top">
              <div>
                <h2>Transaction History</h2>
                <p>Track all your requests and their status.</p>
              </div>
              {filteredHistoryPayments.length > 0 && (
                <div className="content-header-right">
                  <p>Filtered total</p>
                  <p className="total-amount">
                    {formatCurrency(filteredHistoryPayments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {filteredHistoryPayments.length === 0 ? (
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
                  <button onClick={() => setFilter('all')} className="action-button">Show All</button>
                )}
                <button onClick={handleRefresh} className="action-button primary">Refresh Data</button>
              </div>
            </div>
          ) : (
            <div className="items-list">
              {filteredHistoryPayments.map((payment) => (
                <div key={payment._id} className="item-row hover:shadow-md transition-shadow duration-200">
                  <div className="item-content">
                    <div className="item-left" style={{gap: '1rem'}}>
                      <div className="item-details" style={{flex: 1}}>
                        <div className="item-header">
                          <h3 className="item-title">{payment.assignment?.title || 'Assignment Payment'}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Payment ID:</span>
                            <span className="font-mono text-gray-900">#{payment._id.substring(payment._id.length - 8)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className="text-gray-900">{payment.status}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Requested:</span>
                            <span>{safeFormatDateTime(payment.requestedAt, '—')}</span>
                          </div>
                          {payment.paidAt && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Paid:</span>
                              <span>{safeFormatDateTime(payment.paidAt, '—')}</span>
                            </div>
                          )}
                        </div>
                        <div className="item-footer">
                          <p className="item-last-updated">Last updated: {safeFormatDateTime(payment.updatedAt || payment.createdAt, '—')}</p>
                          <button onClick={() => handleViewDetails(payment)} className="view-details-btn">
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="item-right">
                      <div className="item-amount-card">
                        <p className="item-amount">{formatCurrency(payment.amount)}</p>
                        <p className="item-order-id">Payment: #{payment._id.substring(payment._id.length - 8)}</p>
                        {getStatusBadge(payment.status)}
                        {payment.status === 'requested' && (
                          <div className="item-actions mt-3">
                            <button
                              onClick={() => handlePaymentAction(payment._id, 'confirm_received')}
                              disabled={submitting}
                              className="request-payment-btn"
                              style={{ background: '#2563eb' }}
                            >
                              <CheckCircle size={14} className="mr-2" />
                              Mark as Received
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Payment Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-gray-900">
                    {selectedPayment.assignment?.title || 'Assignment Payment'}
                  </h4>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment ID</p>
                    <p className="text-sm font-mono text-gray-900">#{selectedPayment._id}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Assignment Information
                </h5>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Assignment Title</p>
                      <p className="font-medium text-gray-900">{selectedPayment.assignment?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium text-gray-900">{selectedPayment.assignment?.description || 'N/A'}</p>
                    </div>
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
                        <p className="text-sm font-medium text-gray-900">Payment Request Created</p>
                        <p className="text-xs text-gray-500">{formatDateTime(selectedPayment.createdAt)}</p>
                      </div>
                    </div>
                    
                    {selectedPayment.status === 'requested' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Payout Requested</p>
                          <p className="text-xs text-gray-500">Awaiting admin processing</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedPayment.status === 'paid' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                          <p className="text-xs text-gray-500">{formatDateTime(selectedPayment.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

export default AlphaPaymentRequests;
