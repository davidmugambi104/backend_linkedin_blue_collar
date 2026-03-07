import { useMemo, useState, useCallback } from 'react';
import { useJobs } from '@hooks/useJobs';

export const useJobsPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    minPay: undefined as number | undefined,
    maxPay: undefined as number | undefined,
    payType: undefined as string | undefined,
  });

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch jobs data
  const { data: allJobs = [], isLoading, error } = useJobs();

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let result = [...(allJobs || [])];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((job: any) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pay filters
    if (filters.minPay !== undefined) {
      result = result.filter((job: any) => (job.pay_min ?? 0) >= filters.minPay!);
    }
    if (filters.maxPay !== undefined) {
      result = result.filter((job: any) => (job.pay_max ?? Infinity) <= filters.maxPay!);
    }

    // Apply pay type filter
    if (filters.payType) {
      result = result.filter((job: any) => job.pay_type === filters.payType);
    }

    // Apply sorting
    if (sortBy === 'title') {
      result.sort((a: any, b: any) => a.title.localeCompare(b.title));
    } else if (sortBy === 'pay') {
      result.sort((a: any, b: any) => (a.pay_min ?? 0) - (b.pay_min ?? 0));
    } else if (sortBy === 'newest') {
      result.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [allJobs, filters, sortBy]);

  // Paginate results
  const paginatedJobs = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return filteredJobs.slice(start, end);
  }, [filteredJobs, pageIndex, pageSize]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPageIndex(0);
    },
    []
  );

  const handleSort = useCallback((field: string) => {
    setSortBy(sortBy === field ? null : field);
    setPageIndex(0);
  }, [sortBy]);

  const totalPages = Math.ceil(filteredJobs.length / pageSize);

  return {
    filters,
    sortBy,
    pageIndex,
    pageSize,
    jobs: paginatedJobs,
    filteredJobs,
    isLoading,
    error,
    totalPages,
    totalCount: filteredJobs.length,
    handleFilterChange,
    handleSort,
    setPageIndex,
    setPageSize,
  };
};
