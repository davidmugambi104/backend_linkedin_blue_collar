/// <reference types="vitest" />
/// <reference types="vitest/globals" />
/**
 * DataTable Component Tests
 * 
 * Comprehensive test suite following Google testing standards.
 * Tests rendering, interaction, accessibility, and edge cases.
 * 
 * @module DataTable.test
 */

import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations as any);

// Test data
interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const testUsers: TestUser[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
];

const testColumns: DataTableColumn<TestUser>[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', enableSorting: true },
  { id: 'email', header: 'Email', accessorKey: 'email', enableSorting: true },
  { id: 'role', header: 'Role', accessorKey: 'role' },
];

describe('DataTable', () => {
  describe('Rendering', () => {
    it('renders table with data', () => {
      render(<DataTable columns={testColumns} data={testUsers} />);
      
      // Check headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      
      // Check data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(
        <DataTable
          columns={testColumns}
          data={[]}
          emptyMessage="No users found"
        />
      );
      
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(
        <DataTable columns={testColumns} data={[]} isLoading skeletonRows={3} />
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading data')).toBeInTheDocument();
    });

    it('renders error state', () => {
      const error = new Error('Network error');
      render(<DataTable columns={testColumns} data={[]} error={error} />);
      
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('applies className prop', () => {
      const { container } = render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          className="custom-class"
        />
      );
      
      const tableContainer = container.firstChild as HTMLElement;
      expect(tableContainer).toHaveClass('custom-class');
    });

    it('renders with different variants', () => {
      const { rerender, container } = render(
        <DataTable columns={testColumns} data={testUsers} variant="striped" />
      );
      
      expect(container.firstChild).toBeInTheDocument();
      
      rerender(
        <DataTable columns={testColumns} data={testUsers} variant="bordered" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender, container } = render(
        <DataTable columns={testColumns} data={testUsers} size="sm" />
      );
      
      expect(container.firstChild).toBeInTheDocument();
      
      rerender(<DataTable columns={testColumns} data={testUsers} size="lg" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts data when column header is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={testUsers} enableSorting />
      );
      
      const nameHeader = screen.getByRole('button', { name: /name/i });
      
      // First click - ascending sort
      await user.click(nameHeader);
      
      const rows = screen.getAllByRole('row').slice(1); // Skip header row
      expect(within(rows[0]).getByText('Bob Johnson')).toBeInTheDocument();
      
      // Second click - descending sort
      await user.click(nameHeader);
      
      const rowsDesc = screen.getAllByRole('row').slice(1);
      expect(within(rowsDesc[0]).getByText('John Doe')).toBeInTheDocument();
    });

    it('indicates sort direction with icons', async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={testUsers} enableSorting />
      );
      
      const nameHeader = screen.getByRole('button', { name: /name/i });
      
      // Click to sort ascending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Click to sort descending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('handles keyboard navigation for sorting', async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={testUsers} enableSorting />
      );
      
      const nameHeader = screen.getByRole('button', { name: /name/i });
      nameHeader.focus();
      
      // Press Enter to sort
      await user.keyboard('{Enter}');
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Press Space to sort again
      await user.keyboard(' ');
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });
  });

  describe('Pagination', () => {
    const manyUsers = Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: 'User',
    }));

    it('renders pagination controls', () => {
      render(
        <DataTable
          columns={testColumns}
          data={manyUsers}
          enablePagination
          initialPagination={{ pageIndex: 0, pageSize: 10 }}
        />
      );
      
      expect(screen.getByText(/showing.*1.*to.*10.*of.*50/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    });

    it('navigates between pages', async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          columns={testColumns}
          data={manyUsers}
          enablePagination
          initialPagination={{ pageIndex: 0, pageSize: 10 }}
        />
      );
      
      // Check first page
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();
      
      // Go to next page
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      
      // Check second page
      await waitFor(() => {
        expect(screen.queryByText('User 1')).not.toBeInTheDocument();
        expect(screen.getByText('User 11')).toBeInTheDocument();
      });
    });

    it('disables previous button on first page', () => {
      render(
        <DataTable
          columns={testColumns}
          data={manyUsers}
          enablePagination
          initialPagination={{ pageIndex: 0, pageSize: 10 }}
        />
      );
      
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
    });

    it('changes page size', async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          columns={testColumns}
          data={manyUsers}
          enablePagination
          initialPagination={{ pageIndex: 0, pageSize: 10 }}
        />
      );
      
      const pageSizeSelect = screen.getByLabelText('Items per page');
      
      await user.selectOptions(pageSizeSelect, '20');
      
      await waitFor(() => {
        expect(screen.getByText(/showing.*1.*to.*20.*of.*50/i)).toBeInTheDocument();
      });
    });
  });

  describe('Row Selection', () => {
    it('renders selection checkboxes', () => {
      render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          enableRowSelection
          enableMultiRowSelection
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(testUsers.length + 1); // +1 for select all
    });

    it('toggles individual row selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          enableRowSelection
          onSelectionChange={onSelectionChange}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Skip "select all"
      
      await user.click(firstRowCheckbox);
      
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' })
        ])
      );
    });

    it('toggles all rows selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          enableRowSelection
          enableMultiRowSelection
          onSelectionChange={onSelectionChange}
        />
      );
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      
      await user.click(selectAllCheckbox);
      
      expect(onSelectionChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' }),
          expect.objectContaining({ id: '3' }),
        ])
      );
    });
  });

  describe('Row Interaction', () => {
    it('calls onRowClick when row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      
      render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          onRowClick={onRowClick}
        />
      );
      
      const rows = screen.getAllByRole('row').slice(1); // Skip header
      await user.click(rows[0]);
      
      expect(onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          original: expect.objectContaining({ name: 'John Doe' }),
        })
      );
    });
  });

  describe('Custom Cell Rendering', () => {
    it('renders custom cell content', () => {
      const columnsWithCustomCell: DataTableColumn<TestUser>[] = [
        {
          id: 'name',
          header: 'Name',
          accessorKey: 'name',
          cell: ({ value }) => <strong data-testid="custom-cell">{value as string}</strong>,
        },
      ];
      
      render(<DataTable columns={columnsWithCustomCell} data={testUsers} />);
      
      expect(screen.getByTestId('custom-cell')).toBeInTheDocument();
      expect(screen.getByTestId('custom-cell')).toHaveTextContent('John Doe');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          aria-label="Users table"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels', () => {
      render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          aria-label="Test table"
        />
      );
      
      expect(screen.getByRole('region', { name: 'Test table' })).toBeInTheDocument();
    });

    it('has proper table semantics', () => {
      render(<DataTable columns={testColumns} data={testUsers} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Check for proper row count (header + data rows)
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(testUsers.length + 1);
    });

    it('has keyboard-accessible sort buttons', () => {
      render(
        <DataTable columns={testColumns} data={testUsers} enableSorting />
      );
      
      const sortButtons = screen.getAllByRole('button');
      sortButtons.forEach((button) => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty column array', () => {
      render(<DataTable columns={[]} data={testUsers} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles null values in data', () => {
      const dataWithNull = [
        { id: '1', name: null, email: 'test@example.com', role: 'User' },
      ] as any;
      
      render(<DataTable columns={testColumns} data={dataWithNull} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles custom getRowId', () => {
      const customGetRowId = vi.fn((user: TestUser) => `custom-${user.email}`);
      
      render(
        <DataTable
          columns={testColumns}
          data={testUsers}
          getRowId={customGetRowId}
        />
      );
      
      expect(customGetRowId).toHaveBeenCalled();
    });

    it('handles very large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'User',
      }));
      
      const { container } = render(
        <DataTable
          columns={testColumns}
          data={largeDataset}
          enablePagination
          initialPagination={{ pageIndex: 0, pageSize: 50 }}
        />
      );
      
      // Should only render current page
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBeLessThanOrEqual(50);
    });
  });
});
