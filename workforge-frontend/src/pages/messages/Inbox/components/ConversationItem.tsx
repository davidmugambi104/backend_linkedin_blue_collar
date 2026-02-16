import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@lib/utils/cn';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { Conversation } from '@types';
import { useAuth } from '@context/AuthContext';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const { user } = useAuth();
  const { other_user, last_message, unread_count } = conversation;
  
  const isLastMessageFromMe = last_message?.sender_id === user?.id;
  const isOnline = other_user.profile?.is_online;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
        isActive && 'bg-primary-50 dark:bg-primary-900/20',
        unread_count > 0 && 'bg-blue-50/50 dark:bg-blue-900/10'
      )}
    >
      <div className="relative">
        <Avatar
          src={
            other_user.role === 'worker'
              ? other_user.profile?.profile_picture
              : other_user.profile?.logo
          }
          name={
            other_user.role === 'worker'
              ? other_user.profile?.full_name
              : other_user.profile?.company_name
          }
          size="md"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {other_user.role === 'worker'
              ? other_user.profile?.full_name || other_user.username
              : other_user.profile?.company_name || other_user.username}
          </h4>
          {last_message && (
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
              {formatDistanceToNow(new Date(last_message.created_at), { addSuffix: true })}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {other_user.role}
        </p>

        {last_message && (
          <div className="flex items-center justify-between">
            <p className={cn(
              'text-sm truncate',
              unread_count > 0
                ? 'font-semibold text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400'
            )}>
              {isLastMessageFromMe && <span className="mr-1">You:</span>}
              {last_message.content}
            </p>
            {unread_count > 0 && (
              <Badge variant="info" size="sm" className="ml-2">
                {unread_count}
              </Badge>
            )}
          </div>
        )}
      </div>
    </button>
  );
};