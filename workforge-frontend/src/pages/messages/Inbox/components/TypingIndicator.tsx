import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-charcoal-200 rounded-full shadow-sm w-fit">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce" />
      </div>
      <span className="text-xs text-muted">
        Typing...
      </span>
    </div>
  );
};