'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const ChooseAccountType = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [preferredType, setPreferredType] = useState('buyer');

  useEffect(() => {
    // Check for preferred type from URL or sessionStorage
    const typeFromUrl = searchParams.get('type');
    const typeFromStorage = typeof window !== 'undefined' ? 
      sessionStorage.getItem('preferredUserType') : null;
    
    if (typeFromUrl) {
      setPreferredType(typeFromUrl);
    } else if (typeFromStorage) {
      setPreferredType(typeFromStorage);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect if user already has established account type and is not a new Google user
    if (session && !session.user.isNewGoogleUser && session.user.userType) {
      const dashboard = session.user.userType === 'seller' ? '/seller-dashboard' : '/buyer-dashboard';
      router.push(dashboard);
    }
  }, [session, router]);

  const handleUserTypeSelection = async (userType) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/switch-user-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUserType: userType }),
      });

      if (res.ok) {
        // Clear the new user flag
        await fetch('/api/auth/clear-new-user-flag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        // Clear session storage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('preferredUserType');
        }
        
        // Redirect to dashboard
        const dashboard = userType === 'seller' ? '/seller-dashboard' : '/buyer-dashboard';
        router.push(dashboard);
      } else {
        alert('Failed to set account type. Please try again.');
      }
    } catch (error) {
      console.error('Error switching user type:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/buyer-login');
    return null;
  }

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '100px auto', 
      padding: '30px',
      textAlign: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ marginBottom: '10px', color: '#333' }}>Choose Your Account Type</h2>
      <p style={{ marginBottom: '30px', color: '#666' }}>
        Welcome {session?.user?.name}! Are you registering as a buyer or seller?
      </p>
      
      {preferredType === 'seller' && (
        <p style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#e7f3ff', 
          borderRadius: '5px',
          color: '#0066cc'
        }}>
          📝 You started seller registration - we recommend selecting "I'm a Seller"
        </p>
      )}
      
      <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
        <button
          onClick={() => handleUserTypeSelection('buyer')}
          disabled={loading}
          style={{
            flex: 1,
            padding: '20px',
            backgroundColor: preferredType === 'buyer' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? 'Setting up...' : '🛒 I\'m a Buyer'}
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
            Buy products from sellers
          </div>
        </button>
        
        <button
          onClick={() => handleUserTypeSelection('seller')}
          disabled={loading}
          style={{
            flex: 1,
            padding: '20px',
            backgroundColor: preferredType === 'seller' ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? 'Setting up...' : '🏪 I\'m a Seller'}
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
            Sell products to buyers
          </div>
        </button>
      </div>
      
      <p style={{ 
        marginTop: '20px', 
        fontSize: '12px', 
        color: '#999' 
      }}>
        You can change this later in your account settings
      </p>
    </div>
  );
};

export default ChooseAccountType;