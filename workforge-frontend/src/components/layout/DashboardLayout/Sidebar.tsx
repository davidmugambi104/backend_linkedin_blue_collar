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

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const isEmployer = user?.role === UserRole.EMPLOYER;

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

  const settingsPath = useMemo(() => {
    if (!user) return '/';
    return `${baseRolePath}/settings`;
  }, [user, baseRolePath]);

  return (
    // Fixed Sidebar - Always visible on desktop
    <aside
      className={`hidden lg:flex lg:flex-col h-screen overflow-hidden ${
        isEmployer
          ? 'group w-[88px] hover:w-72 transition-all duration-200 bg-[#0A2540] border-r border-white/10'
          : 'w-64 bg-slate-900 border-r border-slate-800'
      } ${className || ''}`}
    >
      {/* Logo Section */}
      <div
        className={`h-16 flex items-center px-6 flex-shrink-0 ${
          isEmployer ? 'border-b border-white/10' : 'border-b border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight whitespace-nowrap transition-all duration-200 ${isEmployer ? 'text-white/95 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-48' : 'text-white'}`}>
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
                    ? isEmployer
                      ? 'bg-white/10 text-white border-l-4 border-l-white border border-white/15 shadow-md shadow-black/20'
                      : 'bg-primary-500/20 text-primary-400 border border-primary-500/30 font-bold'
                    : isEmployer
                      ? 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent font-light'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent font-light'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-200 ${isEmployer ? 'opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-48 overflow-hidden' : ''}`}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Section - Settings & Logout */}
      <div
        className={`p-4 space-y-2 flex-shrink-0 ${
          isEmployer ? 'border-t border-white/10' : 'border-t border-slate-800'
        }`}
      >
        {/* Settings */}
        <NavLink
          to={settingsPath}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? isEmployer
                  ? 'bg-white/15 text-white border border-white/20 shadow-md shadow-black/20'
                  : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : isEmployer
                  ? 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
            }`
          }
        >
          <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
          <span className={`font-medium whitespace-nowrap transition-all duration-200 ${isEmployer ? 'opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-48 overflow-hidden' : ''}`}>Settings</span>
        </NavLink>

        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border border-transparent ${
            isEmployer
              ? 'text-slate-300 hover:bg-white/10 hover:text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          <span className={`font-medium whitespace-nowrap transition-all duration-200 ${isEmployer ? 'opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-48 overflow-hidden' : ''}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
};
