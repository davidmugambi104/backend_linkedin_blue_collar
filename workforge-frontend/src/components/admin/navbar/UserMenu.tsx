// workforge-frontend/src/components/admin/navbar/UserMenu.tsx
import React, { useState } from 'react';
import { ChevronDownIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import { useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-700 bg-text-gray-300 hover:bg-gray-100/50 bg-hover:bg-gray-800/50 rounded-xl transition-colors"
      >
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
          A
        </div>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {/* User Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white/90 bg-bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 bg-border-gray-800/50 shadow-xl z-50">
          <div className="p-2">
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-text-gray-300 hover:bg-gray-100 bg-hover:bg-gray-800 rounded-xl transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 bg-text-red-400 hover:bg-red-50 bg-hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
