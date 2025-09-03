// === ChatWindow.tsx - Real-time Chat Component ===
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatService, { ChatMessage, ChatUser } from '../../services/ChatService';
import { useSafeAuth } from '../../SafeAuthContext';
import './ChatWindow.css';

interface ChatWindowProps {
  roomId?: string;
  height?: string;
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  roomId = 'global_chat', 
  height = '400px',
  className = '' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state } = useSafeAuth();
  const { user } = state;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket connection and event handlers
  useEffect(() => {
    if (!user || !state.isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping chat connection');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found');
      setConnectionError('Authentication required');
      return;
    }

    console.log('🔌 Initializing chat connection for user:', user.username);

    // Connect to WebSocket
    try {
      ChatService.connect(token, user.id.toString(), user.username);
    } catch (error) {
      console.error('❌ Failed to initialize chat connection:', error);
      setConnectionError('Failed to connect to chat server');
    }

    // Event listeners
    const handleAuthenticated = (data: ChatUser) => {
      console.log('✅ Chat authenticated:', data);
      setIsConnected(true);
      setConnectionError(null);
      // Join the specified room after authentication
      ChatService.joinRoom(roomId);
    };

    const handleAuthenticationFailed = (error: any) => {
      console.error('❌ Chat authentication failed:', error);
      setConnectionError('Authentication failed');
      setIsConnected(false);
    };

    const handleMessage = (message: ChatMessage) => {
      console.log('📨 Received message:', message);
      setMessages(prev => {
        // Prevent duplicate messages
        const isDuplicate = prev.some(msg => 
          msg.id === message.id || 
          (msg.message === message.message && msg.timestamp === message.timestamp && msg.user_id === message.user_id)
        );
        
        if (isDuplicate) {
          return prev;
        }
        
        return [...prev, message];
      });
    };

    const handleConnectionError = (error: any) => {
      console.error('❌ WebSocket connection error:', error);
      setConnectionError('Connection failed');
      setIsConnected(false);
    };

    const handleDisconnected = (reason: string) => {
      console.warn('⚠️ Disconnected from chat:', reason);
      setIsConnected(false);
      setConnectionError('Disconnected from server');
    };

    const handleUserJoined = (data: any) => {
      console.log('👤 User joined:', data);
      // Could update online users list here
    };

    const handleUserLeft = (data: any) => {
      console.log('👋 User left:', data);
      // Could update online users list here
    };

    const handleRoomJoined = (data: any) => {
      console.log('🏠 Joined room:', data);
      // Could load recent messages here
    };

    const handleError = (error: any) => {
      console.error('❌ Chat error:', error);
      setConnectionError(error.message || 'An error occurred');
    };

    // Register event listeners
    ChatService.on('authenticated', handleAuthenticated);
    ChatService.on('authentication_failed', handleAuthenticationFailed);
    ChatService.on('message', handleMessage);
    ChatService.on('connection_error', handleConnectionError);
    ChatService.on('disconnected', handleDisconnected);
    ChatService.on('user_joined', handleUserJoined);
    ChatService.on('user_left', handleUserLeft);
    ChatService.on('room_joined', handleRoomJoined);
    ChatService.on('error', handleError);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up chat connection');
      ChatService.off('authenticated', handleAuthenticated);
      ChatService.off('authentication_failed', handleAuthenticationFailed);
      ChatService.off('message', handleMessage);
      ChatService.off('connection_error', handleConnectionError);
      ChatService.off('disconnected', handleDisconnected);
      ChatService.off('user_joined', handleUserJoined);
      ChatService.off('user_left', handleUserLeft);
      ChatService.off('room_joined', handleRoomJoined);
      ChatService.off('error', handleError);
      ChatService.disconnect();
    };
  }, [user, state.isAuthenticated, roomId]);

  // Handle sending messages
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const messageText = newMessage.trim();
    if (!messageText || !isConnected) {
      return;
    }

    console.log('📤 Sending message:', messageText);
    ChatService.sendMessage(messageText, roomId);
    setNewMessage('');
  }, [newMessage, isConnected, roomId]);

  // Handle reconnection
  const handleReconnect = useCallback(() => {
    if (!user) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setConnectionError('Authentication required');
      return;
    }

    console.log('🔄 Attempting to reconnect...');
    setConnectionError(null);
    ChatService.reconnect(token, user.id.toString(), user.username);
  }, [user]);

  // Render loading state
  if (!user || !state.isAuthenticated) {
    return (
      <div className={`chat-window ${className}`} style={{ height }}>
        <div className="chat-login-prompt">
          <p>Please log in to use chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-window ${className}`} style={{ height }}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <h3>Global Chat</h3>
          <span className="room-info">Room: {roomId}</span>
        </div>
        <div className="chat-status">
          <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {!isConnected && (
            <button onClick={handleReconnect} className="reconnect-btn">
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="connection-error">
          <span>⚠️ {connectionError}</span>
          <button onClick={handleReconnect} className="retry-btn">
            Retry
          </button>
        </div>
      )}
      
      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id || `${msg.timestamp}-${index}`} 
              className={`message ${msg.user_id === user.id ? 'own-message' : 'other-message'}`}
            >
              <div className="message-header">
                <span className="username">{msg.username}</span>
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="message-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="message-input"
            maxLength={500}
          />
          <button 
            type="submit" 
            disabled={!isConnected || !newMessage.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
        <div className="input-info">
          <span className="char-counter">
            {newMessage.length}/500
          </span>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;