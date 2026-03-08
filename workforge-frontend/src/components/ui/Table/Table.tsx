import React from 'react';
import { cn } from '@lib/utils/cn';
import { Spinner } from '../Spinner/Spinner';
import { Column, TableProps, TableHeaderProps, TableRowProps } from './Table.types';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  onSort,
  sortColumn,
  sortDirection,
}) => {
  return (
    <thead className="bg-[#DDEBFF] dark:bg-[#1A2740]">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              'px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider',
              column.sortable && 'cursor-pointer hover:text-white/90 transition-colors',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.width && `w-[${column.width}]`,
              column.className
            )}
            onClick={() => column.sortable && onSort?.(column.key)}
          >
            <div className="flex items-center gap-1">
              <span>{column.header}</span>
              {column.sortable && sortColumn === column.key && (
                <span>
                  {sortDirection === 'asc' ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

const TableRow = <T extends Record<string, any>>({
  item,
  columns,
  index,
  onRowClick,
  hoverable,
  striped,
}: TableRowProps<T>) => {
  const getValue = (column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    if (column.accessor) {
      return item[column.accessor as keyof T];
    }
    return item[column.key as keyof T];
  };

  return (
    <tr
      className={cn(
        'transition-colors border-b border-[#DDEBFF] dark:border-[#2A3140]',
        striped && index % 2 === 1 && 'bg-[#F9FBFF] dark:bg-[#1A1F2B]',
        hoverable && 'hover:bg-[#EEF4FF] dark:hover:bg-[#1A2740] cursor-pointer',
        !hoverable && 'hover:bg-[#F9FBFF] dark:hover:bg-[#1A1F2B]'
      )}
      onClick={() => onRowClick?.(item)}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className={cn(
            'px-6 py-4 whitespace-nowrap text-sm text-[#1A1A1A] dark:text-slate-100',
            column.align === 'center' && 'text-center',
            column.align === 'right' && 'text-right',
            column.className
          )}
        >
          {getValue(column)}
        </td>
      ))}
    </tr>
  );
};

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  error,
  emptyMessage = 'No data available',
  onRowClick,
  onSort,
  sortColumn,
  sortDirection,
  rowKey = 'id',
  striped = true,
  hoverable = true,
  bordered = false,
  compact = false,
  className,
}: TableProps<T>) => {
  const getRowKey = (item: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(item);
    }
    return String(item[rowKey] || index);
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const direction = sortColumn === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, direction);
  };

  return (
    <div className={cn('relative overflow-x-auto rounded-2xl border border-[#E6E9F0] shadow-[0_4px_16px_rgba(10,37,64,0.06)]', className)}>
      <table
        className={cn(
          'w-full text-left bg-white dark:bg-[#151922]',
          bordered && 'border border-gray-200 dark:border-gray-800',
          compact && 'text-sm'
        )}
      >
        <TableHeader
          columns={columns}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
        
        <tbody className="bg-white divide-y divide-[#DDEBFF] dark:bg-[#151922] dark:divide-[#2A3140]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center">
                <div className="flex justify-center">
                  <Spinner size="lg" />
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-red-600 dark:text-red-400">
                {error}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <TableRow
                key={getRowKey(item, index)}
                item={item}
                columns={columns}
                index={index}
                onRowClick={onRowClick}
                hoverable={hoverable}
                striped={striped}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};