// workforge-frontend/src/components/admin/tables/AdminTable/AdminTable.tsx
import React from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import type { Column, SortConfig, AdminTableProps } from './AdminTable.types';
import { TablePagination } from './TablePagination';

export const AdminTable = <T extends Record<string, any>>({
  columns,
  data,
  sortConfig,
  onSort,
  pagination,
  onPageChange,
  loading = false,
  emptyState,
  className,
}: AdminTableProps<T>) => {
  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    if (sortConfig?.key === column.key) {
      return sortConfig.direction === 'asc' ? (
        <ChevronUpIcon className="w-4 h-4 ml-1" />
      ) : (
        <ChevronDownIcon className="w-4 h-4 ml-1" />
      );
    }

    return <ChevronUpDownIcon className="w-4 h-4 ml-1 text-gray-400" />;
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;

    const direction =
      sortConfig?.key === column.key && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';

    onSort({ key: column.key, direction });
  };

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50/50 dark:bg-gray-800/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300",
                    column.align === 'right' && "text-right",
                    column.align === 'center' && "text-center"
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className={cn(
                    "flex items-center",
                    column.align === 'right' && "justify-end",
                    column.align === 'center' && "justify-center"
                  )}>
                    {column.header}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/50 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-800">
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-6 py-4 text-sm text-gray-900 dark:text-white",
                        column.align === 'right' && "text-right",
                        column.align === 'center' && "text-center"
                      )}
                    >
                      {column.accessor ? column.accessor(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  {emptyState || (
                    <div className="text-gray-500 dark:text-gray-400">
                      No data available
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && onPageChange && (
        <TablePagination
          {...pagination}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
