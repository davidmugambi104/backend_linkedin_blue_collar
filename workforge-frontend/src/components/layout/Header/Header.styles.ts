import { cva } from 'class-variance-authority';

export const headerVariants = cva(
  'sticky top-0 z-40 w-full border-b transition-all duration-200',
  {
    variants: {
      scrolled: {
        true: 'bg-white/95 backdrop-blur-md shadow-sm border-slate-200 dark:bg-slate-900/95 dark:border-slate-800',
        false: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
      },
    },
    defaultVariants: {
      scrolled: false,
    },
  }
);

export const headerContainerVariants = cva('container relative flex h-16 items-center justify-between');

export const headerTitleVariants = cva('text-xl font-semibold text-slate-900 dark:text-white');

export const headerSubtitleVariants = cva('text-xs text-slate-500 dark:text-slate-400');
