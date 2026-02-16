import React, { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { useAdminUsers } from '@hooks/useAdmin';
import { formatDate } from '@lib/utils/format';

const Users: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'worker' | 'employer'>('all');

  // Fetch users from API
  const { data: usersData, isLoading, error } = useAdminUsers({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
  });

  const allUsers = usersData?.users || [];

  // Filter by search
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [allUsers, searchQuery]);

  const stats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.status === 'active').length,
    suspended: allUsers.filter(u => u.status === 'suspended').length,
    banned: allUsers.filter(u => u.status === 'banned').length,
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'suspended':
        return <Badge variant="warning">Suspended</Badge>;
      case 'banned':
        return <Badge variant="error">Banned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-600">Error loading users: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor and manage platform users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Suspended</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.suspended}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Banned</p>
          <p className="text-2xl font-bold text-red-600">{stats.banned}</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex space-x-2">
            {['all', 'active', 'suspended', 'banned'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            {['all', 'worker', 'employer'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterRole === role
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </Card>
      )}

      {/* Users Table */}
      {!isLoading && (
        <Card className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">User</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Type</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Joined</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Last Active</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4">{statusBadge(user.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.updated_at ? formatDate(user.updated_at) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default Users;
