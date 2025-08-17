import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Package,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Loader2,
  IndianRupee,
  Calendar,
  TrendingUp
} from 'lucide-react';

const AdminSellerTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const params = new URLSearchParams({
        status: filters.status !== 'all' ? filters.status : '',
        page: filters.page.toString(),
        limit: filters.limit.toString()
      }).toString();

      const response = await fetch(`/api/admin/seller-transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seller transactions');
      }

      const data = await response.json();
      setTransactions(data.data.transactions || []);
      setSummary(data.data.summary || {});

    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId, newStatus, notes = '', transactionReference = '') => {
    try {
      setUpdating(true);

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch('/api/admin/seller-transactions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId,
          status: newStatus,
          notes,
          transactionReference
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transaction');
      }

      alert(`Transaction ${newStatus} successfully!`);
      
      // Refresh transactions
      fetchTransactions();
      setShowDetailsModal(false);

    } catch (err) {
      console.error('Error updating transaction:', err);
      alert(`Failed to update transaction: ${err.message}`);
    } finally {
      setUpdating(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={32} className="animate-spin mr-3" />
        <span>Loading seller transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="text-red-500 mr-3" size={24} />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Transactions</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={fetchTransactions}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="mr-3 text-green-600" size={28} />
              Seller Payment Requests
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and process seller payment requests
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.pending || 0}</p>
              <p className="text-sm text-gray-600">{formatCurrency(summary.totalPendingAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Loader2 className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Processing</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.processing || 0}</p>
              <p className="text-sm text-gray-600">In progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.completed || 0}</p>
              <p className="text-sm text-gray-600">{formatCurrency(summary.totalCompletedAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Failed</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.failed || 0}</p>
              <p className="text-sm text-gray-600">Needs attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Showing {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-gray-600 font-medium">No transactions found</h3>
            <p className="text-gray-500 text-sm mt-2">
              Seller payment requests will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller & Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount & UPI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          {transaction.seller?.profileImage ? (
                            <img 
                              src={transaction.seller.profileImage} 
                              alt={transaction.seller.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <User className="text-gray-400" size={20} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.seller?.name || 'Unknown Seller'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.product?.title || 'Product'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.sellerUpiId}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.requestedAt).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye size={16} className="mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Transaction Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Transaction Info */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Seller Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedTransaction.seller?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedTransaction.seller?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">UPI ID:</span>
                        <span className="font-medium">{selectedTransaction.sellerUpiId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Transaction Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedTransaction.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span>{getStatusBadge(selectedTransaction.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requested:</span>
                        <span className="font-medium">
                          {new Date(selectedTransaction.requestedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                {selectedTransaction.product && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Product Information</h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {selectedTransaction.product.images?.[0] ? (
                          <img 
                            src={selectedTransaction.product.images[0]} 
                            alt={selectedTransaction.product.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="text-gray-400" size={24} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {selectedTransaction.product.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Product Price: {formatCurrency(selectedTransaction.product.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Update Actions */}
                {selectedTransaction.status === 'pending' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Update Status</h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleUpdateStatus(selectedTransaction._id, 'processing')}
                        disabled={updating}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                      >
                        {updating ? (
                          <Loader2 size={16} className="animate-spin mr-2" />
                        ) : (
                          <Clock size={16} className="mr-2" />
                        )}
                        Mark Processing
                      </button>
                      
                      <button
                        onClick={() => {
                          const reference = prompt('Enter transaction reference ID (optional):');
                          handleUpdateStatus(selectedTransaction._id, 'completed', '', reference || '');
                        }}
                        disabled={updating}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Mark Completed
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Enter failure reason:');
                          if (reason) {
                            handleUpdateStatus(selectedTransaction._id, 'failed', reason);
                          }
                        }}
                        disabled={updating}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                      >
                        <AlertCircle size={16} className="mr-2" />
                        Mark Failed
                      </button>
                    </div>
                  </div>
                )}

                {selectedTransaction.status === 'processing' && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Complete Payment</h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          const reference = prompt('Enter transaction reference ID (optional):');
                          handleUpdateStatus(selectedTransaction._id, 'completed', '', reference || '');
                        }}
                        disabled={updating}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Mark Completed
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Enter failure reason:');
                          if (reason) {
                            handleUpdateStatus(selectedTransaction._id, 'failed', reason);
                          }
                        }}
                        disabled={updating}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                      >
                        <AlertCircle size={16} className="mr-2" />
                        Mark Failed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerTransactions;