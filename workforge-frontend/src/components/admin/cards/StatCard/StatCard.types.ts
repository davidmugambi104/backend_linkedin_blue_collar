// workforge-frontend/src/components/admin/cards/StatCard/StatCard.types.ts
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  loading?: boolean;
  className?: string;
}
