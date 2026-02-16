import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckIcon,
  CheckBadgeIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import { Avatar } from '@components/ui/Avatar';
import { Dropdown } from '@components/ui/Dropdown';
import { Message } from '@types';
import { useAuth } from '@context/AuthContext';
import { useMessages } from '@hooks/useMessages';

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

  const messageActions = [
    {
      value: 'react',
      label: 'React',
      icon: <FaceSmileIcon className="w-4 h-4" />,
      onClick: () => setShowEmojiPicker(!showEmojiPicker),
    },
    {
      value: 'delete',
      label: 'Delete',
      icon: <TrashIcon className="w-4 h-4" />,
      onClick: handleDelete,
      className: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div
      className={cn(
        'flex items-start space-x-2',
        isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'
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
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {message.sender?.profile?.full_name || message.sender?.profile?.company_name}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'relative group px-4 py-2 rounded-lg',
            isOwn
              ? 'bg-primary-600 text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
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
                  className="flex items-center space-x-2 text-xs underline"
                >
                  <span>{attachment.file_name}</span>
                  <span className="text-xs opacity-75">
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
                    'inline-flex items-center space-x-1 px-2 py-0.5 text-xs rounded-full',
                    reaction.user_id === user?.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-200 dark:bg-gray-700'
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

          {/* Message Actions */}
          {isOwn && (
            <div className="absolute top-0 right-0 hidden group-hover:flex -translate-y-1/2 translate-x-1/2">
              <Dropdown
                trigger={
                  <button className="p-1 bg-white dark:bg-gray-900 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <EllipsisHorizontalIcon className="w-4 h-4" />
                  </button>
                }
                items={messageActions}
              />
            </div>
          )}
        </div>

        {/* Message Metadata */}
        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{format(new Date(message.created_at), 'h:mm a')}</span>
          {isOwn && (
            <span className="flex items-center">
              {message.is_read ? (
                <>
                  <CheckBadgeIcon className="w-3 h-3 text-green-500" />
                  <span className="ml-1">Read</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-3 h-3" />
                  <span className="ml-1">Sent</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};