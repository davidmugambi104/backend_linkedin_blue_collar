import React, { useEffect, useState } from 'react';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { EmptyState } from './components/EmptyState';
import { MessagesErrorBoundary } from './components/MessagesErrorBoundary';
import { useConversations } from '@hooks/useConversations';
import { wsMessageService } from '@services/ws-message.service';
import { useAuth } from '@context/AuthContext';
import { AIAssistant } from '@components/AIAssistant';

export const InboxPage: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();
  const {
    activeConversationId,
    selectConversation,
    clearActiveConversation,
    conversations,
  } = useConversations();

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = wsMessageService.connectionStatus$.subscribe((status) => {
      if (status !== 'connected') {
        return;
      }

      const totalUnread = conversations.reduce((sum, conversation) => sum + (conversation.unread_count || 0), 0);
      document.title = totalUnread > 0
        ? `(${totalUnread}) WorkForge - Messages`
        : 'WorkForge - Messages';
    });

    const unreadSubscription = wsMessageService.messages$.subscribe((payload: any) => {
      if (!payload) {
        return;
      }

      const isIncoming = payload.receiver_id === user.id;
      if (!isIncoming) {
        return;
      }

      const totalUnread = conversations.reduce((sum, conversation) => sum + (conversation.unread_count || 0), 0) + 1;
      document.title = totalUnread > 0
        ? `(${totalUnread}) WorkForge - Messages`
        : 'WorkForge - Messages';
    });

    return () => {
      subscription.unsubscribe();
      unreadSubscription.unsubscribe();
    };
  }, [user, conversations]);

  const activeConversation = conversations.find(
    (c) => c.other_user?.id === Number(activeConversationId)
  );
  const numericActiveConversationId = Number(activeConversationId);
  const activeOtherUserId = activeConversation?.other_user?.id ||
    (Number.isNaN(numericActiveConversationId) ? undefined : numericActiveConversationId);

  const handleBackToList = () => {
    setShowChat(false);
  };

  const handleNewMessage = () => {
    clearActiveConversation();
    setShowChat(false);
  };

  return (
    <>
      <MessagesErrorBoundary>
        {/* Desktop Layout */}
        {isDesktop ? (
          <div className="employer-content h-[calc(100vh-4rem)] flex rounded-xl overflow-hidden border border-charcoal-200">
            {/* Conversation List */}
            <div className="w-96 border-r border-charcoal-200 bg-white rounded-l-xl">
              <ConversationList onConversationSelect={() => setShowChat(true)} />
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-white rounded-r-xl">
              {activeConversationId && activeOtherUserId ? (
                <ChatWindow
                  conversationId={activeConversationId}
                  otherUserId={activeOtherUserId}
                  otherUser={activeConversation?.other_user}
                  onNewMessage={handleNewMessage}
                />
              ) : (
                <EmptyState
                  title="Welcome to your inbox"
                  description="Select a conversation to start messaging or browse jobs/workers to connect with others."
                />
              )}
            </div>
          </div>
        ) : (
          /* Mobile Layout */
          <div className="h-[calc(100vh-4rem)] bg-white">
            {!showChat ? (
              <ConversationList onConversationSelect={() => setShowChat(true)} />
            ) : (
              activeConversationId && activeOtherUserId && (
                <ChatWindow
                  conversationId={activeConversationId}
                  otherUserId={activeOtherUserId}
                  otherUser={activeConversation?.other_user}
                  onBack={handleBackToList}
                  onNewMessage={handleNewMessage}
                  isMobile
                />
              )
            )}
          </div>
        )}
      </MessagesErrorBoundary>
      <AIAssistant conversationContext={activeConversationId || undefined} />
    </>
  );
};

export default InboxPage;