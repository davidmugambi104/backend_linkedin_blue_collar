import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" />
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
        Typing...
      </span>
    </div>
  );
};