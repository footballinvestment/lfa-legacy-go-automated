// === ChatService.ts - WebSocket Real-time Chat Service ===
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import config from '../config/environment';

interface ChatMessage {
  id?: string;
  message: string;
  username: string;
  user_id: string;
  room: string;
  timestamp: string;
}

interface ChatUser {
  id: string;
  username: string;
}

interface AuthenticateData {
  token: string;
  user_id: string;
}

class ChatService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private currentUser: ChatUser | null = null;
  private eventListeners: Record<string, Function[]> = {};

  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentUser = null;
    this.eventListeners = {};
  }

  connect(token: string, userId: string, username?: string): Socket {
    // Socket.IO uses HTTP protocol, not WebSocket protocol directly
    const apiUrl = config.API_URL;
    
    console.log('🔌 Connecting to Socket.IO server:', apiUrl);
    console.log('👤 User data:', { userId, username });

    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      auth: {
        token: token,
        user_id: userId,
        username: username
      }
    });

    this.setupEventListeners();
    
    // Enhanced authentication with user data
    this.socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      this.authenticate(token, userId, username);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection failed:', error);
      this.triggerEvent('connection_error', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.triggerEvent('disconnected', reason);
    });

    return this.socket;
  }

  private authenticate(token: string, userId: string, username?: string): void {
    if (!this.socket) return;
    
    console.log('🔐 Authenticating user:', userId, username);
    
    this.socket.emit('authenticate', {
      token: token,
      user_id: userId,
      username: username
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('authenticated', (data: ChatUser) => {
      console.log('✅ Chat authenticated:', data);
      this.isConnected = true;
      this.currentUser = data;
      this.triggerEvent('authenticated', data);
    });

    this.socket.on('authentication_failed', (error: any) => {
      console.error('❌ Authentication failed:', error);
      this.triggerEvent('authentication_failed', error);
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      console.log('💬 New message received:', message);
      this.triggerEvent('message', message);
    });

    this.socket.on('user_joined', (data: any) => {
      console.log('👤 User joined:', data);
      this.triggerEvent('user_joined', data);
    });

    this.socket.on('user_left', (data: any) => {
      console.log('👋 User left:', data);
      this.triggerEvent('user_left', data);
    });

    this.socket.on('room_joined', (data: any) => {
      console.log('🏠 Joined room:', data);
      this.triggerEvent('room_joined', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Chat error:', error);
      this.triggerEvent('error', error);
    });

    // Server status events
    this.socket.on('server_message', (data: any) => {
      console.log('📢 Server message:', data);
      this.triggerEvent('server_message', data);
    });
  }

  sendMessage(message: string, room: string = 'global_chat'): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Cannot send message: not connected');
      this.triggerEvent('error', { message: 'Not connected to chat server' });
      return;
    }

    if (!message.trim()) {
      console.warn('⚠️ Cannot send empty message');
      return;
    }

    console.log('📤 Sending message:', { message, room });
    this.socket.emit('send_message', {
      message: message.trim(),
      room: room,
      username: this.currentUser?.username || 'Anonymous'
    });
  }

  joinRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Cannot join room: not connected');
      return;
    }

    console.log('🏠 Joining room:', roomId);
    this.socket.emit('join_room', { room: roomId });
  }

  leaveRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Cannot leave room: not connected');
      return;
    }

    console.log('🚪 Leaving room:', roomId);
    this.socket.emit('leave_room', { room: roomId });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.eventListeners[event]) return;
    
    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    } else {
      this.eventListeners[event] = [];
    }
  }

  private triggerEvent(event: string, data?: any): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Connection status
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getCurrentUser(): ChatUser | null {
    return this.currentUser;
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from chat server');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.currentUser = null;
    this.eventListeners = {};
  }

  // Reconnect
  reconnect(token: string, userId: string, username?: string): void {
    console.log('🔄 Reconnecting to chat server');
    this.disconnect();
    setTimeout(() => {
      this.connect(token, userId, username);
    }, 1000);
  }
}

// Export singleton instance
export default new ChatService();
export type { ChatMessage, ChatUser };