'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from './LoginSeller.module.css';

const LoginSeller = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/seller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store token and sellerId in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('sellerId', data.seller?.id || '');

        setSuccess('Login successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => router.push('/seller-dashboard'), 1500);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      const result = await signIn('google', {
        callbackUrl: '/seller-dashboard',
        redirect: false, // Don't redirect automatically, handle it manually
      });

      if (result?.error) {
        setError('Google login failed. Please try again.');
      } else if (result?.ok) {
        setSuccess('Google login successful! Redirecting...');
        setTimeout(() => router.push('/seller-dashboard'), 1500);
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Seller Login</h2>
        <form className={styles.form} onSubmit={handleLogin}>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading || googleLoading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className={styles.or}>or</div>

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            {googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginSeller;