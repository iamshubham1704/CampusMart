'use client';
import { useState, useEffect } from 'react';
import AdminTeamManager from './AdminTeamManager';

// Delivery Bookings Manager Component
function DeliveryBookingsManager() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const url = statusFilter === 'all' 
        ? '/api/admin/deliveries' 
        : `/api/admin/deliveries?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setDeliveries(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        // Refresh deliveries
        fetchDeliveries();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleViewDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowViewModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-gray-500 mt-2">Loading deliveries...</div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No deliveries found for the selected status.
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Product:</span>
                      <div className="text-gray-900">{delivery.product?.title || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Seller:</span>
                      <div className="text-gray-900">{delivery.seller?.name || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <div className="text-gray-900">₹{delivery.product?.price || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Preferred Time:</span>
                      <div className="text-gray-900">{delivery.preferredTime || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewDelivery(delivery)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  
                  {delivery.status === 'pending' && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery._id, 'confirmed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  
                  {delivery.status === 'confirmed' && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery._id, 'completed')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Delivery Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedDelivery.status)}`}>
                      {selectedDelivery.status}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <div className="text-gray-900">
                      {new Date(selectedDelivery.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Product Details:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <div className="font-medium">{selectedDelivery.product?.title || 'N/A'}</div>
                    <div className="text-gray-600">₹{selectedDelivery.product?.price || 'N/A'}</div>
                    <div className="text-gray-600">{selectedDelivery.product?.location || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Seller Information:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <div className="font-medium">{selectedDelivery.seller?.name || 'N/A'}</div>
                    <div className="text-gray-600">{selectedDelivery.seller?.email || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Delivery Schedule:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <div className="font-medium">{selectedDelivery.adminSchedule?.date ? new Date(selectedDelivery.adminSchedule.date).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-gray-600">
                      {selectedDelivery.adminSchedule?.startTime} - {selectedDelivery.adminSchedule?.endTime}
                    </div>
                    <div className="text-gray-600">{selectedDelivery.adminSchedule?.location || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Preferred Time:</span>
                  <div className="text-gray-900">{selectedDelivery.preferredTime || 'N/A'}</div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Seller Notes:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1 text-gray-900">
                    {selectedDelivery.notes || 'No notes provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminScheduleManager({ adminId }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('delivery');
  const [currentAdminId, setCurrentAdminId] = useState(null);
  // Only schedules tab needed - no team assignment in this architecture
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    type: 'delivery',
    location: '',
    maxSlots: 10
  });

  // Generate calendar dates (3 days past, today, 6 days future)
  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
    // Add 3 days past
    for (let i = 3; i > 0; i--) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      dates.push({
        date: pastDate,
        isToday: false,
        isPast: true,
        isFuture: false
      });
    }
    
    // Add today
    dates.push({
      date: today,
      isToday: true,
      isPast: false,
      isFuture: false
    });
    
    // Add 6 days future
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      dates.push({
        date: futureDate,
        isToday: false,
        isPast: false,
        isFuture: true
      });
    }
    
    return dates;
  };

  const calendarDates = generateCalendarDates();

  // Time slots for selection
  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'
  ];

  useEffect(() => {
    // Get current admin ID from token
    const getCurrentAdminId = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
          // Decode JWT token to get admin ID
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 JWT token payload:', payload);
          console.log('🔍 Available fields:', Object.keys(payload));
          console.log('🔍 adminId field:', payload.adminId);
          console.log('🔍 userId field:', payload.userId);
          return payload.adminId || payload.userId;
        }
      } catch (error) {
        console.error('Error decoding admin token:', error);
      }
      return null;
    };

    const adminIdFromToken = getCurrentAdminId();
    console.log('🔍 Admin ID extracted from token:', adminIdFromToken);
    setCurrentAdminId(adminIdFromToken);
    
    if (adminIdFromToken) {
      console.log('✅ Admin ID found, fetching schedules...');
      fetchSchedules(adminIdFromToken);
    } else {
      console.log('❌ No admin ID found in token');
    }
  }, []);

  const fetchSchedules = async (adminIdToUse) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      console.log('🔍 Fetching schedules for admin:', adminIdToUse);
      console.log('🔑 Admin token present:', token ? 'Yes' : 'No');
      
      // Don't pass adminId as query param - API gets it from JWT token
      const response = await fetch('/api/admin/schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('📡 Schedule API response:', data);
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Schedules fetched successfully:', data.data.length);
        setSchedules(data.data);
      } else {
        console.error('❌ Schedule API error:', data.error);
        setError(data.error || 'Failed to fetch schedules');
      }
    } catch (error) {
      console.error('💥 Fetch schedules error:', error);
      setError('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    if (!currentAdminId) {
      setError('Admin ID not found. Please log in again.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('adminToken');
      console.log('🔧 Creating schedule with data:', formData);
      console.log('🔑 Admin token present:', token ? 'Yes' : 'No');
      console.log('👤 Current admin ID:', currentAdminId);
      
      const response = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          adminId: currentAdminId // Explicitly include admin ID
        })
      });
      
      const data = await response.json();
      console.log('📡 Schedule creation response:', data);
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        setSuccess('Schedule created successfully!');
        setFormData({
          date: '',
          startTime: '',
          endTime: '',
          type: 'delivery',
          location: '',
          maxSlots: 10
        });
        setShowCreateForm(false);
        fetchSchedules(currentAdminId);
      } else {
        setError(data.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('💥 Schedule creation error:', error);
      setError('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/schedule?id=${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Schedule deleted successfully!');
        fetchSchedules(currentAdminId);
      } else {
        setError(data.error || 'Failed to delete schedule');
      }
    } catch (error) {
      setError('Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  const getSchedulesByType = (date, type) => {
    return getSchedulesForDate(date).filter(schedule => schedule.type === type);
  };

  const formatTime = (time) => {
    return time.replace(':', ' ').replace('AM', ' AM').replace('PM', ' PM');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeColor = (type) => {
    return type === 'delivery' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getTypeIcon = (type) => {
    return type === 'delivery' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <p className="text-blue-100 mt-2">
              Manage schedules and team assignments for your assigned area
              {currentAdminId && (
                <span className="block text-sm mt-1">Admin ID: {currentAdminId}</span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold"
            >
              {showCreateForm ? '❌ Cancel' : '➕ Create Schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* Admin ID Warning */}
      {!currentAdminId && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Warning: Admin ID not detected. Please log in again to manage schedules and teams.
        </div>
      )}

      {/* Create Schedule Form */}
      {showCreateForm && currentAdminId && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Schedule
            <span className="text-sm font-normal text-gray-500">(Admin: {currentAdminId})</span>
          </h3>
          <form onSubmit={handleCreateSchedule} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="delivery">🚚 Delivery</option>
                  <option value="pickup">📦 Pickup</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Start Time *
                </label>
                <select
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time, index) => (
                    <option key={index} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  End Time *
                </label>
                <select
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time, index) => (
                    <option key={index} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Max Slots
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxSlots}
                  onChange={(e) => setFormData({...formData, maxSlots: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Campus Gate A, Student Center, etc."
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Schedule
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {/* Calendar View */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    10-Day Calendar View
                    {currentAdminId && (
                      <span className="text-sm font-normal text-gray-500">(Your Schedules Only)</span>
                    )}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Showing 3 days past, today, and 6 upcoming days for your assigned area
                  </p>
                </div>
                {currentAdminId && (
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    {showCreateForm ? 'Cancel' : '+ Create Schedule'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-5 gap-6">
                {calendarDates.map((dayData, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-4 min-h-[280px] transition-all duration-200 hover:shadow-lg ${
                      dayData.isToday 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                        : dayData.isPast 
                        ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100' 
                        : 'border-green-300 bg-gradient-to-br from-green-50 to-green-100'
                    }`}
                  >
                    {/* Date Header */}
                    <div className="text-center mb-4 pb-3 border-b border-gray-200">
                      <div className={`text-sm font-semibold ${
                        dayData.isToday ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {dayData.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-3xl font-bold ${
                        dayData.isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {dayData.date.getDate()}
                      </div>
                      <div className="text-sm text-gray-500 capitalize font-medium">
                        {dayData.date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>

                    {/* Delivery Schedule Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide">Delivery Schedule</h4>
                      </div>
                      <div className="space-y-2">
                        {getSchedulesByType(dayData.date, 'delivery').map((schedule) => (
                          <div
                            key={schedule._id}
                            className="bg-white p-2 rounded-lg border border-blue-200 text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                Delivery
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                                {schedule.status}
                              </span>
                            </div>
                            <div className="text-gray-700 font-medium text-xs">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {schedule.location}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {schedule.currentSlots}/{schedule.maxSlots} slots
                            </div>
                            <button
                              onClick={() => handleDeleteSchedule(schedule._id)}
                              className="text-red-600 hover:text-red-800 text-xs mt-1 hover:bg-red-50 px-1 py-0.5 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                        {getSchedulesByType(dayData.date, 'delivery').length === 0 && (
                          <div className="text-gray-400 text-xs text-center py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No delivery schedule
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pickup Schedule Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide">Pickup Schedule</h4>
                      </div>
                      <div className="space-y-2">
                        {getSchedulesByType(dayData.date, 'pickup').map((schedule) => (
                          <div
                            key={schedule._id}
                            className="bg-white p-2 rounded-lg border border-purple-200 text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                Pickup
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                                {schedule.status}
                              </span>
                            </div>
                            <div className="text-gray-700 font-medium text-xs">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {schedule.location}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {schedule.currentSlots}/{schedule.maxSlots} slots
                            </div>
                            <button
                              onClick={() => handleDeleteSchedule(schedule._id)}
                              className="text-red-600 hover:text-red-800 text-xs mt-1 hover:bg-red-50 px-1 py-0.5 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                        {getSchedulesByType(dayData.date, 'pickup').length === 0 && (
                          <div className="text-gray-400 text-xs text-center py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No pickup schedule
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Schedule Button for future dates */}
                    {dayData.isFuture && (
                      <button
                        onClick={() => {
                          setFormData({...formData, date: dayData.date.toISOString().split('T')[0]});
                          setShowCreateForm(true);
                        }}
                        className="w-full mt-2 text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg px-3 py-2 hover:bg-blue-50 transition-all duration-200 font-medium"
                      >
                        + Add Schedule
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                All Schedules
              </h3>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <div className="text-gray-500 mt-4 text-lg">Loading schedules...</div>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-gray-500 mt-4 text-lg">No schedules found. Create your first schedule above.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-2 rounded-full text-sm font-medium ${getTypeColor(schedule.type)} flex items-center gap-2`}>
                            {getTypeIcon(schedule.type)}
                            {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}
                          </span>
                          <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(schedule.status)}`}>
                            {schedule.status}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900 text-lg">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </div>
                          <div className="text-gray-600 mt-1">{schedule.location}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {schedule.currentSlots}/{schedule.maxSlots} slots
                          </div>
                          <div className="text-gray-500">
                            {Math.round((schedule.currentSlots / schedule.maxSlots) * 100)}% full
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteSchedule(schedule._id)}
                          className="text-red-600 hover:text-red-800 p-3 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete schedule"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delivery Bookings Management Section */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Delivery Bookings Management
            </h3>
            
            <DeliveryBookingsManager />
          </div>

          {/* Pickup Bookings Management Section */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Pickup Bookings Management
            </h3>
            
            <PickupBookingsManager />
          </div>
        </div>
      );
    }

// Pickup Bookings Manager Component
function PickupBookingsManager() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchPickups();
  }, [statusFilter]);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const url = statusFilter === 'all' 
        ? '/api/admin/pickups' 
        : `/api/admin/pickups?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setPickups(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch pickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePickupStatus = async (pickupId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/pickups/${pickupId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        // Refresh pickups
        fetchPickups();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleViewPickup = (pickup) => {
    setSelectedPickup(pickup);
    setShowViewModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Pickups List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <div className="text-gray-500 mt-2">Loading pickups...</div>
        </div>
      ) : pickups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pickups found for the selected status.
        </div>
      ) : (
        <div className="space-y-4">
          {pickups.map((pickup) => (
            <div
              key={pickup._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pickup.status)}`}>
                      {pickup.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(pickup.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Product:</span>
                      <div className="text-gray-900">{pickup.product?.title || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Buyer:</span>
                      <div className="text-gray-900">{pickup.buyer?.name || pickup.buyer?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Preferred Time:</span>
                      <div className="text-gray-900">{pickup.preferredTime || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Schedule:</span>
                      <div className="text-gray-900">
                        {pickup.adminSchedule?.date ? new Date(pickup.adminSchedule.date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewPickup(pickup)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    View Details
                  </button>
                  
                  {pickup.status === 'pending' && (
                    <button
                      onClick={() => updatePickupStatus(pickup._id, 'confirmed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  
                  {pickup.status === 'confirmed' && (
                    <button
                      onClick={() => updatePickupStatus(pickup._id, 'in_progress')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Start Pickup
                    </button>
                  )}
                  
                  {pickup.status === 'in_progress' && (
                    <button
                      onClick={() => updatePickupStatus(pickup._id, 'completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedPickup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Pickup Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedPickup.status)}`}>
                      {selectedPickup.status}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <div className="text-gray-900">
                      {new Date(selectedPickup.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Product Details:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <div className="font-medium">{selectedPickup.product?.title || 'N/A'}</div>
                    <div className="text-gray-600">₹{selectedPickup.product?.price || 'N/A'}</div>
                    <div className="text-gray-600">{selectedPickup.product?.location || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Buyer Information:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <div className="font-medium">{selectedPickup.buyer?.name || 'N/A'}</div>
                    <div className="text-gray-600">{selectedPickup.buyer?.email || 'N/A'}</div>
                    <div className="text-gray-600">{selectedPickup.buyer?.phone || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Pickup Schedule:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <div className="font-medium">{selectedPickup.adminSchedule?.date ? new Date(selectedPickup.adminSchedule.date).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-gray-600">
                      {selectedPickup.adminSchedule?.startTime} - {selectedPickup.adminSchedule?.endTime}
                    </div>
                    <div className="text-gray-600">{selectedPickup.adminSchedule?.location || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Preferred Time:</span>
                  <div className="text-gray-900">{selectedPickup.preferredTime || 'N/A'}</div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Buyer Notes:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1 text-gray-900">
                    {selectedPickup.notes || 'No notes provided'}
                  </div>
                </div>
                
                {selectedPickup.adminNotes && (
                  <div>
                    <span className="font-medium text-gray-700">Admin Notes:</span>
                    <div className="bg-gray-50 p-3 rounded mt-1 text-gray-900">
                      {selectedPickup.adminNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
