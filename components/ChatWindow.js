// components/ChatWindow.js
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({ conversation, currentUser, userType }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const autoRefreshRef = useRef(null);

  console.log("=== ChatWindow Debug ===");
  console.log("currentUser:", currentUser);
  console.log("currentUser.id:", currentUser?.id);
  console.log("currentUser._id:", currentUser?._id);
  console.log("userType:", userType);
  console.log("conversation:", conversation);
  console.log("========================");

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markAsRead();
      
      // Set up auto-refresh for messages every 5 seconds
      autoRefreshRef.current = setInterval(() => {
        fetchMessages(false); // false = don't show loading
      }, 5000);
    }

    // Cleanup interval when conversation changes or component unmounts
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUserId = useCallback(() => {
    return currentUser?.id || currentUser?._id || currentUser?.sellerId || currentUser?.buyerId;
  }, [currentUser]);

  const fetchMessages = async (showLoading = true) => {
    if (!conversation) return;

    try {
      if (showLoading) {
        setLoading(true);
      }

      console.log("Fetching messages for conversation:", conversation.id || conversation._id);

      const response = await fetch(
        `/api/messages?conversationId=${conversation.id || conversation._id}`
      );
      const data = await response.json();

      if (response.ok) {
        console.log("Messages fetched:", data.messages);
        setMessages(data.messages);
        
        // Mark as read after fetching new messages
        if (!showLoading) { // Only auto-mark as read during auto-refresh
          markAsRead();
        }
      } else {
        console.error("Error fetching messages:", data.error);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const markAsRead = async () => {
    if (!conversation) return;

    const userId = getCurrentUserId();
    if (!userId) {
      console.error("No user ID found for marking messages as read");
      return;
    }

    try {
      const response = await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.id || conversation._id,
          userId: userId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Error marking messages as read:", data.error);
      } else {
        console.log("Messages marked as read:", data);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || sending) return;

    const userId = getCurrentUserId();
    if (!userId) {
      alert("Error: Unable to identify current user. Please refresh and try again.");
      return;
    }

    try {
      setSending(true);
      
      console.log("Sending message:", {
        conversationId: conversation.id || conversation._id,
        senderId: userId,
        senderType: userType,
        message: newMessage.trim(),
      });

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.id || conversation._id,
          senderId: userId,
          senderType: userType,
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Message sent successfully:", data.message);
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      } else {
        console.error("Error sending message:", data);
        alert("Error sending message: " + data.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherPartyName = () => {
    if (userType === "buyer") {
      return conversation.seller_name || "Seller";
    } else {
      return conversation.buyer_name || "Buyer";
    }
  };

  if (!conversation) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.noConversation}>
          <div className={styles.emptyStateIcon}>💬</div>
          <h3>Select a conversation to start messaging</h3>
          <p>Choose a conversation from the list to view and send messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <h3>{getOtherPartyName()}</h3>
          {conversation.product_title && (
            <small>Re: {conversation.product_title}</small>
          )}
          <div className={styles.userType}>
            <span className={styles.userTypeBadge}>
              You are: {userType}
            </span>
          </div>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => fetchMessages(true)}
          disabled={loading}
          title="Refresh messages"
        >
          {loading ? "⟳" : "↻"}
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {loading && messages.length === 0 ? (
          <div className={styles.loading}>Loading messages...</div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className={styles.noMessages}>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === getCurrentUserId();
                
                return (
                  <div
                    key={message.id || message._id}
                    className={`${styles.messageItem} ${
                      isOwnMessage ? styles.ownMessage : styles.otherMessage
                    }`}
                  >
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>{message.message}</div>
                      <div className={styles.messageInfo}>
                        <span className={styles.senderName}>
                          {isOwnMessage ? "You" : (message.sender_name || getOtherPartyName())}
                        </span>
                        <span className={styles.messageTime}>
                          {formatMessageTime(message.created_at)}
                        </span>
                        {message.read_at && isOwnMessage && (
                          <span className={styles.readStatus} title="Message read">
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className={styles.messageForm} onSubmit={sendMessage}>
        <div className={styles.messageInputContainer}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type your message to ${getOtherPartyName()}...`}
            className={styles.messageInput}
            rows="3"
            disabled={sending}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}