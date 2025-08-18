'use client';
import { useState, useEffect } from 'react';
// Assuming you have these icons from a library like react-icons
// If not, you can replace them with text or other elements.
import { FiClock, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// --- STYLES OBJECT ---
const styles = {
  container: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    color: '#666',
  },
  exportButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  statTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#495057',
  },
  statCount: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#212529',
    margin: '0.25rem 0',
  },
  statAmount: {
    fontSize: '1.1rem',
    fontWeight: '500',
    color: '#343a40',
  },
  statDescription: {
    fontSize: '0.875rem',
    color: '#6c757d',
    margin: 0,
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    marginTop: '1rem',
  }
};

// --- COMPONENT ---
export default function AdminSellerTransactions() {
  // --- STATE (Example Data) ---
  // Replace this with your actual data fetching logic
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    processingCount: 0,
    completedCount: 4,
    completedAmount: 16344,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // useEffect(() => {
  //   // FETCH YOUR DATA HERE
  //   // Example:
  //   // fetch('/api/admin/seller-payments/stats')
  //   //   .then(res => res.json())
  //   //   .then(data => setStats(data))
  //   //   .catch(err => setError('Failed to load stats'))
  //   //   .finally(() => setLoading(false));
  // }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Seller Payment Requests</h2>
          <p style={styles.subtitle}>Manage and process seller payment requests</p>
        </div>
        <button style={styles.exportButton}>Export</button>
      </div>

      <div style={styles.statsGrid}>
        {/* Pending Card */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <FiClock size={20} color="#6c757d" />
            <h3 style={styles.statTitle}>Pending</h3>
          </div>
          <p style={styles.statCount}>{stats.pendingCount}</p>
          <p style={styles.statAmount}>₹{stats.pendingAmount.toLocaleString('en-IN')}</p>
        </div>

        {/* Processing Card */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
             <FiRefreshCw size={20} color="#6c757d" />
            <h3 style={styles.statTitle}>Processing</h3>
          </div>
          <p style={styles.statCount}>{stats.processingCount}</p>
          <p style={styles.statDescription}>In progress</p>
        </div>

        {/* Completed Card */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <FiCheckCircle size={20} color="#6c757d" />
            <h3 style={styles.statTitle}>Completed</h3>
          </div>
          <p style={styles.statCount}>{stats.completedCount}</p>
          <p style={styles.statAmount}>₹{stats.completedAmount.toLocaleString('en-IN')}</p>
        </div>
        
        {/* Failed Card */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <FiAlertCircle size={20} color="#6c757d" />
            <h3 style={styles.statTitle}>Failed</h3>
          </div>
           <p style={styles.statCount}>{stats.failedCount}</p>
          <p style={styles.statDescription}>Needs attention</p>
        </div>
      </div>
      
      <div>
        <input 
          type="text" 
          placeholder="Search transactions..." 
          style={styles.searchInput} 
        />
        {/* You would render the list/table of transactions here */}
      </div>

    </div>
  );
}