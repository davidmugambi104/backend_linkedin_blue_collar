// workforge-frontend/src/pages/admin/Users/AdminUsers.tsx
import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { AdminTable } from '@components/admin/tables/AdminTable/AdminTable';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { StatusBadge } from '@components/admin/common/StatusBadge/StatusBadge';
import { useAdminUsers } from '@hooks/useAdmin';
import { useBanUser, useUnbanUser } from '@hooks/useAdmin';
import { useAuth } from '@context/AuthContext';
import {
  UsersIcon,
  UserGroupIcon,
  UserMinusIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { Column, SortConfig } from '@components/admin/tables/AdminTable/AdminTable.types';

interface User {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'worker' | 'employer' | 'admin';
  is_active?: boolean;
  created_at: string;
}

export const AdminUsers: React.FC = () => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'worker' | 'employer' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { user: currentUser, isAuthenticated } = useAuth();

  const pageSize = 20;
  const sortParam = `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`;

  const queryParams = {
    page: currentPage,
    limit: pageSize,
    sort: sortParam,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };

  // Fetch real data from API
  const { data, isLoading, error } = useAdminUsers(queryParams);
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  // Show authentication error if not logged in or not admin
  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access the admin panel.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && (error as any)?.response?.status === 403) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldExclamationIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Admin Access Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator privileges to access this page.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const users: User[] = data?.users || [];

  const handleToggleUserStatus = async (user: User) => {
    if (user.role === 'admin' && user.id === currentUser?.id) {
      return;
    }

    if (user.is_active) {
      await banUser.mutateAsync({
        userId: user.id,
        data: {
          reason: 'Suspended by admin',
          duration: 'permanent',
          notify_user: false,
        },
      });
    } else {
      await unbanUser.mutateAsync(user.id);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'username',
      header: 'User',
      accessor: (user) => {
        const displayName = user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
        const initial = displayName.charAt(0).toUpperCase();
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium">
              {initial}
            </div>
            <div className="ml-4">
              <div className="font-medium text-gray-900 dark:text-white">{displayName}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (user) => (
        <span className="capitalize px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">
          {user.role}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user) => <StatusBadge status={user.is_active ? 'active' : 'inactive'} />,
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (user) => (
        <button
          type="button"
          disabled={(banUser.isPending || unbanUser.isPending) || (user.role === 'admin' && user.id === currentUser?.id)}
          onClick={() => handleToggleUserStatus(user)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {user.is_active ? 'Suspend' : 'Reactivate'}
        </button>
      ),
      align: 'right',
    },
    {
      key: 'created_at',
      header: 'Joined',
      accessor: (user) => new Date(user.created_at).toLocaleDateString(),
      align: 'right',
      sortable: true,
    },
  ];

  const sortedUsers = useMemo(() => users, [users]);

  const stats = [
    { title: 'Total Users', value: data?.total || 0, icon: UsersIcon, change: 12, trend: 'up' as const },
    { title: 'Active Users', value: users.filter((u) => u.is_active).length, icon: UserGroupIcon, change: 8, trend: 'up' as const },
    { title: 'Suspended', value: users.filter((u) => !u.is_active).length, icon: UserMinusIcon, change: 5, trend: 'down' as const },
    { title: 'Admins', value: users.filter((u) => u.role === 'admin').length, icon: ShieldExclamationIcon, change: 2, trend: 'up' as const },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          User Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor, manage, and moderate platform users
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} loading={isLoading} />
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setCurrentPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search by username or email"
            className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
          />

          <select
            value={roleFilter}
            onChange={(event) => {
              setCurrentPage(1);
              setRoleFilter(event.target.value as 'all' | 'worker' | 'employer' | 'admin');
            }}
            className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="worker">Worker</option>
            <option value="employer">Employer</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setCurrentPage(1);
              setStatusFilter(event.target.value as 'all' | 'active' | 'inactive');
            }}
            className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setCurrentPage(1);
              setSearch('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
            className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 px-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Reset filters
          </button>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={sortedUsers}
        sortConfig={sortConfig}
        onSort={(nextSort) => {
          setCurrentPage(1);
          setSortConfig(nextSort);
        }}
        loading={isLoading}
        pagination={{
          currentPage,
          totalPages: data?.pages || 1,
          totalItems: data?.total || 0,
          pageSize,
        }}
        onPageChange={setCurrentPage}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
