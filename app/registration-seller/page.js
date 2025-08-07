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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!');
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
      setError('');
      setTimeout(() => router.push('/seller-dashboard'), 1500);
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    }
  };

  const handleGoogleSignup = async () => {
    await signIn('google', {
      callbackUrl: '/seller-dashboard',
    });
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
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
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
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit" className={styles.registerButton}>
            Register
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
          >
            Sign Up with Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationSeller;