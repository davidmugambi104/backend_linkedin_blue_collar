import React, { useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@components/ui/Button';
import { useMessages } from '@hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  conversationId: string;
  otherUserId: number;
  isMobile?: boolean;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  otherUserId,
  isMobile = false,
  onBack,
}) => {
  const {
    messages,
    typingUsers,
    isUserOnline,
    sendMessage,
    handleTyping,
  } = useMessages(conversationId, otherUserId);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  const handleSend = async (content: string, attachments?: File[]) => {
    await sendMessage(content, attachments);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Conversation
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const showAvatar =
            index === 0 || messages[index - 1].sender_id !== message.sender_id;
          return (
            <MessageBubble
              key={message.id}
              message={message}
              conversationId={conversationId}
              otherUserId={otherUserId}
              showAvatar={showAvatar}
            />
          );
        })}
        {typingUsers.length > 0 && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <MessageInput
        onSendMessage={handleSend}
        onTyping={handleTyping}
      />
    </div>
  );
};
