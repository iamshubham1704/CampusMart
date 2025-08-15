"use client"
import { useState, useEffect } from 'react';
import ChatList from '../../../components/ChatList';
import ChatWindow from '../../../components/ChatWindow';
import styles from '../../styles/Messages.module.css';

export default function SellerMessages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const user = await response.json();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  if (!currentUser) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.messagesLayout}>
        <div className={styles.chatListSection}>
          <ChatList
            userType="seller"
            userId={currentUser.id}
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