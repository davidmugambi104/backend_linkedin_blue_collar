// workforge-frontend/src/components/admin/layout/AdminLayout.tsx
import React from 'react';
import { cn } from '@lib/utils/cn';
import { Sidebar } from '../sidebar/Sidebar';
import { TopNavbar } from '../navbar/TopNavbar';
import { QuickActions } from '../actions/QuickActions/QuickActions';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Fixed width, glass effect */}
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex w-72 flex-col">
            <div className="flex flex-col flex-1 min-h-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50">
              <Sidebar />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopNavbar />
          
          {/* Page Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              <div className={cn("max-w-7xl mx-auto space-y-8", className)}>
                {children}
              </div>
            </div>
          </main>

          {/* Quick Actions Floating Panel */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
};
