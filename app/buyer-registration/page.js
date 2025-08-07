'use client';
import React, { useState } from 'react';
import styles from './RegistrationSeller.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BuyerRegistration = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '', // Added missing field
    shippingAddress: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Added missing preventDefault

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!');
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
      setError('');
      setTimeout(() => router.push('/buyer-dashboard'), 1500);
    } catch (err) {
      console.log(err);
      setError('Something went wrong.');
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
            name="name" // Added missing name attribute
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required 
          />

          <input
            type="email"
            name="email" // Added missing name attribute
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required 
          />

          <input
            type="password"
            name="password" // Added missing name attribute
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

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
          />

          <input 
            type="text"
            name="shippingAddress" // Added missing name attribute
            placeholder="Shipping Address"
            value={form.shippingAddress}
            onChange={handleChange}
            required 
          />
            
          <button type="submit" className={styles.registerButton}>
            Register as Buyer
          </button>
        </form>
        
        <div>Already have an account? <Link href="/buyer-login"><span>Login</span></Link></div>
        <div className={styles.or}>or</div>
        <button className={styles.googleButton}>Continue with Google</button>
      </div>
    </div>
  );
};

export default BuyerRegistration;