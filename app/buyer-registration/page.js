'use client';
import React, { useState } from 'react';
import styles from './RegistrationSeller.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const BuyerRegistration = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const result = await signIn('google', {
        callbackUrl: '/buyer-dashboard',
        redirect: false
      });
      
      if (result?.error) {
        setError('Google signup failed. Please try again.');
      } else if (result?.ok) {
        router.push('/buyer-dashboard');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Google signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
      const res = await fetch('/api/buyer/register', {
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
      setTimeout(() => router.push('/buyer-login'), 1500);
    } catch (err) {
      console.log(err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registrationWrapper}>
      <div className={styles.registrationBox}>
        <h2 className={styles.title}>Buyer Registration</h2>
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
            placeholder="Email Address"
            value={form.email}
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
            type="text"
            name="college"
            placeholder="Shipping Address"
            value={form.college}
            onChange={handleChange}
            required 
            disabled={loading}
          />
            
          <button 
            type="submit" 
            className={styles.registerButton}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register as Buyer'}
          </button>
        </form>
        
        <div>Already have an account? <Link href="/buyer-login"><span>Login</span></Link></div>
        <div className={styles.or}>or</div>

        <button
          type="button"
          onClick={handleGoogleSignup} 
          className={styles.googleButton}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
};

export default BuyerRegistration;