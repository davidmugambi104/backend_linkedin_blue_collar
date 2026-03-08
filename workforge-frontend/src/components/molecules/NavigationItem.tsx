import type { ComponentType, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@utils/cn';

export interface NavigationItemProps {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'light' | 'dark';
  onNavigate?: () => void;
}

export const NavigationItem = ({ to, label, icon: Icon, tone = 'light', onNavigate }: NavigationItemProps) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2',
        tone === 'dark' && 'focus-visible:ring-offset-dark-navy',
        tone === 'dark'
          ? isActive
            ? 'border-l-4 border-primary-blue bg-blue-900 font-medium text-white'
            : 'text-white hover:bg-blue-900'
          : isActive
            ? 'border-l-4 border-primary-blue bg-blue-50 font-medium text-primary-blue'
            : 'text-gray-700 hover:bg-blue-50 hover:text-primary-blue',
      )
    }
  >
    <Icon className="h-6 w-6" aria-hidden="true" />
    <span>{label}</span>
  </NavLink>
);
