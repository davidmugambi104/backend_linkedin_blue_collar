import React, { useState } from 'react';
import { ArrowUpRightIcon, ArrowDownLeftIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';

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
    {
      id: 1,
      type: 'income',
      amount: 150.00,
      description: 'Plumbing Service',
      user: 'ABC Corp → John Smith',
      date: '2024-01-18',
      status: 'completed',
    },
    {
      id: 2,
      type: 'payout',
      amount: 145.00,
      description: 'Worker Payout',
      user: 'John Smith',
      date: '2024-01-17',
      status: 'completed',
    },
    {
      id: 3,
      type: 'income',
      amount: 200.00,
      description: 'Electrical Service',
      user: 'XYZ Services → Sarah Johnson',
      date: '2024-01-17',
      status: 'completed',
    },
    {
      id: 4,
      type: 'payout',
      amount: 190.00,
      description: 'Worker Payout',
      user: 'Sarah Johnson',
      date: '2024-01-16',
      status: 'pending',
    },
  ]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalPayouts = transactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + t.amount, 0);
  const revenue = totalIncome - totalPayouts;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments & Revenue</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor financial transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Income</p>
          <p className="text-3xl font-bold text-green-600 mb-1">${totalIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">From {transactions.filter(t => t.type === 'income').length} transactions</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Payouts</p>
          <p className="text-3xl font-bold text-orange-600 mb-1">${totalPayouts.toFixed(2)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">To {transactions.filter(t => t.type === 'payout').length} workers</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Platform Revenue</p>
          <p className="text-3xl font-bold text-blue-600 mb-1">${revenue.toFixed(2)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Commission earned</p>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Type</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Amount</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Description</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">User</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Date</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {tx.type === 'income' ? (
                      <ArrowDownLeftIcon className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <ArrowUpRightIcon className="h-5 w-5 text-orange-600 mr-2" />
                    )}
                    <span className="capitalize font-medium text-gray-900 dark:text-white">{tx.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">${tx.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tx.description}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tx.user}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tx.date}</td>
                <td className="px-6 py-4">{statusBadge(tx.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Payments;
