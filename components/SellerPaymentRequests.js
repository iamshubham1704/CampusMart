import React, { useState, useEffect } from 'react';
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
  Filter
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Mock data for development - replace with real API calls
      const mockVerifiedOrders = [
        {
          _id: '1',
          productTitle: 'MacBook Pro 2019',
          buyerName: 'John Doe',
          amount: 45000,
          orderDate: '2024-01-15',
          productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          hasPaymentRequest: false
        },
        {
          _id: '2',
          productTitle: 'iPhone 12',
          buyerName: 'Jane Smith',
          amount: 35000,
          orderDate: '2024-01-14',
          productImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
          hasPaymentRequest: true
        },
        {
          _id: '3',
          productTitle: 'Dell XPS 13',
          buyerName: 'Mike Johnson',
          amount: 55000,
          orderDate: '2024-01-13',
          productImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
          hasPaymentRequest: false
        }
      ];

      const mockTransactions = [
        {
          _id: 't1',
          orderId: '2',
          productTitle: 'iPhone 12',
          amount: 35000,
          status: 'pending',
          requestDate: '2024-01-14',
          upiId: 'seller@paytm',
          estimatedDate: '2024-01-17'
        },
        {
          _id: 't2',
          orderId: 'old1',
          productTitle: 'iPad Air',
          amount: 25000,
          status: 'completed',
          requestDate: '2024-01-10',
          completedDate: '2024-01-12',
          upiId: 'seller@paytm',
          transactionId: 'TXN123456789'
        },
        {
          _id: 't3',
          orderId: 'old2',
          productTitle: 'Samsung Galaxy S21',
          amount: 30000,
          status: 'processing',
          requestDate: '2024-01-11',
          upiId: 'seller@paytm',
          estimatedDate: '2024-01-16'
        }
      ];

      
 
      const ordersResponse = await fetch('/api/seller/orders?status=payment_verified', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const ordersData = await ordersResponse.json();

      const transactionsResponse = await fetch('/api/seller/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactionsData = await transactionsResponse.json();

      setVerifiedOrders(ordersData.data.verifiedOrders || []);
      setTransactions(transactionsData.data.transactions || []);
    

      // Use mock data for now
      setVerifiedOrders(mockVerifiedOrders);
      setTransactions(mockTransactions);

    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError(err.message);
      
      // Fallback to empty arrays on error
      setVerifiedOrders([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayment = (order) => {
    setSelectedOrder(order);
    setShowRequestModal(true);
    setFormData({
      upiId: '',
      accountHolderName: '',
      bankName: ''
    });
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
      alert('Please enter a valid UPI ID (e.g., yourname@bank)');
      return;
    }

    try {
      setSubmitting(true);

      // Mock API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 2000));


      const token = localStorage.getItem('token');
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit payment request');
      }
  

      alert('Payment request submitted successfully! You will be notified once the payment is processed.');
      setShowRequestModal(false);
      setSelectedOrder(null);
      
      // Refresh data
      fetchData();

    } catch (err) {
      console.error('Error submitting payment request:', err);
      alert(`Failed to submit payment request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Loader2, text: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className="mr-1" />
        {config.text}
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  const pendingOrdersCount = verifiedOrders.filter(order => !order.hasPaymentRequest).length;
  const totalEarnings = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = transactions
    .filter(t => t.status === 'pending' || t.status === 'processing')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={32} className="animate-spin mr-3" />
        <span>Loading payment requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Payment Requests</h1>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrdersCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(pendingAmount)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Orders ({pendingOrdersCount})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History ({transactions.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Orders Ready for Payment Request</h2>
            <p className="text-sm text-gray-600 mt-1">These orders have verified buyer payments and are ready for your payment request.</p>
          </div>

          {verifiedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No verified orders</h3>
              <p className="text-gray-600">Orders will appear here once buyers complete their payments.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {verifiedOrders.map((order) => (
                <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={order.productImage}
                        alt={order.productTitle}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{order.productTitle}</h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <User size={14} className="mr-1" />
                          {order.buyerName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(order.amount)}</p>
                      {order.hasPaymentRequest ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                          <Clock size={12} className="mr-1" />
                          Request Submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRequestPayment(order)}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Request Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                <p className="text-sm text-gray-600 mt-1">Track all your payment requests and their status.</p>
              </div>
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">Your payment requests will appear here once submitted.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{transaction.productTitle}</h3>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Amount:</span> {formatCurrency(transaction.amount)}
                        </div>
                        <div>
                          <span className="font-medium">Request Date:</span> {formatDate(transaction.requestDate)}
                        </div>
                        <div>
                          <span className="font-medium">UPI ID:</span> {transaction.upiId}
                        </div>
                      </div>

                      {transaction.status === 'completed' && (
                        <div className="mt-2 text-sm text-green-600">
                          <span className="font-medium">Completed:</span> {formatDate(transaction.completedDate)}
                          {transaction.transactionId && (
                            <span className="ml-4">
                              <span className="font-medium">Transaction ID:</span> {transaction.transactionId}
                            </span>
                          )}
                        </div>
                      )}

                      {(transaction.status === 'pending' || transaction.status === 'processing') && transaction.estimatedDate && (
                        <div className="mt-2 text-sm text-blue-600">
                          <span className="font-medium">Estimated Completion:</span> {formatDate(transaction.estimatedDate)}
                        </div>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Request Payment</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedOrder.productTitle}</h4>
              <p className="text-sm text-gray-600">Buyer: {selectedOrder.buyerName}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">{formatCurrency(selectedOrder.amount)}</p>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="yourname@bank"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter your UPI ID for payment transfer</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Payment will be processed within 2-3 business days after request submission. 
                  You'll receive a notification once the payment is completed.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPaymentRequests;