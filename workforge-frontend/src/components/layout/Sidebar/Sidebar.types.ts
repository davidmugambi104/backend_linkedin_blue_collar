import { ReactNode, ComponentType, SVGProps } from 'react';
import { UserRole } from '@types';

export type SidebarItem = {
  id: string;
  label: string;
  to: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string | number;
  roles?: UserRole[];
};

export type SidebarSection = {
  id: string;
  label: string;
  items: SidebarItem[];
};

export type SidebarVariant = 'default' | 'compact';

export interface SidebarProps {
  isOpen?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  variant?: SidebarVariant;
  className?: string;
  children?: ReactNode;
  ariaLabel?: string;
}

export interface SidebarContextValue {
  isOpen: boolean;
  mobileOpen: boolean;
  onMobileClose?: () => void;
  variant: SidebarVariant;
  sections: SidebarSection[];
  activePath: string;
}

export interface SidebarNavProps {
  className?: string;
  children?: ReactNode;
  ariaLabel?: string;
}

export interface SidebarSectionProps {
  section: SidebarSection;
  className?: string;
}

export interface SidebarItemProps {
  item: SidebarItem;
  className?: string;
}

export interface SidebarHeaderProps {
  title?: string;
  subtitle?: string;
  logo?: ReactNode;
  className?: string;
}

export interface SidebarFooterProps {
  children?: ReactNode;
  className?: string;
}
