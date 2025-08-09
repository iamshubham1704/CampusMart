'use client';
import React, { useState } from 'react';
import styles from './RegistrationSeller.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const RegistrationSeller = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => router.push('/seller-login'), 1500);
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      
      // Store seller preference before OAuth
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('preferredUserType', 'seller');
      }
      
      // Sign in with Google and redirect to account type selection
      const result = await signIn('google', {
        callbackUrl: '/choose-account-type?type=seller',
        redirect: true // Let NextAuth handle the redirect
      });
      
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Google signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.registrationWrapper}>
      <div className={styles.registrationBox}>
        <h2 className={styles.title}>Seller Registration</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <button 
            type="submit" 
            className={styles.registerButton}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <div className={styles.alternativeLogin}>
            Already have an account?{' '}
            <Link href="/seller-login">
              <span className={styles.highlight}>Login</span>
            </Link>
          </div>

          <div className={styles.or}>or</div>

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign Up with Google'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationSeller;