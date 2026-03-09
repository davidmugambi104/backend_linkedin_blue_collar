import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { usePayment } from '@hooks/usePayments';
import { PaymentTimeline } from './components/PaymentTimeline';

export default function PaymentDetail() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const id = paymentId ? parseInt(paymentId, 10) : 0;
  const { data: payment, isLoading, error } = usePayment(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-[#1A1A1A]">Payment Details</h1>
          <p className="mt-2 text-gray-600 ">Transaction ID: {paymentId}</p>
        </div>
        <Card>
          <CardBody>
            <Skeleton className="h-96" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-[#1A1A1A]">Payment Details</h1>
        </div>
        <Card>
          <CardBody>
            <p className="text-center text-red-600">Failed to load payment details</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 text-[#1A1A1A]">Payment Details</h1>
        <p className="mt-2 text-gray-600 ">Transaction ID: {paymentId}</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Payment Timeline</h2>
        </CardHeader>
        <CardBody>
          <PaymentTimeline payment={payment} />
        </CardBody>
      </Card>
    </div>
  );
}
