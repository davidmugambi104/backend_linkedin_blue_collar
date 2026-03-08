/**
 * Unified Header - Consistent across all dashboard pages
 */
import React, { useState } from 'react';
import { MagnifyingGlassIcon, BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';
import { uiStore } from '@store/ui.store';

interface HeaderProps {
  title?: string;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const isEmployer = user?.role === UserRole.EMPLOYER;
  const { theme, setTheme } = uiStore();

  const settingsPath =
    user?.role === UserRole.WORKER
      ? '/worker/settings'
      : user?.role === UserRole.EMPLOYER
      ? '/employer/settings'
      : '/admin/settings';

  return (
    <header className={`sticky top-0 z-30 px-4 sm:px-6 py-4 ${className || ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Glassmorphism Search & Notifications Bar */}
        <div className={`
          bg-white dark:bg-slate-900
          border border-[#E9EDF2] dark:border-slate-700/50 
          rounded-2xl px-4 py-3 
          flex items-center gap-3 sm:gap-4 
          shadow-sm hover:shadow-md transition-all duration-300
          ${isEmployer ? 'bg-white border-[#E9EDF2] shadow-none' : ''}
        `}>
          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MagnifyingGlassIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <input
              type="text"
              placeholder={isEmployer ? 'Search pipelines, postings, applicants...' : 'Search jobs, applications, messages...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                bg-transparent outline-none 
                text-slate-700 dark:text-slate-200 
                placeholder-slate-500 dark:placeholder-slate-400 
                w-full text-sm font-medium
                min-w-0
                ${isEmployer ? 'text-[#1A1A1A] placeholder:text-[#5B6675]' : ''}
              `}
            />
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-blue-100 dark:bg-slate-700"></div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-primary-500/10 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

            {/* Settings */}
            <Link
              to={settingsPath}
              className="
                p-2 rounded-xl 
                text-slate-600 dark:text-slate-400 
                hover:bg-primary-500/10 hover:text-primary-500 
                transition-all duration-200
              "
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </Link>

            {/* Notifications */}
            <button className="
              relative p-2 rounded-xl 
              text-slate-600 dark:text-slate-400 
              hover:bg-primary-500/10 hover:text-primary-500 
              transition-all duration-200
            ">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
