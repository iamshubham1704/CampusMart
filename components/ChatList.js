// components/ChatList.js
"use client"
import { useState, useEffect } from 'react';
import styles from './ChatList.module.css';

export default function ChatList({ userType, userId, onSelectChat, onNewChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, userType]);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // Get token from localStorage
      const token = localStorage.getItem('token');

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/conversations?userType=${userType}&userId=${userId}`, {
        headers
      });

      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations);
      } else {
        console.error('Error fetching conversations:', data.error);

        // Handle authentication errors
        if (response.status === 401) {
          // Redirect to appropriate login page
          const loginPage = userType === 'buyer' ? '/buyer-login' : '/seller-login';
          window.location.href = loginPage;
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (conversation) => {
    onSelectChat(conversation);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={styles.chatList}>
        <div className={styles.header}>
          <h2>Messages</h2>
        </div>
        <div className={styles.loading}>Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className={styles.chatList}>
      <div className={styles.header}>
        <h2>Messages</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={fetchConversations}
            title="Refresh"
          >
            ↻
          </button>
          {userType === 'buyer' && onNewChat && (
            <button
              className={styles.newChatBtn}
              onClick={onNewChat}
              title="Start New Conversation"
            >
              +
            </button>
          )}
        </div>
      </div>

      <div className={styles.conversationsList}>
        {conversations.length === 0 ? (
          <div className={styles.noConversations}>
            <div className={styles.emptyStateIcon}>💬</div>
            <h3>No conversations yet</h3>
            {userType === 'buyer' ? (
              <div>
                <p>Start a conversation by messaging a seller</p>
                <small>Browse products and click "Message Seller" to get started</small>
              </div>
            ) : (
              <div>
                <p>No messages from buyers yet</p>
                <small>Buyers will be able to message you about your listings</small>
              </div>
            )}
          </div>
        ) : (

          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={styles.conversationItem}
              onClick={() => handleChatSelect(conversation)}
            >
              <div className={styles.conversationInfo}>
                <div className={styles.conversationHeader}>
                  <span className={styles.otherUserName}>
                    {userType === 'buyer' ? conversation.seller_name : conversation.buyer_name}
                  </span>
                  <span className={styles.timestamp}>
                    {formatDate(conversation.last_message_at || conversation.created_at)}
                  </span>
                </div>

                {conversation.product_title && (
                  <div className={styles.productInfo}>
                    <small>Re: {conversation.product_title}</small>
                  </div>
                )}

                <div className={styles.lastMessage}>
                  <span className={styles.lastMessageText}>
                    {conversation.last_message || 'No messages yet'}
                  </span>
                  {conversation.unread_count > 0 && (
                    <span className={styles.unreadBadge}>
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}