// workforge-frontend/src/components/admin/actions/QuickActions/QuickActions.tsx
import React, { useState } from 'react';
import {
  CommandLineIcon,
  UserPlusIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import { QuickActionButton } from './QuickActionButton';

export const QuickActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: UserPlusIcon, label: 'Add User', shortcut: '⌘U', onClick: () => {} },
    { icon: DocumentDuplicateIcon, label: 'Create Report', shortcut: '⌘R', onClick: () => {} },
    { icon: ShieldCheckIcon, label: 'Verify Users', shortcut: '⌘V', onClick: () => {} },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-2xl",
          "bg-gradient-to-br from-primary-500 to-primary-600",
          "text-white shadow-xl shadow-primary-500/30",
          "hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-110",
          "transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-focus:ring-offset-gray-900",
          "z-50"
        )}
        aria-label="Quick actions"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <CommandLineIcon className="w-6 h-6" />
        )}
      </button>

      {/* Actions Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 w-72",
          "bg-white/90 bg-bg-gray-900/90 backdrop-blur-xl",
          "rounded-2xl border border-gray-200/50 bg-border-gray-800/50",
          "shadow-2xl",
          "transition-all duration-300 transform",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
          "z-40"
        )}
      >
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 bg-text-white mb-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {actions.map((action) => (
              <QuickActionButton key={action.label} {...action} />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 bg-border-gray-800">
            <p className="text-xs text-gray-500 bg-text-gray-400">
              Press ⌘K to open commands
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
