import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { mobileMenuVariants } from './Header.animations';
import { NavMenu } from './NavMenu';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { User, UserRole } from '@types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: User | null;
  variant?: 'public' | 'dashboard';
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  variant = 'public',
}) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-slate-900 md:hidden"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { opacity: 0, y: -8 },
            visible: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -8 },
          }}
        >
          {/* Close button area */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex justify-between items-center">
            <span className="font-semibold text-slate-900 dark:text-white">Menu</span>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {variant === 'public' && (
              <nav className="space-y-2">
                <NavMenu mobile onItemClick={onClose} />
              </nav>
            )}
          </div>

          {/* Auth Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <button
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  onClick={() => handleNavigate(`/${user?.role}/dashboard`)}
                >
                  <Avatar name={user?.username} size="sm" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{user?.username}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</div>
                  </div>
                </button>

                <button
                  className="w-full text-center py-2 px-4 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl font-medium"
                  onClick={() => {
                    user?.role && handleNavigate(`/${user.role}/settings`);
                  }}
                >
                  Settings
                </button>

                <button
                  className="w-full text-center py-2 px-4 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl font-medium"
                  onClick={onClose}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/auth/login" onClick={onClose}>
                    Sign in
                  </Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link to="/auth/register" onClick={onClose}>
                    Sign up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
