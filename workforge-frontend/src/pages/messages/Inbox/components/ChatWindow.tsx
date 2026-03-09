import React, { useEffect, useRef } from 'react';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useMessages } from '@hooks/useMessages';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { MessageList } from './MessageList';
import { UserProfileChip } from './UserProfileChip';

interface ChatWindowUser {
  id: number;
  username: string;
  role: string;
  profile?: {
    full_name?: string;
    company_name?: string;
    profile_picture?: string;
    logo?: string;
  } | null;
}

interface ChatWindowProps {
  conversationId: string;
  otherUserId: number;
  otherUser?: ChatWindowUser;
  isMobile?: boolean;
  onBack?: () => void;
  onNewMessage?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  otherUserId,
  otherUser,
  isMobile = false,
  onBack,
  onNewMessage,
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-200 bg-white">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="icon-btn"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}
          {otherUser ? (
            <UserProfileChip user={otherUser} />
          ) : (
            <div>
              <p className="text-sm font-semibold text-charcoal">
                Conversation
              </p>
            </div>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${
            isUserOnline 
              ? 'bg-green-100 text-green-700' 
              : 'bg-charcoal-100 text-charcoal-500'
          }`}>
            {isUserOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {onNewMessage && (
          <button 
            onClick={onNewMessage} 
            className="btn-ghost flex items-center gap-1 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            New Message
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-charcoal-50">
        <MessageList
          messages={messages}
          conversationId={conversationId}
          otherUserId={otherUserId}
        />
        <div className="px-4 pb-2">
          {typingUsers.length > 0 && <TypingIndicator />}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input Area */}
      <MessageInput
        onSendMessage={handleSend}
        onTyping={handleTyping}
      />
    </div>
  );
};
