'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiDownload, FiEye, FiCheck, FiX } from 'react-icons/fi';

// --- STYLES & THEME OBJECT (No changes here) ---
const theme = {
  colors: {
    primary: '#4a47a3',
    background: '#f4f7fe',
    cardBackground: '#ffffff',
    textPrimary: '#1a1a2e',
    textSecondary: '#6e7f8d',
    border: '#e0e7f1',
    pending: '#ffa726',
    processing: '#29b6f6',
    completed: '#66bb6a',
    failed: '#ef5350',
  },
  shadows: {
    soft: '0 4px 12px rgba(0, 0, 0, 0.05)',
    medium: '0 8px 24px rgba(0, 0, 0, 0.1)',
  },
};

const styles = {
  container: { backgroundColor: theme.colors.cardBackground, padding: '2rem', borderRadius: '12px', boxShadow: theme.shadows.soft, border: `1px solid ${theme.colors.border}` },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: theme.colors.textPrimary, margin: 0 },
  subtitle: { margin: '0.25rem 0 0 0', color: theme.colors.textSecondary, fontSize: '1rem' },
  exportButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: theme.colors.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  statCard: { backgroundColor: theme.colors.cardBackground, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.colors.border}`, transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out' },
  statCardHover: { transform: 'translateY(-5px)', boxShadow: theme.shadows.medium },
  statHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' },
  iconWrapper: (color) => ({ backgroundColor: `${color}20`, borderRadius: '50%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  statTitle: { fontSize: '1rem', fontWeight: '600', color: theme.colors.textPrimary },
  statCount: { fontSize: '2rem', fontWeight: '700', color: theme.colors.textPrimary, margin: '0 0 0.25rem 0' },
  statAmount: { fontSize: '1rem', fontWeight: '500', color: theme.colors.textSecondary },
  skeletonCard: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.colors.border}` },
  skeletonLine: { backgroundColor: '#e0e7f1', borderRadius: '4px', height: '20px', marginBottom: '1rem' },
  shimmerAnimation: `@keyframes shimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }`,
  shimmerBackground: { animation: 'shimmer 1.5s infinite linear', backgroundImage: 'linear-gradient(to right, #e0e7f1 0%, #f4f7fe 20%, #e0e7f1 40%, #e0e7f1 100%)', backgroundRepeat: 'no-repeat', backgroundSize: '800px 104px' },
  transactionSection: { marginTop: '3rem' },
  searchInput: { width: '100%', padding: '0.75rem 1rem', fontSize: '1rem', border: `1px solid ${theme.colors.border}`, borderRadius: '8px', marginBottom: '1.5rem', boxSizing: 'border-box' },
  tableWrapper: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '0.75rem 1rem', backgroundColor: '#f8f9fa', color: theme.colors.textSecondary, fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: '600', borderBottom: `2px solid ${theme.colors.border}` },
  td: { padding: '1rem', color: theme.colors.textPrimary, borderBottom: `1px solid ${theme.colors.border}`, verticalAlign: 'middle' },
  sellerInfo: { fontWeight: '600' },
  statusBadge: (statusColor) => ({ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500', color: statusColor, backgroundColor: `${statusColor}20` }),
  actionsCell: { display: 'flex', gap: '0.5rem' },
  actionButton: { background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textSecondary, transition: 'background-color 0.2s' },
};

// --- Initial Data (Simulates fetching from an API) ---
const initialTransactions = [
  { id: 'TXN72391', seller: 'Crafty Creations', date: '2025-08-19', amount: 15000, status: 'Completed' },
  { id: 'TXN58219', seller: 'Vintage Finds', date: '2025-08-19', amount: 7200, status: 'Pending' },
  { id: 'TXN60342', seller: 'Gadget Galaxy', date: '2025-08-18', amount: 22500, status: 'Processing' },
  { id: 'TXN49123', seller: 'Home Essentials', date: '2025-08-18', amount: 5000, status: 'Completed' },
  { id: 'TXN38210', seller: 'Book Nook', date: '2025-08-17', amount: 3000, status: 'Failed' },
  { id: 'TXN88234', seller: 'Fashion Forward', date: '2025-08-17', amount: 18000, status: 'Completed' },
  { id: 'TXN12389', seller: 'Crafty Creations', date: '2025-08-16', amount: 63000, status: 'Pending' },
];

const statusColors = { 'Pending': theme.colors.pending, 'Processing': theme.colors.processing, 'Completed': theme.colors.completed, 'Failed': theme.colors.failed };

// --- Helper Components ---
const StatCard = ({ icon, title, count, amount, color, onMouseEnter, onMouseLeave, isHovered }) => ( <div style={{...styles.statCard, ...(isHovered ? styles.statCardHover : {})}} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}> <div style={styles.statHeader}><div style={styles.iconWrapper(color)}>{icon}</div><h3 style={styles.statTitle}>{title}</h3></div> <div><p style={styles.statCount}>{count}</p><p style={styles.statAmount}>{amount}</p></div> </div> );
const SkeletonLoader = () => ( <div style={styles.statsGrid}>{Array(4).fill(0).map((_, index) => (<div key={index} style={styles.skeletonCard}><div style={{ ...styles.skeletonLine, width: '50%', height: '30px', ...styles.shimmerBackground }}></div><div style={{ ...styles.skeletonLine, width: '80%', ...styles.shimmerBackground }}></div><div style={{ ...styles.skeletonLine, width: '60%', ...styles.shimmerBackground }}></div></div>))}</div> );

