// workforge-frontend/src/pages/admin/Verifications/Verifications.tsx
import React from 'react';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { AdminVerifications } from './VerificationQueue';

const Verifications: React.FC = () => {
  return (
    <AdminLayout>
      <AdminVerifications />
    </AdminLayout>
  );
};

export default Verifications;
