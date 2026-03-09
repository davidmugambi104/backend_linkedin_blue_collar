import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Message } from '@types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  conversationId: string;
  otherUserId: number;
  hasMore?: boolean;
  loadMore?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  conversationId,
  otherUserId,
  hasMore = false,
  loadMore,
}) => {
  return (
    <Virtuoso
      className="h-full px-4"
      data={messages}
      totalCount={messages.length}
      overscan={200}
      followOutput="smooth"
      endReached={() => {
        if (hasMore && loadMore) {
          loadMore();
        }
      }}
      itemContent={(index, message) => {
        const showAvatar =
          index === 0 || messages[index - 1].sender_id !== message.sender_id;

        return (
          <div className="py-3">
            <MessageBubble
              message={message}
              conversationId={conversationId}
              otherUserId={otherUserId}
              showAvatar={showAvatar}
            />
          </div>
        );
      }}
      components={{
        Footer: () => (
          <div className="py-4 text-center">
            <p className="text-xs text-muted">
              {hasMore ? 'Loading more...' : 'End of conversation'}
            </p>
          </div>
        ),
      }}
    />
  );
};
