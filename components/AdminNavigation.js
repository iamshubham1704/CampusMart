// components/AdminNavigation.js - Reusable Admin Navigation Component
'use client';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminNavigation({ adminData, onLogout }) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      path: '/admin-dashboard',
      label: 'Dashboard',
      icon: '🏠',
      description: 'Overview and statistics'
    },
    {
      path: '/admin-dashboard/management',
      label: 'Management',
      icon: '⚙️',
      description: 'Listings, conversations, messages'
    },
    {
      path: '/admin-dashboard/payments',
      label: 'Payments',
      icon: '💳',
      description: 'Payment verification'
    },
    {
      path: '/admin-dashboard/reports',
      label: 'Reports',
      icon: '📋',
      description: 'User reports and issues'
    }
  ];

  const isActive = (path) => {
    if (path === '/admin-dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👨‍💼 Admin Panel
          </h1>
          <p style={{ 
            margin: '0.25rem 0 0 0', 
            color: '#666', 
            fontSize: '0.9rem' 
          }}>
            Welcome back, {adminData?.name}
          </p>
        </div>
        
        <button
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: isActive(item.path) ? '#007bff' : '#f8f9fa',
              color: isActive(item.path) ? 'white' : '#333',
              border: isActive(item.path) ? '2px solid #0056b3' : '1px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: isActive(item.path) ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              minWidth: 'fit-content'
            }}
            title={item.description}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>{item.label}</span>
              <small style={{ 
                opacity: 0.8, 
                fontSize: '0.7rem',
                display: isActive(item.path) ? 'none' : 'block'
              }}>
                {item.description}
              </small>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}