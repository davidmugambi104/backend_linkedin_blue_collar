/**
 * useDataTable Hook
 * 
 * Production-grade custom hook containing all DataTable business logic.
 * Separates logic from presentation for better testability and reusability.
 * 
 * @module useDataTable
 */

import { useState, useMemo, useCallback, useId } from 'react';
import type {
  DataTableOptions,
  DataTableColumn,
  DataTableRow,
  DataTableSortingState,
  DataTablePaginationState,
  DataTableColumnVisibilityState,
  DataTableRowSelectionState,
  DataTableInstance,
} from './DataTable.types';

/**
 * Main DataTable hook implementing all table logic
 * 
 * @example
 * ```tsx
 * const table = useDataTable({
 *   columns: [
 *     { id: 'name', header: 'Name', accessorKey: 'name' },
 *     { id: 'email', header: 'Email', accessorKey: 'email' },
 *   ],
 *   data: users,
 *   enableSorting: true,
 *   enablePagination: true,
 * });
 * ```
 */
export function useDataTable<TData = unknown>(
  options: DataTableOptions<TData>
): DataTableInstance<TData> {
  const {
    columns,
    data,
    enableRowSelection = false,
    enableMultiRowSelection = true,
    enableSorting = true,
    enableMultiSort = false,
    enablePagination = false,
    enableColumnFiltering = false,
    enableGlobalFiltering = false,
    enableColumnVisibility = false,
    initialPagination = { pageIndex: 0, pageSize: 10 },
    initialSorting = [],
    initialColumnVisibility = {},
    getRowId,
    onRowClick,
    onSelectionChange,
  } = options;

  // Generate stable IDs for ARIA attributes
  const tableId = useId();

  // State management
  const [sorting, setSorting] = useState<DataTableSortingState[]>(initialSorting);
  const [pagination, setPagination] = useState<DataTablePaginationState>(initialPagination);
  const [columnVisibility, setColumnVisibility] = useState<DataTableColumnVisibilityState>(
    initialColumnVisibility
  );
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState<string>('');

  /**
   * Generate unique row ID
   * Uses custom getRowId or falls back to index
   */
  const generateRowId = useCallback(
    (row: TData, index: number): string => {
      if (getRowId) {
        return getRowId(row, index);
      }
      // Fallback: use index or try to extract 'id' property
      if (row && typeof row === 'object' && 'id' in row) {
        return String((row as any).id);
      }
      return `row-${index}`;
    },
    [getRowId]
  );

  /**
   * Get cell value from row using accessor
   */
  const getCellValue = useCallback(
    (row: TData, column: DataTableColumn<TData>): unknown => {
      if (column.accessorFn) {
        return column.accessorFn(row);
      }
      if (column.accessorKey && row && typeof row === 'object') {
        return (row as any)[column.accessorKey];
      }
      return undefined;
    },
    []
  );

  /**
   * Apply global filter to data
   */
  const filteredData = useMemo(() => {
    if (!enableGlobalFiltering || !globalFilter) {
      return data;
    }

    const lowerFilter = globalFilter.toLowerCase();
    return data.filter((row) => {
      return columns.some((column) => {
        const value = getCellValue(row, column);
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowerFilter);
      });
    });
  }, [data, globalFilter, enableGlobalFiltering, columns, getCellValue]);

  /**
   * Apply sorting to data
   */
  const sortedData = useMemo(() => {
    if (!enableSorting || sorting.length === 0) {
      return filteredData;
    }

    const sorted = [...filteredData];

    sorted.sort((rowA, rowB) => {
      for (const sort of sorting) {
        const column = columns.find((col) => col.id === sort.id);
        if (!column) continue;

        const valueA = getCellValue(rowA, column);
        const valueB = getCellValue(rowB, column);

        // Handle null/undefined
        if (valueA == null && valueB == null) continue;
        if (valueA == null) return sort.desc ? -1 : 1;
        if (valueB == null) return sort.desc ? 1 : -1;

        // Compare values
        let result = 0;
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          result = valueA.localeCompare(valueB);
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
          result = valueA - valueB;
        } else {
          result = String(valueA).localeCompare(String(valueB));
        }

        if (result !== 0) {
          return sort.desc ? -result : result;
        }

        // If values are equal and multi-sort is disabled, stop
        if (!enableMultiSort) break;
      }

      return 0;
    });

    return sorted;
  }, [filteredData, sorting, enableSorting, enableMultiSort, columns, getCellValue]);

  /**
   * Apply pagination to data
   */
  const paginatedData = useMemo(() => {
    if (!enablePagination) {
      return sortedData;
    }

    const { pageIndex, pageSize } = pagination;
    const start = pageIndex * pageSize;
    const end = start + pageSize;

    return sortedData.slice(start, end);
  }, [sortedData, pagination, enablePagination]);

  /**
   * Calculate total page count
   */
  const pageCount = useMemo(() => {
    if (!enablePagination) return 1;
    return Math.ceil(sortedData.length / pagination.pageSize);
  }, [sortedData.length, pagination.pageSize, enablePagination]);

  /**
   * Process data into rows with metadata
   */
  const rows = useMemo<DataTableRow<TData>[]>(() => {
    return paginatedData.map((originalRow, index) => {
      const rowId = generateRowId(originalRow, index);
      const isSelected = rowSelection[rowId] === true;

      return {
        id: rowId,
        original: originalRow,
        cells: columns.map((column) => ({
          value: getCellValue(originalRow, column),
          columnId: column.id,
        })),
        isSelected,
        isExpanded: false,
      };
    });
  }, [paginatedData, columns, rowSelection, generateRowId, getCellValue]);

  /**
   * Get selected rows
   */
  const selectedRows = useMemo(() => {
    return rows.filter((row) => rowSelection[row.id] === true);
  }, [rows, rowSelection]);

  /**
   * Check if all rows are selected
   */
  const isAllRowsSelected = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every((row) => rowSelection[row.id] === true);
  }, [rows, rowSelection]);

  /**
   * Check if some (but not all) rows are selected
   */
  const isSomeRowsSelected = useMemo(() => {
    const selectedCount = rows.filter((row) => rowSelection[row.id] === true).length;
    return selectedCount > 0 && selectedCount < rows.length;
  }, [rows, rowSelection]);

  /**
   * Toggle single row selection
   */
  const toggleRowSelection = useCallback(
    (rowId: string) => {
      if (!enableRowSelection) return;

      setRowSelection((prev) => {
        const newSelection = { ...prev };

        if (!enableMultiRowSelection) {
          // Single selection mode: clear others
          Object.keys(newSelection).forEach((key) => {
            newSelection[key] = false;
          });
        }

        newSelection[rowId] = !prev[rowId];

        // Call onSelectionChange callback
        if (onSelectionChange) {
          const selected = rows.filter((row) => newSelection[row.id] === true);
          onSelectionChange(selected);
        }

        return newSelection;
      });
    },
    [enableRowSelection, enableMultiRowSelection, onSelectionChange, rows]
  );

  /**
   * Toggle all rows selection
   */
  const toggleAllRowsSelection = useCallback(() => {
    if (!enableRowSelection || !enableMultiRowSelection) return;

    setRowSelection((prev) => {
      const allSelected = rows.every((row) => prev[row.id] === true);
      const newSelection: DataTableRowSelectionState = {};

      rows.forEach((row) => {
        newSelection[row.id] = !allSelected;
      });

      // Call onSelectionChange callback
      if (onSelectionChange) {
        const selected = rows.filter((row) => newSelection[row.id] === true);
        onSelectionChange(selected);
      }

      return newSelection;
    });
  }, [enableRowSelection, enableMultiRowSelection, rows, onSelectionChange]);

  /**
   * Sort by column
   */
  const sortBy = useCallback(
    (columnId: string) => {
      if (!enableSorting) return;

      const column = columns.find((col) => col.id === columnId);
      if (!column || column.enableSorting === false) return;

      setSorting((prev) => {
        const existingSort = prev.find((s) => s.id === columnId);

        if (!existingSort) {
          // Add new sort
          if (enableMultiSort) {
            return [...prev, { id: columnId, desc: false }];
          }
          return [{ id: columnId, desc: false }];
        }

        // Toggle sort direction or remove
        if (!existingSort.desc) {
          // Change to descending
          return prev.map((s) => (s.id === columnId ? { ...s, desc: true } : s));
        } else {
          // Remove sort
          return prev.filter((s) => s.id !== columnId);
        }
      });
    },
    [enableSorting, enableMultiSort, columns]
  );

  /**
   * Pagination: Go to previous page
   */
  const previousPage = useCallback(() => {
    if (!enablePagination) return;
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(0, prev.pageIndex - 1),
    }));
  }, [enablePagination]);

  /**
   * Pagination: Go to next page
   */
  const nextPage = useCallback(() => {
    if (!enablePagination) return;
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
    }));
  }, [enablePagination, pageCount]);

  /**
   * Pagination: Go to specific page
   */
  const gotoPage = useCallback(
    (page: number) => {
      if (!enablePagination) return;
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(0, Math.min(pageCount - 1, page)),
      }));
    },
    [enablePagination, pageCount]
  );

  /**
   * Pagination: Set page size
   */
  const setPageSize = useCallback(
    (size: number) => {
      if (!enablePagination) return;
      setPagination((prev) => ({
        pageIndex: 0, // Reset to first page
        pageSize: size,
      }));
    },
    [enablePagination]
  );

  /**
   * Check if can go to previous page
   */
  const canPreviousPage = useMemo(() => {
    if (!enablePagination) return false;
    return pagination.pageIndex > 0;
  }, [enablePagination, pagination.pageIndex]);

  /**
   * Check if can go to next page
   */
  const canNextPage = useMemo(() => {
    if (!enablePagination) return false;
    return pagination.pageIndex < pageCount - 1;
  }, [enablePagination, pagination.pageIndex, pageCount]);

  // Return complete table instance
  return {
    columns,
    rows,
    sorting,
    setSorting,
    pagination,
    setPagination,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    globalFilter,
    setGlobalFilter,
    selectedRows,
    toggleRowSelection,
    toggleAllRowsSelection,
    isAllRowsSelected,
    isSomeRowsSelected,
    pageCount,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    gotoPage,
    setPageSize,
    sortBy,
    options,
  };
}
