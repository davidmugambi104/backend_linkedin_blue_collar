import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const baseRolePath = useMemo(() => {
    if (!user) return '';
    return user.role === UserRole.WORKER ? '/worker' : user.role === UserRole.EMPLOYER ? '/employer' : '/admin';
  }, [user]);

  const navItems = useMemo(() => {
    if (!user) return [];

    if (!baseRolePath) return [];

    // Common items for all roles
    const commonItems = [
      { name: 'Messages', path: '/messages', icon: ChatBubbleLeftRightIcon },
    ];

    // Role-specific items
    const roleItems: { [key in UserRole]: Array<{ name: string; path: string; icon: any }> } = {
      [UserRole.WORKER]: [
        { name: 'Dashboard', path: `${baseRolePath}/dashboard`, icon: HomeIcon },
        { name: 'Browse Jobs', path: `${baseRolePath}/jobs`, icon: BriefcaseIcon },
        { name: 'Applications', path: `${baseRolePath}/applications`, icon: DocumentTextIcon },
        { name: 'Reviews', path: `${baseRolePath}/reviews`, icon: ClipboardDocumentListIcon },
        { name: 'Profile', path: `${baseRolePath}/profile`, icon: UserCircleIcon },
      ],
      [UserRole.EMPLOYER]: [
        { name: 'Dashboard', path: `${baseRolePath}/dashboard`, icon: HomeIcon },
        { name: 'Jobs', path: `${baseRolePath}/jobs`, icon: BriefcaseIcon },
        { name: 'Post Job', path: `${baseRolePath}/post-job`, icon: DocumentTextIcon },
        { name: 'Applications', path: `${baseRolePath}/applications`, icon: ClipboardDocumentListIcon },
        { name: 'Workers', path: `${baseRolePath}/workers`, icon: UsersIcon },
        { name: 'Reviews', path: `${baseRolePath}/reviews`, icon: ClipboardDocumentListIcon },
        { name: 'Profile', path: `${baseRolePath}/profile`, icon: UserCircleIcon },
      ],
      [UserRole.ADMIN]: [
        { name: 'Dashboard', path: `${baseRolePath}/dashboard`, icon: HomeIcon },
        { name: 'Jobs', path: `${baseRolePath}/jobs`, icon: BriefcaseIcon },
        { name: 'Users', path: `${baseRolePath}/users`, icon: UsersIcon },
        { name: 'Verifications', path: `${baseRolePath}/verifications`, icon: ShieldCheckIcon },
        { name: 'Payments', path: `${baseRolePath}/payments`, icon: DocumentTextIcon },
        { name: 'Reports', path: `${baseRolePath}/reports`, icon: ExclamationTriangleIcon },
      ],
    };

    return [...(roleItems[user.role] || []), ...commonItems];
  }, [user, baseRolePath]);

  return (
    // Fixed Sidebar - Always visible on desktop
    <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen overflow-hidden">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            WorkForge
          </h2>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Section - Settings & Logout */}
      <div className="border-t border-slate-800 p-4 space-y-2 flex-shrink-0">
        {/* Settings */}
        <NavLink
          to={`${baseRolePath}/settings`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
            }`
          }
        >
          <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Settings</span>
        </NavLink>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
