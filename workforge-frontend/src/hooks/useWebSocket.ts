import { useEffect, useCallback } from 'react';
import { websocketService } from '@services/websocket.service';
import { authStore } from '@store/auth.store';

export const useWebSocket = () => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      websocketService.connect();
    } else {
      websocketService.disconnect();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    websocketService.sendTyping(conversationId, isTyping);
  }, []);

  const markAsRead = useCallback((conversationId: string, messageId: number) => {
    websocketService.markAsRead(conversationId, messageId);
  }, []);

  const isConnected = useCallback(() => {
    return websocketService.isConnected();
  }, []);

  return {
    sendTyping,
    markAsRead,
    isConnected,
  };
};