// --- Main Component ---
export default function AdminSellerTransactions() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- DATA FETCHING & STATE MANAGEMENT ---
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setTransactions(initialTransactions);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // --- DYNAMIC CALCULATIONS ---
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
  
  // --- EVENT HANDLERS ---
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
    { id: 'pending', icon: <FiClock size={20} color={theme.colors.pending} />, title: 'Pending', color: theme.colors.pending, count: stats.pending?.count || 0, amount: `₹${(stats.pending?.amount || 0).toLocaleString('en-IN')}` },
    { id: 'processing', icon: <FiRefreshCw size={20} color={theme.colors.processing} />, title: 'Processing', color: theme.colors.processing, count: stats.processing?.count || 0, amount: "In progress" },
    { id: 'completed', icon: <FiCheckCircle size={20} color={theme.colors.completed} />, title: 'Completed', color: theme.colors.completed, count: stats.completed?.count || 0, amount: `₹${(stats.completed?.amount || 0).toLocaleString('en-IN')}` },
    { id: 'failed', icon: <FiAlertCircle size={20} color={theme.colors.failed} />, title: 'Failed', color: theme.colors.failed, count: stats.failed?.count || 0, amount: "Needs attention" },
  ];

  return (
    <>
      <style>{styles.shimmerAnimation}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Seller Payment Requests</h2>
            <p style={styles.subtitle}>Today is {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button style={styles.exportButton} onClick={handleExport}><FiDownload size={16} /><span>Export Report</span></button>
        </div>

        {loading ? <SkeletonLoader /> : <div style={styles.statsGrid}>{cardData.map((card) => (<StatCard key={card.id} {...card} isHovered={hoveredCard === card.id} onMouseEnter={() => setHoveredCard(card.id)} onMouseLeave={() => setHoveredCard(null)} />))}</div>}

        {!loading && (
          <div style={styles.transactionSection}>
            <input type="text" placeholder="Search by Seller, ID, or Status..." style={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Seller</th><th style={styles.th}>Request Date</th><th style={styles.th}>Amount</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={styles.td}><div style={styles.sellerInfo}>{tx.seller}</div><div style={{...styles.statAmount, fontSize: '0.8rem'}}>{tx.id}</div></td>
                      <td style={styles.td}>{tx.date}</td>
                      <td style={styles.td}>{'₹' + tx.amount.toLocaleString('en-IN')}</td>
                      <td style={styles.td}><span style={styles.statusBadge(statusColors[tx.status])}>{tx.status}</span></td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell}>
                          <button style={styles.actionButton} title="Approve" onClick={() => handleUpdateRequest(tx.id, 'Completed')}><FiCheck /></button>
                          <button style={styles.actionButton} title="Reject" onClick={() => handleUpdateRequest(tx.id, 'Failed')}><FiX /></button>
                          <button style={styles.actionButton} title="View Details" onClick={() => handleViewDetails(tx)}><FiEye /></button>
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
    </>
  );
}