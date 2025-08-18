'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiDownload, FiEye, FiCheck, FiX } from 'react-icons/fi';
import styles from './seller-payments.module.css';

// --- (The rest of your JavaScript code is correct and does not need changes) ---
// --- Initial Data (Simulates fetching from an API) ---
const initialTransactions = [
  { id: 'TXN72391', seller: 'Crafty Creations', date: '2025-08-19', amount: 15000, status: 'Completed' },
  { id: 'TXN58219', seller: 'Vintage Finds', date: '2025-08-19', amount: 7200, status: 'Pending' },
  { id: 'TXN60342', seller: 'Gadget Galaxy', date: '2025-08-18', amount: 22500, status: 'Processing' },
  { id: 'TXN49123', seller: 'Home Essentials', date: '2025-08-18', amount: 5000, status: 'Completed' },
  { id: 'TXN38210', seller: 'Book Nook', date: '2025-08-17', amount: 3000, status: 'Failed' },
];

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setTransactions(initialTransactions);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
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

  const handleUpdateRequest = (id, newStatus) => {
    setTransactions(currentTransactions =>
      currentTransactions.map(tx =>
        tx.id === id ? { ...tx, status: newStatus } : tx
      )
    );
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
                        <button title="Approve" onClick={() => handleUpdateRequest(tx.id, 'Completed')}><FiCheck /></button>
                        <button title="Reject" onClick={() => handleUpdateRequest(tx.id, 'Failed')}><FiX /></button>
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