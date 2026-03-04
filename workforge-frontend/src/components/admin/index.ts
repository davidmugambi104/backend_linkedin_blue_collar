// workforge-frontend/src/components/admin/index.ts
// Main exports for admin components

// Layout Components
export { AdminLayout } from './layout/AdminLayout';
export { Sidebar } from './sidebar/Sidebar';
export { TopNavbar } from './navbar/TopNavbar';
export { AdminSearch } from './navbar/AdminSearch';
export { NotificationCenter } from './navbar/NotificationCenter';
export { UserMenu } from './navbar/UserMenu';

// UI Components - Cards
export { StatCard } from './cards/StatCard';
export type { StatCardProps } from './cards/StatCard';

// UI Components - Tables
export { AdminTable, TablePagination } from './tables/AdminTable';
export type { 
  Column, 
  SortConfig, 
  PaginationConfig, 
  AdminTableProps 
} from './tables/AdminTable';

// UI Components - Common
export { StatusBadge } from './common/StatusBadge';
export type { StatusBadgeProps } from './common/StatusBadge';

// Actions
export { QuickActions, QuickActionButton } from './actions/QuickActions';
