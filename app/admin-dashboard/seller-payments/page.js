'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiDownload, FiEye, FiCheck, FiX } from 'react-icons/fi';
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

// --- Main Page Component ---
export default function SellerPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

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
          seller: tx.seller?.name || tx.sellerName || (tx.sellerId ? 'Unknown Seller' : 'N/A'),
          date: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 10) : '',
          amount: tx.amount || 0,
          status: (tx.status || 'pending').replace(/\b\w/g, c => c.toUpperCase()),
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
      const status = tx.status.toLowerCase();
      acc[status] = acc[status] || { count: 0, amount: 0 };
      acc[status].count += 1;
      acc[status].amount += tx.amount;
      return acc;
    }, {});
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(t =>
      t.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
    alert(`Details for ${tx.id}:\n\nSeller: ${tx.seller}\nAmount: ₹${tx.amount.toLocaleString('en-IN')}\nDate: ${tx.date}\nStatus: ${tx.status}`);
  };

  const handleExport = () => {
    const headers = "Transaction ID,Seller,Date,Amount,Status";
    const rows = transactions.map(tx => `${tx.id},${tx.seller},${tx.date},${tx.amount},${tx.status}`).join('\n');
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
    switch (status) {
      case 'Pending': return styles.statusPending;
      case 'Processing': return styles.statusProcessing;
      case 'Completed': return styles.statusCompleted;
      case 'Failed': return styles.statusFailed;
      default: return '';
    }
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
          <input type="text" placeholder="Search by Seller, ID, or Status..." className={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Seller</th><th>Request Date</th><th>Amount</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className={styles.sellerInfo}>{tx.seller}</div>
                      <div className={styles.transactionId}>{tx.id}</div>
                    </td>
                    <td>{tx.date}</td>
                    <td>{'₹' + tx.amount.toLocaleString('en-IN')}</td>
                    <td><span className={`${styles.statusBadge} ${getStatusClass(tx.status)}`}>{tx.status}</span></td>
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
    </div>
  );
}