import  socketIOClient from 'socket.io-client';
import { authStore } from '@store/auth.store';
import { messageStore } from '@store/message.store';
import { WebSocketMessage, Message } from '@types';

type SocketType = ReturnType<typeof socketIOClient>;

class WebSocketService {
  private socket: SocketType | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    const token = authStore.getState().accessToken;
    const userId = authStore.getState().user?.id;

    if (!token || !userId || this.socket?.connected) {
      return;
    }

    this.socket = socketIOClient(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: { token },
      query: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('error', this.handleError.bind(this));
    this.socket.on('reconnect', this.handleReconnect.bind(this));
    this.socket.on('reconnect_error', this.handleReconnectError.bind(this));

    // Message events
    this.socket.on('message:new', this.handleNewMessage.bind(this));
    this.socket.on('message:read', this.handleMessageRead.bind(this));
    this.socket.on('message:deleted', this.handleMessageDeleted.bind(this));

    // Typing events
    this.socket.on('typing:start', this.handleTypingStart.bind(this));
    this.socket.on('typing:stop', this.handleTypingStop.bind(this));

    // User presence
    this.socket.on('user:online', this.handleUserOnline.bind(this));
    this.socket.on('user:offline', this.handleUserOffline.bind(this));
  }

  private handleConnect() {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
  }

  private handleDisconnect(reason: string) {
    console.log('WebSocket disconnected:', reason);
    
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, don't reconnect
      this.socket = null;
    }
  }

  private handleError(error: Error) {
    console.error('WebSocket error:', error);
  }

  private handleReconnect(attemptNumber: number) {
    console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
  }

  private handleReconnectError(error: Error) {
    console.error('WebSocket reconnect error:', error);
    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.disconnect();
    }
  }

  private handleNewMessage(message: { conversation_id: number; data: Message }) {
    messageStore.getState().addMessage(message.conversation_id, message.data);
    messageStore.getState().incrementUnreadCount(message.conversation_id);
  }

  private handleMessageRead(data: { message_id: number; conversation_id: number }) {
    messageStore.getState().markMessageAsRead(data.conversation_id, data.message_id);
  }

  private handleMessageDeleted(data: { message_id: number; conversation_id: number }) {
    messageStore.getState().deleteMessage(data.conversation_id, data.message_id);
  }

  private handleTypingStart(data: { conversation_id: number; user_id: number }) {
    messageStore.getState().setTyping(data.conversation_id, data.user_id, true);
  }

  private handleTypingStop(data: { conversation_id: number; user_id: number }) {
    messageStore.getState().setTyping(data.conversation_id, data.user_id, false);
  }

  private handleUserOnline(userId: number) {
    messageStore.getState().setUserOnline(userId, true);
  }

  private handleUserOffline(userId: number) {
    messageStore.getState().setUserOnline(userId, false);
  }

  // Emit methods
  sendMessage(message: WebSocketMessage) {
    if (this.socket) {
      this.socket.emit('message:send', message);
    }
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  markAsRead(conversationId: string, messageId: number) {
    if (this.socket) {
      this.socket.emit('message:read', { conversationId, messageId });
    }
  }

  addReaction(messageId: number, emoji: string) {
    if (this.socket) {
      this.socket.emit('reaction:add', { messageId, emoji });
    }
  }

  removeReaction(messageId: number, reactionId: number) {
    if (this.socket) {
      this.socket.emit('reaction:remove', { messageId, reactionId });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();