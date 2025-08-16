// hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Replace with your actual API call
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear all notifications');
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  }, []);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((newNotification) => {
    setNotifications(prev => [newNotification, ...prev]);
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    refetch: fetchNotifications
  };
};