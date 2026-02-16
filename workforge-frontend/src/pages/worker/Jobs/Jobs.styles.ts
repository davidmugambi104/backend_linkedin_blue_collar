import { cva } from 'class-variance-authority';

export const jobsHeaderVariants = cva(
  'mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
);

export const jobsFilterVariants = cva('grid grid-cols-1 gap-4 mb-6 lg:grid-cols-4');

export const jobsEmptyVariants = cva(
  'flex flex-col items-center justify-center py-12 text-center'
);
