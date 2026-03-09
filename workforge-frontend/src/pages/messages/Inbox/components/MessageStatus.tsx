import React from 'react';
import { CheckIcon, CheckBadgeIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Message } from '@types';

interface MessageStatusProps {
  message: Message;
  isOwn: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ message, isOwn }) => {
  if (!isOwn) {
    return null;
  }

  if (message._status === 'sending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <ClockIcon className="h-3 w-3" /> Sending
      </span>
    );
  }

  if (message._status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <ExclamationTriangleIcon className="h-3 w-3" /> Failed
      </span>
    );
  }

  return message.is_read ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <CheckBadgeIcon className="h-3 w-3" /> Read
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <CheckIcon className="h-3 w-3" /> Sent
    </span>
  );
};
