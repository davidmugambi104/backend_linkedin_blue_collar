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
    <thead className="bg-[#0A2540]">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              'px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider',
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
        'transition-colors border-b border-slate-100',
        striped && index % 2 === 1 && 'bg-slate-50',
        hoverable && 'hover:bg-slate-50 cursor-pointer',
        !hoverable && 'hover:bg-slate-50'
      )}
      onClick={() => onRowClick?.(item)}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className={cn(
            'px-5 py-4 whitespace-nowrap text-sm text-slate-700',
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
    <div className={cn('relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      <table
        className={cn(
          'w-full text-left',
          bordered && 'border border-gray-200',
          compact && 'text-sm'
        )}
      >
        <TableHeader
          columns={columns}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
        
        <tbody className="bg-white divide-y divide-slate-100">
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
              <td colSpan={columns.length} className="px-6 py-8 text-center text-red-600">
                {error}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
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