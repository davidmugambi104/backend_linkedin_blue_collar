// workforge-frontend/src/components/admin/actions/QuickActions/QuickActionButton.tsx
import React from 'react';
import { cn } from '@lib/utils/cn';

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  shortcut: string;
  onClick: () => void;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  shortcut,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5",
        "text-sm text-gray-700 dark:text-gray-300",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "rounded-xl transition-colors"
      )}
    >
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3 text-gray-400" />
        <span>{label}</span>
      </div>
      <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
        {shortcut}
      </kbd>
    </button>
  );
};
