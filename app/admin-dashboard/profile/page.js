'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [adminData, setAdminData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

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
      <div style={{ maxWidth: 800, margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <div>Loading admin profile...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '1.5rem' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: 12, 
        border: '1px solid #e9ecef', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '2rem 1.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Admin Profile</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Complete account information and settings</p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              color: '#dc2626', 
              padding: '0.75rem 1rem', 
              borderRadius: 8, 
              border: '1px solid #fecaca', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ 
              background: '#f0fdf4', 
              color: '#16a34a', 
              padding: '0.75rem 1rem', 
              borderRadius: 8, 
              border: '1px solid #bbf7d0', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>✅</span>
              {success}
            </div>
          )}

          {/* Account Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              color: '#374151', 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              Account Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Email:</span>
                <span style={{ color: '#374151' }}>{adminData?.email || 'N/A'}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Created:</span>
                <span style={{ color: '#374151' }}>{formatDate(adminData?.createdAt)}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Last Updated:</span>
                <span style={{ color: '#374151' }}>{formatDate(adminData?.updatedAt)}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Last Login:</span>
                <span style={{ color: '#374151' }}>{formatDate(adminData?.lastLogin)}</span>
              </div>
            </div>
          </div>

          {/* Editable Information */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h2 style={{ 
                color: '#374151', 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                margin: 0
              }}>
                Personal Information
              </h2>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    required
                    minLength={2}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Optional. Will be saved in your admin record.
                  </small>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="submit" 
                    disabled={saving}
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      background: saving ? '#9ca3af' : '#10b981', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setForm({ name: adminData?.name || '', phone: adminData?.phone || '' });
                      setError('');
                      setSuccess('');
                    }}
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      background: '#6b7280', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>Full Name:</span>
                  <span style={{ color: '#374151', fontSize: '1.1rem' }}>
                    {adminData?.name || 'Not set'}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>Phone Number:</span>
                  <span style={{ color: '#374151', fontSize: '1.1rem' }}>
                    {adminData?.phone || 'Not set'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button 
              onClick={() => router.push('/admin-dashboard')}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: '#f3f4f6', 
                color: '#374151', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


