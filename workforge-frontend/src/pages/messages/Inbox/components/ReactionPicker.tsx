import React, { useMemo, useState } from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const RECENT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👎'];
const FULL_REACTIONS = ['😀', '😁', '😂', '🤣', '😊', '😍', '🤔', '👏', '🔥', '🎉'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect }) => {
  const [showExpanded, setShowExpanded] = useState(false);
  const visibleReactions = useMemo(
    () => (showExpanded ? FULL_REACTIONS : RECENT_REACTIONS),
    [showExpanded]
  );

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {visibleReactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="rounded px-1.5 py-1 text-sm hover:bg-slate-100"
          type="button"
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setShowExpanded((prev) => !prev)}
        className="rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
      >
        {showExpanded ? '−' : '+'}
      </button>
    </div>
  );
};
