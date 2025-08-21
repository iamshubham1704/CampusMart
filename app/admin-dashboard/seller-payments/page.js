'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiDownload, FiEye, FiCheck, FiX, FiUser, FiPackage, FiCreditCard } from 'react-icons/fi';
import styles from './seller-payments.module.css';

// --- Helper Components ---
const StatCard = ({ icon, title, count, amount, colorClass }) => (
  <div className={styles.statCard}>
    <div className={styles.statHeader}>
      <div className={`${styles.iconWrapper} ${colorClass}`}>{icon}</div>
      <h3 className={styles.statTitle}>{title}</h3>
    </div>
    <div>
      <p className={styles.statCount}>{count}</p>
      <p className={styles.statAmount}>{amount}</p>
    </div>
  </div>
);

const SkeletonLoader = () => (
  <div className={styles.statsGrid}>
    {Array(4).fill(0).map((_, index) => (
      <div key={index} className={styles.skeletonCard}>
        <div className={styles.skeletonLine} style={{ width: '50%', height: '30px' }}></div>
        <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
      </div>
    ))}
  </div>
);

// --- Payment Details Modal ---
const PaymentDetailsModal = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  // Helper function to safely get status text
  const getStatusText = (status) => {
    if (!status) return 'N/A';
    if (typeof status === 'string') {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
    return 'Unknown';
  };

  // Helper function to safely get status class
  const getStatusClass = (status) => {
    if (!status || typeof status !== 'string') return '';
    const statusKey = `status${status.charAt(0).toUpperCase() + status.slice(1)}`;
    return styles[statusKey] || '';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Payment Request Details</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.detailSection}>
            <h4><FiUser /> Seller Information</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Name:</span>
                <span className={styles.detailValue}>
                  {transaction.seller && typeof transaction.seller === 'object' && transaction.seller.name 
                    ? transaction.seller.name 
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>
                  {transaction.seller && typeof transaction.seller === 'object' && transaction.seller.email 
                    ? transaction.seller.email 
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone:</span>
                <span className={styles.detailValue}>
                  {transaction.seller && typeof transaction.seller === 'object' && transaction.seller.phone 
                    ? transaction.seller.phone 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4><FiPackage /> Product Information</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Product:</span>
                <span className={styles.detailValue}>
                  {transaction.product && typeof transaction.product === 'object' && transaction.product.title 
                    ? transaction.product.title 
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Order ID:</span>
                <span className={styles.detailValue}>{transaction.orderId || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4><FiCreditCard /> Payment Details</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Amount:</span>
                <span className={styles.detailValue}>
                  {transaction.amount && typeof transaction.amount === 'number' 
                    ? `₹${transaction.amount.toLocaleString('en-IN')}` 
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>UPI ID:</span>
                <span className={styles.detailValue} style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                  {transaction.sellerUpiId || 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Account Holder:</span>
                <span className={styles.detailValue}>{transaction.accountHolderName || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Bank:</span>
                <span className={styles.detailValue}>{transaction.bankName || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Payment Method:</span>
                <span className={styles.detailValue}>
                  {transaction.paymentMethod && typeof transaction.paymentMethod === 'string' 
                    ? transaction.paymentMethod.toUpperCase() 
                    : 'UPI'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4><FiClock /> Request Information</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Request Date:</span>
                <span className={styles.detailValue}>
                  {transaction.requestedAt && !isNaN(new Date(transaction.requestedAt).getTime()) 
                    ? new Date(transaction.requestedAt).toLocaleString('en-IN') 
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={`${styles.statusBadge} ${getStatusClass(transaction.status)}`}>
                  {getStatusText(transaction.status)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Transaction ID:</span>
                <span className={styles.detailValue} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {transaction.id || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {transaction.adminNotes && (
            <div className={styles.detailSection}>
              <h4>Admin Notes</h4>
              <div className={styles.adminNotes}>
                {transaction.adminNotes}
              </div>
            </div>
          )}

          {transaction.transactionReference && (
            <div className={styles.detailSection}>
              <h4>Transaction Reference</h4>
              <div className={styles.referenceInfo}>
                <span className={styles.detailLabel}>Reference ID:</span>
                <span className={styles.detailValue} style={{ fontFamily: 'monospace', backgroundColor: '#e8f5e8', padding: '4px 8px', borderRadius: '4px' }}>
                  {transaction.transactionReference}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryButton} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function SellerPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('adminToken') || localStorage.getItem('admin-auth-token');
        const res = await fetch('/api/admin/seller-transactions?status=all', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch transactions');
        }

        const normalized = (data.data.transactions || []).map(tx => ({
          id: (tx._id && (tx._id.$oid || tx._id)) || tx.id,
          sellerName: tx.seller?.name || tx.sellerName || (tx.sellerId ? 'Unknown Seller' : 'N/A'),
          date: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 10) : '',
          amount: tx.amount || 0,
          status: (tx.status || 'pending').replace(/\b\w/g, c => c.toUpperCase()),
          sellerUpiId: tx.sellerUpiId || tx.upiId || 'N/A',
          accountHolderName: tx.accountHolderName || 'N/A',
          bankName: tx.bankName || 'N/A',
          paymentMethod: tx.paymentMethod || 'UPI',
          requestedAt: tx.requestedAt || tx.createdAt,
          adminNotes: tx.adminNotes || '',
          transactionReference: tx.transactionReference || '',
          seller: tx.seller || null,
          product: tx.product || null,
          orderId: tx.orderId || 'N/A',
          raw: tx
        }));
        setTransactions(normalized);
      } catch (e) {
        console.error('Failed to load seller transactions:', e);
        setError(e.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const stats = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const status = tx.status && typeof tx.status === 'string' ? tx.status.toLowerCase() : 'unknown';
      acc[status] = acc[status] || { count: 0, amount: 0 };
      acc[status].count += 1;
      acc[status].amount += (typeof tx.amount === 'number' ? tx.amount : 0);
      return acc;
    }, {});
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(t => {
      const searchLower = searchQuery.toLowerCase();
      const sellerName = t.sellerName || '';
      const id = t.id || '';
      const status = t.status || '';
      const upiId = t.sellerUpiId || '';
      const email = t.seller && typeof t.seller === 'object' && t.seller.email ? t.seller.email : '';
      const phone = t.seller && typeof t.seller === 'object' && t.seller.phone ? t.seller.phone : '';
      
      return sellerName.toLowerCase().includes(searchLower) ||
             id.toLowerCase().includes(searchLower) ||
             status.toLowerCase().includes(searchLower) ||
             upiId.toLowerCase().includes(searchLower) ||
             email.toLowerCase().includes(searchLower) ||
             phone.toLowerCase().includes(searchLower);
    });
  }, [searchQuery, transactions]);

  const handleUpdateRequest = async (id, newStatus, options = {}) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin-auth-token');
      const res = await fetch('/api/admin/seller-transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          transactionId: id, 
          status: newStatus.toLowerCase(),
          notes: options.notes || undefined,
          transactionReference: options.reference || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update');
      }
      setTransactions(current => current.map(tx => tx.id === id ? { ...tx, status: newStatus } : tx));
      alert(`Transaction ${id} marked as ${newStatus}.`);
    } catch (e) {
      console.error('Failed to update transaction:', e);
      alert(e.message || 'Failed to update');
    }
  };

  // Approve flow with reference prompt
  const approveTransaction = async (tx) => {
    const reference = prompt('Enter bank/UPI transaction reference ID (required to complete):');
    if (reference === null) return; // cancelled
    const trimmed = String(reference).trim();
    if (!trimmed) {
      alert('Reference ID is required to mark as Completed.');
      return;
    }
    await handleUpdateRequest(tx.id, 'Completed', { reference: trimmed });
  };

  // Reject flow with reason prompt
  const rejectTransaction = async (tx) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    await handleUpdateRequest(tx.id, 'Failed', { notes: String(reason).trim() || undefined });
  };

  const handleViewDetails = (tx) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const headers = "Transaction ID,Seller,Email,Phone,Date,Amount,Status,UPI ID,Account Holder,Bank";
    const rows = transactions.map(tx => {
      const email = tx.seller && typeof tx.seller === 'object' && tx.seller.email ? tx.seller.email : 'N/A';
      const phone = tx.seller && typeof tx.seller === 'object' && tx.seller.phone ? tx.seller.phone : 'N/A';
      return `${tx.id},${tx.sellerName},${email},${phone},${tx.date},${tx.amount},${tx.status},${tx.sellerUpiId},${tx.accountHolderName},${tx.bankName}`;
    }).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "seller_payment_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardData = [
    { id: 'pending', icon: <FiClock size={20} />, title: 'Pending', colorClass: styles.pendingColor, count: stats.pending?.count || 0, amount: `₹${(stats.pending?.amount || 0).toLocaleString('en-IN')}` },
    { id: 'processing', icon: <FiRefreshCw size={20} />, title: 'Processing', colorClass: styles.processingColor, count: stats.processing?.count || 0, amount: "In progress" },
    { id: 'completed', icon: <FiCheckCircle size={20} />, title: 'Completed', colorClass: styles.completedColor, count: stats.completed?.count || 0, amount: `₹${(stats.completed?.amount || 0).toLocaleString('en-IN')}` },
    { id: 'failed', icon: <FiAlertCircle size={20} />, title: 'Failed', colorClass: styles.failedColor, count: stats.failed?.count || 0, amount: "Needs attention" },
  ];

  const getStatusClass = (status) => {
    if (!status || typeof status !== 'string') return '';
    switch (status) {
      case 'Pending': return styles.statusPending;
      case 'Processing': return styles.statusProcessing;
      case 'Completed': return styles.statusCompleted;
      case 'Failed': return styles.statusFailed;
      default: return '';
    }
  };

  // Helper function to safely get seller name
  const getSellerName = (tx) => {
    return tx.sellerName || 'Unknown Seller';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Seller Payment Requests</h2>
          <p className={styles.subtitle}>Today is {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button className={styles.exportButton} onClick={handleExport}><FiDownload size={16} /><span>Export Report</span></button>
      </div>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #fcc', color: '#b00020', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? <SkeletonLoader /> : <div className={styles.statsGrid}>{cardData.map((card) => (<StatCard key={card.id} {...card} />))}</div>}

      {!loading && (
        <div className={styles.transactionSection}>
          <input type="text" placeholder="Search by Seller, ID, Status, UPI ID, Email, or Phone..." className={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Contact Info</th>
                  <th>Request Date</th>
                  <th>Amount</th>
                  <th>UPI ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className={styles.sellerInfo}>{tx.sellerName}</div>
                      <div className={styles.transactionId}>{tx.id || 'N/A'}</div>
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        <div className={styles.contactItem}>
                          <span className={styles.contactLabel}>Email:</span>
                          <span className={styles.contactValue}>
                            {tx.seller && typeof tx.seller === 'object' && tx.seller.email 
                              ? tx.seller.email 
                              : 'N/A'}
                          </span>
                        </div>
                        <div className={styles.contactItem}>
                          <span className={styles.contactLabel}>Phone:</span>
                          <span className={styles.contactValue}>
                            {tx.seller && typeof tx.seller === 'object' && tx.seller.phone 
                              ? tx.seller.phone 
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{tx.date || 'N/A'}</td>
                    <td>
                      {tx.amount && typeof tx.amount === 'number' 
                        ? '₹' + tx.amount.toLocaleString('en-IN') 
                        : 'N/A'}
                    </td>
                    <td>
                      <div className={styles.upiIdCell}>
                        <span className={styles.upiIdText}>{tx.sellerUpiId || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(tx.status)}`}>
                        {tx.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button title="Approve" onClick={() => approveTransaction(tx)}><FiCheck /></button>
                        <button title="Reject" onClick={() => rejectTransaction(tx)}><FiX /></button>
                        <button title="View Details" onClick={() => handleViewDetails(tx)}><FiEye /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      <PaymentDetailsModal 
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
}