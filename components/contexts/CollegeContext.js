"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import colleges from '../../app/utils/colleges';

const CollegeContext = createContext();

export const useCollege = () => {
  const context = useContext(CollegeContext);
  if (!context) {
    throw new Error('useCollege must be used within a CollegeProvider');
  }
  return context;
};

export const CollegeProvider = ({ children }) => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load selected college from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollege = localStorage.getItem('selectedCollege');
      if (savedCollege) {
        setSelectedCollege(savedCollege);
      } else {
        // Try to get college from user profile instead of showing modal
        getCollegeFromUserProfile();
      }
      setLoading(false);
    }
  }, []);

  // Function to get college from user profile
  const getCollegeFromUserProfile = async () => {
    try {
      // Try to get token from localStorage
      const buyerToken = localStorage.getItem('buyerToken');
      const sellerToken = localStorage.getItem('sellerToken');
      const authToken = localStorage.getItem('auth-token');
      
      const token = buyerToken || sellerToken || authToken;
      
      if (token) {
        // Fetch user profile to get college
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.college) {
            const userCollege = data.data.college;
            setSelectedCollege(userCollege);
            localStorage.setItem('selectedCollege', userCollege);
            return userCollege;
          }
        }
      }
      
      // If no college found in profile, don't show modal - just don't set a college
      return null;
    } catch (error) {
      console.error('Error fetching college from profile:', error);
      return null;
    }
  };

  // Save college selection to localStorage
  const handleSetSelectedCollege = (college) => {
    setSelectedCollege(college);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCollege', college);
    }
    setShowCollegeModal(false);
  };

  // Filter colleges based on search term
  const filterColleges = (searchTerm) => {
    if (!searchTerm) return colleges;
    return colleges.filter(college =>
      college.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Clear college selection
  const clearCollegeSelection = () => {
    setSelectedCollege(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedCollege');
    }
    setShowCollegeModal(true);
  };

  const value = {
    selectedCollege,
    setSelectedCollege: handleSetSelectedCollege,
    showCollegeModal,
    setShowCollegeModal,
    colleges,
    filterColleges,
    clearCollegeSelection,
    loading
  };

  return (
    <CollegeContext.Provider value={value}>
      {children}
    </CollegeContext.Provider>
  );
};
