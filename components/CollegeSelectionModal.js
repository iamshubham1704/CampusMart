"use client";
import React, { useState, useEffect } from 'react';
import { useCollege } from './contexts/CollegeContext';
import { Building2, Search, X, ArrowRight, Check } from 'lucide-react';
import './CollegeSelectionModal.css';

const CollegeSelectionModal = () => {
  const {
    showCollegeModal,
    setSelectedCollege,
    selectedCollege,
    colleges,
    filterColleges,
    loading
  } = useCollege();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredColleges, setFilteredColleges] = useState(colleges);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter colleges based on search term
  useEffect(() => {
    const filtered = filterColleges(searchTerm);
    setFilteredColleges(filtered);
    setSelectedIndex(0); // Reset selection when filtering
  }, [searchTerm, filterColleges]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showCollegeModal) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredColleges.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredColleges.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredColleges[selectedIndex]) {
            setSelectedCollege(filteredColleges[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // Don't allow closing without selection
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCollegeModal, filteredColleges, selectedIndex, setSelectedCollege]);

  if (!showCollegeModal || loading) return null;

  return (
    <div className="college-selection-modal-overlay">
      <div className="college-selection-modal-content">
        {/* Header */}
        <div className="college-selection-modal-header">
          <div className="header-icon">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="header-title">Welcome to CampusMart</h2>
            <p className="header-subtitle">Select your college to get started</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="college-selection-modal-search-section">
          <div className="search-input-wrapper">
            <div className="search-icon">
              <Search size={20} />
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Search for your college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search colleges"
            />
          </div>
          <p className="search-description">
            Choose your college to see relevant products and assignments.
          </p>
        </div>

        {/* Colleges List */}
        <div className="college-selection-modal-list-container">
          {filteredColleges.length === 0 ? (
            <div className="no-colleges-found">
              <div className="no-colleges-icon">
                <Building2 size={48} />
              </div>
              <p className="no-colleges-title">No colleges found</p>
              <p className="no-colleges-subtitle">Try a different search term or check for typos.</p>
            </div>
          ) : (
            <div className="college-cards-grid">
              {filteredColleges.map((college, index) => (
                <button
                  key={college}
                  className={`college-card ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => setSelectedCollege(college)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  aria-pressed={index === selectedIndex}
                >
                  <div className="college-card-indicator" />
                  <div className="college-card-content">
                    <h3 className="college-card-title">{college}</h3>
                    <p className="college-card-subtitle">IPU University</p>
                  </div>
                  {index === selectedIndex && (
                    <div className="college-card-checkmark">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="college-selection-modal-footer">
          <div className="footer-info">
            <span className="footer-count">{filteredColleges.length}</span> colleges found
          </div>
          <div className="footer-actions">
            <span className="keyboard-hint">
              Press <kbd className="keyboard-key">Enter</kbd> to select
            </span>
            {filteredColleges[selectedIndex] && (
              <button
                onClick={() => setSelectedCollege(filteredColleges[selectedIndex])}
                className="continue-button"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeSelectionModal;
