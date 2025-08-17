// app/admin-dashboard/payments/page.js - FIXED VERSION
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [paymentScreenshots, setPaymentScreenshots] = useState([]);
  const [filter, setFilter] = useState('pending_verification');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const router = useRouter();
  const itemsPerPage = 20;

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');
    
    if (!token || !admin) {
      router.push('/admin-login');
      return;
    }

    try {
      const adminInfo = JSON.parse(admin);
      if (adminInfo.role !== 'admin') {
        router.push('/admin-login');
        return;
      }
      setAdminData(adminInfo);
    } catch (error) {
      console.error('Error parsing admin data:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      router.push('/admin-login');
      return;
    }

    fetchPaymentScreenshots();
  }, [filter, currentPage, router]);

  const fetchPaymentScreenshots = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      const statusParam = filter !== 'all' ? `?status=${filter}&page=${currentPage}&limit=${itemsPerPage}` 
                                          : `?page=${currentPage}&limit=${itemsPerPage}`;
      
      const response = await fetch(`/api/admin/payment-screenshots${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setPaymentScreenshots(data.data.screenshots);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.total);
      } else {
        setError(data.error || 'Failed to fetch payment screenshots');
      }
    } catch (error) {
      console.error('Error fetching payment screenshots:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentVerification = async (screenshotId, action, rejectionReason = null) => {
    const actionText = action === 'verified' ? 'approve' : 'reject';
    
    if (!confirm(`Are you sure you want to ${actionText} this payment?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/payment-screenshots/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          screenshotId,
          status: action,
          rejectionReason
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the payment screenshot in local state
        setPaymentScreenshots(paymentScreenshots.map(payment => 
          payment._id === screenshotId 
            ? { ...payment, status: action, verifiedAt: new Date(), rejectionReason }
            : payment
        ));
        
        // Close modal if open
        setShowModal(false);
        setSelectedPayment(null);
        
        alert(`Payment ${action} successfully!`);
        
        // Refresh the list
        fetchPaymentScreenshots();
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Network error. Please try again.');
    }
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  // FIX: Updated screenshot viewing function with proper token handling
  const viewPaymentScreenshot = (screenshotId) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Authentication required. Please login again.');
      return;
    }
    
    // Open image in new tab with token as query parameter
    const imageUrl = `/api/payment-screenshots/image/${screenshotId}?token=${encodeURIComponent(token)}`;
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      // Create a simple image viewer page
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Screenshot - ${screenshotId}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              font-family: Arial, sans-serif;
            }
            .container {
              max-width: 100%;
              text-align: center;
            }
            .loading {
              padding: 50px;
              font-size: 18px;
              color: #666;
            }
            .error {
              padding: 50px;
              font-size: 18px;
              color: #d32f2f;
              background: #ffebee;
              border-radius: 8px;
              margin: 20px 0;
            }
            img {
              max-width: 100%;
              max-height: 80vh;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              border-radius: 8px;
              background: white;
            }
            .info {
              margin-top: 20px;
              padding: 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .close-btn {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #d32f2f;
              color: white;
              border: none;
              padding: 10px 15px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            .close-btn:hover {
              background: #b71c1c;
            }
          </style>
        </head>
        <body>
          <button class="close-btn" onclick="window.close()">✕ Close</button>
          <div class="container">
            <div class="loading" id="loading">Loading screenshot...</div>
            <img id="screenshot" style="display: none;" onload="document.getElementById('loading').style.display='none'; this.style.display='block';" onerror="showError()">
            <div class="info">
              <strong>Screenshot ID:</strong> ${screenshotId}<br>
              <small>Admin View - ${new Date().toLocaleString()}</small>
            </div>
          </div>
          
          <script>
            function showError() {
              document.getElementById('loading').innerHTML = '<div class="error">❌ Failed to load screenshot. Please check if the image exists and you have proper permissions.</div>';
            }
            
            // Set the image source
            document.getElementById('screenshot').src = '${imageUrl}';
            
            // Handle keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                window.close();
              }
            });
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Fallback for popup blockers
      const confirmed = confirm('Unable to open new window. Open image in current tab?');
      if (confirmed) {
        window.open(imageUrl, '_self');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/admin-login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return { bg: '#d4edda', color: '#155724' };
      case 'rejected':
        return { bg: '#f8d7da', color: '#721c24' };
      case 'pending_verification':
        return { bg: '#fff3cd', color: '#856404' };
      default:
        return { bg: '#e9ecef', color: '#495057' };
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading payment screenshots...
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>
            Payment Verification Center
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Total Payments: {totalCount} | Showing page {currentPage} of {totalPages}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666' }}>Welcome, {adminData?.name}</span>
          <button
            onClick={() => router.push('/admin-dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/admin-dashboard/management')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Management
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '2rem',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {/* Filter Controls */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#333', marginRight: '1rem' }}>Filter by Status:</h3>
          {['all', 'pending_verification', 'verified', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === status ? '#007bff' : '#e9ecef',
                color: filter === status ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '0.875rem'
              }}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={fetchPaymentScreenshots}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Payments Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Payment ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Buyer Details</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Product</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentScreenshots.map((payment, index) => {
                const statusStyle = getStatusColor(payment.status);
                return (
                  <tr key={payment._id} style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                          {payment._id.substring(0, 8)}...
                        </strong>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          {payment.paymentMethod?.toUpperCase() || 'UPI'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <strong>{payment.buyer?.name || 'Unknown Buyer'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {payment.buyerEmail}
                        </div>
                        {payment.buyer?.phone && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            📞 {payment.buyer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <strong>{payment.product?.title || 'Product Deleted'}</strong>
                        {payment.product?.price && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            Listed: {formatAmount(payment.product.price)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ color: '#28a745', fontSize: '1.1rem' }}>
                        {formatAmount(payment.amount)}
                      </strong>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {payment.status.replace('_', ' ')}
                      </span>
                      {payment.rejectionReason && (
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: '#dc3545', 
                          marginTop: '0.5rem',
                          fontStyle: 'italic'
                        }}>
                          💬 {payment.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#666' }}>
                      <div>📅 {new Date(payment.uploadedAt).toLocaleDateString('en-IN')}</div>
                      <div>🕒 {new Date(payment.uploadedAt).toLocaleTimeString('en-IN')}</div>
                      {payment.verifiedAt && (
                        <div style={{ color: '#28a745', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                          ✅ Verified: {new Date(payment.verifiedAt).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => viewPaymentDetails(payment)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            minWidth: '80px'
                          }}
                        >
                          📋 Details
                        </button>
                        
                        <button
                          onClick={() => viewPaymentScreenshot(payment._id)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#6f42c1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            minWidth: '80px'
                          }}
                        >
                          🖼️ Screenshot
                        </button>
                        
                        {payment.status === 'pending_verification' && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => handlePaymentVerification(payment._id, 'verified')}
                              style={{
                                padding: '0.375rem 0.5rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason && reason.trim()) {
                                  handlePaymentVerification(payment._id, 'rejected', reason.trim());
                                }
                              }}
                              style={{
                                padding: '0.375rem 0.5rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paymentScreenshots.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#666'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
              <h3>No payment screenshots found</h3>
              <p>No payments matching the current filter criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#f8f9fa'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
                color: currentPage === 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            
            <span style={{ margin: '0 1rem', color: '#666' }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff',
                color: currentPage === totalPages ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>Payment Details</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <strong>Payment ID:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>
                  {selectedPayment._id}
                </div>
              </div>
              
              <div>
                <strong>Amount:</strong>
                <div style={{ color: '#28a745', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {formatAmount(selectedPayment.amount)}
                </div>
              </div>
              
              <div>
                <strong>Buyer:</strong>
                <div>{selectedPayment.buyer?.name || 'Unknown'}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {selectedPayment.buyerEmail}
                </div>
              </div>
              
              <div>
                <strong>Payment Method:</strong>
                <div style={{ textTransform: 'uppercase' }}>
                  {selectedPayment.paymentMethod || 'UPI'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  UPI ID: {selectedPayment.upiId}
                </div>
              </div>
              
              <div>
                <strong>Product:</strong>
                <div>{selectedPayment.product?.title || 'Product Deleted'}</div>
                {selectedPayment.product?.price && (
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    Listed Price: {formatAmount(selectedPayment.product.price)}
                  </div>
                )}
              </div>
              
              <div>
                <strong>Status:</strong>
                <div>
                  <span style={{
                    ...getStatusColor(selectedPayment.status),
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize'
                  }}>
                    {selectedPayment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => viewPaymentScreenshot(selectedPayment._id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                View Screenshot
              </button>
              
              {selectedPayment.status === 'pending_verification' && (
                <>
                  <button
                    onClick={() => handlePaymentVerification(selectedPayment._id, 'verified')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Approve Payment
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason && reason.trim()) {
                        handlePaymentVerification(selectedPayment._id, 'rejected', reason.trim());
                      }
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Reject Payment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}