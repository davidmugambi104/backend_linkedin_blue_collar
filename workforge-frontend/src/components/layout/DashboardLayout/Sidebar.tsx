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
} from '@heroicons/react/24/outline';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = useMemo(() => {
    if (!user) return [];

    const baseRolePath = user.role === UserRole.WORKER ? '/worker' : user.role === UserRole.EMPLOYER ? '/employer' : '/admin';

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
        { name: 'Settings', path: `${baseRolePath}/settings`, icon: Cog6ToothIcon },
      ],
      [UserRole.EMPLOYER]: [
        { name: 'Dashboard', path: `${baseRolePath}/dashboard`, icon: HomeIcon },
        { name: 'Jobs', path: `${baseRolePath}/jobs`, icon: BriefcaseIcon },
        { name: 'Post Job', path: `${baseRolePath}/post-job`, icon: DocumentTextIcon },
        { name: 'Applications', path: `${baseRolePath}/applications`, icon: ClipboardDocumentListIcon },
        { name: 'Workers', path: `${baseRolePath}/workers`, icon: UsersIcon },
        { name: 'Reviews', path: `${baseRolePath}/reviews`, icon: ClipboardDocumentListIcon },
        { name: 'Profile', path: `${baseRolePath}/profile`, icon: UserCircleIcon },
        { name: 'Settings', path: `${baseRolePath}/settings`, icon: Cog6ToothIcon },
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
  }, [user]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Professional Dark Theme */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white tracking-tight">
              WorkForge
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
