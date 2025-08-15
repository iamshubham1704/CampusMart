'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const SellerCompleteProfile = () => {
  const session = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Safe access to session data
  const sessionData = session?.data;
  const sessionStatus = session?.status;

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/seller-login');
    }
  }, [sessionStatus, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/seller/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone
        }),
      });

      if (res.ok) {
        router.push('/seller-dashboard');
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
    router.push('/seller-dashboard');
  };

  if (sessionStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (!sessionData) {
    return <div>Redirecting...</div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Complete Your Seller Profile</h2>
      <p>Welcome {sessionData?.user?.name}! Please complete your seller profile to continue.</p>
      
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

export default SellerCompleteProfile;