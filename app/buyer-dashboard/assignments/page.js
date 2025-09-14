//app/buyer-dashboard/assignments/page.js
"use client";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  PenTool,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Plus,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  Mail,
  Phone,
  Star,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { getStoredToken, isAuthenticated, redirectToLogin } from '../../../lib/auth';
import styles from './Assignments.module.css';

const AssignmentsPage = () => {
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    deadline: '',
    budget: '',
    location: '',
    additionalRequirements: '',
    pdfFile: null,
    pdfUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Assignment types
  const assignmentTypes = [
    { id: 'assignment', name: 'Assignment', icon: FileText, description: 'Academic assignments and homework' },
    { id: 'practical', name: 'Practical File', icon: BookOpen, description: 'Lab practical files and reports' },
    { id: 'project', name: 'Project', icon: PenTool, description: 'Academic projects and research' },
    { id: 'other', name: 'Other', icon: FileText, description: 'Other academic work' }
  ];


  useEffect(() => {
    checkAuthAndFetchProfile();
    fetchAssignments();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      if (!isAuthenticated('buyer')) {
        redirectToLogin('buyer');
        return;
      }

      const token = getStoredToken('buyer');
      if (!token) {
        redirectToLogin('buyer');
        return;
      }

      const response = await fetch('/api/buyer/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin('buyer');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setBuyer(data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = getStoredToken('buyer');
      if (!token) return;

      const response = await fetch('/api/assignments?userType=buyer', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateFile = (file) => {
    if (!file) return null;

    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed.';
    }

    // Check file size (25MB = 25 * 1024 * 1024 bytes)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${fileSizeMB}MB) exceeds the maximum limit of 25MB.`;
    }

    return null; // No errors
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      // Clear the file input
      e.target.value = '';
      return;
    }

    // Clear any previous errors
    setError('');
    handleInputChange('pdfFile', file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.budget) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = getStoredToken('buyer');
      
      // First create the assignment
      const assignmentResponse = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData
        })
      });

      if (!assignmentResponse.ok) {
        const errorData = await assignmentResponse.json();
        throw new Error(errorData.message || 'Failed to create assignment request');
      }

      const assignmentData = await assignmentResponse.json();
      const assignmentId = assignmentData.data._id;

      // If PDF file is selected, upload it
      if (formData.pdfFile) {
        const pdfFormData = new FormData();
        pdfFormData.append('pdf', formData.pdfFile);
        pdfFormData.append('assignmentId', assignmentId);

        const pdfResponse = await fetch('/api/assignments/upload-pdf', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: pdfFormData
        });

        if (!pdfResponse.ok) {
          const errorData = await pdfResponse.json();
          throw new Error(`PDF upload failed: ${errorData.error || 'Unknown error occurred'}`);
        }

        const pdfData = await pdfResponse.json();
        
        // Update assignment with PDF URL
        const updateResponse = await fetch('/api/assignments', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignmentId,
            pdfUrl: pdfData.data.url
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(`Failed to update assignment with PDF: ${errorData.error || 'Unknown error occurred'}`);
        }
      }

      setSuccess('Assignment request created successfully!');
      setFormData({
        title: '',
        description: '',
        type: '',
        deadline: '',
        budget: '',
        location: '',
        additionalRequirements: '',
        pdfFile: null,
        pdfUrl: ''
      });
      setIsCreateModalOpen(false);
      fetchAssignments(); // Refresh the list
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'confirmed': return <CheckCircle size={16} />;
      case 'in_progress': return <Loader2 size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <X size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={styles['assignments-page']}>
        <div className={styles['loading-container']}>
          <Loader2 size={48} className={styles.spinner} />
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['assignments-page']}>
      {/* Header */}
      <div className={styles['assignments-header']}>
        <div className={styles['header-content']}>
          <Link href="/buyer-dashboard" className={styles['back-button']}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1>Assignment Requests</h1>
          <button 
            className={styles['create-button']}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={20} />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles['stats-section']}>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <FileText size={24} />
          </div>
          <div className={styles['stat-content']}>
            <h3>{assignments.length}</h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <Clock size={24} />
          </div>
          <div className={styles['stat-content']}>
            <h3>{assignments.filter(a => a.status === 'pending').length}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <CheckCircle size={24} />
          </div>
          <div className={styles['stat-content']}>
            <h3>{assignments.filter(a => a.status === 'completed').length}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className={styles['assignments-content']}>
        {assignments.length === 0 ? (
          <div className={styles['empty-state']}>
            <FileText size={64} />
            <h3>No assignment requests yet</h3>
            <p>Create your first assignment request to get started</p>
            <button 
              className={styles['create-first-button']}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={20} />
              Create Assignment
            </button>
          </div>
        ) : (
          <div className={styles['assignments-list']}>
            {assignments.map((assignment) => (
              <div key={assignment._id} className={styles['assignment-card']}>
                <div className={styles['assignment-header']}>
                  <div className={styles['assignment-type']}>
                    {assignmentTypes.find(t => t.id === assignment.type)?.icon && 
                      React.createElement(assignmentTypes.find(t => t.id === assignment.type).icon, { size: 20 })
                    }
                    <span className={styles['type-label']}>
                      {assignmentTypes.find(t => t.id === assignment.type)?.name || assignment.type}
                    </span>
                  </div>
                  <div className={`${styles['status-badge']} ${getStatusColor(assignment.status)}`}>
                    {getStatusIcon(assignment.status)}
                    <span>{assignment.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>

                <div className={styles['assignment-content']}>
                  <h3 className={styles['assignment-title']}>{assignment.title}</h3>
                  <p className={styles['assignment-description']}>{assignment.description}</p>
                  
                  <div className={styles['assignment-details']}>
                    {assignment.deadline && (
                      <div className={styles['detail-item']}>
                        <Calendar size={16} />
                        <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className={styles['detail-item']}>
                      <DollarSign size={16} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>Your Budget: ₹{assignment.budget}</span>
                        {assignment.buyerPrice && (
                          <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.9rem' }}>
                            Final Price: ₹{assignment.buyerPrice}
                          </span>
                        )}
                        {!assignment.buyerPrice && (
                          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                            Final price pending admin review
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.location && (
                      <div className={styles['detail-item']}>
                        <MapPin size={16} />
                        <span>{assignment.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Admin Information - NEW SECTION */}
                  {assignment.assignedAdmin && (
                    <div className={styles['admin-info']}>
                      <h4>Admin :</h4>
                      <div className={styles['admin-card']}>
                        <div className={styles['admin-avatar']}>
                          <User size={32} />
                        </div>
                        <div className={styles['admin-details']}>
                          <div className={styles['admin-name']}>
                            <strong>{assignment.assignedAdmin.name}</strong>
                            {assignment.assignedAdmin.department && (
                              <div className={styles['admin-department']}>
                                <span>{assignment.assignedAdmin.department}</span>
                              </div>
                            )}
                          </div>
                          <div className={styles['admin-contact-info']}>
                            <span>Email: {assignment.assignedAdmin.email}</span>
                            {assignment.assignedAdmin.phone && (
                              <span>Phone: {assignment.assignedAdmin.phone}</span>
                            )}
                            {assignment.assignedAdmin.experience && (
                              <span>Experience: {assignment.assignedAdmin.experience}</span>
                            )}
                          </div>
                          <div className={styles['admin-contact-buttons']}>
                            <button 
                              className={styles['contact-button']}
                              onClick={() => window.open(`mailto:${assignment.assignedAdmin.email}?subject=Assignment Inquiry: ${assignment.title}`, '_blank')}
                            >
                              <Mail size={16} />
                              Send Email
                            </button>
                            {assignment.assignedAdmin.phone && (
                              <button 
                                className={styles['contact-button']}
                                onClick={() => window.open(`tel:${assignment.assignedAdmin.phone}`, '_blank')}
                              >
                                <Phone size={16} />
                                Call Admin
                              </button>
                            )}
                            {assignment.assignedAdmin.phone && (
                              <button 
                                className={styles['contact-button']}
                                onClick={() => window.open(`https://wa.me/${assignment.assignedAdmin.phone?.replace(/\D/g, '')}?text=Hi, I need help with my assignment: ${assignment.title}`, '_blank')}
                              >
                                <MessageSquare size={16} />
                                WhatsApp
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Information */}
                  {assignment.tentativeDeliveryDate && (
                    <div className={styles['delivery-info']}>
                      <h4>📅 Delivery Information:</h4>
                      <div className={styles['delivery-details']}>
                        <div className={styles['delivery-item']}>
                          <Calendar size={16} />
                          <span>
                            <strong>Expected Delivery:</strong> {new Date(assignment.tentativeDeliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                        {assignment.adminNotes && (
                          <div className={styles['admin-notes']}>
                            <AlertCircle size={16} />
                            <span>
                              <strong>Expert Notes:</strong> {assignment.adminNotes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {assignment.additionalRequirements && (
                    <div className={styles['additional-requirements']}>
                      <h4>Additional Requirements:</h4>
                      <p>{assignment.additionalRequirements}</p>
                    </div>
                  )}

                  {assignment.pdfUrl && (
                    <div className={styles['pdf-attachment']}>
                      <h4>Attached PDF:</h4>
                      <a 
                        href={assignment.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles['pdf-link']}
                      >
                        <FileText size={16} />
                        <span>View Assignment PDF</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className={styles['assignment-footer']}>
                  <div className={styles['assignment-meta']}>
                    <span>Posted: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                    {assignment.deadline && (
                      <span className={styles['deadline-warning']}>
                        {new Date(assignment.deadline) < new Date() ? 'Overdue' : 'Active'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className={styles['error-toast']}>
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className={styles['success-toast']}>
          <CheckCircle size={16} />
          {success}
          <button onClick={() => setSuccess('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className={styles['modal-overlay']} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles['create-modal']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h2>Create Assignment Request</h2>
              <button 
                className={styles['close-button']}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles['create-form']}>
              {error && (
                <div className={styles['error-message']}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {success && (
                <div className={styles['success-message']}>
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}

              <div className={styles['form-group']}>
                <label>Assignment Type *</label>
                <div className={styles['type-options']}>
                  {assignmentTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      className={`${styles['type-option']} ${formData.type === type.id ? styles.selected : ''}`}
                      onClick={() => handleInputChange('type', type.id)}
                    >
                      <type.icon size={20} />
                      <div className={styles['type-info']}>
                        <span className={styles['type-name']}>{type.name}</span>
                        <span className={styles['type-description']}>{type.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles['form-group']}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Data Structures Assignment"
                  required
                />
              </div>

              <div className={styles['form-group']}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your assignment requirements..."
                  rows={4}
                />
              </div>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label>Budget (₹) *</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="500"
                    min="100"
                    required
                  />
                </div>
              </div>

              <div className={styles['form-group']}>
                <label>Additional Requirements</label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                  placeholder="Any specific requirements or preferences..."
                  rows={3}
                />
              </div>

              <div className={styles['form-group']}>
                <label>Upload Assignment PDF (Optional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className={styles['file-input']}
                />
                <small className={styles['file-help']}>Maximum file size: 25MB. Only PDF files are allowed.</small>
                {formData.pdfFile && (
                  <div className={styles['file-preview']}>
                    <FileText size={16} />
                    <div className={styles['file-info']}>
                      <span className={styles['file-name']}>{formData.pdfFile.name}</span>
                      <span className={styles['file-size']}>
                        ({(formData.pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles['form-actions']}>
                <button
                  type="button"
                  className={styles['cancel-button']}
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles['submit-button']}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Create Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
