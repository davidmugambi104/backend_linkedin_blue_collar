/**
 * DataTable Styles
 * 
 * CVA (class-variance-authority) style definitions for DataTable variants.
 * Provides type-safe, composable styling system.
 * 
 * @module DataTable.styles
 */

import { cva, type VariantProps } from 'class-variance-authority';

/**
 * DataTable root container styles
 */
export const dataTableVariants = cva(
  // Base styles applied to all variants
  [
    'relative',
    'w-full',
    'overflow-auto',
    'rounded-2xl',
    'bg-white',
    'dark:bg-slate-900',
    'border',
    'border-slate-200',
    'dark:border-slate-800',
  ],
  {
    variants: {
      variant: {
        default: '',
        bordered: [
          'border-2',
        ],
        striped: '',
        compact: '',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/**
 * DataTable <table> element styles
 */
export const dataTableElementVariants = cva(
  [
    'w-full',
    'border-collapse',
    'text-left',
  ],
  {
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * DataTable header row styles
 */
export const dataTableHeaderRowVariants = cva(
  [
    'border-b',
    'border-slate-200',
    'dark:border-slate-800',
    'bg-slate-50',
    'dark:bg-slate-800/50',
  ],
  {
    variants: {
      sticky: {
        true: [
          'sticky',
          'top-0',
          'z-10',
          'backdrop-blur-sm',
          'bg-slate-50/95',
          'dark:bg-slate-800/95',
        ],
        false: '',
      },
    },
    defaultVariants: {
      sticky: false,
    },
  }
);

/**
 * DataTable header cell styles
 */
export const dataTableHeaderCellVariants = cva(
  [
    'px-6',
    'py-3',
    'text-left',
    'font-semibold',
    'text-slate-600',
    'dark:text-slate-400',
    'uppercase',
    'tracking-wider',
    'transition-colors',
  ],
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-xs',
        md: 'px-6 py-3 text-xs',
        lg: 'px-8 py-4 text-sm',
      },
      sortable: {
        true: [
          'cursor-pointer',
          'select-none',
          'hover:text-slate-900',
          'dark:hover:text-slate-200',
          'hover:bg-slate-100',
          'dark:hover:bg-slate-700/50',
        ],
        false: '',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      size: 'md',
      sortable: false,
      align: 'left',
    },
  }
);

/**
 * DataTable body row styles
 */
export const dataTableBodyRowVariants = cva(
  [
    'border-b',
    'border-slate-200',
    'dark:border-slate-800',
    'transition-colors',
  ],
  {
    variants: {
      variant: {
        default: [
          'hover:bg-slate-50',
          'dark:hover:bg-slate-800/50',
        ],
        striped: '',
        bordered: '',
        compact: '',
      },
      striped: {
        true: 'odd:bg-slate-50/50 dark:odd:bg-slate-800/30',
        false: '',
      },
      selected: {
        true: [
          'bg-blue-50',
          'dark:bg-blue-900/20',
          'hover:bg-blue-100',
          'dark:hover:bg-blue-900/30',
        ],
        false: '',
      },
      clickable: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      striped: false,
      selected: false,
      clickable: false,
    },
  }
);

/**
 * DataTable body cell styles
 */
export const dataTableBodyCellVariants = cva(
  [
    'px-6',
    'py-4',
    'text-slate-900',
    'dark:text-slate-100',
  ],
  {
    variants: {
      size: {
        sm: 'px-3 py-2',
        md: 'px-6 py-4',
        lg: 'px-8 py-6',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      size: 'md',
      align: 'left',
    },
  }
);

/**
 * DataTable checkbox styles
 */
export const dataTableCheckboxVariants = cva(
  [
    'h-4',
    'w-4',
    'rounded',
    'border-2',
    'border-slate-300',
    'dark:border-slate-600',
    'bg-white',
    'dark:bg-slate-900',
    'transition-all',
    'cursor-pointer',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:ring-offset-2',
    'dark:focus:ring-offset-slate-900',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
  ],
  {
    variants: {
      checked: {
        true: [
          'bg-blue-600',
          'border-blue-600',
          'dark:bg-blue-600',
          'dark:border-blue-600',
        ],
        false: '',
      },
      indeterminate: {
        true: [
          'bg-blue-600',
          'border-blue-600',
        ],
        false: '',
      },
    },
    defaultVariants: {
      checked: false,
      indeterminate: false,
    },
  }
);

/**
 * DataTable empty state styles
 */
export const dataTableEmptyStateVariants = cva(
  [
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'py-16',
    'px-4',
    'text-center',
  ]
);

/**
 * DataTable loading skeleton styles
 */
export const dataTableSkeletonVariants = cva(
  [
    'animate-pulse',
    'bg-slate-200',
    'dark:bg-slate-700',
    'rounded',
  ],
  {
    variants: {
      size: {
        sm: 'h-4',
        md: 'h-5',
        lg: 'h-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * DataTable pagination container styles
 */
export const dataTablePaginationVariants = cva(
  [
    'flex',
    'items-center',
    'justify-between',
    'px-6',
    'py-4',
    'border-t',
    'border-slate-200',
    'dark:border-slate-800',
    'bg-white',
    'dark:bg-slate-900',
  ]
);

/**
 * DataTable pagination button styles
 */
export const dataTablePaginationButtonVariants = cva(
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'px-4',
    'py-2',
    'text-sm',
    'font-medium',
    'rounded-xl',
    'transition-all',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:ring-offset-2',
    'dark:focus:ring-offset-slate-900',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white',
          'text-slate-700',
          'border',
          'border-slate-300',
          'hover:bg-slate-50',
          'dark:bg-slate-800',
          'dark:text-slate-200',
          'dark:border-slate-700',
          'dark:hover:bg-slate-700',
        ],
        primary: [
          'bg-blue-600',
          'text-white',
          'hover:bg-blue-700',
          'shadow-sm',
        ],
      },
      disabled: {
        true: [
          'opacity-50',
          'cursor-not-allowed',
          'pointer-events-none',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      disabled: false,
    },
  }
);

/**
 * DataTable toolbar styles
 */
export const dataTableToolbarVariants = cva(
  [
    'flex',
    'items-center',
    'justify-between',
    'gap-4',
    'px-6',
    'py-4',
    'border-b',
    'border-slate-200',
    'dark:border-slate-800',
    'bg-white',
    'dark:bg-slate-900',
  ]
);

/**
 * DataTable search input styles
 */
export const dataTableSearchInputVariants = cva(
  [
    'flex',
    'h-10',
    'w-full',
    'max-w-sm',
    'rounded-xl',
    'border',
    'border-slate-300',
    'bg-white',
    'px-4',
    'py-2',
    'text-sm',
    'text-slate-900',
    'placeholder:text-slate-400',
    'transition-all',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:border-transparent',
    'dark:border-slate-600',
    'dark:bg-slate-900',
    'dark:text-white',
    'dark:placeholder:text-slate-500',
  ]
);

/**
 * Export variant prop types
 */
export type DataTableVariantProps = VariantProps<typeof dataTableVariants>;
export type DataTableHeaderCellVariantProps = VariantProps<typeof dataTableHeaderCellVariants>;
export type DataTableBodyRowVariantProps = VariantProps<typeof dataTableBodyRowVariants>;
export type DataTableBodyCellVariantProps = VariantProps<typeof dataTableBodyCellVariants>;
export type DataTablePaginationButtonVariantProps = VariantProps<
  typeof dataTablePaginationButtonVariants
>;
