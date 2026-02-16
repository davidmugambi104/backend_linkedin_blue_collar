import { useMemo, useState, useCallback } from 'react';
import { useWorkerApplications } from '@hooks/useApplications';
import { Application } from '@types';

export const useApplicationsPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as string | undefined,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch applications data
  const { data: allApplications = [], isLoading, error } = useWorkerApplications();

  // Filter applications
  const filteredApplications = useMemo(() => {
    let result = allApplications as Application[];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((app: Application) =>
        app.job?.title?.toLowerCase().includes(searchLower) ||
        app.job?.employer?.company_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((app: Application) => app.status === filters.status);
    }

    // Sort by most recent first
    result.sort(
      (a: Application, b: Application) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return result;
  }, [allApplications, filters]);

  // Paginate results
  const paginatedApplications = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return filteredApplications.slice(start, end);
  }, [filteredApplications, pageIndex, pageSize]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPageIndex(0);
    },
    []
  );

  const totalPages = Math.ceil(filteredApplications.length / pageSize);

  return {
    filters,
    pageIndex,
    pageSize,
    applications: paginatedApplications,
    filteredApplications,
    isLoading,
    error,
    totalPages,
    totalCount: filteredApplications.length,
    handleFilterChange,
    setPageIndex,
    setPageSize,
  };
};
