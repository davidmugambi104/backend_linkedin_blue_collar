import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowPathIcon, 
  DocumentArrowDownIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Table, Column } from '@components/ui/Table';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Payment, PaymentStatus, PaymentMethod } from '@types';
import { formatCurrency } from '@lib/utils/format';
import { useAuth } from '@context/AuthContext';

const statusColors: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'> = {
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.PROCESSING]: 'info',
  [PaymentStatus.PAID]: 'success',
  [PaymentStatus.FAILED]: 'error',
  [PaymentStatus.REFUNDED]: 'default',
  [PaymentStatus.CANCELLED]: 'default',
  [PaymentStatus.ESCROW]: 'purple',
  [PaymentStatus.RELEASED]: 'success',
  [PaymentStatus.DISPUTED]: 'error',
};

interface PaymentTableProps {
  payments: Payment[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  isLoading,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const columns: Column<Payment>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (payment) => `#${payment.id}`,
      width: '80px',
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (payment) => format(new Date(payment.created_at), 'MMM dd, yyyy'),
    },
    {
      key: 'description',
      header: 'Description',
      accessor: (payment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {payment.job?.title || `Payment #${payment.id}`}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user?.role === 'employer' 
              ? `To: ${payment.worker?.full_name}`
              : `From: ${payment.employer?.company_name}`
            }
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (payment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(payment.amount)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Fee: {formatCurrency(payment.platform_fee)}
          </div>
        </div>
      ),
      align: 'right',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (payment) => (
        <div className="flex items-center space-x-2">
          <Badge variant={statusColors[payment.status]} size="sm">
            {payment.status}
          </Badge>
          {payment.status === PaymentStatus.DISPUTED && (
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          )}
          {payment.status === PaymentStatus.ESCROW && (
            <ShieldCheckIcon className="w-4 h-4 text-purple-500" />
          )}
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      accessor: (payment) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
          {payment.payment_method?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (payment) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/payments/${payment.id}`);
            }}
          >
            View
          </Button>
          {payment.invoice && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
            >
              Invoice
            </Button>
          )}
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          leftIcon={<ArrowPathIcon className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        data={payments}
        loading={isLoading}
        onRowClick={(payment) => navigate(`/payments/${payment.id}`)}
        rowKey="id"
        hoverable
      />

      {!isLoading && payments.length === 0 && (
        <div className="text-center py-12">
          <BanknotesIcon className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No payments yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {user?.role === 'employer' 
              ? 'Complete jobs to make payments to workers'
              : 'Complete jobs to receive payments from employers'
            }
          </p>
        </div>
      )}
    </div>
  );
};