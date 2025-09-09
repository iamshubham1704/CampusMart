'use client';
import { useState, useEffect } from 'react';

export default function BuyerPickupBooking({ productId, deliveryId, onBookingComplete }) {
  console.log('🔍 BuyerPickupBooking: Received props:', {
    productId,
    deliveryId,
    productIdType: typeof productId,
    deliveryIdType: typeof deliveryId
  });
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
      setError('');
      
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log('🔍 Fetching available pickup schedules...');
      const response = await fetch('/api/buyer/pickup-schedules', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📋 Pickup schedules response:', data);
      
      if (response.ok) {
        // Filter schedules that have available slots
        const available = data.data.filter(schedule => 
          schedule.currentSlots < schedule.maxSlots
        );
        console.log('📋 Available schedules after filtering:', available.length);
        setAvailableSchedules(available);
      } else {
        console.error('❌ Failed to fetch schedules:', data);
        setError(data.error || 'Failed to fetch available schedules');
      }
    } catch (error) {
      console.error('❌ Error fetching schedules:', error);
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
      
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');

      // Normalize IDs to plain strings for the API
      const normalizedProductId = typeof productId === 'object' 
        ? (productId?.$oid || productId?.toString?.() || '')
        : (productId || '');
      const normalizedScheduleId = typeof selectedSchedule._id === 'object'
        ? (selectedSchedule._id?.$oid || selectedSchedule._id?.toString?.() || '')
        : (selectedSchedule._id || '');
      const normalizedDeliveryId = typeof deliveryId === 'object'
        ? (deliveryId?.$oid || deliveryId?.toString?.() || '')
        : (deliveryId || '');

      console.log('🔍 Booking pickup with data:', {
        productId: normalizedProductId,
        adminScheduleId: normalizedScheduleId,
        deliveryId: normalizedDeliveryId,
        preferredTime: formData.preferredTime,
        notes: formData.notes
      });

      const response = await fetch('/api/buyer/pickups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: normalizedProductId,
          adminScheduleId: normalizedScheduleId,
          deliveryId: normalizedDeliveryId,
          preferredTime: formData.preferredTime,
          notes: formData.notes
        })
      });
      
      const data = await response.json();
      console.log('📋 Booking response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (response.ok) {
        console.log('✅ Pickup booking successful!');
        setSuccess('Pickup slot booked successfully!');
        setSelectedSchedule(null);
        setFormData({ preferredTime: '', notes: '' });
        if (onBookingComplete) {
          onBookingComplete(data.data);
        }
        // Refresh available schedules
        fetchAvailableSchedules();
      } else {
        console.error('❌ Pickup booking failed:', {
          status: response.status,
          error: data.error,
          fullResponse: data
        });
        setError(data.error || 'Failed to book pickup slot');
      }
    } catch (error) {
      setError('Failed to book pickup slot');
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
    const available = schedule.maxSlots - schedule.currentSlots;
    const percentage = Math.round((schedule.currentSlots / schedule.maxSlots) * 100);
    
    if (percentage >= 90) return { text: 'Almost Full', color: 'text-red-600' };
    if (percentage >= 70) return { text: 'Limited Slots', color: 'text-orange-600' };
    return { text: 'Available', color: 'text-green-600' };
  };

  if (loading && availableSchedules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading available pickup schedules...</div>
      </div>
    );
  }

  if (availableSchedules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No pickup schedules available at the moment.</div>
        <div className="text-sm text-gray-400">Please check back later or contact admin for assistance.</div>
      </div>
    );
  }

  // Group schedules by date to render a 7-column calendar-like grid without changing data fetching
  const schedulesByDate = availableSchedules.reduce((acc, s) => {
    const key = new Date(s.date).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const orderedDates = Object.keys(schedulesByDate)
    .map(d => new Date(d))
    .sort((a,b) => a - b)
    .map(d => d.toDateString());

  return (
    <div className="pickupBookingContainer space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Book Pickup Slot</h3>
        <p className="text-gray-600">Select an available pickup schedule for your product</p>
      </div>

      {/* Warning Message */}
      <div style={{ 
        background: '#fef2f2', 
        border: '1px solid #fecaca', 
        color: '#dc2626', 
        padding: '0.75rem 1rem', 
        borderRadius: '0.5rem', 
        marginBottom: '1.5rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Before selecting schedule consult the assigned admin
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

      {/* Available Schedules as calendar-like grid */}
      <div className="pickupCalendar">
        <div className="pickupCalendarHeader">
          <div className="pickupCalendarTitle">Available Pickup Slots</div>
          <div className="pickupCalendarLegend">
            <span className="pickupLegendItem"><span className="pickupLegendDot" style={{background:'#059669'}}></span> Available</span>
            <span className="pickupLegendItem"><span className="pickupLegendDot" style={{background:'#ea580c'}}></span> Limited</span>
            <span className="pickupLegendItem"><span className="pickupLegendDot" style={{background:'#dc2626'}}></span> Almost Full</span>
          </div>
        </div>
        <div className="pickupCalendarGrid">
          {orderedDates.map((dateStr, idx) => {
            const dateObj = new Date(dateStr);
            const isToday = (() => { const t=new Date(); return t.toDateString()===dateObj.toDateString(); })();
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const schedules = schedulesByDate[dateStr] || [];
            return (
              <div key={dateStr + idx} className={`pickupDay ${isToday ? 'today' : ''}`}>
                <div className="pickupDayHeader">
                  <div className="pickupDayName">{dayName}</div>
                  <div className="pickupDayDate">{dayNum}</div>
                </div>
                <div className="pickupSlots">
                  {schedules.map((schedule) => {
                    const availability = getSlotAvailability(schedule);
                    return (
                      <div
                        key={schedule._id}
                        className={`pickupSlot ${selectedSchedule?._id === schedule._id ? 'selected' : ''}`}
                        onClick={() => handleScheduleSelect(schedule)}
                      >
                        <div className="pickupSlotHeader">
                          <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                          </div>
                          <span className={`pickupAvailability ${availability.text === 'Available' ? 'available' : availability.text === 'Limited Slots' ? 'limited' : 'almost'}`}>{availability.text}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">{schedule.location}</div>
                        <div className="pickupProgress">
                          <div className="pickupProgressFill" style={{ width: `${(schedule.currentSlots / schedule.maxSlots) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Form */}
      {selectedSchedule && (
        <div className="pickupInlineCard">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Pickup Booking</h4>
          
          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time (within schedule)
              </label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                placeholder="Any special instructions or notes for pickup..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="pickupActions">
              <button
                type="submit"
                disabled={loading}
                className="bookPickupButton"
              >
                {loading ? 'Booking...' : 'Confirm Pickup Booking'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="openFullBookingButton"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Schedule Summary */}
      {selectedSchedule && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 mb-2">Selected Pickup Schedule Summary</h5>
          <div className="text-sm text-purple-800">
            <div><strong>Date:</strong> {formatDate(selectedSchedule.date)}</div>
            <div><strong>Time:</strong> {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}</div>
            <div><strong>Location:</strong> {selectedSchedule.location}</div>
            <div><strong>Cost:</strong> Free pickup service</div>
          </div>
        </div>
      )}

      {/* Important Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-medium text-yellow-900 mb-2">Important Information</h5>
        <div className="text-sm text-yellow-800 space-y-1">
          <div>• Please arrive at the pickup location on time</div>
          <div>• Bring a valid ID for verification</div>
          <div>• Admin will verify your identity before handing over the product</div>
          <div>• If you can't make it, please cancel at least 2 hours in advance</div>
        </div>
      </div>
    </div>
  );
}
