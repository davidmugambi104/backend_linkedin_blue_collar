// workforge-frontend/src/components/admin/navbar/AdminSearch.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';

export const AdminSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 text-sm text-gray-500 bg-text-gray-400 bg-gray-100/50 bg-bg-gray-800/50 rounded-xl hover:bg-gray-200/50 bg-hover:bg-gray-700/50 transition-colors"
      >
        <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
        <span>Search...</span>
        <span className="ml-4 text-xs bg-gray-200 bg-bg-gray-700 px-2 py-0.5 rounded-md">
          ⌘K
        </span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-start justify-center min-h-screen pt-24 px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500/25 bg-bg-gray-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Search Panel */}
            <div
              className={cn(
                "relative w-full max-w-2xl",
                "bg-white/90 bg-bg-gray-900/90 backdrop-blur-xl",
                "rounded-2xl border border-gray-200/50 bg-border-gray-800/50",
                "shadow-2xl",
                "transform transition-all"
              )}
            >
              <div className="p-4">
                <div className="flex items-center">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users, jobs, payments..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 bg-text-white placeholder-gray-400 text-lg"
                    autoFocus
                  />
                  <kbd className="text-xs text-gray-400">ESC</kbd>
                </div>
              </div>

              {/* Search Results */}
              {query && (
                <div className="border-t border-gray-200 bg-border-gray-800 p-4">
                  <p className="text-sm text-gray-500 bg-text-gray-400">
                    Searching for "{query}"...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
