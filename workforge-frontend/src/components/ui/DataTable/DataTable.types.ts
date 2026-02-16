/**
 * DataTable Component Type Definitions
 * 
 * Production-grade type definitions for a compound DataTable component
 * following Material Design 3 and Google engineering standards.
 * 
 * @module DataTable.types
 */

import { ReactNode, HTMLAttributes, AriaAttributes } from 'react';

/**
 * Generic column definition with full type safety
 * @template TData - The type of data in each row
 */
export interface DataTableColumn<TData = unknown> {
  /** Unique identifier for the column */
  id: string;
  
  /** Column header display text or component */
  header: ReactNode;
  
  /** Accessor function to get cell value from row data */
  accessorFn?: (row: TData) => unknown;
  
  /** Accessor key for simple data extraction */
  accessorKey?: keyof TData;
  
  /** Custom cell renderer with full row context */
  cell?: (info: DataTableCellContext<TData>) => ReactNode;
  
  /** Enable sorting for this column */
  enableSorting?: boolean;
  
  /** Enable filtering for this column */
  enableFiltering?: boolean;
  
  /** Enable column hiding */
  enableHiding?: boolean;
  
  /** Column size configuration */
  size?: number;
  minSize?: number;
  maxSize?: number;
  
  /** Column metadata for custom behavior */
  meta?: Record<string, unknown>;
}

/**
 * Context passed to custom cell renderers
 */
export interface DataTableCellContext<TData = unknown> {
  row: DataTableRow<TData>;
  column: DataTableColumn<TData>;
  value: unknown;
  rowIndex: number;
}

/**
 * Row data with metadata
 */
export interface DataTableRow<TData = unknown> {
  id: string;
  original: TData;
  cells: Array<{ value: unknown; columnId: string }>;
  isSelected: boolean;
  isExpanded: boolean;
}

/**
 * Sorting state
 */
export interface DataTableSortingState {
  id: string;
  desc: boolean;
}

/**
 * Pagination state
 */
export interface DataTablePaginationState {
  pageIndex: number;
  pageSize: number;
}

/**
 * Column visibility state
 */
export interface DataTableColumnVisibilityState {
  [columnId: string]: boolean;
}

/**
 * Row selection state
 */
export interface DataTableRowSelectionState {
  [rowId: string]: boolean;
}

/**
 * Filtering state
 */
export interface DataTableFilteringState {
  id: string;
  value: unknown;
}

/**
 * Main DataTable configuration options
 */
export interface DataTableOptions<TData = unknown> {
  /** Column definitions */
  columns: DataTableColumn<TData>[];
  
  /** Data array */
  data: TData[];
  
  /** Enable row selection */
  enableRowSelection?: boolean;
  
  /** Enable multi-row selection */
  enableMultiRowSelection?: boolean;
  
  /** Enable sorting */
  enableSorting?: boolean;
  
  /** Enable multi-column sorting */
  enableMultiSort?: boolean;
  
  /** Enable pagination */
  enablePagination?: boolean;
  
  /** Enable column filtering */
  enableColumnFiltering?: boolean;
  
  /** Enable global filtering */
  enableGlobalFiltering?: boolean;
  
  /** Enable column visibility toggling */
  enableColumnVisibility?: boolean;
  
  /** Enable row expansion */
  enableExpanding?: boolean;
  
  /** Initial pagination state */
  initialPagination?: DataTablePaginationState;
  
  /** Initial sorting state */
  initialSorting?: DataTableSortingState[];
  
  /** Initial column visibility */
  initialColumnVisibility?: DataTableColumnVisibilityState;
  
  /** Get unique row ID */
  getRowId?: (row: TData, index: number) => string;
  
  /** Row click handler */
  onRowClick?: (row: DataTableRow<TData>) => void;
  
  /** Selection change handler */
  onSelectionChange?: (selectedRows: DataTableRow<TData>[]) => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error state */
  error?: Error | null;
  
  /** Empty state message */
  emptyMessage?: ReactNode;
  
  /** Loading skeleton rows count */
  skeletonRows?: number;
}

/**
 * DataTable variants for styling
 */
export type DataTableVariant = 'default' | 'bordered' | 'striped' | 'compact';

/**
 * DataTable size variants
 */
export type DataTableSize = 'sm' | 'md' | 'lg';

/**
 * DataTable component props
 */
