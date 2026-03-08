import { ChevronUpDownIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { DropdownMenu } from '@components/molecules';
import type { ReactNode } from 'react';

export interface DataColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T extends object> {
  columns: DataColumn<T>[];
  rows: T[];
}

export const DataTable = <T extends object>({ columns, rows }: DataTableProps<T>) => (
  <div className="overflow-x-auto rounded-lg bg-white shadow-level-1">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)} className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <span className="inline-flex items-center gap-1">
                {column.label}
                {column.sortable ? <ChevronUpDownIcon className="h-4 w-4" aria-hidden="true" /> : null}
              </span>
            </th>
          ))}
          <th className="px-4 py-3.5" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {rows.map((row, index) => (
          <tr key={index} className="h-14 hover:bg-gray-50">
            {columns.map((column) => (
              <td key={String(column.key)} className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">
                {column.render ? column.render(row) : String(row[column.key] ?? '')}
              </td>
            ))}
            <td className="px-4 py-3.5 text-right">
              <DropdownMenu
                label="Row actions"
                trigger={<EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />}
                options={[{ label: 'View', onClick: () => undefined }, { label: 'Edit', onClick: () => undefined }]}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
