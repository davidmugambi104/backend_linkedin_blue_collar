// workforge-frontend/src/components/admin/tables/AdminTable/AdminTable.types.ts
export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortConfig?: SortConfig;
  onSort?: (config: SortConfig) => void;
  pagination?: PaginationConfig;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}
