/**
 * Real-time Socket.IO Message Service
 */
import { BehaviorSubject, Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';

export interface WSMessage {
  id: string;
  type: 'message' | 'typing' | 'read' | 'delivered' | 'online' | 'offline' | 'pong';
  payload: any;
  timestamp: number;
}

export interface TypingPayload {
  conversation_id: string;
  user_id: number;
  is_typing: boolean;
}

export interface ReadReceiptPayload {
  message_id: string;
  conversation_id: string;
  read_at: number;
}

export interface PresencePayload {
  user_id: number;
  status: 'online' | 'offline';
  last_seen?: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private messageQueue: WSMessage[] = [];
  private authToken: string | null = null;
  private userId: number | null = null;

  // RxJS subjects for reactive updates
  public messages$ = new Subject<any>();
  public typing$ = new Subject<TypingPayload>();
  public readReceipts$ = new Subject<ReadReceiptPayload>();
  public presence$ = new Subject<PresencePayload>();
  public connectionStatus$ = new BehaviorSubject<'connecting' | 'connected' | 'disconnected'>('disconnected');

  /**
   * Initialize Socket.IO connection with JWT authentication
   */
  connect(token: string, userId: number): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    if (this.socket) {
      return;
    }

    this.authToken = token;
    this.userId = userId;
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

    try {
      this.connectionStatus$.next('connecting');
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });
      this.setupEventHandlers();
    } catch (error) {
      console.error('Socket connection failed:', error);
      this.connectionStatus$.next('disconnected');
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectionStatus$.next('connected');
      this.reconnectAttempts = 0;

      this.socket?.emit('authenticate', {
        token: this.authToken,
        user_id: this.userId,
      });

      this.startHeartbeat();
      this.flushMessageQueue();
    });

    this.socket.on('receive_message', (payload) => {
      this.messages$.next(payload);
      if (payload?.id) {
        this.sendDeliveryReceipt(String(payload.id));
      }
    });

    this.socket.on('new_message', (payload) => {
      this.messages$.next(payload);
    });

    this.socket.on('user_typing', (payload) => {
      this.typing$.next({
        conversation_id: payload.conversation_id,
        user_id: payload.user_id,
        is_typing: payload.is_typing,
      });
    });

    this.socket.on('read_receipt', (payload) => {
      this.readReceipts$.next({
        message_id: String(payload.message_ids?.[0] ?? ''),
        conversation_id: payload.conversation_id,
        read_at: new Date(payload.read_at).getTime(),
      });
    });

    this.socket.on('user_online', (payload) => {
      this.presence$.next({ user_id: payload.user_id, status: 'online' });
    });

    this.socket.on('user_offline', (payload) => {
      this.presence$.next({ user_id: payload.user_id, status: 'offline' });
    });

    this.socket.on('pong', () => {
      this.handleMessage({ id: this.generateMessageId(), type: 'pong', payload: {}, timestamp: Date.now() });
    });

    this.socket.on('message_delivered', (payload) => {
      this.handleMessage({ id: this.generateMessageId(), type: 'delivered', payload, timestamp: Date.now() });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionStatus$.next('disconnected');
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private handleMessage(data: WSMessage): void {
    switch (data.type) {
      case 'message':
        this.messages$.next(data.payload);
        // Send delivery acknowledgment
        this.sendDeliveryReceipt(data.payload.id);
        break;
      case 'typing':
        this.typing$.next(data.payload);
        break;
      case 'read':
        this.readReceipts$.next(data.payload);
        break;
      case 'online':
      case 'offline':
        this.presence$.next(data.payload);
        break;
      case 'pong':
        // Heartbeat response - connection is alive
        break;
    }
  }

  /**
   * Send a message through WebSocket
   */
  sendMessage(conversationId: string, content: string, receiverId: number): void {
    const payload = {
      sender_id: this.userId,
      receiver_id: receiverId,
      content,
      conversation_id: conversationId,
      message_id: this.generateMessageId(),
    };

    const message: WSMessage = {
      id: this.generateMessageId(),
      type: 'message',
      payload,
      timestamp: Date.now(),
    };

    if (this.socket?.connected) {
      this.socket.emit('send_message', payload);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    const typing: WSMessage = {
      id: this.generateMessageId(),
      type: 'typing',
      payload: {
        conversation_id: conversationId,
        is_typing: isTyping,
      },
      timestamp: Date.now(),
    };

    if (this.socket?.connected) {
      this.socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
        conversation_id: conversationId,
        user_id: this.userId,
      });
    }
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(messageId: string, conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', {
        conversation_id: conversationId,
        user_id: this.userId,
        message_ids: [messageId],
      });
    }
  }

  markAsRead(conversationId: string, messageId: string): void {
    this.sendReadReceipt(messageId, conversationId);
  }

  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', {
        conversation_id: conversationId,
        user_id: this.userId,
      });
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversation_id: conversationId });
    }
  }

  /**
   * Send delivery confirmation
   */
  private sendDeliveryReceipt(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('delivery_receipt', {
        message_id: messageId,
      });
    }
  }

  /**
   * Heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.authToken && this.userId) {
        this.connect(this.authToken, this.userId);
      }
    }, delay);
  }

  /**
   * Flush queued messages when connection is restored
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.socket?.connected) {
        this.socket.emit('send_message', message.payload);
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus$.next('disconnected');
  }

  reconnect(): void {
    if (!this.authToken || !this.userId) {
      return;
    }

    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect(this.authToken, this.userId);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const wsMessageService = new WebSocketService();
