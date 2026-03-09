import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@lib/utils/cn';
import { Avatar } from '@components/ui/Avatar';
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
  const otherUserRole = other_user?.role ?? 'unknown';
  const displayName = otherUserRole === 'worker'
    ? other_user?.profile?.full_name || other_user?.username || 'Unknown user'
    : other_user?.profile?.company_name || other_user?.username || 'Unknown user';
  
  const isLastMessageFromMe = last_message?.sender_id === user?.id;
  const isOnline = other_user?.profile?.is_online;
  const lastMessageDate = last_message?.created_at ? new Date(last_message.created_at) : null;
  const lastMessageTimeLabel =
    lastMessageDate && !Number.isNaN(lastMessageDate.getTime())
      ? formatDistanceToNow(lastMessageDate, { addSuffix: true })
      : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 flex items-start gap-3 transition-all duration-200 hover:bg-navy-50',
        isActive && 'bg-navy-50',
        unread_count > 0 && 'bg-navy-50/50'
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={
            otherUserRole === 'worker'
              ? other_user?.profile?.profile_picture
              : other_user?.profile?.logo
          }
          name={
            otherUserRole === 'worker'
              ? other_user?.profile?.full_name
              : other_user?.profile?.company_name
          }
          size="md"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-charcoal truncate">
            {displayName}
          </h4>
          {lastMessageTimeLabel && (
            <span className="text-xs text-muted whitespace-nowrap ml-2">
              {lastMessageTimeLabel}
            </span>
          )}
        </div>

        <p className="text-xs text-muted mb-1">
          {otherUserRole}
        </p>

        {last_message && (
          <div className="flex items-center justify-between">
            <p className={cn(
              'text-sm truncate',
              unread_count > 0
                ? 'font-semibold text-charcoal'
                : 'text-charcoal-500'
            )}>
              {isLastMessageFromMe && <span className="mr-1">You:</span>}
              {last_message.content}
            </p>
            {unread_count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-navy text-white rounded-full">
                {unread_count}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};