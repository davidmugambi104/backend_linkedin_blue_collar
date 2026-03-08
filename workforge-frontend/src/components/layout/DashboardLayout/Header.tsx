/**
 * Unified Header - Consistent across all dashboard pages
 */
import React, { useState } from 'react';
import { MagnifyingGlassIcon, BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { UserRole } from '@types';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const isEmployer = user?.role === UserRole.EMPLOYER;

  const settingsPath =
    user?.role === UserRole.WORKER
      ? '/worker/settings'
      : user?.role === UserRole.EMPLOYER
      ? '/employer/settings'
      : '/admin/settings';

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Glassmorphism Search & Notifications Bar */}
        <div className={`
          backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 
          border border-blue-100/50 dark:border-slate-700/50 
          rounded-2xl px-4 py-3 
          flex items-center gap-3 sm:gap-4 
          shadow-sm hover:shadow-md transition-all duration-300
          ${isEmployer ? 'bg-white/12 border-white/20 shadow-lg shadow-black/20' : ''}
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
                ${isEmployer ? 'text-white placeholder:text-white/60' : ''}
              `}
            />
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-blue-100 dark:bg-slate-700"></div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
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
