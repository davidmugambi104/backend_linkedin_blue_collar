// workforge-frontend/src/components/admin/navbar/NotificationCenter.tsx
import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notificationCount = 3;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 bg-text-gray-400 hover:text-gray-700 bg-hover:text-gray-300 rounded-xl hover:bg-gray-100/50 bg-hover:bg-gray-800/50 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white/90 bg-bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 bg-border-gray-800/50 shadow-xl z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 bg-text-white mb-3">
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 bg-text-gray-400">
                New verification request from John Doe
              </div>
              <div className="text-sm text-gray-600 bg-text-gray-400">
                Payment dispute opened (#1234)
              </div>
              <div className="text-sm text-gray-600 bg-text-gray-400">
                10 new users registered today
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
