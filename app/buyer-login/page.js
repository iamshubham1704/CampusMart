'use client';
import React, { useState } from 'react';
import styles from './buyer_login.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const BuyerLogin = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      const result = await signIn('google', {
        callbackUrl: '/buyer-dashboard',
        redirect: false, // Don't redirect automatically, handle it manually
      });

      if (result?.error) {
        setError('Google login failed. Please try again.');
      } else if (result?.ok) {
        setSuccess('Google login successful! Redirecting...');
        setTimeout(() => router.push('/buyer-dashboard'), 1500);
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/buyer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem('buyerToken', data.token);
      localStorage.setItem('buyerData', JSON.stringify(data.buyer));

      setSuccess('Login successful! Redirecting...');
      setError('');
      
      // Redirect to buyer dashboard
      setTimeout(() => router.push('/buyer-dashboard'), 1500);

    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Buyer Login</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <input 
            type="email" 
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required 
          />
          
          <input 
            type="password" 
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required 
          />
          
          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading || googleLoading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/forgot-password">
            <span className={styles.link}>Forgot Password?</span>
          </Link>
        </div>

        <div className={styles.signup}>
          Don't have an account? 
          <Link href="/buyer-registration">
            <span className={styles.link}> Sign up</span>
          </Link>
        </div>

        <div className={styles.or}>or</div>
        
        <button 
          type="button"
          onClick={handleGoogleLogin}
          className={styles.googleButton}
          disabled={loading || googleLoading}
        >
          {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
};

export default BuyerLogin;