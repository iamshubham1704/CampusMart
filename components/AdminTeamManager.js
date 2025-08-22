'use client';
import { useState, useEffect } from 'react';

export default function AdminTeamManager() {
  const [teamAssignments, setTeamAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    userType: 'seller',
    notes: ''
  });

  useEffect(() => {
    fetchTeamAssignments();
    fetchAvailableUsers();
  }, []);

  const fetchTeamAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/team-assignment', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setTeamAssignments(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch team assignments');
      }
    } catch (error) {
      setError('Failed to fetch team assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users?available=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setAvailableUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch available users:', error);
    }
  };

  const handleAssignUser = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/team-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message || 'User assigned to team successfully!');
        setFormData({
          userId: '',
          userType: 'seller',
          notes: ''
        });
        setShowAssignForm(false);
        fetchTeamAssignments();
        fetchAvailableUsers();
      } else {
        setError(data.error || 'Failed to assign user to team');
      }
    } catch (error) {
      setError('Failed to assign user to team');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (assignmentId) => {
    if (!confirm('Are you sure you want to remove this user from your team?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/team-assignment?id=${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message || 'User removed from team successfully!');
        fetchTeamAssignments();
        fetchAvailableUsers();
      } else {
        setError(data.error || 'Failed to remove user from team');
      }
    } catch (error) {
      setError('Failed to remove user from team');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUserTypeColor = (userType) => {
    return userType === 'seller' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getUserTypeIcon = (userType) => {
    return userType === 'seller' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Team Management</h2>
            <p className="text-green-100 mt-2">Manage your assigned sellers and buyers</p>
          </div>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            {showAssignForm ? 'Cancel' : '+ Assign User'}
          </button>
        </div>
      </div>

      {/* Assign User Form */}
      {showAssignForm && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Assign User to Team
          </h3>
          <form onSubmit={handleAssignUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  User Type *
                </label>
                <select
                  required
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="seller">👨‍💼 Seller</option>
                  <option value="buyer">👤 Buyer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select User *
                </label>
                <select
                  required
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select a user</option>
                  {availableUsers
                    .filter(user => user.role === formData.userType)
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email} ({user.college || 'No College'})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Notes (Optional)
              </label>
              <textarea
                placeholder="Add any notes about this assignment..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assign to Team
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Team Assignments List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Current Team Members
          </h3>
          <p className="text-gray-600 mt-2">
            Manage users assigned to your admin team
          </p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <div className="text-gray-500 mt-4 text-lg">Loading team assignments...</div>
            </div>
          ) : teamAssignments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-gray-500 mt-4 text-lg">No team members assigned yet.</div>
              <div className="text-gray-400 mt-2">Click "Assign User" to add members to your team.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {teamAssignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(assignment.user?.name || assignment.user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-2 rounded-full text-sm font-medium ${getUserTypeColor(assignment.userType)} flex items-center gap-2`}>
                        {getUserTypeIcon(assignment.userType)}
                        {assignment.userType.charAt(0).toUpperCase() + assignment.userType.slice(1)}
                      </span>
                      <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900 text-lg">
                        {assignment.user?.name || 'No Name'}
                      </div>
                      <div className="text-gray-600 mt-1">{assignment.user?.email || 'No Email'}</div>
                      <div className="text-gray-500 mt-1">{assignment.user?.college || 'No College'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                      </div>
                      {assignment.notes && (
                        <div className="text-gray-600 mt-1 max-w-xs">
                          "{assignment.notes}"
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleRemoveUser(assignment._id)}
                      className="text-red-600 hover:text-red-800 p-3 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Remove from team"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Team Members</p>
              <p className="text-3xl font-bold text-gray-900">{teamAssignments.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sellers</p>
              <p className="text-3xl font-bold text-blue-600">
                {teamAssignments.filter(a => a.userType === 'seller').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Buyers</p>
              <p className="text-3xl font-bold text-purple-600">
                {teamAssignments.filter(a => a.userType === 'buyer').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
