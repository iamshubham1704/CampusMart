'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const CompleteProfile = () => {
  const sessionResult = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    phone: '',
    college: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing session
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe destructuring after component is mounted
  const { data: session, status } = sessionResult || {};

  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      router.push('/buyer-login');
    }
  }, [mounted, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/buyer/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          college: form.college
        }),
      });

      if (res.ok) {
        router.push('/buyer-dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/buyer-dashboard');
  };

  // Show loading until component is mounted and session is resolved
  if (!mounted || status === 'loading') {
    return <div>Loading...</div>;
  }

  // Show redirecting message if no session after mounting
  if (!session) {
    return <div>Redirecting...</div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Complete Your Profile</h2>
      <p>Welcome {session?.user?.name}! Please complete your profile to continue.</p>
      
      <form onSubmit={handleSubmit}>
        {error && <p style={{color: 'red'}}>{error}</p>}
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Shipping Address"
            value={form.college}
            onChange={(e) => setForm({...form, college: e.target.value})}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              flex: 1, 
              padding: '10px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Updating...' : 'Complete Profile'}
          </button>
          
          <button 
            type="button" 
            onClick={handleSkip}
            style={{ 
              flex: 1, 
              padding: '10px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfile;