'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock, GraduationCap, ArrowLeft } from 'lucide-react';

const UnifiedBuyerLogin = () => {
  const router = useRouter();
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/buyer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store token and user data consistently
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', data.token);
          localStorage.setItem('buyerToken', data.token);
          localStorage.setItem('buyerData', JSON.stringify(data.buyer));
          localStorage.setItem('userType', 'buyer');
        }

        setSuccess('Login successful! Redirecting...');
        
        // Immediate redirect without delay
        router.push('/buyer-dashboard');
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
        callbackUrl: '/buyer-dashboard',
        redirect: false,
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    setError('');

    if (!forgotEmail) {
      setError('Please enter your email address');
      setForgotLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setError('Please enter a valid email address');
      setForgotLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/buyer/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setForgotMessage('Password reset instructions have been sent to your email address.');
        setForgotEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotMessage('');
    setForgotLoading(false);
    setError('');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    
    formWrapper: {
      backgroundColor: '#1f2937',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #374151',
      width: '100%',
      maxWidth: '28rem',
      padding: '2rem',
    },

    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },

    logoContainer: {
      width: '4rem',
      height: '4rem',
      backgroundColor: '#2563eb',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1rem auto',
    },

    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#ffffff',
      margin: '0 0 0.5rem 0',
    },

    subtitle: {
      color: '#9ca3af',
      fontSize: '1rem',
      margin: 0,
    },

    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#3b82f6',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      marginBottom: '1rem',
      padding: '0.5rem 0',
      transition: 'color 0.2s ease-in-out',
    },

    backButtonHover: {
      color: '#2563eb',
    },

    messageBox: {
      marginBottom: '1.5rem',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
    },

    errorBox: {
      backgroundColor: '#7f1d1d',
      border: '1px solid #dc2626',
      color: '#fca5a5',
    },

    successBox: {
      backgroundColor: '#14532d',
      border: '1px solid #16a34a',
      color: '#86efac',
    },

    infoBox: {
      backgroundColor: '#1e3a8a',
      border: '1px solid #3b82f6',
      color: '#93c5fd',
    },

    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },

    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
    },

    label: {
      display: 'block',
      color: '#d1d5db',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.5rem',
    },

    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },

    input: {
      width: '100%',
      backgroundColor: '#374151',
      color: '#ffffff',
      border: '1px solid #4b5563',
      borderRadius: '8px',
      padding: '0.75rem 1rem 0.75rem 3rem',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
    },

    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 1px #3b82f6',
    },

    inputDisabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
    },

    icon: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
      width: '1.25rem',
      height: '1.25rem',
      pointerEvents: 'none',
    },

    passwordToggle: {
      position: 'absolute',
      right: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      padding: '0.25rem',
      borderRadius: '4px',
      transition: 'color 0.2s ease-in-out',
    },

    passwordToggleHover: {
      color: '#ffffff',
    },

    forgotPasswordLink: {
      alignSelf: 'flex-end',
      color: '#3b82f6',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      textDecoration: 'underline',
      transition: 'color 0.2s ease-in-out',
    },

    forgotPasswordLinkHover: {
      color: '#2563eb',
    },

    submitButton: {
      width: '100%',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      fontWeight: '500',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'all 0.2s ease-in-out',
      marginTop: '0.5rem',
    },

    submitButtonHover: {
      backgroundColor: '#1d4ed8',
    },

    submitButtonDisabled: {
      backgroundColor: '#1e40af',
      cursor: 'not-allowed',
      opacity: '0.7',
    },

    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '1.5rem 0',
    },

    dividerLine: {
      flex: '1',
      height: '1px',
      backgroundColor: '#4b5563',
    },

    dividerText: {
      padding: '0 1rem',
      color: '#9ca3af',
      fontSize: '0.875rem',
    },

    googleButton: {
      width: '100%',
      backgroundColor: '#dc2626',
      color: '#ffffff',
      fontWeight: '500',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'all 0.2s ease-in-out',
    },

    googleButtonHover: {
      backgroundColor: '#b91c1c',
    },

    googleButtonDisabled: {
      backgroundColor: '#991b1b',
      cursor: 'not-allowed',
      opacity: '0.7',
    },

    footer: {
      marginTop: '1.5rem',
      textAlign: 'center',
    },

    footerText: {
      color: '#9ca3af',
      fontSize: '0.875rem',
      margin: 0,
    },

    footerLink: {
      color: '#3b82f6',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <GraduationCap style={{ width: '2rem', height: '2rem', color: '#ffffff' }} />
          </div>
          <h1 style={styles.title}>
            {showForgotPassword ? 'Reset Password' : 'Buyer Login'}
          </h1>
          <p style={styles.subtitle}>
            {showForgotPassword 
              ? 'Enter your email to receive reset instructions' 
              : 'Welcome back to the student marketplace'}
          </p>
        </div>

        {/* Back Button (only show in forgot password view) */}
        {showForgotPassword && (
          <button
            onClick={resetForgotPasswordState}
            style={styles.backButton}
            onMouseOver={(e) => e.target.style.color = styles.backButtonHover.color}
            onMouseOut={(e) => e.target.style.color = '#3b82f6'}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            Back to Login
          </button>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div style={{ ...styles.messageBox, ...styles.errorBox }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ ...styles.messageBox, ...styles.successBox }}>
            {success}
          </div>
        )}
        {forgotMessage && (
          <div style={{ ...styles.messageBox, ...styles.infoBox }}>
            {forgotMessage}
          </div>
        )}

        {showForgotPassword ? (
          /* Forgot Password Form */
          <form style={styles.form} onSubmit={handleForgotPassword}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail style={styles.icon} />
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{
                    ...styles.input,
                    ...(forgotLoading ? styles.inputDisabled : {}),
                  }}
                  required
                  disabled={forgotLoading}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(forgotLoading ? styles.submitButtonDisabled : {}),
              }}
              disabled={forgotLoading}
              onMouseOver={(e) => !forgotLoading && (e.target.style.backgroundColor = styles.submitButtonHover.backgroundColor)}
              onMouseOut={(e) => !forgotLoading && (e.target.style.backgroundColor = '#2563eb')}
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        ) : (
          /* Login Form */
          <form style={styles.form} onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail style={styles.icon} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    ...styles.input,
                    ...(loading || googleLoading ? styles.inputDisabled : {}),
                  }}
                  required
                  disabled={loading || googleLoading}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock style={styles.icon} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    ...styles.input,
                    paddingRight: '3rem',
                    ...(loading || googleLoading ? styles.inputDisabled : {}),
                  }}
                  required
                  disabled={loading || googleLoading}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  disabled={loading || googleLoading}
                  onMouseOver={(e) => e.target.style.color = styles.passwordToggleHover.color}
                  onMouseOut={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={styles.forgotPasswordLink}
                onMouseOver={(e) => e.target.style.color = styles.forgotPasswordLinkHover.color}
                onMouseOut={(e) => e.target.style.color = '#3b82f6'}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(loading || googleLoading ? styles.submitButtonDisabled : {}),
              }}
              disabled={loading || googleLoading}
              onMouseOver={(e) => !(loading || googleLoading) && (e.target.style.backgroundColor = styles.submitButtonHover.backgroundColor)}
              onMouseOut={(e) => !(loading || googleLoading) && (e.target.style.backgroundColor = '#2563eb')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine}></div>
            </div>

            {/* Google Button */}
            {/*<button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                ...styles.googleButton,
                ...(loading || googleLoading ? styles.googleButtonDisabled : {}),
              }}
              disabled={loading || googleLoading}
              onMouseOver={(e) => !(loading || googleLoading) && (e.target.style.backgroundColor = styles.googleButtonHover.backgroundColor)}
              onMouseOut={(e) => !(loading || googleLoading) && (e.target.style.backgroundColor = '#dc2626')}
            >
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </button>*/}
          </form>
        )}

        {/* Footer */}
        {!showForgotPassword && (
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => router.push('/buyer-registration')}
                style={styles.footerLink}
              >
                Register as Buyer
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedBuyerLogin;