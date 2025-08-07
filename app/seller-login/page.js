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

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/seller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Store token and sellerId in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('sellerId', data.seller?.id || '');

        // ✅ Redirect to dashboard
        router.push('/seller-dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    await signIn('google', {
      callbackUrl: '/seller-dashboard',
    });
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Seller Login</h2>
        <form className={styles.form} onSubmit={handleLogin}>
          {error && <p className={styles.error}>{error}</p>}

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

          <button type="submit" className={styles.loginButton}>
            Login
          </button>

          <div className={styles.or}>or</div>

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleLogin}
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginSeller;