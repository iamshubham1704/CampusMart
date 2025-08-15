"use client"
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatList from '../../../components/ChatList';
import ChatWindow from '../../../components/ChatWindow';
import styles from '../../styles/Messages.module.css';

export default function BuyerMessages() {
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
      // Find and select the conversation with the given chatId
      fetchSpecificConversation(chatId);
    }
  }, [chatId, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/buyer-login';
        return;
      }

      const response = await fetch('/api/buyer/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('buyerToken');
          localStorage.removeItem('token');
          window.location.href = '/buyer-login';
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setCurrentUser(data.data || data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Redirect to login if there's an error
      window.location.href = '/buyer-login';
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('token');
      
      const response = await fetch(`/api/conversations?userType=buyer&userId=${currentUser._id || currentUser.id}`, {
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
            userType="buyer"
            userId={currentUser._id || currentUser.id}
            onSelectChat={setSelectedConversation}
          />
        </div>
        <div className={styles.chatWindowSection}>
          <ChatWindow
            conversation={selectedConversation}
            currentUser={currentUser}
            userType="buyer"
          />
        </div>
      </div>
    </div>
  );
}