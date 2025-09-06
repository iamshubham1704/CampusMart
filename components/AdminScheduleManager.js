'use client';
import React, { useState, useEffect } from 'react';
import './AdminScheduleManager.css';
import { Calendar, Package, Download, Plus, Clock, MapPin, Users, Trash2, RefreshCw } from "lucide-react";

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
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300 shadow-amber-100';
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-100';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300 shadow-blue-100';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300 shadow-rose-100';
      default: return 'bg-slate-100 text-slate-800 border-slate-300 shadow-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filter Deliveries</h3>
              <p className="text-sm text-gray-600">Refine your delivery view by status</p>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium text-gray-700 shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Enhanced Deliveries List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-lg">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
            </div>
            <div className="text-gray-600 mt-6 text-lg font-medium">Loading deliveries...</div>
            <div className="text-gray-400 text-sm mt-2">Please wait while we fetch your data</div>
          </div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-16 border border-gray-200">
          <div className="text-center">
            <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Deliveries Found</h3>
            <p className="text-gray-600">No deliveries match the selected status filter.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {deliveries.map((delivery) => (
            <div
              key={delivery._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-sm ${getStatusColor(delivery.status)}`}>
                        {delivery.status.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">
                          {new Date(delivery.createdAt).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <span className="font-bold text-blue-800 text-sm uppercase tracking-wide">Product</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{delivery.product?.title || 'N/A'}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-bold text-green-800 text-sm uppercase tracking-wide">Seller</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{delivery.seller?.name || 'N/A'}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <span className="font-bold text-purple-800 text-sm uppercase tracking-wide">Price</span>
                        </div>
                        <div className="text-gray-900 font-bold text-xl">₹{delivery.product?.price || 'N/A'}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="font-bold text-orange-800 text-sm uppercase tracking-wide">Preferred Time</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{delivery.preferredTime || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 ml-8">
                    <button
                      onClick={() => handleViewDelivery(delivery)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                    
                    {delivery.status === 'pending' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery._id, 'confirmed')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm
                      </button>
                    )}
                    
                    {delivery.status === 'confirmed' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery._id, 'completed')}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced View Details Modal for delivery info */}
{showViewModal && selectedDelivery && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Delivery Details</h3>
            <p className="text-gray-600 text-sm">Complete information about this delivery</p>
          </div>
          <button
            onClick={() => setShowViewModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Status
              </h4>
              <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(selectedDelivery.status)}`}>
                {selectedDelivery.status.toUpperCase()}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Created
              </h4>
              <div className="text-gray-900 text-sm font-medium">
                {new Date(selectedDelivery.createdAt).toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              Product Details
            </h4>
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="text-lg font-semibold text-gray-900">{selectedDelivery.product?.title || 'N/A'}</div>
              <div className="text-xl font-bold text-blue-600">₹{selectedDelivery.product?.price || 'N/A'}</div>
              <div className="text-gray-600">{selectedDelivery.product?.location || 'N/A'}</div>
            </div>
          </div>
          
          <div className="bg-green-50 p-5 rounded-lg border border-green-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Seller Information
            </h4>
            <div className="bg-white p-4 rounded-lg space-y-2">
              <div className="font-medium text-gray-900">{selectedDelivery.seller?.name || 'N/A'}</div>
              <div className="text-gray-600 text-sm">{selectedDelivery.seller?.email || 'N/A'}</div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Delivery Schedule
            </h4>
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="font-medium text-gray-900">
                {selectedDelivery.adminSchedule?.date ? new Date(selectedDelivery.adminSchedule.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Not Scheduled'}
              </div>
              <div className="font-medium text-purple-600">
                {selectedDelivery.adminSchedule?.startTime} - {selectedDelivery.adminSchedule?.endTime}
              </div>
              <div className="text-gray-600">{selectedDelivery.adminSchedule?.location || 'N/A'}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Preferred Time
              </h4>
              <div className="text-gray-900 font-medium">{selectedDelivery.preferredTime || 'Not specified'}</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                Seller Notes
              </h4>
              <div className="text-gray-900">
                {selectedDelivery.notes || 'No notes provided'}
              </div>
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
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    type: 'delivery',
    location: '',
    maxSlots: 10
  });

  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
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
    
    dates.push({
      date: today,
      isToday: true,
      isPast: false,
      isFuture: false
    });
    
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

  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'
  ];

  useEffect(() => {
    const getCurrentAdminId = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (token) {
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
          adminId: currentAdminId
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
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-100';
      case 'inactive': return 'bg-slate-100 text-slate-800 border-slate-300 shadow-slate-100';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300 shadow-rose-100';
      default: return 'bg-blue-100 text-blue-800 border-blue-300 shadow-blue-100';
    }
  };

  const getTypeColor = (type) => {
    return type === 'delivery' ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-blue-100' : 'bg-purple-100 text-purple-800 border-purple-300 shadow-purple-100';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header ( sbsee upr vaalii*/}
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage schedules and oversee delivery operations
        </p>
        {currentAdminId && (
          <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md mt-2 border border-blue-100">
            Admin ID: {currentAdminId}
          </span>
        )}
      </div>
    </div>
    
    <div className="flex gap-3">
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
      >
        {showCreateForm ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Schedule
          </>
        )}
      </button>
    </div>
  </div>
</div>

        {/* Admin ID Warning */}
        {!currentAdminId && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 text-amber-800 px-8 py-6 rounded-2xl flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-amber-200 rounded-xl">
              <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Authentication Required</h3>
              <p className="font-medium">Admin ID not detected. Please log in again to manage schedules and teams.</p>
            </div>
          </div>
        )}

        {/* Enhanced Create Schedule Form */}
{showCreateForm && currentAdminId && (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Create New Schedule</h3>
          <p className="text-gray-600 text-sm">Admin: {currentAdminId}</p>
        </div>
      </div>
    </div>
    
    <div className="p-6">
      <form onSubmit={handleCreateSchedule} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Schedule Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Service Type
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="delivery">🚚 Delivery Service</option>
              <option value="pickup">📦 Pickup Service</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <select
              required
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select start time</option>
              {timeSlots.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <select
              required
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select end time</option>
              {timeSlots.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Maximum Slots
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.maxSlots}
              onChange={(e) => setFormData({...formData, maxSlots: parseInt(e.target.value)})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Location Details
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Campus Gate A, Student Center, Main Building Entrance"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Schedule...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Schedule
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-700 px-8 py-6 rounded-2xl flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-red-200 rounded-xl">
              <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Error</h3>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-8 py-6 rounded-2xl flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-green-200 rounded-xl">
              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Success!</h3>
              <p className="font-medium">{success}</p>
            </div>
          </div>
        )}

      {/* Enhanced Professional Calendar View */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
  {/* Clean Header Section */}
  <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold">
            Schedule Management
            {currentAdminId && (
              <span className="ml-3 text-sm font-medium text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                Admin
              </span>
            )}
          </h3>
          <p className="text-slate-300 text-sm mt-1">
            Past 3 days • Today • Next 6 days
          </p>
        </div>
      </div>
      {currentAdminId && (
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-white text-slate-900 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium text-sm shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'New Schedule'}
        </button>
      )}
    </div>
  </div>
  
  {/* Calendar Grid */}
  <div className="p-6">
    <div className="grid grid-cols-5 gap-4">
      {calendarDates.map((dayData, index) => (
        <div
          key={index}
          className={`border rounded-xl p-5 min-h-[320px] transition-all duration-200 hover:shadow-md relative ${
            dayData.isToday 
              ? 'border-blue-200 bg-blue-50/50 shadow-sm' 
              : dayData.isPast 
              ? 'border-gray-200 bg-gray-50/30' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          {/* Today indicator */}
          {dayData.isToday && (
            <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
          
          {/* Date Header */}
          <div className="text-center mb-5 pb-4 border-b border-gray-100">
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
              dayData.isToday ? 'text-blue-600' : dayData.isPast ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {dayData.date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              dayData.isToday ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {dayData.date.getDate()}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {dayData.date.toLocaleDateString('en-US', { month: 'short' })}
            </div>
            {dayData.isToday && (
              <div className="mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                Today
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Delivery Schedule Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Delivery
                </h4>
              </div>
              <div className="space-y-2">
                {getSchedulesByType(dayData.date, 'delivery').map((schedule) => (
                  <div
                    key={schedule._id}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-xs hover:border-blue-200 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        Delivery
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </div>
                    <div className="text-gray-900 font-medium text-sm mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </div>
                    <div className="text-gray-600 text-xs mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{schedule.location}</span>
                    </div>
                    <div className="text-gray-500 text-xs mb-3 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-gray-400" />
                      {schedule.currentSlots}/{schedule.maxSlots} slots
                      <div className="flex-1 bg-gray-200 rounded-full h-1 ml-2">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(schedule.currentSlots / schedule.maxSlots) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(schedule._id)}
                      className="w-full text-red-600 hover:text-white hover:bg-red-500 text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 border border-red-200 hover:border-red-500 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                ))}
                {getSchedulesByType(dayData.date, 'delivery').length === 0 && (
                  <div className="text-gray-400 text-xs text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Package className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                    <div>No delivery scheduled</div>
                  </div>
                )}
              </div>
            </div>

            {/* Pickup Schedule Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Pickup
                </h4>
              </div>
              <div className="space-y-2">
                {getSchedulesByType(dayData.date, 'pickup').map((schedule) => (
                  <div
                    key={schedule._id}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-xs hover:border-purple-200 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        Pickup
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </div>
                    <div className="text-gray-900 font-medium text-sm mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </div>
                    <div className="text-gray-600 text-xs mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{schedule.location}</span>
                    </div>
                    <div className="text-gray-500 text-xs mb-3 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-gray-400" />
                      {schedule.currentSlots}/{schedule.maxSlots} slots
                      <div className="flex-1 bg-gray-200 rounded-full h-1 ml-2">
                        <div 
                          className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(schedule.currentSlots / schedule.maxSlots) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(schedule._id)}
                      className="w-full text-red-600 hover:text-white hover:bg-red-500 text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 border border-red-200 hover:border-red-500 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                ))}
                {getSchedulesByType(dayData.date, 'pickup').length === 0 && (
                  <div className="text-gray-400 text-xs text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Download className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                    <div>No pickup scheduled</div>
                  </div>
                )}
              </div>
            </div>

            {/* Add Schedule Button */}
            {dayData.isFuture && (
              <button
                onClick={() => {
                  setFormData({...formData, date: dayData.date.toISOString().split('T')[0]});
                  setShowCreateForm(true);
                }}
                className="w-full text-slate-600 hover:text-white hover:bg-slate-600 border border-gray-200 hover:border-slate-600 rounded-lg px-4 py-2.5 transition-all duration-200 font-medium text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Schedule
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

        {/* Enhanced Schedule List */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
  <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      All Schedules Overview
    </h3>
    <p className="text-gray-600 text-sm mt-1">Manage all your scheduled services</p>
  </div>
  
  <div className="p-6">
    {loading ? (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-100 border-t-blue-600 mx-auto"></div>
        <div className="text-gray-600 mt-4 font-medium">Loading schedules...</div>
        <div className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</div>
      </div>
    ) : schedules.length === 0 ? (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-50 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schedules Found</h3>
        <p className="text-gray-600 mb-6 text-sm">Create your first schedule using the form above to get started.</p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium text-sm"
        >
          Create First Schedule
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div
            key={schedule._id}
            className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="text-center bg-blue-50 p-3 rounded-lg border border-blue-100 min-w-[70px]">
                <div className="text-lg font-semibold text-blue-900">
                  {new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                  {new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getTypeColor(schedule.type)} flex items-center gap-2`}>
                  {getTypeIcon(schedule.type)}
                  {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} Service
                </span>
                <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(schedule.status)}`}>
                  {schedule.status.toUpperCase()}
                </span>
              </div>
              
              <div className="text-sm">
                <div className="font-semibold text-gray-900 text-base mb-1">
                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                </div>
                <div className="text-gray-600">{schedule.location}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="text-lg font-semibold text-green-700">
                  {schedule.currentSlots}/{schedule.maxSlots}
                </div>
                <div className="text-green-600 text-sm font-medium">
                  {Math.round((schedule.currentSlots / schedule.maxSlots) * 100)}% Full
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteSchedule(schedule._id)}
                className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
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

        {/* Enhanced Delivery Bookings Management Section */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
  <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
      <div className="p-2 bg-green-100 rounded-lg">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      Delivery Bookings Management
    </h3>
    <p className="text-gray-600 text-sm mt-1">Monitor and manage all delivery requests</p>
  </div>
  
  <div className="p-6">
    <DeliveryBookingsManager />
  </div>
</div>

{/* Enhanced Pickup Bookings Management Section */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
  <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
      <div className="p-2 bg-purple-100 rounded-lg">
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      Pickup Bookings Management
    </h3>
    <p className="text-gray-600 text-sm mt-1">Track and coordinate pickup requests</p>
  </div>
  
  <div className="p-6">
    <PickupBookingsManager />
  </div>
</div>
      </div>
    </div>
  );
}

// Enhanced Pickup Bookings Manager Component
function PickupBookingsManager() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchPickups();
    
    // Auto-refresh every 30 seconds to show latest pickup bookings
    const interval = setInterval(() => {
      fetchPickups();
    }, 30000);
    
    return () => clearInterval(interval);
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
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300 shadow-amber-100';
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-100';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300 shadow-blue-100';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300 shadow-green-100';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300 shadow-rose-100';
      default: return 'bg-slate-100 text-slate-800 border-slate-300 shadow-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filter Pickups</h3>
              <p className="text-sm text-gray-600">Refine your pickup view by status</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 font-medium text-gray-700 shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <button
              onClick={fetchPickups}
              disabled={loading}
              className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Pickups List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-lg">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-100 border-t-purple-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-purple-50 opacity-20"></div>
            </div>
            <div className="text-gray-600 mt-6 text-lg font-medium">Loading pickups...</div>
            <div className="text-gray-400 text-sm mt-2">Please wait while we fetch your data</div>
          </div>
        </div>
      ) : pickups.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-16 border border-gray-200">
          <div className="text-center">
            <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Pickups Found</h3>
            <p className="text-gray-600">No pickups match the selected status filter.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pickups.map((pickup) => (
            <div
              key={pickup._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-sm ${getStatusColor(pickup.status)}`}>
                        {pickup.status.toUpperCase().replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">
                          {new Date(pickup.createdAt).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <span className="font-bold text-purple-800 text-sm uppercase tracking-wide">Product</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{pickup.product?.title || 'N/A'}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-bold text-green-800 text-sm uppercase tracking-wide">Buyer</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{pickup.buyer?.name || pickup.buyer?.email || 'N/A'}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="font-bold text-orange-800 text-sm uppercase tracking-wide">Preferred Time</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{pickup.preferredTime || 'N/A'}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="font-bold text-blue-800 text-sm uppercase tracking-wide">Schedule</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">
                          {pickup.adminSchedule?.date ? new Date(pickup.adminSchedule.date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 ml-8">
                    <button
                      onClick={() => handleViewPickup(pickup)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                    
                    {pickup.status === 'pending' && (
                      <button
                        onClick={() => updatePickupStatus(pickup._id, 'confirmed')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm
                      </button>
                    )}
                    
                    {pickup.status === 'confirmed' && (
                      <button
                        onClick={() => updatePickupStatus(pickup._id, 'in_progress')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Pickup
                      </button>
                    )}
                    
                    {pickup.status === 'in_progress' && (
                      <button
                        onClick={() => updatePickupStatus(pickup._id, 'completed')}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced View Details Modal for pickup info */}
{showViewModal && selectedPickup && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Pickup Details</h3>
            <p className="text-gray-600 text-sm">Complete information about this pickup</p>
          </div>
          <button
            onClick={() => setShowViewModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Status
              </h4>
              <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(selectedPickup.status)}`}>
                {selectedPickup.status.toUpperCase().replace('_', ' ')}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Created
              </h4>
              <div className="text-gray-900 text-sm font-medium">
                {new Date(selectedPickup.createdAt).toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              Product Details
            </h4>
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="text-lg font-semibold text-gray-900">{selectedPickup.product?.title || 'N/A'}</div>
              <div className="text-xl font-bold text-purple-600">₹{selectedPickup.product?.price || 'N/A'}</div>
              <div className="text-gray-600">{selectedPickup.product?.location || 'N/A'}</div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Buyer Information
            </h4>
            <div className="bg-white p-4 rounded-lg space-y-2">
              <div className="font-medium text-gray-900">{selectedPickup.buyer?.name || 'N/A'}</div>
              <div className="text-gray-600 text-sm">{selectedPickup.buyer?.email || 'N/A'}</div>
              <div className="text-gray-600 text-sm">{selectedPickup.buyer?.phone || 'N/A'}</div>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Pickup Schedule
            </h4>
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="font-medium text-gray-900">
                {selectedPickup.adminSchedule?.date ? new Date(selectedPickup.adminSchedule.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Not Scheduled'}
              </div>
              <div className="font-medium text-indigo-600">
                {selectedPickup.adminSchedule?.startTime} - {selectedPickup.adminSchedule?.endTime}
              </div>
              <div className="text-gray-600">{selectedPickup.adminSchedule?.location || 'N/A'}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Preferred Time
              </h4>
              <div className="text-gray-900 font-medium">{selectedPickup.preferredTime || 'Not specified'}</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-md">
                  <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                Buyer Notes
              </h4>
              <div className="text-gray-900">
                {selectedPickup.notes || 'No notes provided'}
              </div>
            </div>
          </div>
          
          {selectedPickup.adminNotes && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-gray-200 rounded-md">
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Admin Notes
              </h4>
              <div className="text-gray-900">
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