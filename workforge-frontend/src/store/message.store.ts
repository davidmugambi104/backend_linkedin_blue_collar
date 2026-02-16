import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Conversation, TypingIndicator, MessageReaction } from '@types';

interface MessageState {
  conversations: Map<number, Conversation>;
  messages: Map<number, Message[]>;
  typingUsers: Map<number, TypingIndicator[]>;
  onlineUsers: Set<number>;
  activeConversationId: string | null;
  unreadCounts: Map<number, number>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversationId: number, conversation: Partial<Conversation>) => void;
  addMessage: (conversationId: number, message: Message) => void;
  addMessages: (conversationId: number, messages: Message[]) => void;
  updateMessage: (
    conversationId: number,
    messageId: number,
    updates: Partial<Message & { reactions?: MessageReaction[] }>
  ) => void;
  deleteMessage: (conversationId: number, messageId: number) => void;
  markMessageAsRead: (conversationId: number, messageId: number) => void;
  markAllAsRead: (conversationId: number) => void;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
  setUserOnline: (userId: number, isOnline: boolean) => void;
  setActiveConversation: (conversationId: string | null) => void;
  incrementUnreadCount: (conversationId: number) => void;
  resetUnreadCount: (conversationId: number) => void;
  clearMessages: (conversationId: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const messageStore = create<MessageState>()(
  persist(
    (set, get) => ({
      conversations: new Map(),
      messages: new Map(),
      typingUsers: new Map(),
      onlineUsers: new Set(),
      activeConversationId: null,
      unreadCounts: new Map(),
      isLoading: false,
      error: null,

      setConversations: (conversations) => {
        const conversationsMap = new Map();
        const unreadCounts = new Map();
        
        conversations.forEach((conv) => {
          conversationsMap.set(conv.id, conv);
          unreadCounts.set(conv.id, conv.unread_count);
        });

        set({
          conversations: conversationsMap,
          unreadCounts,
        });
      },

      updateConversation: (conversationId, updates) => {
        set((state) => {
          const conversations = new Map(state.conversations);
          const existing = conversations.get(conversationId);
          
          if (existing) {
            conversations.set(conversationId, { ...existing, ...updates });
          }

          return { conversations };
        });
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          const messages = new Map(state.messages);
          const conversationMessages = messages.get(conversationId) || [];
          
          // Prevent duplicates
          if (!conversationMessages.some((m) => m.id === message.id)) {
            messages.set(conversationId, [...conversationMessages, message]);
          }

          // Update last message in conversation
          const conversations = new Map(state.conversations);
          const conversation = conversations.get(conversationId);
          
          if (conversation) {
            conversations.set(conversationId, {
              ...conversation,
              last_message: {
                id: message.id,
                content: message.content,
                created_at: message.created_at,
                sender_id: message.sender_id,
                is_read: message.is_read,
                conversation_id: message.conversation_id,
                updated_at: message.updated_at,
              },
            });
          }

          return { messages, conversations };
        });
      },

      addMessages: (conversationId, newMessages) => {
        set((state) => {
          const messages = new Map(state.messages);
          const existingMessages = messages.get(conversationId) || [];
          
          // Merge and sort by date
          const allMessages = [...existingMessages, ...newMessages];
          const uniqueMessages = Array.from(
            new Map(allMessages.map((m) => [m.id, m])).values()
          ).sort(
            (a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          messages.set(conversationId, uniqueMessages);
          return { messages };
        });
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => {
          const messages = new Map(state.messages);
          const conversationMessages = messages.get(conversationId) || [];
          
          const updatedMessages = conversationMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );

          messages.set(conversationId, updatedMessages);
          return { messages };
        });
      },

      deleteMessage: (conversationId, messageId) => {
        set((state) => {
          const messages = new Map(state.messages);
          const conversationMessages = messages.get(conversationId) || [];
          
          messages.set(
            conversationId,
            conversationMessages.filter((msg) => msg.id !== messageId)
          );

          return { messages };
        });
      },

      markMessageAsRead: (conversationId, messageId) => {
        get().updateMessage(conversationId, messageId, { is_read: true });
      },

      markAllAsRead: (conversationId) => {
        set((state) => {
          const messages = new Map(state.messages);
          const conversationMessages = messages.get(conversationId) || [];
          
          const updatedMessages = conversationMessages.map((msg) => ({
            ...msg,
            is_read: true,
          }));

          messages.set(conversationId, updatedMessages);
          
          // Reset unread count
          const unreadCounts = new Map(state.unreadCounts);
          unreadCounts.set(conversationId, 0);

          // Update conversation unread count
          const conversations = new Map(state.conversations);
          const conversation = conversations.get(conversationId);
          
          if (conversation) {
            conversations.set(conversationId, {
              ...conversation,
              unread_count: 0,
            });
          }

          return { messages, unreadCounts, conversations };
        });
      },

      setTyping: (conversationId, userId, isTyping) => {
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          const conversationTyping = typingUsers.get(conversationId) || [];
          
          if (isTyping) {
            if (!conversationTyping.some((t) => t.user_id === userId)) {
              typingUsers.set(conversationId, [
                ...conversationTyping,
                { conversation_id: conversationId, user_id: userId, is_typing: true, updated_at: new Date().toISOString() },
              ]);
            }
          } else {
            typingUsers.set(
              conversationId,
              conversationTyping.filter((t) => t.user_id !== userId)
            );
          }

          return { typingUsers };
        });
      },

      setUserOnline: (userId, isOnline) => {
        set((state) => {
          const onlineUsers = new Set(state.onlineUsers);
          
          if (isOnline) {
            onlineUsers.add(userId);
          } else {
            onlineUsers.delete(userId);
          }

          return { onlineUsers };
        });
      },

      setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
        
        if (conversationId && typeof conversationId === 'string') {
          get().markAllAsRead(parseInt(conversationId, 10));
        }
      },

      incrementUnreadCount: (conversationId) => {
        set((state) => {
          const unreadCounts = new Map(state.unreadCounts);
          const currentCount = unreadCounts.get(conversationId) || 0;
          unreadCounts.set(conversationId, currentCount + 1);
          
          // Update conversation
          const conversations = new Map(state.conversations);
          const conversation = conversations.get(conversationId);
          
          if (conversation) {
            conversations.set(conversationId, {
              ...conversation,
              unread_count: currentCount + 1,
            });
          }

          return { unreadCounts, conversations };
        });
      },

      resetUnreadCount: (conversationId) => {
        set((state) => {
          const unreadCounts = new Map(state.unreadCounts);
          unreadCounts.set(conversationId, 0);
          
          const conversations = new Map(state.conversations);
          const conversation = conversations.get(conversationId);
          
          if (conversation) {
            conversations.set(conversationId, {
              ...conversation,
              unread_count: 0,
            });
          }

          return { unreadCounts, conversations };
        });
      },

      clearMessages: (conversationId) => {
        set((state) => {
          const messages = new Map(state.messages);
          messages.delete(conversationId);
          return { messages };
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'workforge-messages',
      partialize: (state) => ({
        conversations: Array.from(state.conversations.entries()),
        unreadCounts: Array.from(state.unreadCounts.entries()),
      }),
    }
  )
);