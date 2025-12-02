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
        // Show modal if no college is selected
        setShowCollegeModal(true);
      }
      setLoading(false);
    }
  }, []);

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
