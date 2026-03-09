import React from 'react';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { ConversationItem } from './ConversationItem';
import { EmptyState } from './EmptyState';
import { useConversations } from '@hooks/useConversations';
import { useQuery } from '@tanstack/react-query';
import { messageService } from '@services/message.service';
import { Skeleton } from '@components/ui/Skeleton';

interface ConversationListProps {
  onConversationSelect?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onConversationSelect }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRecipientId, setSelectedRecipientId] = React.useState('');
  const { conversations, activeConversationId, selectConversation, isLoading } = useConversations();
  const { data: recipients = [] } = useQuery({
    queryKey: ['messageable-users'],
    queryFn: () => messageService.getMessageableUsers(),
  });

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.other_user;
    if (!otherUser) {
      return false;
    }

    const name = otherUser.role === 'worker'
      ? otherUser.profile?.full_name
      : otherUser.profile?.company_name;
    const normalizedQuery = searchQuery.toLowerCase();

    return (name?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (otherUser.username?.toLowerCase().includes(normalizedQuery) ?? false);
  });

  const handleStartConversation = () => {
    if (!selectedRecipientId) {
      return;
    }

    const recipientId = Number(selectedRecipientId);
    if (Number.isNaN(recipientId)) {
      return;
    }

    selectConversation(recipientId, recipientId);
    onConversationSelect?.();
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-charcoal-200">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-charcoal-200">
        <h2 className="text-lg font-semibold text-charcoal mb-3">Messages</h2>
        
        {/* New Chat Dropdown */}
        <div className="flex items-center gap-2 mb-3">
          <select
            className="input-field flex-1 text-sm"
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
          >
            <option value="">Start chat with...</option>
            {recipients.map((recipient) => {
              const displayName = recipient.role === 'worker'
                ? recipient.profile?.full_name || recipient.username
                : recipient.role === 'employer'
                  ? recipient.profile?.company_name || recipient.username
                  : recipient.username;

              return (
                <option key={recipient.id} value={recipient.id}>
                  {displayName} ({recipient.role})
                </option>
              );
            })}
          </select>
          <button
            onClick={handleStartConversation}
            disabled={!selectedRecipientId}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-11"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Start messaging employers or workers to see your conversations here."
          />
        ) : (
          <div className="divide-y divide-charcoal-100">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversation_id}
                conversation={conversation}
                isActive={conversation.other_user?.id === Number(activeConversationId)}
                onClick={() => 
                  conversation.other_user && (() => {
                    selectConversation(
                      conversation.other_user.id,
                      conversation.other_user.id
                    );
                    onConversationSelect?.();
                  })()
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};