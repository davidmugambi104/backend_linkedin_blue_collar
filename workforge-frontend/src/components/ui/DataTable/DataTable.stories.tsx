/**
 * DataTable Storybook Stories
 * 
 * Comprehensive documentation and examples for the DataTable component.
 * Covers all variants, states, and use cases.
 * 
 * @module DataTable.stories
 */

import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './DataTable';
import type { DataTableColumn, DataTableRow, DataTableRootProps } from './DataTable.types';

// Sample data types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    joinedAt: '2023-12-10',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'Manager',
    status: 'active',
    joinedAt: '2024-03-05',
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'User',
    status: 'active',
    joinedAt: '2024-01-28',
  },
];

// Column definitions
const userColumns: DataTableColumn<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    enableSorting: true,
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    enableSorting: true,
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    enableSorting: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ value }) => (
      <span
        className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${
            value === 'active'
              ? 'bg-green-100 text-green-800 bg-bg-green-900/30 bg-text-green-400'
              : 'bg-slate-100 text-slate-800 bg-bg-slate-800 bg-text-slate-400'
          }
        `}
      >
        {value as string}
      </span>
    ),
  },
  {
    id: 'joinedAt',
    header: 'Joined',
    accessorKey: 'joinedAt',
    enableSorting: true,
    cell: ({ value }) => new Date(value as string).toLocaleDateString(),
  },
];

const UserDataTable = (props: DataTableRootProps<User>) => <DataTable {...props} />;

// Storybook metadata
const meta: Meta<typeof UserDataTable> = {
  title: 'Components/DataTable',
  component: UserDataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Production-grade DataTable component with sorting, filtering, pagination, and row selection. Built with accessibility and performance in mind.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'striped', 'compact'],
      description: 'Visual variant of the table',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the table cells and text',
    },
    enableSorting: {
      control: 'boolean',
      description: 'Enable column sorting',
    },
    enablePagination: {
      control: 'boolean',
      description: 'Enable pagination controls',
    },
    enableRowSelection: {
      control: 'boolean',
      description: 'Enable row selection with checkboxes',
    },
    enableGlobalFiltering: {
      control: 'boolean',
      description: 'Enable global search/filter',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserDataTable>;

/**
 * Default table with sorting and basic features
 */
export const Default: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    enableSorting: true,
    'aria-label': 'Users table',
  },
};

/**
 * Table with pagination enabled
 */
export const WithPagination: Story = {
  args: {
    columns: userColumns,
    data: Array.from({ length: 50 }, (_, i) => ({
      ...sampleUsers[i % sampleUsers.length],
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
    })),
    enableSorting: true,
    enablePagination: true,
    initialPagination: {
      pageIndex: 0,
      pageSize: 10,
    },
  },
};

/**
 * Table with row selection (single and multi)
 */
export const WithRowSelection: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    enableSorting: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onSelectionChange: (selectedRows: DataTableRow<User>[]) => {
      console.log('Selected rows:', selectedRows);
    },
  },
};

/**
 * Striped variant for better row distinction
 */
export const StripedVariant: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    variant: 'striped',
    enableSorting: true,
  },
};

/**
 * Bordered variant with visible borders
 */
export const BorderedVariant: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    variant: 'bordered',
    enableSorting: true,
  },
};

/**
 * Compact size for dense data display
 */
export const CompactSize: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    size: 'sm',
    enableSorting: true,
    enablePagination: true,
    initialPagination: {
      pageIndex: 0,
      pageSize: 10,
    },
  },
};

/**
 * Large size for better readability
 */
export const LargeSize: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    size: 'lg',
    enableSorting: true,
  },
};

/**
 * Loading state with skeleton rows
 */
export const LoadingState: Story = {
  args: {
    columns: userColumns,
    data: [],
    isLoading: true,
    skeletonRows: 8,
  },
};

/**
 * Empty state when no data
 */
export const EmptyState: Story = {
  args: {
    columns: userColumns,
    data: [],
    emptyMessage: 'No users found',
  },
};

/**
 * Error state
 */
export const ErrorState: Story = {
  args: {
    columns: userColumns,
    data: [],
    error: new Error('Failed to load user data. Please try again.'),
  },
};

/**
 * With sticky header for long scrollable tables
 */
export const StickyHeader: Story = {
  args: {
    columns: userColumns,
    data: Array.from({ length: 100 }, (_, i) => ({
      ...sampleUsers[i % sampleUsers.length],
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
    })),
    enableSorting: true,
    stickyHeader: true,
    maxHeight: '600px',
  },
};

/**
 * Compound component pattern for full customization
 */
export const CompoundComponents: Story = {
  render: () => (
    <DataTable.Root
      columns={userColumns}
      data={sampleUsers}
      enableSorting
      enableRowSelection
      enableGlobalFiltering
    >
      <DataTable.Toolbar enableSearch searchPlaceholder="Search users..." />
      <table className="w-full border-collapse">
        <DataTable.Header sticky />
        <DataTable.Body />
      </table>
      <DataTable.Pagination
        showPageSizeSelector
        showItemCount
        pageSizeOptions={[5, 10, 20]}
      />
    </DataTable.Root>
  ),
};

/**
 * With clickable rows
 */
export const ClickableRows: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    enableSorting: true,
    onRowClick: (row: DataTableRow<User>) => {
      alert(`Clicked user: ${row.original.name}`);
    },
  },
};

/**
 * Kitchen sink - all features enabled
 */
export const KitchenSink: Story = {
  args: {
    columns: userColumns,
    data: Array.from({ length: 100 }, (_, i) => ({
      ...sampleUsers[i % sampleUsers.length],
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
    })),
    variant: 'default',
    size: 'md',
    enableSorting: true,
    enableMultiSort: false,
    enablePagination: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableGlobalFiltering: true,
    initialPagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    stickyHeader: true,
    maxHeight: '600px',
    onRowClick: (row: DataTableRow<User>) => console.log('Row clicked:', row.original),
    onSelectionChange: (rows: DataTableRow<User>[]) => console.log('Selection changed:', rows.length),
  },
};

/**
 * Dark mode showcase
 */
export const DarkMode: Story = {
  args: {
    columns: userColumns,
    data: sampleUsers,
    enableSorting: true,
    enablePagination: true,
    enableRowSelection: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story: ComponentType) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};
