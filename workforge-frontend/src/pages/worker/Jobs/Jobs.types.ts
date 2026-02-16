import { Job, PayType } from '@types';

export interface JobsPageFilters {
  search?: string;
  minPay?: number;
  maxPay?: number;
  payType?: PayType;
  skillId?: number;
}

export interface JobsPageSortState {
  id: 'title' | 'pay_min' | 'created_at' | null;
  desc: boolean;
}

export interface JobsPageState {
  filters: JobsPageFilters;
  sort: JobsPageSortState;
  pageIndex: number;
  pageSize: number;
  selectedJobs: Job[];
}
