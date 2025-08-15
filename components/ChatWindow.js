// components/ChatWindow.js
"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({ conversation, currentUser, userType }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  ("=== ChatWindow Debug ===");
  ("currentUser:", currentUser);
  ("currentUser.id:", currentUser?.id);
  ("userType:", userType);
  ("conversation:", conversation);
  ("========================");

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markAsRead();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversation) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/messages?conversationId=${conversation.id}`
      );
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages);
      } else {
        console.error("Error fetching messages:", data.error);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversation) return;

    try {
      await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          userId: currentUser.id || currentUser._id,
        }),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || sending) return;

    try {
      setSending(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          senderId: currentUser.id || currentUser._id,
          senderType: userType,
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      } else {
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
    return date.toLocaleString();
  };

  if (!conversation) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.noConversation}>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <h3>
            {userType === "buyer"
              ? conversation.seller_name
              : conversation.buyer_name}
          </h3>
          {conversation.product_title && (
            <small>Re: {conversation.product_title}</small>
          )}
        </div>
        <button
          className={styles.refreshBtn}
          onClick={fetchMessages}
          disabled={loading}
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
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageItem} ${
                    message.sender_id === (currentUser.id || currentUser._id)
                      ? styles.ownMessage
                      : styles.otherMessage
                  }`}
                >
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>{message.message}</div>
                    <div className={styles.messageInfo}>
                      <span className={styles.senderName}>
                        {message.sender_id === (currentUser.id || currentUser._id)
                          ? "You"
                          : message.sender_name}
                      </span>
                      <span className={styles.messageTime}>
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
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
            placeholder="Type your message..."
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
