// app/seller-dashboard/notifications/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, MessageSquare, Package, Star, User, Eye, Clock,
  Check, CheckCheck, Trash2, Filter, Search, ChevronDown,
  AlertCircle, Heart, ShoppingCart, TrendingUp, Settings,
  ArrowLeft, RefreshCw, MoreVertical, X
} from 'lucide-react';
import styles from '../../styles/Notifications.module.css';
import { notificationsAPI } from '../../utils/api';
import { useNotifications } from '../../../hooks/useNotifications';

const NotificationsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [bulkActionDropdownOpen, setBulkActionDropdownOpen] = useState(false);

  // Use the notifications hook
  const {
    notifications,
    loading,
    error,
    stats,
    currentType: selectedTab,
    markAsRead,
    markAsUnread,
    deleteNotification,
    bulkOperation,
    changeType,
    getUnreadCount: hookGetUnreadCount,
    refresh
  } = useNotifications('all', true);

  // Notification types and their configurations
  const notificationTypes = {
    message: { icon: MessageSquare, color: '#3b82f6', label: 'Messages' },
    listing: { icon: Package, color: '#10b981', label: 'Listings' },
    review: { icon: Star, color: '#eab308', label: 'Reviews' },
    like: { icon: Heart, color: '#ec4899', label: 'Likes' },
    view: { icon: Eye, color: '#6366f1', label: 'Views' },
    sale: { icon: ShoppingCart, color: '#059669', label: 'Sales' },
    system: { icon: Bell, color: '#6b7280', label: 'System' },
    trending: { icon: TrendingUp, color: '#f59e0b', label: 'Trending' }
  };

  // Get current user from token
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sellerId || payload.userId || payload.id,
        name: payload.name || 'User',
        email: payload.email || ''
      };
    } catch (error) {
      return null;
    }
  };

  // Filter notifications based on selected tab and search query
  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'unread' && !notification.read) ||
                      (selectedTab === 'read' && notification.read) ||
                      notification.type === selectedTab;
    
    const matchesSearch = !searchQuery || 
                         notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Mark notification as read - updated to use hook
  const handleMarkAsRead = async (notificationId) => {
    const success = await markAsRead(notificationId);
    if (!success) {
      console.error('Failed to mark notification as read');
    }
  };

  // Mark notification as unread - updated to use hook
  const handleMarkAsUnread = async (notificationId) => {
    const success = await markAsUnread(notificationId);
    if (!success) {
      console.error('Failed to mark notification as unread');
    }
  };

  // Delete notification - updated to use hook
  const handleDeleteNotification = async (notificationId) => {
    const success = await deleteNotification(notificationId);
    if (success) {
      setShowDeleteModal(false);
      setNotificationToDelete(null);
      // Remove from selected notifications if it was selected
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    } else {
      console.error('Failed to delete notification');
    }
  };

  // Bulk actions - updated to use hook
  const handleBulkAction = async (action) => {
    let apiAction;
    switch (action) {
      case 'markAllRead':
        apiAction = 'markAsRead';
        break;
      case 'markAllUnread':
        apiAction = 'markAsUnread';
        break;
      case 'deleteAll':
        apiAction = 'delete';
        break;
      default:
        return;
    }

    const success = await bulkOperation(apiAction, selectedNotifications);
    if (success) {
      setSelectedNotifications([]);
      setBulkActionDropdownOpen(false);
    } else {
      console.error('Failed to perform bulk action');
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Select all notifications
  const selectAllNotifications = () => {
    setSelectedNotifications(filteredNotifications.map(n => n._id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedNotifications([]);
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const config = notificationTypes[type] || notificationTypes.system;
    const IconComponent = config.icon;
    return <IconComponent size={20} color={config.color} />;
  };

  // Get unread count by type - use hook function or fallback to local calculation
  const getUnreadCount = (type) => {
    // Use hook function if available, otherwise calculate locally
    if (hookGetUnreadCount) {
      return hookGetUnreadCount(type);
    }
    
    // Fallback local calculation
    if (type === 'all') return notifications.filter(n => !n.read).length;
    if (type === 'unread') return notifications.filter(n => !n.read).length;
    if (type === 'read') return notifications.filter(n => n.read).length;
    return notifications.filter(n => n.type === type && !n.read).length;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <RefreshCw size={48} className={styles.spinner} />
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <h2>Error Loading Notifications</h2>
        <p>{error}</p>
        <button onClick={refresh} className={styles.retryButton}>
          <RefreshCw size={20} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.notificationsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button 
            onClick={() => router.back()}
            className={styles.backButton}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          
          <div className={styles.headerActions}>
            <button 
              onClick={refresh}
              className={styles.refreshButton}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? styles.spinning : ''} />
              Refresh
            </button>
            
            <button className={styles.settingsButton}>
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>

        <div className={styles.headerMain}>
          <h1 className={styles.pageTitle}>
            <Bell size={28} />
            Notifications
            {getUnreadCount('all') > 0 && (
              <span className={styles.unreadBadge}>
                {getUnreadCount('all')}
              </span>
            )}
          </h1>
          
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchButton}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs and Actions */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: getUnreadCount('unread') },
            { key: 'message', label: 'Messages', count: getUnreadCount('message') },
            { key: 'listing', label: 'Listings', count: getUnreadCount('listing') },
            { key: 'review', label: 'Reviews', count: getUnreadCount('review') }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => changeType(tab.key)}
              className={`${styles.tab} ${selectedTab === tab.key ? styles.activeTab : ''}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={styles.tabCount}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          {selectedNotifications.length > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.selectionCount}>
                {selectedNotifications.length} selected
              </span>
              <div className={styles.bulkActionDropdown}>
                <button 
                  onClick={() => setBulkActionDropdownOpen(!bulkActionDropdownOpen)}
                  className={styles.bulkActionButton}
                >
                  <MoreVertical size={16} />
                  Actions
                  <ChevronDown size={16} />
                </button>
                
                {bulkActionDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <button onClick={() => handleBulkAction('markAllRead')}>
                      <CheckCheck size={16} />
                      Mark as Read
                    </button>
                    <button onClick={() => handleBulkAction('markAllUnread')}>
                      <Check size={16} />
                      Mark as Unread
                    </button>
                    <button 
                      onClick={() => handleBulkAction('deleteAll')}
                      className={styles.dangerAction}
                    >
                      <Trash2 size={16} />
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={clearAllSelections}
                className={styles.clearSelectionButton}
              >
                Clear
              </button>
            </div>
          )}

          {selectedNotifications.length === 0 && (
            <button 
              onClick={selectAllNotifications}
              className={styles.selectAllButton}
            >
              Select All
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={64} />
            <h3>No notifications found</h3>
            <p>
              {searchQuery 
                ? `No notifications match "${searchQuery}"`
                : selectedTab === 'all'
                  ? "You're all caught up! No new notifications."
                  : `No ${selectedTab} notifications found.`
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification._id}
              className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
            >
              <div className={styles.notificationCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification._id)}
                  onChange={() => toggleNotificationSelection(notification._id)}
                />
              </div>

              <div className={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </div>

              <div 
                className={styles.notificationContent}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationHeader}>
                  <h3 className={styles.notificationTitle}>
                    {notification.title}
                  </h3>
                  <div className={styles.notificationMeta}>
                    <span className={styles.notificationTime}>
                      <Clock size={12} />
                      {formatTimestamp(notification.createdAt)}
                    </span>
                    {!notification.read && (
                      <span className={styles.unreadDot}></span>
                    )}
                  </div>
                </div>
                
                <p className={styles.notificationMessage}>
                  {notification.message}
                </p>

                {notification.metadata && (
                  <div className={styles.notificationMetadata}>
                    {notification.type === 'message' && notification.metadata.senderName && (
                      <span className={styles.metadataItem}>
                        From: {notification.metadata.senderName}
                      </span>
                    )}
                    {notification.type === 'like' && notification.metadata.totalLikes && (
                      <span className={styles.metadataItem}>
                        Total likes: {notification.metadata.totalLikes}
                      </span>
                    )}
                    {notification.type === 'view' && notification.metadata.viewCount && (
                      <span className={styles.metadataItem}>
                        Views today: {notification.metadata.viewCount}
                      </span>
                    )}
                    {notification.type === 'review' && notification.metadata.rating && (
                      <span className={styles.metadataItem}>
                        ⭐ {notification.metadata.rating}/5 stars
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.notificationActions}>
                <div className={styles.actionDropdown}>
                  <button className={styles.actionButton}>
                    <MoreVertical size={16} />
                  </button>
                  
                  <div className={styles.dropdownMenu}>
                    {!notification.read ? (
                      <button onClick={() => handleMarkAsRead(notification._id)}>
                        <CheckCheck size={16} />
                        Mark as Read
                      </button>
                    ) : (
                      <button onClick={() => handleMarkAsUnread(notification._id)}>
                        <Check size={16} />
                        Mark as Unread
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setNotificationToDelete(notification._id);
                        setShowDeleteModal(true);
                      }}
                      className={styles.dangerAction}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete Notification</h3>
            <p>Are you sure you want to delete this notification? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteNotification(notificationToDelete)}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;