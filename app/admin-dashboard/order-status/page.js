// app/admin-dashboard/order-status/page.js - CREATE NEW FILE
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderStatusManagement() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [stepFilter, setStepFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statistics, setStatistics] = useState({});
  const [orderSteps, setOrderSteps] = useState({});
  const [syncLoading, setSyncLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [assigningAdmin, setAssigningAdmin] = useState({});

  // Step update modal state
  const [updateModal, setUpdateModal] = useState({
    show: false,
    orderId: null,
    step: null,
    details: '',
    loading: false
  });

  // Fail order modal state
  const [failModal, setFailModal] = useState({
    show: false,
    orderId: null,
    step: null,
    reason: '',
    loading: false
  });

  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchOrders();
    fetchAdmins();
  }, [filter, stepFilter, adminFilter, pagination.page]);

  const checkAuth = () => {
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
    } catch (error) {
      router.push('/admin-login');
      return;
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      let url = `/api/admin/order-status?page=${pagination.page}&limit=20`;
      if (filter !== 'all') url += `&status=${filter}`;
      if (stepFilter !== 'all') url += `&step=${stepFilter}`;
      if (adminFilter !== 'all') url += `&admin=${adminFilter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
        setStatistics(data.data.statistics);
        setOrderSteps(data.data.orderSteps);
      } else {
        setError(data.error || 'Failed to fetch orders');
        if (response.status === 401) {
          router.push('/admin-login');
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setAdmins(data.data.admins);
      } else {
        console.error('Failed to fetch admins:', data.error);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const assignAdmin = async (orderId, adminId) => {
    try {
      setAssigningAdmin(prev => ({ ...prev, [orderId]: true }));
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/order-status/${orderId}/assign-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignedAdminId: adminId })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Order assigned to admin successfully!`);
        fetchOrders(); // Refresh orders to show updated assignment
      } else {
        alert(data.error || 'Failed to assign admin');
      }
    } catch (error) {
      console.error('Error assigning admin:', error);
      alert('Network error. Please try again.');
    } finally {
      setAssigningAdmin(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const bulkAssignAdmin = async (adminId, ordersToAssign) => {
    try {
      const token = localStorage.getItem('adminToken');
      let successCount = 0;
      let failCount = 0;

      for (const order of ordersToAssign) {
        try {
          const response = await fetch(`/api/admin/order-status/${order._id}/assign-admin`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assignedAdminId: adminId })
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      alert(`Bulk assignment completed!\n✅ Successfully assigned: ${successCount}\n❌ Failed: ${failCount}`);
      fetchOrders(); // Refresh orders to show updated assignments
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      alert('Network error during bulk assignment. Please try again.');
    }
  };

  const syncVerifiedPayments = async () => {
    try {
      setSyncLoading(true);
      setError(''); // Clear previous errors
      const token = localStorage.getItem('adminToken');

      console.log('Starting sync of verified payments...');

      const response = await fetch('/api/admin/order-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Sync response:', data);

      if (response.ok) {
        if (data.data && data.data.created > 0) {
          alert(`✅ Sync completed successfully!\n\nCreated ${data.data.created} new order status records.\nExisting records: ${data.data.existing}`);
        } else {
          alert(`ℹ️ Sync completed!\n\nNo new order status records were created.\nThis usually means:\n• All verified payments already have order statuses\n• No verified payments exist\n• All orders are already processed`);
        }
        fetchOrders(); // Refresh orders to show updated data
      } else {
        const errorMessage = data.error || 'Failed to sync orders';
        console.error('Sync failed:', errorMessage);
        setError(`Sync failed: ${errorMessage}`);
        
        // Show detailed error alert
        alert(`❌ Sync failed!\n\nError: ${errorMessage}\n\nPlease check:\n• Database connection\n• Payment screenshot data\n• Admin permissions\n\nCheck browser console for more details.`);
      }
    } catch (error) {
      console.error('Network error during sync:', error);
      const errorMessage = error.message || 'Network error occurred';
      setError(`Network error: ${errorMessage}`);
      
      alert(`❌ Sync failed!\n\nNetwork error: ${errorMessage}\n\nPlease check:\n• Internet connection\n• Server status\n• Try again in a few moments`);
    } finally {
      setSyncLoading(false);
    }
  };

  const debugDatabase = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Getting debug information...');

      const response = await fetch('/api/admin/order-status?debug=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Debug response:', data);

      if (response.ok) {
        const debugInfo = data.data;
        let debugMessage = '🔍 Database Debug Information:\n\n';
        
        debugMessage += `📸 Payment Screenshots:\n`;
        debugMessage += `• Total: ${debugInfo.collections.payment_screenshots.total}\n`;
        debugMessage += `• Verified: ${debugInfo.collections.payment_screenshots.verified}\n`;
        
        debugMessage += `\n📦 Orders:\n`;
        debugMessage += `• Total: ${debugInfo.collections.orders.total}\n`;
        debugMessage += `• With Payment Screenshot: ${debugInfo.collections.orders.withPaymentScreenshot}\n`;
        
        debugMessage += `\n📋 Order Statuses:\n`;
        debugMessage += `• Total: ${debugInfo.collections.order_status.total}\n`;
        
        debugMessage += `\n👥 Users:\n`;
        debugMessage += `• Buyers: ${debugInfo.collections.buyers.total}\n`;
        debugMessage += `• Sellers: ${debugInfo.collections.sellers.total}\n`;
        debugMessage += `• Listings: ${debugInfo.collections.listings.total}\n`;

        if (debugInfo.collections.payment_screenshots.verified === 0) {
          debugMessage += `\n⚠️ ISSUE: No verified payments found!\n`;
          debugMessage += `This explains why sync isn't working.\n`;
          debugMessage += `Check if payments are being verified properly.`;
        }

        alert(debugMessage);
      } else {
        alert(`❌ Debug failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Debug error:', error);
      alert(`❌ Debug error: ${error.message}`);
    }
  };

  const openUpdateModal = (orderId, step) => {
    setUpdateModal({
      show: true,
      orderId,
      step,
      details: '',
      loading: false
    });
  };

  const closeUpdateModal = () => {
    setUpdateModal({
      show: false,
      orderId: null,
      step: null,
      details: '',
      loading: false
    });
  };

  const openFailModal = (orderId, step) => {
    setFailModal({
      show: true,
      orderId,
      step,
      reason: '',
      loading: false
    });
  };

  const closeFailModal = () => {
    setFailModal({
      show: false,
      orderId: null,
      step: null,
      reason: '',
      loading: false
    });
  };

  const updateOrderStep = async () => {
    try {
      setUpdateModal(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/order-status/${updateModal.orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          step: updateModal.step,
          status: 'completed',
          details: updateModal.details
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        closeUpdateModal();
        fetchOrders();
      } else {
        alert(data.error || 'Failed to update step');
      }
    } catch (error) {
      console.error('Error updating step:', error);
      alert('Network error. Please try again.');
    } finally {
      setUpdateModal(prev => ({ ...prev, loading: false }));
    }
  };

  const failOrder = async () => {
    try {
      setFailModal(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/order-status/${failModal.orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          step: failModal.step,
          status: 'failed',
          details: failModal.reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        closeFailModal();
        fetchOrders();
      } else {
        alert(data.error || 'Failed to mark as failed');
      }
    } catch (error) {
      console.error('Error failing order:', error);
      alert('Network error. Please try again.');
    } finally {
      setFailModal(prev => ({ ...prev, loading: false }));
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStepStatusColor = (step) => {
    switch (step.status) {
      case 'completed':
        return { bg: '#d4edda', color: '#155724', icon: '✅' };
      case 'pending':
        return { bg: '#fff3cd', color: '#856404', icon: '⏳' };
      case 'failed':
        return { bg: '#f8d7da', color: '#721c24', icon: '❌' };
      default:
        return { bg: '#e9ecef', color: '#6c757d', icon: '⚪' };
    }
  };

  const getProgressPercentage = (order) => {
    let completedSteps = 0;
    for (let i = 1; i <= 7; i++) {
      if (order.steps[i]?.status === 'completed') {
        completedSteps++;
      }
    }
    return (completedSteps / 7) * 100;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get placeholder text for each step
  const getStepPlaceholder = (step) => {
    const placeholders = {
      1: 'Payment verification details...',
      2: 'Details about updating item status (e.g., "Item marked as sold in system")',
      3: 'Buyer call details (e.g., "Called buyer, confirmed delivery address: XYZ College, Room 123")',
      4: 'Seller call details (e.g., "Called seller, arranged pickup time: 2 PM today")',
      5: 'Delivery details (e.g., "Item delivered to buyer at XYZ College hostel, received by John")',
      6: 'Payment release details (e.g., "Payment of ₹4,500 released to seller (₹5,000 - ₹500 commission)")',
      7: 'Order completion details (e.g., "Order successfully completed, both parties confirmed satisfaction")'
    };
    return placeholders[step] || 'Enter step completion details...';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
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
          Loading order status...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
            📦 Order Status Management
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: '#6c757d', 
            fontSize: '0.95rem' 
          }}>
            Track and manage order fulfillment process
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/admin-dashboard/profile?tab=schedule')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            📅 Schedule
          </button>
          
          <button
            onClick={syncVerifiedPayments}
            disabled={syncLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: syncLoading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: syncLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {syncLoading ? '🔄 Syncing...' : '🔄 Sync Verified Payments'}
          </button>
          
          <button
            onClick={debugDatabase}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            title="Debug database state to troubleshoot sync issues"
          >
            🔍 Debug Database
          </button>
          
          {/* Bulk Assign Admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              id="bulkAssignAdmin"
              style={{
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select Admin</option>
              {admins.map(admin => (
                <option key={admin._id} value={admin._id}>
                  {admin.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const adminId = document.getElementById('bulkAssignAdmin').value;
                if (!adminId) {
                  alert('Please select an admin first');
                  return;
                }
                const unassignedOrders = orders.filter(o => !o.assignedAdminId);
                if (unassignedOrders.length === 0) {
                  alert('No unassigned orders found');
                  return;
                }
                if (confirm(`Assign ${unassignedOrders.length} unassigned orders to ${admins.find(a => a._id === adminId)?.name}?`)) {
                  bulkAssignAdmin(adminId, unassignedOrders);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              📋 Bulk Assign
            </button>
          </div>
          
          <button
            onClick={() => router.push('/admin-dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            ← Back to Dashboard
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
          border: '1px solid #f1aeb5'
        }}>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {statistics.statusStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { status: 'in_progress', label: 'In Progress', color: '#ffc107', icon: '🔄' },
            { status: 'completed', label: 'Completed', color: '#28a745', icon: '✅' },
            { status: 'failed', label: 'Failed', color: '#dc3545', icon: '❌' }
          ].map(item => {
            const count = statistics.statusStats.find(s => s._id === item.status)?.count || 0;
            return (
              <div key={item.status} style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: item.color, marginBottom: '0.5rem' }}>
                  {count}
                </div>
                <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>{item.label}</div>
              </div>
            );
          })}
          
          {/* Admin Assignment Stats */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1', marginBottom: '0.5rem' }}>
              {orders.filter(o => o.assignedAdminId).length}
            </div>
            <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>Assigned</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❓</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.5rem' }}>
              {orders.filter(o => !o.assignedAdminId).length}
            </div>
            <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>Unassigned</div>
          </div>
          
          {/* Revenue and Commission Stats */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
              {formatCurrency(orders.reduce((sum, order) => sum + (order.buyerPrice || order.orderAmount || 0), 0))}
            </div>
            <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>Total Revenue</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545', marginBottom: '0.5rem' }}>
              {formatCurrency(orders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0))}
            </div>
            <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>Total Commission</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
              Status Filter:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            >
              <option value="all">All Orders</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
              Current Step:
            </label>
            <select
              value={stepFilter}
              onChange={(e) => setStepFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            >
              <option value="all">All Steps</option>
              <option value="1">Step 1: Payment Verified</option>
              <option value="2">Step 2: Item Status Updated</option>
              <option value="3">Step 3: Buyer Called</option>
              <option value="4">Step 4: Seller Called</option>
              <option value="5">Step 5: Order Delivered</option>
              <option value="6">Step 6: Payment Released</option>
              <option value="7">Step 7: Order Complete</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
              Assigned Admin:
            </label>
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            >
              <option value="all">All Admins</option>
              <option value="unassigned">Unassigned</option>
              {admins.map(admin => (
                <option key={admin._id} value={admin._id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => {
                setFilter('all');
                setStepFilter('all');
                setAdminFilter('all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔄 Reset All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.25rem', fontWeight: '600' }}>
            Order Status Tracking
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
            Manage the 7-step order fulfillment process
          </p>
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#e7f3ff', 
            border: '1px solid #b3d9ff', 
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#004085'
          }}>
            <strong>💡 Assigned Admin Feature:</strong> Use the "Assigned Admin" column to assign specific admins to handle each order. 
            This helps with workload distribution and accountability. You can also use the bulk assign feature to assign multiple unassigned orders at once.
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                  Order Details & Pricing
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                  Buyer Info
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                  Seller Info
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                  Progress
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                  Current Step
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                  Assigned Admin
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const progress = getProgressPercentage(order);
                const progressColor = progress === 100 ? '#28a745' : '#007bff';
                const currentStepInfo = orderSteps[order.currentStep];
                const stepColors = getStepStatusColor(order.steps[order.currentStep] || { status: 'pending' });
                
                return (
                  <tr key={order._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#333', fontSize: '0.95rem' }}>
                          {order.productTitle}
                        </strong>
                      </div>
                      
                      {/* Pricing Breakdown */}
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        marginBottom: '0.5rem',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                          💰 Pricing Breakdown
                        </div>
                        
                        {/* Listing Price */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '0.25rem',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{ color: '#6c757d' }}>Listing Price:</span>
                          <span style={{ fontWeight: '500', color: '#28a745' }}>
                            {formatCurrency(order.listingPrice || 0)}
                          </span>
                        </div>
                        
                        {/* Total Buyer Price */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '0.25rem',
                          borderTop: '1px solid #dee2e6',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          <span style={{ color: '#495057' }}>Total Buyer Price:</span>
                          <span style={{ color: '#007bff', fontSize: '0.9rem' }}>
                            {formatCurrency(order.buyerPrice || order.orderAmount || 0)}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                        Created: {formatDate(order.createdAt)}
                      </div>
                    </td>
                    
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        <strong>{order.buyerName}</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        📧 {order.buyerEmail}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        📞 {order.buyerPhone}
                      </div>
                    </td>
                    
                    <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        <strong>{order.sellerName}</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        📧 {order.sellerEmail}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        📞 {order.sellerPhone}
                      </div>
                    </td>
                    
                    <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'top' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: `conic-gradient(${progressColor} ${progress}%, #e9ecef ${progress}% 100%)`,
                          margin: '0 auto',
                          display: 'grid',
                          placeItems: 'center'
                        }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: progressColor
                            }}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                        {Math.round(progress / (100/7))} of 7 steps
                      </div>
                    </td>
                    
                    <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'top' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: stepColors.bg,
                        color: stepColors.color,
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        <span>{stepColors.icon}</span>
                        <span>Step {order.currentStep}</span>
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6c757d', 
                        marginTop: '0.5rem',
                        maxWidth: '150px',
                        lineHeight: '1.3'
                      }}>
                        {currentStepInfo?.name}
                      </div>
                    </td>
                    
                    <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'top' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <select
                          value={order.assignedAdminId || ''}
                          onChange={(e) => assignAdmin(order._id, e.target.value)}
                          disabled={assigningAdmin[order._id]}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            backgroundColor: 'white',
                            minWidth: '150px'
                          }}
                        >
                          <option value="">Select Admin</option>
                          {admins.map(admin => (
                            <option key={admin._id} value={admin._id}>
                              {admin.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {order.assignedAdminId ? (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#28a745',
                          backgroundColor: '#d4edda',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          display: 'inline-block'
                        }}>
                          ✅ {admins.find(a => a._id === order.assignedAdminId)?.name || 'Unknown Admin'}
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#6c757d',
                          backgroundColor: '#f8f9fa',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          display: 'inline-block'
                        }}>
                          ❓ Unassigned
                        </div>
                      )}
                      {assigningAdmin[order._id] && (
                        <div style={{ fontSize: '0.75rem', color: '#007bff', marginTop: '0.25rem' }}>
                          ⏳ Assigning...
                        </div>
                      )}
                    </td>
                    
                    <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                          onClick={() => viewOrderDetails(order)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          📋 View Details
                        </button>
                        {order.currentStep <= 7 && order.steps[order.currentStep]?.status !== 'completed' && (
                          <button
                            onClick={() => openUpdateModal(order._id, order.currentStep)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            ✅ Complete Step {order.currentStep}
                          </button>
                        )}
                        {order.overallStatus !== 'failed' && (
                          <button
                            onClick={() => openFailModal(order._id, order.currentStep)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            ❌ Fail Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6c757d'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>No Orders Found</h3>
              <p style={{ margin: 0 }}>
                {filter === 'all' 
                  ? 'No verified payment orders available. Try syncing verified payments.' 
                  : 'No orders match the current filter criteria.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: pagination.page === 1 ? '#e9ecef' : '#007bff',
                color: pagination.page === 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ 
              padding: '0.5rem 1rem', 
              color: '#333',
              display: 'flex',
              alignItems: 'center'
            }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: pagination.page === pagination.totalPages ? '#e9ecef' : '#007bff',
                color: pagination.page === pagination.totalPages ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            maxHeight: '90vh',
            width: '90%',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>Order Status Details</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>

            {/* Order Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>📦 Order Information</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p><strong>Product:</strong> {selectedOrder.productTitle}</p>
                  <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                  <p><strong>Created:</strong> {formatDate(selectedOrder.createdAt)}</p>
                </div>
                
                {/* Detailed Pricing Breakdown */}
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginTop: '1rem',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057', fontSize: '1rem' }}>
                    💰 Detailed Pricing
                  </h4>
                  
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}>
                      <span style={{ color: '#6c757d' }}>Listing Price:</span>
                      <span style={{ fontWeight: '600', color: '#28a745' }}>
                        {formatCurrency(selectedOrder.listingPrice || 0)}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}>
                      <span style={{ color: '#6c757d' }}>
                        Commission:
                      </span>
                      <span style={{ fontWeight: '600', color: '#dc3545' }}>
                        {formatCurrency(selectedOrder.commissionAmount || 0)}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#e7f3ff',
                      borderRadius: '4px',
                      border: '2px solid #007bff',
                      fontWeight: '600'
                    }}>
                      <span style={{ color: '#004085' }}>Total Buyer Price:</span>
                      <span style={{ color: '#007bff', fontSize: '1.1rem' }}>
                        {formatCurrency(selectedOrder.buyerPrice || selectedOrder.orderAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>👥 Contact Information</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p><strong>Buyer:</strong> {selectedOrder.buyerName}</p>
                  <p><strong>Buyer Phone:</strong> {selectedOrder.buyerPhone}</p>
                  <p><strong>Seller:</strong> {selectedOrder.sellerName}</p>
                  <p><strong>Seller Phone:</strong> {selectedOrder.sellerPhone}</p>
                </div>
              </div>
            </div>

            {/* Assigned Admin Info */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>👤 Assigned Admin</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    Assign Admin:
                  </label>
                  <select
                    value={selectedOrder.assignedAdminId || ''}
                    onChange={(e) => assignAdmin(selectedOrder._id, e.target.value)}
                    disabled={assigningAdmin[selectedOrder._id]}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      backgroundColor: 'white',
                      width: '100%'
                    }}
                  >
                    <option value="">Select Admin</option>
                    {admins.map(admin => (
                      <option key={admin._id} value={admin._id}>
                        {admin.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedOrder.assignedAdminId && (
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                      <p><strong>Current Admin:</strong> {admins.find(a => a._id === selectedOrder.assignedAdminId)?.name || 'Unknown Admin'}</p>
                      {selectedOrder.assignedAt && (
                        <p><strong>Assigned:</strong> {formatDate(selectedOrder.assignedAt)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {assigningAdmin[selectedOrder._id] && (
                <div style={{ fontSize: '0.85rem', color: '#007bff', marginTop: '0.5rem' }}>
                  ⏳ Updating assignment...
                </div>
              )}
            </div>

            {/* Steps Progress */}
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>📋 Process Steps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(orderSteps).map(([stepNum, stepInfo]) => {
                  const step = selectedOrder.steps[stepNum];
                  const colors = getStepStatusColor(step || { status: 'pending' });
                  const isCurrentStep = parseInt(stepNum) === selectedOrder.currentStep;
                  
                  return (
                    <div key={stepNum} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: isCurrentStep ? '#e7f3ff' : '#f8f9fa',
                      border: isCurrentStep ? '2px solid #007bff' : '1px solid #e9ecef'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: colors.bg,
                        color: colors.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}>
                        {colors.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <strong style={{ color: '#333' }}>
                            Step {stepNum}: {stepInfo.name}
                          </strong>
                          {isCurrentStep && (
                            <span style={{
                              backgroundColor: '#007bff',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                          {stepInfo.description}
                        </div>
                        {step?.details && (
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#333',
                            backgroundColor: '#f8f9fa',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginTop: '0.5rem'
                          }}>
                            <strong>Details:</strong> {step.details}
                          </div>
                        )}
                        {step?.completedAt && (
                          <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                            Completed: {formatDate(step.completedAt)}
                          </div>
                        )}
                      </div>
                      {step?.status !== 'completed' && parseInt(stepNum) === selectedOrder.currentStep && (
                        <button
                          onClick={() => openUpdateModal(selectedOrder._id, parseInt(stepNum))}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Update Modal */}
      {updateModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
              Complete Step {updateModal.step}: {orderSteps[updateModal.step]?.name}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
              {orderSteps[updateModal.step]?.description}
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500', 
                color: '#333' 
              }}>
                Details (Required):
              </label>
              <textarea
                value={updateModal.details}
                onChange={(e) => setUpdateModal(prev => ({ ...prev, details: e.target.value }))}
                placeholder={getStepPlaceholder(updateModal.step)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={closeUpdateModal}
                disabled={updateModal.loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: updateModal.loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={updateOrderStep}
                disabled={updateModal.loading || !updateModal.details.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: updateModal.loading || !updateModal.details.trim() ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: updateModal.loading || !updateModal.details.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {updateModal.loading ? '⏳ Updating...' : '✅ Complete Step'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Order Modal */}
      {failModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '520px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#333' }}>
              Mark Order as Failed
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
              You are failing this order at step {failModal.step}. Please provide a clear reason. This action will set the overall status to failed.
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Reason (Required):
              </label>
              <textarea
                value={failModal.reason}
                onChange={(e) => setFailModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={'Explain why the order is being failed...'}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={closeFailModal}
                disabled={failModal.loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: failModal.loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={failOrder}
                disabled={failModal.loading || !failModal.reason.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: failModal.loading || !failModal.reason.trim() ? '#6c757d' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: failModal.loading || !failModal.reason.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {failModal.loading ? '⏳ Failing...' : '❌ Mark as Failed'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}