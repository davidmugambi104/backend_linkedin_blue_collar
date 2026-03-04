// workforge-frontend/src/pages/admin/Verifications/Verifications.tsx
import React from 'react';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { VerificationQueue } from './VerificationQueue';

const Verifications: React.FC = () => {
  return (
    <AdminLayout>
      <VerificationQueue />
    </AdminLayout>
  );
};

export default Verifications;
