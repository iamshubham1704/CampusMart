"use client";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  DollarSign,
  BookOpen,
  MapPin,
  Clock,
  CheckCircle,
  X,
  Loader2,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { getStoredToken, isAuthenticated, redirectToLogin } from '../../../lib/auth';
import styles from './Assignments.module.css';

const AdminAssignmentsPage = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
    tentativeDeliveryDate: '',
    adminNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Statuses', color: 'text-gray-600' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600' },
    { value: 'in_progress', label: 'In Progress', color: 'text-purple-600' },
    { value: 'completed', label: 'Completed', color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' }
  ];

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  useEffect(() => {
    if (assignments.length > 0) {
      filterAssignments();
    }
  }, [assignments, searchTerm, statusFilter]);

  const checkAuthAndFetchProfile = async () => {
    try {
      if (!isAuthenticated('admin')) {
        redirectToLogin('admin');
        return;
      }

      const token = getStoredToken('admin');
      if (!token) {
        redirectToLogin('admin');
        return;
      }

      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin('admin');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setAdmin(data.data);
      fetchAssignments();
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = getStoredToken('admin');
      if (!token) return;

      const response = await fetch(`/api/admin/assignments?page=${currentPage}&limit=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments');
    }
  };

  const filterAssignments = () => {
    let filtered = assignments;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(lowerSearch) ||
        assignment.subject.toLowerCase().includes(lowerSearch) ||
        assignment.buyer?.name?.toLowerCase().includes(lowerSearch) ||
        assignment.buyer?.email?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredAssignments(filtered);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setEditFormData({
      status: assignment.status,
      tentativeDeliveryDate: assignment.tentativeDeliveryDate ? 
        new Date(assignment.tentativeDeliveryDate).toISOString().split('T')[0] : '',
      adminNotes: assignment.adminNotes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    
    if (!editFormData.status) {
      setError('Status is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = getStoredToken('admin');
      const response = await fetch('/api/admin/assignments', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment._id,
          ...editFormData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update assignment');
      }

      const data = await response.json();
      setSuccess('Assignment updated successfully!');
      
      // Update the assignment in the local state
      setAssignments(prev => prev.map(assignment => 
        assignment._id === selectedAssignment._id 
          ? { ...assignment, ...data.data }
          : assignment
      ));

      setIsEditModalOpen(false);
      setSelectedAssignment(null);
      setEditFormData({
        status: '',
        tentativeDeliveryDate: '',
        adminNotes: ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getStoredToken('admin');
      const response = await fetch(`/api/admin/assignments?id=${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Assignment deleted successfully!');
        setAssignments(prev => prev.filter(assignment => assignment._id !== assignmentId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete assignment');
      }
    } catch (error) {
      setError(error.message);
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
      case 'completed': return <CheckCircle2 size={16} />;
      case 'cancelled': return <X size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={styles['admin-assignments-page']}>
        <div className={styles['loading-container']}>
          <Loader2 size={48} className={styles.spinner} />
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['admin-assignments-page']}>
      {/* Header */}
      <div className={styles['assignments-header']}>
        <div className={styles['header-content']}>
          <Link href="/admin-dashboard" className={styles['back-button']}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1>Assignment Management</h1>
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
            <p>Total Assignments</p>
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
            <h3>{assignments.filter(a => a.status === 'confirmed').length}</h3>
            <p>Confirmed</p>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles['stat-content']}>
            <h3>{assignments.filter(a => a.status === 'completed').length}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles['filters-section']}>
        <div className={styles['search-box']}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search assignments, subjects, or buyers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles['filter-controls']}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles['status-filter']}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className={styles['assignments-content']}>
        {filteredAssignments.length === 0 ? (
          <div className={styles['empty-state']}>
            <FileText size={64} />
            <h3>No assignments found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className={styles['assignments-list']}>
            {filteredAssignments.map((assignment) => (
              <div key={assignment._id} className={styles['assignment-card']}>
                <div className={styles['assignment-header']}>
                  <div className={styles['assignment-type']}>
                    <FileText size={20} />
                    <span className={styles['type-label']}>Assignment</span>
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
                    <div className={styles['detail-item']}>
                      <BookOpen size={16} />
                      <span>{assignment.subject}</span>
                    </div>
                    {assignment.deadline && (
                      <div className={styles['detail-item']}>
                        <Calendar size={16} />
                        <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className={styles['detail-item']}>
                      <DollarSign size={16} />
                      <span>Budget: ₹{assignment.budget}</span>
                    </div>
                    {assignment.location && (
                      <div className={styles['detail-item']}>
                        <MapPin size={16} />
                        <span>{assignment.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Buyer Information */}
                  <div className={styles['buyer-info']}>
                    <h4>Buyer Details:</h4>
                    <div className={styles['buyer-details']}>
                      <div className={styles['buyer-item']}>
                        <User size={16} />
                        <span><strong>Name:</strong> {assignment.buyer?.name || 'N/A'}</span>
                      </div>
                      <div className={styles['buyer-item']}>
                        <span><strong>Email:</strong> {assignment.buyer?.email || 'N/A'}</span>
                      </div>
                      <div className={styles['buyer-item']}>
                        <span><strong>College:</strong> {assignment.buyer?.university || assignment.buyer?.college || 'N/A'}</span>
                      </div>
                      {assignment.buyer?.phone && (
                        <div className={styles['buyer-item']}>
                          <span><strong>Phone:</strong> {assignment.buyer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

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

                  {assignment.tentativeDeliveryDate && (
                    <div className={styles['delivery-info']}>
                      <h4>Delivery Information:</h4>
                      <div className={styles['delivery-details']}>
                        <div className={styles['delivery-item']}>
                          <Calendar size={16} />
                          <span><strong>Tentative Delivery:</strong> {new Date(assignment.tentativeDeliveryDate).toLocaleDateString()}</span>
                        </div>
                        {assignment.adminNotes && (
                          <div className={styles['admin-notes']}>
                            <span><strong>Admin Notes:</strong> {assignment.adminNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles['assignment-footer']}>
                  <div className={styles['assignment-meta']}>
                    <span>Posted: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                    {assignment.confirmedAt && (
                      <span className={styles['confirmed-date']}>
                        Confirmed: {new Date(assignment.confirmedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className={styles['assignment-actions']}>
                    <button 
                      className={`${styles['action-button']} ${styles.view}`}
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <Edit size={16} />
                      Manage
                    </button>
                    <button 
                      className={`${styles['action-button']} ${styles.delete}`}
                      onClick={() => handleDeleteAssignment(assignment._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles['pagination-button']}
          >
            Previous
          </button>
          <span className={styles['page-info']}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={styles['pagination-button']}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {isEditModalOpen && selectedAssignment && (
        <div className={styles['modal-overlay']} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles['edit-modal']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h2>Manage Assignment</h2>
              <button 
                className={styles['close-button']}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className={styles['edit-form']}>
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
                <label>Assignment Title</label>
                <input
                  type="text"
                  value={selectedAssignment.title}
                  disabled
                  className={styles['disabled-input']}
                />
              </div>

              <div className={styles['form-group']}>
                <label>Status *</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className={styles['form-group']}>
                <label>Tentative Delivery Date</label>
                <input
                  type="date"
                  value={editFormData.tentativeDeliveryDate}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tentativeDeliveryDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className={styles['form-group']}>
                <label>Admin Notes</label>
                <textarea
                  value={editFormData.adminNotes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Add any notes or instructions..."
                  rows={4}
                />
              </div>

              <div className={styles['form-actions']}>
                <button
                  type="button"
                  className={styles['cancel-button']}
                  onClick={() => setIsEditModalOpen(false)}
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Update Assignment
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

export default AdminAssignmentsPage;

