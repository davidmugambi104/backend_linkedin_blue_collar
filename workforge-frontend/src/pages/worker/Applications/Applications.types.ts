import { Application } from '@types';

export interface ApplicationsPageFilters {
  search?: string;
  status?: string;
}

export interface ApplicationsPageState {
  filters: ApplicationsPageFilters;
  pageIndex: number;
  pageSize: number;
}
