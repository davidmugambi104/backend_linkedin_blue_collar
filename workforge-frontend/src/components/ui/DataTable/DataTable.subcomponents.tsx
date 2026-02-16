/**
 * DataTable Sub-Components
 * 
 * Individual parts of the compound DataTable component.
 * Each sub-component accesses shared state via context.
 * 
 * @module DataTable.subcomponents
 */

import React, { forwardRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import { useDataTableContext } from './DataTable.context';
import {
  dataTableElementVariants,
  dataTableHeaderRowVariants,
  dataTableHeaderCellVariants,
  dataTableBodyRowVariants,
  dataTableBodyCellVariants,
  dataTableCheckboxVariants,
  dataTableEmptyStateVariants,
  dataTableSkeletonVariants,
  dataTablePaginationVariants,
  dataTablePaginationButtonVariants,
  dataTableToolbarVariants,
  dataTableSearchInputVariants,
} from './DataTable.styles';
import type {
  DataTableHeaderProps,
  DataTableBodyProps,
  DataTableRowProps,
  DataTableCellProps,
  DataTablePaginationProps,
  DataTableToolbarProps,
} from './DataTable.types';

/**
 * DataTable Header Component
 * Renders table header with sortable column headers
 */
export const DataTableHeader = forwardRef<HTMLTableSectionElement, DataTableHeaderProps>(
  ({ className, sticky = false, ...props }, ref) => {
    const table = useDataTableContext();
    const { columns, sorting, sortBy, options, toggleAllRowsSelection, isAllRowsSelected, isSomeRowsSelected } = table;

    const getSortDirection = (columnId: string) => {
      const sort = sorting.find((s) => s.id === columnId);
      return sort ? (sort.desc ? 'desc' : 'asc') : null;
    };

    return (
      <thead
        ref={ref}
        className={cn(dataTableHeaderRowVariants({ sticky }), className)}
        {...props}
      >
        <tr>
          {/* Selection column */}
          {options.enableRowSelection && options.enableMultiRowSelection && (
            <th className={dataTableHeaderCellVariants({ size: 'md' })}>
              <input
                type="checkbox"
                className={dataTableCheckboxVariants({
                  checked: isAllRowsSelected,
                  indeterminate: isSomeRowsSelected && !isAllRowsSelected,
                })}
                checked={isAllRowsSelected}
                onChange={toggleAllRowsSelection}
                aria-label="Select all rows"
              />
            </th>
          )}

          {/* Column headers */}
          {columns.map((column) => {
            const sortDirection = getSortDirection(column.id);
            const isSortable = options.enableSorting && column.enableSorting !== false;

            return (
              <th
                key={column.id}
                className={dataTableHeaderCellVariants({
                  sortable: isSortable,
                })}
                onClick={() => isSortable && sortBy(column.id)}
                aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'}
                role={isSortable ? 'button' : undefined}
                tabIndex={isSortable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    sortBy(column.id);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {isSortable && sortDirection && (
                    <span className="flex-shrink-0">
                      {sortDirection === 'asc' ? (
                        <ChevronUpIcon className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  }
);

DataTableHeader.displayName = 'DataTable.Header';

/**
 * DataTable Body Component
 * Renders table body with data rows
 */
export const DataTableBody = forwardRef<HTMLTableSectionElement, DataTableBodyProps>(
  ({ className, children, ...props }, ref) => {
    const table = useDataTableContext();
    const { rows, columns, options } = table;

    return (
      <tbody ref={ref} className={className} {...props}>
        {children ||
          rows.map((row, index) => (
            <DataTableRow
              key={row.id}
              row={row}
              isSelectable={options.enableRowSelection}
              isClickable={!!options.onRowClick}
            />
          ))}
      </tbody>
    );
  }
);

DataTableBody.displayName = 'DataTable.Body';

/**
 * DataTable Row Component
 * Renders individual table row
 */
export const DataTableRow = forwardRef<HTMLTableRowElement, DataTableRowProps>(
  ({ row, isSelectable, isClickable, className, children, onClick, ...props }, ref) => {
    const table = useDataTableContext();
    const { columns, toggleRowSelection, options } = table;

    const handleRowClick = useCallback(() => {
      if (isClickable && options.onRowClick) {
        options.onRowClick(row);
      }
      if (onClick) {
        onClick({} as any);
      }
    }, [isClickable, options, row, onClick]);

    const handleCheckboxChange = useCallback(() => {
      if (isSelectable) {
        toggleRowSelection(row.id);
      }
    }, [isSelectable, toggleRowSelection, row.id]);

    return (
      <motion.tr
        ref={ref}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className={cn(
          dataTableBodyRowVariants({
            selected: row.isSelected,
            clickable: isClickable,
            striped: (options as any).variant === 'striped',
          }),
          className
        )}
        onClick={handleRowClick as any}
        {...(props as any)}
      >
        {/* Selection cell */}
        {isSelectable && (
          <td
            className={dataTableBodyCellVariants()}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className={dataTableCheckboxVariants({ checked: row.isSelected })}
              checked={row.isSelected}
              onChange={handleCheckboxChange}
              aria-label={`Select row ${row.id}`}
            />
          </td>
        )}

        {/* Data cells */}
        {children ||
          columns.map((column) => {
            const cell = row.cells.find((c) => c.columnId === column.id);
            const value = cell?.value;

            return (
              <DataTableCell key={column.id}>
                {column.cell
                  ? column.cell({
                      row,
                      column,
                      value,
                      rowIndex: table.rows.indexOf(row),
                    })
                  : (value as React.ReactNode)}
              </DataTableCell>
            );
          })}
      </motion.tr>
    );
  }
);

DataTableRow.displayName = 'DataTable.Row';

/**
 * DataTable Cell Component
 * Renders individual table cell
 */
export const DataTableCell = forwardRef<HTMLTableCellElement, DataTableCellProps>(
  ({ className, children, isHeader = false, align = 'left', ...props }, ref) => {
    const Element = isHeader ? 'th' : 'td';

    return (
      <Element
        ref={ref as any}
        className={cn(dataTableBodyCellVariants({ align }), className)}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

DataTableCell.displayName = 'DataTable.Cell';

/**
 * DataTable Pagination Component
 * Renders pagination controls
 */
export const DataTablePagination = forwardRef<HTMLDivElement, DataTablePaginationProps>(
  (
    {
      className,
      totalItems,
      pageSizeOptions = [10, 20, 50, 100],
      showPageSizeSelector = true,
      showItemCount = true,
      ...props
    },
    ref
  ) => {
    const table = useDataTableContext();
    const {
      pagination,
      pageCount,
      canPreviousPage,
      canNextPage,
      previousPage,
      nextPage,
      setPageSize,
      rows,
    } = table;

    const startItem = pagination.pageIndex * pagination.pageSize + 1;
    const endItem = Math.min(
      (pagination.pageIndex + 1) * pagination.pageSize,
      totalItems || rows.length
    );
    const total = totalItems || rows.length;

    return (
      <div
        ref={ref}
        className={cn(dataTablePaginationVariants(), className)}
        role="navigation"
        aria-label="Pagination"
        {...props}
      >
        {/* Left: Item count */}
        {showItemCount && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Page size selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="page-size"
                className="text-sm text-slate-600 dark:text-slate-400"
              >
                Show
              </label>
              <select
                id="page-size"
                value={pagination.pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Items per page"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={previousPage}
              disabled={!canPreviousPage}
              className={dataTablePaginationButtonVariants({
                variant: 'default',
                disabled: !canPreviousPage,
              })}
              aria-label="Go to previous page"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <div className="px-4 text-sm text-slate-600 dark:text-slate-400">
              Page <span className="font-medium">{pagination.pageIndex + 1}</span> of{' '}
              <span className="font-medium">{pageCount}</span>
            </div>

            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className={dataTablePaginationButtonVariants({
                variant: 'default',
                disabled: !canNextPage,
              })}
              aria-label="Go to next page"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

DataTablePagination.displayName = 'DataTable.Pagination';

/**
 * DataTable Toolbar Component
 * Renders search and filter controls
 */
export const DataTableToolbar = forwardRef<HTMLDivElement, DataTableToolbarProps>(
  (
    {
      className,
      children,
      enableSearch = true,
      searchPlaceholder = 'Search...',
      enableColumnVisibility = false,
      ...props
    },
    ref
  ) => {
    const table = useDataTableContext();
    const { globalFilter, setGlobalFilter } = table;

    return (
      <div
        ref={ref}
        className={cn(dataTableToolbarVariants(), className)}
        {...props}
      >
        {/* Search input */}
        {enableSearch && (
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(dataTableSearchInputVariants(), 'pl-10')}
              aria-label="Search table"
            />
          </div>
        )}

        {/* Custom children or default filters */}
        {children || (
          <div className="flex items-center gap-2">
            {enableColumnVisibility && (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle column visibility"
              >
                <FunnelIcon className="w-4 h-4" />
                Columns
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

DataTableToolbar.displayName = 'DataTable.Toolbar';

/**
 * DataTable Empty State Component
 * Shown when no data is available
 */
export const DataTableEmpty = forwardRef<
  HTMLDivElement,
  { message?: React.ReactNode; className?: string }
>(({ message, className }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(dataTableEmptyStateVariants(), className)}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-slate-900 dark:text-slate-100 font-medium mb-1">
        {message || 'No data available'}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Try adjusting your filters or search terms
      </p>
    </motion.div>
  );
});

DataTableEmpty.displayName = 'DataTable.Empty';

/**
 * DataTable Loading State Component
 * Skeleton loader matching table structure
 */
export const DataTableLoading = forwardRef<
  HTMLDivElement,
  { rows?: number; className?: string }
>(({ rows = 5, className }, ref) => {
  const table = useDataTableContext();
  const { columns } = table;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={className}
      role="status"
      aria-live="polite"
      aria-label="Loading data"
    >
      <table className="w-full border-collapse">
        <thead className={dataTableHeaderRowVariants()}>
          <tr>
            {columns.map((column) => (
              <th key={column.id} className={dataTableHeaderCellVariants()}>
                <div className={dataTableSkeletonVariants()} style={{ width: '60%' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className={dataTableBodyRowVariants()}>
              {columns.map((column) => (
                <td key={column.id} className={dataTableBodyCellVariants()}>
                  <div
                    className={dataTableSkeletonVariants()}
                    style={{ width: `${Math.random() * 40 + 60}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
});

DataTableLoading.displayName = 'DataTable.Loading';
