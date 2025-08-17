// app/admin-dashboard/reports/page.js - COMPLETE ADMIN REPORTS MANAGEMENT
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, type: '', report: null });
  const [searchQuery, setSearchQuery] = useState('');
  
  const router = useRouter();
  const itemsPerPage = 20;

  // Status and priority configurations
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#ffc107', bgColor: '#fff3cd' },
    { value: 'in-progress', label: 'In Progress', color: '#0dcaf0', bgColor: '#cff4fc' },
    { value: 'resolved', label: 'Resolved', color: '#198754', bgColor: '#d1e7dd' },
    { value: 'closed', label: 'Closed', color: '#6c757d', bgColor: '#f8f9fa' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#198754', bgColor: '#d1e7dd' },
    { value: 'medium', label: 'Medium', color: '#ffc107', bgColor: '#fff3cd' },
    { value: 'high', label: 'High', color: '#fd7e14', bgColor: '#ffe5d0' },
    { value: 'critical', label: 'Critical', color: '#dc3545', bgColor: '#f8d7da' }
  ];

  const issueTypeOptions = [
    { value: 'technical', label: 'Technical', icon: '🔧' },
    { value: 'payment', label: 'Payment', icon: '💳' },
    { value: 'fraud', label: 'Fraud', icon: '⚠️' },
    { value: 'seller', label: 'Seller Issue', icon: '👤' },
    { value: 'buyer', label: 'Buyer Issue', icon: '🛒' },
    { value: 'product', label: 'Product Issue', icon: '📦' },
    { value: 'other', label: 'Other', icon: '❓' }
  ];

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');
    
    if (!token || !admin) {
      router.push('/admin-login');
      return;
    }

    try {
      const adminInfo = JSON.parse(admin);
      if (adminInfo.role !== 'admin') {
        router.push('/admin-login');
        return;
      }
      setAdminData(adminInfo);
    } catch (error) {
      console.error('Error parsing admin data:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      router.push('/admin-login');
      return;
    }

    fetchReports();
  }, [filter, priorityFilter, currentPage, searchQuery, router]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (filter && filter !== 'all') {
        queryParams.append('status', filter);
      }
      
      if (priorityFilter && priorityFilter !== 'all') {
        queryParams.append('priority', priorityFilter);
      }

      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setReports(data.reports);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalReports);
      } else {
        setError(data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus, adminNotes = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId,
          status: newStatus,
          adminNotes
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setReports(reports.map(report => 
          report.reportId === reportId 
            ? { 
                ...report, 
                status: newStatus, 
                adminNotes, 
                updatedAt: new Date(),
                resolvedAt: (newStatus === 'resolved' || newStatus === 'closed') ? new Date() : report.resolvedAt
              }
            : report
        ));
        
        setActionModal({ show: false, type: '', report: null });
        setShowModal(false);
        alert('Report status updated successfully!');
      } else {
        alert(data.error || 'Failed to update report status');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleBulkAction = async (action, selectedReportIds) => {
    if (!selectedReportIds.length) {
      alert('Please select reports to perform bulk action');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedReportIds.length} selected reports?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const promises = selectedReportIds.map(reportId => 
        fetch('/api/admin/reports', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reportId,
            status: action,
            adminNotes: `Bulk action: ${action}`
          })
        })
      );

      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.ok).length;

      if (successCount === selectedReportIds.length) {
        alert(`Successfully updated ${successCount} reports`);
        fetchReports(); // Refresh the list
      } else {
        alert(`Updated ${successCount} out of ${selectedReportIds.length} reports. Some failed.`);
        fetchReports();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Network error during bulk action');
    }
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const openActionModal = (type, report) => {
    setActionModal({ show: true, type, report });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/admin-login');
  };

  const getStatusStyle = (status) => {
    const config = statusOptions.find(s => s.value === status);
    return config ? { color: config.color, backgroundColor: config.bgColor } : { color: '#6c757d', backgroundColor: '#f8f9fa' };
  };

  const getPriorityStyle = (priority) => {
    const config = priorityOptions.find(p => p.value === priority);
    return config ? { color: config.color, backgroundColor: config.bgColor } : { color: '#6c757d', backgroundColor: '#f8f9fa' };
  };

  const getIssueTypeInfo = (issueType) => {
    const config = issueTypeOptions.find(i => i.value === issueType);
    return config || { value: issueType, label: issueType, icon: '❓' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading reports...
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>
            📋 Reports Management
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Total Reports: {totalCount} | Page {currentPage} of {totalPages}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666' }}>Welcome, {adminData?.name}</span>
          <button
            onClick={() => router.push('/admin-dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '2rem',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Search:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by report ID, email, or description..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="all">All Status</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="all">All Priorities</option>
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <button
              onClick={() => {
                setCurrentPage(1);
                fetchReports();
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                height: 'fit-content'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Report ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Issue Details</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Reporter</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Priority</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => {
                const issueInfo = getIssueTypeInfo(report.issueType);
                return (
                  <tr key={report._id} style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {report.reportId}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{issueInfo.icon}</span>
                        <strong>{issueInfo.label}</strong>
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: '#666',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {report.description}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: '#e9ecef',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          textTransform: 'capitalize'
                        }}>
                          {report.role}
                        </span>
                        {report.email && (
                          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                            {report.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        ...getPriorityStyle(report.priority)
                      }}>
                        {report.priority}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        ...getStatusStyle(report.status)
                      }}>
                        {report.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#666' }}>
                      <div>📅 {formatDate(report.createdAt)}</div>
                      {report.resolvedAt && (
                        <div style={{ color: '#28a745', marginTop: '0.25rem' }}>
                          ✅ {formatDate(report.resolvedAt)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                          onClick={() => viewReportDetails(report)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          📋 View Details
                        </button>
                        
                        {report.status !== 'closed' && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {report.status === 'pending' && (
                              <button
                                onClick={() => openActionModal('start', report)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#0dcaf0',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem'
                                }}
                              >
                                ▶️ Start
                              </button>
                            )}
                            {(report.status === 'in-progress' || report.status === 'pending') && (
                              <button
                                onClick={() => openActionModal('resolve', report)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#198754',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem'
                                }}
                              >
                                ✅ Resolve
                              </button>
                            )}
                            <button
                              onClick={() => openActionModal('close', report)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.7rem'
                              }}
                            >
                              🚫 Close
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {reports.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#666'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3>No reports found</h3>
              <p>No reports matching the current filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#f8f9fa'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
                color: currentPage === 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            
            <span style={{ margin: '0 1rem', color: '#666' }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff',
                color: currentPage === totalPages ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>📋 Report Details</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <strong>Report ID:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#666' }}>
                  {selectedReport.reportId}
                </div>
              </div>
              
              <div>
                <strong>Issue Type:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getIssueTypeInfo(selectedReport.issueType).icon}
                  {getIssueTypeInfo(selectedReport.issueType).label}
                </div>
              </div>
              
              <div>
                <strong>Reporter Role:</strong>
                <div style={{ textTransform: 'capitalize' }}>{selectedReport.role}</div>
              </div>
              
              <div>
                <strong>Contact Email:</strong>
                <div>{selectedReport.email || 'Not provided'}</div>
              </div>
              
              <div>
                <strong>Priority:</strong>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  ...getPriorityStyle(selectedReport.priority)
                }}>
                  {selectedReport.priority}
                </span>
              </div>
              
              <div>
                <strong>Current Status:</strong>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  ...getStatusStyle(selectedReport.status)
                }}>
                  {selectedReport.status.replace('-', ' ')}
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Description:</strong>
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
                lineHeight: '1.5'
              }}>
                {selectedReport.description}
              </div>
            </div>

            {selectedReport.adminNotes && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Admin Notes:</strong>
                <div style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  border: '1px solid #bbdefb',
                  lineHeight: '1.5'
                }}>
                  {selectedReport.adminNotes}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <div>
                <strong>Created:</strong>
                <div>{formatDate(selectedReport.createdAt)}</div>
              </div>
              
              <div>
                <strong>Last Updated:</strong>
                <div>{formatDate(selectedReport.updatedAt)}</div>
              </div>
              
              {selectedReport.resolvedAt && (
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Resolved:</strong>
                  <div style={{ color: '#28a745' }}>{formatDate(selectedReport.resolvedAt)}</div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              
              {selectedReport.status !== 'closed' && (
                <>
                  {selectedReport.status === 'pending' && (
                    <button
                      onClick={() => openActionModal('start', selectedReport)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#0dcaf0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Start Working
                    </button>
                  )}
                  {(selectedReport.status === 'in-progress' || selectedReport.status === 'pending') && (
                    <button
                      onClick={() => openActionModal('resolve', selectedReport)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#198754',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => openActionModal('close', selectedReport)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Close Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Status Update with Notes) */}
      {actionModal.show && actionModal.report && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
              {actionModal.type === 'start' && '▶️ Start Working on Report'}
              {actionModal.type === 'resolve' && '✅ Resolve Report'}
              {actionModal.type === 'close' && '🚫 Close Report'}
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Report:</strong> {actionModal.report.reportId}
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {getIssueTypeInfo(actionModal.report.issueType).icon} {getIssueTypeInfo(actionModal.report.issueType).label}
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Admin Notes:
              </label>
              <textarea
                id="adminNotes"
                placeholder={
                  actionModal.type === 'start' ? 'Add notes about what actions you will take...' :
                  actionModal.type === 'resolve' ? 'Describe how the issue was resolved...' :
                  'Provide reason for closing this report...'
                }
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontFamily: 'Arial, sans-serif',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActionModal({ show: false, type: '', report: null })}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  const notes = document.getElementById('adminNotes').value.trim();
                  if (!notes && actionModal.type !== 'start') {
                    alert('Please provide notes for this action.');
                    return;
                  }
                  
                  const newStatus = 
                    actionModal.type === 'start' ? 'in-progress' :
                    actionModal.type === 'resolve' ? 'resolved' : 'closed';
                    
                  handleStatusUpdate(actionModal.report.reportId, newStatus, notes);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 
                    actionModal.type === 'start' ? '#0dcaf0' :
                    actionModal.type === 'resolve' ? '#198754' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {actionModal.type === 'start' && 'Start Working'}
                {actionModal.type === 'resolve' && 'Mark Resolved'}
                {actionModal.type === 'close' && 'Close Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}