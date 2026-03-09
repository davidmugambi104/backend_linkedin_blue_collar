import React from 'react';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { usePayments } from '@hooks/usePayments';
import { PaymentTable } from './components/PaymentTable';

export default function PaymentList() {
  const { data, isLoading, refetch } = usePayments();
  const payments = data?.payments || [];

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 text-[#1A1A1A]">Payments</h1>
        <p className="mt-2 text-gray-600 ">Manage your transactions and payments</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Payment History</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <PaymentTable payments={payments} isLoading={isLoading} onRefresh={handleRefresh} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
