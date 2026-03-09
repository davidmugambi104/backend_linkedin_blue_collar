// workforge-frontend/src/components/admin/tables/AdminTable/TablePagination.tsx
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import type { PaginationConfig } from './AdminTable.types';

interface TablePaginationProps extends PaginationConfig {
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-border-gray-800">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-border-gray-700 bg-white bg-bg-gray-900 text-gray-700 bg-text-gray-300 hover:bg-gray-50 bg-hover:bg-gray-800 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 bg-border-gray-700 bg-white bg-bg-gray-900 text-gray-700 bg-text-gray-300 hover:bg-gray-50 bg-hover:bg-gray-800 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 bg-text-gray-400">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 bg-border-gray-700 bg-white bg-bg-gray-900 text-sm font-medium text-gray-500 bg-text-gray-400 hover:bg-gray-50 bg-hover:bg-gray-800 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => onPageChange(i + 1)}
                className={cn(
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  currentPage === i + 1
                    ? 'z-10 bg-primary-50 bg-bg-primary-900/20 border-primary-500 text-primary-600 bg-text-primary-400'
                    : 'bg-white bg-bg-gray-900 border-gray-300 bg-border-gray-700 text-gray-500 bg-text-gray-400 hover:bg-gray-50 bg-hover:bg-gray-800'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-gray-300 bg-border-gray-700 bg-white bg-bg-gray-900 text-sm font-medium text-gray-500 bg-text-gray-400 hover:bg-gray-50 bg-hover:bg-gray-800 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
