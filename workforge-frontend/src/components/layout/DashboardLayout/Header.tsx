/**
 * Unified Header - Consistent across all dashboard pages
 */
import React, { useState } from 'react';
import { MagnifyingGlassIcon, BellIcon, Cog6ToothIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';
import { uiStore } from '@store/ui.store';

interface HeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { theme, setTheme } = uiStore();

  const settingsPath = user?.role === UserRole.WORKER
    ? '/worker/settings'
    : user?.role === UserRole.EMPLOYER
    ? '/employer/settings'
    : '/admin/settings';

  const profilePath = user?.role === UserRole.WORKER
    ? '/worker/profile'
    : user?.role === UserRole.EMPLOYER
    ? '/employer/profile'
    : '/admin/profile';

  return (
    <header className={`sticky top-0 z-30 px-4 sm:px-6 py-4 ${className || ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Search & Notifications Bar */}
        <div className={`
          bg-white border border-slate-200
          rounded-2xl px-4 py-3 
          flex items-center gap-3 sm:gap-4 
          shadow-sm
        `}>
          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-full text-sm font-medium"
            />
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-slate-200"></div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

            {/* Settings */}
            <Link
              to={settingsPath}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </Link>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
