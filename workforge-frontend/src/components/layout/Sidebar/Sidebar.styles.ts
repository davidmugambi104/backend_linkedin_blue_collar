import { cva } from 'class-variance-authority';

export const sidebarVariants = cva(
  'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 lg:w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
  {
    variants: {
      variant: {
        default: 'lg:w-72',
        compact: 'lg:w-20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const sidebarPanelVariants = cva(
  'flex h-full w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
  {
    variants: {
      variant: {
        default: 'w-72',
        compact: 'w-20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const sidebarHeaderVariants = cva(
  'flex items-center gap-3 px-6 py-6 border-b border-slate-200 dark:border-slate-800',
  {
    variants: {
      variant: {
        default: 'px-6',
        compact: 'px-4 justify-center',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const sidebarNavVariants = cva('flex-1 overflow-y-auto px-4 py-6', {
  variants: {
    variant: {
      default: 'px-4',
      compact: 'px-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const sidebarSectionLabelVariants = cva(
  'px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
  {
    variants: {
      variant: {
        default: 'mb-2',
        compact: 'sr-only',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const sidebarItemVariants = cva(
  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
  {
    variants: {
      active: {
        true: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        false: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
      },
      variant: {
        default: 'justify-start',
        compact: 'justify-center px-2',
      },
    },
    defaultVariants: {
      active: false,
      variant: 'default',
    },
  }
);

export const sidebarFooterVariants = cva(
  'border-t border-slate-200 dark:border-slate-800 px-6 py-4',
  {
    variants: {
      variant: {
        default: 'px-6',
        compact: 'px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
