// Enhanced BuyerPickupSchedule component with premium styling integration

'use client';
import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Package, 
  CheckCircle, 
  Clock as ClockIcon, 
  AlertCircle, 
  Plus,
  ArrowLeft,
  Info,
  Shield,
  FileText
} from 'lucide-react';
import BuyerPickupBooking from './BuyerPickupBooking';

// Import the CSS file (add this to your main CSS or component)
import './pickup-booking.css'; // Make sure to create this file with the CSS above

export default function BuyerPickupSchedule({ orderId, productId, delivery, isFullPage = false }) {
  const [pickupSchedule, setPickupSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showInlineBooking, setShowInlineBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Sample data for available slots (replace with API call)
  const [availableSlots] = useState([
    {
      id: 1,
      day: 'Thu',
      date: 'Nov 11',
      time: '1:00 PM - 1:30 PM',
      status: 'Available',
      availability: 'Limited Almost Full',
      location: 'Main Campus Pickup Point'
    },
    {
      id: 2,
      day: 'Tue',
      date: 'Nov 16', 
      time: '2:30 PM - 3:00 PM',
      status: 'Available',
      availability: 'Available',
      location: 'Library Pickup Station'
    }
  ]);

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

      const response = await fetch(`/api/buyer/pickups?deliveryId=${delivery._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setPickupSchedule(data.data[0]);
        } else {
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

  const handleBookingComplete = (pickupData) => {
    setPickupSchedule(pickupData);
    setShowInlineBooking(false);
    setShowBookingForm(false);
    window.location.href = `/buyer-dashboard/order-history?pickupBooked=true`;
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

  // Full page booking interface
  if (isFullPage && showBookingForm) {
    return (
      <div className="booking-page-container">
        {/* Header */}
        <header className="booking-header">
          <div className="booking-header-content">
            <a href="/buyer-dashboard/order-history" className="back-button">
              <ArrowLeft size={20} />
              Back to Order History
            </a>
            <h1 className="page-title">Book Pickup Slot</h1>
          </div>
        </header>

        <main className="booking-main-content">
          {/* Order Summary Card */}
          <section className="order-summary-card">
            <div className="order-summary-header">
              <div className="order-summary-icon">
                <Package size={20} />
              </div>
              <h2 className="order-summary-title">Order Summary</h2>
            </div>
            
            <div className="order-details-grid">
              <div className="order-detail-item">
                <span className="order-detail-label">Product</span>
                <span className="order-detail-value">Product #{productId}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Order ID</span>
                <span className="order-detail-value">#{orderId}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Amount</span>
                <span className="order-detail-value">$59</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Status</span>
                <span className="status-badge status-verified">
                  <CheckCircle size={16} />
                  Payment Verified
                </span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Order Date</span>
                <span className="order-detail-value">{formatDate(new Date())}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Delivery ID</span>
                <span className="order-detail-value">#{delivery?._id?.slice(-8)}</span>
              </div>
            </div>
          </section>

          {/* Pickup Booking Section */}
          <section className="pickup-booking-section">
            <div className="pickup-booking-header">
              <div className="pickup-booking-title">
                <div className="pickup-booking-icon">
                  <Calendar size={20} />
                </div>
                <h2>Book Pickup Slot</h2>
              </div>
              <div className="availability-badge">
                <CheckCircle size={16} />
                Available
              </div>
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
              <AlertCircle size={16} />
              Before selecting schedule consult the assigned admin
            </div>

            <p style={{ color: 'royalblue', marginBottom: '1.5rem' }}>
              Select an available pickup schedule for your product
            </p>

            {/* Available Slots */}
            <div className="available-slots-container">
              <h3 className="slots-section-title">
                <Clock size={20} />
                Available Pickup Slots
              </h3>
              
              <div className="slots-grid">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`slot-card ${slot.availability === 'Limited Almost Full' ? 'limited' : ''} ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <div className="slot-header">
                      <div>
                        <div className="slot-day">{slot.day}</div>
                        <div className="slot-date">{slot.date}</div>
                      </div>
                      <div className="slot-status">{slot.availability}</div>
                    </div>
                    <div className="slot-time">
                      <Clock size={16} />
                      {slot.time}
                    </div>
                    <div className="slot-location">
                      <MapPin size={16} />
                      {slot.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Information */}
            <div className="important-info-section">
              <h3 className="important-info-title">
                <Info size={20} />
                Important Information
              </h3>
              
              <div className="important-info-content">
                <div className="info-section">
                  <h4 className="info-section-title">
                    <Shield size={16} />
                    Before Pickup
                  </h4>
                  <ul className="info-list">
                    <li>Ensure you have a valid government-issued ID</li>
                    <li>Arrive at the pickup location 10 minutes early</li>
                    <li>Have your order confirmation ready</li>
                    <li>Check the pickup location and time carefully</li>
                  </ul>
                </div>
                
                <div className="info-section">
                  <h4 className="info-section-title">
                    <FileText size={16} />
                    Pickup Guidelines
                  </h4>
                  <ul className="info-list">
                    <li>Please arrive at the pickup location on time</li>
                    <li>Bring a valid ID for verification</li>
                    <li>Admin will verify your identity before handing over the product</li>
                    <li>If you can't make it, please cancel at least 2 hours in advance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            {selectedSlot && (
              <div className="booking-form">
                <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>
                  Selected Slot: {selectedSlot.day} {selectedSlot.date}, {selectedSlot.time}
                </h4>
                
                <div className="form-group">
                  <label className="form-label">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Any special instructions or notes for the pickup..."
                    rows="3"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="booking-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.history.back()}
              >
                <ArrowLeft size={16} />
                Cancel
              </button>
              
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedSlot}
                onClick={() => {
                  // Handle booking submission
                  if (selectedSlot) {
                    handleBookingComplete({
                      id: Date.now(),
                      selectedSlot,
                      status: 'pending',
                      adminSchedule: {
                        date: new Date(),
                        location: selectedSlot.location
                      },
                      preferredTime: selectedSlot.time,
                      notes: document.querySelector('.form-textarea')?.value || ''
                    });
                  }
                }}
              >
                <CheckCircle size={16} />
                Confirm Booking
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Regular component rendering for inline use
  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-4">
          <div className="spinner"></div>
          <span className="ml-2 text-gray-600">Loading pickup schedule...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (pickupSchedule) {
    return (
      <div className="pickup-booking-section" style={{ margin: '1rem 0' }}>
        <div className="pickup-booking-header">
          <div className="pickup-booking-title">
            <div className="pickup-booking-icon">
              <Package size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'darkblue' }}>Pickup Schedule</h2>
          </div>
          <span className={`status-badge ${getStatusColor(pickupSchedule.status)} flex items-center gap-2`}>
            {getStatusIcon(pickupSchedule.status)}
            {pickupSchedule.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        
        <div className="order-details-grid">
          <div className="order-detail-item">            
            <span className="order-detail-label">Date</span>
            <span className="order-detail-value">{formatDate(pickupSchedule.adminSchedule?.date)}</span>
          </div>
          
          <div className="order-detail-item">
            <span className="order-detail-label">Time</span>
            <span className="order-detail-value">{formatTime(pickupSchedule.preferredTime)}</span>
          </div>
          
          <div className="order-detail-item">
            <span className="order-detail-label">Location</span>
            <span className="order-detail-value">{pickupSchedule.adminSchedule?.location || 'N/A'}</span>
          </div>

          <div  style={{ marginTop: '1rem', color: 'darkblue' }}
          className="order-detail-item">
            <span className="order-detail-label">Admin</span>
            <span className="order-detail-value">{pickupSchedule.adminSchedule?.adminId ? 'Assigned' : 'Not assigned yet'}</span>
          </div>
        </div>

        {pickupSchedule.notes && (
          <div style={{ marginTop: '1rem', color: 'darkblue' }}>
            <span className="order-detail-label">Your Notes</span>
            <p style={{ 
              background: 'var(--light-gray)', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)', 
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: 'darkblue'
            }}>
              {pickupSchedule.notes}
            </p>
          </div>
        )}
        
        {pickupSchedule.adminNotes && (
          <div style={{ marginTop: '1rem', color: 'darkblue' }}>
            <span className="order-detail-label">Admin Notes</span>
            <p style={{ 
              background: 'var(--light-gray)', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)', 
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              
            }}>
              {pickupSchedule.adminNotes}
            </p>
          </div>
        )}

        {pickupSchedule.status === 'pending' && (
          <div className="important-info-section" style={{ marginTop: '1rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning-yellow)' }}>
              <ClockIcon size={16} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                Your pickup is pending confirmation. Admin will review and confirm your slot.
              </span>
            </div>
          </div>
        )}

        {pickupSchedule.status === 'confirmed' && (
          <div className="success-message" style={{ marginTop: '1rem' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Your pickup is confirmed! Please arrive on time with a valid ID.
            </span>
          </div>
        )}

        {pickupSchedule.status === 'completed' && (
          <div className="success-message" style={{ marginTop: '1rem' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Pickup completed successfully! Thank you for using our service.
            </span>
          </div>
        )}
      </div>
    );
  }

  if (showBookingForm) {
    return (
      <div className="pickup-booking-section" style={{ margin: '1rem 0' }}>
        <div className="pickup-booking-header">
          <div className="pickup-booking-title">
            <div className="pickup-booking-icon">
              <Package size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Schedule Pickup</h2>
          </div>
          <div className="availability-badge">
            <CheckCircle size={16} />
            Available
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          {/* Warning Message */}
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            color: '#dc2626', 
            padding: '0.75rem 1rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            Before selecting schedule consult the assigned admin
          </div>

          <p style={{ color: 'darkblue', marginBottom: '0.75rem' }}>
            Your order is ready for pickup! The seller has scheduled a delivery, and now you can book a pickup slot.
          </p>
          
          {delivery?.adminSchedule && (
            <div style={{ 
              background: 'darkblue', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'darkblue' }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Delivery Schedule:</div>
                <div>Date: {formatDate(delivery.adminSchedule.date)}</div>
                <div>Time: {formatTime(delivery.adminSchedule.startTime)} - {formatTime(delivery.adminSchedule.endTime)}</div>
                <div>Location: {delivery.adminSchedule.location}</div>
                <div>Status: <span style={{ fontWeight: '500' }}>{delivery.status}</span></div>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowInlineBooking(true)}
            className="btn btn-primary"
            style={{ flex: '1', minWidth: '200px' }}
          >
            <Plus size={16} />
            Book Pickup Slot
          </button>
          
          <button
            onClick={() => {
              window.location.href = `/buyer-dashboard/pickup-booking?orderId=${orderId}&deliveryId=${delivery._id}&fullPage=true`;
            }}
            className="btn btn-secondary"
            style={{ flex: '1', minWidth: '200px', color: 'darkblue', borderColor: 'darkblue' }}
          >
            <Calendar size={16} />
            Open Full Booking
          </button>
        </div>

        {showInlineBooking && (
          <div style={{ 
            marginTop: '1.5rem',
            background: 'var(--light-gray)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            color: 'darkblue'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h5 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'darkblue' }}>
                Quick Pickup Booking
              </h5>
              <button
                onClick={() => setShowInlineBooking(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'darkblue', 
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <AlertCircle size={16} />
              </button>
            </div>
            <BuyerPickupBooking
              productId={productId?.toString() || productId}
              deliveryId={delivery._id?.toString() || delivery._id}
              onBookingComplete={handleBookingComplete}
            />
          </div>
        )}
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="pickup-booking-section" style={{ margin: '1rem 0', background: 'var(--light-gray)' }}>
        <div className="pickup-booking-header">
          <div className="pickup-booking-title">
            <div className="pickup-booking-icon" style={{ background: 'var(--text-secondary)' }}>
              <Package size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'royalblue' }}>Pickup Status</h2>
          </div>
          <span style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            fontWeight: '600',
            background: 'var(--border-color)',
            color: 'darkblue',
            border: '1px solid var(--border-color)'
          }}>
            Waiting
          </span>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          The seller hasn't scheduled a delivery yet. Once they do, you'll be able to book a pickup slot here.
        </p>
        
        <div className="important-info-section">
          <div style={{ fontSize: '0.875rem', color: 'darkblue' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>What happens next?</div>
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