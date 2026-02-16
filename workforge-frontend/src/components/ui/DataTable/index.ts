/**
 * DataTable Component Exports
 * 
 * Clean barrel export for the DataTable component system.
 * Provides tree-shakeable imports.
 * 
 * @module DataTable
 */

// Main component and sub-components
export { DataTable } from './DataTable';
export {
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTablePagination,
  DataTableToolbar,
  DataTableEmpty,
  DataTableLoading,
} from './DataTable.subcomponents';

// Hooks
export { useDataTable } from './useDataTable';
export { useDataTableContext, useDataTableOptionalContext } from './DataTable.context';

// Types
export type {
  DataTableColumn,
  DataTableRow as DataTableRowType,
  DataTableSortingState,
  DataTablePaginationState,
  DataTableColumnVisibilityState,
  DataTableRowSelectionState,
  DataTableFilteringState,
  DataTableOptions,
  DataTableProps,
  DataTableRootProps,
  DataTableHeaderProps,
  DataTableBodyProps,
  DataTableRowProps,
  DataTableCellProps,
  DataTablePaginationProps,
  DataTableToolbarProps,
  DataTableInstance,
  DataTableCellContext,
  DataTableVariant,
  DataTableSize,
} from './DataTable.types';

// Style variants (for advanced use cases)
export {
  dataTableVariants,
  dataTableHeaderCellVariants,
  dataTableBodyRowVariants,
  dataTableBodyCellVariants,
  dataTablePaginationButtonVariants,
} from './DataTable.styles';

// Context provider (for advanced composition)
export { DataTableProvider } from './DataTable.context';
