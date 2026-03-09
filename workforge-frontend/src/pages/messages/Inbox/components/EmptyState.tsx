import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-charcoal-100 rounded-full flex items-center justify-center mb-4">
        <ChatBubbleLeftRightIcon className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-charcoal mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted max-w-sm">
        {description}
      </p>
    </div>
  );
};