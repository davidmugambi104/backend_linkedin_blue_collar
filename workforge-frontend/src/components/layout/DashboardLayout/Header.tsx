import React, { useState } from 'react';
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-20 px-6 py-4">
      <div className="max-w-6xl mx-auto">
        {/* Professional Glassmorphism Search & Notifications Bar */}
        <div className="backdrop-blur-xl bg-white/70 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-soft hover:shadow-lg hover:bg-white/80 transition-all duration-300">
          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search jobs, applications, messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-slate-700 placeholder-slate-500 w-full text-sm font-medium"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-blue-100"></div>

          {/* Notifications Button */}
          <button className="relative p-2 rounded-xl hover:bg-primary-500/10 transition-all duration-200 group">
            <BellIcon className="w-5 h-5 text-slate-600 group-hover:text-primary-500 transition-colors" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full animate-pulse"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
