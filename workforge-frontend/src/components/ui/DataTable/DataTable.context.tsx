/**
 * DataTable Context
 * 
 * Context provider for the compound component pattern.
 * Allows sub-components to access table state without prop drilling.
 * 
 * @module DataTable.context
 */

import { createContext, useContext, ReactNode } from 'react';
import type { DataTableInstance } from './DataTable.types';

/**
 * DataTable Context
 * Provides table instance to all child components
 */
const DataTableContext = createContext<DataTableInstance | null>(null);

DataTableContext.displayName = 'DataTableContext';

/**
 * DataTable Context Provider Props
 */
export interface DataTableProviderProps<TData = unknown> {
  value: DataTableInstance<TData>;
  children: ReactNode;
}

/**
 * DataTable Context Provider
 * Wraps the table to provide state to all sub-components
 * 
 * @example
 * ```tsx
 * <DataTableProvider value={tableInstance}>
 *   <DataTableHeader />
 *   <DataTableBody />
 * </DataTableProvider>
 * ```
 */
export function DataTableProvider<TData = unknown>({
  value,
  children,
}: DataTableProviderProps<TData>) {
  return (
    <DataTableContext.Provider value={value as DataTableInstance}>
      {children}
    </DataTableContext.Provider>
  );
}

/**
 * Hook to access DataTable context
 * Must be used within DataTableProvider
 * 
 * @throws {Error} If used outside DataTableProvider
 * 
 * @example
 * ```tsx
 * function CustomCell() {
 *   const table = useDataTableContext();
 *   return <td>{table.sorting.length} sorts active</td>;
 * }
 * ```
 */
export function useDataTableContext<TData = unknown>(): DataTableInstance<TData> {
  const context = useContext(DataTableContext);

  if (!context) {
    throw new Error(
      'useDataTableContext must be used within a DataTableProvider. ' +
      'Did you forget to wrap your component in <DataTable>?'
    );
  }

  return context as DataTableInstance<TData>;
}

/**
 * Optional hook to access DataTable context
 * Returns null if used outside DataTableProvider (doesn't throw)
 * 
 * @example
 * ```tsx
 * function OptionalFeature() {
 *   const table = useDataTableOptionalContext();
 *   if (!table) return null;
 *   return <div>Feature enabled</div>;
 * }
 * ```
 */
export function useDataTableOptionalContext<TData = unknown>(): DataTableInstance<TData> | null {
  const context = useContext(DataTableContext);
  return context as DataTableInstance<TData> | null;
}
