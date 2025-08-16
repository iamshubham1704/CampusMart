import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationsAPI } from '../app/utils/api';
import './NotificationBadge.module.css';

const NotificationBadge = ({ className = '', size = 20 }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Set up periodic refresh
    const interval = setInterval(fetchUnreadCount, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getNotificationStats();
      if (response.success) {
        setUnreadCount(response.stats.unreadNotifications || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <div className={`${styles.notificationBadge} ${className}`}>
      <Bell size={size} />
      {unreadCount > 0 && (
        <span className={styles.badge}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;