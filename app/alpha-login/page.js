// app/alpha-login/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AlphaLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/alpha/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('alphaToken', data.token);
        localStorage.setItem('alphaData', JSON.stringify(data.alpha));
        router.push('/alpha-dashboard'); // redirect to alpha dashboard
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{
          marginBottom: '1.5rem',
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#333'
        }}>
          Alpha Login
        </h1>

        {error && (
          <div style={{
            backgroundColor: '#ffe6e6',
            color: '#cc0000',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #ffb3b3',
            fontSize: '0.95rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border 0.3s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#43cea2')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border 0.3s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#43cea2')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: loading ? '#a3a3a3' : '#43cea2',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: '#777' }}>
          Don&apos;t have an alpha account?{' '}
          <Link href="/alpha-register" style={{ color: '#43cea2', textDecoration: 'none', fontWeight: '600' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
