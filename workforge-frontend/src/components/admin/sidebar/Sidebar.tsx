// workforge-frontend/src/components/admin/sidebar/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, exact, badge }) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group flex items-center px-3 py-2.5 text-sm font-medium rounded-2xl transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800/50',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
            )}
            aria-hidden="true"
          />
          <span className="flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const navigation = [
    { name: 'Dashboard', to: '/admin', icon: HomeIcon, exact: true },
    { name: 'Users', to: '/admin/users', icon: UsersIcon, badge: 1284 },
    { name: 'Jobs', to: '/admin/jobs', icon: BriefcaseIcon, badge: 12 },
    { name: 'Payments', to: '/admin/payments', icon: CurrencyDollarIcon },
    { name: 'Verifications', to: '/admin/verifications', icon: ShieldCheckIcon, badge: 8 },
    { name: 'Reports', to: '/admin/reports', icon: ChartBarIcon },
    { name: 'Settings', to: '/admin/dashboard', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            WorkForge
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <SidebarItem
            key={item.name}
            to={item.to}
            icon={item.icon}
            label={item.name}
            exact={item.exact}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* User Profile Preview */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium shadow-lg">
              A
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">admin@workforge.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
