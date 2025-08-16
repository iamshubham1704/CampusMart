"use client"
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatList from '../../../components/ChatList';
import ChatWindow from '../../../components/ChatWindow';
import styles from '../../styles/Messages.module.css';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SellerMessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Auto-select conversation if chatId is provided in URL
  useEffect(() => {
    if (chatId && currentUser) {
      fetchSpecificConversation(chatId);
    }
  }, [chatId, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      // Try multiple token sources for seller
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('sellerToken') || 
                   localStorage.getItem('auth-token');
      
      if (!token) {
        console.log('No token found, redirecting to seller login');
        window.location.href = '/seller-login';
        return;
      }

      // First try the seller profile endpoint
      let response = await fetch('/api/seller/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // If seller profile doesn't exist, try the general user profile
      if (!response.ok && response.status === 404) {
        response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Clear all possible token variations
          localStorage.removeItem('token');
          localStorage.removeItem('sellerToken');
          localStorage.removeItem('auth-token');
          window.location.href = '/seller-login';
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      console.log('Seller profile data:', data);
      
      // Handle different response structures
      const userData = data.data || data.seller || data;
      setCurrentUser(userData);
      
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Redirect to login if there's an error
      window.location.href = '/seller-login';
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('sellerToken') || 
                   localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/conversations?userType=seller&userId=${currentUser._id || currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const conversation = data.conversations.find(conv => 
          (conv.id === conversationId || conv._id === conversationId)
        );
        
        if (conversation) {
          setSelectedConversation(conversation);
        }
      }
    } catch (error) {
      console.error('Error fetching specific conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.messagesContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.messagesContainer}>
        <div className={styles.error}>Please log in to view messages.</div>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.messagesLayout}>
        <div className={styles.chatListSection}>
          <ChatList
            userType="seller"
            userId={currentUser._id || currentUser.id}
            onSelectChat={setSelectedConversation}
          />
        </div>
        <div className={styles.chatWindowSection}>
          <ChatWindow
            conversation={selectedConversation}
            currentUser={currentUser}
            userType="seller"
          />
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function MessagesLoading() {
  return (
    <div className={styles.messagesContainer}>
      <div className={styles.loading}>Loading messages...</div>
    </div>
  );
}

// Main component that wraps the content in Suspense
export default function SellerMessages() {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <SellerMessagesContent />
    </Suspense>
  );
}