export interface DataTableProps<TData = unknown>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    Omit<DataTableOptions<TData>, 'columns' | 'data'> {
  /** Variant styling */
  variant?: DataTableVariant;
  
  /** Size variant */
  size?: DataTableSize;
  
  /** Enable sticky header */
  stickyHeader?: boolean;
  
  /** Max height for scrollable content */
  maxHeight?: string | number;
  
  /** ARIA label for the table */
  'aria-label'?: string;
  
  /** ARIA described by */
  'aria-describedby'?: string;
}

/**
 * DataTable root component props (compound pattern)
 */
export interface DataTableRootProps<TData = unknown>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    DataTableOptions<TData> {
  /** Variant styling */
  variant?: DataTableVariant;
  
  /** Size variant */
  size?: DataTableSize;
  
  /** Enable sticky header */
  stickyHeader?: boolean;
  
  /** Max height for scrollable content */
  maxHeight?: string | number;
  
  /** ARIA label for the table */
  'aria-label'?: string;
  
  /** ARIA described by */
  'aria-describedby'?: string;
  
  /** Children for compound component pattern */
  children?: ReactNode;
}

/**
 * DataTable header props
 */
export interface DataTableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  /** Enable sticky positioning */
  sticky?: boolean;
}

/**
 * DataTable body props
 */
export interface DataTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children?: ReactNode;
}

/**
 * DataTable row props
 */
export interface DataTableRowProps<TData = unknown>
  extends HTMLAttributes<HTMLTableRowElement> {
  row: DataTableRow<TData>;
  isSelectable?: boolean;
  isClickable?: boolean;
}

/**
 * DataTable cell props
 */
export interface DataTableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
}

/**
 * DataTable pagination props
 */
export interface DataTablePaginationProps extends HTMLAttributes<HTMLDivElement> {
  /** Total number of items */
  totalItems?: number;
  
  /** Page size options */
  pageSizeOptions?: number[];
  
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  
  /** Show item count */
  showItemCount?: boolean;
}

/**
 * DataTable toolbar props
 */
export interface DataTableToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Enable search */
  enableSearch?: boolean;
  
  /** Search placeholder */
  searchPlaceholder?: string;
  
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;
}

/**
 * DataTable context value
 */
export interface DataTableContextValue<TData = unknown> {
  /** Table columns */
  columns: DataTableColumn<TData>[];
  
  /** Processed rows */
  rows: DataTableRow<TData>[];
  
  /** Current sorting state */
  sorting: DataTableSortingState[];
  
  /** Set sorting state */
  setSorting: (sorting: DataTableSortingState[]) => void;
  
  /** Current pagination state */
  pagination: DataTablePaginationState;
  
  /** Set pagination state */
  setPagination: (pagination: DataTablePaginationState) => void;
  
  /** Column visibility state */
  columnVisibility: DataTableColumnVisibilityState;
  
  /** Set column visibility */
  setColumnVisibility: (visibility: DataTableColumnVisibilityState) => void;
  
  /** Row selection state */
  rowSelection: DataTableRowSelectionState;
  
  /** Set row selection */
  setRowSelection: (selection: DataTableRowSelectionState) => void;
  
  /** Global filter value */
  globalFilter: string;
  
  /** Set global filter */
  setGlobalFilter: (filter: string) => void;
  
  /** Selected rows */
  selectedRows: DataTableRow<TData>[];
  
  /** Toggle row selection */
  toggleRowSelection: (rowId: string) => void;
  
  /** Toggle all rows selection */
  toggleAllRowsSelection: () => void;
  
  /** Check if all rows are selected */
  isAllRowsSelected: boolean;
  
  /** Check if some rows are selected */
  isSomeRowsSelected: boolean;
  
  /** Total pages */
  pageCount: number;
  
  /** Can go to previous page */
  canPreviousPage: boolean;
  
  /** Can go to next page */
  canNextPage: boolean;
  
  /** Go to previous page */
  previousPage: () => void;
  
  /** Go to next page */
  nextPage: () => void;
  
  /** Go to specific page */
  gotoPage: (page: number) => void;
  
  /** Set page size */
  setPageSize: (size: number) => void;
  
  /** Sort by column */
  sortBy: (columnId: string) => void;
  
  /** Configuration options */
  options: DataTableOptions<TData>;
}

/**
 * Export helper types
 */
export type DataTableInstance<TData = unknown> = DataTableContextValue<TData>;
