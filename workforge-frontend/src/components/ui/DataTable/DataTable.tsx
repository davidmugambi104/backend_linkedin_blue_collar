/**
 * DataTable Main Component
 * 
 * Production-grade compound component following Material Design 3.
 * Uses compound component pattern for maximum flexibility.
 * 
 * @module DataTable
 */

import React, { forwardRef, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@lib/utils/cn';
import { useDataTable } from './useDataTable';
import { DataTableProvider } from './DataTable.context';
import {
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTablePagination,
  DataTableToolbar,
  DataTableEmpty,
  DataTableLoading,
} from './DataTable.subcomponents';
import { dataTableVariants } from './DataTable.styles';
import type { DataTableRootProps, DataTableOptions } from './DataTable.types';

type DataTableComponent = <TData = unknown>(
  props: DataTableRootProps<TData> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null;

/**
 * DataTable Root Component
 * 
 * Main entry point for the DataTable compound component.
 * Provides context to all child components.
 * 
 * @example
 * ```tsx
 * // Simple usage
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   enableSorting
 *   enablePagination
 * />
 * 
 * // Advanced compound usage
 * <DataTable.Root
 *   columns={columns}
 *   data={data}
 *   enableRowSelection
 * >
 *   <DataTable.Toolbar enableSearch />
 *   <DataTable.Header />
 *   <DataTable.Body />
 *   <DataTable.Pagination />
 * </DataTable.Root>
 * ```
 */
const DataTableRootBase = forwardRef<HTMLDivElement, DataTableRootProps<unknown>>(
  (
    {
      // Styling props
      className,
      variant = 'default',
      size = 'md',
      stickyHeader = false,
      maxHeight,
      
      // Options
      columns,
      data,
      enableRowSelection,
      enableMultiRowSelection,
      enableSorting = true,
      enableMultiSort,
      enablePagination,
      enableColumnFiltering,
      enableGlobalFiltering,
      enableColumnVisibility,
      enableExpanding,
      initialPagination,
      initialSorting,
      initialColumnVisibility,
      getRowId,
      onRowClick,
      onSelectionChange,
      isLoading,
      error,
      emptyMessage,
      skeletonRows = 5,
      
      // HTML props
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedby,
      children,
      ...props
    },
    ref
  ) => {
    // Initialize table logic with custom hook
    const tableOptions: DataTableOptions = {
      columns,
      data,
      enableRowSelection,
      enableMultiRowSelection,
      enableSorting,
      enableMultiSort,
      enablePagination,
      enableColumnFiltering,
      enableGlobalFiltering,
      enableColumnVisibility,
      enableExpanding,
      initialPagination,
      initialSorting,
      initialColumnVisibility,
      getRowId,
      onRowClick,
      onSelectionChange,
      isLoading,
      error,
      emptyMessage,
      skeletonRows,
    };

    const table = useDataTable(tableOptions);

    // If children are provided, use compound component pattern
    if (children) {
      return (
        <DataTableProvider value={table}>
          <div
            ref={ref}
            className={cn(dataTableVariants({ variant, size }), className)}
            role="region"
            aria-label={ariaLabel || 'Data table'}
            aria-describedby={ariaDescribedby}
            style={{ maxHeight }}
            {...props}
          >
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </div>
        </DataTableProvider>
      );
    }

    // Default implementation with all parts
    return (
      <DataTableProvider value={table}>
        <div
          ref={ref}
          className={cn(dataTableVariants({ variant, size }), className)}
          role="region"
          aria-label={ariaLabel || 'Data table'}
          aria-describedby={ariaDescribedby}
          style={{ maxHeight }}
          {...props}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <DataTableLoading key="loading" rows={skeletonRows} />
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center text-red-600 dark:text-red-400"
              >
                <p className="font-semibold">Error loading data</p>
                <p className="text-sm mt-2">{error.message}</p>
              </motion.div>
            ) : data.length === 0 ? (
              <DataTableEmpty key="empty" message={emptyMessage} />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <table
                  className="w-full border-collapse"
                  role="table"
                  aria-label={ariaLabel}
                >
                  <DataTableHeader sticky={stickyHeader} />
                  <DataTableBody />
                </table>
                {enablePagination && <DataTablePagination />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DataTableProvider>
    );
  }
);

export const DataTableRoot = DataTableRootBase as DataTableComponent;

DataTableRootBase.displayName = 'DataTable.Root';

/**
 * Main DataTable export with compound components attached
 */
export const DataTable = Object.assign(DataTableRoot, {
  Root: DataTableRoot,
  Header: DataTableHeader,
  Body: DataTableBody,
  Row: DataTableRow,
  Cell: DataTableCell,
  Pagination: DataTablePagination,
  Toolbar: DataTableToolbar,
  Empty: DataTableEmpty,
  Loading: DataTableLoading,
}) as DataTableComponent & {
  Root: typeof DataTableRoot;
  Header: typeof DataTableHeader;
  Body: typeof DataTableBody;
  Row: typeof DataTableRow;
  Cell: typeof DataTableCell;
  Pagination: typeof DataTablePagination;
  Toolbar: typeof DataTableToolbar;
  Empty: typeof DataTableEmpty;
  Loading: typeof DataTableLoading;
};

// Default export
export default DataTable;
