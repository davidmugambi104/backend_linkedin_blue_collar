import { useState, useCallback, useRef, useEffect } from 'react';
import { messageService } from '@services/message.service';
import { messageStore } from '@store/message.store';
import { useWebSocket } from './useWebSocket';
import { Message } from '@types';
import { useAuth } from '@context/AuthContext';

export const useMessages = (conversationId: string | number, otherUserId: number) => {
  const { user } = useAuth();
  const { sendTyping, markAsRead } = useWebSocket();
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const messages = messageStore((state) => 
    state.messages.get(Number(conversationId)) || []
  );
  
  const typingUsers = messageStore((state) => 
    state.typingUsers.get(Number(conversationId)) || []
  );

  const isUserOnline = messageStore((state) => 
    state.onlineUsers.has(otherUserId)
  );

  // Mark messages as read when conversation is active
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender_id === otherUserId
      );

      unreadMessages.forEach((msg) => {
        markAsRead(String(conversationId), msg.id);
      });

      if (unreadMessages.length > 0) {
        messageService.markAsRead(otherUserId);
        messageStore.getState().resetUnreadCount(Number(conversationId));
      }
    }
  }, [conversationId, messages, otherUserId, markAsRead]);

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        return;
      }

      setIsSending(true);
      try {
        const message = await messageService.sendMessage({
          receiver_id: otherUserId,
          content: content.trim(),
          attachments,
        });

        messageStore.getState().addMessage(Number(conversationId), message);
        return message;
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, otherUserId]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      sendTyping(String(conversationId), isTyping);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(String(conversationId), false);
        }, 3000);
      }
    },
    [conversationId, sendTyping]
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      try {
        await messageService.deleteMessage(messageId);
        messageStore.getState().deleteMessage(Number(conversationId), messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
        throw error;
      }
    },
    [conversationId]
  );

  const addReaction = useCallback(
    async (messageId: number, emoji: string) => {
      try {
        const reaction = await messageService.addReaction(messageId, emoji);
        messageStore.getState().updateMessage(Number(conversationId), messageId, {
          reactions: [...(messages.find((m) => m.id === messageId)?.reactions || []), reaction],
        });
      } catch (error) {
        console.error('Failed to add reaction:', error);
        throw error;
      }
    },
    [conversationId, messages]
  );

  const removeReaction = useCallback(
    async (messageId: number, reactionId: number) => {
      try {
        await messageService.removeReaction(messageId, reactionId);
        const message = messages.find((m) => m.id === messageId);
        
        if (message) {
          messageStore.getState().updateMessage(Number(conversationId), messageId, {
            reactions: message.reactions?.filter((r) => r.id !== reactionId) || [],
          });
        }
      } catch (error) {
        console.error('Failed to remove reaction:', error);
        throw error;
      }
    },
    [conversationId, messages]
  );

  return {
    messages,
    typingUsers,
    isUserOnline,
    isSending,
    sendMessage,
    handleTyping,
    deleteMessage,
    addReaction,
    removeReaction,
  };
};