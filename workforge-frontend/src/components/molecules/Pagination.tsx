import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@utils/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPageChange(value)}
          className={cn(
            'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm',
            value === page ? 'border-primary-blue bg-primary-blue text-white' : 'border-gray-300 bg-white text-gray-700',
          )}
        >
          {value}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
};
