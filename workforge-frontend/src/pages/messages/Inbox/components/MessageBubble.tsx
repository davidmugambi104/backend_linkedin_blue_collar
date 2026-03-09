import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  EllipsisHorizontalIcon,
  TrashIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import { Avatar } from '@components/ui/Avatar';
import { Message } from '@types';
import { useAuth } from '@context/AuthContext';
import { useMessages } from '@hooks/useMessages';
import { ReactionPicker } from './ReactionPicker';
import { MessageStatus } from './MessageStatus';

interface MessageBubbleProps {
  message: Message;
  conversationId: string;
  otherUserId: number;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  conversationId,
  otherUserId,
  showAvatar = true,
}) => {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;
  const { deleteMessage, addReaction, removeReaction } = useMessages(conversationId, otherUserId);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      await deleteMessage(message.id);
    }
  };

  const handleReaction = async (emoji: string) => {
    const existingReaction = message.reactions?.find(
      (r) => r.user_id === user?.id && r.emoji === emoji
    );

    if (existingReaction) {
      await removeReaction(message.id, existingReaction.id);
    } else {
      await addReaction(message.id, emoji);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar
          src={message.sender?.profile?.profile_picture || message.sender?.profile?.logo}
          name={message.sender?.profile?.full_name || message.sender?.profile?.company_name}
          size="sm"
          className="flex-shrink-0"
        />
      )}
      
      {isOwn && <div className="w-8" />}

      {/* Message Content */}
      <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender Name */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted mb-1">
            {message.sender?.profile?.full_name || message.sender?.profile?.company_name}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'relative group px-4 py-3 rounded-2xl',
            isOwn
              ? 'bg-navy-700 text-white rounded-br-md'
              : 'bg-white border border-charcoal-200 text-charcoal rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-2 text-xs underline',
                    isOwn ? 'text-navy-200' : 'text-navy'
                  )}
                >
                  <span>{attachment.file_name}</span>
                  <span className="opacity-75">
                    ({(attachment.file_size / 1024).toFixed(1)} KB)
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.id}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-colors',
                    reaction.user_id === user?.id
                      ? 'bg-navy-100 text-navy-700'
                      : isOwn ? 'bg-navy-600 text-white' : 'bg-charcoal-100 text-charcoal-600'
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span>
                    {message.reactions?.filter((r) => r.emoji === reaction.emoji).length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {showEmojiPicker && (
            <div className="mt-2">
              <ReactionPicker
                onSelect={(emoji) => {
                  handleReaction(emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Message Actions Menu */}
        <div className={cn(
          'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isOwn ? 'flex-row-reverse' : 'flex-row'
        )}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 rounded-full hover:bg-charcoal-100 transition-colors"
          >
            <FaceSmileIcon className="w-4 h-4 text-muted" />
          </button>
          {isOwn && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>

        {/* Message Metadata */}
        <div className={cn('flex items-center gap-2 mt-1 text-xs text-muted')}>
          <span>{format(new Date(message.created_at), 'h:mm a')}</span>
          <MessageStatus message={message} isOwn={isOwn} />
        </div>
      </div>
    </div>
  );
};