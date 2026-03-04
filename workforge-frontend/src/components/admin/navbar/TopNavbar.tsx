// workforge-frontend/src/components/admin/navbar/TopNavbar.tsx
import React from 'react';
import { AdminSearch } from './AdminSearch';
import { NotificationCenter } from './NotificationCenter';
import { UserMenu } from './UserMenu';

export const TopNavbar: React.FC = () => {
  return (
    <header className="flex-shrink-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left: Page Title (dynamic - can be set via context) */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <AdminSearch />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
