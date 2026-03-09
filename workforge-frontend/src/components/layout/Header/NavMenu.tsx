import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@lib/utils/cn';

interface NavMenuProps {
  mobile?: boolean;
  onItemClick?: () => void;
}

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Find Work', path: '/jobs' },
  { name: 'Find Workers', path: '/workers' },
  { name: 'About', path: '/about' },
];

export const NavMenu: React.FC<NavMenuProps> = ({ mobile = false, onItemClick }) => {
  const location = useLocation();

  return (
    <nav className={cn(
      'flex',
      mobile ? 'flex-col space-y-1' : 'items-center space-x-8'
    )}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={cn(
            'text-sm font-medium transition-colors hover:text-blue-600 bg-hover:text-blue-400',
            location.pathname === item.path
              ? 'text-blue-600 bg-text-blue-400'
              : 'text-slate-700 bg-text-slate-300',
            mobile && 'px-3 py-2 rounded-xl hover:bg-slate-100 bg-hover:bg-slate-800'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};