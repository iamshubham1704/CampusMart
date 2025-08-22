'use client';
import { useState, useEffect } from 'react';

export default function SellerDeliveryBooking({ productId, onBookingComplete }) {
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    preferredTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchAvailableSchedules();
  }, []);

  const fetchAvailableSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sellerToken');
      console.log('🔍 Fetching delivery schedules with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/seller/schedules?type=delivery&status=active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('📡 API Response:', data);
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        // Use the enhanced data from our API
        const available = data.data.filter(schedule => 
          schedule.isAvailable && schedule.availableSlots > 0
        );
        console.log('✅ Available schedules:', available);
        setAvailableSchedules(available);
      } else {
        console.error('❌ API Error:', data.error);
        setError(data.error || 'Failed to fetch available schedules');
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      setError('Failed to fetch available schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData(prev => ({
      ...prev,
      preferredTime: schedule.startTime
    }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('sellerToken');
      const response = await fetch('/api/admin/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          adminScheduleId: selectedSchedule._id,
          preferredTime: formData.preferredTime,
          notes: formData.notes
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Delivery slot booked successfully!');
        setSelectedSchedule(null);
        setFormData({ preferredTime: '', notes: '' });
        if (onBookingComplete) {
          onBookingComplete(data.data);
        }
        // Refresh available schedules
        fetchAvailableSchedules();
      } else {
        setError(data.error || 'Failed to book delivery slot');
      }
    } catch (error) {
      setError('Failed to book delivery slot');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time.replace(':', ' ').replace('AM', ' AM').replace('PM', ' PM');
  };

  const getSlotAvailability = (schedule) => {
    const available = schedule.availableSlots || 0;
    const maxSlots = schedule.maxSlots || 10;
    const percentage = Math.round(((maxSlots - available) / maxSlots) * 100);
    
    if (percentage >= 90) return { text: 'Almost Full', color: 'text-red-600' };
    if (percentage >= 70) return { text: 'Limited Slots', color: 'text-orange-600' };
    return { text: 'Available', color: 'text-green-600' };
  };

  if (loading && availableSchedules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading available delivery schedules...</div>
      </div>
    );
  }

  if (availableSchedules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No delivery schedules available at the moment.</div>
        <div className="text-sm text-gray-400">Please check back later or contact admin for assistance.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Book Delivery Slot</h3>
        <p className="text-gray-600">Select an available delivery schedule for your product</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Available Schedules */}
      <div className="grid gap-4">
        {availableSchedules.map((schedule) => {
          const availability = getSlotAvailability(schedule);
          return (
            <div
              key={schedule._id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedSchedule?._id === schedule._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleScheduleSelect(schedule)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Delivery Schedule</span>
                </div>
                <span className={`text-sm font-medium ${availability.color}`}>
                  {availability.text}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Date</div>
                  <div className="text-gray-900">{formatDate(schedule.date)}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Time</div>
                  <div className="text-gray-900">
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Location</div>
                  <div className="text-gray-900">{schedule.location}</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available slots:</span>
                  <span className="font-medium text-gray-900">
                    {schedule.availableSlots || 0} of {schedule.maxSlots || 10}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((schedule.maxSlots || 10) - (schedule.availableSlots || 0)) / (schedule.maxSlots || 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Form */}
      {selectedSchedule && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Booking</h4>
          
          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time (within schedule)
              </label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select preferred time</option>
                {selectedSchedule && (
                  <>
                    <option value={selectedSchedule.startTime}>{formatTime(selectedSchedule.startTime)}</option>
                    <option value={selectedSchedule.endTime}>{formatTime(selectedSchedule.endTime)}</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special instructions or notes for delivery..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Schedule Summary */}
      {selectedSchedule && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Selected Schedule Summary</h5>
          <div className="text-sm text-blue-800">
            <div><strong>Date:</strong> {formatDate(selectedSchedule.date)}</div>
            <div><strong>Time:</strong> {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}</div>
            <div><strong>Location:</strong> {selectedSchedule.location}</div>
            <div><strong>Cost:</strong> Free delivery service</div>
          </div>
        </div>
      )}
    </div>
  );
}
