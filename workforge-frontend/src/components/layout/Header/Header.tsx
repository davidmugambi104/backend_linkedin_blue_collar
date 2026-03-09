import React from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { cn } from '@lib/utils/cn';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { Dropdown } from '@components/ui/Dropdown';
import { uiStore } from '@store/ui.store';
import { useHeader } from './useHeader';
import { NavMenu } from './NavMenu';
import { MobileMenu } from './MobileMenu';
import { HeaderProps } from './Header.types';

export const Header: React.FC<HeaderProps> = ({
  variant = 'public',
  title,
  subtitle,
  onSidebarToggle,
  mobileOpen,
  onMobileOpenChange,
  className,
  children,
}) => {
  const { user, isAuthenticated, isScrolled, userMenuItems, setMobileOpen } =
    useHeader({
      mobileOpen,
      onMobileOpenChange,
    });
  const { theme, setTheme } = uiStore();

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <header
      role="banner"
      className={cn(
        `
        sticky top-0 z-50 w-full
        border-b border-slate-200/70
        bg-white/80 backdrop-blur-xl
        transition-all duration-200
        bg-border-slate-800 bg-bg-slate-950/70
      `,
        isScrolled && 'shadow-sm',
        className
      )}
    >
      {/* Container */}
      <div
        className="
          mx-auto flex h-16 max-w-7xl items-center justify-between
          px-4 sm:px-6 lg:px-8
        "
      >
        {/* LEFT: Logo + Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {/* Sidebar toggle (Dashboard only) */}
          {variant === 'dashboard' && onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="
                inline-flex h-10 w-10 items-center justify-center
                rounded-xl text-slate-700
                hover:bg-slate-100
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-blue-500 focus-visible:ring-offset-2
                bg-text-slate-300 bg-hover:bg-slate-800
              "
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-[#0A2540] bg-text-blue-300">
              WorkForge
            </span>
          </Link>
        </div>

        {/* CENTER: Dashboard Title OR Public Nav */}
        <div className="flex flex-1 items-center justify-center">
          {/* Dashboard title */}
          {variant === 'dashboard' && title ? (
            <div className="hidden sm:flex flex-col items-center text-center">
              <h1 className="text-sm font-semibold text-slate-900 bg-text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 bg-text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          ) : null}

          {/* Public nav */}
          {variant === 'public' && (
            <nav className="hidden md:flex">
              <NavMenu />
            </nav>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div className="hidden md:flex items-center gap-3">
          {variant === 'dashboard' && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E9EDF2] text-[#0A2540] hover:bg-slate-100 bg-border-slate-700 bg-text-slate-200 bg-hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </button>
          )}

          {children}

          {/* Authenticated user */}
          {isAuthenticated ? (
            <Dropdown
              trigger={
                <button
                  className="
                    flex items-center gap-2 rounded-xl px-2 py-1
                    hover:bg-slate-100
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-blue-500 focus-visible:ring-offset-2
                    bg-hover:bg-slate-800
                  "
                >
                  <Avatar name={user?.username} size="sm" />
                  <span className="hidden lg:block text-sm font-medium text-slate-700 bg-text-slate-200">
                    {user?.username}
                  </span>
                </button>
              }
              items={userMenuItems}
            />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">
                  Sign in
                </Link>
              </Button>

              <Button variant="default" size="sm" asChild>
                <Link to="/auth/register">
                  Sign up
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          type="button"
          onClick={handleMobileMenuToggle}
          className="
            inline-flex h-10 w-10 items-center justify-center
            rounded-xl text-slate-700
            hover:bg-slate-100
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-blue-500 focus-visible:ring-offset-2
            bg-text-slate-300 bg-hover:bg-slate-800
            md:hidden
          "
          aria-label="Toggle mobile menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      <MobileMenu
        isOpen={mobileOpen || false}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        variant={variant}
      />
    </header>
  );
};
