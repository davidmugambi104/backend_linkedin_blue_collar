// workforge-frontend/src/components/admin/common/StatusBadge/StatusBadge.types.ts
export interface StatusBadgeProps {
  status: 'active' | 'pending' | 'suspended' | 'banned' | 'completed' | 'failed' | string;
  children?: React.ReactNode;
  className?: string;
}
