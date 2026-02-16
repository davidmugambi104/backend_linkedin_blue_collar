import React from 'react';
import { Card } from '@components/ui/Card';
import { useVerificationQueue } from '@hooks/useAdmin';

export const VerificationStats: React.FC = () => {
  const { data: pendingData } = useVerificationQueue({ status: 'pending' });
  const { data: verifiedData } = useVerificationQueue({ status: 'verified' });
  const { data: rejectedData } = useVerificationQueue({ status: 'rejected' });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {pendingData?.total || 0}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
        <p className="text-2xl font-bold text-green-600">
          {verifiedData?.total || 0}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
        <p className="text-2xl font-bold text-red-600">
          {rejectedData?.total || 0}
        </p>
      </Card>
    </div>
  );
};
