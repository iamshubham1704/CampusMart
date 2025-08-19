'use client';

import React, { useState, useEffect } from 'react';

const DebugLogin = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      // Check localStorage
      const localStorageInfo = {
        authToken: localStorage.getItem('auth-token'),
        buyerToken: localStorage.getItem('buyerToken'),
        userType: localStorage.getItem('userType'),
        buyerData: localStorage.getItem('buyerData')
      };

      // Check API endpoint
      const response = await fetch('/api/debug/login-test');
      const apiInfo = await response.json();

      setDebugInfo({
        localStorage: localStorageInfo,
        api: apiInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('buyerData');
    setDebugInfo({});
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Login Debug Page</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={checkAuthStatus}
          disabled={loading}
          style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
        <button 
          onClick={clearTokens}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none' }}
        >
          Clear All Tokens
        </button>
      </div>

      <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
        <h3>Debug Information:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Quick Actions:</h3>
        <a href="/buyer-login" style={{ marginRight: '1rem', color: '#3b82f6' }}>Go to Buyer Login</a>
        <a href="/buyer-dashboard" style={{ marginRight: '1rem', color: '#3b82f6' }}>Go to Buyer Dashboard</a>
        <a href="/test-auth" style={{ color: '#3b82f6' }}>Go to Test Auth</a>
      </div>
    </div>
  );
};

export default DebugLogin;
