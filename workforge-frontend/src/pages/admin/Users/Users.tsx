import React, { useState, useMemo } from 'react';
import { UsersIcon, UserGroupIcon, UserMinusIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { AdminTable } from '@components/admin/tables/AdminTable/AdminTable';
import { StatusBadge } from '@components/admin/common/StatusBadge/StatusBadge';
import { Input } from '@components/ui/Input';
import { useAdminUsers } from '@hooks/useAdmin';
import { formatDate } from '@lib/utils/format';
import type { Column } from '@components/admin/tables/AdminTable/AdminTable.types';

interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'worker' | 'employer';
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

const Users: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'worker' | 'employer'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const { data: usersData, isLoading, error } = useAdminUsers({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
  });
  const allUsers: User[] = (usersData?.users || []) as User[];
  const filteredUsers = useMemo(() => allUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
  }), [allUsers, searchQuery]);
  const stats = useMemo(() => ({
    total: allUsers.length,
    active: allUsers.filter(u => u.status === 'active').length,
    suspended: allUsers.filter(u => u.status === 'suspended').length,
    banned: allUsers.filter(u => u.status === 'banned').length,
  }), [allUsers]);
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      accessor: (user) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">{user.first_name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="ml-3"><div className="font-medium text-gray-900 dark:text-white">{user.first_name} {user.last_name}</div><div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div></div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'role',
      header: 'Type',
      accessor: (user) => <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>,
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user) => {
        const statusMap: Record<string, 'active' | 'suspended' | 'banned' | 'completed'> = { active: 'active', suspended: 'suspended', banned: 'banned' };
        return <StatusBadge status={statusMap[user.status] || 'active'}>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</StatusBadge>;
      },
      sortable: true,
    },
    { key: 'created_at', header: 'Joined', accessor: (user) => formatDate(user.created_at), sortable: true },
    { key: 'updated_at', header: 'Last Activity', accessor: (user) => user.updated_at ? formatDate(user.updated_at) : 'N/A' },
  ];
  if (error) {
    return (
      <AdminLayout>
        <div className="bg-rose-100/50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-6">
          <p className="text-rose-600 dark:text-rose-400">Error loading users: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor and manage platform users</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.total} icon={UsersIcon} loading={isLoading} />
        <StatCard title="Active" value={stats.active} trend="up" change={12} icon={UserGroupIcon} loading={isLoading} />
        <StatCard title="Suspended" value={stats.suspended} icon={UserMinusIcon} loading={isLoading} />
        <StatCard title="Banned" value={stats.banned} icon={ShieldExclamationIcon} loading={isLoading} />
      </div>
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 space-y-4">
        <div className="max-w-md"><Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-xl" /></div>
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'suspended', 'banned'].map(status => (
            <button key={`status-${status}`} onClick={() => setFilterStatus(status as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'worker', 'employer'].map(role => (
            <button key={`role-${role}`} onClick={() => setFilterRole(role as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterRole === role ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <AdminTable columns={columns} data={filteredUsers} loading={isLoading} sortConfig={sortConfig} onSort={(config) => setSortConfig(config)} emptyState={<div className="text-center py-8 text-gray-500">No users matching your filters</div>} />
    </AdminLayout>
  );
};
export default Users;
