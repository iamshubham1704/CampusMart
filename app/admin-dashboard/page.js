// app/admin-dashboard/page.js - ENHANCED VERSION
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all"); // all, buyer, seller
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
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

  // Reports stats state
  const [reportsStats, setReportsStats] = useState({
    pending: 0,
    'in-progress': 0,
    resolved: 0,
    closed: 0,
    total: 0
  });

  // Commission settings state
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionSaving, setCommissionSaving] = useState(false);

  const router = useRouter();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchDashboardStats(true);
        fetchData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    initializeAdmin();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [filter]);

  // Filter and paginate users
  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === "all" || user.userType === filter;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Debug logging
  console.log('Pagination Debug:', {
    totalUsers: users.length,
    filteredUsers: filteredUsers.length,
    currentPage,
    usersPerPage,
    indexOfFirstUser,
    indexOfLastUser,
    currentUsers: currentUsers.length,
    totalPages,
    filter,
    searchTerm
  });

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
      fetchData();
      fetchCommission();
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

  // Fetch reports data function
  const fetchReportsData = async (token) => {
    try {
      const response = await fetch('/api/admin/reports?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReportsStats(data.statistics.status);
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      // Always fetch ALL users first, then filter locally
      const [usersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/users?all=true', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ]);

      const usersData = await usersResponse.json();
      const statsData = await statsResponse.json();

      if (usersResponse.ok) {
        console.log('Users API Response:', usersData);
        setUsers(usersData.data.users);
        // Reset to first page when new data arrives
        setCurrentPage(1);
      } else {
        setError(usersData.error || "Failed to fetch users");
      }

      if (statsResponse.ok) {
        setStats(statsData.data);
      }

      // Fetch reports data
      await fetchReportsData(token);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Network error. Please try again.");
    }
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
        fetch('/api/admin/listings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/order-status', {
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

      // Debug logging
      console.log('Dashboard API responses:', {
        usersData,
        productsData,
        ordersData,
        paymentsData,
        sellerPaymentsData
      });

      // Calculate stats with null checking
      const newStats = {
        totalUsers: (usersData?.data?.buyers?.length || 0) + (usersData?.data?.sellers?.length || 0),
        totalBuyers: usersData?.data?.buyers?.length || 0,
        totalSellers: usersData?.data?.sellers?.length || 0,
        totalProducts: productsData?.data?.listings?.length || 0,
        totalOrders: ordersData?.data?.orderStatuses?.length || 0,
        pendingPayments: paymentsData?.data?.screenshots?.filter(p => p.status === 'pending_verification')?.length || 0,
        verifiedPayments: paymentsData?.data?.screenshots?.filter(p => p.status === 'verified')?.length || 0,
        sellerPaymentRequests: sellerPaymentsData?.data?.summary?.total || 0,
        pendingSellerPayments: sellerPaymentsData?.data?.summary?.pending || 0,
        totalRevenue: paymentsData?.data?.screenshots?.filter(p => p.status === 'verified')?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      };

      setDashboardStats(newStats);
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

  const fetchCommission = async () => {
    try {
      setCommissionLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCommissionPercent(data.data.commissionPercent ?? 10);
      }
    } catch (e) {
      console.error('Error fetching commission settings:', e);
    } finally {
      setCommissionLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    try {
      const parsed = parseFloat(commissionPercent);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        alert('Commission must be between 0 and 100');
        return;
      }
      setCommissionSaving(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commissionPercent: parsed })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Commission updated successfully');
        setCommissionPercent(parsed);
      } else {
        alert(data.error || 'Failed to update commission');
      }
    } catch (e) {
      console.error('Error updating commission:', e);
      alert('Network error. Please try again.');
    } finally {
      setCommissionSaving(false);
    }
  };

  const handleStatusChange = async (userId, userType, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "ban";

    if (!confirm(`Are you sure you want to ${action} this ${userType}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          userType,
          isActive: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user in the local state
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isActive: newStatus } : user
          )
        );

        alert(`User ${newStatus ? "activated" : "banned"} successfully!`);
      } else {
        alert(data.error || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleLogout = () => {
    clearAuthData();
    router.push('/admin-login');
  };

  const handleRefresh = () => {
    fetchDashboardStats();
    fetchData();
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
        <style jsx global>{`
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
            onClick={() => navigateWithErrorHandler('/admin-dashboard/management')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1e7e34'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            Manage Content
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: refreshing ? '#6c757d' : '#17a2b8',
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

      {/* Enhanced Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Total Users Stats */}
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
            {stats ? stats.users.totalUsers.toLocaleString() : dashboardStats.totalUsers.toLocaleString()}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            fontSize: '0.9rem', 
            color: '#6c757d'
          }}>
            <span>👤 {stats ? stats.users.totalBuyers : dashboardStats.totalBuyers} Buyers</span>
            <span>🏪 {stats ? stats.users.totalSellers : dashboardStats.totalSellers} Sellers</span>
          </div>
        </div>

        {/* Active Users Stats */}
        {stats && (
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
                ✅
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>Active Users</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                  Currently active accounts
                </p>
              </div>
            </div>
            <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#28a745', margin: '0 0 0.5rem 0' }}>
              {stats.overview.activeUsers.toLocaleString()}
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              fontSize: '0.9rem', 
              color: '#6c757d'
            }}>
              <span>👤 {stats.users.activeBuyers} Buyers</span>
              <span>🏪 {stats.users.activeSellers} Sellers</span>
            </div>
          </div>
        )}

        {/* New Users This Week */}
        {stats && (
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
                🆕
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#212529', fontSize: '1.1rem', fontWeight: '600' }}>New This Week</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.85rem' }}>
                  Recent registrations
                </p>
              </div>
            </div>
            <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#ffc107', margin: '0 0 0.5rem 0' }}>
              {stats.users.newUsersThisWeek.toLocaleString()}
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              fontSize: '0.9rem', 
              color: '#6c757d'
            }}>
              <span>👤 {stats.users.newBuyersThisWeek} Buyers</span>
              <span>🏪 {stats.users.newSellersThisWeek} Sellers</span>
            </div>
          </div>
        )}

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
              background: 'linear-gradient(135deg, #17a2b8, #117a8b)',
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
          <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#17a2b8', margin: '0 0 0.5rem 0' }}>
            {dashboardStats.totalProducts.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>
            Available for purchase
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
              background: 'linear-gradient(135deg, #e83e8c, #d91a72)',
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
            <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#e83e8c', margin: 0 }}>
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
      </div>

      {/* Reports Management Card */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '8px',
            marginRight: '1rem'
          }}>
            📋
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#333' }}>Reports Management</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              User reports and issues
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
              {reportsStats.pending || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              Pending
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0dcaf0' }}>
              {reportsStats['in-progress'] || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              In Progress
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#198754' }}>
              {reportsStats.resolved || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              Resolved
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6c757d' }}>
              {reportsStats.closed || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              Closed
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => router.push('/admin-dashboard/reports')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📋 Manage Reports
          </button>
          <button
            onClick={() => router.push('/admin-dashboard/reports?status=pending')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🚨 Pending Issues
          </button>
        </div>
      </div>

      {/* Commission Settings */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: '#212529' }}>Commission Settings</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Set global commission applied on each listing (default 10%).
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              disabled={commissionLoading || commissionSaving}
              style={{
                width: '120px',
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '6px'
              }}
            />
            <span style={{ color: '#6c757d' }}>%</span>
            <button
              onClick={handleUpdateCommission}
              disabled={commissionLoading || commissionSaving}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: commissionSaving ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: commissionSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {commissionSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      

          {/* Order Management */}
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #e9ecef', 
            borderRadius: '12px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ color: '#212529', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              📦 Order Management
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigateWithErrorHandler('/admin-dashboard/order-status')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#fd7e14',
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
                onMouseOver={(e) => e.target.style.backgroundColor = '#e8610c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#fd7e14'}
              >
                📦 Order Status Tracking
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  NEW
                </span>
              </button>
              <button
                onClick={() => alert('📋 Order analytics coming soon!\n\n• Order completion rates\n• Average processing time\n• Step-wise analytics\n• Performance metrics')}
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: '#20c997',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1ba085'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#20c997'}
              >
                📊 Order Analytics
              </button>
            </div>
          </div>


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

      {/* Users Management Section */}
      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: '1px solid #e9ecef',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <h2 style={{ margin: 0, color: "#333" }}>User Management</h2>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setFilter("all");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: filter === "all" ? "#007bff" : "#e9ecef",
                color: filter === "all" ? "white" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              All Users
            </button>
            <button
              onClick={() => {
                setFilter("buyer");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: filter === "buyer" ? "#007bff" : "#e9ecef",
                color: filter === "buyer" ? "white" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Buyers
            </button>
            <button
              onClick={() => {
                setFilter("seller");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: filter === "seller" ? "#007bff" : "#e9ecef",
                color: filter === "seller" ? "white" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Sellers
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flex: "1",
            maxWidth: "400px"
          }}>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              style={{
                padding: "0.5rem 0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                fontSize: "0.9rem",
                flex: "1",
                minWidth: "250px"
              }}
            />
            <span style={{ color: "#6c757d", fontSize: "0.9rem" }}>
              {filteredUsers.length} users found • Page {currentPage} of {totalPages}
            </span>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Pagination Summary */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          padding: "0.5rem 0",
          fontSize: "0.9rem",
          color: "#6c757d"
        }}>
          <span>
            {loading ? (
              "Loading users..."
            ) : (
              `Showing ${indexOfFirstUser + 1} to ${Math.min(indexOfLastUser, filteredUsers.length)} of ${filteredUsers.length} users`
            )}
          </span>
          {totalPages > 1 && !loading && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* Users Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #dee2e6",
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                  fontWeight: "bold",
                }}>
                  Name
                </th>
                <th style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                  fontWeight: "bold",
                }}>
                  Email
                </th>
                <th style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                  fontWeight: "bold",
                }}>
                  Type
                </th>
                <th style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                  fontWeight: "bold",
                }}>
                  Status
                </th>
                <th style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                  fontWeight: "bold",
                }}>
                  Joined
                </th>
                <th style={{
                  padding: "0.75rem",
                  textAlign: "center",
                  borderBottom: "1px solid #dee2e6",
                  fontWeight: "bold",
                }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <div style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid #e9ecef",
                        borderTop: "2px solid #007bff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                <tr key={user._id} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: "0.75rem" }}>{user.name}</td>
                  <td style={{ padding: "0.75rem" }}>{user.email}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: user.userType === "buyer" ? "#e7f3ff" : "#fff3cd",
                      color: user.userType === "buyer" ? "#004085" : "#856404",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      textTransform: "capitalize",
                    }}>
                      {user.userType}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: user.isActive ? "#d4edda" : "#f8d7da",
                      color: user.isActive ? "#155724" : "#721c24",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}>
                      {user.isActive ? "Active" : "Banned"}
                    </span>
                  </td>
                  <td style={{
                    padding: "0.75rem",
                    color: "#666",
                    fontSize: "0.875rem",
                  }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                    <button
                      onClick={() => handleStatusChange(user._id, user.userType, user.isActive)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        backgroundColor: user.isActive ? "#dc3545" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      {user.isActive ? "Ban" : "Activate"}
                    </button>
                   </td>
                 </tr>
               ))
              )}
             </tbody>
          </table>

          {currentUsers.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "2rem",
              color: "#666",
            }}>
              {filteredUsers.length === 0 ? (
                <div>
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>No users found</div>
                  <div style={{ fontSize: "0.9rem" }}>There are currently no users in the system.</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>No users match your criteria</div>
                  <div style={{ fontSize: "0.9rem" }}>
                    Try adjusting your search terms or filters. Found {filteredUsers.length} total users.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1.5rem",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: currentPage === 1 ? "#e9ecef" : "#007bff",
                color: currentPage === 1 ? "#6c757d" : "white",
                border: "none",
                borderRadius: "6px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "0.9rem"
              }}
            >
              ← Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: currentPage === page ? "#007bff" : "#e9ecef",
                  color: currentPage === page ? "white" : "#333",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  minWidth: "40px"
                }}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: currentPage === totalPages ? "#e9ecef" : "#007bff",
                color: currentPage === totalPages ? "#6c757d" : "white",
                border: "none",
                borderRadius: "6px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "0.9rem"
              }}
            >
              Next →
            </button>
          </div>
        )}
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
              value: `${stats ? stats.overview.activeUsers.toLocaleString() : dashboardStats.totalUsers.toLocaleString()} registered`,
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
                {stats ? `${((stats.users.activeBuyers / Math.max(1, stats.users.totalUsers)) * 100).toFixed(1)}% active rate` : `${((dashboardStats.totalBuyers + dashboardStats.totalSellers) / Math.max(1, dashboardStats.totalBuyers) * 100).toFixed(1)}% buyer conversion`}
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