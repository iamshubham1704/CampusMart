"use client";
import React from 'react';
import { useWishlist } from '../../../components/contexts/WishlistContext';
import { X } from 'lucide-react';

const WishlistModal = ({ isOpen, onClose, isDarkTheme }) => {
  const { wishlist = [], removeFromWishlist } = useWishlist();

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  };

  const modalStyle = {
    backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff',
    color: isDarkTheme ? '#e2e8f0' : '#1a202c',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `1px solid ${isDarkTheme ? '#334155' : '#e2e8f0'}`, paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Your Wishlist</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        <div>
          {wishlist.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {wishlist.map(item => (
                <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: isDarkTheme ? '#334155' : '#f8fafc', borderRadius: '0.5rem' }}>
                  <img src={item.image} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{item.title}</h3>
                    <p style={{ margin: 0, color: '#10b981', fontWeight: '600' }}>₹{item.price}</p>
                  </div>
                  <button onClick={() => removeFromWishlist(item.id)} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Your wishlist is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;