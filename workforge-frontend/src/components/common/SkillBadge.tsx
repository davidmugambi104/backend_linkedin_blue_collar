import React from 'react';

interface SkillBadgeProps {
  skill: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  onRemove?: () => void;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, level, onRemove }) => {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium bg-bg-blue-900 bg-text-blue-200">
      {skill}
      {level && <span className="ml-1 text-xs opacity-75">({level})</span>}
      {onRemove && (
        <button onClick={onRemove} className="ml-2 font-bold">&times;</button>
      )}
    </span>
  );
};
