'use client';

import React, { useState, useEffect } from 'react';
import { getStoredToken, getStoredUserType, isAuthenticated, clearAllTokens } from '../../lib/auth';

export default function TestAuth() {
  const [authState, setAuthState] = useState({});

  useEffect(() => {
    const checkAuth = () => {
      const token = getStoredToken();
      const userType = getStoredUserType();
      const isAuth = isAuthenticated();
      
      setAuthState({
        token: token ? `${token.substring(0, 20)}...` : 'None',
        userType: userType || 'None',
        isAuthenticated: isAuth,
        allTokens: {
          'auth-token': localStorage.getItem('auth-token') ? 'Present' : 'None',
          'buyerToken': localStorage.getItem('buyerToken') ? 'Present' : 'None',
          'token': localStorage.getItem('token') ? 'Present' : 'None',
          'sellerToken': localStorage.getItem('sellerToken') ? 'Present' : 'None',
          'adminToken': localStorage.getItem('adminToken') ? 'Present' : 'None',
        }
      });
    };

    checkAuth();
    
    // Check every second for changes
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClearTokens = () => {
    clearAllTokens();
    setAuthState({});
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Authentication Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current Auth State:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions:</h2>
        <button 
          onClick={handleClearTokens}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear All Tokens
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Navigation:</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/buyer-login" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Buyer Login
          </a>
          <a href="/seller-login" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Seller Login
          </a>
          <a href="/buyer-registration" style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', textDecoration: 'none', borderRadius: '5px' }}>
            Buyer Registration
          </a>
          <a href="/seller-registration" style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Seller Registration
          </a>
          <a href="/buyer-dashboard" style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Buyer Dashboard
          </a>
          <a href="/seller-dashboard" style={{ padding: '10px 20px', backgroundColor: '#fd7e14', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Seller Dashboard
          </a>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Instructions:</h2>
        <ol>
          <li>Go to a registration page and create an account</li>
          <li>Check if you're redirected to the login page</li>
          <li>Login with your credentials</li>
          <li>Check if you're redirected to the dashboard</li>
          <li>Use this page to monitor the authentication state</li>
        </ol>
      </div>
    </div>
  );
}
