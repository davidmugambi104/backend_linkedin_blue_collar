// workforge-frontend/src/pages/admin/Verifications/components/VerificationStats.tsx
import React from 'react';
import { ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { useVerificationQueue } from '@hooks/useAdmin';

export const VerificationStats: React.FC = () => {
  const { data: pendingData } = useVerificationQueue({ status: 'pending' });
  const { data: verifiedData } = useVerificationQueue({ status: 'verified' });
  const { data: rejectedData } = useVerificationQueue({ status: 'rejected' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Pending Verifications"
        value={pendingData?.total || 0}
        icon={ClockIcon}
        trend="neutral"
        change={0}
      />
      <StatCard
        title="Approved Verifications"
        value={verifiedData?.total || 0}
        icon={CheckCircleIcon}
        trend="up"
        change={0}
      />
      <StatCard
        title="Rejected Verifications"
        value={rejectedData?.total || 0}
        icon={ExclamationCircleIcon}
        trend="down"
        change={0}
      />
    </div>
  );
};
