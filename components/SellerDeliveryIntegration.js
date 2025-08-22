'use client';
import { useState, useEffect, useRef } from 'react';
import SellerDeliveryBooking from './SellerDeliveryBooking';

export default function SellerDeliveryIntegration({ productId }) {
  const [showDeliveryBooking, setShowDeliveryBooking] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  
  // Generate unique component ID for debugging
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    console.log(`🚨 [${componentId.current}] useEffect triggered - productId changed to:`, productId);
    // Check if product already has a delivery scheduled
    checkExistingDelivery();
  }, [productId]);

  // TEMPORARILY DISABLED AUTO-REFRESH TO DEBUG
  // useEffect(() => {
  //   // Clear existing interval
  //   if (intervalRef.current) {
  //     clearInterval(intervalRef.current);
  //     intervalRef.current = null;
  //   }

  //   // Only start interval if there's a delivery status
  //   if (deliveryStatus) {
  //     console.log('🔄 Starting auto-refresh interval for delivery status...');
  //     intervalRef.current = setInterval(() => {
  //       console.log('🔄 Auto-refreshing delivery status...');
  //       checkExistingDelivery();
  //     }, 30000); // 30 seconds
  //   }

  //   // Cleanup function
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //       intervalRef.current = null;
  //     }
  //   };
  // }, [deliveryStatus]);

  console.log(`🚨 [${componentId.current}] SellerDeliveryIntegration rendered at:`, new Date().toLocaleTimeString());
  console.log(`🚨 [${componentId.current}] Current deliveryStatus:`, deliveryStatus);
  console.log(`🚨 [${componentId.current}] Component props productId:`, productId);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const checkExistingDelivery = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sellerToken');
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔍 [${componentId.current}] [${timestamp}] Checking existing delivery for product:`, productId);
      console.log(`🔑 [${componentId.current}] Seller token present:`, token ? 'Yes' : 'No');
      
      const response = await fetch(`/api/admin/deliveries?productId=${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📡 [${componentId.current}] [${timestamp}] Delivery check response:`, data);
        if (data.data && data.data.length > 0) {
          setDeliveryStatus(data.data[0]);
        }
      }
    } catch (error) {
      console.error(`💥 [${componentId.current}] Failed to check delivery status:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryBooked = (deliveryData) => {
    setDeliveryStatus(deliveryData);
    setShowDeliveryBooking(false);
    // You can add additional logic here like showing success message
    // or redirecting to a confirmation page
  };

  const refreshDeliveryStatus = () => {
    checkExistingDelivery();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', text: 'Confirmed' },
      in_progress: { color: 'bg-orange-100 text-orange-800', text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-500">Checking delivery status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!deliveryStatus ? (
        // No delivery scheduled - show booking option
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-blue-900 mb-2">
                Schedule Product Delivery
              </h4>
              <p className="text-blue-700 text-sm">
                Your product has been sold! Book a delivery slot to get it picked up by our admin team.
              </p>
            </div>
            <button
              onClick={() => setShowDeliveryBooking(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Book Delivery
            </button>
          </div>
        </div>
      ) : (
        // Delivery already scheduled - show status
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-medium text-green-900">
              Delivery Scheduled
            </h4>
            <div className="flex items-center gap-2">
              {getStatusBadge(deliveryStatus.status)}
              <button
                onClick={refreshDeliveryStatus}
                className="text-green-600 hover:text-green-800 p-1 hover:bg-green-100 rounded transition-colors"
                title="Refresh status"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-800">Status:</span>
              <span className="ml-2 text-green-700 capitalize">
                {deliveryStatus.status.replace('_', ' ')}
              </span>
            </div>
            
            {deliveryStatus.adminSchedule && (
              <>
                <div>
                  <span className="font-medium text-green-800">Date:</span>
                  <span className="ml-2 text-green-700">
                    {formatDate(deliveryStatus.adminSchedule.date)}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-green-800">Time:</span>
                  <span className="ml-2 text-green-700">
                    {deliveryStatus.adminSchedule.startTime} - {deliveryStatus.adminSchedule.endTime}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-green-800">Location:</span>
                  <span className="ml-2 text-green-700">
                    {deliveryStatus.adminSchedule.location}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-green-800">Preferred Time:</span>
                  <span className="ml-2 text-green-700">
                    {deliveryStatus.preferredTime}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {deliveryStatus.notes && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <span className="font-medium text-green-800">Your Notes:</span>
              <p className="text-green-700 mt-1">{deliveryStatus.notes}</p>
            </div>
          )}
          
          {deliveryStatus.adminNotes && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <span className="font-medium text-green-800">Admin Notes:</span>
              <p className="text-green-700 mt-1">{deliveryStatus.adminNotes}</p>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-green-200">
            <p className="text-xs text-green-600">
              <strong>Next Steps:</strong> Admin will contact you to confirm the delivery details. 
              Please ensure the product is ready for pickup at the scheduled time.
            </p>
          </div>
        </div>
      )}

      {/* Delivery Booking Modal/Component */}
      {showDeliveryBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Book Delivery Slot
                </h3>
                <button
                  onClick={() => setShowDeliveryBooking(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <SellerDeliveryBooking
                productId={productId}
                onBookingComplete={handleDeliveryBooked}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
