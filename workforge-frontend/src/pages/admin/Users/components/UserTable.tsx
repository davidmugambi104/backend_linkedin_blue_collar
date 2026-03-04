// workforge-frontend/src/pages/admin/Users/components/UserTable.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Table, Column } from '@components/ui/Table';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { UserWithDetails, UserRole } from '@types';
import { cn } from '@lib/utils/cn';
import { useBanUser, useUnbanUser } from '@hooks/useAdmin';
import { BanUserModal } from './BanUserModal';
import { UserActions } from './UserActions';

interface UserTableProps {
  users: UserWithDetails[];
  isLoading?: boolean;
  onUserUpdate: () => void;
}

const roleColors: Record<UserRole, 'default' | 'success' | 'info' | 'purple'> = {
  [UserRole.WORKER]: 'success',
  [UserRole.EMPLOYER]: 'info',
  [UserRole.ADMIN]: 'purple',
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onUserUpdate,
}) => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  const handleBanUser = async (userId: number, data: any) => {
    await banUser.mutateAsync({ userId, data });
    setIsBanModalOpen(false);
    setSelectedUser(null);
    onUserUpdate();
  };

  const handleUnbanUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to unban this user?')) {
      await unbanUser.mutateAsync(userId);
      onUserUpdate();
    }
  };

  const columns: Column<UserWithDetails>[] = [
    {
      key: 'user',
      header: 'User',
      accessor: (user) => (
        <div className="flex items-center space-x-3">
          <Avatar
            src={
              user.role === UserRole.WORKER
                ? user.worker_profile?.profile_picture
                : user.employer_profile?.logo
            }
            name={
              user.role === UserRole.WORKER
                ? user.worker_profile?.full_name
                : user.employer_profile?.company_name
            }
            size="sm"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {user.role === UserRole.WORKER
                ? user.worker_profile?.full_name
                : user.employer_profile?.company_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (user) => (
        <Badge variant={roleColors[user.role]} size="sm">
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user) => (
        <div className="flex items-center space-x-2">
          {user.is_active ? (
            <Badge variant="success" size="sm">
              Active
            </Badge>
          ) : (
            <Badge variant="error" size="sm">
              Inactive
            </Badge>
          )}
          {user.role === UserRole.WORKER && user.worker_profile?.is_verified && (
            <ShieldCheckIcon className="w-4 h-4 text-green-500" />
          )}
          {user.role === UserRole.EMPLOYER && user.employer_profile?.is_verified && (
            <ShieldCheckIcon className="w-4 h-4 text-green-500" />
          )}
          {user.warnings_count > 0 && (
            <div className="flex items-center text-yellow-600">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-xs ml-1">{user.warnings_count}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      accessor: (user) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {user.role === UserRole.WORKER && (
            <>
              <div>{user.worker_profile?.total_jobs_completed || 0} jobs</div>
              <div className="text-xs">
                ★ {user.worker_profile?.average_rating?.toFixed(1) || '0.0'}
              </div>
            </>
          )}
          {user.role === UserRole.EMPLOYER && (
            <>
              <div>{user.employer_profile?.total_jobs_posted || 0} jobs</div>
              <div className="text-xs">
                ${user.employer_profile?.total_spent?.toLocaleString() || 0}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      accessor: (user) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(user.created_at), 'MMM dd, yyyy')}
          <div className="text-xs">
            Last active: {format(new Date(user.last_active), 'MMM dd')}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (user) => (
        <UserActions
          user={user}
          onView={() => navigate(`/admin/users/${user.id}`)}
          onBan={() => {
            setSelectedUser(user);
            setIsBanModalOpen(true);
          }}
          onUnban={() => handleUnbanUser(user.id)}
          onDelete={() => {
            if (window.confirm('Are you sure you want to delete this user?')) {
              // Handle delete
            }
          }}
        />
      ),
      align: 'right',
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        data={users}
        loading={isLoading}
        onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
        rowKey="id"
        hoverable
      />

      <BanUserModal
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={(data) => selectedUser && handleBanUser(selectedUser.id, data)}
        userName={
          selectedUser?.role === UserRole.WORKER
            ? selectedUser?.worker_profile?.full_name || selectedUser?.username
            : selectedUser?.employer_profile?.company_name || selectedUser?.username
        }
      />
    </>
  );
};