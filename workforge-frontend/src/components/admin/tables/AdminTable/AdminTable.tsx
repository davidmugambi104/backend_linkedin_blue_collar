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
      <div className="bg-white dark:bg-[#151922] rounded-2xl border border-[#E6E9F0] dark:border-[#2A3140] p-8 shadow-[0_4px_16px_rgba(10,37,64,0.06)]">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-[#151922] rounded-2xl border border-[#E6E9F0] dark:border-[#2A3140] overflow-hidden shadow-[0_4px_16px_rgba(10,37,64,0.06)]", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#DDEBFF] dark:divide-[#2A3140]">
          <thead className="bg-[#DDEBFF] dark:bg-[#1A2740]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:text-white/90",
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
          <tbody className="bg-white dark:bg-[#151922] divide-y divide-[#DDEBFF] dark:divide-[#2A3140]">
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="hover:bg-[#EEF4FF] dark:hover:bg-[#1A2740] transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-6 py-4 text-sm text-[#1A1A1A] dark:text-white font-['SF_Pro_Display','Inter',sans-serif]",
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
