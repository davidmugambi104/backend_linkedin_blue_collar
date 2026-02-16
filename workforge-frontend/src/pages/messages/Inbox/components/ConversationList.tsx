import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input } from '@components/ui/Input';
import { Skeleton } from '@components/ui/Skeleton';
import { ConversationItem } from './ConversationItem';
import { EmptyState } from './EmptyState';
import { useConversations } from '@hooks/useConversations';

export const ConversationList: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { conversations, activeConversationId, selectConversation, isLoading } = useConversations();

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.other_user;
    const name = otherUser.role === 'worker'
      ? otherUser.profile?.full_name
      : otherUser.profile?.company_name;
    
    return name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
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
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
          fullWidth
        />
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Start messaging employers or workers to see your conversations here."
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversation_id}
                conversation={conversation}
                isActive={conversation.conversation_id === activeConversationId}
                onClick={() => 
                  selectConversation(
                    conversation.conversation_id,
                    conversation.other_user.id
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};