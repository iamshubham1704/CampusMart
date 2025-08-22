'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminScheduleManager from '@/components/AdminScheduleManager';

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [adminData, setAdminData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [scheduleData, setScheduleData] = useState([]);
  const router = useRouter();

  // Check for tab parameter in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'schedule') {
      setActiveTab('schedule');
    }
  }, []);

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

  // Initialize schedule data
  useEffect(() => {
    const dates = generateCalendarDates();
    const initialSchedule = dates.map(dateObj => ({
      ...dateObj,
      events: [],
      notes: ''
    }));
    setScheduleData(initialSchedule);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin-login');
      return;
    }
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load profile');
        setAdminData(data.data);
        setForm({ name: data.data.name || '', phone: data.data.phone || '' });
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleScheduleChange = (dateIndex, field, value) => {
    setScheduleData(prev => prev.map((item, index) => 
      index === dateIndex ? { ...item, [field]: value } : item
    ));
  };

  const addEvent = (dateIndex) => {
    const newEvent = prompt('Enter event details:');
    if (newEvent && newEvent.trim()) {
      setScheduleData(prev => prev.map((item, index) => 
        index === dateIndex ? { 
          ...item, 
          events: [...item.events, { id: Date.now(), text: newEvent.trim() }]
        } : item
      ));
    }
  };

  const removeEvent = (dateIndex, eventId) => {
    setScheduleData(prev => prev.map((item, index) => 
      index === dateIndex ? { 
        ...item, 
        events: item.events.filter(event => event.id !== eventId)
      } : item
    ));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');
      setSuccess('Profile updated successfully');
      setAdminData(data.data);
      setIsEditing(false);
      // Update localStorage
      localStorage.setItem('adminData', JSON.stringify({ 
        ...(JSON.parse(localStorage.getItem('adminData') || '{}')), 
        name: data.data.name, 
        phone: data.data.phone 
      }));
      // Clear any previous error banner after successful save
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-profile-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading admin profile...</div>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-card">
        {/* Header */}
        <div className="admin-profile-header">
          <h1 className="admin-profile-title">Admin Profile</h1>
          <p className="admin-profile-subtitle">Complete account information and settings</p>
        </div>

        {/* Tabs */}
        <div className="admin-profile-tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`admin-tab ${activeTab === 'profile' ? 'admin-tab-active' : ''}`}
          >
            <svg className="admin-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`admin-tab ${activeTab === 'schedule' ? 'admin-tab-active' : ''}`}
          >
            <svg className="admin-tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
          </button>
        </div>

        <div className="admin-profile-content">
          {activeTab === 'profile' && (
            <>
              {error && (
                <div className="admin-error-message">
                  <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="admin-success-message">
                  <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </div>
              )}

              {/* Account Information */}
              <div className="admin-section">
                <h2 className="admin-section-title">
                  <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Information
                </h2>
                
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="Enter your full name"
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label className="admin-form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="Enter your phone number"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {isEditing ? (
                  <div className="admin-form-actions">
                    <button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="admin-btn admin-btn-primary"
                    >
                      {saving ? (
                        <>
                          <svg className="admin-btn-spinner" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="admin-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditing(false);
                        setForm({ name: adminData?.name || '', phone: adminData?.phone || '' });
                        setError('');
                        setSuccess('');
                      }}
                      className="admin-btn admin-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="admin-info-display">
                    <div className="admin-info-row">
                      <span className="admin-info-label">Full Name:</span>
                      <span className="admin-info-value">
                        {adminData?.name || 'Not set'}
                      </span>
                    </div>
                    
                    <div className="admin-info-row">
                      <span className="admin-info-label">Phone Number:</span>
                      <span className="admin-info-value">
                        {adminData?.phone || 'Not set'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="admin-btn admin-btn-edit"
                    >
                      <svg className="admin-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="admin-action-buttons">
                <button 
                  onClick={() => router.push('/admin-dashboard')}
                  className="admin-btn admin-btn-back"
                >
                  <svg className="admin-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
              </div>
            </>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="admin-schedule-container">
              <div className="admin-schedule-header">
                <h2 className="admin-schedule-title">
                  <svg className="admin-schedule-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Management
                </h2>
                <p className="admin-schedule-subtitle">
                  Manage delivery and pickup schedules for your campus
                </p>
              </div>
              <AdminScheduleManager adminId={adminData?._id} />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-profile-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 1.5rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .admin-profile-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .admin-profile-card:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .admin-profile-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 3rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .admin-profile-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.3;
        }

        .admin-profile-title {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 700;
          position: relative;
          z-index: 1;
        }

        .admin-profile-subtitle {
          margin: 0.75rem 0 0 0;
          opacity: 0.9;
          font-size: 1.1rem;
          position: relative;
          z-index: 1;
        }

        .admin-profile-tabs {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1.25rem 2rem;
          background: transparent;
          color: #64748b;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
        }

        .admin-tab:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .admin-tab-active {
          background: white;
          color: #1e293b;
          border-bottom-color: #3b82f6;
          font-weight: 600;
        }

        .admin-tab-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .admin-profile-content {
          padding: 2rem;
        }

        .admin-error-message,
        .admin-success-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .admin-error-message {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .admin-success-message {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .error-icon,
        .success-icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .admin-section {
          margin-bottom: 2.5rem;
        }

        .admin-section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .section-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #3b82f6;
        }

        .admin-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .admin-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .admin-form-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.95rem;
        }

        .admin-form-input {
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
        }

        .admin-form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .admin-form-input:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .admin-form-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .admin-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          justify-content: center;
          min-width: 120px;
        }

        .admin-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
        }

        .admin-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .admin-btn-secondary {
          background: #6b7280;
          color: white;
        }

        .admin-btn-secondary:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .admin-btn-edit {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }

        .admin-btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        .admin-btn-back {
          background: #f3f4f6;
          color: #374151;
          border: 2px solid #d1d5db;
        }

        .admin-btn-back:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .admin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .admin-btn-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .admin-btn-spinner {
          width: 1.25rem;
          height: 1.25rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .admin-info-display {
          display: grid;
          gap: 1.5rem;
        }

        .admin-info-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .admin-info-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .admin-info-value {
          color: #1e293b;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .admin-action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .admin-schedule-container {
          background: #f8fafc;
          border-radius: 16px;
          padding: 2rem;
          margin: -1rem;
        }

        .admin-schedule-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #cbd5e1;
        }

        .admin-schedule-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: #1e293b;
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.75rem 0;
        }

        .admin-schedule-icon {
          width: 2rem;
          height: 2rem;
          color: #3b82f6;
        }

        .admin-schedule-subtitle {
          color: #64748b;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 500;
        }

        .admin-profile-loading {
          max-width: 800px;
          margin: 2rem auto;
          padding: 1.5rem;
          text-align: center;
        }

        .loading-spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .loading-text {
          color: #6b7280;
          font-size: 1.1rem;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .admin-profile-container {
            padding: 1rem;
            margin: 1rem auto;
          }

          .admin-profile-header {
            padding: 2rem 1rem;
          }

          .admin-profile-title {
            font-size: 2rem;
          }

          .admin-profile-content {
            padding: 1.5rem;
          }

          .admin-form-grid {
            grid-template-columns: 1fr;
          }

          .admin-form-actions {
            flex-direction: column;
          }

          .admin-btn {
            width: 100%;
          }

          .admin-info-row {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .admin-tab {
            padding: 1rem;
            font-size: 0.9rem;
          }

          .admin-schedule-container {
            padding: 1rem;
            margin: -0.5rem;
          }

          .admin-schedule-header {
            padding: 1.5rem 1rem;
          }

          .admin-schedule-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .admin-profile-title {
            font-size: 1.75rem;
          }

          .admin-profile-subtitle {
            font-size: 1rem;
          }

          .admin-section-title {
            font-size: 1.25rem;
          }

          .admin-schedule-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}


