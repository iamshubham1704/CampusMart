'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, User, Mail, Lock, Phone, MapPin, Briefcase, Building2 } from 'lucide-react';

const UnifiedSellerRegistration = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: '',
    customCollege: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const colleges = ['MAIT', 'DTU', 'NSUT', 'IIIT Delhi', 'JMI', 'DU', 'Other'];
  const businessTypes = ['Books & Notes', 'Electronics', 'Stationery', 'Fashion', 'Food & Snacks', 'Services', 'Other'];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!form.name || !form.email || !form.phone || !form.password || !form.businessName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    const college = form.college === 'other' ? form.customCollege : form.college;
    const businessType = form.businessType === 'other' ? form.customBusinessType : form.businessType;

    if (!college || !businessType) {
      setError('Please specify your college and business type');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        college,
        businessType,
        businessName: form.businessName,
        description: form.description,
      };

      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        router.push('/seller-login');
      }, 1500);
    } catch (err) {
      console.log(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
      maxWidth: '42rem',
      padding: '2rem',
    },

    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },

    logoContainer: {
      width: '4rem',
      height: '4rem',
      backgroundColor: '#059669',
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

    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },

    section: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },

    sectionTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#ffffff',
      borderBottom: '1px solid #4b5563',
      paddingBottom: '0.5rem',
      margin: 0,
    },

    gridTwo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
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
      borderColor: '#059669',
      boxShadow: '0 0 0 1px #059669',
    },

    inputDisabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
    },

    select: {
      width: '100%',
      backgroundColor: '#374151',
      color: '#ffffff',
      border: '1px solid #4b5563',
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      outline: 'none',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 0.5rem center',
      backgroundSize: '1.5rem 1.5rem',
      transition: 'all 0.2s ease-in-out',
    },

    selectWithIcon: {
      paddingLeft: '3rem',
    },

    textarea: {
      width: '100%',
      backgroundColor: '#374151',
      color: '#ffffff',
      border: '1px solid #4b5563',
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
      resize: 'vertical',
      minHeight: '80px',
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

    helpText: {
      color: '#6b7280',
      fontSize: '0.75rem',
      marginTop: '0.25rem',
    },

    submitButton: {
      width: '100%',
      backgroundColor: '#059669',
      color: '#ffffff',
      fontWeight: '500',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'all 0.2s ease-in-out',
      marginTop: '1rem',
    },

    submitButtonHover: {
      backgroundColor: '#047857',
    },

    submitButtonDisabled: {
      backgroundColor: '#065f46',
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
      color: '#10b981',
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
            <Briefcase style={{ width: '2rem', height: '2rem', color: '#ffffff' }} />
          </div>
          <h1 style={styles.title}>Seller Registration</h1>
          <p style={styles.subtitle}>Start selling to the student community</p>
        </div>

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

        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            
            {/* Full Name */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name *</label>
              <div style={styles.inputWrapper}>
                <User style={styles.icon} />
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(loading ? styles.inputDisabled : {}),
                  }}
                  required 
                  disabled={loading}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div style={styles.gridTwo}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address *</label>
                <div style={styles.inputWrapper}>
                  <Mail style={styles.icon} />
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      ...(loading ? styles.inputDisabled : {}),
                    }}
                    required 
                    disabled={loading}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number *</label>
                <div style={styles.inputWrapper}>
                  <Phone style={styles.icon} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      ...(loading ? styles.inputDisabled : {}),
                    }}
                    required
                    disabled={loading}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                  />
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div style={styles.gridTwo}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password *</label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.icon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      paddingRight: '3rem',
                      ...(loading ? styles.inputDisabled : {}),
                    }}
                    required 
                    disabled={loading}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    onMouseOver={(e) => e.target.style.color = styles.passwordToggleHover.color}
                    onMouseOut={(e) => e.target.style.color = '#9ca3af'}
                  >
                    {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
                  </button>
                </div>
                <p style={styles.helpText}>Must be at least 6 characters</p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password *</label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.icon} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      paddingRight: '3rem',
                      ...(loading ? styles.inputDisabled : {}),
                    }}
                    required
                    disabled={loading}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}
                    onMouseOver={(e) => e.target.style.color = styles.passwordToggleHover.color}
                    onMouseOut={(e) => e.target.style.color = '#9ca3af'}
                  >
                    {showConfirmPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
                  </button>
                </div>
              </div>
            </div>

            {/* College */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>College *</label>
              <div style={styles.inputWrapper}>
                <MapPin style={styles.icon} />
                <select
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  style={{
                    ...styles.select,
                    ...styles.selectWithIcon,
                    ...(loading ? styles.inputDisabled : {}),
                  }}
                  disabled={loading}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                >
                  <option value="">Select your college</option>
                  {colleges.map((college) => (
                    <option key={college} value={college === 'Other' ? 'other' : college.toLowerCase()}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom College Input */}
            {form.college === 'other' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Enter Your College Name *</label>
                <div style={styles.inputWrapper}>
                  <Building2 style={styles.icon} />
                  <input
                    type="text"
                    name="customCollege"
                    value={form.customCollege}
                    onChange={handleChange}
                    style={{
                      ...styles.input,
                      ...(loading ? styles.inputDisabled : {}),
                    }}
                    placeholder="Enter your college name"
                    disabled={loading}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => e.target.style.borderColor = '#4b5563'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {}),
            }}
            disabled={loading}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = styles.submitButtonHover.backgroundColor)}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#059669')}
          >
            {loading ? 'Registering...' : 'Register as Seller'}
          </button>
        </form>
        
        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine}></div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignup} 
          style={{
            ...styles.googleButton,
            ...(loading ? styles.googleButtonDisabled : {}),
          }}
          disabled={loading}
          onMouseOver={(e) => !loading && (e.target.style.backgroundColor = styles.googleButtonHover.backgroundColor)}
          onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#dc2626')}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => router.push('/seller-login')}
              style={styles.footerLink}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSellerRegistration;