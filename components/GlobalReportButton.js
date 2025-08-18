'use client';
import React, { useState } from 'react';
import { Shield, X, Check } from 'lucide-react';

const GlobalReportButton = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [reportData, setReportData] = useState({
    role: '',
    issueType: '',
    email: '',
    description: '',
    priority: 'medium'
  });

  const handleReportSubmit = async () => {
    if (!reportData.description || !reportData.role || !reportData.issueType) {
      return;
    }

    setIsSubmittingReport(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: reportData.role,
          issueType: reportData.issueType,
          email: reportData.email,
          description: reportData.description,
          priority: reportData.priority,
          timestamp: new Date().toISOString(),
          status: 'pending',
          page: window.location.pathname // Track which page the report came from
        }),
      });

      if (response.ok) {
        setShowReportModal(false);
        setReportData({
          role: '',
          issueType: '',
          email: '',
          description: '',
          priority: 'medium'
        });
        setShowSuccessToast(true);
        
        // Hide success toast after 5 seconds
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <>
      {/* Floating Report Button */}
      <button 
        className="global-report-button"
        onClick={() => setShowReportModal(true)}
        title="Report an issue"
        aria-label="Report an issue"
      >
        <Shield size={20} />
        <span className="report-button-text">Report</span>
      </button>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="modal-overlay global-modal" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report an Issue</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowReportModal(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="globalReporterRole">Your Role</label>
                <select 
                  id="globalReporterRole"
                  value={reportData.role}
                  onChange={(e) => setReportData(prev => ({ ...prev, role: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select your role</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="globalIssueType">Issue Type</label>
                <select 
                  id="globalIssueType"
                  value={reportData.issueType}
                  onChange={(e) => setReportData(prev => ({ ...prev, issueType: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select issue type</option>
                  <option value="technical">Technical Problem</option>
                  <option value="payment">Payment Issue</option>
                  <option value="fraud">Suspicious Activity/Fraud</option>
                  <option value="seller">Seller Issue</option>
                  <option value="buyer">Buyer Issue</option>
                  <option value="product">Product Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="globalReportEmail">Email</label>
                <input
                  type="email"
                  id="globalReportEmail"
                  value={reportData.email}
                  onChange={(e) => setReportData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                  placeholder="Your email for follow-up"
                />
              </div>

              <div className="form-group">
                <label htmlFor="globalReportDescription">Description</label>
                <textarea
                  id="globalReportDescription"
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="globalReportUrgency">Priority Level</label>
                <select 
                  id="globalReportUrgency"
                  value={reportData.priority}
                  onChange={(e) => setReportData(prev => ({ ...prev, priority: e.target.value }))}
                  className="form-select"
                >
                  <option value="low">Low - General feedback</option>
                  <option value="medium">Medium - Issue affecting experience</option>
                  <option value="high">High - Urgent issue</option>
                  <option value="critical">Critical - Security/Safety concern</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowReportModal(false)}
                disabled={isSubmittingReport}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleReportSubmit}
                disabled={!reportData.description || !reportData.role || !reportData.issueType || isSubmittingReport}
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="success-toast global-toast">
          <div className="toast-content">
            <Check size={20} />
            <span>Report submitted successfully! We'll review it soon.</span>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalReportButton;