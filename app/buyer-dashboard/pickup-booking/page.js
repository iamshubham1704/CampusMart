'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, Clock, MapPin, User, CheckCircle, AlertCircle } from 'lucide-react';
import BuyerPickupBooking from '@/components/BuyerPickupBooking';

// Component that uses useSearchParams
const PickupBookingContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orderId = searchParams.get('orderId');
const deliveryId = searchParams.get('deliveryId');
const productId = searchParams.get('productId');

  useEffect(() => {
    if (orderId && deliveryId) {
      fetchOrderDetails();
    } else {
      setError('Missing order or delivery information');
      setLoading(false);
    }
  }, [orderId, deliveryId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/buyer/order-history?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setOrderDetails(data.data);
        } else {
          setError('Failed to fetch order details');
        }
      } else {
        setError('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingComplete = (pickupData) => {
    // Redirect back to order history with success message
    router.push('/buyer-dashboard/order-history?pickupBooked=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pickup booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/buyer-dashboard/order-history')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Order History
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Package size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for could not be found.</p>
          <button
            onClick={() => router.push('/buyer-dashboard/order-history')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Order History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/buyer-dashboard/order-history')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Order History
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Book Pickup Slot</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={20} />
            Order Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Product:</span>
                <span className="text-gray-900">{orderDetails.product?.title || 'Product Not Found'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Order ID:</span>
                <span className="text-gray-900 font-mono">#{String(orderDetails._id || orderId || '').slice(-8).toUpperCase()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Amount:</span>
                <span className="text-green-600 font-semibold">₹{orderDetails.amount}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Status:</span>
                <span className="px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {orderDetails.statusMessage}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Order Date:</span>
                <span className="text-gray-900">
                  {new Date(orderDetails.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Delivery ID:</span>
                <span className="text-gray-900 font-mono">#{deliveryId?.slice(-8).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Booking Component */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <BuyerPickupBooking
            productId={orderDetails.product?._id || productId}
            deliveryId={deliveryId}
            onBookingComplete={handleBookingComplete}
          />
        </div>

        {/* Important Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            Important Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-yellow-800">Before Pickup:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Ensure you have a valid government-issued ID</li>
                <li>• Arrive at the pickup location 10 minutes early</li>
                <li>• Have your order confirmation ready</li>
                <li>• Check the pickup location and time carefully</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-yellow-800">During Pickup:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Present your ID to the admin for verification</li>
                <li>• Inspect the product before accepting</li>
                <li>• Sign the pickup confirmation form</li>
                <li>• Keep your pickup receipt for records</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If you cannot make it to your scheduled pickup time, please cancel at least 2 hours in advance. 
              Failure to show up for multiple scheduled pickups may result in restrictions on future bookings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading fallback component
const PickupBookingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading pickup booking...</p>
    </div>
  </div>
);

// Main component wrapped in Suspense
const PickupBookingPage = () => {
  return (
    <Suspense fallback={<PickupBookingFallback />}>
      <PickupBookingContent />
    </Suspense>
  );
};

export default PickupBookingPage;
