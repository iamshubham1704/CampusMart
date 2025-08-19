'use client';

import React, { useState, useEffect } from 'react';
import { isAuthenticated, getStoredToken, clearAllTokens } from '../../lib/auth';

const TestAuth = () => {
  const [authStatus, setAuthStatus] = useState({});
  const [tokens, setTokens] = useState({});

  const checkAuth = () => {
    const buyerAuth = isAuthenticated('buyer');
    const sellerAuth = isAuthenticated('seller');
    const adminAuth = isAuthenticated('admin');
    const anyAuth = isAuthenticated();

    setAuthStatus({
      buyer: buyerAuth,
      seller: sellerAuth,
      admin: adminAuth,
      any: anyAuth
    });

    setTokens({
      buyerToken: localStorage.getItem('buyerToken'),
      authToken: localStorage.getItem('auth-token'),
      userType: localStorage.getItem('userType'),
      buyerData: localStorage.getItem('buyerData')
    });
  };

  const clearTokens = () => {
    clearAllTokens();
    checkAuth();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Authentication Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={checkAuth} style={{ marginRight: '10px' }}>
          Refresh Auth Status
        </button>
        <button onClick={clearTokens} style={{ backgroundColor: '#ff4444', color: 'white' }}>
          Clear All Tokens
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2>Authentication Status</h2>
          <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            <p><strong>Buyer:</strong> {authStatus.buyer ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            <p><strong>Seller:</strong> {authStatus.seller ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            <p><strong>Admin:</strong> {authStatus.admin ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            <p><strong>Any:</strong> {authStatus.any ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
          </div>
        </div>

        <div>
          <h2>Stored Tokens</h2>
          <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            <p><strong>Buyer Token:</strong> {tokens.buyerToken ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>Auth Token:</strong> {tokens.authToken ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>User Type:</strong> {tokens.userType || '❌ Not Set'}</p>
            <p><strong>Buyer Data:</strong> {tokens.buyerData ? '✅ Present' : '❌ Missing'}</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Token Details</h2>
        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          <p><strong>Buyer Token:</strong></p>
          <pre style={{ backgroundColor: '#fff', padding: '10px', overflow: 'auto' }}>
            {tokens.buyerToken || 'No token found'}
          </pre>
          
          <p><strong>Auth Token:</strong></p>
          <pre style={{ backgroundColor: '#fff', padding: '10px', overflow: 'auto' }}>
            {tokens.authToken || 'No token found'}
          </pre>
          
          <p><strong>Buyer Data:</strong></p>
          <pre style={{ backgroundColor: '#fff', padding: '10px', overflow: 'auto' }}>
            {tokens.buyerData ? JSON.stringify(JSON.parse(tokens.buyerData), null, 2) : 'No data found'}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Quick Actions</h2>
        <div>
          <button 
            onClick={() => window.location.href = '/buyer-login'}
            style={{ marginRight: '10px', backgroundColor: '#007bff', color: 'white', padding: '10px 20px' }}
          >
            Go to Buyer Login
          </button>
          <button 
            onClick={() => window.location.href = '/buyer-dashboard'}
            style={{ marginRight: '10px', backgroundColor: '#28a745', color: 'white', padding: '10px 20px' }}
          >
            Go to Buyer Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;
