import { ReactNode } from 'react';

export type HeaderVariant = 'public' | 'dashboard';

export interface HeaderProps {
  variant?: HeaderVariant;
  title?: string;
  subtitle?: string;
  onSidebarToggle?: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  className?: string;
  children?: ReactNode;
}

export interface HeaderContextValue {
  variant: HeaderVariant;
  isScrolled: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export interface HeaderSectionProps {
  className?: string;
  children?: ReactNode;
}
