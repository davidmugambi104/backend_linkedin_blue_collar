/**
 * WebSocket Hook for Real-time Messaging
 * Provides reactive state management for:
 * - Connection status
 * - Messages
 * - Typing indicators
 * - Read receipts
 * - Presence (online/offline)
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import { wsMessageService, TypingPayload, ReadReceiptPayload, PresencePayload } from '@services/ws-message.service';
import { authStore } from '@store/auth.store';

export const useWebSocket = (conversationId?: string) => {
  const { user } = useAuth();
  const token = authStore((state) => state.accessToken);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, boolean>>(new Map());

  // Connection status subscription
  useEffect(() => {
    const subscription = wsMessageService.connectionStatus$.subscribe((status) => {
      setIsConnected(status === 'connected');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Connect when user is authenticated
  useEffect(() => {
    if (token && user) {
      wsMessageService.connect(token, user.id);
    } else {
      wsMessageService.disconnect();
    }
  }, [token, user]);

  useEffect(() => {
    if (!conversationId || !isConnected) {
      return;
    }

    wsMessageService.joinConversation(conversationId);

    return () => {
      wsMessageService.leaveConversation(conversationId);
    };
  }, [conversationId, isConnected]);

  // Messages subscription
  useEffect(() => {
    const subscription = wsMessageService.messages$.subscribe((message) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => subscription.unsubscribe();
  }, [conversationId]);

  // Typing indicators subscription
  useEffect(() => {
    const subscription = wsMessageService.typing$.subscribe((data: TypingPayload) => {
      if (data.conversation_id === conversationId && data.user_id !== user?.id) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.user_id, data.is_typing);
          return newMap;
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [conversationId, user?.id]);

  // Send message
  const sendMessage = useCallback((content: string, receiverId: number) => {
    if (conversationId && user) {
      // Optimistic update
      const tempMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        content,
        sender_id: user.id,
        created_at: Date.now(),
        status: 'sending',
      };
      
      setMessages((prev) => [...prev, tempMessage]);
      
      // Send via WebSocket
      wsMessageService.sendMessage(conversationId, content, receiverId);
    }
  }, [conversationId, user]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (conversationId) {
      wsMessageService.sendTyping(conversationId, isTyping);
    }
  }, [conversationId]);

  // Send read receipt
  const sendReadReceipt = useCallback((messageId: string) => {
    if (conversationId) {
      wsMessageService.sendReadReceipt(messageId, conversationId);
    }
  }, [conversationId]);

  const markAsRead = useCallback((targetConversationId: string, messageId: number | string) => {
    wsMessageService.markAsRead(targetConversationId, String(messageId));
  }, []);

  return {
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    markAsRead,
  };
};

export default useWebSocket;
