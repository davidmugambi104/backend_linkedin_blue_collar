import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@services/message.service';
import { messageStore } from '@store/message.store';
import { useWebSocket } from './useWebSocket';

export const useConversations = () => {
  const queryClient = useQueryClient();
  const { markAsRead } = useWebSocket();
  
  const {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversation,
  } = messageStore();

  // Fetch conversations
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageService.getConversations(),
  });

  useEffect(() => {
    if (data) {
      setConversations(data);
    }
  }, [data, setConversations]);

  // Fetch specific conversation messages
  const fetchConversation = async (conversationId: string | number, otherUserId: number) => {
    const messages = await messageService.getConversation(otherUserId);
    messageStore.getState().addMessages(Number(conversationId), messages);
    
    // Mark as read
    await messageService.markAsRead(otherUserId);
    messageStore.getState().resetUnreadCount(conversationId as any);
    
    return messages;
  };

  const selectConversation = (conversationId: string | number, otherUserId: number) => {
    setActiveConversation(conversationId as any);
    fetchConversation(conversationId, otherUserId);
  };

  const refreshConversations = () => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  return {
    conversations: Array.from(conversations.values()),
    activeConversationId,
    isLoading,
    error,
    selectConversation,
    refreshConversations,
    fetchConversation,
  };
};