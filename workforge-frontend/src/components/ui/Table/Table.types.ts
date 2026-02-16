import { ReactNode } from 'react';

export interface Column<T = any> {
  key: string;
  header: string;
  accessor?: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  rowKey?: keyof T | ((item: T) => string);
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  className?: string;
}

export interface TableHeaderProps {
  columns: Column[];
  onSort?: (key: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface TableRowProps<T = any> {
  item: T;
  columns: Column<T>[];
  index: number;
  onRowClick?: (item: T) => void;
  hoverable?: boolean;
  striped?: boolean;
}