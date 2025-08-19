// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUserType, isAuthenticated, clearAllTokens } from '../lib/auth';

export const useAuth = (requiredUserType = null) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!isAuthenticated(requiredUserType)) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Get user type and token
        const userType = getStoredUserType();
        const token = getStoredToken(requiredUserType);

        if (!token || (requiredUserType && userType !== requiredUserType)) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Fetch user profile based on type
        let profileEndpoint;
        if (userType === 'buyer') {
          profileEndpoint = '/api/buyer/profile';
        } else if (userType === 'seller') {
          profileEndpoint = '/api/seller/profile';
        } else if (userType === 'admin') {
          profileEndpoint = '/api/admin/profile';
        }

        if (profileEndpoint) {
          const response = await fetch(profileEndpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.data || data.seller || data.admin || data);
          } else if (response.status === 401) {
            // Token is invalid, clear and redirect
            clearAllTokens();
            setUser(null);
            if (userType === 'buyer') {
              router.push('/buyer-login');
            } else if (userType === 'seller') {
              router.push('/seller-login');
            } else if (userType === 'admin') {
              router.push('/admin-login');
            }
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } else {
          // For cases where we don't have a specific endpoint, create basic user object
          setUser({
            userType,
            token
          });
        }
      } catch (err) {
        console.error('Authentication check error:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredUserType, router]);

  const logout = () => {
    clearAllTokens();
    setUser(null);
    
    if (requiredUserType === 'buyer') {
      router.push('/buyer-login');
    } else if (requiredUserType === 'seller') {
      router.push('/seller-login');
    } else if (requiredUserType === 'admin') {
      router.push('/admin-login');
    } else {
      router.push('/');
    }
  };

  const refreshAuth = async () => {
    setLoading(true);
    // Re-run authentication check
    const checkAuth = async () => {
      try {
        setError(null);

        if (!isAuthenticated(requiredUserType)) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userType = getStoredUserType();
        const token = getStoredToken(requiredUserType);

        if (!token || (requiredUserType && userType !== requiredUserType)) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser({ userType, token });
      } catch (err) {
        console.error('Auth refresh error:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    await checkAuth();
  };

  return {
    user,
    loading,
    error,
    logout,
    refreshAuth,
    isAuthenticated: isAuthenticated(requiredUserType)
  };
};
