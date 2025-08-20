// app/admin-dashboard/management/page.js - UPDATED VERSION
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminManagementPage() {
  const [activeTab, setActiveTab] = useState('listings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const router = useRouter();

  // Listings state
  const [listings, setListings] = useState([]);
  const [listingsFilter, setListingsFilter] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingsSearchTerm, setListingsSearchTerm] = useState('');
  const [listingsCurrentPage, setListingsCurrentPage] = useState(1);
  const [listingsPerPage, setListingsPerPage] = useState(20); // Changed from 10 to 20
  const [listingsTotal, setListingsTotal] = useState(0);
  const [jumpToPage, setJumpToPage] = useState('');
  const [listingsLoading, setListingsLoading] = useState(false);
  
  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [conversationsFilter, setConversationsFilter] = useState('all');
  
  // Messages state
  const [messages, setMessages] = useState([]);
  const [messagesFilter, setMessagesFilter] = useState('all');

  // Payment Screenshots state
  const [paymentScreenshots, setPaymentScreenshots] = useState([]);
  const [paymentsFilter, setPaymentsFilter] = useState('pending_verification');
  const [commissionEdits, setCommissionEdits] = useState({});

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
      fetchData();
    } catch (error) {
      console.error('Error parsing admin data:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      router.push('/admin-login');
    }
  }, [activeTab, listingsFilter, conversationsFilter, messagesFilter, paymentsFilter, listingsCurrentPage, router]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setListingsCurrentPage(1);
  }, [listingsFilter, listingsSearchTerm]);

  // Reset pagination when items per page changes
  useEffect(() => {
    setListingsCurrentPage(1);
  }, [listingsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (activeTab === 'listings') {
        await fetchListings(token);
      } else if (activeTab === 'conversations') {
        await fetchConversations(token);
      } else if (activeTab === 'messages') {
        await fetchMessages(token);
      } else if (activeTab === 'payments') {
        await fetchPaymentScreenshots(token);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const openListingDetails = (listing) => {
    setSelectedListing(listing);
    setShowListingModal(true);
  };

  const closeListingDetails = () => {
    setShowListingModal(false);
    setSelectedListing(null);
  };

  const getListingImageUrl = (listing) => {
    const fallback = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop';
    if (!listing || !listing.images) return fallback;
    const first = Array.isArray(listing.images) ? listing.images[0] : listing.images;
    if (typeof first === 'string' && first.trim().length > 0) return first;
    if (first && typeof first === 'object') return first.url || first.thumbnailUrl || first.secure_url || first.path || fallback;
    return fallback;
  };

  const fetchListings = async (token) => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (listingsFilter !== 'all') {
        params.append('status', listingsFilter);
      }
      params.append('page', listingsCurrentPage);
      params.append('limit', listingsPerPage);
      
      const response = await fetch(`/api/admin/listings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setListings(data.data.listings);
        // Update total count if available from API
        if (data.data.pagination && data.data.pagination.total) {
          setListingsTotal(data.data.pagination.total);
        }
      } else {
        setError(data.error || 'Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Network error while fetching listings');
    } finally {
      setListingsLoading(false);
    }
  };

  // Filter listings by search term (client-side filtering for better UX)
  const filteredListings = listings.filter(listing => {
    if (!listingsSearchTerm) return true;
    
    const lowerSearch = listingsSearchTerm.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(lowerSearch) ||
      listing.description?.toLowerCase().includes(lowerSearch) ||
      listing.seller_name?.toLowerCase().includes(lowerSearch) ||
      listing.seller_email?.toLowerCase().includes(lowerSearch) ||
      listing.category?.toLowerCase().includes(lowerSearch) ||
      listing.price?.toString().includes(lowerSearch)
    );
  });

  // Calculate pagination based on server-side total
  const totalListingsPages = Math.ceil(listingsTotal / listingsPerPage);

  const handleListingsPageChange = (pageNumber) => {
    setListingsCurrentPage(pageNumber);
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalListingsPages) {
      setListingsCurrentPage(pageNum);
      setJumpToPage('');
    } else {
      alert(`Please enter a page number between 1 and ${totalListingsPages}`);
    }
  };

  const handleItemsPerPageChange = (newPerPage) => {
    setListingsPerPage(newPerPage);
  };

  const fetchConversations = async (token) => {
    const statusParam = conversationsFilter !== 'all' ? `?status=${conversationsFilter}` : '';
    const response = await fetch(`/api/admin/conversations${statusParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (response.ok) {
      setConversations(data.data.conversations);
    } else {
      setError(data.error || 'Failed to fetch conversations');
    }
  };

  const fetchMessages = async (token) => {
    const statusParam = messagesFilter !== 'all' ? `?status=${messagesFilter}` : '';
    const response = await fetch(`/api/admin/messages${statusParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (response.ok) {
      setMessages(data.data.messages);
    } else {
      setError(data.error || 'Failed to fetch messages');
    }
  };

  // NEW: Fetch Payment Screenshots
  const fetchPaymentScreenshots = async (token) => {
    const statusParam = paymentsFilter !== 'all' ? `?status=${paymentsFilter}` : '';
    const response = await fetch(`/api/admin/payment-screenshots${statusParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (response.ok) {
      setPaymentScreenshots(data.data.screenshots);
    } else {
      setError(data.error || 'Failed to fetch payment screenshots');
    }
  };

  // NEW: Handle Payment Verification
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

      if (response.ok) {
        // Update the payment screenshot in local state
        setPaymentScreenshots(paymentScreenshots.map(payment => 
          payment._id === screenshotId 
            ? { ...payment, status: action, verifiedAt: new Date(), rejectionReason }
            : payment
        ));
        alert(`Payment ${action} successfully!`);
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Network error. Please try again.');
    }
  };

  // NEW: View Payment Screenshot
  const viewPaymentScreenshot = (screenshotId) => {
    const token = localStorage.getItem('adminToken');
    const imageUrl = `/api/payment-screenshots/image/${screenshotId}?token=${token}`;
    window.open(imageUrl, '_blank', 'width=800,height=600');
  };

  // Existing functions (handleListingStatusChange, handleConversationStatusChange, etc.)
  const handleListingStatusChange = async (listingId, newStatus) => {
    if (!confirm(`Are you sure you want to change listing status to ${newStatus}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/listings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId,
          status: newStatus
        })
      });

      const data = await response.json();

      if (response.ok) {
        setListings(listings.map(listing => 
          listing._id === listingId 
            ? { ...listing, status: newStatus }
            : listing
        ));
        alert(`Listing status updated to ${newStatus} successfully!`);
      } else {
        alert(data.error || 'Failed to update listing status');
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleListingCommissionSave = async (listingId) => {
    const value = commissionEdits[listingId];
    const commissionNum = parseFloat(value);
    if (Number.isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      alert('Commission must be a number between 0 and 100');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/listings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listingId, commission: commissionNum })
      });

      const data = await response.json();
      if (response.ok) {
        setListings(listings.map(listing =>
          listing._id === listingId ? { ...listing, commission: commissionNum } : listing
        ));
        alert('Commission updated');
      } else {
        alert(data.error || 'Failed to update commission');
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleConversationStatusChange = async (conversationId, isActive) => {
    const action = isActive ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this conversation?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          isActive
        })
      });

      const data = await response.json();

      if (response.ok) {
        setConversations(conversations.map(conversation => 
          conversation._id === conversationId 
            ? { ...conversation, isActive }
            : conversation
        ));
        alert(`Conversation ${action}d successfully!`);
      } else {
        alert(data.error || 'Failed to update conversation status');
      }
    } catch (error) {
      console.error('Error updating conversation status:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleMessageStatusChange = async (messageId, isActive) => {
    const action = isActive ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this message?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId,
          isActive
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(messages.map(message => 
          message._id === messageId 
            ? { ...message, isActive }
            : message
        ));
        alert(`Message ${action}d successfully!`);
      } else {
        alert(data.error || 'Failed to update message status');
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/admin-login');
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
        Loading...
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
        <h1 style={{ margin: 0, color: '#333' }}>
          Admin Management Panel
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666' }}>
            Welcome, {adminData?.name}
          </span>
          <button
            onClick={() => router.push('/admin-dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Dashboard
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

      {/* Tab Navigation - UPDATED WITH PAYMENTS TAB AND REPORTS TAB */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('listings')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'listings' ? '#007bff' : '#e9ecef',
              color: activeTab === 'listings' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'listings' ? 'bold' : 'normal'
            }}
          >
            Listings Management
          </button>
          {/* <button
            onClick={() => setActiveTab('conversations')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'conversations' ? '#007bff' : '#e9ecef',
              color: activeTab === 'conversations' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'conversations' ? 'bold' : 'normal'
            }}
          >
            Conversations
          </button> */}
          {/* <button
            onClick={() => setActiveTab('messages')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'messages' ? '#007bff' : '#e9ecef',
              color: activeTab === 'messages' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'messages' ? 'bold' : 'normal'
            }}
          >
            Messages
          </button> */}
          {/* PAYMENT VERIFICATION TAB */}
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'payments' ? '#007bff' : '#e9ecef',
              color: activeTab === 'payments' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'payments' ? 'bold' : 'normal'
            }}
          >
            Payment Verification
          </button>
          {/* REPORTS TAB */}
          <button
            onClick={() => router.push('/admin-dashboard/reports')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e9ecef',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'normal'
            }}
          >
            📋 Reports
          </button>
        </div>
      </div>

      {/* Existing Tabs (Listings, Conversations, Messages) - Keep existing code */}
      
      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <div>
              <h2 style={{ margin: 0, color: '#333' }}>Listings Management</h2>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span>
                  <strong>Total:</strong> {listingsTotal} listings
                </span>
                <span>
                  <strong>Filter:</strong> {listingsFilter === 'all' ? 'All Statuses' : listingsFilter.charAt(0).toUpperCase() + listingsFilter.slice(1)}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'active', 'inactive', 'sold', 'pending'].map(status => (
                <button
                  key={status}
                  onClick={() => setListingsFilter(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: listingsFilter === status ? '#007bff' : '#e9ecef',
                    color: listingsFilter === status ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '1rem'
          }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search listings by title, description, seller, category, or price..."
                value={listingsSearchTerm}
                onChange={(e) => setListingsSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem'
            }}>
              <div>
                Showing <strong>{filteredListings.length}</strong> of <strong>{listingsTotal}</strong> total listings
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                Page {listingsCurrentPage} of {totalListingsPages} • {listingsPerPage} per page
              </div>
            </div>
          </div>

                    <div style={{ overflowX: 'auto' }}>
            {listingsLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                color: '#666',
                fontSize: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #007bff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Loading listings...
                </div>
              </div>
            )}
            
            {!listingsLoading && (
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #dee2e6'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Title</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Seller</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Views</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Commission (%)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <strong>{listing.title}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {listing.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div>{listing.seller_name || 'Unknown Seller'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{listing.seller_email || 'No email'}</div>
                        {listing.seller_phone && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{listing.seller_phone}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>₹{listing.price}</td>
                    <td style={{ padding: '0.75rem' }}>{listing.category}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: listing.status === 'active' ? '#d4edda' : 
                                       listing.status === 'sold' ? '#fff3cd' : '#f8d7da',
                        color: listing.status === 'active' ? '#155724' : 
                               listing.status === 'sold' ? '#856404' : '#721c24',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        textTransform: 'capitalize'
                      }}>
                        {listing.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{listing.views || 0}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={
                            commissionEdits[listing._id] !== undefined
                              ? commissionEdits[listing._id]
                              : (listing.commission ?? 10)
                          }
                          onChange={(e) => setCommissionEdits(prev => ({ ...prev, [listing._id]: e.target.value }))}
                          style={{ width: '90px', padding: '0.25rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <button
                          onClick={() => handleListingCommissionSave(listing._id)}
                          style={{ padding: '0.375rem 0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={() => openListingDetails(listing)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          View
                        </button>
                        <select
                          value={listing.status || 'active'}
                          onChange={(e) => handleListingStatusChange(listing._id, e.target.value)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="sold">Sold</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}

            {!listingsLoading && filteredListings.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                {listingsSearchTerm 
                  ? 'No listings match your search criteria.' 
                  : 'No listings found.'}
                {listingsSearchTerm && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setListingsSearchTerm('')}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Pagination Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              {/* Pagination Info */}
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>Page {listingsCurrentPage}</strong> of <strong>{totalListingsPages}</strong> 
                ({listingsTotal} total listings)
              </div>

              {/* Items Per Page Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>Show:</span>
                <select
                  value={listingsPerPage}
                  onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>per page</span>
              </div>

              {/* Jump to Page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={totalListingsPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
                  style={{
                    width: '60px',
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}
                  placeholder="Page"
                />
                <button
                  onClick={handleJumpToPage}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Go
                </button>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            {totalListingsPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
                padding: '1rem'
              }}>
                {/* First Page Button */}
                <button
                  onClick={() => handleListingsPageChange(1)}
                  disabled={listingsCurrentPage === 1}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: listingsCurrentPage === 1 ? '#e9ecef' : '#007bff',
                    color: listingsCurrentPage === 1 ? '#666' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: listingsCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                  title="First Page"
                >
                  ««
                </button>

                {/* Previous Button */}
                <button
                  onClick={() => handleListingsPageChange(listingsCurrentPage - 1)}
                  disabled={listingsCurrentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: listingsCurrentPage === 1 ? '#e9ecef' : '#007bff',
                    color: listingsCurrentPage === 1 ? '#666' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: listingsCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Previous
                </button>
                
                {/* Page Numbers with Smart Display */}
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 7;
                  
                  if (totalListingsPages <= maxVisiblePages) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalListingsPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Smart pagination for large numbers
                    if (listingsCurrentPage <= 4) {
                      // Near start: show first 5 + ... + last
                      for (let i = 1; i <= 5; i++) pages.push(i);
                      pages.push('...');
                      pages.push(totalListingsPages);
                    } else if (listingsCurrentPage >= totalListingsPages - 3) {
                      // Near end: show first + ... + last 5
                      pages.push(1);
                      pages.push('...');
                      for (let i = totalListingsPages - 4; i <= totalListingsPages; i++) pages.push(i);
                    } else {
                      // Middle: show first + ... + current-1, current, current+1 + ... + last
                      pages.push(1);
                      pages.push('...');
                      for (let i = listingsCurrentPage - 1; i <= listingsCurrentPage + 1; i++) pages.push(i);
                      pages.push('...');
                      pages.push(totalListingsPages);
                    }
                  }
                  
                  return pages.map((pageNum, index) => (
                    <span key={index}>
                      {pageNum === '...' ? (
                        <span style={{ padding: '0.5rem 0.75rem', color: '#666' }}>...</span>
                      ) : (
                        <button
                          onClick={() => handleListingsPageChange(pageNum)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: pageNum === listingsCurrentPage ? '#007bff' : '#e9ecef',
                            color: pageNum === listingsCurrentPage ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            minWidth: '40px',
                            fontWeight: pageNum === listingsCurrentPage ? 'bold' : 'normal'
                          }}
                        >
                          {pageNum}
                        </button>
                      )}
                    </span>
                  ));
                })()}
                
                {/* Next Button */}
                <button
                  onClick={() => handleListingsPageChange(listingsCurrentPage + 1)}
                  disabled={listingsCurrentPage === totalListingsPages}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: listingsCurrentPage === totalListingsPages ? '#e9ecef' : '#007bff',
                    color: listingsCurrentPage === totalListingsPages ? '#666' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: listingsCurrentPage === totalListingsPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Next
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => handleListingsPageChange(totalListingsPages)}
                  disabled={listingsCurrentPage === totalListingsPages}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: listingsCurrentPage === totalListingsPages ? '#e9ecef' : '#007bff',
                    color: listingsCurrentPage === totalListingsPages ? '#666' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: listingsCurrentPage === totalListingsPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                  title="Last Page"
                >
                  »»
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keep existing Conversations and Messages tabs... */}

      {/* NEW PAYMENT VERIFICATION TAB */}
      {activeTab === 'payments' && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>Payment Verification</h2>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'pending_verification', 'verified', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setPaymentsFilter(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: paymentsFilter === status ? '#007bff' : '#e9ecef',
                    color: paymentsFilter === status ? 'white' : '#333',
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
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #dee2e6'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Order Details</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Buyer</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Product</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Uploaded</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentScreenshots.map((payment) => (
                  <tr key={payment._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <strong>ID:</strong> {payment._id}
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          <strong>Method:</strong> {payment.paymentMethod}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          <strong>UPI:</strong> {payment.upiId}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <strong>{payment.buyer?.name || 'Unknown'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{payment.buyerEmail}</div>
                        {payment.buyer?.phone && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{payment.buyer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <strong>{payment.product?.title || 'Product Deleted'}</strong>
                        {payment.product?.price && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Listed: ₹{payment.product.price}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: '#28a745' }}>₹{payment.amount}</strong>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 
                          payment.status === 'verified' ? '#d4edda' : 
                          payment.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                        color: 
                          payment.status === 'verified' ? '#155724' : 
                          payment.status === 'rejected' ? '#721c24' : '#856404',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        textTransform: 'capitalize'
                      }}>
                        {payment.status.replace('_', ' ')}
                      </span>
                      {payment.rejectionReason && (
                        <div style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '0.25rem' }}>
                          {payment.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
                      {new Date(payment.uploadedAt).toLocaleDateString()}
                      <div>{new Date(payment.uploadedAt).toLocaleTimeString()}</div>
                      {payment.verifiedAt && (
                        <div style={{ color: '#28a745', fontSize: '0.7rem' }}>
                          Verified: {new Date(payment.verifiedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                          onClick={() => viewPaymentScreenshot(payment._id)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          View Screenshot
                        </button>
                        
                        {payment.status === 'pending_verification' && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => handlePaymentVerification(payment._id, 'verified')}
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handlePaymentVerification(payment._id, 'rejected', reason);
                                }
                              }}
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paymentScreenshots.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666'
              }}>
                No payment screenshots found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keep existing Conversations and Messages tabs code here... */}
      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>Conversations Management</h2>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'active', 'inactive'].map(status => (
                <button
                  key={status}
                  onClick={() => setConversationsFilter(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: conversationsFilter === status ? '#007bff' : '#e9ecef',
                    color: conversationsFilter === status ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #dee2e6'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Participants</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Listing</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Messages</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Last Message</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <strong>Buyer:</strong> {conversation.buyer_name}
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{conversation.buyer_email}</div>
                        <strong>Seller:</strong> {conversation.seller_name}
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{conversation.seller_email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div>{conversation.listing_title || 'N/A'}</div>
                        {conversation.listing_price && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>₹{conversation.listing_price}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{conversation.messages_count}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        {conversation.last_message?.substring(0, 40)}...
                      </div>
                      {conversation.last_message_at && (
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {new Date(conversation.last_message_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: conversation.isActive !== false ? '#d4edda' : '#f8d7da',
                        color: conversation.isActive !== false ? '#155724' : '#721c24',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {conversation.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleConversationStatusChange(
                          conversation._id, 
                          conversation.isActive === false
                        )}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: conversation.isActive !== false ? '#dc3545' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        {conversation.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {conversations.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666'
              }}>
                No conversations found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>Messages Management</h2>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'active', 'inactive'].map(status => (
                <button
                  key={status}
                  onClick={() => setMessagesFilter(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: messagesFilter === status ? '#007bff' : '#e9ecef',
                    color: messagesFilter === status ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #dee2e6'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Sender</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Message</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Listing</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <strong>{message.sender_name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{message.sender_email}</div>
                        <span style={{
                          padding: '0.2rem 0.4rem',
                          backgroundColor: '#e9ecef',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          textTransform: 'capitalize'
                        }}>
                          {message.sender_type}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ 
                        maxWidth: '200px',
                        wordWrap: 'break-word',
                        fontSize: '0.9rem'
                      }}>
                        {message.message}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {message.listing_title || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
                      {new Date(message.created_at).toLocaleDateString()}
                      <div>{new Date(message.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: message.isActive !== false ? '#d4edda' : '#f8d7da',
                        color: message.isActive !== false ? '#155724' : '#721c24',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {message.isActive !== false ? 'Active' : 'Deleted'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleMessageStatusChange(
                          message._id, 
                          message.isActive === false
                        )}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: message.isActive !== false ? '#dc3545' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        {message.isActive !== false ? 'Delete' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666'
              }}>
                No messages found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listing Details Modal */}
      <ListingDetailsModal
        open={showListingModal}
        listing={selectedListing}
        onClose={closeListingDetails}
        getImageUrl={getListingImageUrl}
      />
    </div>
  );
}

// Listing Details Modal (inline component styles)
// Rendered conditionally within the main component return above
// Inject the modal at the bottom to avoid layout shifts
// eslint-disable-next-line react/display-name
export function ListingDetailsModal({ open, listing, onClose, getImageUrl }) {
  if (!open || !listing) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          width: 'min(900px, 95vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0 }}>Listing Details</h3>
          <button onClick={onClose} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer' }}>Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', padding: '1rem' }}>
          <div>
            <img
              src={getImageUrl(listing)}
              alt={listing.title}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop'; }}
            />
            <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#555' }}>
              <div><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{listing.status || 'active'}</span></div>
              <div><strong>Category:</strong> {listing.category || 'N/A'}</div>
              {listing.subcategory && (<div><strong>Subcategory:</strong> {listing.subcategory}</div>)}
              {listing.location && (<div><strong>Location:</strong> {listing.location}</div>)}
              {listing.college && (<div><strong>College:</strong> {listing.college}</div>)}
              <div><strong>Views:</strong> {listing.views || 0}</div>
              <div><strong>Commission:</strong> {listing.commission ?? 10}%</div>
            </div>
          </div>

          <div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{listing.title}</h2>
            <div style={{ fontSize: '1.25rem', color: '#28a745', marginBottom: '0.75rem' }}>₹{listing.price}</div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>Seller</h4>
              <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee' }}>
                <div><strong>Name:</strong> {listing.seller_name || 'Unknown'}</div>
                <div><strong>Email:</strong> {listing.seller_email || 'N/A'}</div>
                <div><strong>Phone:</strong> {listing.seller_phone || 'N/A'}</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>Description</h4>
              <div style={{ whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: '0.75rem', color: '#444' }}>
                {listing.description || 'No description provided.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}