import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';

interface SkillBadgeProps {
  name: string;
  proficiency?: number;
  onRemove?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const proficiencyLabels: Record<number, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  proficiency,
  onRemove,
  className,
  size = 'md',
}) => {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full',
        sizes[size],
        className
      )}
    >
      <span className="font-medium">{name}</span>
      {proficiency && (
        <span className="text-xs opacity-75">
          • {proficiencyLabels[proficiency]}
        </span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};