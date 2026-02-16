import React, { useEffect, useState } from 'react';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { EmptyState } from './components/EmptyState';
import { useConversations } from '@hooks/useConversations';
import { messageService } from '@services/message.service';
import { useAuth } from '@context/AuthContext';

export const InboxPage: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [showChat, setShowChat] = useState(false);
  const { activeConversationId, selectConversation } = useConversations();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch unread count on mount and periodically
    const fetchUnreadCount = async () => {
      try {
        const { unread_count } = await messageService.getUnreadCount();
        // Update document title with unread count
        document.title = unread_count > 0 
          ? `(${unread_count}) WorkForge - Messages`
          : 'WorkForge - Messages';
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const activeConversation = useConversations().conversations.find(
    (c) => c.conversation_id === activeConversationId
  );

  const handleBackToList = () => {
    setShowChat(false);
  };

  const handleSelectConversation = (conversationId: string, otherUserId: number) => {
    selectConversation(conversationId, otherUserId);
    if (!isDesktop) {
      setShowChat(true);
    }
  };

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="h-[calc(100vh-4rem)] flex bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Conversation List */}
        <div className="w-96 border-r border-gray-200 dark:border-gray-800">
          <ConversationList />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {activeConversationId ? (
            <ChatWindow
              conversationId={activeConversationId}
              otherUserId={activeConversation?.other_user.id!}
            />
          ) : (
            <EmptyState
              title="Welcome to your inbox"
              description="Select a conversation to start messaging or browse jobs/workers to connect with others."
            />
          )}
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {!showChat ? (
        <ConversationList />
      ) : (
        activeConversationId && (
          <ChatWindow
            conversationId={activeConversationId}
            otherUserId={activeConversation?.other_user.id!}
            onBack={handleBackToList}
            isMobile
          />
        )
      )}
    </div>
  );
};

export default InboxPage;