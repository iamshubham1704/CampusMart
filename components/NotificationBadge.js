import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationsAPI } from '../app/utils/api';
import styles from './NotificationBadge.module.css';

const NotificationBadge = ({ className = '', size = 20, onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getNotificationStats();
      if (response.success) {
        setUnreadCount(response.stats.unreadNotifications || 0);
      } else {
        // Handle gracefully - don't show error for notifications
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0); // Fail silently for notifications
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`${styles.notificationBadge} ${className}`} 
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Bell size={size} />
      {unreadCount > 0 && (
        <span className={styles.badge}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {loading && <span className={styles.loading}></span>}
    </div>
  );
};

export default NotificationBadge;