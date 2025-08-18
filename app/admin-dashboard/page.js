// app/admin-dashboard/page.js - ENHANCED VERSION
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingPayments: 0,
    verifiedPayments: 0,
    sellerPaymentRequests: 0,
    pendingSellerPayments: 0,
    totalRevenue: 0
  });

  const router = useRouter();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchDashboardStats(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    initializeAdmin();
  }, [router]);

  const initializeAdmin = () => {
    try {
      const token = localStorage.getItem('adminToken');
      const admin = localStorage.getItem('adminData');
      
      if (!token || !admin) {
        router.push('/admin-login');
        return;
      }

      const adminInfo = JSON.parse(admin);
      if (adminInfo.role !== 'admin') {
        router.push('/admin-login');
        return;
      }
      
      setAdminData(adminInfo);
      fetchDashboardStats();
    } catch (error) {
      console.error('Error initializing admin:', error);
      clearAuthData();
      router.push('/admin-login');
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  };

  const fetchDashboardStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(silent);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('No authentication token');
      }

      // Fetch all dashboard stats with timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const apiCalls = Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/payment-screenshots', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/seller-transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [
        usersResponse,
        productsResponse,
        ordersResponse,
        paymentsResponse,
        sellerPaymentsResponse
      ] = await Promise.race([apiCalls, timeout]);

      // Check for authentication errors
      const responses = [usersResponse, productsResponse, ordersResponse, paymentsResponse, sellerPaymentsResponse];
      const unauthorizedResponse = responses.find(res => res.status === 401);
      
      if (unauthorizedResponse) {
        clearAuthData();
        router.push('/admin-login');
        return;
      }

      // Process responses with error handling
      const processResponse = async (response) => {
        if (!response.ok) {
          console.warn(`API call failed: ${response.url} - ${response.status}`);
          return null;
        }
        try {
          return await response.json();
        } catch (e) {
          console.warn(`Failed to parse JSON from ${response.url}`);
          return null;
        }
      };

      const [usersData, productsData, ordersData, paymentsData, sellerPaymentsData] = await Promise.all(
        responses.map(processResponse)
      );

      // Calculate stats with null checking
      const stats = {
        totalUsers: (usersData?.data?.buyers?.length || 0) + (usersData?.data?.sellers?.length || 0),
        totalBuyers: usersData?.data?.buyers?.length || 0,
        totalSellers: usersData?.data?.sellers?.length || 0,
        totalProducts: productsData?.data?.products?.length || 0,
        totalOrders: ordersData?.data?.orders?.length || 0,
        pendingPayments: paymentsData?.data?.screenshots?.filter(p => p.status === 'pending_verification')?.length || 0,
        verifiedPayments: paymentsData?.data?.screenshots?.filter(p => p.status === 'verified')?.length || 0,
        sellerPaymentRequests: sellerPaymentsData?.data?.summary?.total || 0,
        pendingSellerPayments: sellerPaymentsData?.data?.summary?.pending || 0,
        totalRevenue: paymentsData?.data?.screenshots?.filter(p => p.status === 'verified')?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      };

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      if (error.message === 'Request timeout') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError('Failed to load dashboard statistics. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  const handleLogout = () => {
    clearAuthData();
    router.push('/admin-login');
  };

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount || 0);
    } catch (e) {
      return `₹${amount || 0}`;
    }
  };

  const navigateWithErrorHandler = (path) => {
    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
      setError('Navigation failed. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e9ecef',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Loading dashboard...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            color: '#212529',
            fontSize: '1.75rem',
            fontWeight: '600'
          }}>
            Admin Dashboard
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: '#6c757d', 
            fontSize: '0.95rem' 
          }}>
            Welcome back, <strong>{adminData?.name || 'Admin'}</strong>!
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: refreshing ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            aria-label="Refresh dashboard data"
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #f1aeb5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem'
            }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {/* Users Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #007bff, #0056b3)',
              color: 'white', 
              padding: '16px', 
              borderRadius: '12px',
              marginRight: '1rem',
              fontSize: '1.25rem'
            }}>
              👥
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>Total Users</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                Registered platform users
              </p>
            </div>
          </div>
          <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#007bff', margin: '0 0 0.5rem 0' }}>
            {dashboardStats.totalUsers.toLocaleString()}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            fontSize: '0.9rem', 
            color: '#6c757d'
          }}>
            <span>👤 {dashboardStats.totalBuyers} Buyers</span>
            <span>🏪 {dashboardStats.totalSellers} Sellers</span>
          </div>
        </div>

        {/* Products Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #28a745, #1e7e34)',
              color: 'white', 
              padding: '16px', 
              borderRadius: '12px',
              marginRight: '1rem',
              fontSize: '1.25rem'
            }}>
              📦
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>Total Products</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                Active marketplace listings
              </p>
            </div>
          </div>
          <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#28a745', margin: '0 0 0.5rem 0' }}>
            {dashboardStats.totalProducts.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
            Available for purchase
          </p>
        </div>

        {/* Orders Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #ffc107, #e0a800)',
              color: 'white', 
              padding: '16px', 
              borderRadius: '12px',
              marginRight: '1rem',
              fontSize: '1.25rem'
            }}>
              🛍️
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>Total Orders</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                Completed transactions
              </p>
            </div>
          </div>
          <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#ffc107', margin: '0 0 0.5rem 0' }}>
            {dashboardStats.totalOrders.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
            All time orders
          </p>
        </div>

        {/* Payment Verification Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #17a2b8, #117a8b)',
              color: 'white', 
              padding: '16px', 
              borderRadius: '12px',
              marginRight: '1rem',
              fontSize: '1.25rem'
            }}>
              💳
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>Payment Screenshots</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                Awaiting verification
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#17a2b8', margin: 0 }}>
              {dashboardStats.pendingPayments.toLocaleString()}
            </p>
            {dashboardStats.pendingPayments > 0 && (
              <span style={{
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                URGENT
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
            ✅ {dashboardStats.verifiedPayments} verified
          </p>
        </div>

        {/* Seller Payment Requests Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #6f42c1, #59359a)',
              color: 'white', 
              padding: '16px', 
              borderRadius: '12px',
              marginRight: '1rem',
              fontSize: '1.25rem'
            }}>
              💰
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>Seller Payments</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                Pending payout requests
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#6f42c1', margin: 0 }}>
              {dashboardStats.pendingSellerPayments.toLocaleString()}
            </p>
            {dashboardStats.pendingSellerPayments > 0 && (
              <span style={{
                backgroundColor: '#ffc107',
                color: '#212529',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                PENDING
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
            📊 {dashboardStats.sellerPaymentRequests} total requests
          </p>
        </div>

        {/* Revenue Stats */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #e83e8c, #d91a72)',
              color: 'white', 
              padding: '16px', 
              borderRadius: '12px',
              marginRight: '1rem',
              fontSize: '1.25rem'
            }}>
              💸
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>Total Revenue</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                Verified transactions
              </p>
            </div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#e83e8c', margin: '0 0 0.5rem 0' }}>
            {formatCurrency(dashboardStats.totalRevenue)}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
            From verified payments
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#212529', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>Quick Actions</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {/* User Management */}
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #e9ecef', 
            borderRadius: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ color: '#212529', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              👥 User Management
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigateWithErrorHandler('/admin-dashboard/management')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                👥 Manage Users & Accounts
              </button>
              <button
                onClick={() => navigateWithErrorHandler('/admin-dashboard/management')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1e7e34'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
              >
                📦 Manage Products & Listings
              </button>
            </div>
          </div>

          {/* Payment Management */}
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #e9ecef', 
            borderRadius: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ color: '#212529', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              💳 Payment Management
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigateWithErrorHandler('/admin-dashboard/payments')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#117a8b'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#17a2b8'}
              >
                💳 Payment Screenshot Verification
                {dashboardStats.pendingPayments > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {dashboardStats.pendingPayments}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigateWithErrorHandler('/admin-dashboard/seller-payments')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#59359a'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6f42c1'}
              >
                💰 Seller Payment Requests
                {dashboardStats.pendingSellerPayments > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {dashboardStats.pendingSellerPayments}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Reports & Analytics */}
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #e9ecef', 
            borderRadius: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ color: '#212529', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              📊 Reports & Analytics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => alert('📊 Comprehensive reports feature coming soon!\n\n• User analytics\n• Sales reports\n• Revenue tracking\n• Performance metrics')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e0a800'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
              >
                📊 Generate Reports
              </button>
              <button
                onClick={() => alert('📈 Advanced analytics dashboard coming soon!\n\n• Real-time metrics\n• Custom dashboards\n• Data visualization\n• Trend analysis')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#e83e8c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#d91a72'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e83e8c'}
              >
                📈 Analytics Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ color: '#212529', margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            System Overview
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: refreshing ? '#fff3cd' : '#d1ecf1',
            color: refreshing ? '#856404' : '#0c5460',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            <span style={{ fontSize: '1rem' }}>{refreshing ? '🔄' : '✅'}</span>
            {refreshing ? 'Updating data...' : 'Data updated'}
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              icon: '👥',
              title: 'Active Users',
              value: `${dashboardStats.totalUsers.toLocaleString()} registered`,
              color: '#007bff',
              bgColor: '#e7f3ff'
            },
            {
              icon: '📦',
              title: 'Active Listings',
              value: `${dashboardStats.totalProducts.toLocaleString()} products`,
              color: '#28a745',
              bgColor: '#e8f5e8'
            },
            {
              icon: '🛍️',
              title: 'Total Orders',
              value: `${dashboardStats.totalOrders.toLocaleString()} transactions`,
              color: '#ffc107',
              bgColor: '#fff8e1'
            },
            {
              icon: '💳',
              title: 'Payment Verification',
              value: `${dashboardStats.pendingPayments} pending`,
              color: '#17a2b8',
              bgColor: '#e1f7fa',
              urgent: dashboardStats.pendingPayments > 0
            },
            {
              icon: '💰',
              title: 'Seller Payouts',
              value: `${dashboardStats.pendingSellerPayments} pending`,
              color: '#6f42c1',
              bgColor: '#f3e8ff',
              urgent: dashboardStats.pendingSellerPayments > 0
            }
          ].map((item, index) => (
            <div key={index} style={{ 
              textAlign: 'center', 
              padding: '1.5rem',
              backgroundColor: item.bgColor,
              borderRadius: '12px',
              border: item.urgent ? `2px solid ${item.color}` : '1px solid #e9ecef',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                fontSize: '2.5rem', 
                marginBottom: '0.75rem',
                filter: item.urgent ? 'drop-shadow(0 0 8px rgba(220, 53, 69, 0.3))' : 'none'
              }}>
                {item.icon}
              </div>
              <div style={{ 
                fontWeight: '600', 
                color: '#212529',
                fontSize: '1rem',
                marginBottom: '0.25rem'
              }}>
                {item.title}
              </div>
              <div style={{ 
                color: item.color,
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                {item.value}
              </div>
              {item.urgent && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'inline-block'
                }}>
                  NEEDS ATTENTION
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Stats Summary */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            color: '#212529', 
            marginBottom: '1rem', 
            fontSize: '1.1rem', 
            fontWeight: '600' 
          }}>
            📈 Key Metrics Summary
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#212529' }}>User Growth</div>
              <div style={{ color: '#6c757d' }}>
                {((dashboardStats.totalBuyers + dashboardStats.totalSellers) / Math.max(1, dashboardStats.totalBuyers) * 100).toFixed(1)}% buyer conversion
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#212529' }}>Order Rate</div>
              <div style={{ color: '#6c757d' }}>
                {dashboardStats.totalProducts > 0 ? (dashboardStats.totalOrders / dashboardStats.totalProducts).toFixed(2) : '0'} orders per product
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#212529' }}>Payment Status</div>
              <div style={{ color: '#6c757d' }}>
                {dashboardStats.verifiedPayments + dashboardStats.pendingPayments > 0 
                  ? ((dashboardStats.verifiedPayments / (dashboardStats.verifiedPayments + dashboardStats.pendingPayments)) * 100).toFixed(1)
                  : '0'}% verified
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#212529' }}>Avg Revenue</div>
              <div style={{ color: '#6c757d' }}>
                {dashboardStats.verifiedPayments > 0 
                  ? formatCurrency(dashboardStats.totalRevenue / dashboardStats.verifiedPayments)
                  : formatCurrency(0)} per transaction
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#6c757d',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: 0 }}>
          Admin Dashboard • Last updated: {new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
          Data refreshes automatically every 30 seconds
        </p>
      </div>
    </div>
  );
}