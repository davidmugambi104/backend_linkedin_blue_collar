import React, { useState, useMemo } from 'react';
import { ArrowUpRightIcon, ArrowDownLeftIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { AdminTable } from '@components/admin/tables/AdminTable/AdminTable';
import { StatusBadge } from '@components/admin/common/StatusBadge/StatusBadge';
import type { Column } from '@components/admin/tables/AdminTable/AdminTable.types';
import { formatCurrency } from '@lib/utils/format';

interface Transaction {
  id: number;
  type: 'income' | 'payout';
  amount: number;
  description: string;
  user: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const Payments: React.FC = () => {
  const [transactions] = useState<Transaction[]>([
    { id: 1, type: 'income', amount: 150.00, description: 'Plumbing Service', user: 'ABC Corp → John Smith', date: '2024-01-18', status: 'completed' },
    { id: 2, type: 'payout', amount: 145.00, description: 'Worker Payout', user: 'John Smith', date: '2024-01-17', status: 'completed' },
    { id: 3, type: 'income', amount: 200.00, description: 'Electrical Service', user: 'XYZ Services → Sarah Johnson', date: '2024-01-17', status: 'completed' },
    { id: 4, type: 'payout', amount: 190.00, description: 'Worker Payout', user: 'Sarah Johnson', date: '2024-01-16', status: 'pending' },
  ]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const payouts = transactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: income, totalPayouts: payouts, revenue: income - payouts, pending: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0) };
  }, [transactions]);
  const columns: Column<Transaction>[] = [
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      accessor: (tx) => (
        <div className="flex items-center gap-2">
          {tx.type === 'income' ? <ArrowDownLeftIcon className="w-5 h-5 text-emerald-600" /> : <ArrowUpRightIcon className="w-5 h-5 text-blue-600" />}
          <div><div className="font-medium text-gray-900 dark:text-white">{tx.description}</div><div className="text-sm text-gray-500 dark:text-gray-400">{tx.user}</div></div>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', accessor: (tx) => formatCurrency(tx.amount), sortable: true },
    {
      key: 'status',
      header: 'Status',
      accessor: (tx) => <StatusBadge status={tx.status}>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</StatusBadge>,
    },
    { key: 'date', header: 'Date', accessor: (tx) => tx.date, sortable: true },
  ];
  return (
    <AdminLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments & Revenue</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor financial transactions and payments</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Income" value={formatCurrency(stats.totalIncome)} trend="up" change={12} icon={CurrencyDollarIcon} />
        <StatCard title="Total Payouts" value={formatCurrency(stats.totalPayouts)} trend="down" change={5} icon={CurrencyDollarIcon} />
        <StatCard title="Net Revenue" value={formatCurrency(stats.revenue)} trend="up" change={18} icon={CurrencyDollarIcon} />
        <StatCard title="Pending" value={formatCurrency(stats.pending)} icon={CurrencyDollarIcon} />
      </div>
      <AdminTable columns={columns} data={transactions} sortConfig={sortConfig} onSort={(config) => setSortConfig(config)} emptyState={<div className="text-center py-8 text-gray-500">No transactions found</div>} />
    </AdminLayout>
  );
};
export default Payments;
