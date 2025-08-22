'use client';
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Package, CheckCircle, Clock as ClockIcon, AlertCircle } from 'lucide-react';

export default function BuyerPickupSchedule({ orderId, productId, delivery }) {
  const [pickupSchedule, setPickupSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    if (orderId && delivery?._id) {
      fetchPickupSchedule();
    }
  }, [orderId, delivery]);

  const fetchPickupSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // First check if there's already a pickup scheduled for this delivery (buyer endpoint)
      const response = await fetch(`/api/buyer/pickups?deliveryId=${delivery._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          // Buyer already has a pickup scheduled
          setPickupSchedule(data.data[0]);
        } else {
          // No pickup scheduled yet, show booking form
          setShowBookingForm(true);
        }
      } else {
        setError('Failed to fetch pickup information');
      }
    } catch (error) {
      console.error('Error fetching pickup schedule:', error);
      setError('Failed to fetch pickup information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time.replace(':', ' ').replace('AM', ' AM').replace('PM', ' PM');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon size={16} />;
      case 'confirmed': return <CheckCircle size={16} />;
      case 'in_progress': return <ClockIcon size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <AlertCircle size={16} />;
      default: return <ClockIcon size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading pickup schedule...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center text-red-700">
          <AlertCircle size={16} className="mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (pickupSchedule) {
    // Show existing pickup schedule
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Package size={20} />
            Pickup Schedule
          </h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pickupSchedule.status)} flex items-center gap-2`}>
            {getStatusIcon(pickupSchedule.status)}
            {pickupSchedule.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-purple-800">
              <Calendar size={16} />
              <span className="font-medium">Date:</span>
              <span>{formatDate(pickupSchedule.adminSchedule?.date)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-purple-800">
              <Clock size={16} />
              <span className="font-medium">Time:</span>
              <span>{formatTime(pickupSchedule.preferredTime)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-purple-800">
              <MapPin size={16} />
              <span className="font-medium">Location:</span>
              <span>{pickupSchedule.adminSchedule?.location || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-purple-800">
              <User size={16} />
              <span className="font-medium">Admin:</span>
              <span>{pickupSchedule.adminSchedule?.adminId ? 'Assigned' : 'Not assigned yet'}</span>
            </div>
            
            {pickupSchedule.notes && (
              <div className="text-purple-800">
                <span className="font-medium">Notes:</span>
                <p className="text-sm mt-1 bg-white p-2 rounded border border-purple-200">
                  {pickupSchedule.notes}
                </p>
              </div>
            )}
            
            {pickupSchedule.adminNotes && (
              <div className="text-purple-800">
                <span className="font-medium">Admin Notes:</span>
                <p className="text-sm mt-1 bg-white p-2 rounded border border-purple-200">
                  {pickupSchedule.adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {pickupSchedule.status === 'pending' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <ClockIcon size={16} />
              <span className="text-sm font-medium">Your pickup is pending confirmation. Admin will review and confirm your slot.</span>
            </div>
          </div>
        )}

        {pickupSchedule.status === 'confirmed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Your pickup is confirmed! Please arrive on time with a valid ID.</span>
            </div>
          </div>
        )}

        {pickupSchedule.status === 'completed' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Pickup completed successfully! Thank you for using our service.</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showBookingForm) {
    // Show pickup booking form
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <Package size={20} />
            Schedule Pickup
          </h4>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Available
          </span>
        </div>
        
        <div className="mb-4">
          <p className="text-blue-800 mb-2">
            Your order is ready for pickup! The seller has scheduled a delivery, and now you can book a pickup slot.
          </p>
          
          {delivery?.adminSchedule && (
            <div className="bg-white p-3 rounded border border-blue-200 mb-3">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Delivery Schedule:</div>
                <div>Date: {formatDate(delivery.adminSchedule.date)}</div>
                <div>Time: {formatTime(delivery.adminSchedule.startTime)} - {formatTime(delivery.adminSchedule.endTime)}</div>
                <div>Location: {delivery.adminSchedule.location}</div>
                <div>Status: <span className="font-medium">{delivery.status}</span></div>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            // This will open the pickup booking modal
            // You can implement this by passing a callback to the parent component
            window.location.href = `/buyer-dashboard/pickup-booking?orderId=${orderId}&deliveryId=${delivery._id}`;
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <Calendar size={16} />
          Book Pickup Slot
        </button>
      </div>
    );
  }

  // If no delivery is scheduled yet
  if (!delivery) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Package size={20} />
            Pickup Status
          </h4>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            Waiting
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">
          The seller hasn't scheduled a delivery yet. Once they do, you'll be able to book a pickup slot here.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-800">
            <div className="font-medium mb-1">What happens next?</div>
            <div>1. Seller schedules delivery with admin</div>
            <div>2. You'll see delivery details here</div>
            <div>3. You can then book a pickup slot</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
